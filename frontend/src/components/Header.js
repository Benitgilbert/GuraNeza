import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated, getUserRole, logout } from '../utils/auth';
import api from '../utils/api';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const authenticated = isAuthenticated();
    const userRole = getUserRole();
    const [searchQuery, setSearchQuery] = useState('');
    const [showCategories, setShowCategories] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const categoriesRef = useRef(null);
    const searchRef = useRef(null);
    const suggestionsTimeoutRef = useRef(null);

    const categories = [
        { name: 'Electronics', icon: '💻' },
        { name: 'Fashion', icon: '👔' },
        { name: 'Home & Garden', icon: '🏡' },
        { name: 'Sports & Outdoors', icon: '⚽' },
        { name: 'Books', icon: '📚' },
        { name: 'Toys & Games', icon: '🎮' },
        { name: 'Beauty & Health', icon: '💄' },
        { name: 'Food & Beverages', icon: '🍔' }
    ];

    const handleLogout = () => {
        logout();
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (productId) => {
        navigate(`/products/${productId}`);
        setSearchQuery('');
        setShowSuggestions(false);
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);

        // Clear previous timeout
        if (suggestionsTimeoutRef.current) {
            clearTimeout(suggestionsTimeoutRef.current);
        }

        // Fetch suggestions after 300ms of no typing (debounce)
        if (value.trim().length >= 2) {
            suggestionsTimeoutRef.current = setTimeout(() => {
                fetchSuggestions(value.trim());
            }, 300);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const fetchSuggestions = async (query) => {
        try {
            const response = await api.get(`/products/search/suggestions?q=${encodeURIComponent(query)}`);
            if (response.data.success) {
                setSuggestions(response.data.data.suggestions);
                setShowSuggestions(response.data.data.suggestions.length > 0);
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (categoriesRef.current && !categoriesRef.current.contains(event.target)) {
                setShowCategories(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (suggestionsTimeoutRef.current) {
                clearTimeout(suggestionsTimeoutRef.current);
            }
        };
    }, []);

    return (
        <header className="header">
            <div className="container">
                <div className="header__content">
                    {/* Logo */}
                    <Link to="/" className="header__logo">
                        <span className="header__logo-text">GuraNeza</span>
                    </Link>

                    {/* Search Bar */}
                    <div className="header__search-wrapper" ref={searchRef}>
                        <form className="header__search" onSubmit={handleSearch}>
                            <input
                                type="text"
                                className="header__search-input"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={handleSearchInputChange}
                            />
                            <button type="submit" className="header__search-btn">
                                🔍
                            </button>
                        </form>

                        {/* Search Suggestions */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="header__suggestions">
                                {suggestions.map((product) => (
                                    <div
                                        key={product._id}
                                        className="header__suggestion-item"
                                        onClick={() => handleSuggestionClick(product._id)}
                                    >
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="header__suggestion-image"
                                        />
                                        <div className="header__suggestion-content">
                                            <div className="header__suggestion-name">{product.name}</div>
                                            <div className="header__suggestion-meta">
                                                <span className="header__suggestion-category">{product.category}</span>
                                                <span className="header__suggestion-price">
                                                    {product.price.toLocaleString()} RWF
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="header__nav">
                        <Link to="/" className="header__nav-link">Home</Link>

                        {/* Categories Dropdown */}
                        <div className="header__categories" ref={categoriesRef}>
                            <button
                                className="header__nav-link header__categories-btn"
                                onClick={() => setShowCategories(!showCategories)}
                            >
                                Categories ▼
                            </button>
                            {showCategories && (
                                <div className="header__categories-dropdown">
                                    {categories.map((category, index) => (
                                        <Link
                                            key={index}
                                            to={`/products?category=${encodeURIComponent(category.name)}`}
                                            className="header__categories-item"
                                            onClick={() => setShowCategories(false)}
                                        >
                                            <span className="header__categories-icon">{category.icon}</span>
                                            <span>{category.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Link to="/products" className="header__nav-link">Products</Link>

                        {authenticated ? (
                            <>
                                {userRole === 'customer' && (
                                    <>
                                        <Link to="/customer/dashboard" className="header__nav-link">Dashboard</Link>
                                        <Link to="/cart" className="header__nav-link">Cart</Link>
                                        <Link to="/customer/orders" className="header__nav-link">Orders</Link>
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
