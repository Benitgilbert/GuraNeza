import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Header from '../components/Header';
import './OrderHistory.css';

const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders/my-orders');
            if (response.data.success) {
                setOrders(response.data.data.orders);
            }
        } catch (err) {
            setError(err.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        const statusMap = {
            pending: 'badge--warning',
            processing: 'badge--primary',
            shipped: 'badge--primary',
            delivered: 'badge--success',
            cancelled: 'badge--error'
        };
        return statusMap[status] || 'badge--primary';
    };

    const getPaymentStatusBadge = (status) => {
        const statusMap = {
            pending: 'badge--warning',
            paid: 'badge--success',
            failed: 'badge--error',
            refunded: 'badge--primary'
        };
        return statusMap[status] || 'badge--primary';
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
                    <div className="spinner spinner--lg"></div>
                    <p>Loading your orders...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />

            <div className="order-history-container">
                <div className="container">
                    <div className="page-header">
                        <h1 className="page-title">My Orders</h1>
                        <p className="page-subtitle">Track and manage your orders</p>
                    </div>

                    {error && (
                        <div className="alert alert--error">{error}</div>
                    )}

                    {orders.length === 0 ? (
                        <div className="empty-orders">
                            <div className="empty-orders__icon">📦</div>
                            <h3 className="empty-orders__title">No Orders Yet</h3>
                            <p className="empty-orders__desc">
                                You haven't placed any orders. Start shopping to see your orders here!
                            </p>
                            <Link to="/products" className="btn btn--primary btn--lg">
                                Browse Products
                            </Link>
                        </div>
                    ) : (
                        <div className="orders-list">
                            {orders.map(order => (
                                <div key={order._id} className="order-card">
                                    <div className="order-card__header">
                                        <div className="order-card__info">
                                            <div className="order-card__id">Order #{order._id.slice(-8)}</div>
                                            <div className="order-card__date">
                                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                        <div className="order-card__badges">
                                            <span className={`badge ${getStatusBadgeClass(order.orderStatus)}`}>
                                                {order.orderStatus}
                                            </span>
                                            <span className={`badge ${getPaymentStatusBadge(order.paymentStatus)}`}>
                                                {order.paymentStatus}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="order-card__items">
                                        {order.items.map((item, index) => (
                                            <div key={index} className="order-item">
                                                <div className="order-item__product">
                                                    <span className="order-item__name">{item.productName}</span>
                                                    <span className="order-item__qty">Qty: {item.quantity}</span>
                                                </div>
                                                <div className="order-item__price">
                                                    {item.priceAtPurchase.toLocaleString()} RWF
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="order-card__footer">
                                        <div className="order-card__shipping">
                                            <div className="shipping-label">📍 Shipping to:</div>
                                            <div className="shipping-address">
                                                {order.shipping.address}, {order.shipping.city}
                                            </div>
                                        </div>

                                        <div className="order-card__total">
                                            <span className="total-label">Total:</span>
                                            <span className="total-amount">
                                                {order.totalPrice.toLocaleString()} RWF
                                            </span>
                                        </div>
                                    </div>

                                    {order.orderStatus === 'pending' && (
                                        <div className="order-card__actions">
                                            <button
                                                className="btn btn--secondary btn--sm"
                                                onClick={() => alert('Contact support to cancel order')}
                                            >
                                                Cancel Order
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default OrderHistory;
