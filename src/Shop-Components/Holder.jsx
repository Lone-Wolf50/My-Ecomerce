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
import UpdatePassword from "./UpdatePassword.jsx"; // Ensure this filename matches!

function Holder() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for auth changes (Login, Logout, Password Recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      // IT Tip: If the event is PASSWORD_RECOVERY, Supabase has verified the email link
      if (event === "PASSWORD_RECOVERY") {
        console.log("Lone Wolf, recovery mode activated.");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-[#D4AF37] font-black tracking-[0.5em] animate-pulse uppercase text-xs">Initializing Atelier...</p>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen font-display text-off-white relative">
      <Notification />
      <Routes>
        {/* PUBLIC ROUTE: Always accessible (especially from email links) */}
        <Route path="/update-password" element={<UpdatePassword />} />

        {/* AUTH LOGIC */}
        {!session ? (
          // IF NOT LOGGED IN: Every other path sends them to AuthPage
          <Route path="*" element={<AuthPage />} />
        ) : (
          // IF LOGGED IN: Full App access
          <>
            <Route path="/" element={<Homepage />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/shop/:categoryName" element={<CategoryPage />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/order-confirmed" element={<OrderConfirmed />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            {/* Catch-all for logged in users to prevent 404s */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </div>
  );
}

export default Holder;