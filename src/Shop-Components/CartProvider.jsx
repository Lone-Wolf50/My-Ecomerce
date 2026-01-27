import React, { useState, useEffect } from 'react';
import CartContext from './CartContext'; 
import { addItemToCart, calculateTotals, updateItemQuantity } from './CartLogic';
import { supabase } from "../Database-Server/Superbase-client.js";

export default function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [toast, setToast] = useState(null);

    // 1. Initial Load: Get from LocalStorage first, then Sync from Supabase
    useEffect(() => {
        const initCart = async () => {
            // Load local backup
            const savedCart = localStorage.getItem('luxe_cart');
            if (savedCart) setCart(JSON.parse(savedCart));

            // Sync with Supabase if logged in
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data, error } = await supabase
                    .from('cart_items')
                    .select('*')
                    .eq('user_id', session.user.id);

                if (!error && data.length > 0) {
                    // Logic to map DB items to your cart state
                    // Note: You may need to fetch full product details here if not in DB
                    setCart(data.map(item => ({ id: item.product_id, quantity: item.quantity, ...item.metadata })));
                }
            }
        };
        initCart();
    }, []);

    // 2. Save to LocalStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('luxe_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = async (product) => {
        setCart(prev => addItemToCart(prev, product));
        setToast(`${product.name} added to bag`);

        // Database Sync
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('cart_items').upsert({
                user_id: user.id,
                product_id: product.id,
                quantity: 1, // You can adjust this based on current quantity
            }, { onConflict: 'user_id, product_id' });
        }
    };

    const removeFromCart = async (id) => {
        setCart(prev => prev.filter(item => String(item.id) !== String(id)));
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', id);
        }
    };

    const updateQuantity = async (id, delta) => {
        const newCart = updateItemQuantity(cart, id, delta);
        setCart(newCart);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const item = newCart.find(i => String(i.id) === String(id));
            if (item) {
                await supabase.from('cart_items')
                    .update({ quantity: item.quantity })
                    .eq('user_id', user.id)
                    .eq('product_id', id);
            }
        }
    };

    const clearCart = async () => {
        setCart([]);
        localStorage.removeItem('luxe_cart');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('cart_items').delete().eq('user_id', user.id);
        }
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
        clearCart,
        toast,
        cartCount: count,
        cartTotal: total
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}