import { Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import { supabase } from "../Database-Server/Superbase-client.js";
import Homepage from "./Homepage.jsx";
import Cart from "./Cart.jsx";
import Reviews from "./Reviews.jsx";
import CategoryPage from "./CategoryPage.jsx";
import ProductDetail from "./ProductDetail.jsx";
import Notification from "./Notification.jsx";
import CheckoutPage from "./CheckoutPage.jsx";
import OrderConfirmed from "./OrderConfirmed.jsx";
import AuthPage from "./AuthPage.jsx"; 
import UpdatePassword from "./UpdatePassword.jsx";

function Holder() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // IT Guardrail: Ensure the loading screen clears even if Supabase is slow
    const timeoutFallback = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth check timed out. Forcing UI load.");
        setLoading(false);
      }
    }, 5000); // 5-second safety net

    async function initializeAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) throw error;
          setSession(session);
        }
      } catch (err) {
        console.error("Supabase Auth Error:", err.message);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(timeoutFallback);
        }
      }
    }

    initializeAuth();

    // Listen for Auth Events (Login, Logout, Recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setSession(session);
        // Force loading to false if an event happens (like clicking a recovery link)
        setLoading(false); 
        
        if (event === "PASSWORD_RECOVERY") {
          console.log("Lone Wolf, Password Recovery flow detected.");
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutFallback);
    };
  }, [loading]);

  if (loading) {
    return (
      <div className="h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-[#D4AF37] font-black tracking-[0.5em] animate-pulse uppercase text-xs">
          Initializing Atelier...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen font-display text-off-white relative">
      <Notification />
      <Routes>
        {/* PUBLIC ROUTE: Accessible even when not logged in (Required for Email Links) */}
        <Route path="/update-password" element={<UpdatePassword />} />

  
        {!session ? (
        
          <Route path="*" element={<AuthPage />} />
        ) : (
      
          <>
            <Route path="/" element={<Homepage />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/shop/:categoryName" element={<CategoryPage />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/order-confirmed" element={<OrderConfirmed />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            {/* Prevent broken links for logged-in users */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </div>
  );
}

export default Holder;