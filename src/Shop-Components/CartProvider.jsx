import React, { useState, useEffect, useMemo } from 'react';
import CartContext from './CartContext'; 
import { addItemToCart, calculateTotals, updateItemQuantity } from './CartLogic';
import { supabase } from "../Database-Server/Superbase-client.js";

const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const saved = localStorage.getItem('luxe_cart');
            return (saved && saved !== "undefined" && saved !== "null") ? JSON.parse(saved) : [];
        } catch (err) {
            console.error("Cart Initialization Error:", err);
            return [];
        }
    });

    const [isSyncing, setIsSyncing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const { count, total } = useMemo(() => calculateTotals(cart), [cart]);

    useEffect(() => {
        localStorage.setItem('luxe_cart', JSON.stringify(cart));
    }, [cart]);

    const fetchCloudCart = async (userId) => {
        try {
            setIsSyncing(true);
            const { data, error } = await supabase
                .from('active_sessions_cart') 
                .select(`quantity, product_id, image, price, name, category`)
                .eq('user_id', userId);

            if (!error && data?.length > 0) {
                const cloudItems = data.map(item => ({
                    id: item.product_id,
                    quantity: item.quantity,
                    image: item.image,
                    price: item.price,
                    name: item.name,
                    category: item.category
                }));
                setCart(cloudItems);
            }
        } catch (err) {
            console.error("Cloud Sync Error:", err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        const handleInitialAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) await fetchCloudCart(session.user.id);
        };
        handleInitialAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                await fetchCloudCart(session.user.id);
            }
            if (event === 'SIGNED_OUT') {
                setCart([]);
                localStorage.removeItem('luxe_cart');
            }
        });

        return () => subscription?.unsubscribe();
    }, []);

    const addToCart = async (product) => {
        const newCart = addItemToCart(cart, product);
        setCart(newCart);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await supabase.from('active_sessions_cart').upsert({
                user_id: session.user.id,
                product_id: product.id,
                quantity: 1, 
                image: product.image,
                price: product.price,
                name: product.name,
                category: product.category
            }, { onConflict: 'user_id, product_id' });
        }
    };

    const removeFromCart = async (id) => {
        const newCart = cart.filter(item => item.id !== id);
        setCart(newCart);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await supabase.from('active_sessions_cart').delete().eq('user_id', session.user.id).eq('product_id', id);
        }
    };

    const updateQuantity = async (id, delta) => {
        const newCart = updateItemQuantity(cart, id, delta);
        setCart(newCart);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const item = newCart.find(i => i.id === id);
            if (item) {
                await supabase.from('active_sessions_cart').update({ quantity: item.quantity }).eq('user_id', session.user.id).eq('product_id', id);
            } else {
                await removeFromCart(id);
            }
        }
    };

    const clearCart = async () => {
        setCart([]);
        localStorage.removeItem('luxe_cart');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await supabase.from('active_sessions_cart').delete().eq('user_id', session.user.id);
        }
    };
const handleConfirmOrder = async (formData) => {
    try {
        setIsProcessing(true); // Start the loading state
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) throw new Error("Session expired.");

        const { error } = await supabase
            .from('orders')
            .insert([{
                user_id: session.user.id,
                customer_name: formData.customer_name,
                customer_email: formData.customer_email,
                phone_number: formData.phone_number,
                delivery_method: formData.delivery_method,
                payment_method: formData.payment_method,
                total_amount: total,
                items: cart,
                status: 'pending'
            }]);

        if (error) throw error;

        // Clear the cart locally and in Supabase before finishing
        await clearCart(); 
        
        setIsProcessing(false); // Stop loading BEFORE returning
        return { success: true };

    } catch (err) {
        setIsProcessing(false); // Stop loading on error too
        console.error("Checkout Error:", err.message);
        return { success: false, error: err.message };
    }
};
    return (
        <CartContext.Provider value={{ 
            cart, addToCart, removeFromCart, updateQuantity, clearCart,
            isSyncing, isProcessing, handleConfirmOrder,
            cartCount: count, cartTotal: total 
        }}>
            {children}
        </CartContext.Provider>
    );
};

export default CartProvider;