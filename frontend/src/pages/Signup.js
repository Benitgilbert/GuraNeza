import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { login } from '../utils/auth';
import Header from '../components/Header';
import './Login.css';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'customer',
        storeName: '',
        storeDescription: '',
        phone: ''
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

    const validateForm = () => {
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }

        // Password strength validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!passwordRegex.test(formData.password)) {
            setError('Password must contain uppercase, lowercase, number, and special character');
            return false;
        }

        if (formData.role === 'seller') {
            if (!formData.storeName || !formData.phone) {
                setError('Store name and phone are required for sellers');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setLoading(true);

        try {
            const response = await api.post('/auth/signup', formData);

            if (response.data.success) {
                // Auto-login after signup
                login(response.data.data.token, response.data.data.user);

                // Show success and redirect
                if (formData.role === 'seller') {
                    navigate('/seller/dashboard');
                } else {
                    navigate('/products');
                }
            }
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = () => {
        window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/google`;
    };

    return (
        <>
            <Header />
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-card__header">
                        <h1 className="auth-card__title">Create Account</h1>
                        <p className="auth-card__subtitle">Join GuraNeza marketplace today</p>
                    </div>

                    {error && (
                        <div className="alert alert--error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        {/* Role Selection */}
                        <div className="form-group">
                            <label className="form-label">I want to</label>
                            <div className="role-selector">
                                <div className="role-option">
                                    <input
                                        type="radio"
                                        id="customer"
                                        name="role"
                                        value="customer"
                                        checked={formData.role === 'customer'}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="customer">
                                        <div className="role-option__title">🛍️ Buy Products</div>
                                        <div className="role-option__desc">Shop from sellers</div>
                                    </label>
                                </div>

                                <div className="role-option">
                                    <input
                                        type="radio"
                                        id="seller"
                                        name="role"
                                        value="seller"
                                        checked={formData.role === 'seller'}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="seller">
                                        <div className="role-option__title">🏪 Sell Products</div>
                                        <div className="role-option__desc">Become a vendor</div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label htmlFor="password" className="form-label">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                className="form-input"
                                placeholder="Create a strong password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Confirm Password */}
                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                className="form-input"
                                placeholder="Re-enter your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Seller-specific fields */}
                        {formData.role === 'seller' && (
                            <div className="seller-fields">
                                <h3 className="seller-fields__title">Store Information</h3>

                                <div className="form-group">
                                    <label htmlFor="storeName" className="form-label">Store Name</label>
                                    <input
                                        type="text"
                                        id="storeName"
                                        name="storeName"
                                        className="form-input"
                                        placeholder="Your store name"
                                        value={formData.storeName}
                                        onChange={handleChange}
                                        required={formData.role === 'seller'}
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
                                        required={formData.role === 'seller'}
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
                                        placeholder="Tell us about your store..."
                                        value={formData.storeDescription}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn--primary btn--full btn--lg"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-sm">
                                    <div className="spinner spinner--sm"></div>
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <button
                        type="button"
                        className="btn btn--secondary btn--full"
                        onClick={handleGoogleSignup}
                    >
                        <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign up with Google
                    </button>

                    <div className="auth-card__footer">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary font-weight-500">
                                Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Signup;
