import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import './customer.css';

const CustomerDashboard = () => {
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        wishlistItems: 0,
        savedAddresses: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [sellerRequest, setSellerRequest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [ordersRes, wishlistRes, addressesRes, requestRes] = await Promise.all([
                api.get('/orders/my-orders'),
                api.get('/wishlist'),
                api.get('/addresses'),
                api.get('/seller/my-request').catch(() => ({ data: { data: null } }))
            ]);

            const orders = ordersRes.data.data.orders || [];
            const pendingOrders = orders.filter(order => {
                const status = order.orderStatus.toUpperCase();
                return status === 'PENDING' || status === 'PROCESSING';
            });

            setStats({
                totalOrders: orders.length,
                pendingOrders: pendingOrders.length,
                wishlistItems: wishlistRes.data.data.wishlist?.items?.length || 0,
                savedAddresses: addressesRes.data.data.addresses?.length || 0
            });

            // Get 3 most recent orders
            setRecentOrders(orders.slice(0, 3));

            // Set seller request if exists
            setSellerRequest(requestRes.data.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        { path: '/customer/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/customer/profile', icon: '👤', label: 'My Profile' },
        { path: '/customer/orders', icon: '📦', label: 'My Orders' },
        { path: '/customer/wishlist', icon: '❤️', label: 'Wishlist' },
        { path: '/customer/addresses', icon: '📍', label: 'Addresses' },
        { path: '/customer/settings', icon: '⚙️', label: 'Settings' }
    ];

    if (loading) {
        return (
            <DashboardLayout menuItems={menuItems} title="Dashboard">
                <div className="customer-loading">
                    <div className="spinner spinner--lg"></div>
                    <p>Loading dashboard...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout menuItems={menuItems} title="Dashboard">
            <div className="customer-dashboard">
                {/* Welcome Section */}
                <div className="customer-welcome">
                    <h2 className="customer-welcome__title">Welcome back! 👋</h2>
                    <p className="customer-welcome__subtitle">Manage your orders, wishlist, and account settings</p>
                </div>

                {/* Stats Grid */}
                <div className="customer-stats">
                    <Link to="/customer/orders" className="stat-card stat-card--primary">
                        <div className="stat-card__icon">📦</div>
                        <div className="stat-card__content">
                            <div className="stat-card__value">{stats.totalOrders}</div>
                            <div className="stat-card__label">Total Orders</div>
                        </div>
                    </Link>

                    <Link to="/customer/orders?status=pending" className="stat-card stat-card--warning">
                        <div className="stat-card__icon">⏳</div>
                        <div className="stat-card__content">
                            <div className="stat-card__value">{stats.pendingOrders}</div>
                            <div className="stat-card__label">Pending Orders</div>
                        </div>
                    </Link>

                    <Link to="/customer/wishlist" className="stat-card stat-card--error">
                        <div className="stat-card__icon">❤️</div>
                        <div className="stat-card__content">
                            <div className="stat-card__value">{stats.wishlistItems}</div>
                            <div className="stat-card__label">Wishlist Items</div>
                        </div>
                    </Link>

                    <Link to="/customer/addresses" className="stat-card stat-card--success">
                        <div className="stat-card__icon">📍</div>
                        <div className="stat-card__content">
                            <div className="stat-card__value">{stats.savedAddresses}</div>
                            <div className="stat-card__label">Saved Addresses</div>
                        </div>
                    </Link>
                </div>

                {/* Recent Orders */}
                <div className="customer-section">
                    <div className="customer-section__header">
                        <h3 className="customer-section__title">Recent Orders</h3>
                        <Link to="/customer/orders" className="customer-section__link">
                            View All →
                        </Link>
                    </div>

                    {recentOrders.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state__icon">📦</div>
                            <p className="empty-state__text">No orders yet</p>
                            <Link to="/products" className="btn btn--primary">
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="recent-orders">
                            {recentOrders.map(order => (
                                <div key={order._id} className="recent-order-card">
                                    <div className="recent-order-card__header">
                                        <div className="recent-order-card__id">
                                            Order #{order._id.slice(-6).toUpperCase()}
                                        </div>
                                        <span className={`badge badge--${order.orderStatus === 'delivered' ? 'success' :
                                            order.orderStatus === 'cancelled' ? 'error' :
                                                'warning'
                                            }`}>
                                            {order.orderStatus}
                                        </span>
                                    </div>
                                    <div className="recent-order-card__info">
                                        <div className="recent-order-card__items">
                                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                                        </div>
                                        <div className="recent-order-card__date">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="recent-order-card__price">
                                            {order.totalPrice.toLocaleString()} RWF
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="customer-section">
                    <h3 className="customer-section__title">Quick Actions</h3>
                    <div className="quick-actions">
                        <Link to="/products" className="quick-action-card">
                            <div className="quick-action-card__icon">🛍️</div>
                            <div className="quick-action-card__title">Browse Products</div>
                            <div className="quick-action-card__desc">Discover new items</div>
                        </Link>

                        <Link to="/customer/orders" className="quick-action-card">
                            <div className="quick-action-card__icon">📦</div>
                            <div className="quick-action-card__title">Track Orders</div>
                            <div className="quick-action-card__desc">See order status</div>
                        </Link>

                        <Link to="/customer/wishlist" className="quick-action-card">
                            <div className="quick-action-card__icon">❤️</div>
                            <div className="quick-action-card__title">View Wishlist</div>
                            <div className="quick-action-card__desc">Saved for later</div>
                        </Link>

                        <Link to="/customer/profile" className="quick-action-card">
                            <div className="quick-action-card__icon">👤</div>
                            <div className="quick-action-card__title">Edit Profile</div>
                            <div className="quick-action-card__desc">Update your info</div>
                        </Link>
                    </div>
                </div>

                {/* Become a Seller Section */}
                {!sellerRequest && (
                    <div className="customer-section">
                        <div className="seller-upgrade-card">
                            <div className="seller-upgrade-card__icon">🏪</div>
                            <div className="seller-upgrade-card__content">
                                <h3 className="seller-upgrade-card__title">Become a Seller</h3>
                                <p className="seller-upgrade-card__desc">
                                    Start selling on GuraNeza! Request seller access and manage your own products.
                                </p>
                                <Link to="/customer/seller-request" className="btn btn--primary">
                                    Request Seller Access
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {sellerRequest && sellerRequest.status === 'pending' && (
                    <div className="customer-section">
                        <div className="seller-upgrade-card seller-upgrade-card--pending">
                            <div className="seller-upgrade-card__icon">⏳</div>
                            <div className="seller-upgrade-card__content">
                                <h3 className="seller-upgrade-card__title">Seller Request Pending</h3>
                                <p className="seller-upgrade-card__desc">
                                    Your seller upgrade request is being reviewed by our admin team. You'll be notified once it's processed.
                                </p>
                                <div className="seller-request-info">
                                    <p><strong>Store Name:</strong> {sellerRequest.storeName}</p>
                                    <p><strong>Requested:</strong> {new Date(sellerRequest.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {sellerRequest && sellerRequest.status === 'approved' && (
                    <div className="customer-section">
                        <div className="seller-upgrade-card seller-upgrade-card--approved">
                            <div className="seller-upgrade-card__icon">✅</div>
                            <div className="seller-upgrade-card__content">
                                <h3 className="seller-upgrade-card__title">Congratulations!</h3>
                                <p className="seller-upgrade-card__desc">
                                    Your seller request has been approved! Please log out and log back in to access your seller dashboard.
                                </p>
                                <button
                                    className="btn btn--success"
                                    onClick={() => {
                                        localStorage.removeItem('token');
                                        window.location.href = '/login';
                                    }}
                                >
                                    Logout & Login Again
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {sellerRequest && sellerRequest.status === 'rejected' && (
                    <div className="customer-section">
                        <div className="seller-upgrade-card seller-upgrade-card--rejected">
                            <div className="seller-upgrade-card__icon">❌</div>
                            <div className="seller-upgrade-card__content">
                                <h3 className="seller-upgrade-card__title">Request Rejected</h3>
                                <p className="seller-upgrade-card__desc">
                                    Unfortunately, your seller request was not approved at this time.
                                </p>
                                <div className="seller-request-info">
                                    <p><strong>Reason:</strong> {sellerRequest.rejectionReason || 'No reason provided'}</p>
                                </div>
                                <Link to="/customer/seller-request" className="btn btn--primary">
                                    Submit New Request
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CustomerDashboard;
