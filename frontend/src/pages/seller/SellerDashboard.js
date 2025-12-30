import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import '../admin/admin.css';

const SellerDashboard = () => {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        revenue: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const menuItems = [
        { path: '/seller/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/seller/profile', icon: '🏪', label: 'My Profile' },
        { path: '/seller/products', icon: '📦', label: 'My Products' },
        { path: '/seller/orders', icon: '🛒', label: 'My Orders' },
    ];

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Try to fetch seller statistics
            try {
                const statsResponse = await api.get('/seller/stats');
                if (statsResponse.data.success) {
                    setStats(statsResponse.data.data);
                }
            } catch (statsErr) {
                console.log('Seller stats API not available yet');
            }

            // Try to fetch recent orders
            try {
                const ordersResponse = await api.get('/seller/orders?limit=5');
                if (ordersResponse.data.success) {
                    setRecentOrders(ordersResponse.data.data || []);
                }
            } catch (ordersErr) {
                console.log('Seller orders API not available yet');
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Some seller APIs are not implemented yet. The dashboard will show default values.');
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
        <DashboardLayout menuItems={menuItems} title="Seller Dashboard">
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
                            <div className="stats-card__icon">📦</div>
                            <div className="stats-card__content">
                                <p className="stats-card__label">Total Products</p>
                                <h3 className="stats-card__value">{stats.totalProducts}</h3>
                            </div>
                            <Link to="/seller/products" className="stats-card__link">
                                Manage Products →
                            </Link>
                        </div>

                        <div className="stats-card stats-card--success">
                            <div className="stats-card__icon">🛒</div>
                            <div className="stats-card__content">
                                <p className="stats-card__label">Total Orders</p>
                                <h3 className="stats-card__value">{stats.totalOrders}</h3>
                            </div>
                            <Link to="/seller/orders" className="stats-card__link">
                                View Orders →
                            </Link>
                        </div>

                        <div className="stats-card stats-card--warning">
                            <div className="stats-card__icon">⏳</div>
                            <div className="stats-card__content">
                                <p className="stats-card__label">Pending Orders</p>
                                <h3 className="stats-card__value">{stats.pendingOrders}</h3>
                            </div>
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
                            <Link to="/seller/orders" className="btn btn--sm btn--primary">
                                View All Orders
                            </Link>
                        </div>
                        <div className="card__body">
                            {recentOrders.length === 0 ? (
                                <div className="alert alert--info" style={{ margin: 0 }}>
                                    <strong>ℹ️ Info:</strong> No orders found. Orders containing your products will appear here.
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Customer</th>
                                                <th>Date</th>
                                                <th>Items</th>
                                                <th>Total</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentOrders.map(order => (
                                                <tr key={order._id}>
                                                    <td>#{order._id?.slice(-6)}</td>
                                                    <td>{order.userId?.email || 'N/A'}</td>
                                                    <td>{formatDate(order.createdAt)}</td>
                                                    <td>{order.items?.length || 0} items</td>
                                                    <td>{formatCurrency(order.totalPrice)}</td>
                                                    <td>
                                                        <span className={getStatusBadgeClass(order.status)}>
                                                            {order.status}
                                                        </span>
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

export default SellerDashboard;
