import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setToken, setUser } from '../utils/auth';

const GoogleAuthCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const role = searchParams.get('role');
        const redirect = searchParams.get('redirect');

        if (token && role) {
            // Create user object
            const user = { role };

            // Store authentication data
            setToken(token);
            setUser(user);

            // Check if seller needs to complete profile
            if (role === 'seller') {
                // We'll fetch the profile to check if it's "clean" (default) or filled
                // But since we can't easily do async fetches inside this synchronous check without more state
                // We will rely on a simpler heuristic or just always redirect new Google sellers 
                // to a page that pre-fills what it knows.

                // However, since we don't know if this is a *new* user or returning, 
                // we should probably fetch the profile.
                // For now, let's redirect to dashboard which (in a real app) should redirect to setup if incomplete
                // OR, we can just fetch it here.

                // Improved Logic:
                // We'll redirect to a transient loader or just fetch directly here.
                const checkProfile = async () => {
                    try {
                        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/seller/profile`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const data = await response.json();

                        // If store name is default or phone is missing, redirect to completion
                        if (data.success && (data.data.storeName === 'My Store' || !data.data.phone)) {
                            navigate('/seller/complete-signup');
                        } else {
                            navigate(redirect || '/seller/dashboard');
                        }
                    } catch (e) {
                        // If we can't fetch profile (maybe not created properly?), go to dashboard where errors might be more visible
                        // or safe fallback
                        navigate('/seller/dashboard');
                    }
                };
                checkProfile();
            } else {
                // Customer or Admin
                navigate(redirect || '/products');
            }
        } else {
            // If no token, redirect to login with error
            navigate('/login?error=google_auth_failed');
        }
    }, [searchParams, navigate]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            <div className="spinner"></div>
            <p>Completing Google sign-in...</p>
        </div>
    );
};

export default GoogleAuthCallback;
