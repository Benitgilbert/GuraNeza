const express = require('express');
const router = express.Router();
const SellerProfile = require('../models/SellerProfile');
const SellerRequest = require('../models/SellerRequest');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

/**
 * @route   GET /api/seller/profile
 * @desc    Get seller profile
 * @access  Private (Seller)
 */
router.get('/profile', authenticateToken, requireRole('seller'), async (req, res) => {
    try {
        const sellerProfile = await SellerProfile.findOne({ userId: req.user.userId });

        if (!sellerProfile) {
            return res.status(404).json({
                success: false,
                message: 'Seller profile not found. Please complete your seller registration.'
            });
        }

        res.json({
            success: true,
            data: sellerProfile
        });
    } catch (error) {
        console.error('Get seller profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching seller profile',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/seller/profile
 * @desc    Update seller profile
 * @access  Private (Seller)
 */
router.put('/profile', authenticateToken, requireRole('seller'), async (req, res) => {
    try {
        const { storeName, description, phone, logoUrl } = req.body;

        let sellerProfile = await SellerProfile.findOne({ userId: req.user.userId });

        if (!sellerProfile) {
            return res.status(404).json({
                success: false,
                message: 'Seller profile not found'
            });
        }

        if (storeName) sellerProfile.storeName = storeName;
        if (description !== undefined) sellerProfile.description = description;
        if (phone) sellerProfile.phone = phone;
        if (logoUrl !== undefined) sellerProfile.logoUrl = logoUrl;

        await sellerProfile.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: sellerProfile
        });
    } catch (error) {
        console.error('Update seller profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/seller/products
 * @desc    Get seller's products
 * @access  Private (Seller)
 */
router.get('/products', authenticateToken, requireRole('seller'), async (req, res) => {
    try {
        const products = await Product.find({ sellerId: req.user.userId }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Get seller products error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/seller/stats
 * @desc    Get seller statistics
 * @access  Private (Seller)
 */
router.get('/stats', authenticateToken, requireRole('seller'), async (req, res) => {
    try {
        const [
            totalProducts,
            activeProducts,
            totalOrders,
            deliveredOrders
        ] = await Promise.all([
            Product.countDocuments({ sellerId: req.user.userId }),
            Product.countDocuments({ sellerId: req.user.userId, isActive: true }),
            Order.countDocuments({ 'items.sellerId': req.user.userId }),
            Order.countDocuments({
                'items.sellerId': req.user.userId,
                orderStatus: 'DELIVERED'
            })
        ]);

        // Calculate total revenue from delivered orders
        const orders = await Order.find({
            'items.sellerId': req.user.userId,
            paymentStatus: 'PAID'
        });

        let totalRevenue = 0;
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.sellerId.toString() === req.user.userId.toString()) {
                    totalRevenue += item.priceAtPurchase * item.quantity;
                }
            });
        });

        res.json({
            success: true,
            data: {
                totalProducts,
                totalOrders,
                pendingOrders: 0,
                revenue: totalRevenue
            }
        });
    } catch (error) {
        console.error('Get seller stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/seller/orders
 * @desc    Get orders containing seller's products
 * @access  Private (Seller)
 */
router.get('/orders', authenticateToken, requireRole('seller'), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 0;

        // Find orders that contain at least one item from this seller
        let query = Order.find({ 'items.sellerId': req.user.userId })
            .populate('customerId', 'email')
            .populate('items.productId', 'name price')
            .sort({ createdAt: -1 });

        if (limit > 0) {
            query = query.limit(limit);
        }

        const orders = await query;

        res.json({
            success: true,
            data: orders
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
 * @route   PATCH /api/seller/orders/:orderId/shipping-status
 * @desc    Update shipping status for seller's order
 * @access  Private (Seller)
 */
router.patch('/orders/:orderId/shipping-status', authenticateToken, requireRole('seller'), async (req, res) => {
    try {
        const { orderId } = req.params;
        const { shippingStatus } = req.body;

        // Validate shipping status
        const validStatuses = ['NOT_SHIPPED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'];
        if (!validStatuses.includes(shippingStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid shipping status'
            });
        }

        // Find order that contains seller's products
        const order = await Order.findOne({
            _id: orderId,
            'items.sellerId': req.user.userId
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or does not contain your products'
            });
        }

        // Update shipping status
        order.shipping.status = shippingStatus;

        // Auto-update order status based on shipping status
        if (shippingStatus === 'DELIVERED' && order.paymentStatus === 'PAID') {
            order.orderStatus = 'DELIVERED';
        } else if (shippingStatus === 'SHIPPED' || shippingStatus === 'IN_TRANSIT') {
            if (order.orderStatus === 'PENDING' || order.orderStatus === 'PAID') {
                order.orderStatus = 'SHIPPED';
            }
        }

        await order.save();

        // Populate and return updated order
        await order.populate('customerId', 'email');
        await order.populate('items.productId', 'name price');

        res.json({
            success: true,
            message: 'Shipping status updated successfully',
            data: { order }
        });
    } catch (error) {
        console.error('Update shipping status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating shipping status',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/seller/products/:id
 * @desc    Delete seller's own product
 * @access  Private (Seller)
 */
router.delete('/products/:id', authenticateToken, requireRole('seller'), async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            sellerId: req.user.userId
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or you do not have permission to delete it'
            });
        }

        await product.deleteOne();

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/seller/request-upgrade
 * @desc    Customer requests to become a seller
 * @access  Private (Customer)
 */
router.post('/request-upgrade', authenticateToken, async (req, res) => {
    try {
        const { storeName, storeDescription, phone, logoUrl } = req.body;

        // Check if user is already a seller
        if (req.user.role === 'seller') {
            return res.status(400).json({
                success: false,
                message: 'You are already a seller'
            });
        }

        // Check for existing pending request
        const existingRequest = await SellerRequest.findOne({
            userId: req.user.userId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending seller request'
            });
        }

        // Create new seller request
        const sellerRequest = new SellerRequest({
            userId: req.user.userId,
            storeName,
            storeDescription,
            phone,
            logoUrl: logoUrl || ''
        });

        await sellerRequest.save();

        res.status(201).json({
            success: true,
            message: 'Seller upgrade request submitted successfully. Please wait for admin approval.',
            data: sellerRequest
        });
    } catch (error) {
        console.error('Request seller upgrade error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting seller request',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/seller/my-request
 * @desc    Get customer's seller upgrade request status
 * @access  Private
 */
router.get('/my-request', authenticateToken, async (req, res) => {
    try {
        const sellerRequest = await SellerRequest.findOne({
            userId: req.user.userId
        }).sort({ createdAt: -1 });

        if (!sellerRequest) {
            return res.json({
                success: true,
                data: null,
                message: 'No seller request found'
            });
        }

        res.json({
            success: true,
            data: sellerRequest
        });
    } catch (error) {
        console.error('Get seller request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching seller request',
            error: error.message
        });
    }
});

module.exports = router;
