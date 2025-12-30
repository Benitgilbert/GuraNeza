import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import './admin.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalSellers: 0,
        totalProducts: 0,
        totalOrders: 0,
        revenue: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const menuItems = [
        { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/admin/users', icon: '👥', label: 'Users' },
        { path: '/admin/sellers', icon: '🏪', label: 'Sellers' },
        { path: '/admin/seller-requests', icon: '📋', label: 'Seller Requests' },
        { path: '/admin/products', icon: '📦', label: 'Products' },
        { path: '/admin/orders', icon: '🛒', label: 'Orders' },
        { path: '/admin/shipping', icon: '🚚', label: 'Shipping' },
        { path: '/admin/reviews', icon: '⭐', label: 'Reviews' },
    ];

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Try to fetch statistics
            try {
                const statsResponse = await api.get('/admin/stats');
                if (statsResponse.data.success) {
                    setStats(statsResponse.data.data);
                }
            } catch (statsErr) {
                console.log('Stats API not available yet');
                // Keep default zero stats
            }

            // Try to fetch recent orders
            try {
                const ordersResponse = await api.get('/admin/orders?limit=5');
                if (ordersResponse.data.success) {
                    setRecentOrders(ordersResponse.data.data || []);
                }
            } catch (ordersErr) {
                console.log('Orders API not available yet');
                // Keep empty orders array
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Some admin APIs are not implemented yet. The dashboard will show default values.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'badge badge--warning';
            case 'paid': return 'badge badge--success';
            case 'shipped': return 'badge badge--info';
            case 'delivered': return 'badge badge--success';
            case 'cancelled': return 'badge badge--danger';
            default: return 'badge';
        }
    };

    return (
        <DashboardLayout menuItems={menuItems} title="Admin Dashboard">
            {loading ? (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            ) : (
                <>
                    {error && (
                        <div className="alert alert--info">
                            <strong>ℹ️ Info:</strong> {error}
                        </div>
                    )}

                    {/* Statistics Cards */}
                    <div className="stats-grid">
                        <div className="stats-card stats-card--primary">
                            <div className="stats-card__icon">👥</div>
                            <div className="stats-card__content">
                                <p className="stats-card__label">Total Users</p>
                                <h3 className="stats-card__value">{stats.totalUsers}</h3>
                            </div>
                            <Link to="/admin/users" className="stats-card__link">
                                View All →
                            </Link>
                        </div>

                        <div className="stats-card stats-card--success">
                            <div className="stats-card__icon">🏪</div>
                            <div className="stats-card__content">
                                <p className="stats-card__label">Total Sellers</p>
                                <h3 className="stats-card__value">{stats.totalSellers}</h3>
                            </div>
                            <Link to="/admin/sellers" className="stats-card__link">
                                View All →
                            </Link>
                        </div>

                        <div className="stats-card stats-card--info">
                            <div className="stats-card__icon">📦</div>
                            <div className="stats-card__content">
                                <p className="stats-card__label">Total Products</p>
                                <h3 className="stats-card__value">{stats.totalProducts}</h3>
                            </div>
                            <Link to="/admin/products" className="stats-card__link">
                                View All →
                            </Link>
                        </div>

                        <div className="stats-card stats-card--warning">
                            <div className="stats-card__icon">🛒</div>
                            <div className="stats-card__content">
                                <p className="stats-card__label">Total Orders</p>
                                <h3 className="stats-card__value">{stats.totalOrders}</h3>
                            </div>
                            <Link to="/admin/orders" className="stats-card__link">
                                View All →
                            </Link>
                        </div>

                        <div className="stats-card stats-card--purple">
                            <div className="stats-card__icon">💰</div>
                            <div className="stats-card__content">
                                <p className="stats-card__label">Total Revenue</p>
                                <h3 className="stats-card__value">{formatCurrency(stats.revenue)}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="card mt-xl">
                        <div className="card__header">
                            <h2 className="card__title">Recent Orders</h2>
                            <Link to="/admin/orders" className="btn btn--sm btn--primary">
                                View All Orders
                            </Link>
                        </div>
                        <div className="card__body">
                            {recentOrders.length === 0 ? (
                                <p className="text-center text-muted">No orders found</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Customer</th>
                                                <th>Date</th>
                                                <th>Total</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentOrders.map(order => (
                                                <tr key={order._id}>
                                                    <td>#{order._id.slice(-6)}</td>
                                                    <td>{order.customerId?.email || 'N/A'}</td>
                                                    <td>{formatDate(order.createdAt)}</td>
                                                    <td>{formatCurrency(order.totalPrice)}</td>
                                                    <td>
                                                        <span className={getStatusBadgeClass(order.orderStatus)}>
                                                            {order.orderStatus}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <Link
                                                            to={`/admin/orders/${order._id}`}
                                                            className="btn btn--sm btn--secondary"
                                                        >
                                                            View
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </DashboardLayout>
    );
};

export default AdminDashboard;
