import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getUser, logout } from '../utils/auth';
import './DashboardLayout.css';

const DashboardLayout = ({ children, menuItems, title }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const user = getUser();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <div className="dashboard">
            {/* Sidebar */}
            <aside className={`dashboard__sidebar ${sidebarOpen ? 'dashboard__sidebar--open' : ''}`}>
                <div className="dashboard__sidebar-header">
                    <Link to="/" className="dashboard__logo">
                        🛍️ GuraNeza
                    </Link>
                    <button className="dashboard__close-btn" onClick={closeSidebar}>
                        ✕
                    </button>
                </div>

                <nav className="dashboard__nav">
                    {menuItems.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            className={`dashboard__nav-item ${isActive(item.path) ? 'dashboard__nav-item--active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <span className="dashboard__nav-icon">{item.icon}</span>
                            <span className="dashboard__nav-label">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="dashboard__sidebar-footer">
                    <button className="dashboard__logout-btn" onClick={handleLogout}>
                        <span className="dashboard__nav-icon">🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div className="dashboard__overlay" onClick={closeSidebar}></div>
            )}

            {/* Main Content */}
            <div className="dashboard__content">
                {/* Header */}
                <header className="dashboard__header">
                    <button className="dashboard__menu-btn" onClick={toggleSidebar}>
                        ☰
                    </button>

                    <h1 className="dashboard__title">{title}</h1>

                    <div className="dashboard__user-menu">
                        <button
                            className="dashboard__user-btn"
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                        >
                            <div className="dashboard__user-avatar">
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="dashboard__user-email">{user?.email}</span>
                            <span className="dashboard__user-arrow">▼</span>
                        </button>

                        {userMenuOpen && (
                            <div className="dashboard__user-dropdown">
                                <div className="dashboard__user-info">
                                    <p className="dashboard__user-role">
                                        {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                                    </p>
                                </div>
                                <button
                                    className="dashboard__dropdown-item"
                                    onClick={handleLogout}
                                >
                                    <span>🚪</span> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="dashboard__main">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
