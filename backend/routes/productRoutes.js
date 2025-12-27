const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const SellerProfile = require('../models/SellerProfile');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { requireRole, checkSellerStatus } = require('../middleware/rbac');

/**
 * @route   GET /api/products
 * @desc    Get all products with filters and pagination
 * @access  Public
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const {
            search,
            category,
            minPrice,
            maxPrice,
            page = 1,
            limit = 12,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        // Build query
        const query = { isActive: true };

        // Text search
        if (search) {
            query.$text = { $search: search };
        }

        // Category filter
        if (category && category !== 'All') {
            query.category = category;
        }

        // Price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Hide products from blocked sellers
        const blockedSellers = await SellerProfile.find({ approvalStatus: 'blocked' });
        const blockedSellerIds = blockedSellers.map(s => s.userId);
        if (blockedSellerIds.length > 0) {
            query.sellerId = { $nin: blockedSellerIds };
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = order === 'asc' ? 1 : -1;

        // Execute query
        const products = await Product.find(query)
            .populate('sellerId', 'email')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count
        const total = await Product.countDocuments(query);

        // Populate seller names
        const productsWithSellers = await Promise.all(
            products.map(async (product) => {
                const sellerProfile = await SellerProfile.findOne({ userId: product.sellerId._id });
                return {
                    ...product,
                    sellerName: sellerProfile?.storeName || 'Unknown Seller'
                };
            })
        );

        res.json({
            success: true,
            data: {
                products: productsWithSellers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalProducts: total,
                    limit: parseInt(limit)
                }
            }
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
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('sellerId', 'email');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Get seller profile
        const sellerProfile = await SellerProfile.findOne({ userId: product.sellerId._id });

        res.json({
            success: true,
            data: {
                product: {
                    ...product.toObject(),
                    sellerName: sellerProfile?.storeName || 'Unknown Seller',
                    sellerProfile: sellerProfile
                }
            }
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/products/:id/related
 * @desc    Get related products (same category or seller)
 * @access  Public
 */
router.get('/:id/related', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Find related products (same category or same seller, excluding current product)
        const relatedProducts = await Product.find({
            _id: { $ne: product._id },
            isActive: true,
            $or: [
                { category: product.category },
                { sellerId: product.sellerId }
            ]
        })
            .limit(6)
            .populate('sellerId', 'email')
            .lean();

        // Populate seller names
        const productsWithSellers = await Promise.all(
            relatedProducts.map(async (prod) => {
                const sellerProfile = await SellerProfile.findOne({ userId: prod.sellerId._id });
                return {
                    ...prod,
                    sellerName: sellerProfile?.storeName || 'Unknown Seller'
                };
            })
        );

        res.json({
            success: true,
            data: {
                relatedProducts: productsWithSellers
            }
        });
    } catch (error) {
        console.error('Get related products error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching related products',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/products
 * @desc    Create new product (Seller only)
 * @access  Private (Seller/Admin)
 */
router.post('/', authenticateToken, requireRole(['seller', 'admin']), checkSellerStatus, async (req, res) => {
    try {
        const { name, description, price, stock, category, imageUrl } = req.body;

        const product = new Product({
            name,
            description,
            price,
            stock,
            category,
            imageUrl,
            sellerId: req.user.userId
        });

        await product.save();

        // Update seller's total products count
        if (req.sellerProfile) {
            await SellerProfile.findByIdAndUpdate(req.sellerProfile._id, {
                $inc: { totalProducts: 1 }
            });
        }

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: { product }
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update product (Seller can only update their own products)
 * @access  Private (Seller/Admin)
 */
router.put('/:id', authenticateToken, requireRole(['seller', 'admin']), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if seller is updating their own product
        if (req.user.role === 'seller' && product.sellerId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own products'
            });
        }

        const { name, description, price, stock, category, imageUrl, isActive } = req.body;

        // Update fields
        if (name) product.name = name;
        if (description) product.description = description;
        if (price !== undefined) product.price = price;
        if (stock !== undefined) product.stock = stock;
        if (category) product.category = category;
        if (imageUrl) product.imageUrl = imageUrl;
        if (isActive !== undefined) product.isActive = isActive;

        await product.save();

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: { product }
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product (Seller can only delete their own products)
 * @access  Private (Seller/Admin)
 */
router.delete('/:id', authenticateToken, requireRole(['seller', 'admin']), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if seller is deleting their own product
        if (req.user.role === 'seller' && product.sellerId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own products'
            });
        }

        await Product.findByIdAndDelete(req.params.id);

        // Update seller's total products count
        const sellerProfile = await SellerProfile.findOne({ userId: product.sellerId });
        if (sellerProfile && sellerProfile.totalProducts > 0) {
            await SellerProfile.findByIdAndUpdate(sellerProfile._id, {
                $inc: { totalProducts: -1 }
            });
        }

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
 * @route   GET /api/products/seller/my-products
 * @desc    Get seller's own products
 * @access  Private (Seller)
 */
router.get('/seller/my-products', authenticateToken, requireRole('seller'), async (req, res) => {
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

module.exports = router;
