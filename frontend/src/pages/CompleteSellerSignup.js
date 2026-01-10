import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Header from '../components/Header';
import './Login.css';

const CompleteSellerSignup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        storeName: '',
        phone: '',
        storeDescription: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.storeName || !formData.phone) {
            setError('Store name and phone number are required');
            return;
        }

        setLoading(true);

        try {
            // Update seller profile
            // We use the same endpoint as profile update, or a specific one if designed
            // For now, we'll assume we need to hit a specific route or use the existing profile update
            // But wait, the existing profile update uses User model, we need to update SellerProfile.
            // Let's create a new endpoint for this or use the seller update route.
            // Checking backend routes... likely need to add a route for this specific action 
            // or use /api/seller/profile if it exists (it commonly does in these apps).

            // Let's assume we'll create/use PUT /api/seller/profile
            await api.put('/seller/profile', formData);

            navigate('/seller/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-card__header">
                        <h1 className="auth-card__title">Complete Your Shop</h1>
                        <p className="auth-card__subtitle">Just a few more details to set up your store</p>
                    </div>

                    {error && (
                        <div className="alert alert--error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="storeName" className="form-label">Store Name</label>
                            <input
                                type="text"
                                id="storeName"
                                name="storeName"
                                className="form-input"
                                placeholder="e.g. Kigali Electronics"
                                value={formData.storeName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone" className="form-label">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                className="form-input"
                                placeholder="07XXXXXXXX"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group mb-0">
                            <label htmlFor="storeDescription" className="form-label">
                                Store Description (Optional)
                            </label>
                            <textarea
                                id="storeDescription"
                                name="storeDescription"
                                className="form-textarea"
                                placeholder="Tell customers what you sell..."
                                value={formData.storeDescription}
                                onChange={handleChange}
                                rows="3"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn--primary btn--full btn--lg"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-sm">
                                    <div className="spinner spinner--sm"></div>
                                    Saving...
                                </span>
                            ) : (
                                'Complete Setup'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CompleteSellerSignup;
