import React, { useState, useEffect, useMemo ,useCallback} from 'react';
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

    // 1. Existing effect: Keeps LocalStorage in sync with State
    useEffect(() => {
        localStorage.setItem('luxe_cart', JSON.stringify(cart));
    }, [cart]);

    // 2. NEW EFFECT: Handles the initial cloud sync when the app loads
    useEffect(() => {
        const userEmail = sessionStorage.getItem('userEmail');
        
        // Only run if we actually have an email and we haven't synced this session yet
        if (userEmail && userEmail !== "null") {
            console.log("🎬 [useEffect] Running one-time sync for:", userEmail);
            fetchCloudCart(userEmail);
        }

        // We leave the dependency array empty [] so it ONLY runs on Mount.
        // This prevents the infinite loop when 'cart' changes.
    }, []);

    // --- HELPER: GET UUID WITH CACHING ---
 // --- HELPER: GET UUID WITH CACHING ---
const getUserUuid = useCallback(async (email) => {
    console.log("🔍 [getUserUuid] checking for email:", email);
    
    if (!email || email === "null" || email === "undefined") {
        console.warn("🛑 [getUserUuid] Blocked: Invalid email provided.");
        return null;
    }
    
    const cachedId = sessionStorage.getItem('userUuid');
    if (cachedId && cachedId !== "undefined") {
        console.log("✅ [getUserUuid] Found cached UUID:", cachedId);
        return cachedId;
    }

    console.log("📡 [getUserUuid] Fetching from Supabase profiles...");
    const { data, error } = await supabase
        .from('profiles') 
        .select('id')
        .eq('email', email)
        .maybeSingle();
    
    if (error || !data) {
        console.error("❌ [getUserUuid] Supabase Error:", error?.message);
        return null;
    }

    console.log("💾 [getUserUuid] Storing new UUID:", data.id);
    sessionStorage.setItem('userUuid', data.id);
    return data.id;
}, []);
const fetchCloudCart = useCallback(async (email) => {
        if (isSyncing) {
            console.warn("⚠️ [fetchCloudCart] Already syncing, blocking duplicate call.");
            return;
        }

        console.log("📡 [fetchCloudCart] Fetching data for:", email);
        try {
            setIsSyncing(true);
            const uuid = await getUserUuid(email);
            if (!uuid) return;

           const { data, error } = await supabase
    .from('active_sessions_cart')
    .select(`quantity, product_id, image, price, name, category`)  // ← Add these
    .eq('user_id', uuid);

            if (error) throw error;

            if (data) {
               const cloudItems = data.map(item => ({
    id: item.product_id,
    quantity: item.quantity,
    image: item.image,
    price: item.price,
    name: item.name,        // ← Add
    category: item.category // ← Add
}));

                // STRICTURE CHECK: Does the new data actually differ from current state?
                setCart(current => {
                    const isIdentical = JSON.stringify(current) === JSON.stringify(cloudItems);
                    if (isIdentical) {
                        console.log("🛑 [fetchCloudCart] Data identical. Blocking state update to prevent loop.");
                        return current; 
                    }
                    console.log("✅ [fetchCloudCart] Data is NEW. Updating state.");
                    return cloudItems;
                });
            }
        } catch (err) {
            console.error("💥 [fetchCloudCart] Error:", err.message);
        } finally {
            setIsSyncing(false);
            console.log("🏁 [fetchCloudCart] Sync process complete.");
        }
    }, [getUserUuid]); // isSyncing is intentionally excluded to prevent re-creation

    useEffect(() => {
        console.log("🎬 [useEffect] Initializing Auth/Cart Sync");
        
        const handleAuthAction = () => {
            const userEmail = sessionStorage.getItem('userEmail');
            console.log("👤 [handleAuthAction] Detected Email:", userEmail);
            
            if (userEmail && userEmail !== "null") {
                fetchCloudCart(userEmail);
            }
        };

        handleAuthAction();

        // Check if multiple storage events are firing
        const storageListener = (e) => {
            console.log("💾 [StorageEvent] Key changed:", e.key);
            handleAuthAction();
        };

        window.addEventListener('storage', storageListener);
        return () => window.removeEventListener('storage', storageListener);
    }, [fetchCloudCart]);
 const addToCart = async (product) => {
    // 1. Update local UI immediately
    const updatedCart = addItemToCart(cart, product);
    setCart(updatedCart);

    // 2. Sync to Supabase if the user is logged in
    const userEmail = sessionStorage.getItem('userEmail');
    const cachedUuid = sessionStorage.getItem('userUuid');

    if (userEmail && userEmail !== "null") {
        try {
            // Get UUID (either from cache or DB)
            const uuid = cachedUuid || await getUserUuid(userEmail);
            if (!uuid) return;

            // Prepare the item for the database
          const cartItem = {
    user_id: uuid,
    product_id: product.id,
    quantity: product.quantity || 1,
    image: product.image,
    price: product.price,
    name: product.name,        // ← Add
    category: product.category // ← Add
};

            // Use upsert so that if the item exists, it just updates quantity
            const { error } = await supabase
                .from('active_sessions_cart')
                .upsert([cartItem], { onConflict: 'user_id, product_id' });

            if (error) throw error;
            console.log("☁️ [addToCart] Successfully synced to cloud.");
        } catch (err) {
            console.error("❌ [addToCart] Cloud sync failed:", err.message);
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

  const updateQuantity = async (id, change) => {
    const currentItem = cart.find(i => String(i.id) === String(id));
    if (!currentItem) return;

    // ✅ Convert delta into absolute quantity
    const newAbsoluteQuantity = currentItem.quantity + change;

    const newCart = updateItemQuantity(cart, id, newAbsoluteQuantity);

    // 🔥 This was missing before
    setCart(newCart);

    const userEmail = sessionStorage.getItem('userEmail');
    if (userEmail && userEmail !== "null") {
        const uuid = await getUserUuid(userEmail);
        const item = newCart.find(i => String(i.id) === String(id));

        if (uuid && item) {
            await supabase
                .from('active_sessions_cart')
                .update({ quantity: item.quantity })
                .eq('user_id', uuid)
                .eq('product_id', id);
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
};useEffect(() => {
        localStorage.setItem('luxe_cart', JSON.stringify(cart));
    }, [cart]);

    // 2. ONE-TIME CLOUD SYNC (BELOW EVERYTHING ELSE)
    useEffect(() => {
        const userEmail = sessionStorage.getItem('userEmail');
        
        if (userEmail && userEmail !== "null") {
            console.log("🎬 [useEffect] Running one-time sync for:", userEmail);
            fetchCloudCart(userEmail);
        }
        // This empty array [] is what stops the loop for good!
    }, []);

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