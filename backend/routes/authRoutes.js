const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const { authenticateToken } = require('../middleware/auth');
const { sendOTPEmail } = require('../utils/emailService');

/**
 * Generate JWT Token
 */
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

/**
 * @route   POST /api/auth/signup
 * @desc    Register new user
 * @access  Public
 */
router.post(
    '/signup',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email address')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
        body('role')
            .optional()
            .isIn(['customer', 'seller'])
            .withMessage('Role must be either customer or seller'),
        body('storeName')
            .if(body('role').equals('seller'))
            .notEmpty()
            .withMessage('Store name is required for sellers'),
        body('phone')
            .if(body('role').equals('seller'))
            .matches(/^[0-9]{10,15}$/)
            .withMessage('Please enter a valid phone number')
    ],
    async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const { email, password, role = 'customer', storeName, storeDescription, phone } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Create user
            const user = new User({
                email,
                password,
                role,
                status: 'active',
                isVerified: true
            });

            await user.save();

            // If role is seller, create seller profile
            if (role === 'seller') {
                const sellerProfile = new SellerProfile({
                    userId: user._id,
                    storeName,
                    description: storeDescription || '',
                    phone,
                    approvalStatus: 'pending' // Requires admin approval
                });

                await sellerProfile.save();
            }

            // Generate token
            const token = generateToken(user._id);

            res.status(201).json({
                success: true,
                message: role === 'seller'
                    ? 'Seller account created successfully. Awaiting admin approval.'
                    : 'Account created successfully',
                data: {
                    token,
                    user: {
                        id: user._id,
                        email: user.email,
                        role: user.role,
                        status: user.status
                    }
                }
            });
        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating account',
                error: error.message
            });
        }
    }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
        body('password').notEmpty().withMessage('Password is required')
    ],
    async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;

            // Find user and include password field
            const user = await User.findOne({ email }).select('+password');

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Check if user is blocked
            if (user.status === 'blocked') {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been blocked. Please contact support.'
                });
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Generate token
            const token = generateToken(user._id);

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    user: {
                        id: user._id,
                        email: user.email,
                        role: user.role,
                        status: user.status
                    }
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Error logging in',
                error: error.message
            });
        }
    }
);

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth
 * @access  Public
 */
router.get(
    '/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get(
    '/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
    }),
    (req, res) => {
        try {
            // Generate token
            const token = generateToken(req.user._id);

            // Redirect to frontend with token
            res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
        } catch (error) {
            console.error('Google callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
        }
    }
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset OTP
 * @access  Public
 */
router.post(
    '/forgot-password',
    [
        body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const { email } = req.body;

            // Find user
            const user = await User.findOne({ email });

            if (!user) {
                // Don't reveal if user exists or not (security)
                return res.json({
                    success: true,
                    message: 'If an account with this email exists, an OTP has been sent.'
                });
            }

            // Generate and save OTP
            const otp = user.generateOTP();
            await user.save();

            // Send OTP email
            await sendOTPEmail(email, otp, 'password_reset');

            res.json({
                success: true,
                message: 'OTP sent to your email. It will expire in 10 minutes.'
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                success: false,
                message: 'Error sending OTP',
                error: error.message
            });
        }
    }
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Verify OTP and reset password
 * @access  Public
 */
router.post(
    '/reset-password',
    [
        body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
        body('otp')
            .isLength({ min: 6, max: 6 })
            .withMessage('OTP must be 6 digits')
            .isNumeric()
            .withMessage('OTP must contain only numbers'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const { email, otp, newPassword } = req.body;

            // Find user and include OTP fields
            const user = await User.findOne({ email }).select('+otp');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Verify OTP
            const isOTPValid = user.verifyOTP(otp);

            if (!isOTPValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired OTP'
                });
            }

            // Update password
            user.password = newPassword;
            user.clearOTP();
            await user.save();

            res.json({
                success: true,
                message: 'Password reset successfully. You can now login with your new password.'
            });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                success: false,
                message: 'Error resetting password',
                error: error.message
            });
        }
    }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password -otp');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // If user is a seller, get seller profile
        let sellerProfile = null;
        if (user.role === 'seller') {
            sellerProfile = await SellerProfile.findOne({ userId: user._id });
        }

        res.json({
            success: true,
            data: {
                user,
                sellerProfile
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: error.message
        });
    }
});

module.exports = router;
