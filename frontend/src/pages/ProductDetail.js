import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { isAuthenticated, getUserRole } from '../utils/auth';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import './ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchCartCount } = useCart();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        comment: ''
    });
    const [addingToCart, setAddingToCart] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    useEffect(() => {
        fetchProductDetail();
        fetchRelatedProducts();
        fetchReviews();
        checkWishlistStatus();
    }, [id]);

    const fetchProductDetail = async () => {
        try {
            const response = await api.get(`/products/${id}`);
            if (response.data.success) {
                setProduct(response.data.data.product);
            }
        } catch (err) {
            setError(err.message || 'Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedProducts = async () => {
        try {
            const response = await api.get(`/products/${id}/related`);
            if (response.data.success) {
                setRelatedProducts(response.data.data.relatedProducts);
            }
        } catch (err) {
            console.error('Failed to fetch related products:', err);
        }
    };

    const fetchReviews = async () => {
        try {
            const response = await api.get(`/reviews/product/${id}`);
            if (response.data.success) {
                setReviews(response.data.data.reviews);
            }
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
        }
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }

        if (getUserRole() !== 'customer') {
            alert('Only customers can add items to cart');
            return;
        }

        setAddingToCart(true);
        try {
            const response = await api.post('/cart/add', {
                productId: id,
                quantity
            });

            if (response.data.success) {
                alert('Product added to cart!');
                setQuantity(1);
                fetchCartCount(); // Refresh cart count in header
            }
        } catch (err) {
            alert(err.message || 'Failed to add to cart');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }

        try {
            const response = await api.post('/reviews', {
                productId: id,
                ...reviewForm
            });

            if (response.data.success) {
                alert('Review submitted successfully!');
                setReviewForm({ rating: 5, comment: '' });
                fetchReviews();
                fetchProductDetail(); // Refresh to update average rating
            }
        } catch (err) {
            alert(err.message || 'Failed to submit review');
        }
    };

    const checkWishlistStatus = async () => {
        if (!isAuthenticated() || getUserRole() !== 'customer') return;

        try {
            const response = await api.get('/wishlist');
            const wishlistItems = response.data.data.wishlist.items || [];
            const inWishlist = wishlistItems.some(item => item.product._id === id);
            setIsInWishlist(inWishlist);
        } catch (err) {
            console.error('Failed to check wishlist status:', err);
        }
    };

    const handleToggleWishlist = async () => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }

        if (getUserRole() !== 'customer') {
            alert('Only customers can add items to wishlist');
            return;
        }

        setWishlistLoading(true);
        try {
            if (isInWishlist) {
                await api.delete(`/wishlist/${id}`);
                setIsInWishlist(false);
                alert('Removed from wishlist');
            } else {
                await api.post(`/wishlist/${id}`);
                setIsInWishlist(true);
                alert('Added to wishlist!');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update wishlist');
        } finally {
            setWishlistLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
                    <div className="spinner spinner--lg"></div>
                    <p>Loading product details...</p>
                </div>
            </>
        );
    }

    if (error || !product) {
        return (
            <>
                <Header />
                <div className="container mt-xl">
                    <div className="alert alert--error">{error || 'Product not found'}</div>
                    <Link to="/products" className="btn btn--secondary">Back to Products</Link>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />

            <div className="product-detail-container">
                <div className="container">
                    {/* Breadcrumb */}
                    <div className="breadcrumb">
                        <Link to="/">Home</Link>
                        <span>/</span>
                        <Link to="/products">Products</Link>
                        <span>/</span>
                        <span>{product.name}</span>
                    </div>

                    {/* Product Details */}
                    <div className="product-detail">
                        <div className="product-detail__image">
                            <img src={product.imageUrl} alt={product.name} />
                        </div>

                        <div className="product-detail__info">
                            <div className="product-detail__category">{product.category}</div>
                            <h1 className="product-detail__title">{product.name}</h1>

                            <div className="product-detail__seller">
                                Sold by <strong>{product.sellerName}</strong>
                            </div>

                            <div className="product-detail__rating">
                                <span className="rating-stars">
                                    {'★'.repeat(Math.round(product.averageRating))}
                                    {'☆'.repeat(5 - Math.round(product.averageRating))}
                                </span>
                                <span className="rating-value">
                                    {product.averageRating.toFixed(1)} ({product.totalReviews} reviews)
                                </span>
                            </div>

                            <div className="product-detail__price">
                                {product.price.toLocaleString()} RWF
                            </div>

                            <div className="product-detail__stock">
                                {product.stock > 0 ? (
                                    <span className="stock-available">
                                        ✓ In Stock ({product.stock} available)
                                    </span>
                                ) : (
                                    <span className="stock-unavailable">✗ Out of Stock</span>
                                )}
                            </div>

                            <div className="product-detail__description">
                                <h3>Description</h3>
                                <p>{product.description}</p>
                            </div>

                            {product.stock > 0 && getUserRole() === 'customer' && (
                                <div className="product-detail__actions">
                                    <div className="quantity-selector">
                                        <label>Quantity:</label>
                                        <div className="quantity-controls">
                                            <button
                                                className="btn btn--secondary btn--sm"
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            >
                                                -
                                            </button>
                                            <span className="quantity-value">{quantity}</span>
                                            <button
                                                className="btn btn--secondary btn--sm"
                                                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        className="btn btn--primary btn--lg btn--full"
                                        onClick={handleAddToCart}
                                        disabled={addingToCart}
                                    >
                                        {addingToCart ? (
                                            <span className="flex items-center justify-center gap-sm">
                                                <div className="spinner spinner--sm"></div>
                                                Adding...
                                            </span>
                                        ) : (
                                            '🛒 Add to Cart'
                                        )}
                                    </button>

                                    <button
                                        className="btn btn--secondary btn--lg btn--full"
                                        onClick={handleToggleWishlist}
                                        disabled={wishlistLoading}
                                    >
                                        {wishlistLoading ? (
                                            <span className="flex items-center justify-center gap-sm">
                                                <div className="spinner spinner--sm"></div>
                                                Loading...
                                            </span>
                                        ) : isInWishlist ? (
                                            '💔 Remove from Wishlist'
                                        ) : (
                                            '❤️ Add to Wishlist'
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="reviews-section">
                        <h2 className="section-title">Customer Reviews</h2>

                        {isAuthenticated() && getUserRole() === 'customer' && (
                            <div className="review-form-container">
                                <h3>Write a Review</h3>
                                <form onSubmit={handleSubmitReview} className="review-form">
                                    <div className="form-group">
                                        <label className="form-label">Rating</label>
                                        <div className="star-rating-input">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <span
                                                    key={star}
                                                    className={`star ${reviewForm.rating >= star ? 'active' : ''}`}
                                                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Your Review</label>
                                        <textarea
                                            className="form-textarea"
                                            rows="4"
                                            placeholder="Share your experience with this product..."
                                            value={reviewForm.comment}
                                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <button type="submit" className="btn btn--primary">
                                        Submit Review
                                    </button>
                                </form>
                            </div>
                        )}

                        <div className="reviews-list">
                            {reviews.length === 0 ? (
                                <p className="text-secondary">No reviews yet. Be the first to review!</p>
                            ) : (
                                reviews.map(review => (
                                    <div key={review._id} className="review-card">
                                        <div className="review-card__header">
                                            <div className="review-card__rating">
                                                {'★'.repeat(review.rating)}
                                                {'☆'.repeat(5 - review.rating)}
                                            </div>
                                            <div className="review-card__date">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="review-card__author">
                                            {review.userId?.email?.split('@')[0] || 'Anonymous'}
                                        </div>
                                        <div className="review-card__comment">
                                            {review.comment}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Related Products */}
                    {relatedProducts.length > 0 && (
                        <div className="related-products-section">
                            <h2 className="section-title">Related Products</h2>
                            <div className="related-products-grid">
                                {relatedProducts.map(relatedProduct => (
                                    <Link
                                        key={relatedProduct._id}
                                        to={`/products/${relatedProduct._id}`}
                                        className="related-product-card"
                                    >
                                        <img src={relatedProduct.imageUrl} alt={relatedProduct.name} />
                                        <div className="related-product-card__info">
                                            <div className="related-product-card__name">{relatedProduct.name}</div>
                                            <div className="related-product-card__price">
                                                {relatedProduct.price.toLocaleString()} RWF
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ProductDetail;
