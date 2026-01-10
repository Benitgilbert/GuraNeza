const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const SellerRequest = require('../models/SellerRequest');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const { sendOrderDeliveredEmail } = require('../utils/emailService');

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Private (Admin)
 */
router.get('/users', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password -otp').sort({ createdAt: -1 });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Block/Unblock user
 * @access  Private (Admin)
 */
router.patch('/users/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { status } = req.body;

        if (!['active', 'blocked'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be either active or blocked'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from blocking themselves
        if (user._id.toString() === req.user.userId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot block yourself'
            });
        }

        user.status = status;
        await user.save();

        res.json({
            success: true,
            message: `User ${status === 'blocked' ? 'blocked' : 'activated'} successfully`,
            data: { user }
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user status',
            error: error.message
        });
    }
});

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Change user role
 * @access  Private (Admin)
 */
router.patch('/users/:id/role', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { role } = req.body;

        if (!['customer', 'seller', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from changing their own role
        if (user._id.toString() === req.user.userId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own role'
            });
        }

        const oldRole = user.role;
        user.role = role;
        await user.save();

        // If upgrading to seller, check if seller profile exists
        if (role === 'seller' && oldRole !== 'seller') {
            const existingProfile = await SellerProfile.findOne({ userId: user._id });

            if (!existingProfile) {
                // You might want to require admin to create seller profile separately
                // or create a basic one here
                return res.json({
                    success: true,
                    message: 'User role updated. Please create seller profile.',
                    data: { user }
                });
            }
        }

        res.json({
            success: true,
            message: 'User role updated successfully',
            data: { user }
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user role',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/admin/sellers
 * @desc    Get all seller profiles
 * @access  Private (Admin)
 */
router.get('/sellers', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const sellers = await SellerProfile.find()
            .populate('userId', 'email status')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: sellers
        });
    } catch (error) {
        console.error('Get sellers error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sellers',
            error: error.message
        });
    }
});

/**
 * @route   PATCH /api/admin/sellers/:id/status
 * @desc    Approve/Block seller
 * @access  Private (Admin)
 */
router.patch('/sellers/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { approvalStatus } = req.body;

        if (!['pending', 'active', 'blocked'].includes(approvalStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be pending, active, or blocked'
            });
        }

        const seller = await SellerProfile.findById(req.params.id);

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller profile not found'
            });
        }

        seller.approvalStatus = approvalStatus;
        await seller.save();

        // If blocking seller, deactivate all their products
        if (approvalStatus === 'blocked') {
            await Product.updateMany(
                { sellerId: seller.userId },
                { isActive: false }
            );
        }

        res.json({
            success: true,
            message: `Seller ${approvalStatus} successfully`,
            data: { seller }
        });
    } catch (error) {
        console.error('Update seller status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating seller status',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin)
 */
router.get('/stats', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const [
            totalUsers,
            totalSellers,
            totalProducts,
            totalOrders,
            pendingSellers,
            recentOrders
        ] = await Promise.all([
            User.countDocuments(),
            SellerProfile.countDocuments({ approvalStatus: 'active' }),
            Product.countDocuments({ isActive: true }),
            Order.countDocuments(),
            SellerProfile.countDocuments({ approvalStatus: 'pending' }),
            Order.find().sort({ createdAt: -1 }).limit(5).populate('customerId', 'email')
        ]);

        // Calculate total revenue
        const orders = await Order.find({ paymentStatus: 'PAID' });
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalSellers,
                totalProducts,
                totalOrders,
                revenue: totalRevenue,
                pendingSellers
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/admin/products
 * @desc    Get all products from all sellers
 * @access  Private (Admin)
 */
router.get('/products', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const products = await Product.find()
            .populate('sellerId', 'storeName email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Delete any product
 * @access  Private (Admin)
 */
router.delete('/products/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
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
 * @route   GET /api/admin/orders
 * @desc    Get all orders
 * @access  Private (Admin)
 */
router.get('/orders', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 0;

        let query = Order.find()
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
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/admin/orders/:id
 * @desc    Get single order details
 * @access  Private (Admin)
 */
router.get('/orders/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customerId', 'email name')
            .populate({
                path: 'items.productId',
                select: 'name price imageUrl'
            })
            .populate({
                path: 'items.sellerId',
                select: 'storeName email'
            });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching order details',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/admin/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin)
 */
router.put('/orders/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { status } = req.body;

        if (!['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const order = await Order.findById(req.params.id).populate('customerId', 'email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const oldStatus = order.orderStatus;
        order.orderStatus = status;

        // Update payment status if order is marked as PAID
        if (status === 'PAID' && order.paymentStatus !== 'PAID') {
            order.paymentStatus = 'PAID';
        }

        // Auto-sync shipping status with order status
        if (status === 'SHIPPED' || status === 'DELIVERED') {
            if (status === 'SHIPPED' && order.shipping.status === 'NOT_SHIPPED') {
                order.shipping.status = 'SHIPPED';
            } else if (status === 'DELIVERED') {
                order.shipping.status = 'DELIVERED';
            }
        }

        await order.save();

        // Send delivery email notification if status changed to DELIVERED
        if (status === 'DELIVERED' && oldStatus !== 'DELIVERED') {
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
            message: 'Order status updated successfully',
            data: order
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

/**
 * @route   GET /api/admin/seller-requests
 * @desc    Get all seller upgrade requests
 * @access  Private (Admin)
 */
router.get('/seller-requests', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { status } = req.query;

        const query = {};
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            query.status = status;
        }

        const requests = await SellerRequest.find(query)
            .populate('userId', 'email name')
            .populate('processedBy', 'email name')
            .sort({ createdAt: -1 });

        // Count by status
        const stats = {
            pending: await SellerRequest.countDocuments({ status: 'pending' }),
            approved: await SellerRequest.countDocuments({ status: 'approved' }),
            rejected: await SellerRequest.countDocuments({ status: 'rejected' })
        };

        res.json({
            success: true,
            data: requests,
            stats
        });
    } catch (error) {
        console.error('Get seller requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching seller requests',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/admin/seller-requests/:id/approve
 * @desc    Approve seller upgrade request
 * @access  Private (Admin)
 */
router.put('/seller-requests/:id/approve', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const sellerRequest = await SellerRequest.findById(id);

        if (!sellerRequest) {
            return res.status(404).json({
                success: false,
                message: 'Seller request not found'
            });
        }

        if (sellerRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Request has already been ${sellerRequest.status}`
            });
        }

        // Update user role to seller
        const user = await User.findById(sellerRequest.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.role = 'seller';
        await user.save();

        // Create seller profile
        const sellerProfile = new SellerProfile({
            userId: sellerRequest.userId,
            storeName: sellerRequest.storeName,
            storeDescription: sellerRequest.storeDescription,
            phone: sellerRequest.phone,
            logoUrl: sellerRequest.logoUrl,
            status: 'active'
        });
        await sellerProfile.save();

        // Update request status
        sellerRequest.status = 'approved';
        sellerRequest.processedAt = new Date();
        sellerRequest.processedBy = req.user.userId;
        await sellerRequest.save();

        res.json({
            success: true,
            message: 'Seller request approved successfully',
            data: {
                request: sellerRequest,
                sellerProfile
            }
        });
    } catch (error) {
        console.error('Approve seller request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving seller request',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/admin/seller-requests/:id/reject
 * @desc    Reject seller upgrade request
 * @access  Private (Admin)
 */
router.put('/seller-requests/:id/reject', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        const sellerRequest = await SellerRequest.findById(id);

        if (!sellerRequest) {
            return res.status(404).json({
                success: false,
                message: 'Seller request not found'
            });
        }

        if (sellerRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Request has already been ${sellerRequest.status}`
            });
        }

        // Update request status
        sellerRequest.status = 'rejected';
        sellerRequest.rejectionReason = rejectionReason || 'No reason provided';
        sellerRequest.processedAt = new Date();
        sellerRequest.processedBy = req.user.userId;
        await sellerRequest.save();

        res.json({
            success: true,
            message: 'Seller request rejected',
            data: sellerRequest
        });
    } catch (error) {
        console.error('Reject seller request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting seller request',
            error: error.message
        });
    }
});

module.exports = router;
