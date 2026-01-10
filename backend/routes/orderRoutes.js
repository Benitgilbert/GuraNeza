const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const SellerProfile = require('../models/SellerProfile');
const ShippingSetting = require('../models/ShippingSetting');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { sendOrderConfirmationEmail, sendOrderDeliveredEmail } = require('../utils/emailService');

/**
 * Calculate shipping fee based on city (from database)
 */
const calculateShippingFee = async (city) => {
    try {
        // Try to find rate for specific city
        let setting = await ShippingSetting.findOne({
            city: new RegExp(`^${city}$`, 'i'),
            isActive: true
        });

        // If not found, get default rate
        if (!setting) {
            setting = await ShippingSetting.findOne({ isDefault: true, isActive: true });
        }

        // Return fee or fallback to 5000
        return setting ? setting.fee : 5000;
    } catch (error) {
        console.error('Error fetching shipping fee:', error);
        return 5000; // Fallback
    }
};

/**
 * @route   POST /api/orders
 * @desc    Create order from cart
 * @access  Private (Customer)
 */
router.post('/', authenticateToken, requireRole('customer'), async (req, res) => {
    try {
        const { shippingInfo, paymentMethod } = req.body;

        // Validate shipping info
        if (!shippingInfo || !shippingInfo.fullName || !shippingInfo.phone ||
            !shippingInfo.city || !shippingInfo.addressLine) {
            return res.status(400).json({
                success: false,
                message: 'Complete shipping information is required'
            });
        }

        // Get user's cart
        const cart = await Cart.findOne({ userId: req.user.userId }).populate('items.productId');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Verify stock availability and prepare order items
        const orderItems = [];

        for (const item of cart.items) {
            const product = await Product.findById(item.productId._id);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product ${item.productId.name} not found`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Only ${product.stock} available`
                });
            }

            orderItems.push({
                productId: product._id,
                sellerId: product.sellerId,
                productName: product.name,
                quantity: item.quantity,
                priceAtPurchase: product.price
            });

            // Reduce stock
            product.stock -= item.quantity;
            await product.save();
        }

        // Calculate totals
        const subtotal = cart.calculateSubtotal();
        const shippingFee = await calculateShippingFee(shippingInfo.city);
        const totalPrice = subtotal + shippingFee;

        // Create order
        const order = new Order({
            customerId: req.user.userId,
            items: orderItems,
            subtotal,
            shippingFee,
            totalPrice,
            paymentMethod: paymentMethod || 'MoMo', // Default to MoMo if not specified
            paymentStatus: 'PENDING',
            orderStatus: 'PENDING',
            shipping: {
                fullName: shippingInfo.fullName,
                phone: shippingInfo.phone,
                city: shippingInfo.city,
                addressLine: shippingInfo.addressLine,
                status: 'NOT_SHIPPED'
            }
        });

        await order.save();

        // Clear cart
        cart.items = [];
        await cart.save();

        // Handle Automatic Payment Confirmation for Sandbox/Testing
        // Mocking the behavior where payment is initiated and then confirmed after a few seconds
        setTimeout(async () => {
            try {
                const orderToUpdate = await Order.findById(order._id);
                if (orderToUpdate) {
                    orderToUpdate.paymentStatus = 'PAID';
                    orderToUpdate.orderStatus = 'PAID';
                    orderToUpdate.paymentDetails = {
                        paymentDate: new Date(),
                        paymentInfo: {
                            status: 'SUCCESSFUL',
                            provider: orderToUpdate.paymentMethod,
                            mode: 'SANDBOX_AUTO_CONFIRM'
                        }
                    };
                    await orderToUpdate.save();
                    console.log(`✅ Order ${order._id} automatically confirmed as PAID (Sandbox)`);

                    // Send confirmation email AFTER payment is confirmed
                    const user = await require('../models/User').findById(req.user.userId);
                    if (user) {
                        await sendOrderConfirmationEmail(user.email, {
                            orderId: orderToUpdate._id,
                            totalPrice: orderToUpdate.totalPrice,
                            subtotal: orderToUpdate.subtotal,
                            shippingFee: orderToUpdate.shippingFee,
                            paymentMethod: orderToUpdate.paymentMethod,
                            items: orderToUpdate.items
                        });
                    }
                }
            } catch (error) {
                console.error('Error in delayed payment confirmation:', error);
            }
        }, 5000); // 5 second delay

        res.status(201).json({
            success: true,
            message: 'Order initiated. Payment will be confirmed shortly.',
            data: { order }
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/orders/my-orders
 * @desc    Get customer's orders
 * @access  Private (Customer)
 */
router.get('/my-orders', authenticateToken, requireRole('customer'), async (req, res) => {
    try {
        const orders = await Order.find({ customerId: req.user.userId })
            .sort({ createdAt: -1 })
            .populate('items.productId', 'name imageUrl');

        res.json({
            success: true,
            data: { orders }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order details
 * @access  Private (Customer/Seller/Admin)
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customerId', 'email')
            .populate('items.productId', 'name imageUrl');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check access permissions
        const isCustomer = req.user.userId.toString() === order.customerId._id.toString();
        const isAdmin = req.user.role === 'admin';
        const isSeller = req.user.role === 'seller' &&
            order.items.some(item => item.sellerId.toString() === req.user.userId.toString());

        if (!isCustomer && !isAdmin && !isSeller) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // If seller, filter to show only their items
        let orderData = order.toObject();
        if (req.user.role === 'seller' && !isAdmin) {
            orderData.items = orderData.items.filter(
                item => item.sellerId.toString() === req.user.userId.toString()
            );
        }

        res.json({
            success: true,
            data: { order: orderData }
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/orders/seller/my-sales
 * @desc    Get seller's orders (orders containing their products)
 * @access  Private (Seller)
 */
router.get('/seller/my-sales', authenticateToken, requireRole('seller'), async (req, res) => {
    try {
        const orders = await Order.find({ 'items.sellerId': req.user.userId })
            .sort({ createdAt: -1 })
            .populate('customerId', 'email')
            .populate('items.productId', 'name imageUrl');

        // Filter items to show only seller's products
        const filteredOrders = orders.map(order => {
            const orderObj = order.toObject();
            orderObj.items = orderObj.items.filter(
                item => item.sellerId.toString() === req.user.userId.toString()
            );
            return orderObj;
        });

        res.json({
            success: true,
            data: { orders: filteredOrders }
        });
    } catch (error) {
        console.error('Get seller orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/orders
 * @desc    Get all orders (Admin only)
 * @access  Private (Admin)
 */
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('customerId', 'email')
            .populate('items.productId', 'name imageUrl');

        res.json({
            success: true,
            data: { orders }
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
});

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status (Admin only)
 * @access  Private (Admin)
 */
router.patch('/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { orderStatus, shippingStatus } = req.body;

        const order = await Order.findById(req.params.id).populate('customerId', 'email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const oldOrderStatus = order.orderStatus;

        if (orderStatus) {
            order.orderStatus = orderStatus;
        }

        if (shippingStatus) {
            order.shipping.status = shippingStatus;
        }

        await order.save();

        // If order status changed to DELIVERED, send delivery email
        if (orderStatus === 'DELIVERED' && oldOrderStatus !== 'DELIVERED') {
            try {
                await sendOrderDeliveredEmail(order.customerId.email, {
                    orderId: order._id,
                    shippingInfo: order.shipping
                });
                console.log(`✅ Delivery email sent to ${order.customerId.email} for order ${order._id}`);
            } catch (emailErr) {
                console.error('❌ Error sending delivery email:', emailErr);
            }
        }

        res.json({
            success: true,
            message: 'Order status updated',
            data: { order }
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        });
    }
});

module.exports = router;
