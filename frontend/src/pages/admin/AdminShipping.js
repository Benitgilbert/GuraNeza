import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import './admin.css';

const AdminShipping = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        city: '',
        fee: '',
        isDefault: false,
        isActive: true
    });

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
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/shipping/settings');
            if (response.data.success) {
                setSettings(response.data.data.settings || []);
            }
        } catch (err) {
            console.error('Error fetching shipping settings:', err);
            setError(err.response?.data?.message || 'Failed to load shipping settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const data = {
                ...formData,
                fee: Number(formData.fee)
            };

            let response;
            if (editingId) {
                response = await api.put(`/shipping/settings/${editingId}`, data);
            } else {
                response = await api.post('/shipping/settings', data);
            }

            if (response.data.success) {
                setSuccess(editingId ? 'Shipping rate updated' : 'Shipping rate created');
                setShowForm(false);
                setEditingId(null);
                setFormData({ city: '', fee: '', isDefault: false, isActive: true });
                fetchSettings();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save shipping rate');
        }
    };

    const handleEdit = (setting) => {
        setEditingId(setting._id);
        setFormData({
            city: setting.city,
            fee: setting.fee,
            isDefault: setting.isDefault,
            isActive: setting.isActive
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this shipping rate?')) {
            return;
        }

        try {
            const response = await api.delete(`/shipping/settings/${id}`);
            if (response.data.success) {
                setSuccess('Shipping rate deleted');
                fetchSettings();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete shipping rate');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ city: '', fee: '', isDefault: false, isActive: true });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <DashboardLayout menuItems={menuItems} title="Shipping Settings">
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

            <div className="actions-bar">
                {!showForm && (
                    <button className="btn btn--primary" onClick={() => setShowForm(true)}>
                        ➕ Add New Rate
                    </button>
                )}
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div className="card__header">
                        <h2 className="card__title">{editingId ? 'Edit Shipping Rate' : 'Add New Shipping Rate'}</h2>
                    </div>
                    <div className="card__body">
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">City Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        required
                                        placeholder="e.g., Kigali"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Shipping Fee (RWF) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.fee}
                                        onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                                        required
                                        min="0"
                                        step="100"
                                        placeholder="2000"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={formData.isDefault}
                                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                        />
                                        <span>Set as Default (for unlisted cities)</span>
                                    </label>
                                </div>

                                <div className="form-group">
                                    <label className="form-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <span>Active</span>
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="submit" className="btn btn--primary">
                                    {editingId ? 'Update Rate' : 'Create Rate'}
                                </button>
                                <button type="button" className="btn btn--secondary" onClick={handleCancel}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card__header">
                    <h2 className="card__title">Shipping Rates ({settings.length})</h2>
                </div>
                <div className="card__body">
                    {loading ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>Loading shipping rates...</p>
                        </div>
                    ) : settings.length === 0 ? (
                        <div className="alert alert--info" style={{ margin: 0 }}>
                            <strong>ℹ️ Info:</strong> No shipping rates found. Click "Add New Rate" to create one.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>City</th>
                                        <th>Shipping Fee</th>
                                        <th>Default</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {settings.map(setting => (
                                        <tr key={setting._id}>
                                            <td><strong>{setting.city}</strong></td>
                                            <td>{formatCurrency(setting.fee)}</td>
                                            <td>
                                                {setting.isDefault && (
                                                    <span className="badge badge--primary">Default</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={setting.isActive ? 'badge badge--success' : 'badge badge--secondary'}>
                                                    {setting.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        className="btn btn--sm btn--primary"
                                                        onClick={() => handleEdit(setting)}
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        className="btn btn--sm btn--danger"
                                                        onClick={() => handleDelete(setting._id)}
                                                        disabled={setting.isDefault}
                                                    >
                                                        🗑️ Delete
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

export default AdminShipping;
