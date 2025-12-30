const Address = require('../models/Address');

/**
 * @desc    Get all user addresses
 * @route   GET /api/addresses
 * @access  Private
 */
exports.getAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ user: req.user.userId }).sort({ isDefault: -1, createdAt: -1 });

        res.json({
            success: true,
            data: {
                addresses
            }
        });
    } catch (error) {
        console.error('Get addresses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching addresses',
            error: error.message
        });
    }
};

/**
 * @desc    Get single address
 * @route   GET /api/addresses/:id
 * @access  Private
 */
exports.getAddress = async (req, res) => {
    try {
        const address = await Address.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        res.json({
            success: true,
            data: {
                address
            }
        });
    } catch (error) {
        console.error('Get address error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching address',
            error: error.message
        });
    }
};

/**
 * @desc    Create new address
 * @route   POST /api/addresses
 * @access  Private
 */
exports.createAddress = async (req, res) => {
    try {
        const { fullName, phone, street, city, state, zipCode, country, label, isDefault } = req.body;

        const address = new Address({
            user: req.user.userId,
            fullName,
            phone,
            street,
            city,
            state,
            zipCode,
            country,
            label,
            isDefault: isDefault || false
        });

        await address.save();

        res.status(201).json({
            success: true,
            message: 'Address created successfully',
            data: {
                address
            }
        });
    } catch (error) {
        console.error('Create address error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating address',
            error: error.message
        });
    }
};

/**
 * @desc    Update address
 * @route   PUT /api/addresses/:id
 * @access  Private
 */
exports.updateAddress = async (req, res) => {
    try {
        const { fullName, phone, street, city, state, zipCode, country, label, isDefault } = req.body;

        let address = await Address.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // Update fields
        address.fullName = fullName || address.fullName;
        address.phone = phone || address.phone;
        address.street = street || address.street;
        address.city = city || address.city;
        address.state = state || address.state;
        address.zipCode = zipCode || address.zipCode;
        address.country = country || address.country;
        address.label = label || address.label;

        if (isDefault !== undefined) {
            address.isDefault = isDefault;
        }

        await address.save();

        res.json({
            success: true,
            message: 'Address updated successfully',
            data: {
                address
            }
        });
    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating address',
            error: error.message
        });
    }
};

/**
 * @desc    Delete address
 * @route   DELETE /api/addresses/:id
 * @access  Private
 */
exports.deleteAddress = async (req, res) => {
    try {
        const address = await Address.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        await address.deleteOne();

        res.json({
            success: true,
            message: 'Address deleted successfully'
        });
    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting address',
            error: error.message
        });
    }
};

/**
 * @desc    Set address as default
 * @route   PATCH /api/addresses/:id/default
 * @access  Private
 */
exports.setDefaultAddress = async (req, res) => {
    try {
        const address = await Address.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // Set this address as default (middleware will handle removing default from others)
        address.isDefault = true;
        await address.save();

        res.json({
            success: true,
            message: 'Default address updated',
            data: {
                address
            }
        });
    } catch (error) {
        console.error('Set default address error:', error);
        res.status(500).json({
            success: false,
            message: 'Error setting default address',
            error: error.message
        });
    }
};
