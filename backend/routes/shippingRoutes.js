const express = require('express');
const router = express.Router();
const ShippingSetting = require('../models/ShippingSetting');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

/**
 * @route   GET /api/shipping/rates
 * @desc    Get all active shipping rates
 * @access  Public
 */
router.get('/rates', async (req, res) => {
    try {
        const rates = await ShippingSetting.find({ isActive: true }).sort({ city: 1 });

        res.json({
            success: true,
            data: { rates }
        });
    } catch (error) {
        console.error('Get shipping rates error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching shipping rates',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/shipping/rate/:city
 * @desc    Get shipping rate for specific city
 * @access  Public
 */
router.get('/rate/:city', async (req, res) => {
    try {
        const { city } = req.params;

        // Try to find rate for specific city
        let rate = await ShippingSetting.findOne({
            city: new RegExp(`^${city}$`, 'i'),
            isActive: true
        });

        // If not found, get default rate
        if (!rate) {
            rate = await ShippingSetting.findOne({ isDefault: true, isActive: true });
        }

        res.json({
            success: true,
            data: {
                city,
                fee: rate ? rate.fee : 5000, // Fallback to 5000 if no default
                isDefault: !rate || rate.isDefault
            }
        });
    } catch (error) {
        console.error('Get shipping rate error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching shipping rate',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/shipping/settings
 * @desc    Get all shipping settings (Admin)
 * @access  Private (Admin)
 */
router.get('/settings', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const settings = await ShippingSetting.find().sort({ city: 1 });

        res.json({
            success: true,
            data: { settings }
        });
    } catch (error) {
        console.error('Get shipping settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching shipping settings',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/shipping/settings
 * @desc    Create new shipping rate (Admin)
 * @access  Private (Admin)
 */
router.post('/settings', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { city, fee, isDefault, isActive } = req.body;

        // Check if city already exists
        const existing = await ShippingSetting.findOne({ city: new RegExp(`^${city}$`, 'i') });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Shipping rate for this city already exists'
            });
        }

        const setting = new ShippingSetting({
            city,
            fee,
            isDefault: isDefault || false,
            isActive: isActive !== undefined ? isActive : true
        });

        await setting.save();

        res.status(201).json({
            success: true,
            message: 'Shipping rate created successfully',
            data: { setting }
        });
    } catch (error) {
        console.error('Create shipping setting error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating shipping rate',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/shipping/settings/:id
 * @desc    Update shipping rate (Admin)
 * @access  Private (Admin)
 */
router.put('/settings/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { city, fee, isDefault, isActive } = req.body;

        const setting = await ShippingSetting.findById(req.params.id);

        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Shipping rate not found'
            });
        }

        if (city) setting.city = city;
        if (fee !== undefined) setting.fee = fee;
        if (isDefault !== undefined) setting.isDefault = isDefault;
        if (isActive !== undefined) setting.isActive = isActive;

        await setting.save();

        res.json({
            success: true,
            message: 'Shipping rate updated successfully',
            data: { setting }
        });
    } catch (error) {
        console.error('Update shipping setting error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating shipping rate',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/shipping/settings/:id
 * @desc    Delete shipping rate (Admin)
 * @access  Private (Admin)
 */
router.delete('/settings/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const setting = await ShippingSetting.findById(req.params.id);

        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Shipping rate not found'
            });
        }

        if (setting.isDefault) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete default shipping rate. Set another rate as default first.'
            });
        }

        await ShippingSetting.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Shipping rate deleted successfully'
        });
    } catch (error) {
        console.error('Delete shipping setting error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting shipping rate',
            error: error.message
        });
    }
});

module.exports = router;
