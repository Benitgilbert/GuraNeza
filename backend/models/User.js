const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: function () {
            // Password is required only if not using Google OAuth
            return !this.googleId;
        },
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false // Don't return password in queries by default
    },
    role: {
        type: String,
        enum: ['customer', 'seller', 'admin'],
        default: 'customer'
    },
    status: {
        type: String,
        enum: ['active', 'blocked'],
        default: 'active'
    },
    isVerified: {
        type: Boolean,
        default: false // Users must verify email via OTP
    },
    googleId: {
        type: String,
        sparse: true, // Allows multiple null values
        unique: true
    },
    // Profile fields
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number']
    },
    avatar: {
        type: String, // URL to avatar image
        default: null
    },
    dateOfBirth: {
        type: Date
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        country: { type: String, default: 'Rwanda', immutable: true }
    },
    otp: {
        type: {
            code: {
                type: String
            },
            expires: {
                type: Date
            }
        },
        select: false, // Hide entire OTP object by default
        default: undefined
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

// Hash password before saving
userSchema.pre('save', async function (next) {
    // Only hash if password is modified or new
    if (!this.isModified('password') || !this.password) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) {
        return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate OTP
userSchema.methods.generateOTP = function () {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP with 10 minutes expiry
    this.otp = {
        code: otp,
        expires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };

    return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function (candidateOTP) {
    if (!this.otp || !this.otp.code || !this.otp.expires) {
        return false;
    }

    // Check if OTP has expired
    if (new Date() > this.otp.expires) {
        return false;
    }

    // Check if OTP matches
    return this.otp.code === candidateOTP;
};

// Method to clear OTP after use
userSchema.methods.clearOTP = function () {
    this.otp = {
        code: undefined,
        expires: undefined
    };
};

module.exports = mongoose.model('User', userSchema);
