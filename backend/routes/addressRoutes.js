const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { body } = require('express-validator');
const {
    getAddresses,
    getAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} = require('../controllers/addressController');

// All routes require authentication
router.use(authenticateToken);

// Address validation rules
const addressValidation = [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('phone')
        .notEmpty().withMessage('Phone number is required')
        .matches(/^[0-9]{10,15}$/).withMessage('Please enter a valid phone number'),
    body('street').notEmpty().withMessage('Street address is required'),
    body('city').notEmpty().withMessage('City is required')
];

// Address routes
router.get('/', getAddresses);
router.get('/:id', getAddress);
router.post('/', addressValidation, createAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/default', setDefaultAddress);

module.exports = router;
