import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Header from '../components/Header';
import './Cart.css';

const Cart = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState({});

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await api.get('/cart');
            if (response.data.success) {
                setCart(response.data.data.cart);
            }
        } catch (err) {
            setError(err.message || 'Failed to load cart');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQuantity = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;

        setUpdating({ ...updating, [itemId]: true });

        try {
            const response = await api.put(`/cart/update/${itemId}`, { quantity: newQuantity });
            if (response.data.success) {
                setCart(response.data.data.cart);
            }
        } catch (err) {
            alert(err.message || 'Failed to update quantity');
            fetchCart(); // Refresh to get correct state
        } finally {
            setUpdating({ ...updating, [itemId]: false });
        }
    };

    const handleRemoveItem = async (itemId) => {
        if (!window.confirm('Remove this item from cart?')) return;

        setUpdating({ ...updating, [itemId]: true });

        try {
            const response = await api.delete(`/cart/remove/${itemId}`);
            if (response.data.success) {
                setCart(response.data.data.cart);
            }
        } catch (err) {
            alert(err.message || 'Failed to remove item');
        } finally {
            setUpdating({ ...updating, [itemId]: false });
        }
    };

    const handleClearCart = async () => {
        if (!window.confirm('Clear all items from cart?')) return;

        try {
            const response = await api.delete('/cart/clear');
            if (response.data.success) {
                setCart(response.data.data.cart);
            }
        } catch (err) {
            alert(err.message || 'Failed to clear cart');
        }
    };

    const calculateSubtotal = () => {
        if (!cart || !cart.items) return 0;
        return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const groupItemsBySeller = () => {
        if (!cart || !cart.items) return {};

        const grouped = {};
        cart.items.forEach(item => {
            const sellerId = item.sellerId._id;
            if (!grouped[sellerId]) {
                grouped[sellerId] = {
                    sellerName: item.sellerId.email?.split('@')[0] || 'Seller',
                    items: []
                };
            }
            grouped[sellerId].items.push(item);
        });

        return grouped;
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
                    <div className="spinner spinner--lg"></div>
                    <p>Loading your cart...</p>
                </div>
            </>
        );
    }

    const itemCount = cart?.items?.length || 0;
    const subtotal = calculateSubtotal();
    const groupedItems = groupItemsBySeller();

    return (
        <>
            <Header />

            <div className="cart-container">
                <div className="container">
                    <div className="page-header">
                        <h1 className="page-title">Shopping Cart</h1>
                        <p className="page-subtitle">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
                    </div>

                    {error && (
                        <div className="alert alert--error">{error}</div>
                    )}

                    {itemCount === 0 ? (
                        <div className="empty-cart">
                            <div className="empty-cart__icon">🛒</div>
                            <h3 className="empty-cart__title">Your cart is empty</h3>
                            <p className="empty-cart__desc">
                                Start adding products to your cart!
                            </p>
                            <Link to="/products" className="btn btn--primary btn--lg">
                                Browse Products
                            </Link>
                        </div>
                    ) : (
                        <div className="cart-layout">
                            <div className="cart-items">
                                {Object.entries(groupedItems).map(([sellerId, sellerData]) => (
                                    <div key={sellerId} className="seller-section">
                                        <div className="seller-section__header">
                                            <h3 className="seller-section__name">
                                                🏪 {sellerData.sellerName}
                                            </h3>
                                        </div>

                                        <div className="cart-items-list">
                                            {sellerData.items.map(item => (
                                                <div key={item._id} className="cart-item">
                                                    <Link to={`/products/${item.productId._id}`} className="cart-item__image">
                                                        <img src={item.productId.imageUrl} alt={item.productId.name} />
                                                    </Link>

                                                    <div className="cart-item__details">
                                                        <Link to={`/products/${item.productId._id}`} className="cart-item__name">
                                                            {item.productId.name}
                                                        </Link>
                                                        <div className="cart-item__category">{item.productId.category}</div>
                                                        <div className="cart-item__price">
                                                            {item.price.toLocaleString()} RWF
                                                        </div>
                                                    </div>

                                                    <div className="cart-item__quantity">
                                                        <button
                                                            className="quantity-btn"
                                                            onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                                                            disabled={updating[item._id] || item.quantity <= 1}
                                                        >
                                                            -
                                                        </button>
                                                        <span className="quantity-value">{item.quantity}</span>
                                                        <button
                                                            className="quantity-btn"
                                                            onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                                                            disabled={updating[item._id]}
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <div className="cart-item__total">
                                                        {(item.price * item.quantity).toLocaleString()} RWF
                                                    </div>

                                                    <button
                                                        className="cart-item__remove"
                                                        onClick={() => handleRemoveItem(item._id)}
                                                        disabled={updating[item._id]}
                                                        title="Remove item"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                <div className="cart-actions">
                                    <button
                                        className="btn btn--secondary"
                                        onClick={handleClearCart}
                                    >
                                        Clear Cart
                                    </button>
                                    <Link to="/products" className="btn btn--secondary">
                                        Continue Shopping
                                    </Link>
                                </div>
                            </div>

                            <div className="cart-summary">
                                <h2 className="cart-summary__title">Order Summary</h2>

                                <div className="cart-summary__row">
                                    <span>Subtotal ({itemCount} items)</span>
                                    <span className="cart-summary__value">{subtotal.toLocaleString()} RWF</span>
                                </div>

                                <div className="cart-summary__row cart-summary__row--note">
                                    <span className="text-secondary text-sm">
                                        Shipping fees calculated at checkout
                                    </span>
                                </div>

                                <div className="cart-summary__divider"></div>

                                <div className="cart-summary__row cart-summary__row--total">
                                    <span>Total</span>
                                    <span className="cart-summary__total">{subtotal.toLocaleString()} RWF</span>
                                </div>

                                <button
                                    className="btn btn--primary btn--lg btn--full"
                                    onClick={() => navigate('/checkout')}
                                >
                                    Proceed to Checkout
                                </button>

                                <div className="cart-summary__security">
                                    <div className="security-badge">
                                        <span>🔒</span>
                                        <span>Secure Checkout</span>
                                    </div>
                                    <div className="payment-methods">
                                        <span className="text-sm text-secondary">We accept:</span>
                                        <div className="payment-icons">
                                            <span>💳 Card</span>
                                            <span>📱 MoMo</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Cart;
