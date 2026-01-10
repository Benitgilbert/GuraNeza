const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const MoMoService = require('../utils/MoMoService');

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

        // Initiate MTN MoMo Request to Pay using MoMoService
        const momoResult = await MoMoService.requestToPay(
            order.totalPrice,
            phoneNumber,
            orderId,
            `Payment for GuraNeza Order ${orderId}`
        );

        const referenceId = momoResult.referenceId;

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

        // Check payment status from MTN MoMo using MoMoService
        const statusData = await MoMoService.getTransactionStatus(referenceId);
        const paymentStatus = statusData.status; // SUCCESSFUL, FAILED, PENDING

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

        // Initialize Stripe
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        // Create payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(order.totalPrice), // Amount in smallest currency unit (RWF doesn't have decimals)
            currency: 'rwf', // Rwandan Franc
            metadata: {
                orderId: order._id.toString(),
                customerId: order.customerId.toString(),
                customerEmail: req.user.email || 'customer@guraneza.com'
            },
            description: `GuraNeza Order #${orderId}`,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        // Update order with Stripe payment details
        order.paymentDetails = {
            transactionId: paymentIntent.id,
            paymentInfo: {
                provider: 'Stripe',
                status: 'PENDING',
                paymentIntentId: paymentIntent.id
            }
        };
        await order.save();

        res.json({
            success: true,
            data: {
                clientSecret: paymentIntent.client_secret,
                publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
                amount: order.totalPrice,
                orderId: order._id
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

/**
 * @route   POST /api/payment/stripe/confirm
 * @desc    Confirm Stripe payment after client completes payment
 * @access  Private (Customer)
 */
router.post('/stripe/confirm', authenticateToken, requireRole('customer'), async (req, res) => {
    try {
        const { paymentIntentId, orderId } = req.body;

        if (!paymentIntentId || !orderId) {
            return res.status(400).json({
                success: false,
                message: 'Payment intent ID and order ID are required'
            });
        }

        // Initialize Stripe
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        // Retrieve payment intent to check status
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        // Find order
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

        // Update order based on payment status
        if (paymentIntent.status === 'succeeded') {
            order.paymentStatus = 'PAID';
            order.orderStatus = 'PAID';
            order.paymentDetails.paymentDate = new Date();
            order.paymentDetails.paymentInfo.status = 'SUCCEEDED';
            await order.save();

            res.json({
                success: true,
                message: 'Payment confirmed successfully',
                data: { order }
            });
        } else if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'canceled') {
            order.paymentStatus = 'FAILED';
            order.paymentDetails.paymentInfo.status = 'FAILED';
            await order.save();

            res.status(400).json({
                success: false,
                message: 'Payment failed',
                data: { order }
            });
        } else {
            res.json({
                success: true,
                message: 'Payment is being processed',
                data: {
                    order,
                    paymentStatus: paymentIntent.status
                }
            });
        }
    } catch (error) {
        console.error('Stripe confirmation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error confirming payment',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/payment/webhook/stripe
 * @desc    Stripe payment webhook (for future use)
 * @access  Public (Stripe callback)
 */
router.post('/webhook/stripe', async (req, res) => {
    try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const sig = req.headers['stripe-signature'];

        // Note: In production, you should verify the webhook signature
        // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

        const event = req.body;

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                const orderId = paymentIntent.metadata.orderId;

                const order = await Order.findById(orderId);
                if (order && order.paymentStatus !== 'PAID') {
                    order.paymentStatus = 'PAID';
                    order.orderStatus = 'PAID';
                    order.paymentDetails.paymentDate = new Date();
                    order.paymentDetails.paymentInfo.status = 'SUCCEEDED';
                    await order.save();
                }
                break;

            case 'payment_intent.payment_failed':
                const failedIntent = event.data.object;
                const failedOrderId = failedIntent.metadata.orderId;

                const failedOrder = await Order.findById(failedOrderId);
                if (failedOrder) {
                    failedOrder.paymentStatus = 'FAILED';
                    failedOrder.paymentDetails.paymentInfo.status = 'FAILED';
                    await failedOrder.save();
                }
                break;
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Stripe webhook error:', error);
        res.sendStatus(500);
    }
});

module.exports = router;
