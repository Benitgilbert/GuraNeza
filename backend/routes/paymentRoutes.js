const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

/**
 * MTN MoMo Payment Configuration
 */
const MOMO_CONFIG = {
    subscriptionKey: process.env.MOMO_SUBSCRIPTION_KEY,
    apiUser: process.env.MOMO_API_USER,
    apiKey: process.env.MOMO_API_KEY,
    environment: process.env.MOMO_ENVIRONMENT || 'sandbox',
    baseURL: process.env.MOMO_ENVIRONMENT === 'production'
        ? 'https://proxy.momoapi.mtn.com'
        : 'https://sandbox.momodeveloper.mtn.com'
};

/**
 * @route   POST /api/payment/momo/initiate
 * @desc    Initiate MTN MoMo payment
 * @access  Private (Customer)
 */
router.post('/momo/initiate', authenticateToken, requireRole('customer'), async (req, res) => {
    try {
        const { orderId, phoneNumber } = req.body;

        // Validate order
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order belongs to user
        if (order.customerId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if order is already paid
        if (order.paymentStatus === 'PAID') {
            return res.status(400).json({
                success: false,
                message: 'Order is already paid'
            });
        }

        // Generate reference ID
        const referenceId = `GURANEZA_${Date.now()}_${orderId}`;

        // MTN MoMo Request to Pay
        const momoResponse = await axios.post(
            `${MOMO_CONFIG.baseURL}/collection/v1_0/requesttopay`,
            {
                amount: order.totalPrice.toString(),
                currency: 'RWF',
                externalId: orderId.toString(),
                payer: {
                    partyIdType: 'MSISDN',
                    partyId: phoneNumber
                },
                payerMessage: `Payment for GuraNeza Order ${orderId}`,
                payeeNote: `Order payment from ${req.user.email}`
            },
            {
                headers: {
                    'X-Reference-Id': referenceId,
                    'X-Target-Environment': MOMO_CONFIG.environment,
                    'Ocp-Apim-Subscription-Key': MOMO_CONFIG.subscriptionKey,
                    'Authorization': `Bearer ${MOMO_CONFIG.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Update order with payment details
        order.paymentStatus = 'PENDING';
        order.paymentDetails = {
            transactionId: referenceId,
            paymentInfo: {
                phoneNumber,
                provider: 'MTN MoMo',
                status: 'PENDING'
            }
        };
        await order.save();

        res.json({
            success: true,
            message: 'Payment request sent. Please check your phone to confirm.',
            data: {
                referenceId,
                orderId: order._id,
                amount: order.totalPrice
            }
        });
    } catch (error) {
        console.error('MoMo payment error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Error initiating payment',
            error: error.response?.data || error.message
        });
    }
});

/**
 * @route   GET /api/payment/momo/status/:referenceId
 * @desc    Check MTN MoMo payment status
 * @access  Private (Customer)
 */
router.get('/momo/status/:referenceId', authenticateToken, async (req, res) => {
    try {
        const { referenceId } = req.params;

        // Check payment status from MTN MoMo
        const statusResponse = await axios.get(
            `${MOMO_CONFIG.baseURL}/collection/v1_0/requesttopay/${referenceId}`,
            {
                headers: {
                    'X-Target-Environment': MOMO_CONFIG.environment,
                    'Ocp-Apim-Subscription-Key': MOMO_CONFIG.subscriptionKey,
                    'Authorization': `Bearer ${MOMO_CONFIG.apiKey}`
                }
            }
        );

        const paymentStatus = statusResponse.data.status; // SUCCESSFUL, FAILED, PENDING

        // Find and update order
        const order = await Order.findOne({ 'paymentDetails.transactionId': referenceId });

        if (order) {
            if (paymentStatus === 'SUCCESSFUL') {
                order.paymentStatus = 'PAID';
                order.orderStatus = 'PAID';
                order.paymentDetails.paymentDate = new Date();
                order.paymentDetails.paymentInfo.status = 'SUCCESSFUL';
            } else if (paymentStatus === 'FAILED') {
                order.paymentStatus = 'FAILED';
                order.paymentDetails.paymentInfo.status = 'FAILED';
            }

            await order.save();
        }

        res.json({
            success: true,
            data: {
                status: paymentStatus,
                order: order
            }
        });
    } catch (error) {
        console.error('Check payment status error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Error checking payment status',
            error: error.response?.data || error.message
        });
    }
});

/**
 * @route   POST /api/payment/stripe/create-intent
 * @desc    Create Stripe payment intent
 * @access  Private (Customer)
 */
router.post('/stripe/create-intent', authenticateToken, requireRole('customer'), async (req, res) => {
    try {
        const { orderId } = req.body;

        // Validate order
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order belongs to user
        if (order.customerId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if order is already paid
        if (order.paymentStatus === 'PAID') {
            return res.status(400).json({
                success: false,
                message: 'Order is already paid'
            });
        }

        // For now, return client secret placeholder
        // In production, integrate with actual Stripe SDK
        const clientSecret = `test_${Date.now()}_${orderId}`;

        res.json({
            success: true,
            data: {
                clientSecret,
                publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
                amount: order.totalPrice
            }
        });
    } catch (error) {
        console.error('Stripe payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating payment intent',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/payment/webhook/momo
 * @desc    MTN MoMo payment webhook
 * @access  Public (MTN MoMo callback)
 */
router.post('/webhook/momo', async (req, res) => {
    try {
        // Handle MTN MoMo payment callback
        const { referenceId, status } = req.body;

        const order = await Order.findOne({ 'paymentDetails.transactionId': referenceId });

        if (order) {
            if (status === 'SUCCESSFUL') {
                order.paymentStatus = 'PAID';
                order.orderStatus = 'PAID';
                order.paymentDetails.paymentDate = new Date();
            } else if (status === 'FAILED') {
                order.paymentStatus = 'FAILED';
            }

            await order.save();
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(500);
    }
});

module.exports = router;
