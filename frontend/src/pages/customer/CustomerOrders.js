import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import './customer.css';

const CustomerOrders = () => {
    const [searchParams] = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');

    const menuItems = [
        { path: '/customer/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/customer/profile', icon: '👤', label: 'My Profile' },
        { path: '/customer/orders', icon: '📦', label: 'My Orders' },
        { path: '/customer/wishlist', icon: '❤️', label: 'Wishlist' },
        { path: '/customer/addresses', icon: '📍', label: 'Addresses' },
        { path: '/customer/settings', icon: '⚙️', label: 'Settings' }
    ];

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        filterOrders();
    }, [statusFilter, orders]);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders/my-orders');
            if (response.data.success) {
                setOrders(response.data.data.orders);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterOrders = () => {
        if (statusFilter === 'all') {
            setFilteredOrders(orders);
        } else {
            setFilteredOrders(orders.filter(order =>
                order.orderStatus.toUpperCase() === statusFilter.toUpperCase()
            ));
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

    if (loading) {
        return (
            <DashboardLayout menuItems={menuItems} title="My Orders">
                <div className="customer-loading">
                    <div className="spinner spinner--lg"></div>
                    <p>Loading orders...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout menuItems={menuItems} title="My Orders">
            <div className="customer-orders">
                {/* Filter Tabs */}
                <div className="order-filters">
                    <button
                        className={`filter-tab ${statusFilter === 'all' ? 'filter-tab--active' : ''}`}
                        onClick={() => setStatusFilter('all')}
                    >
                        All Orders ({orders.length})
                    </button>
                    <button
                        className={`filter-tab ${statusFilter === 'pending' ? 'filter-tab--active' : ''}`}
                        onClick={() => setStatusFilter('pending')}
                    >
                        Pending
                    </button>
                    <button
                        className={`filter-tab ${statusFilter === 'processing' ? 'filter-tab--active' : ''}`}
                        onClick={() => setStatusFilter('processing')}
                    >
                        Processing
                    </button>
                    <button
                        className={`filter-tab ${statusFilter === 'delivered' ? 'filter-tab--active' : ''}`}
                        onClick={() => setStatusFilter('delivered')}
                    >
                        Delivered
                    </button>
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">📦</div>
                        <p className="empty-state__text">
                            {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`}
                        </p>
                        <Link to="/products" className="btn btn--primary">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="orders-list">
                        {filteredOrders.map(order => (
                            <div key={order._id} className="order-card">
                                <div className="order-card__header">
                                    <div>
                                        <div className="order-card__id">
                                            Order #{order._id.slice(-8).toUpperCase()}
                                        </div>
                                        <div className="order-card__date">
                                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                    <span className={`badge ${getStatusBadgeClass(order.orderStatus)}`}>
                                        {order.orderStatus}
                                    </span>
                                </div>

                                <div className="order-card__items">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="order-item">
                                            <div className="order-item__info">
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
                                        <span className="shipping-label">📍</span>
                                        <span className="shipping-address">
                                            {order.shipping.address}, {order.shipping.city}
                                        </span>
                                    </div>
                                    <div className="order-card__total">
                                        <span className="total-label">Total:</span>
                                        <span className="total-amount">
                                            {order.totalPrice.toLocaleString()} RWF
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CustomerOrders;
