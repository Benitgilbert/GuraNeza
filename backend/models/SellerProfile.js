const mongoose = require('mongoose');

const sellerProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    storeName: {
        type: String,
        required: [true, 'Store name is required'],
        trim: true,
        minlength: [3, 'Store name must be at least 3 characters'],
        maxlength: [100, 'Store name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number']
    },
    logoUrl: {
        type: String,
        default: null
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'active', 'blocked'],
        default: 'pending'
    },
    totalProducts: {
        type: Number,
        default: 0
    },
    totalSales: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
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

// Index for faster queries
sellerProfileSchema.index({ userId: 1 });
sellerProfileSchema.index({ approvalStatus: 1 });

module.exports = mongoose.model('SellerProfile', sellerProfileSchema);
