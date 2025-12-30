import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import '../admin/admin.css';

const SellerProfile = () => {
    const [profile, setProfile] = useState({
        storeName: '',
        description: '',
        phone: '',
        approvalStatus: 'pending'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const menuItems = [
        { path: '/seller/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/seller/profile', icon: '🏪', label: 'My Profile' },
        { path: '/seller/products', icon: '📦', label: 'My Products' },
        { path: '/seller/orders', icon: '🛒', label: 'My Orders' },
    ];

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/seller/profile');

            if (response.data.success) {
                setProfile(response.data.data || {});
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError(err.response?.data?.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const response = await api.put('/seller/profile', {
                storeName: profile.storeName,
                description: profile.description,
                phone: profile.phone
            });

            if (response.data.success) {
                setSuccess('Profile updated successfully!');
                setProfile(response.data.data);
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
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

    return (
        <DashboardLayout menuItems={menuItems} title="My Profile">
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

            {loading ? (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            ) : (
                <div className="card">
                    <div className="card__header">
                        <h2 className="card__title">Store Information</h2>
                        <span className={getStatusBadgeClass(profile.approvalStatus)}>
                            {profile.approvalStatus?.toUpperCase() || 'PENDING'}
                        </span>
                    </div>
                    <div className="card__body">
                        {profile.approvalStatus === 'pending' && (
                            <div className="alert alert--warning">
                                <strong>⏳ Pending Approval:</strong> Your seller account is awaiting admin approval. You can edit your profile, but you won't be able to sell products until approved.
                            </div>
                        )}

                        {profile.approvalStatus === 'blocked' && (
                            <div className="alert alert--danger">
                                <strong>🚫 Account Blocked:</strong> Your seller account has been blocked. Please contact support for more information.
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Store Name *</label>
                                <input
                                    type="text"
                                    name="storeName"
                                    className="form-input"
                                    value={profile.storeName || ''}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter your store name"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Store Description</label>
                                <textarea
                                    name="description"
                                    className="form-textarea"
                                    value={profile.description || ''}
                                    onChange={handleChange}
                                    placeholder="Describe your store and what you sell"
                                    rows="4"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone Number *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-input"
                                    value={profile.phone || ''}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter your contact phone number"
                                />
                            </div>

                            <div className="form-group">
                                <button
                                    type="submit"
                                    className="btn btn--primary"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default SellerProfile;
