import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import Header from '../components/Header';
import './ProductList.css';

const ProductList = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({});

    // Filter states
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || 'All',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        sortBy: searchParams.get('sortBy') || 'createdAt',
        order: searchParams.get('order') || 'desc',
        page: parseInt(searchParams.get('page')) || 1
    });

    const categories = [
        'All',
        'Electronics',
        'Fashion',
        'Home & Garden',
        'Sports & Outdoors',
        'Books',
        'Toys & Games',
        'Beauty & Health',
        'Food & Beverages',
        'Automotive',
        'Other'
    ];

    // Sync filters with URL params when they change
    useEffect(() => {
        setFilters({
            search: searchParams.get('search') || '',
            category: searchParams.get('category') || 'All',
            minPrice: searchParams.get('minPrice') || '',
            maxPrice: searchParams.get('maxPrice') || '',
            sortBy: searchParams.get('sortBy') || 'createdAt',
            order: searchParams.get('order') || 'desc',
            page: parseInt(searchParams.get('page')) || 1
        });
    }, [searchParams]);

    useEffect(() => {
        fetchProducts();
    }, [searchParams]);

    const fetchProducts = async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();

            if (filters.search) params.append('search', filters.search);
            if (filters.category && filters.category !== 'All') params.append('category', filters.category);
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
            params.append('sortBy', filters.sortBy);
            params.append('order', filters.order);
            params.append('page', filters.page);
            params.append('limit', 12);

            const response = await api.get(`/products?${params.toString()}`);

            if (response.data.success) {
                setProducts(response.data.data.products);
                setPagination(response.data.data.pagination);
            }
        } catch (err) {
            setError(err.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (name, value) => {
        const newFilters = { ...filters, [name]: value, page: 1 };
        setFilters(newFilters);
        updateSearchParams(newFilters);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        updateSearchParams(filters);
    };

    const updateSearchParams = (newFilters) => {
        const params = new URLSearchParams();
        Object.keys(newFilters).forEach(key => {
            if (newFilters[key] && newFilters[key] !== 'All') {
                params.set(key, newFilters[key]);
            }
        });
        setSearchParams(params);
    };

    const handlePageChange = (newPage) => {
        const newFilters = { ...filters, page: newPage };
        setFilters(newFilters);
        updateSearchParams(newFilters);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <Header />

            <div className="product-list-container">
                <div className="container">
                    {/* Page Header */}
                    <div className="page-header">
                        <h1 className="page-title">Browse Products</h1>
                        <p className="page-subtitle">
                            Discover amazing products from trusted sellers
                        </p>
                    </div>

                    {/* Filters Section */}
                    <div className="filters-section">
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="search-form">
                            <input
                                type="text"
                                className="form-input search-input"
                                placeholder="Search products..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                            <button type="submit" className="btn btn--primary">
                                Search
                            </button>
                        </form>

                        {/* Filter Row */}
                        <div className="filter-row">
                            {/* Category Filter */}
                            <div className="filter-group">
                                <label className="filter-label">Category</label>
                                <select
                                    className="form-select"
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Price Range */}
                            <div className="filter-group">
                                <label className="filter-label">Min Price (RWF)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Min"
                                    value={filters.minPrice}
                                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                    onBlur={() => updateSearchParams(filters)}
                                />
                            </div>

                            <div className="filter-group">
                                <label className="filter-label">Max Price (RWF)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Max"
                                    value={filters.maxPrice}
                                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                    onBlur={() => updateSearchParams(filters)}
                                />
                            </div>

                            {/* Sort By */}
                            <div className="filter-group">
                                <label className="filter-label">Sort By</label>
                                <select
                                    className="form-select"
                                    value={`${filters.sortBy}-${filters.order}`}
                                    onChange={(e) => {
                                        const [sortBy, order] = e.target.value.split('-');
                                        handleFilterChange('sortBy', sortBy);
                                        handleFilterChange('order', order);
                                    }}
                                >
                                    <option value="createdAt-desc">Newest First</option>
                                    <option value="createdAt-asc">Oldest First</option>
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                    <option value="averageRating-desc">Highest Rated</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner spinner--lg"></div>
                            <p>Loading products...</p>
                        </div>
                    ) : error ? (
                        <div className="alert alert--error">{error}</div>
                    ) : products.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state__icon">📦</div>
                            <h3 className="empty-state__title">No Products Found</h3>
                            <p className="empty-state__desc">
                                Try adjusting your filters or search terms
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Product Grid */}
                            <div className="products-grid">
                                {products.map(product => (
                                    <Link
                                        key={product._id}
                                        to={`/products/${product._id}`}
                                        className="product-card"
                                    >
                                        <div className="product-card__image">
                                            <img src={product.imageUrl} alt={product.name} />
                                            {product.stock === 0 && (
                                                <div className="product-card__badge product-card__badge--out-of-stock">
                                                    Out of Stock
                                                </div>
                                            )}
                                        </div>

                                        <div className="product-card__content">
                                            <div className="product-card__category">{product.category}</div>
                                            <h3 className="product-card__title">{product.name}</h3>

                                            <div className="product-card__seller">
                                                By {product.sellerName}
                                            </div>

                                            <div className="product-card__rating">
                                                <span className="rating-stars">
                                                    {'★'.repeat(Math.round(product.averageRating))}
                                                    {'☆'.repeat(5 - Math.round(product.averageRating))}
                                                </span>
                                                <span className="rating-count">
                                                    ({product.totalReviews})
                                                </span>
                                            </div>

                                            <div className="product-card__footer">
                                                <div className="product-card__price">
                                                    {product.price.toLocaleString()} RWF
                                                </div>
                                                {product.stock > 0 && product.stock < 10 && (
                                                    <div className="product-card__stock">
                                                        Only {product.stock} left
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        className="btn btn--secondary"
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1}
                                    >
                                        Previous
                                    </button>

                                    <div className="pagination__info">
                                        Page {pagination.currentPage} of {pagination.totalPages}
                                    </div>

                                    <button
                                        className="btn btn--secondary"
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage === pagination.totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default ProductList;
