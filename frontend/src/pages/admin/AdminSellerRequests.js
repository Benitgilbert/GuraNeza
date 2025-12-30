import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import '../admin/admin.css';
import '../admin/modal.css';

const AdminSellerRequests = () => {
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [rejectModal, setRejectModal] = useState({ show: false, requestId: null, reason: '' });

    const menuItems = [
        { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/admin/users', icon: '👥', label: 'Users' },
        { path: '/admin/sellers', icon: '🏪', label: 'Sellers' },
        { path: '/admin/seller-requests', icon: '📋', label: 'Seller Requests' },
        { path: '/admin/products', icon: '📦', label: 'Products' },
        { path: '/admin/orders', icon: '🛒', label: 'Orders' },
        { path: '/admin/shipping', icon: '🚚', label: 'Shipping' },
        { path: '/admin/reviews', icon: '⭐', label: 'Reviews' }
    ];

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        filterRequests();
    }, [statusFilter, searchTerm, requests]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/seller-requests');

            if (response.data.success) {
                setRequests(response.data.data);
                setStats(response.data.stats);
            }
        } catch (err) {
            setError('Failed to fetch seller requests');
            console.error('Error fetching requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterRequests = () => {
        let filtered = requests;

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(req => req.status === statusFilter);
        }

        // Search by email or store name
        if (searchTerm) {
            filtered = filtered.filter(req =>
                req.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.storeName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredRequests(filtered);
    };

    const handleApprove = async (requestId) => {
        if (!window.confirm('Are you sure you want to approve this seller request?')) {
            return;
        }

        try {
            const response = await api.put(`/admin/seller-requests/${requestId}/approve`);

            if (response.data.success) {
                setSuccess('Seller request approved successfully!');
                setTimeout(() => setSuccess(''), 3000);
                fetchRequests();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve request');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleReject = async () => {
        if (!rejectModal.reason.trim()) {
            setError('Please provide a rejection reason');
            return;
        }

        try {
            const response = await api.put(`/admin/seller-requests/${rejectModal.requestId}/reject`, {
                rejectionReason: rejectModal.reason
            });

            if (response.data.success) {
                setSuccess('Seller request rejected');
                setTimeout(() => setSuccess(''), 3000);
                setRejectModal({ show: false, requestId: null, reason: '' });
                fetchRequests();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject request');
            setTimeout(() => setError(''), 5000);
        }
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
        switch (status) {
            case 'pending': return 'badge badge--warning';
            case 'approved': return 'badge badge--success';
            case 'rejected': return 'badge badge--danger';
            default: return 'badge';
        }
    };

    return (
        <DashboardLayout menuItems={menuItems} title="Seller Requests">
            {error && (
                <div className="alert alert--danger">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {success && (
                <div className="alert alert--success">
                    <strong>Success:</strong> {success}
                </div>
            )}

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stats-card stats-card--warning">
                    <div className="stats-card__icon">⏳</div>
                    <div className="stats-card__content">
                        <p className="stats-card__label">Pending Requests</p>
                        <h3 className="stats-card__value">{stats.pending}</h3>
                    </div>
                </div>

                <div className="stats-card stats-card--success">
                    <div className="stats-card__icon">✅</div>
                    <div className="stats-card__content">
                        <p className="stats-card__label">Approved</p>
                        <h3 className="stats-card__value">{stats.approved}</h3>
                    </div>
                </div>

                <div className="stats-card stats-card--danger">
                    <div className="stats-card__icon">❌</div>
                    <div className="stats-card__content">
                        <p className="stats-card__label">Rejected</p>
                        <h3 className="stats-card__value">{stats.rejected}</h3>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <div className="filter-bar__grid">
                    <div className="form-group">
                        <label className="form-label">Search</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search by email or store name..."
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
                            <option value="all">All ({requests.length})</option>
                            <option value="pending">Pending ({stats.pending})</option>
                            <option value="approved">Approved ({stats.approved})</option>
                            <option value="rejected">Rejected ({stats.rejected})</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Requests Table */}
            <div className="card">
                <div className="card__header">
                    <h2 className="card__title">Seller Upgrade Requests ({filteredRequests.length})</h2>
                </div>
                <div className="card__body">
                    {loading ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>Loading requests...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="alert alert--info" style={{ margin: 0 }}>
                            <strong>ℹ️ Info:</strong> No seller requests found.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Store Name</th>
                                        <th>Phone</th>
                                        <th>Logo</th>
                                        <th>Requested</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.map(request => (
                                        <tr key={request._id}>
                                            <td>
                                                <div>{request.userId?.email || 'N/A'}</div>
                                                <small style={{ color: '#6b7280' }}>{request.userId?.name}</small>
                                            </td>
                                            <td>
                                                <strong>{request.storeName}</strong>
                                                <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '200px' }}>
                                                    {request.storeDescription.substring(0, 50)}...
                                                </div>
                                            </td>
                                            <td>{request.phone}</td>
                                            <td>
                                                {request.logoUrl ? (
                                                    <img
                                                        src={request.logoUrl}
                                                        alt="Logo"
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '8px',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                ) : (
                                                    <span style={{ color: '#9ca3af' }}>No logo</span>
                                                )}
                                            </td>
                                            <td>{formatDate(request.createdAt)}</td>
                                            <td>
                                                <span className={getStatusBadgeClass(request.status)}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td>
                                                {request.status === 'pending' ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            className="btn btn--sm btn--success"
                                                            onClick={() => handleApprove(request._id)}
                                                        >
                                                            ✓ Approve
                                                        </button>
                                                        <button
                                                            className="btn btn--sm btn--danger"
                                                            onClick={() => setRejectModal({
                                                                show: true,
                                                                requestId: request._id,
                                                                reason: ''
                                                            })}
                                                        >
                                                            ✕ Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                        {request.status === 'approved' && '✓ Approved'}
                                                        {request.status === 'rejected' && (
                                                            <span title={request.rejectionReason}>
                                                                ✕ Rejected
                                                            </span>
                                                        )}
                                                        <div>{formatDate(request.processedAt)}</div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Reject Modal */}
            {rejectModal.show && (
                <div className="modal-overlay" onClick={() => setRejectModal({ show: false, requestId: null, reason: '' })}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal__header">
                            <h3 className="modal__title">Reject Seller Request</h3>
                            <button
                                className="modal__close"
                                onClick={() => setRejectModal({ show: false, requestId: null, reason: '' })}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal__body">
                            <div className="form-group">
                                <label className="form-label">Rejection Reason *</label>
                                <textarea
                                    className="form-textarea"
                                    rows={4}
                                    value={rejectModal.reason}
                                    onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                                    placeholder="Explain why this request is being rejected..."
                                    required
                                />
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button
                                className="btn btn--secondary"
                                onClick={() => setRejectModal({ show: false, requestId: null, reason: '' })}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn--danger"
                                onClick={handleReject}
                            >
                                Reject Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default AdminSellerRequests;
