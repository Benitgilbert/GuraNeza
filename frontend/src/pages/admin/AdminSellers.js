import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import './admin.css';

const AdminSellers = () => {
    const [sellers, setSellers] = useState([]);
    const [filteredSellers, setFilteredSellers] = useState([]);
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
        fetchSellers();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [sellers, searchTerm, statusFilter]);

    const fetchSellers = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/admin/sellers');

            if (response.data.success) {
                const sellerData = response.data.data || [];
                setSellers(Array.isArray(sellerData) ? sellerData : []);
            } else {
                setSellers([]);
                setError(response.data.message || 'Failed to load sellers');
            }
        } catch (err) {
            console.error('Error fetching sellers:', err);
            setSellers([]);
            if (err.response?.status !== 404) {
                setError(err.response?.data?.message || 'Failed to load sellers');
            }
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        if (!Array.isArray(sellers)) {
            setFilteredSellers([]);
            return;
        }

        let filtered = [...sellers];

        if (searchTerm) {
            filtered = filtered.filter(seller =>
                seller.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                seller.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(seller => seller.approvalStatus === statusFilter);
        }

        setFilteredSellers(filtered);
    };

    const handleStatusChange = async (sellerId, newStatus) => {
        try {
            setError('');
            setSuccess('');

            const response = await api.patch(`/admin/sellers/${sellerId}/status`, {
                approvalStatus: newStatus
            });

            if (response.data.success) {
                setSuccess(`Seller ${newStatus} successfully`);
                await fetchSellers();
            }
        } catch (err) {
            console.error('Error updating seller status:', err);
            setError(err.response?.data?.message || 'Failed to update seller status');
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'badge badge--success';
            case 'pending': return 'badge badge--warning';
            case 'blocked': return 'badge badge--danger';
            default: return 'badge';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <DashboardLayout menuItems={menuItems} title="Seller Management">
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
                        <label className="form-label">Search by Store Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search sellers..."
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
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card__header">
                    <h2 className="card__title">Sellers ({filteredSellers.length})</h2>
                </div>
                <div className="card__body">
                    {loading ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>Loading sellers...</p>
                        </div>
                    ) : filteredSellers.length === 0 ? (
                        <div className="alert alert--info" style={{ margin: 0 }}>
                            <strong>ℹ️ Info:</strong> No sellers found. The admin sellers API may not be implemented yet, or there are no sellers in the database.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Store Name</th>
                                        <th>Owner Email</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th>Joined Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSellers.map(seller => (
                                        <tr key={seller._id}>
                                            <td><strong>{seller.storeName}</strong></td>
                                            <td>{seller.userId?.email || 'N/A'}</td>
                                            <td>{seller.phone || 'N/A'}</td>
                                            <td>
                                                <span className={getStatusBadgeClass(seller.approvalStatus)}>
                                                    {seller.approvalStatus}
                                                </span>
                                            </td>
                                            <td>{formatDate(seller.createdAt)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    {seller.approvalStatus === 'pending' && (
                                                        <button
                                                            className="btn btn--sm btn--success"
                                                            onClick={() => handleStatusChange(seller._id, 'active')}
                                                        >
                                                            ✅ Approve
                                                        </button>
                                                    )}
                                                    {seller.approvalStatus === 'active' && (
                                                        <button
                                                            className="btn btn--sm btn--danger"
                                                            onClick={() => handleStatusChange(seller._id, 'blocked')}
                                                        >
                                                            🚫 Block
                                                        </button>
                                                    )}
                                                    {seller.approvalStatus === 'blocked' && (
                                                        <button
                                                            className="btn btn--sm btn--success"
                                                            onClick={() => handleStatusChange(seller._id, 'active')}
                                                        >
                                                            ✅ Activate
                                                        </button>
                                                    )}
                                                </div>
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

export default AdminSellers;
