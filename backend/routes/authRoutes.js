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
 * @route   POST /api/auth/login/request-otp
 * @desc    Request OTP for login (requires email and password verification)
 * @access  Public
 */
router.post('/login/request-otp', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: errors.array()[0].msg });
        }

        const { email, password } = req.body;

        // Find user and include password field
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Check if user is blocked
        if (user.status === 'blocked') {
            return res.status(403).json({ success: false, message: 'Your account has been blocked' });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Generate OTP
        const otp = user.generateOTP();
        console.log('🔑 Generated OTP for', email, ':', otp);
        console.log('📅 OTP expires at:', user.otp.expires);
        await user.save();
        console.log('✅ OTP saved to database');

        // Send OTP email
        await sendOTPEmail(email, otp, 'login');

        res.json({
            success: true,
            message: 'OTP sent to your email. Valid for 10 minutes.',
            email: email
        });
    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   POST /api/auth/login/verify-otp
 * @desc    Verify OTP and login
 * @access  Public
 */
router.post('/login/verify-otp', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('otp').notEmpty().withMessage('Please provide OTP')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: errors.array()[0].msg });
        }

        const { email, otp } = req.body;

        // Find user and include OTP fields (they have select: false by default)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+otp');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        console.log('🔍 Verifying OTP for', email);
        console.log('📝 Received OTP:', otp);
        console.log('💾 Stored OTP:', user.otp?.code);
        console.log('⏰ OTP expires at:', user.otp?.expires);
        console.log('🕐 Current time:', new Date());

        // Verify OTP
        const isValid = user.verifyOTP(otp);
        console.log('✅ OTP Valid?', isValid);

        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Clear OTP after successful verification
        user.clearOTP();
        await user.save();

        // Check if user is blocked after OTP verification
        if (user.status === 'blocked') {
            return res.status(403).json({ success: false, message: 'Your account has been blocked' });
        }

        // Generate JWT token
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
        console.error('Verify OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

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
                isVerified: false // Explicitly false
            });

            // Generate OTP for verification
            const otpCode = user.generateOTP();
            await user.save();

            // If role is seller, create seller profile
            if (role === 'seller') {
                const sellerProfile = new SellerProfile({
                    userId: user._id,
                    storeName,
                    description: storeDescription || '',
                    phone,
                    approvalStatus: 'pending'
                });

                await sellerProfile.save();
            }

            // Send verification OTP email
            await sendOTPEmail(email, otpCode, 'signup');

            res.status(201).json({
                success: true,
                message: 'Account created. Please verify your email with the OTP sent to your inbox.',
                email: user.email
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
 * @route   POST /api/auth/verify-signup-otp
 * @desc    Verify OTP after signup
 * @access  Public
 */
router.post('/verify-signup-otp', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('otp').notEmpty().withMessage('OTP is required')
], async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() }).select('+otp');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'Account is already verified' });
        }

        const isValid = user.verifyOTP(otp);
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.clearOTP();
        await user.save();

        // Generate token for auto-login
        const token = generateToken(user._id);

        // Prepare user response (exclude sensitive fields)
        const userResponse = {
            id: user._id,
            email: user.email,
            role: user.role,
            status: user.status,
            isVerified: user.isVerified
        };

        res.json({
            success: true,
            message: 'Email verified successfully.',
            data: {
                token,
                user: userResponse
            }
        });
    } catch (error) {
        console.error('Verify signup OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user with password (legacy - for backwards compatibility)
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

            // Check if user is verified
            if (!user.isVerified) {
                return res.status(403).json({
                    success: false,
                    message: 'Please verify your email address first. An OTP was sent to your email upon registration.',
                    notVerified: true
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

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth (accepts ?role=customer or ?role=seller)
 * @access  Public
 */
router.get('/google', (req, res, next) => {
    const role = req.query.role || 'customer';
    const validRoles = ['customer', 'seller'];
    const selectedRole = validRoles.includes(role) ? role : 'customer';

    // Pass role via state parameter
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: selectedRole
    })(req, res, next);
});

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_auth_failed` }),
    (req, res) => {
        try {
            // Generate JWT token
            const token = generateToken(req.user._id);

            // Redirect to frontend with token and user info
            const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';

            // Redirect based on role
            let redirectPath = '/products';
            if (req.user.role === 'admin') {
                redirectPath = '/admin/dashboard';
            } else if (req.user.role === 'seller') {
                redirectPath = '/seller/dashboard';
            }

            // Pass token via URL (frontend will extract and store it)
            res.redirect(`${frontendURL}/auth/google/success?token=${token}&role=${req.user.role}&redirect=${redirectPath}`);
        } catch (error) {
            console.error('Google callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
        }
    }
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, [
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('phone').optional().matches(/^[0-9]{10,15}$/).withMessage('Please enter a valid phone number'),
    body('dateOfBirth').optional().isISO8601().withMessage('Please enter a valid date')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const { firstName, lastName, phone, dateOfBirth, address } = req.body;

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update profile fields
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (phone !== undefined) user.phone = phone;
        if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;

        if (address) {
            user.address = {
                street: address.street || user.address?.street,
                city: address.city || user.address?.city,
                state: address.state || user.address?.state
            };
        }

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    avatar: user.avatar,
                    dateOfBirth: user.dateOfBirth,
                    address: user.address
                }
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticateToken, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.userId).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user has a password (OAuth users might not)
        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: 'Cannot change password for OAuth accounts'
            });
        }

        // Verify current password
        const isPasswordValid = await user.comparePassword(currentPassword);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
});

module.exports = router;

