import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import './customer.css';

const CustomerAddresses = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        label: 'Home',
        isDefault: false
    });

    const menuItems = [
        { path: '/customer/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/customer/profile', icon: '👤', label: 'My Profile' },
        { path: '/customer/orders', icon: '📦', label: 'My Orders' },
        { path: '/customer/wishlist', icon: '❤️', label: 'Wishlist' },
        { path: '/customer/addresses', icon: '📍', label: 'Addresses' },
        { path: '/customer/settings', icon: '⚙️', label: 'Settings' }
    ];

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const response = await api.get('/addresses');
            setAddresses(response.data.data.addresses || []);
        } catch (error) {
            console.error('Error fetching addresses:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            fullName: '',
            phone: '',
            street: '',
            city: '',
            state: '',
            label: 'Home',
            isDefault: false
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        try {
            if (editingId) {
                await api.put(`/addresses/${editingId}`, formData);
                setMessage({ type: 'success', text: 'Address updated successfully!' });
            } else {
                await api.post('/addresses', formData);
                setMessage({ type: 'success', text: 'Address added successfully!' });
            }

            fetchAddresses();
            resetForm();
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to save address'
            });
        }
    };

    const handleEdit = (address) => {
        setFormData({
            fullName: address.fullName,
            phone: address.phone,
            street: address.street,
            city: address.city,
            state: address.state || '',
            label: address.label,
            isDefault: address.isDefault
        });
        setEditingId(address._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;

        try {
            await api.delete(`/addresses/${id}`);
            setMessage({ type: 'success', text: 'Address deleted successfully!' });
            fetchAddresses();
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete address' });
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await api.patch(`/addresses/${id}/default`);
            setMessage({ type: 'success', text: 'Default address updated!' });
            fetchAddresses();
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to set default address' });
        }
    };

    if (loading) {
        return (
            <DashboardLayout menuItems={menuItems} title="My Addresses">
                <div className="customer-loading">
                    <div className="spinner spinner--lg"></div>
                    <p>Loading addresses...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout menuItems={menuItems} title="My Addresses">
            <div className="customer-addresses">
                {message.text && (
                    <div className={`alert alert--${message.type}`}>{message.text}</div>
                )}

                <div className="addresses-header">
                    <button
                        className="btn btn--primary"
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? 'Cancel' : '+ Add New Address'}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} className="address-form">
                        <h3 className="address-form__title">
                            {editingId ? 'Edit Address' : 'Add New Address'}
                        </h3>

                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="fullName" className="form-label">Full Name *</label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone" className="form-label">Phone *</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    pattern="[0-9]{10,15}"
                                    required
                                />
                            </div>

                            <div className="form-group form-group--full">
                                <label htmlFor="street" className="form-label">Street Address *</label>
                                <input
                                    type="text"
                                    id="street"
                                    name="street"
                                    value={formData.street}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="city" className="form-label">City *</label>
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="state" className="form-label">Province/District</label>
                                <input
                                    type="text"
                                    id="state"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="e.g., Kigali City, Eastern Province"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="label" className="form-label">Label</label>
                                <select
                                    id="label"
                                    name="label"
                                    value={formData.label}
                                    onChange={handleInputChange}
                                    className="form-input"
                                >
                                    <option value="Home">Home</option>
                                    <option value="Work">Work</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="form-group form-group--full">
                                <label className="form-checkbox">
                                    <input
                                        type="checkbox"
                                        name="isDefault"
                                        checked={formData.isDefault}
                                        onChange={handleInputChange}
                                    />
                                    <span>Set as default address</span>
                                </label>
                            </div>
                        </div>

                        <div className="address-form__actions">
                            <button type="submit" className="btn btn--primary">
                                {editingId ? 'Update Address' : 'Add Address'}
                            </button>
                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {addresses.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">📍</div>
                        <p className="empty-state__text">No saved addresses</p>
                        <p className="empty-state__subtext">Add an address for faster checkout</p>
                    </div>
                ) : (
                    <div className="addresses-grid">
                        {addresses.map(address => (
                            <div key={address._id} className={`address-card ${address.isDefault ? 'address-card--default' : ''}`}>
                                {address.isDefault && (
                                    <div className="address-card__badge">Default</div>
                                )}

                                <div className="address-card__label">{address.label}</div>

                                <div className="address-card__name">{address.fullName}</div>
                                <div className="address-card__details">
                                    <p>{address.street}</p>
                                    <p>{address.city}{address.state ? `, ${address.state}` : ''}</p>
                                    <p>Rwanda</p>
                                    <p className="address-card__phone">📞 {address.phone}</p>
                                </div>

                                <div className="address-card__actions">
                                    <button
                                        className="address-action"
                                        onClick={() => handleEdit(address)}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        className="address-action"
                                        onClick={() => handleDelete(address._id)}
                                    >
                                        🗑️ Delete
                                    </button>
                                    {!address.isDefault && (
                                        <button
                                            className="address-action"
                                            onClick={() => handleSetDefault(address._id)}
                                        >
                                            ⭐ Set Default
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CustomerAddresses;
