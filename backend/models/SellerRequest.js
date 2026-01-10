const mongoose = require('mongoose');

const sellerRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    storeName: {
        type: String,
        required: [true, 'Store name is required'],
        trim: true,
        minlength: [3, 'Store name must be at least 3 characters'],
        maxlength: [100, 'Store name cannot exceed 100 characters']
    },
    storeDescription: {
        type: String,
        required: [true, 'Store description is required'],
        trim: true,
        minlength: [10, 'Store description must be at least 10 characters'],
        maxlength: [500, 'Store description cannot exceed 500 characters']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number']
    },
    logoUrl: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    processedAt: {
        type: Date
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Prevent duplicate pending requests for same user
sellerRequestSchema.index({ userId: 1, status: 1 }, {
    unique: true,
    partialFilterExpression: { status: 'pending' }
});

const SellerRequest = mongoose.model('SellerRequest', sellerRequestSchema);

module.exports = SellerRequest;
