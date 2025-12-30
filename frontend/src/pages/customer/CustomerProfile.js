import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import './customer.css';

const CustomerProfile = () => {
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'Rwanda'
        }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const menuItems = [
        { path: '/customer/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/customer/profile', icon: '👤', label: 'My Profile' },
        { path: '/customer/orders', icon: '📦', label: 'My Orders' },
        { path: '/customer/wishlist', icon: '❤️', label: 'Wishlist' },
        { path: '/customer/addresses', icon: '📍', label: 'Addresses' },
        { path: '/customer/settings', icon: '⚙️', label: 'Settings' }
    ];

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/me');
            const userData = response.data.data.user;

            setProfile({
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                phone: userData.phone || '',
                dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
                address: {
                    street: userData.address?.street || '',
                    city: userData.address?.city || '',
                    state: userData.address?.state || ''
                }
            });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setProfile(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressField]: value
                }
            }));
        } else {
            setProfile(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await api.put('/auth/profile', profile);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update profile'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout menuItems={menuItems} title="My Profile">
                <div className="customer-loading">
                    <div className="spinner spinner--lg"></div>
                    <p>Loading profile...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout menuItems={menuItems} title="My Profile">
            <div className="customer-profile">
                <form onSubmit={handleSubmit} className="profile-form">
                    {message.text && (
                        <div className={`alert alert--${message.type}`}>{message.text}</div>
                    )}

                    <div className="profile-form__section">
                        <h3 className="profile-form__heading">Personal Information</h3>

                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="firstName" className="form-label">First Name</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={profile.firstName}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Enter your first name"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName" className="form-label">Last Name</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={profile.lastName}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Enter your last name"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email" className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={profile.email}
                                    className="form-input"
                                    disabled
                                />
                                <span className="form-hint">Email cannot be changed</span>
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone" className="form-label">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="e.g., 0781234567"
                                    pattern="[0-9]{10,15}"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="dateOfBirth" className="form-label">Date of Birth</label>
                                <input
                                    type="date"
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    value={profile.dateOfBirth}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="profile-form__section">
                        <h3 className="profile-form__heading">Address Information</h3>

                        <div className="form-grid">
                            <div className="form-group form-group--full">
                                <label htmlFor="address.street" className="form-label">Street Address</label>
                                <input
                                    type="text"
                                    id="address.street"
                                    name="address.street"
                                    value={profile.address.street}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Enter your street address"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="address.city" className="form-label">City</label>
                                <input
                                    type="text"
                                    id="address.city"
                                    name="address.city"
                                    value={profile.address.city}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="e.g., Kigali"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="address.state" className="form-label">Province/District</label>
                                <input
                                    type="text"
                                    id="address.state"
                                    name="address.state"
                                    value={profile.address.state}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="e.g., Kigali City, Eastern Province"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="profile-form__actions">
                        <button
                            type="submit"
                            className="btn btn--primary btn--lg"
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default CustomerProfile;
