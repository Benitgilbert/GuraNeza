import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import './admin.css';

const AdminOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get(`/admin/orders/${id}`);

            if (response.data.success) {
                setOrder(response.data.data);
            } else {
                setError('Order not found');
            }
        } catch (err) {
            console.error('Error fetching order details:', err);
            setError(err.response?.data?.message || 'Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            setError('');
            setSuccess('');

            const response = await api.put(`/admin/orders/${id}/status`, {
                status: newStatus
            });

            if (response.data.success) {
                setSuccess('Order status updated successfully');
                await fetchOrderDetails();
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
            month: 'long',
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

    if (loading) {
        return (
            <DashboardLayout menuItems={menuItems} title="Order Details">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading order details...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error && !order) {
        return (
            <DashboardLayout menuItems={menuItems} title="Order Details">
                <div className="alert alert--danger">
                    <strong>Error:</strong> {error}
                </div>
                <button className="btn btn--secondary" onClick={() => navigate('/admin/orders')}>
                    ← Back to Orders
                </button>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout menuItems={menuItems} title={`Order #${order?._id?.slice(-6)}`}>
            {error && (
                <div className="alert alert--danger">
                    <strong>Error:</strong> {error}
                    <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {success && (
                <div className="alert alert--success">
                    <strong>Success:</strong> {success}
                    <button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
                <button className="btn btn--secondary" onClick={() => navigate('/admin/orders')}>
                    ← Back to Orders
                </button>
            </div>

            {/* Order Summary */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card__header">
                    <h2 className="card__title">Order Summary</h2>
                </div>
                <div className="card__body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Order ID</p>
                            <p style={{ fontWeight: '600', margin: 0 }}>#{order._id}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Order Date</p>
                            <p style={{ fontWeight: '600', margin: 0 }}>{formatDate(order.createdAt)}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Customer</p>
                            <p style={{ fontWeight: '600', margin: 0 }}>{order.customerId?.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Amount</p>
                            <p style={{ fontWeight: '700', fontSize: '1.25rem', color: '#6366f1', margin: 0 }}>{formatCurrency(order.totalPrice)}</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid #f3f4f6' }}>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Payment Method</p>
                            <p style={{ fontWeight: '600', margin: 0 }}>{order.paymentMethod}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Payment Status</p>
                            <span className={getStatusBadgeClass(order.paymentStatus)}>{order.paymentStatus}</span>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Order Status</p>
                            <select
                                className="form-select form-select--sm"
                                value={order.orderStatus}
                                onChange={(e) => handleStatusUpdate(e.target.value)}
                                style={{ maxWidth: '200px' }}
                            >
                                <option value="PENDING">PENDING</option>
                                <option value="PAID">PAID</option>
                                <option value="SHIPPED">SHIPPED</option>
                                <option value="DELIVERED">DELIVERED</option>
                                <option value="CANCELLED">CANCELLED</option>
                            </select>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Shipping Status</p>
                            <span className={getStatusBadgeClass(order.shipping?.status)}>{order.shipping?.status || 'NOT_SHIPPED'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shipping Details */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card__header">
                    <h2 className="card__title">Shipping Details</h2>
                </div>
                <div className="card__body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Full Name</p>
                            <p style={{ fontWeight: '600', margin: 0 }}>{order.shipping?.fullName}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Phone</p>
                            <p style={{ fontWeight: '600', margin: 0 }}>{order.shipping?.phone}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>City</p>
                            <p style={{ fontWeight: '600', margin: 0 }}>{order.shipping?.city}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Address</p>
                            <p style={{ fontWeight: '600', margin: 0 }}>{order.shipping?.addressLine}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="card">
                <div className="card__header">
                    <h2 className="card__title">Order Items ({order.items?.length || 0})</h2>
                </div>
                <div className="card__body">
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Seller</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items?.map((item, index) => (
                                    <tr key={index}>
                                        <td>
                                            <strong>{item.productId?.name || 'Product Deleted'}</strong>
                                        </td>
                                        <td>{item.sellerId?.storeName || item.sellerId?.email || 'N/A'}</td>
                                        <td>{formatCurrency(item.priceAtPurchase)}</td>
                                        <td>{item.quantity}</td>
                                        <td><strong>{formatCurrency(item.priceAtPurchase * item.quantity)}</strong></td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ borderTop: '2px solid #e5e7eb' }}>
                                    <td colSpan="4" style={{ textAlign: 'right', fontWeight: '700' }}>Subtotal:</td>
                                    <td><strong>{formatCurrency(order.totalPrice - (order.shipping?.fee || 0))}</strong></td>
                                </tr>
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'right', fontWeight: '700' }}>Shipping Fee:</td>
                                    <td><strong>{formatCurrency(order.shipping?.fee || 0)}</strong></td>
                                </tr>
                                <tr style={{ borderTop: '2px solid #e5e7eb' }}>
                                    <td colSpan="4" style={{ textAlign: 'right', fontWeight: '800', fontSize: '1.125rem' }}>Total:</td>
                                    <td style={{ fontSize: '1.25rem', color: '#6366f1' }}><strong>{formatCurrency(order.totalPrice)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminOrderDetail;
