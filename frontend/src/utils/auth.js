/**
 * Get stored authentication token
 */
export const getToken = () => {
    return localStorage.getItem('token');
};

/**
 * Store authentication token
 */
export const setToken = (token) => {
    localStorage.setItem('token', token);
};

/**
 * Remove authentication token
 */
export const removeToken = () => {
    localStorage.removeItem('token');
};

/**
 * Get stored user data
 */
export const getUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

/**
 * Store user data
 */
export const setUser = (user) => {
    localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Remove user data
 */
export const removeUser = () => {
    localStorage.removeItem('user');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
    return !!getToken();
};

/**
 * Get user role
 */
export const getUserRole = () => {
    const user = getUser();
    return user?.role || null;
};

/**
 * Check if user has specific role
 */
export const hasRole = (role) => {
    const userRole = getUserRole();
    if (Array.isArray(role)) {
        return role.includes(userRole);
    }
    return userRole === role;
};

/**
 * Login - store token and user data
 */
export const login = (token, user) => {
    setToken(token);
    setUser(user);
};

/**
 * Logout - clear all auth data
 */
export const logout = () => {
    removeToken();
    removeUser();
    window.location.href = '/login';
};
