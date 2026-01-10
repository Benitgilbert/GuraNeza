import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';
import { isAuthenticated, getUserRole } from '../utils/auth';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartCount, setCartCount] = useState(0);

    const fetchCartCount = async () => {
        if (!isAuthenticated() || getUserRole() !== 'customer') {
            setCartCount(0);
            return;
        }

        try {
            const response = await api.get('/cart');
            if (response.data.success) {
                const items = response.data.data.cart.items || [];
                // Count unique items or total quantity? 
                // Usually e-commerce uses total quantity, but some use unique items.
                // Let's use total quantity.
                const count = items.reduce((total, item) => total + item.quantity, 0);
                setCartCount(count);
            }
        } catch (error) {
            console.error('Error fetching cart count:', error);
            setCartCount(0);
        }
    };

    useEffect(() => {
        fetchCartCount();

        // Listen for login/logout events if possible, 
        // or just rely on components calling fetchCartCount when they mount or after actions.
    }, []);

    return (
        <CartContext.Provider value={{ cartCount, fetchCartCount, setCartCount }}>
            {children}
        </CartContext.Provider>
    );
};
