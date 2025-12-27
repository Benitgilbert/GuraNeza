const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

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
            data: { users }
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
            data: { sellers }
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
                stats: {
                    totalUsers,
                    totalSellers,
                    totalProducts,
                    totalOrders,
                    totalRevenue,
                    pendingSellers
                },
                recentOrders
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

module.exports = router;
