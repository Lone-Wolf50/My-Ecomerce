import React, { useState, useEffect } from 'react';
// 1. You MUST import the context and the logic functions
import CartContext from './CartContext'; 
import { addItemToCart, calculateTotals, updateItemQuantity } from './CartLogic';

export default function CartProvider({ children }) {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('luxe_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [toast, setToast] = useState(null);

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('luxe_cart');
    };

    useEffect(() => {
        localStorage.setItem('luxe_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
        // These rely on the imports above
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

    // calculateTotals also comes from the import
    const { count, total } = calculateTotals(cart);

    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toast,
        cartCount: count,
        cartTotal: total
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}