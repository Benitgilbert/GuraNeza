const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

/**
 * @route   GET /api/reviews/product/:productId
 * @desc    Get all reviews for a product
 * @access  Public
 */
router.get('/product/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId })
            .populate('userId', 'email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: { reviews }
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews',
            error: error.message
        });
    }
});

/**
 * Check if user has purchased and received the product
 */
const hasUserPurchasedProduct = async (userId, productId) => {
    const orders = await Order.find({
        customerId: userId,
        orderStatus: 'DELIVERED',
        'items.productId': productId
    });

    return orders.length > 0;
};

/**
 * Update product average rating
 */
const updateProductRating = async (productId) => {
    const reviews = await Review.find({ productId });

    if (reviews.length === 0) {
        await Product.findByIdAndUpdate(productId, {
            averageRating: 0,
            totalReviews: 0
        });
        return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Product.findByIdAndUpdate(productId, {
        averageRating: averageRating.toFixed(1),
        totalReviews: reviews.length
    });
};

/**
 * @route   POST /api/reviews
 * @desc    Add a review (only if user purchased the product)
 * @access  Private (Customer)
 */
router.post('/', authenticateToken, requireRole('customer'), async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;

        // Validate product exists
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user has purchased this product (DELIVERED status)
        const hasPurchased = await hasUserPurchasedProduct(req.user.userId, productId);

        if (!hasPurchased) {
            return res.status(403).json({
                success: false,
                message: 'You can only review products you have purchased and received'
            });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
            productId,
            userId: req.user.userId
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product. You can edit your existing review.'
            });
        }

        // Create review
        const review = new Review({
            productId,
            userId: req.user.userId,
            rating,
            comment
        });

        await review.save();

        // Update product average rating
        await updateProductRating(productId);

        await review.populate('userId', 'email');

        res.status(201).json({
            success: true,
            message: 'Review added successfully',
            data: { review }
        });
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding review',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update own review
 * @access  Private (Customer)
 */
router.put('/:id', authenticateToken, requireRole('customer'), async (req, res) => {
    try {
        const { rating, comment } = req.body;

        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if review belongs to user
        if (review.userId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own reviews'
            });
        }

        if (rating !== undefined) review.rating = rating;
        if (comment !== undefined) review.comment = comment;

        await review.save();

        // Update product average rating
        await updateProductRating(review.productId);

        await review.populate('userId', 'email');

        res.json({
            success: true,
            message: 'Review updated successfully',
            data: { review }
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating review',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete review (Own review or Admin)
 * @access  Private (Customer/Admin)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user owns the review or is admin
        const isOwner = review.userId.toString() === req.user.userId.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own reviews'
            });
        }

        const productId = review.productId;
        await Review.findByIdAndDelete(req.params.id);

        // Update product average rating
        await updateProductRating(productId);

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting review',
            error: error.message
        });
    }
});

module.exports = router;
