import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import './admin.css';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

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
        fetchOrders();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [orders, searchTerm, statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/admin/orders');

            if (response.data.success) {
                const orderData = response.data.data || [];
                setOrders(Array.isArray(orderData) ? orderData : []);
            } else {
                setOrders([]);
                setError(response.data.message || 'Failed to load orders');
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setOrders([]);
            if (err.response?.status !== 404) {
                setError(err.response?.data?.message || 'Failed to load orders');
            }
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        if (!Array.isArray(orders)) {
            setFilteredOrders([]);
            return;
        }

        let filtered = [...orders];

        if (searchTerm) {
            filtered = filtered.filter(order =>
                order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customerId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => order.orderStatus === statusFilter);
        }

        setFilteredOrders(filtered);
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            setError('');
            setSuccess('');

            const response = await api.put(`/admin/orders/${orderId}/status`, {
                status: newStatus
            });

            if (response.data.success) {
                setSuccess(`Order status updated to ${newStatus}`);
                await fetchOrders();
            }
        } catch (err) {
            console.error('Error updating order status:', err);
            setError(err.response?.data?.message || 'Failed to update order status');
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
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
        <DashboardLayout menuItems={menuItems} title="Order Management">
            {error && (
                <div className="alert alert--info">
                    <strong>ℹ️ Note:</strong> {error}
                    <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {success && (
                <div className="alert alert--success">
                    <strong>Success:</strong> {success}
                    <button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            <div className="filter-bar">
                <div className="filter-bar__grid">
                    <div className="form-group">
                        <label className="form-label">Search by Order ID or Email</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Filter by Status</label>
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="PAID">Paid</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card__header">
                    <h2 className="card__title">Orders ({filteredOrders.length})</h2>
                </div>
                <div className="card__body">
                    {loading ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>Loading orders...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="alert alert--info" style={{ margin: 0 }}>
                            <strong>ℹ️ Info:</strong> No orders found. The admin orders API may not be implemented yet, or there are no orders in the database.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Date</th>
                                        <th>Total</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(order => (
                                        <tr key={order._id}>
                                            <td>#{order._id?.slice(-6)}</td>
                                            <td>{order.customerId?.email || 'N/A'}</td>
                                            <td>{formatDate(order.createdAt)}</td>
                                            <td><strong>{formatCurrency(order.totalPrice)}</strong></td>
                                            <td>{order.paymentMethod || 'N/A'}</td>
                                            <td>
                                                <select
                                                    className={`form-select ${getStatusBadgeClass(order.orderStatus)}`}
                                                    style={{ width: 'auto', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                                    value={order.orderStatus}
                                                    onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                                >
                                                    <option value="PENDING">Pending</option>
                                                    <option value="PAID">Paid</option>
                                                    <option value="SHIPPED">Shipped</option>
                                                    <option value="DELIVERED">Delivered</option>
                                                    <option value="CANCELLED">Cancelled</option>
                                                </select>
                                            </td>
                                            <td>
                                                <Link
                                                    to={`/admin/orders/${order._id}`}
                                                    className="btn btn--sm btn--secondary"
                                                >
                                                    👁️ View Details
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
        </DashboardLayout>
    );
};

export default AdminOrders;
