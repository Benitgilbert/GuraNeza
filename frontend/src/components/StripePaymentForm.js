import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../utils/api';
import './StripePaymentForm.css';

const StripePaymentForm = ({ orderId, amount, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError('');

        try {
            // Create payment intent
            const response = await api.post('/payment/stripe/create-intent', { orderId });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to create payment intent');
            }

            const { clientSecret } = response.data.data;

            // Confirm card payment
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
                clientSecret,
                {
                    payment_method: {
                        card: elements.getElement(CardElement),
                    },
                }
            );

            if (stripeError) {
                setError(stripeError.message);
                onError && onError(stripeError);
            } else if (paymentIntent.status === 'succeeded') {
                // Confirm payment on backend
                await api.post('/payment/stripe/confirm', {
                    paymentIntentId: paymentIntent.id,
                    orderId
                });

                onSuccess && onSuccess(paymentIntent);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Payment failed';
            setError(errorMessage);
            onError && onError(err);
        } finally {
            setProcessing(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#1a202c',
                fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
                '::placeholder': {
                    color: '#a0aec0',
                },
                padding: '12px',
            },
            invalid: {
                color: '#ef4444',
                iconColor: '#ef4444',
            },
        },
        hidePostalCode: false,
    };

    return (
        <form onSubmit={handleSubmit} className="stripe-payment-form">
            <div className="card-element-container">
                <label className="card-element-label">Card Details</label>
                <div className="card-element-wrapper">
                    <CardElement options={cardElementOptions} />
                </div>
            </div>

            {error && (
                <div className="stripe-error">
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || processing}
                className="btn btn--primary btn--lg btn--full stripe-submit-btn"
            >
                {processing ? (
                    <span className="flex items-center justify-center gap-sm">
                        <div className="spinner spinner--sm"></div>
                        Processing Payment...
                    </span>
                ) : (
                    `Pay ${amount.toLocaleString()} RWF`
                )}
            </button>

            <div className="stripe-secure-badge">
                <span>🔒</span>
                <span>Secured by Stripe</span>
            </div>
        </form>
    );
};

export default StripePaymentForm;
