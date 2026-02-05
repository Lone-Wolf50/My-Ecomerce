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

    // --- HELPER: GET UUID WITH CACHING ---
   const getUserUuid = async (email) => {
        if (!email) return null;
        
        const cachedId = sessionStorage.getItem('userUuid');
        if (cachedId) return cachedId;

        // CHANGED: Query 'profiles' instead of 'registry' to match your Foreign Key
        const { data, error } = await supabase
            .from('profiles') 
            .select('id')
            .eq('email', email)
            .maybeSingle();
        
        if (error || !data) {
            console.error("UUID Fetch Error:", error?.message);
            return null;
        }

        sessionStorage.setItem('userUuid', data.id);
        return data.id;
    };
    const fetchCloudCart = async (email) => {
        if (!email || email === "null") return;
        try {
            setIsSyncing(true);
            const uuid = await getUserUuid(email);
            if (!uuid) return;

            const { data, error } = await supabase
                .from('active_sessions_cart') 
                .select(`quantity, product_id, image, price`)
                .eq('user_id', uuid); 

            if (error) throw error;

            if (data?.length > 0) {
                const cloudItems = data.map(item => ({
                    id: item.product_id,
                    quantity: item.quantity,
                    image: item.image,
                    price: item.price,
                    name: "Product", 
                    category: "General"
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
            const userEmail = sessionStorage.getItem('userEmail'); 
            if (userEmail) await fetchCloudCart(userEmail);
        };
        handleInitialAuth();

        const handleAuthChange = () => {
            const userEmail = sessionStorage.getItem('userEmail');
            if (userEmail) {
                fetchCloudCart(userEmail);
            } else {
                setCart([]);
                sessionStorage.removeItem('userUuid');
                localStorage.removeItem('luxe_cart');
            }
        };

        window.addEventListener('storage', handleAuthChange);
        return () => window.removeEventListener('storage', handleAuthChange);
    }, []);

    const addToCart = async (product) => {
        const newCart = addItemToCart(cart, product);
        setCart(newCart);
        
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
            const uuid = await getUserUuid(userEmail);
            if (uuid) {
                // Find the item in the NEW cart state to get the correct quantity
                const updatedItem = newCart.find(item => item.id === product.id);

                // UPSERT: This handles the 409 Conflict by updating if the combo exists
                await supabase.from('active_sessions_cart').upsert({
                    user_id: uuid,
                    product_id: product.id,
                    quantity: updatedItem ? updatedItem.quantity : 1, 
                    image: product.image,
                    price: product.price
                }, { onConflict: 'user_id, product_id' }); 
            }
        }
    };
    const removeFromCart = async (id) => {
        const newCart = cart.filter(item => item.id !== id);
        setCart(newCart);
        
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
            const uuid = await getUserUuid(userEmail);
            if (uuid) {
                await supabase.from('active_sessions_cart')
                    .delete()
                    .eq('user_id', uuid)
                    .eq('product_id', id);
            }
        }
    };

    const updateQuantity = async (id, delta) => {
        const newCart = updateItemQuantity(cart, id, delta);
        setCart(newCart);
        
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
            const uuid = await getUserUuid(userEmail);
            const item = newCart.find(i => i.id === id);
            
            if (uuid && item) {
                await supabase.from('active_sessions_cart')
                    .update({ quantity: item.quantity })
                    .eq('user_id', uuid)
                    .eq('product_id', id);
            } else if (uuid && !item) {
                await removeFromCart(id);
            }
        }
    };

    const clearCart = async () => {
        setCart([]);
        localStorage.removeItem('luxe_cart');
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
            const uuid = await getUserUuid(userEmail);
            if (uuid) {
                await supabase.from('active_sessions_cart')
                    .delete()
                    .eq('user_id', uuid);
            }
        }
    };

  const handleConfirmOrder = async (formData) => {
    try {
        setIsProcessing(true);
        const userEmail = sessionStorage.getItem('userEmail');
        const uuid = await getUserUuid(userEmail);
        
        if (!uuid) throw new Error("User identification failed. Please log in again.");

        // STEP 1: Insert into the 'orders' table
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{
                user_id: uuid, 
                customer_name: formData.customer_name,
                customer_email: formData.customer_email,
                phone_number: formData.phone_number,
                delivery_method: formData.delivery_method,
                payment_method: formData.payment_method,
                total_amount: total,
                status: 'pending'
                // We no longer need 'items: cart' here because we are using a separate table!
            }])
            .select()
            .single(); // Get the newly created Order ID

        if (orderError) throw orderError;

        // STEP 2: Insert each cart item into 'order_items' table
        const orderId = orderData.id;
        const itemsToInsert = cart.map(item => ({
            order_id: orderId,         // Link to the order we just made
            product_id: item.id,       // From your cart logic
            quantity: item.quantity,
            price: item.price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        // Success: Clean up
        await clearCart(); 
        return { success: true };

    } catch (err) {
        console.error("Order Placement Error:", err.message);
        return { success: false, error: err.message };
    } finally {
        setIsProcessing(false);
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