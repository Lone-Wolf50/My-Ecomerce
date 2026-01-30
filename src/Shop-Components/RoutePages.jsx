import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import { supabase } from "../Database-Server/Superbase-client.js";
import Swal from 'sweetalert2';

import Homepage from "./Homepage.jsx";
import Cart from "./Cart.jsx";
import CategoryPage from "./CategoryPage.jsx";
import ProductDetail from "./ProductDetail.jsx";
import CheckoutPage from "./CheckoutPage.jsx";
import OrderConfirmed from "./OrderConfirmed.jsx";
import AuthPage from "./AuthPage.jsx"; 
import Orders from "./Orders.jsx"; 
import Reviews from "./Reviews.jsx";

// --- 1. CRYPTO POLYFILL ---
if (typeof window !== "undefined" && !window.crypto.randomUUID) {
  window.crypto.randomUUID = function() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  };
}

function RoutePages() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // --- 2. AUTH STATE LISTENER ---
  useEffect(() => {
    async function getInitialSession() {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setLoading(false);
    }
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 3. SINGLE SESSION ENFORCEMENT ---
  useEffect(() => {
    if (!session?.user) return;

    const checkSessionSecurity = async () => {
      const { data: prof } = await supabase
        .from('profiles')
        .select('last_session_id')
        .eq('id', session.user.id)
        .single();

      if (!prof?.last_session_id) return;
      const localId = window.sessionStorage.getItem("current_device_session");

      if (localId && prof.last_session_id !== localId) {
          await supabase.auth.signOut();
          window.sessionStorage.clear();
          window.localStorage.clear(); 
          
          Swal.fire({
            title: "SECURITY ALERT",
            text: "Account accessed on another device.",
            icon: "warning",
            confirmButtonColor: "#D4AF37",
            background: "#FDFBF7"
          }).then(() => {
            window.location.href = '/login'; 
          });
      }
    };

    const interval = setInterval(checkSessionSecurity, 5000);
    return () => clearInterval(interval);
  }, [session]);

  if (loading) return (
    <div className="h-screen bg-[#FDFBF7] flex items-center justify-center">
       <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen font-sans text-black relative">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Homepage />} />
        <Route path="/shop/:categoryName" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/reviews" element={<Reviews />} />
        
        {/* Auth Route - Redirect to home if already logged in */}
        <Route path="/login" element={!session ? <AuthPage /> : <Navigate to="/" replace />} />

        {/* Protected Routes - Require Session */}
        <Route path="/cart" element={session ? <Cart /> : <Navigate to="/login" replace />} />
        <Route path="/checkout" element={session ? <CheckoutPage /> : <Navigate to="/login" state={{ from: location }} replace />} />
        <Route path="/orders" element={session ? <Orders /> : <Navigate to="/login" replace />} />
        <Route path="/order-confirmed" element={session ? <OrderConfirmed /> : <Navigate to="/" />} />

        {/* 404 Handler */}
        <Route path="*" element={
          <div className="h-screen bg-[#FDFBF7] flex flex-col items-center justify-center text-center p-6">
            <h1 className="text-[120px] font-serif italic text-[#D4AF37] opacity-20">404</h1>
            <button onClick={() => navigate('/')} className="bg-black text-white px-10 py-5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-all duration-500">
                Return to Atelier
            </button>
          </div>
        } />
      </Routes>
    </div>
  );
}

export default RoutePages;