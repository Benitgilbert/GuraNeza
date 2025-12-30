const mongoose = require('mongoose');

const shippingSettingSchema = new mongoose.Schema({
    city: {
        type: String,
        required: [true, 'City name is required'],
        unique: true,
        trim: true
    },
    fee: {
        type: Number,
        required: [true, 'Shipping fee is required'],
        min: [0, 'Shipping fee cannot be negative']
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Ensure only one default shipping rate
shippingSettingSchema.pre('save', async function (next) {
    if (this.isDefault) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
    next();
});

module.exports = mongoose.model('ShippingSetting', shippingSettingSchema);
