import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import './admin.css';

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [ratingFilter, setRatingFilter] = useState('all');

    const menuItems = [
        { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/admin/users', icon: '👥', label: 'Users' },
        { path: '/admin/sellers', icon: '🏪', label: 'Sellers' },
        { path: '/admin/seller-requests', icon: '📋', label: 'Seller Requests' },
        { path: '/admin/products', icon: '📦', label: 'Products' },
        { path: '/admin/orders', icon: '🛒', label: 'Orders' },
        { path: '/admin/shipping', icon: '🚚', label: 'Shipping' },
        { path: '/admin/reviews', icon: '⭐', label: 'Reviews' },
    ];

    useEffect(() => {
        fetchReviews();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [reviews, searchTerm, ratingFilter]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch all products with their reviews
            const response = await api.get('/products');
            if (response.data.success) {
                const products = response.data.data.products || [];
                const allReviews = [];

                // Fetch reviews for each product
                for (const product of products) {
                    try {
                        const reviewsResponse = await api.get(`/products/${product._id}/reviews`);
                        if (reviewsResponse.data.success && reviewsResponse.data.data) {
                            const productReviews = reviewsResponse.data.data.map(review => ({
                                ...review,
                                productName: product.name,
                                productId: product._id
                            }));
                            allReviews.push(...productReviews);
                        }
                    } catch (err) {
                        console.error(`Error fetching reviews for product ${product._id}:`, err);
                    }
                }

                setReviews(allReviews);
            } else {
                setReviews([]);
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setError('Failed to load reviews');
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...reviews];

        if (searchTerm) {
            filtered = filtered.filter(review =>
                review.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                review.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                review.comment?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (ratingFilter !== 'all') {
            filtered = filtered.filter(review => review.rating === parseInt(ratingFilter));
        }

        // Sort by date, newest first
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setFilteredReviews(filtered);
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            return;
        }

        try {
            setError('');
            setSuccess('');

            const response = await api.delete(`/reviews/${reviewId}`);

            if (response.data.success) {
                setSuccess('Review deleted successfully');
                await fetchReviews();
            }
        } catch (err) {
            console.error('Error deleting review:', err);
            setError(err.response?.data?.message || 'Failed to delete review');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderStars = (rating) => {
        return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    return (
        <DashboardLayout menuItems={menuItems} title="Review Management">
            {error && (
                <div className="alert alert--danger">
                    <strong>Error:</strong> {error}
                    <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {success && (
                <div className="alert alert--success">
                    <strong>Success:</strong> {success}
                    <button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            <div className="filter-bar">
                <div className="filter-bar__grid">
                    <div className="form-group">
                        <label className="form-label">Search by Product or Customer</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search reviews..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Filter by Rating</label>
                        <select
                            className="form-select"
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value)}
                        >
                            <option value="all">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card__header">
                    <h2 className="card__title">Reviews ({filteredReviews.length})</h2>
                </div>
                <div className="card__body">
                    {loading ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>Loading reviews...</p>
                        </div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="alert alert--info" style={{ margin: 0 }}>
                            <strong>ℹ️ Info:</strong> No reviews found.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Customer</th>
                                        <th>Rating</th>
                                        <th>Comment</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReviews.map(review => (
                                        <tr key={review._id}>
                                            <td>
                                                <Link to={`/products/${review.productId}`} target="_blank">
                                                    <strong>{review.productName}</strong>
                                                </Link>
                                            </td>
                                            <td>{review.userId?.name || review.userId?.email || 'N/A'}</td>
                                            <td>
                                                <span style={{ fontSize: '1.1rem' }}>
                                                    {renderStars(review.rating)}
                                                </span>
                                                <br />
                                                <small>{review.rating}/5</small>
                                            </td>
                                            <td style={{ maxWidth: '300px' }}>
                                                {review.comment?.length > 100
                                                    ? review.comment.substring(0, 100) + '...'
                                                    : review.comment || 'No comment'}
                                            </td>
                                            <td>{formatDate(review.createdAt)}</td>
                                            <td>
                                                <button
                                                    className="btn btn--sm btn--danger"
                                                    onClick={() => handleDeleteReview(review._id)}
                                                    title="Delete inappropriate review"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminReviews;
