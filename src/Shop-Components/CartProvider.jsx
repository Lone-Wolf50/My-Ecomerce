import React, { useState, useEffect } from 'react';
import CartContext from './CartContext';
import { addItemToCart, calculateTotals, updateItemQuantity } from './CartLogic';

export default function CartProvider({ children }) {
    // Initialize from LocalStorage
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('luxe_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [toast, setToast] = useState(null);

    // Save to LocalStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('luxe_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
        setCart(prev => addItemToCart(prev, product));
        setToast(`${product.name} added to bag`);
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => String(item.id) !== String(id)));
    };

    const updateQuantity = (id, delta) => {
        setCart(prev => updateItemQuantity(prev, id, delta));
    };

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const { count, total } = calculateTotals(cart);

    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        toast,
        cartCount: count,
        cartTotal: total
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}