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

            // Redirect to appropriate dashboard
            navigate(redirect || '/products');
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
