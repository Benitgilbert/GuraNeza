import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import '../admin/admin.css';

const SellerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const menuItems = [
        { path: '/seller/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/seller/profile', icon: '🏪', label: 'My Profile' },
        { path: '/seller/products', icon: '📦', label: 'My Products' },
        { path: '/seller/orders', icon: '🛒', label: 'My Orders' },
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
            const response = await api.get('/seller/orders');

            if (response.data.success) {
                const orderData = response.data.data || [];
                setOrders(Array.isArray(orderData) ? orderData : []);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setOrders([]);
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
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        setFilteredOrders(filtered);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const day = date.getDate();
        const year = date.getFullYear().toString().slice(-2);
        return `${month} ${day}, '${year}`;
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

    const getMyItemsCount = (order) => {
        // In a real implementation, this would filter items belonging to this seller
        return order.items?.length || 0;
    };

    const getMyItemsTotal = (order) => {
        // In a real implementation, this would sum up only this seller's items
        return order.totalPrice || 0;
    };

    const updateShippingStatus = async (orderId, newStatus) => {
        try {
            const response = await api.patch(`/seller/orders/${orderId}/shipping-status`, {
                shippingStatus: newStatus
            });

            if (response.data.success) {
                setError('✅ Shipping status updated successfully!');
                setTimeout(() => setError(''), 3000);
                // Refresh orders
                fetchOrders();
            }
        } catch (err) {
            setError('❌ Failed to update shipping status');
            setTimeout(() => setError(''), 5000);
        }
    };

    return (
        <DashboardLayout menuItems={menuItems} title="My Orders">
            {error && (
                <div className="alert alert--info">
                    <strong>ℹ️ Note:</strong> {error}
                    <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
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
                    <h2 className="card__title">Orders Containing My Products ({filteredOrders.length})</h2>
                </div>
                <div className="card__body">
                    {loading ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>Loading orders...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="alert alert--info" style={{ margin: 0 }}>
                            <strong>ℹ️ Info:</strong> No orders found. Orders containing your products will appear here once customers make purchases.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table" style={{ minWidth: '900px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ minWidth: '80px' }}>Order ID</th>
                                        <th style={{ minWidth: '180px' }}>Customer</th>
                                        <th style={{ minWidth: '95px' }}>Date</th>
                                        <th style={{ minWidth: '80px', textAlign: 'center' }}>My Items</th>
                                        <th style={{ minWidth: '110px', textAlign: 'right' }}>My Revenue</th>
                                        <th style={{ minWidth: '90px', textAlign: 'center' }}>Payment</th>
                                        <th style={{ minWidth: '90px', textAlign: 'center' }}>Status</th>
                                        <th style={{ minWidth: '130px', textAlign: 'center' }}>Shipping</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(order => (
                                        <tr key={order._id}>
                                            <td style={{ whiteSpace: 'nowrap' }}>#{order._id?.slice(-6)}</td>
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={order.customerId?.email}>{order.customerId?.email || 'N/A'}</td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(order.createdAt)}</td>
                                            <td style={{ textAlign: 'center' }}>{getMyItemsCount(order)} items</td>
                                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}><strong>{formatCurrency(getMyItemsTotal(order))}</strong></td>
                                            <td>
                                                <span className={order.paymentStatus === 'PAID' ? 'badge badge--success' : 'badge badge--warning'}>
                                                    {order.paymentStatus || 'Pending'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={getStatusBadgeClass(order.orderStatus)}>
                                                    {order.orderStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <select
                                                    className="form-select form-select--sm"
                                                    value={order.shipping?.status || 'NOT_SHIPPED'}
                                                    onChange={(e) => updateShippingStatus(order._id, e.target.value)}
                                                    style={{ minWidth: '120px' }}
                                                >
                                                    <option value="NOT_SHIPPED">Not Shipped</option>
                                                    <option value="SHIPPED">Shipped</option>
                                                    <option value="IN_TRANSIT">In Transit</option>
                                                    <option value="DELIVERED">Delivered</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="alert alert--info mt-xl">
                <strong>ℹ️ Note:</strong> This page shows all orders that contain at least one of your products. The "My Items" and "My Revenue" columns show only the portion of each order that belongs to you.
            </div>
        </DashboardLayout>
    );
};

export default SellerOrders;
