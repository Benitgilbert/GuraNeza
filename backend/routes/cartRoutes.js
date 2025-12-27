const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private (Customer)
 */
router.get('/', authenticateToken, requireRole('customer'), async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.user.userId }).populate('items.productId', 'name price imageUrl stock');

        if (!cart) {
            // Create empty cart if doesn't exist
            cart = new Cart({
                userId: req.user.userId,
                items: []
            });
            await cart.save();
        }

        const subtotal = cart.calculateSubtotal();

        res.json({
            success: true,
            data: {
                cart,
                subtotal
            }
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/cart/add
 * @desc    Add item to cart
 * @access  Private (Customer)
 */
router.post('/add', authenticateToken, requireRole('customer'), async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        // Check if product exists and has stock
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (!product.isActive) {
            return res.status(400).json({
                success: false,
                message: 'This product is not available'
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} items available in stock`
            });
        }

        // Get or create cart
        let cart = await Cart.findOne({ userId: req.user.userId });

        if (!cart) {
            cart = new Cart({
                userId: req.user.userId,
                items: []
            });
        }

        // Check if product already in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Update quantity
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;

            if (newQuantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot add more. Only ${product.stock} items available`
                });
            }

            cart.items[existingItemIndex].quantity = newQuantity;
            cart.items[existingItemIndex].price = product.price;
        } else {
            // Add new item
            cart.items.push({
                productId: product._id,
                sellerId: product.sellerId,
                quantity,
                price: product.price
            });
        }

        await cart.save();
        await cart.populate('items.productId', 'name price imageUrl stock');

        const subtotal = cart.calculateSubtotal();

        res.json({
            success: true,
            message: 'Product added to cart',
            data: {
                cart,
                subtotal
            }
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding to cart',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/cart/update/:itemId
 * @desc    Update cart item quantity
 * @access  Private (Customer)
 */
router.put('/update/:itemId', authenticateToken, requireRole('customer'), async (req, res) => {
    try {
        const { quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }

        const cart = await Cart.findOne({ userId: req.user.userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const item = cart.items.id(req.params.itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        // Check stock
        const product = await Product.findById(item.productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} items available`
            });
        }

        item.quantity = quantity;
        item.price = product.price; // Update price in case it changed

        await cart.save();
        await cart.populate('items.productId', 'name price imageUrl stock');

        const subtotal = cart.calculateSubtotal();

        res.json({
            success: true,
            message: 'Cart updated',
            data: {
                cart,
                subtotal
            }
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating cart',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/cart/remove/:itemId
 * @desc    Remove item from cart
 * @access  Private (Customer)
 */
router.delete('/remove/:itemId', authenticateToken, requireRole('customer'), async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items.pull(req.params.itemId);
        await cart.save();
        await cart.populate('items.productId', 'name price imageUrl stock');

        const subtotal = cart.calculateSubtotal();

        res.json({
            success: true,
            message: 'Item removed from cart',
            data: {
                cart,
                subtotal
            }
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing item',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear entire cart
 * @access  Private (Customer)
 */
router.delete('/clear', authenticateToken, requireRole('customer'), async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = [];
        await cart.save();

        res.json({
            success: true,
            message: 'Cart cleared',
            data: { cart }
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message
        });
    }
});

module.exports = router;
