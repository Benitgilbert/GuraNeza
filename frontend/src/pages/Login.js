import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { setToken, setUser } from '../utils/auth';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const { fetchCartCount } = useCart();
    const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        otp: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login/request-otp', {
                email: formData.email,
                password: formData.password
            });

            if (response.data.success) {
                setSuccess(response.data.message);
                setStep(2);
            }
        } catch (err) {
            if (err.response?.data?.notVerified) {
                setError(
                    <span>
                        Your email is not verified. Please{' '}
                        <Link to="/verify-email" state={{ email: formData.email }} className="text-primary">
                            verify your email here
                        </Link>{' '}
                        before logging in.
                    </span>
                );
            } else {
                setError(err.response?.data?.message || 'Failed to send OTP');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login/verify-otp', {
                email: formData.email,
                otp: formData.otp
            });

            if (response.data.success) {
                const { token, user } = response.data.data;

                // Store token and user data
                setToken(token);
                setUser(user);

                // Fetch cart count for the authenticated user
                await fetchCartCount();

                // Redirect based on role
                if (user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else if (user.role === 'seller') {
                    navigate('/seller/dashboard');
                } else {
                    navigate('/products');
                }
            }
        } catch (err) {
            setError(err.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login/request-otp', {
                email: formData.email,
                password: formData.password
            });

            if (response.data.success) {
                // Clear the OTP input field
                setFormData(prev => ({ ...prev, otp: '' }));
                setSuccess('New OTP sent to your email!');
            }
        } catch (err) {
            setError(err.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/google`;
    };

    return (
        <>
            <Header />

            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1 className="auth-title">
                            {step === 1 ? 'Sign In' : 'Verify OTP'}
                        </h1>
                        <p className="auth-subtitle">
                            {step === 1
                                ? 'Enter your credentials to receive a login code'
                                : `We sent a code to ${formData.email}`
                            }
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert--error">{error}</div>
                    )}

                    {success && (
                        <div className="alert alert--success">{success}</div>
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
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password" className="form-label">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    className="form-input"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn--primary btn--full"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-sm">
                                        <div className="spinner spinner--sm"></div>
                                        Sending OTP...
                                    </span>
                                ) : (
                                    '📧 Send Login Code'
                                )}
                            </button>

                            <div className="auth-divider">
                                <span>or</span>
                            </div>

                            <button
                                type="button"
                                className="btn btn--google btn--full"
                                onClick={handleGoogleLogin}
                            >
                                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                                        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                                        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                                        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                                    </g>
                                </svg>
                                Continue with Google
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="otp" className="form-label">Verification Code</label>
                                <input
                                    type="text"
                                    id="otp"
                                    name="otp"
                                    className="form-input otp-input"
                                    placeholder="Enter 6-digit code"
                                    value={formData.otp}
                                    onChange={handleChange}
                                    maxLength="6"
                                    required
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn--primary btn--full"
                                disabled={loading || formData.otp.length !== 6}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-sm">
                                        <div className="spinner spinner--sm"></div>
                                        Verifying...
                                    </span>
                                ) : (
                                    '✓ Verify & Sign In'
                                )}
                            </button>

                            <div className="otp-actions">
                                <button
                                    type="button"
                                    className="text-link"
                                    onClick={handleResendOTP}
                                    disabled={loading}
                                >
                                    Resend Code
                                </button>
                                <button
                                    type="button"
                                    className="text-link"
                                    onClick={() => {
                                        setStep(1);
                                        setFormData({ ...formData, password: '', otp: '' });
                                        setError('');
                                        setSuccess('');
                                    }}
                                >
                                    Change Email
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="auth-footer">
                        <p>
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-link">Sign Up</Link>
                        </p>
                        <p>
                            <Link to="/forgot-password" className="text-link">Forgot Password?</Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
