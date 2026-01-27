import React, { useState, useEffect, useCallback } from 'react';
import CartContext from './CartContext'; 
import { addItemToCart, calculateTotals, updateItemQuantity } from './CartLogic';
import { supabase } from "../Database-Server/Superbase-client.js";

export default function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [toast, setToast] = useState(null);

    // --- 1. THE SYNC ENGINE (Database -> UI) ---
    const syncWithSupabase = useCallback(async (userId) => {
        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                quantity,
                product_id,
                products (name, price, image, material)
            `) 
            .eq('user_id', userId);

        if (!error && data) {
            // Transform the DB join into your app's cart format
            const cloudCart = data.map(item => ({
                id: item.product_id,
                quantity: item.quantity,
                ...item.products 
            }));
            setCart(cloudCart);
        }
    }, []);

    // --- 2. THE AUTH WATCHER ---
    useEffect(() => {
        // Initial check on load
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) syncWithSupabase(session.user.id);
        });

        // Listen for Login/Logout events across devices
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                syncWithSupabase(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                setCart([]); 
                localStorage.removeItem('luxe_cart');
            }
        });

        return () => subscription.unsubscribe();
    }, [syncWithSupabase]);

    // --- 3. LOCAL STORAGE (For Guests) ---
    useEffect(() => {
        // Only save to localStorage if not logged in (to prevent overwriting DB logic)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                localStorage.setItem('luxe_cart', JSON.stringify(cart));
            }
        };
        checkSession();
    }, [cart]);

    // --- 4. PERSISTENT ACTIONS ---

    const addToCart = async (product) => {
        setCart(prev => addItemToCart(prev, product));
        setToast(`${product.name} added to bag`);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('cart_items').upsert({
                user_id: user.id,
                product_id: product.id,
                quantity: 1, 
            }, { onConflict: 'user_id, product_id' });
        }
    };

    const removeFromCart = async (id) => {
        setCart(prev => prev.filter(item => String(item.id) !== String(id)));
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('cart_items')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', id);
        }
    };

    const updateQuantity = async (id, delta) => {
        const updatedCart = updateItemQuantity(cart, id, delta);
        setCart(updatedCart);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const item = updatedCart.find(i => String(i.id) === String(id));
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
            await supabase.from('cart_items')
                .delete()
                .eq('user_id', user.id);
        }
    };

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const { count, total } = calculateTotals(cart);

    return (
        <CartContext.Provider value={{ 
            cart, 
            addToCart, 
            removeFromCart, 
            updateQuantity, 
            clearCart, 
            toast, 
            cartCount: count, 
            cartTotal: total 
        }}>
            {children}
        </CartContext.Provider>
    );
}