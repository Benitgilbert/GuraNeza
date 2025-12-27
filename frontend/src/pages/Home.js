import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import './Home.css';

const Home = () => {
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
