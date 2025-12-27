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

// Placeholder components - these will be created in future phases
const SellerDashboard = () => <div className="container mt-xl"><h1>Seller Dashboard (Coming Soon)</h1></div>;
const AdminDashboard = () => <div className="container mt-xl"><h1>Admin Dashboard (Coming Soon)</h1></div>;
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
                <Route path="/auth/callback" element={<AuthCallback />} />
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

                {/* Seller Routes */}
                <Route
                    path="/seller/dashboard"
                    element={
                        <ProtectedRoute requiredRole="seller">
                            <SellerDashboard />
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

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

export default App;
