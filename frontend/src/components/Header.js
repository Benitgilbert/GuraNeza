import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated, getUserRole, logout } from '../utils/auth';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const authenticated = isAuthenticated();
    const userRole = getUserRole();

    const handleLogout = () => {
        logout();
    };

    return (
        <header className="header">
            <div className="container">
                <div className="header__content">
                    {/* Logo */}
                    <Link to="/" className="header__logo">
                        <span className="header__logo-text">GuraNeza</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="header__nav">
                        <Link to="/" className="header__nav-link">Home</Link>
                        <Link to="/products" className="header__nav-link">Products</Link>

                        {authenticated ? (
                            <>
                                {userRole === 'customer' && (
                                    <>
                                        <Link to="/cart" className="header__nav-link">Cart</Link>
                                        <Link to="/orders" className="header__nav-link">Orders</Link>
                                    </>
                                )}

                                {userRole === 'seller' && (
                                    <Link to="/seller/dashboard" className="header__nav-link">Dashboard</Link>
                                )}

                                {userRole === 'admin' && (
                                    <Link to="/admin/dashboard" className="header__nav-link">Admin</Link>
                                )}

                                <button onClick={handleLogout} className="btn btn--secondary btn--sm">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn--secondary btn--sm">Login</Link>
                                <Link to="/signup" className="btn btn--primary btn--sm">Sign Up</Link>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
