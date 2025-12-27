const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        minlength: [3, 'Product name must be at least 3 characters'],
        maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    stock: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'Electronics',
            'Fashion',
            'Home & Garden',
            'Sports & Outdoors',
            'Books',
            'Toys & Games',
            'Beauty & Health',
            'Food & Beverages',
            'Automotive',
            'Other'
        ]
    },
    imageUrl: {
        type: String,
        required: [true, 'Product image is required']
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Seller ID is required']
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for better query performance
productSchema.index({ sellerId: 1 });
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text' }); // Text search
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });

module.exports = mongoose.model('Product', productSchema);
