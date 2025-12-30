import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import './admin.css';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

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
        fetchProducts();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [products, searchTerm, categoryFilter]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/admin/products');

            if (response.data.success) {
                const productData = response.data.data || [];
                setProducts(Array.isArray(productData) ? productData : []);
            } else {
                setProducts([]);
                setError(response.data.message || 'Failed to load products');
            }
        } catch (err) {
            console.error('Error fetching products:', err);
            setProducts([]);
            // Don't display error - admin API is not implemented yet
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        if (!Array.isArray(products)) {
            setFilteredProducts([]);
            return;
        }

        let filtered = [...products];

        if (searchTerm) {
            filtered = filtered.filter(product =>
                product.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(product => product.category === categoryFilter);
        }

        setFilteredProducts(filtered);
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            setError('');
            setSuccess('');

            const response = await api.delete(`/admin/products/${productId}`);

            if (response.data.success) {
                setSuccess('Product deleted successfully');
                await fetchProducts();
            }
        } catch (err) {
            console.error('Error deleting product:', err);
            setError(err.response?.data?.message || 'Failed to delete product');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getCategories = () => {
        if (!Array.isArray(products)) return [];
        const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
        return categories.sort();
    };

    return (
        <DashboardLayout menuItems={menuItems} title="Product Management">
            {error && (
                <div className="alert alert--info">
                    <strong>ℹ️ Note:</strong> {error}
                    <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {filteredProducts.length === 0 && !loading && !error && (
                <div className="alert alert--info">
                    <strong>ℹ️ Info:</strong> No products found. The admin products API may not be implemented yet, or there are no products in the database.
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
                        <label className="form-label">Search by Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Filter by Category</label>
                        <select
                            className="form-select"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            {getCategories().map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card__header">
                    <h2 className="card__title">Products ({filteredProducts.length})</h2>
                </div>
                <div className="card__body">
                    {loading ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>Loading products...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <p className="text-center text-muted">No products found</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Product Name</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Seller</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(product => (
                                        <tr key={product._id}>
                                            <td><strong>{product.name}</strong></td>
                                            <td>{product.category}</td>
                                            <td>{formatCurrency(product.price)}</td>
                                            <td>
                                                <span className={product.stock > 0 ? 'badge badge--success' : 'badge badge--danger'}>
                                                    {product.stock} units
                                                </span>
                                            </td>
                                            <td>{product.sellerId?.storeName || product.sellerId?.email || 'N/A'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <button
                                                        className="btn btn--sm btn--secondary"
                                                        onClick={() => window.open(`/products/${product._id}`, '_blank')}
                                                    >
                                                        👁️ View
                                                    </button>
                                                    <button
                                                        className="btn btn--sm btn--danger"
                                                        onClick={() => handleDeleteProduct(product._id)}
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </div>
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

export default AdminProducts;
