import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import CartContext from "./CartContext";
import { addItemToCart, calculateTotals, updateItemQuantity } from "./CartLogic";
import { supabase } from "../Database-Server/Superbase-client.js";

// ── Input guard ────────────────────────────────────────────────
const isSafeEmail = (v) =>
  typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("luxe_cart");
      const parsed = saved && saved !== "undefined" && saved !== "null"
        ? JSON.parse(saved)
        : [];
      // Basic integrity check — must be an array of objects with id
      return Array.isArray(parsed) ? parsed.filter((i) => i && i.id) : [];
    } catch {
      return [];
    }
  });

  const [isSyncing,    setIsSyncing]    = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Guard: prevent fetchCloudCart from running more than once on mount
  const hasSyncedRef = useRef(false);

  const { count, total } = useMemo(() => calculateTotals(cart), [cart]);

  /* ── 1. Keep localStorage in sync ──────────────────────────── */
  useEffect(() => {
    localStorage.setItem("luxe_cart", JSON.stringify(cart));
  }, [cart]);

  /* ── UUID helper — always verifies on first load ───────────── */
  const getUserUuid = useCallback(async (email) => {
    if (!isSafeEmail(email)) return null;

    // Use cached UUID only if it looks valid
    const cached = sessionStorage.getItem("userUuid");
    if (cached && cached !== "undefined" && cached !== "null" && cached.length > 10) {
      return cached;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (error || !data) return null;
    sessionStorage.setItem("userUuid", data.id);
    return data.id;
  }, []);

  /* ── Cloud sync helper ──────────────────────────────────────── */
  const fetchCloudCart = useCallback(
    async (email) => {
      if (isSyncing) return;

      try {
        setIsSyncing(true);
        // Clear cached UUID so we always fetch fresh on new device
        const cached = sessionStorage.getItem("userUuid");
        const uuid = cached && cached !== "undefined" && cached !== "null"
          ? cached
          : await getUserUuid(email);
        if (!uuid) return;

        const { data, error } = await supabase
          .from("active_sessions_cart")
          .select("product_id, quantity, image, price, name, category")
          .eq("user_id", uuid);

        if (error) throw error;

        const cloudItems = Array.isArray(data)
          ? data
              .filter((item) => item.product_id && typeof item.quantity === "number")
              .map((item) => ({
                id:       item.product_id,
                quantity: Math.max(1, item.quantity),
                image:    item.image    || "",
                price:    item.price    || 0,
                name:     item.name     || "",
                category: item.category || "",
              }))
          : [];

        // Only replace local cart if cloud actually has items.
        // An empty cloud result on refresh means the sync hasn't settled yet —
        // don't wipe what's already loaded from localStorage.
        if (cloudItems.length === 0) return;

        setCart((current) => {
          if (JSON.stringify(current) === JSON.stringify(cloudItems)) return current;
          return cloudItems;
        });
      } catch (err) {
        /* cart sync failed silently — localStorage copy preserved */
      } finally {
        setIsSyncing(false);
      }
    },
    [getUserUuid, isSyncing]
  );

  /* ── 2. ONE-TIME cloud sync on mount ────────────────────────── */
  useEffect(() => {
    if (hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    const email = sessionStorage.getItem("userEmail");
    if (isSafeEmail(email)) {
      // Already logged in on this device — load from cloud
      fetchCloudCart(email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← Empty array is intentional and correct here

  /* ── 2b. Sync when user logs in on THIS device/tab ──────────── */
  // The storage event only fires for OTHER tabs. This covers the current tab
  // login flow — e.g. user signs in on a new device and cart should load.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email) {
        // Small delay so AuthPage can finish writing userEmail to sessionStorage
        setTimeout(() => {
          const email = sessionStorage.getItem("userEmail") || session.user.email;
          if (isSafeEmail(email)) fetchCloudCart(email);
        }, 500);
      }
      if (event === "SIGNED_OUT") {
        setCart([]);
        localStorage.removeItem("luxe_cart");
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchCloudCart]);

  /* ── 3. Sync when another tab logs in/out ───────────────────── */
  useEffect(() => {
    const onStorage = (e) => {
      // Only react to userEmail changes from other tabs
      if (e.key !== "userEmail") return;
      const email = e.newValue;
      if (isSafeEmail(email)) {
        fetchCloudCart(email);
      } else {
        // Logged out in another tab — clear local cart
        setCart([]);
        localStorage.removeItem("luxe_cart");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fetchCloudCart]);

  /* ── addToCart ──────────────────────────────────────────────── */
  const addToCart = useCallback(
    async (product) => {
      if (!product || !product.id) return;

      const updatedCart = addItemToCart(cart, product);
      setCart(updatedCart);

      const email = sessionStorage.getItem("userEmail");
      if (!isSafeEmail(email)) return;

      try {
        const uuid = await getUserUuid(email);
        if (!uuid) return;

        const existing = cart.find((i) => String(i.id) === String(product.id));
        const newQty   = existing ? existing.quantity + 1 : 1;

        const { error } = await supabase.from("active_sessions_cart").upsert(
          [
            {
              user_id:    uuid,
              product_id: product.id,
              quantity:   newQty,
              image:      product.image    || "",
              price:      product.price    || 0,
              name:       product.name     || "",
              category:   product.category || "",
            },
          ],
          { onConflict: "user_id,product_id" }
        );
        if (error) throw error;
      } catch (err) {
        /* addToCart cloud sync failed silently */
      }
    },
    [cart, getUserUuid]
  );

  /* ── removeFromCart ─────────────────────────────────────────── */
  const removeFromCart = useCallback(
    async (id) => {
      setCart((prev) => prev.filter((item) => item.id !== id));

      const email = sessionStorage.getItem("userEmail");
      if (!isSafeEmail(email)) return;

      try {
        const uuid = await getUserUuid(email);
        if (!uuid) return;
        const { error } = await supabase
          .from("active_sessions_cart")
          .delete()
          .eq("user_id", uuid)
          .eq("product_id", id);
        if (error) throw error;
      } catch (err) {
        /* removeFromCart cloud sync failed silently */
      }
    },
    [getUserUuid]
  );

  /* ── updateQuantity ─────────────────────────────────────────── */
  const updateQuantity = useCallback(
    async (id, delta) => {
      const current = cart.find((i) => String(i.id) === String(id));
      if (!current) return;

      const newQty  = Math.max(1, current.quantity + delta);
      const newCart = updateItemQuantity(cart, id, newQty);
      setCart(newCart);

      const email = sessionStorage.getItem("userEmail");
      if (!isSafeEmail(email)) return;

      try {
        const uuid = await getUserUuid(email);
        if (!uuid) return;
        const { error } = await supabase
          .from("active_sessions_cart")
          .update({ quantity: newQty })
          .eq("user_id", uuid)
          .eq("product_id", id);
        if (error) throw error;
      } catch (err) {
        /* updateQuantity cloud sync failed silently */
      }
    },
    [cart, getUserUuid]
  );

  /* ── clearCart ──────────────────────────────────────────────── */
  const clearCart = useCallback(async () => {
    setCart([]);
    localStorage.removeItem("luxe_cart");

    const email = sessionStorage.getItem("userEmail");
    if (!isSafeEmail(email)) return;

    try {
      const uuid = await getUserUuid(email);
      if (!uuid) return;
      const { error } = await supabase
        .from("active_sessions_cart")
        .delete()
        .eq("user_id", uuid);
      if (error) throw error;
    } catch (err) {
      /* clearCart cloud sync failed silently */
    }
  }, [getUserUuid]);

  /* ── handleConfirmOrder ─────────────────────────────────────── */
  const handleConfirmOrder = useCallback(
    async (formData) => {
      setIsProcessing(true);
      try {
        const email = sessionStorage.getItem("userEmail");
        const uuid  = await getUserUuid(email);
        if (!uuid) throw new Error("User identification failed. Please log in again.");

        // STEP 1: Insert order
        // Use the actual amount the client paid (includes delivery + processing fee)
        // CheckoutPage passes this as formData.paid_total; fall back to cart subtotal
        const paidTotal = formData.paid_total != null ? formData.paid_total : total;

        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert([
            {
              user_id:           uuid,
              customer_name:     formData.customer_name,
              customer_email:    formData.customer_email,
              phone_number:      formData.phone_number,
              delivery_method:   formData.delivery_method,
              payment_method:    formData.payment_method,
              total_amount:      paidTotal,
              // Delivery details
              delivery_type:     formData.delivery_method === "delivery" ? "door" : "pickup",
              delivery_location: formData.delivery_location || null,
              delivery_address:  formData.delivery_address  || null,
              delivery_fee:      formData.delivery_fee      || 0,
              // Payment reference
              payment_reference: formData.payment_reference || null,
              status:            "pending",
            },
          ])
          .select()
          .single();

        if (orderError) throw orderError;

        // STEP 2: Insert order_items
        const orderId       = orderData.id;
        const itemsToInsert = cart
          .filter((item) => item.id && item.quantity > 0 && item.price >= 0)
          .map((item) => ({
            order_id:   orderId,
            product_id: String(item.id),
            quantity:   item.quantity,
            price:      item.price,
          }));

        if (itemsToInsert.length === 0) throw new Error("No valid items to insert.");

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        // STEP 3: Clear cart
        await clearCart();
        return { success: true, orderId: orderData.id };
      } catch (err) {
        /* order placement error — returned to caller */
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [cart, total, getUserUuid, clearCart]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isSyncing,
        isProcessing,
        handleConfirmOrder,
        cartCount: count,
        cartTotal: total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;