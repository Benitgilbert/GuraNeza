const SellerProfile = require('../models/SellerProfile');

/**
 * Middleware to check if user has required role(s)
 * @param {Array|String} roles - Role(s) required to access the route
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        // Ensure roles is an array
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
            });
        }

        next();
    };
};

/**
 * Middleware to check if user is active (not blocked)
 */
const checkUserStatus = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    if (req.user.status === 'blocked') {
        return res.status(403).json({
            success: false,
            message: 'Your account has been blocked. Please contact support.'
        });
    }

    next();
};

/**
 * Middleware to check if seller is approved and active
 */
const checkSellerStatus = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (req.user.role !== 'seller' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only sellers can access this resource.'
            });
        }

        // Admin can bypass seller status check
        if (req.user.role === 'admin') {
            return next();
        }

        // Check seller profile status
        const sellerProfile = await SellerProfile.findOne({ userId: req.user.userId });

        if (!sellerProfile) {
            return res.status(404).json({
                success: false,
                message: 'Seller profile not found. Please complete your seller registration.'
            });
        }

        if (sellerProfile.approvalStatus === 'pending') {
            return res.status(403).json({
                success: false,
                message: 'Your seller account is pending approval.'
            });
        }

        if (sellerProfile.approvalStatus === 'blocked') {
            return res.status(403).json({
                success: false,
                message: 'Your seller account has been blocked. Please contact support.'
            });
        }

        // Attach seller profile to request
        req.sellerProfile = sellerProfile;

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error checking seller status.',
            error: error.message
        });
    }
};

module.exports = {
    requireRole,
    checkUserStatus,
    checkSellerStatus
};
