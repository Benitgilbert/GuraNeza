import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import { getUser } from '../../utils/auth';
import './customer.css';

const CustomerSettings = () => {
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const user = getUser();

    const menuItems = [
        { path: '/customer/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/customer/profile', icon: '👤', label: 'My Profile' },
        { path: '/customer/orders', icon: '📦', label: 'My Orders' },
        { path: '/customer/wishlist', icon: '❤️', label: 'Wishlist' },
        { path: '/customer/addresses', icon: '📍', label: 'Addresses' },
        { path: '/customer/settings', icon: '⚙️', label: 'Settings' }
    ];

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwords.newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
            return;
        }

        setLoading(true);

        try {
            await api.put('/auth/change-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });

            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswords({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to change password'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout menuItems={menuItems} title="Settings">
            <div className="customer-settings">
                {message.text && (
                    <div className={`alert alert--${message.type}`}>{message.text}</div>
                )}

                {/* Account Information */}
                <div className="settings-section">
                    <h3 className="settings-section__title">Account Information</h3>
                    <div className="settings-info">
                        <div className="settings-info__row">
                            <span className="settings-info__label">Email:</span>
                            <span className="settings-info__value">{user?.email}</span>
                        </div>
                        <div className="settings-info__row">
                            <span className="settings-info__label">Role:</span>
                            <span className="settings-info__value">
                                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                            </span>
                        </div>
                        <div className="settings-info__row">
                            <span className="settings-info__label">Account Status:</span>
                            <span className={`badge badge--${user?.status === 'active' ? 'success' : 'error'}`}>
                                {user?.status?.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Change Password */}
                {!user?.googleId && (
                    <div className="settings-section">
                        <h3 className="settings-section__title">Change Password</h3>
                        <form onSubmit={handlePasswordSubmit} className="settings-form">
                            <div className="form-group">
                                <label htmlFor="currentPassword" className="form-label">
                                    Current Password *
                                </label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    name="currentPassword"
                                    value={passwords.currentPassword}
                                    onChange={handlePasswordChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="newPassword" className="form-label">
                                    New Password *
                                </label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    name="newPassword"
                                    value={passwords.newPassword}
                                    onChange={handlePasswordChange}
                                    className="form-input"
                                    minLength="8"
                                    required
                                />
                                <span className="form-hint">
                                    Must be at least 8 characters with uppercase, lowercase, number, and special character
                                </span>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword" className="form-label">
                                    Confirm New Password *
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={passwords.confirmPassword}
                                    onChange={handlePasswordChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn--primary"
                                disabled={loading}
                            >
                                {loading ? 'Changing Password...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                )}

                {user?.googleId && (
                    <div className="settings-section">
                        <div className="alert alert--info">
                            You are signed in with Google. Password changes are managed through your Google account.
                        </div>
                    </div>
                )}

                {/* Email Preferences (Placeholder) */}
                <div className="settings-section">
                    <h3 className="settings-section__title">Email Preferences</h3>
                    <div className="settings-preferences">
                        <label className="preference-item">
                            <input type="checkbox" defaultChecked disabled />
                            <div>
                                <div className="preference-item__title">Order Updates</div>
                                <div className="preference-item__desc">Receive emails about your order status</div>
                            </div>
                        </label>

                        <label className="preference-item">
                            <input type="checkbox" defaultChecked disabled />
                            <div>
                                <div className="preference-item__title">Promotional Emails</div>
                                <div className="preference-item__desc">Get notified about deals and offers</div>
                            </div>
                        </label>

                        <p className="settings-note">
                            <em>Email preferences coming soon</em>
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CustomerSettings;
