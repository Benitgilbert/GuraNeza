import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from './utils/auth';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import AuthCallback from './pages/AuthCallback';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSellers from './pages/admin/AdminSellers';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminShipping from './pages/admin/AdminShipping';
import AdminReviews from './pages/admin/AdminReviews';
import AdminSellerRequests from './pages/admin/AdminSellerRequests';
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProfile from './pages/seller/SellerProfile';
import SellerProducts from './pages/seller/SellerProducts';
import SellerOrders from './pages/seller/SellerOrders';
import ProductForm from './pages/seller/ProductForm';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerWishlist from './pages/customer/CustomerWishlist';
import CustomerAddresses from './pages/customer/CustomerAddresses';
import CustomerSettings from './pages/customer/CustomerSettings';
import SellerUpgradeRequest from './pages/customer/SellerUpgradeRequest';
import CompleteSellerSignup from './pages/CompleteSellerSignup';
import GoogleAuthCallback from './pages/GoogleAuthCallback';
import VerifyEmail from './pages/VerifyEmail';

// Placeholder components
const NotFound = () => <div className="container mt-xl"><h1>404 - Page Not Found</h1></div>;

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole) {
        const userRole = getUserRole();
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

        if (!allowedRoles.includes(userRole)) {
            return <Navigate to="/" replace />;
        }
    }

    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/google/success" element={<GoogleAuthCallback />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/:id" element={<ProductDetail />} />

                {/* Customer Routes */}
                <Route
                    path="/cart"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <Cart />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/checkout"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <Checkout />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/orders"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <OrderHistory />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/customer/dashboard"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <CustomerDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/customer/profile"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <CustomerProfile />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/customer/orders"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <CustomerOrders />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/customer/wishlist"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <CustomerWishlist />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/customer/addresses"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <CustomerAddresses />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/customer/settings"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <CustomerSettings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/customer/seller-request"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <SellerUpgradeRequest />
                        </ProtectedRoute>
                    }
                />

                {/* Seller Routes */}
                <Route
                    path="/seller/dashboard"
                    element={
                        <ProtectedRoute requiredRole="seller">
                            <SellerDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/seller/profile"
                    element={
                        <ProtectedRoute requiredRole="seller">
                            <SellerProfile />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/seller/products"
                    element={
                        <ProtectedRoute requiredRole="seller">
                            <SellerProducts />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/seller/orders"
                    element={
                        <ProtectedRoute requiredRole="seller">
                            <SellerOrders />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/products/new"
                    element={
                        <ProtectedRoute requiredRole="seller">
                            <ProductForm />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/products/:id/edit"
                    element={
                        <ProtectedRoute requiredRole="seller">
                            <ProductForm />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/seller/complete-signup"
                    element={
                        <ProtectedRoute requiredRole="seller">
                            <CompleteSellerSignup />
                        </ProtectedRoute>
                    }
                />

                {/* Admin Routes */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminUsers />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/sellers"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminSellers />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/products"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminProducts />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/seller-requests"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminSellerRequests />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/orders"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminOrders />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/orders/:id"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminOrderDetail />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/shipping"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminShipping />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/reviews"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminReviews />
                        </ProtectedRoute>
                    }
                />

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

export default App;
