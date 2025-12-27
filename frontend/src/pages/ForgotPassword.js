import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Header from '../components/Header';
import './Login.css';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password
    const [formData, setFormData] = useState({
        email: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setSuccess('');
    };

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await api.post('/auth/forgot-password', {
                email: formData.email
            });

            if (response.data.success) {
                setSuccess('OTP sent to your email. Please check your inbox.');
                setTimeout(() => {
                    setStep(2);
                    setSuccess('');
                }, 2000);
            }
        } catch (err) {
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!passwordRegex.test(formData.newPassword)) {
            setError('Password must contain uppercase, lowercase, number, and special character');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/auth/reset-password', {
                email: formData.email,
                otp: formData.otp,
                newPassword: formData.newPassword
            });

            if (response.data.success) {
                setSuccess('Password reset successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (err) {
            setError(err.message || 'Failed to reset password. Please try again.');
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
                        <h1 className="auth-card__title">Reset Password</h1>
                        <p className="auth-card__subtitle">
                            {step === 1
                                ? 'Enter your email to receive a reset code'
                                : 'Enter the OTP and your new password'
                            }
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert--error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="alert alert--success">
                            {success}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleRequestOTP} className="auth-form">
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

                            <button
                                type="submit"
                                className="btn btn--primary btn--full btn--lg"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-sm">
                                        <div className="spinner spinner--sm"></div>
                                        Sending OTP...
                                    </span>
                                ) : (
                                    'Send Reset Code'
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="otp" className="form-label">
                                    OTP Code
                                    <span className="text-secondary text-sm ml-sm">(Check your email)</span>
                                </label>
                                <input
                                    type="text"
                                    id="otp"
                                    name="otp"
                                    className="form-input"
                                    placeholder="Enter 6-digit code"
                                    value={formData.otp}
                                    onChange={handleChange}
                                    maxLength={6}
                                    pattern="[0-9]{6}"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="newPassword" className="form-label">New Password</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    name="newPassword"
                                    className="form-input"
                                    placeholder="Enter new password"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    className="form-input"
                                    placeholder="Re-enter new password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
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
                                        Resetting password...
                                    </span>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>

                            <button
                                type="button"
                                className="btn btn--secondary btn--full mt-md"
                                onClick={() => setStep(1)}
                            >
                                Back to Email
                            </button>
                        </form>
                    )}

                    <div className="auth-card__footer">
                        <p>
                            Remember your password?{' '}
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

export default ForgotPassword;
