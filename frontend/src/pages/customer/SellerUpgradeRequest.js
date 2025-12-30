import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import './customer.css';

const SellerUpgradeRequest = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        storeName: '',
        storeDescription: '',
        phone: '',
        logoUrl: ''
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const menuItems = [
        { path: '/customer/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/customer/profile', icon: '👤', label: 'My Profile' },
        { path: '/customer/orders', icon: '📦', label: 'My Orders' },
        { path: '/customer/wishlist', icon: '❤️', label: 'Wishlist' },
        { path: '/customer/addresses', icon: '📍', label: 'Addresses' },
        { path: '/customer/settings', icon: '⚙️', label: 'Settings' }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                setError('Image size should be less than 2MB');
                return;
            }

            setLogoFile(file);
            setError('');

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
                // Store base64 in logoUrl for submission
                setFormData({
                    ...formData,
                    logoUrl: reader.result
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreview('');
        setFormData({
            ...formData,
            logoUrl: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.storeName || !formData.storeDescription || !formData.phone) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            const response = await api.post('/seller/request-upgrade', formData);

            if (response.data.success) {
                setSuccess('Seller upgrade request submitted successfully! Please wait for admin approval.');
                setTimeout(() => {
                    navigate('/customer/dashboard');
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout menuItems={menuItems} title="Become a Seller">
            <div className="seller-upgrade-form">
                <div className="card">
                    <div className="card__header">
                        <h2 className="card__title">Seller Upgrade Request</h2>
                        <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                            Fill in the details below to request seller access. Our team will review your application.
                        </p>
                    </div>
                    <div className="card__body">
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

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Store Name *</label>
                                <input
                                    type="text"
                                    name="storeName"
                                    className="form-input"
                                    value={formData.storeName}
                                    onChange={handleChange}
                                    placeholder="Enter your store name"
                                    required
                                    minLength={3}
                                    maxLength={100}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Store Description *</label>
                                <textarea
                                    name="storeDescription"
                                    className="form-textarea"
                                    value={formData.storeDescription}

                                    onChange={handleChange}
                                    placeholder="Describe your store and products..."
                                    required
                                    minLength={10}
                                    maxLength={500}
                                    rows={4}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone Number *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Enter your phone number"
                                    required
                                    pattern="[0-9]{10,15}"
                                    title="Please enter a valid phone number (10-15 digits)"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Store Logo (Optional)</label>
                                <div className="file-upload-area">
                                    {!logoPreview ? (
                                        <>
                                            <input
                                                type="file"
                                                id="logoFile"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                style={{ display: 'none' }}
                                            />
                                            <label htmlFor="logoFile" className="file-upload-button">
                                                <span className="file-upload-icon">📁</span>
                                                <span>Choose Logo Image</span>
                                            </label>
                                            <p className="file-upload-hint">
                                                Click to select an image (Max 2MB, JPG/PNG)
                                            </p>
                                        </>
                                    ) : (
                                        <div className="file-preview">
                                            <img src={logoPreview} alt="Logo preview" className="file-preview__image" />
                                            <button
                                                type="button"
                                                className="file-preview__remove"
                                                onClick={handleRemoveLogo}
                                            >
                                                ✕ Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    type="submit"
                                    className="btn btn--primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : 'Submit Request'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn--secondary"
                                    onClick={() => navigate('/customer/dashboard')}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SellerUpgradeRequest;
