import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { login as loginUser } from '../utils/auth';
import api from '../utils/api';

const AuthCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            // Handle OAuth error
            navigate(`/login?error=${error}`);
            return;
        }

        if (token) {
            // Fetch user data with the token
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            api.get('/auth/me')
                .then(response => {
                    if (response.data.success) {
                        loginUser(token, response.data.data.user);

                        // Redirect based on role
                        const role = response.data.data.user.role;
                        if (role === 'admin') {
                            navigate('/admin/dashboard');
                        } else if (role === 'seller') {
                            navigate('/seller/dashboard');
                        } else {
                            navigate('/products');
                        }
                    }
                })
                .catch(err => {
                    console.error('Auth callback error:', err);
                    navigate('/login?error=auth_failed');
                });
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '20px' }}>Completing authentication...</p>
        </div>
    );
};

export default AuthCallback;
