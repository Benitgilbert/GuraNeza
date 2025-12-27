const express = require('express');
const router = express.Router();
const SellerProfile = require('../models/SellerProfile');
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
            data: { sellerProfile }
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
            data: { sellerProfile }
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
            data: { products }
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
                stats: {
                    totalProducts,
                    activeProducts,
                    totalOrders,
                    deliveredOrders,
                    totalRevenue
                }
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

module.exports = router;
