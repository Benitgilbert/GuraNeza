const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

/**
 * @desc    Get user's wishlist
 * @route   GET /api/wishlist
 * @access  Private
 */
exports.getWishlist = async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ user: req.user.userId })
            .populate({
                path: 'items.product',
                select: 'name price imageUrl category stock sellerId',
                populate: {
                    path: 'sellerId',
                    select: 'email'
                }
            });

        if (!wishlist) {
            // Create empty wishlist if doesn't exist
            wishlist = new Wishlist({
                user: req.user.userId,
                items: []
            });
            await wishlist.save();
        }

        res.json({
            success: true,
            data: {
                wishlist
            }
        });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching wishlist',
            error: error.message
        });
    }
};

/**
 * @desc    Add product to wishlist
 * @route   POST /api/wishlist/:productId
 * @access  Private
 */
exports.addToWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Find or create wishlist
        let wishlist = await Wishlist.findOne({ user: req.user.userId });

        if (!wishlist) {
            wishlist = new Wishlist({
                user: req.user.userId,
                items: []
            });
        }

        // Check if product already in wishlist
        const existingItem = wishlist.items.find(
            item => item.product.toString() === productId
        );

        if (existingItem) {
            return res.status(400).json({
                success: false,
                message: 'Product already in wishlist'
            });
        }

        // Add product to wishlist
        wishlist.items.push({
            product: productId,
            addedAt: new Date()
        });

        await wishlist.save();

        // Populate the wishlist before sending response
        await wishlist.populate({
            path: 'items.product',
            select: 'name price imageUrl category stock sellerId',
            populate: {
                path: 'sellerId',
                select: 'email'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Product added to wishlist',
            data: {
                wishlist
            }
        });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding product to wishlist',
            error: error.message
        });
    }
};

/**
 * @desc    Remove product from wishlist
 * @route   DELETE /api/wishlist/:productId
 * @access  Private
 */
exports.removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({ user: req.user.userId });

        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: 'Wishlist not found'
            });
        }

        // Remove product from wishlist
        wishlist.items = wishlist.items.filter(
            item => item.product.toString() !== productId
        );

        await wishlist.save();

        // Populate the wishlist before sending response
        await wishlist.populate({
            path: 'items.product',
            select: 'name price imageUrl category stock sellerId',
            populate: {
                path: 'sellerId',
                select: 'email'
            }
        });

        res.json({
            success: true,
            message: 'Product removed from wishlist',
            data: {
                wishlist
            }
        });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing product from wishlist',
            error: error.message
        });
    }
};

/**
 * @desc    Clear entire wishlist
 * @route   DELETE /api/wishlist
 * @access  Private
 */
exports.clearWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user.userId });

        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: 'Wishlist not found'
            });
        }

        wishlist.items = [];
        await wishlist.save();

        res.json({
            success: true,
            message: 'Wishlist cleared',
            data: {
                wishlist
            }
        });
    } catch (error) {
        console.error('Clear wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing wishlist',
            error: error.message
        });
    }
};
