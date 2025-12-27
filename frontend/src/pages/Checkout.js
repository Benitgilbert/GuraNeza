import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Header from '../components/Header';
import './Checkout.css';

const Checkout = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [shippingInfo, setShippingInfo] = useState({
        fullName: '',
        phone: '',
        address: '',
        city: '',
        province: '',
        district: ''
    });

    const [paymentMethod, setPaymentMethod] = useState('momo');

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const response = await api.get('/cart');
            if (response.data.success) {
                const cartData = response.data.data.cart;

                if (!cartData || !cartData.items || cartData.items.length === 0) {
                    navigate('/cart');
                    return;
                }

                setCart(cartData);
            }
        } catch (err) {
            setError(err.message || 'Failed to load cart');
        } finally {
            setLoading(false);
        }
    };

    const calculateSubtotal = () => {
        if (!cart || !cart.items) return 0;
        return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const calculateShipping = () => {
        // Simple shipping calculation - 2000 RWF base + 500 per item
        if (!cart || !cart.items) return 0;
        return 2000 + (cart.items.length * 500);
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateShipping();
    };

    const handleInputChange = (e) => {
        setShippingInfo({
            ...shippingInfo,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const response = await api.post('/orders', {
                shippingInfo,
                paymentMethod
            });

            if (response.data.success) {
                const orderId = response.data.data.order._id;

                // If payment method is MoMo, initiate payment
                if (paymentMethod === 'momo') {
                    try {
                        const paymentResponse = await api.post('/payment/momo/initiate', {
                            orderId,
                            amount: calculateTotal(),
                            phoneNumber: shippingInfo.phone
                        });

                        if (paymentResponse.data.success) {
                            alert('Order created! Please check your phone to complete MoMo payment.');
                            navigate('/orders');
                        }
                    } catch (paymentErr) {
                        alert('Order created but payment initiation failed. Please contact support.');
                        navigate('/orders');
                    }
                } else {
                    // For card payments, redirect to orders
                    alert('Order created successfully!');
                    navigate('/orders');
                }
            }
        } catch (err) {
            setError(err.message || 'Failed to create order');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
                    <div className="spinner spinner--lg"></div>
                    <p>Loading checkout...</p>
                </div>
            </>
        );
    }

    const subtotal = calculateSubtotal();
    const shipping = calculateShipping();
    const total = calculateTotal();

    return (
        <>
            <Header />

            <div className="checkout-container">
                <div className="container">
                    <div className="page-header">
                        <h1 className="page-title">Checkout</h1>
                        <p className="page-subtitle">Complete your order</p>
                    </div>

                    {error && (
                        <div className="alert alert--error">{error}</div>
                    )}

                    <form onSubmit={handleSubmitOrder} className="checkout-layout">
                        <div className="checkout-form">
                            {/* Shipping Information */}
                            <div className="checkout-section">
                                <h2 className="checkout-section__title">📍 Shipping Information</h2>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="fullName" className="form-label">Full Name *</label>
                                        <input
                                            type="text"
                                            id="fullName"
                                            name="fullName"
                                            className="form-input"
                                            value={shippingInfo.fullName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="phone" className="form-label">Phone Number *</label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            className="form-input"
                                            placeholder="07XXXXXXXX"
                                            value={shippingInfo.phone}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="address" className="form-label">Street Address *</label>
                                    <input
                                        type="text"
                                        id="address"
                                        name="address"
                                        className="form-input"
                                        placeholder="KG 123 St"
                                        value={shippingInfo.address}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="district" className="form-label">District *</label>
                                        <input
                                            type="text"
                                            id="district"
                                            name="district"
                                            className="form-input"
                                            placeholder="Gasabo"
                                            value={shippingInfo.district}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="city" className="form-label">City *</label>
                                        <input
                                            type="text"
                                            id="city"
                                            name="city"
                                            className="form-input"
                                            placeholder="Kigali"
                                            value={shippingInfo.city}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="province" className="form-label">Province *</label>
                                        <select
                                            id="province"
                                            name="province"
                                            className="form-select"
                                            value={shippingInfo.province}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select Province</option>
                                            <option value="Kigali City">Kigali City</option>
                                            <option value="Eastern Province">Eastern Province</option>
                                            <option value="Northern Province">Northern Province</option>
                                            <option value="Southern Province">Southern Province</option>
                                            <option value="Western Province">Western Province</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="checkout-section">
                                <h2 className="checkout-section__title">💳 Payment Method</h2>

                                <div className="payment-methods">
                                    <label className="payment-option">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="momo"
                                            checked={paymentMethod === 'momo'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <div className="payment-option__content">
                                            <span className="payment-option__icon">📱</span>
                                            <div className="payment-option__details">
                                                <div className="payment-option__name">MTN Mobile Money</div>
                                                <div className="payment-option__desc">Pay with MoMo</div>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="payment-option">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="card"
                                            checked={paymentMethod === 'card'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <div className="payment-option__content">
                                            <span className="payment-option__icon">💳</span>
                                            <div className="payment-option__details">
                                                <div className="payment-option__name">Credit/Debit Card</div>
                                                <div className="payment-option__desc">Visa, Mastercard</div>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="checkout-summary">
                            <h2 className="checkout-summary__title">Order Summary</h2>

                            <div className="order-items">
                                {cart?.items?.map(item => (
                                    <div key={item._id} className="order-item">
                                        <img src={item.productId.imageUrl} alt={item.productId.name} />
                                        <div className="order-item__details">
                                            <div className="order-item__name">{item.productId.name}</div>
                                            <div className="order-item__qty">Qty: {item.quantity}</div>
                                        </div>
                                        <div className="order-item__price">
                                            {(item.price * item.quantity).toLocaleString()} RWF
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="checkout-summary__divider"></div>

                            <div className="checkout-summary__row">
                                <span>Subtotal</span>
                                <span>{subtotal.toLocaleString()} RWF</span>
                            </div>

                            <div className="checkout-summary__row">
                                <span>Shipping</span>
                                <span>{shipping.toLocaleString()} RWF</span>
                            </div>

                            <div className="checkout-summary__divider"></div>

                            <div className="checkout-summary__row checkout-summary__total">
                                <span>Total</span>
                                <span>{total.toLocaleString()} RWF</span>
                            </div>

                            <button
                                type="submit"
                                className="btn btn--primary btn--lg btn--full"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-sm">
                                        <div className="spinner spinner--sm"></div>
                                        Processing...
                                    </span>
                                ) : (
                                    `Place Order - ${total.toLocaleString()} RWF`
                                )}
                            </button>

                            <div className="checkout-security">
                                <span>🔒</span>
                                <span>Secure checkout powered by SSL encryption</span>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Checkout;
