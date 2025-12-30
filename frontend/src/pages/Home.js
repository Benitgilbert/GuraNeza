import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import api from '../utils/api';
import './Home.css';

const Home = () => {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [loading, setLoading] = useState(true);

    const categories = [
        { name: 'Electronics', icon: '💻', color: '#4F46E5' },
        { name: 'Fashion', icon: '👔', color: '#EC4899' },
        { name: 'Home & Garden', icon: '🏡', color: '#10B981' },
        { name: 'Sports & Outdoors', icon: '⚽', color: '#F59E0B' },
        { name: 'Books', icon: '📚', color: '#8B5CF6' },
        { name: 'Toys & Games', icon: '🎮', color: '#EF4444' },
        { name: 'Beauty & Health', icon: '💄', color: '#06B6D4' },
        { name: 'Food & Beverages', icon: '🍔', color: '#84CC16' }
    ];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            // Fetch latest products for featured and new arrivals
            const response = await api.get('/products?limit=8&sortBy=createdAt&order=desc');

            if (response.data.success) {
                const products = response.data.data.products || [];
                setFeaturedProducts(products.slice(0, 4));
                setNewArrivals(products.slice(0, 8));
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0
        }).format(price);
    };

    return (
        <>
            <Header />

            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero__content">
                        <h1 className="hero__title">
                            Welcome to <span className="text-gradient">GuraNeza</span>
                        </h1>
                        <p className="hero__subtitle">
                            Rwanda's Premier Multi-Vendor E-Commerce Marketplace
                        </p>
                        <p className="hero__description">
                            Discover thousands of products from trusted sellers across Rwanda.
                            Shop with confidence, pay securely, and get it delivered to your doorstep.
                        </p>
                        <div className="hero__cta">
                            <Link to="/products" className="btn btn--primary btn--lg">
                                Start Shopping
                            </Link>
                            <Link to="/signup" className="btn btn--secondary btn--lg">
                                Become a Seller
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="categories-section">
                <div className="container">
                    <h2 className="section-title text-center">Browse by Category</h2>
                    <div className="categories-grid">
                        {categories.map((category, index) => (
                            <Link
                                key={index}
                                to={`/products?category=${encodeURIComponent(category.name)}`}
                                className="category-card"
                                style={{ '--category-color': category.color }}
                            >
                                <div className="category-card__icon">{category.icon}</div>
                                <h3 className="category-card__name">{category.name}</h3>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products Section */}
            <section className="products-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Featured Products</h2>
                        <Link to="/products" className="section-link">View All →</Link>
                    </div>

                    {loading ? (
                        <div className="products-loading">
                            <div className="spinner spinner--lg"></div>
                            <p>Loading products...</p>
                        </div>
                    ) : featuredProducts.length === 0 ? (
                        <div className="products-empty">
                            <p>No products available yet</p>
                        </div>
                    ) : (
                        <div className="products-grid">
                            {featuredProducts.map((product) => (
                                <Link key={product._id} to={`/products/${product._id}`} className="product-card">
                                    <div className="product-card__image">
                                        <img src={product.imageUrl || '/placeholder.png'} alt={product.name} />
                                    </div>
                                    <div className="product-card__body">
                                        <h3 className="product-card__title">{product.name}</h3>
                                        <p className="product-card__seller">by {product.sellerName || 'Unknown'}</p>
                                        <div className="product-card__footer">
                                            <span className="product-card__price">{formatPrice(product.price)}</span>
                                            {product.averageRating > 0 && (
                                                <span className="product-card__rating">
                                                    ⭐ {product.averageRating.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* New Arrivals Section */}
            {!loading && newArrivals.length > 0 && (
                <section className="products-section products-section--secondary">
                    <div className="container">
                        <div className="section-header">
                            <h2 className="section-title">New Arrivals</h2>
                            <Link to="/products?sortBy=createdAt" className="section-link">View All →</Link>
                        </div>

                        <div className="products-grid">
                            {newArrivals.map((product) => (
                                <Link key={product._id} to={`/products/${product._id}`} className="product-card">
                                    <div className="product-card__image">
                                        <img src={product.imageUrl || '/placeholder.png'} alt={product.name} />
                                        <span className="product-badge product-badge--new">New</span>
                                    </div>
                                    <div className="product-card__body">
                                        <h3 className="product-card__title">{product.name}</h3>
                                        <p className="product-card__seller">by {product.sellerName || 'Unknown'}</p>
                                        <div className="product-card__footer">
                                            <span className="product-card__price">{formatPrice(product.price)}</span>
                                            {product.stock < 10 && product.stock > 0 && (
                                                <span className="product-stock product-stock--low">
                                                    Only {product.stock} left
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <h2 className="section-title text-center">Why Choose GuraNeza?</h2>

                    <div className="features__grid">
                        <div className="feature-card">
                            <div className="feature-card__icon">🛍️</div>
                            <h3 className="feature-card__title">Wide Selection</h3>
                            <p className="feature-card__desc">
                                Browse thousands of products from multiple categories and vendors
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-card__icon">💳</div>
                            <h3 className="feature-card__title">Secure Payments</h3>
                            <p className="feature-card__desc">
                                Pay safely with MTN Mobile Money or credit/debit cards
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-card__icon">🚚</div>
                            <h3 className="feature-card__title">Fast Delivery</h3>
                            <p className="feature-card__desc">
                                Get your orders delivered quickly across Rwanda
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-card__icon">⭐</div>
                            <h3 className="feature-card__title">Verified Reviews</h3>
                            <p className="feature-card__desc">
                                Read honest reviews from verified customers
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-card__icon">🏪</div>
                            <h3 className="feature-card__title">Trusted Sellers</h3>
                            <p className="feature-card__desc">
                                Shop from approved and verified sellers only
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-card__icon">🔒</div>
                            <h3 className="feature-card__title">Safe & Secure</h3>
                            <p className="feature-card__desc">
                                Your data and transactions are protected
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card">
                        <h2 className="cta-card__title">Start Your Business Today</h2>
                        <p className="cta-card__desc">
                            Join hundreds of sellers already making sales on GuraNeza
                        </p>
                        <Link to="/signup" className="btn btn--primary btn--lg">
                            Register as Seller
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer__content">
                        <div className="footer__brand">
                            <h3 className="footer__logo">GuraNeza</h3>
                            <p className="footer__tagline">Rwanda's Trusted Marketplace</p>
                        </div>

                        <div className="footer__links">
                            <div className="footer__column">
                                <h4 className="footer__heading">Shop</h4>
                                <Link to="/products" className="footer__link">All Products</Link>
                                <Link to="/products?category=Electronics" className="footer__link">Electronics</Link>
                                <Link to="/products?category=Fashion" className="footer__link">Fashion</Link>
                            </div>

                            <div className="footer__column">
                                <h4 className="footer__heading">Sell</h4>
                                <Link to="/signup" className="footer__link">Start Selling</Link>
                                <Link to="/login" className="footer__link">Seller Login</Link>
                            </div>

                            <div className="footer__column">
                                <h4 className="footer__heading">Support</h4>
                                <a href="#" className="footer__link">Help Center</a>
                                <a href="#" className="footer__link">Contact Us</a>
                            </div>
                        </div>
                    </div>

                    <div className="footer__bottom">
                        <p>&copy; {new Date().getFullYear()} GuraNeza. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Home;

