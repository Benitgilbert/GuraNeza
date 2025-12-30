import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import '../admin/admin.css';

const ProductForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'url'
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: 'Electronics',
        imageUrl: ''
    });

    const menuItems = [
        { path: '/seller/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/seller/profile', icon: '🏪', label: 'My Profile' },
        { path: '/seller/products', icon: '📦', label: 'My Products' },
        { path: '/seller/orders', icon: '🛒', label: 'My Orders' },
    ];

    const categories = [
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

    useEffect(() => {
        if (isEditMode) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/products/${id}`);

            if (response.data.success) {
                const product = response.data.data.product;
                setFormData({
                    name: product.name || '',
                    description: product.description || '',
                    price: product.price || '',
                    stock: product.stock || '',
                    category: product.category || 'Electronics',
                    imageUrl: product.imageUrl || ''
                });
            }
        } catch (err) {
            console.error('Error fetching product:', err);
            setError(err.response?.data?.message || 'Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return;
            }

            setImageFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                // Store base64 in formData
                setFormData({
                    ...formData,
                    imageUrl: reader.result
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const productData = {
                ...formData,
                price: Number(formData.price),
                stock: Number(formData.stock)
            };

            let response;
            if (isEditMode) {
                response = await api.put(`/products/${id}`, productData);
            } else {
                response = await api.post('/products', productData);
            }

            if (response.data.success) {
                navigate('/seller/products');
            }
        } catch (err) {
            console.error('Error saving product:', err);
            console.error('Error response:', err.response?.data);
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save product';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout menuItems={menuItems} title={isEditMode ? 'Edit Product' : 'Add New Product'}>
            {error && (
                <div className="alert alert--danger">
                    <strong>Error:</strong> {error}
                    <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            <div className="card">
                <div className="card__header">
                    <h2 className="card__title">{isEditMode ? 'Edit Product' : 'Create New Product'}</h2>
                </div>
                <div className="card__body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Product Name *</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                minLength={3}
                                maxLength={200}
                                placeholder="Enter product name"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description *</label>
                            <textarea
                                name="description"
                                className="form-input"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                minLength={10}
                                maxLength={2000}
                                rows={4}
                                placeholder="Describe your product"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Price (RWF) *</label>
                                <input
                                    type="number"
                                    name="price"
                                    className="form-input"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    min={0}
                                    step={1}
                                    placeholder="0"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Stock Quantity *</label>
                                <input
                                    type="number"
                                    name="stock"
                                    className="form-input"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    required
                                    min={0}
                                    step={1}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Category *</label>
                            <select
                                name="category"
                                className="form-select"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Product Image *</label>

                            {/* Upload Method Toggle */}
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <button
                                    type="button"
                                    className={`btn btn--sm ${uploadMethod === 'file' ? 'btn--primary' : 'btn--secondary'}`}
                                    onClick={() => setUploadMethod('file')}
                                >
                                    📤 Upload File
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn--sm ${uploadMethod === 'url' ? 'btn--primary' : 'btn--secondary'}`}
                                    onClick={() => setUploadMethod('url')}
                                >
                                    🔗 Use URL
                                </button>
                            </div>

                            {/* File Upload */}
                            {uploadMethod === 'file' && (
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="form-input"
                                        style={{ padding: '0.5rem' }}
                                    />
                                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
                                        Supported: JPG, PNG, GIF, WebP (Max 5MB)
                                    </p>
                                </div>
                            )}

                            {/* URL Input */}
                            {uploadMethod === 'url' && (
                                <input
                                    type="url"
                                    name="imageUrl"
                                    className="form-input"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                    placeholder="https://example.com/image.jpg"
                                />
                            )}

                            {/* Image Preview */}
                            {(imagePreview || formData.imageUrl) && (
                                <div style={{ marginTop: '1rem' }}>
                                    <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Preview:</p>
                                    <img
                                        src={imagePreview || formData.imageUrl}
                                        alt="Product preview"
                                        style={{
                                            maxWidth: '300px',
                                            maxHeight: '300px',
                                            borderRadius: '8px',
                                            border: '2px solid #e2e8f0',
                                            objectFit: 'cover'
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            setError('Failed to load image. Please try another file or URL.');
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button
                                type="submit"
                                className="btn btn--primary"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : (isEditMode ? 'Update Product' : 'Create Product')}
                            </button>
                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={() => navigate('/seller/products')}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div >
        </DashboardLayout >
    );
};

export default ProductForm;
