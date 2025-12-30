import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import './customer.css';

const CustomerWishlist = () => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    const menuItems = [
        { path: '/customer/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/customer/profile', icon: '👤', label: 'My Profile' },
        { path: '/customer/orders', icon: '📦', label: 'My Orders' },
        { path: '/customer/wishlist', icon: '❤️', label: 'Wishlist' },
        { path: '/customer/addresses', icon: '📍', label: 'Addresses' },
        { path: '/customer/settings', icon: '⚙️', label: 'Settings' }
    ];

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            const response = await api.get('/wishlist');
            setWishlist(response.data.data.wishlist.items || []);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (productId) => {
        try {
            await api.delete(`/wishlist/${productId}`);
            setWishlist(prev => prev.filter(item => item.product._id !== productId));
            setMessage({ type: 'success', text: 'Item removed from wishlist' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to remove item' });
        }
    };

    const addToCart = async (product) => {
        try {
            await api.post('/cart/add', {
                productId: product._id,
                quantity: 1
            });
            setMessage({ type: 'success', text: 'Added to cart!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to add to cart' });
        }
    };

    if (loading) {
        return (
            <DashboardLayout menuItems={menuItems} title="My Wishlist">
                <div className="customer-loading">
                    <div className="spinner spinner--lg"></div>
                    <p>Loading wishlist...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout menuItems={menuItems} title="My Wishlist">
            <div className="customer-wishlist">
                {message.text && (
                    <div className={`alert alert--${message.type}`}>{message.text}</div>
                )}

                {wishlist.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">❤️</div>
                        <p className="empty-state__text">Your wishlist is empty</p>
                        <p className="empty-state__subtext">Save items you love for later!</p>
                        <Link to="/products" className="btn btn--primary">
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="wishlist-header">
                            <p className="wishlist-count">{wishlist.length} item{wishlist.length > 1 ? 's' : ''} saved</p>
                        </div>

                        <div className="wishlist-grid">
                            {wishlist.map(item => (
                                <div key={item.product._id} className="wishlist-item">
                                    <button
                                        className="wishlist-item__remove"
                                        onClick={() => removeFromWishlist(item.product._id)}
                                        title="Remove from wishlist"
                                    >
                                        ✕
                                    </button>

                                    <Link to={`/products/${item.product._id}`} className="wishlist-item__image">
                                        <img
                                            src={item.product.imageUrl || '/placeholder.png'}
                                            alt={item.product.name}
                                        />
                                    </Link>

                                    <div className="wishlist-item__content">
                                        <Link to={`/products/${item.product._id}`} className="wishlist-item__name">
                                            {item.product.name}
                                        </Link>

                                        <div className="wishlist-item__price">
                                            {item.product.price.toLocaleString()} RWF
                                        </div>

                                        {item.product.stock > 0 ? (
                                            <button
                                                className="btn btn--primary btn--sm"
                                                onClick={() => addToCart(item.product)}
                                            >
                                                Add to Cart
                                            </button>
                                        ) : (
                                            <div className="wishlist-item__stock">Out of Stock</div>
                                        )}

                                        <div className="wishlist-item__added">
                                            Added {new Date(item.addedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CustomerWishlist;
