import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import './admin.css';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const menuItems = [
        { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/admin/users', icon: '👥', label: 'Users' },
        { path: '/admin/sellers', icon: '🏪', label: 'Sellers' },
        { path: '/admin/seller-requests', icon: '📋', label: 'Seller Requests' },
        { path: '/admin/products', icon: '📦', label: 'Products' },
        { path: '/admin/orders', icon: '🛒', label: 'Orders' },
        { path: '/admin/shipping', icon: '🚚', label: 'Shipping' },
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [users, searchTerm, roleFilter, statusFilter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/admin/users');

            if (response.data.success) {
                // Ensure we always set an array
                const userData = response.data.data || [];
                setUsers(Array.isArray(userData) ? userData : []);
            } else {
                setUsers([]);
                setError(response.data.message || 'Failed to load users');
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            setUsers([]); // Ensure users is always an array even on error
            if (err.response?.status !== 404) {
                setError(err.response?.data?.message || 'Failed to load users');
            }
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        // Safety check: ensure users is always an array
        if (!Array.isArray(users)) {
            setFilteredUsers([]);
            return;
        }

        let filtered = [...users];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(user => user.status === statusFilter);
        }

        setFilteredUsers(filtered);
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            setError('');
            setSuccess('');

            const response = await api.patch(`/admin/users/${userId}/role`, {
                role: newRole
            });

            if (response.data.success) {
                setSuccess(`User role updated to ${newRole} successfully`);
                await fetchUsers();
            }
        } catch (err) {
            console.error('Error updating role:', err);
            setError(err.response?.data?.message || 'Failed to update user role');
        }
    };

    const handleStatusToggle = async (userId, currentStatus) => {
        try {
            setError('');
            setSuccess('');

            const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
            const response = await api.patch(`/admin/users/${userId}/status`, {
                status: newStatus
            });

            if (response.data.success) {
                setSuccess(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
                await fetchUsers();
            }
        } catch (err) {
            console.error('Error updating status:', err);
            setError(err.response?.data?.message || 'Failed to update user status');
        }
    };

    const getRoleBadgeClass = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin': return 'badge badge--danger';
            case 'seller': return 'badge badge--info';
            case 'customer': return 'badge badge--success';
            default: return 'badge';
        }
    };

    const getStatusBadgeClass = (status) => {
        return status === 'active' ? 'badge badge--success' : 'badge badge--danger';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <DashboardLayout menuItems={menuItems} title="User Management">
            {/* Alerts */}
            {error && (
                <div className="alert alert--info">
                    <strong>ℹ️ Note:</strong> {error}
                    <button
                        onClick={() => setError('')}
                        style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {success && (
                <div className="alert alert--success">
                    <strong>Success:</strong> {success}
                    <button
                        onClick={() => setSuccess('')}
                        style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-bar__grid">
                    <div className="form-group">
                        <label className="form-label">Search by Email</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Filter by Role</label>
                        <select
                            className="form-select"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="all">All Roles</option>
                            <option value="customer">Customer</option>
                            <option value="seller">Seller</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Filter by Status</label>
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="card">
                <div className="card__header">
                    <h2 className="card__title">
                        Users ({filteredUsers.length})
                    </h2>
                </div>
                <div className="card__body">
                    {loading ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>Loading users...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="alert alert--info" style={{ margin: 0 }}>
                            <strong>ℹ️ Info:</strong> No users found. The admin users API may not be implemented yet, or there are no users matching your criteria.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Joined Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user._id}>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={getRoleBadgeClass(user.role)}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={getStatusBadgeClass(user.status)}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td>{formatDate(user.createdAt)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    {/* Role Change */}
                                                    <select
                                                        className="form-select"
                                                        style={{ width: 'auto', fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                    >
                                                        <option value="customer">Customer</option>
                                                        <option value="seller">Seller</option>
                                                        <option value="admin">Admin</option>
                                                    </select>

                                                    {/* Status Toggle */}
                                                    <button
                                                        className={`btn btn--sm ${user.status === 'active' ? 'btn--danger' : 'btn--success'}`}
                                                        onClick={() => handleStatusToggle(user._id, user.status)}
                                                    >
                                                        {user.status === 'active' ? '🚫 Block' : '✅ Activate'}
                                                    </button>
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

export default AdminUsers;
