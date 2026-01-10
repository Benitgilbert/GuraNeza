import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { login } from '../utils/auth';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import './Login.css';

const VerifyEmail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { fetchCartCount } = useCart();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        }
    }, [location.state]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await api.post('/auth/verify-signup-otp', {
                email,
                otp
            });

            if (response.data.success) {
                const { token, user } = response.data.data;

                // Auto-login after verification
                login(token, user);

                // Fetch cart count for the authenticated user
                await fetchCartCount();

                setSuccess('Email verified successfully! Redirecting to your dashboard...');

                setTimeout(() => {
                    if (user.role === 'seller') {
                        navigate('/seller/dashboard');
                    } else {
                        navigate('/products');
                    }
                }, 1500);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please check your OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1 className="auth-title">Verify Your Email</h1>
                        <p className="auth-subtitle">Enter the 6-digit code sent to your email</p>
                    </div>

                    {error && <div className="alert alert--error">{error}</div>}
                    {success && <div className="alert alert--success">{success}</div>}

                    <form onSubmit={handleVerify} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="otp" className="form-label">Verification Code</label>
                            <input
                                type="text"
                                id="otp"
                                className="form-input"
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength="6"
                                required
                                style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.4rem' }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn--primary btn--full"
                            disabled={loading || otp.length < 6}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-sm">
                                    <div className="spinner spinner--sm"></div>
                                    Verifying...
                                </span>
                            ) : (
                                'Verify Email'
                            )}
                        </button>

                        <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
                            <p>
                                <Link to="/login" className="text-link">Back to Login</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default VerifyEmail;
