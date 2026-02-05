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

  // --- NEW: LOGIN SUCCESS HANDLER ---
  useEffect(() => {
    const loginSuccess = sessionStorage.getItem('loginSuccessFlag');
    const userName = sessionStorage.getItem('tempUserName');

    if (loginSuccess === 'true') {
      Swal.fire({
        title: "ACCESS GRANTED",
        text: `Welcome back, ${userName || 'User'}. Initializing vault...`,
        icon: "success",
        confirmButtonColor: "#D4AF37",
        background: "#FDFBF7",
        color: "#000",
        timer: 3000,
        timerProgressBar: true,
        customClass: { 
          popup: 'rounded-[3rem] border border-black/5 shadow-2xl', 
          confirmButton: 'rounded-full px-10 py-3 uppercase text-[10px] font-black' 
        }
      });
      // Clear flags so it doesn't repeat
      sessionStorage.removeItem('loginSuccessFlag');
      sessionStorage.removeItem('tempUserName');
    }
  }, []);

  // --- 2. SESSION LISTENER ---
  useEffect(() => {
    async function getInitialSession() {
      const manualUser = sessionStorage.getItem('userEmail');
      
      if (manualUser) {
        setSession({ user: { email: manualUser } });
      } else {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
      }
      setLoading(false);
    }
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!currentSession && !sessionStorage.getItem('userEmail')) {
        setSession(null);
      } else if (currentSession) {
        setSession(currentSession);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 3. SECURITY ALERT ---
// --- 3. SECURITY ALERT ---// --- 3. SECURITY ALERT (UPDATED FIX) ---
// --- UPDATED SECURITY CHECK ---
useEffect(() => {
    const currentUserId = sessionStorage.getItem('userUuid');
    
    // STOP the 406 error: Don't query if we don't have a valid UUID yet
    if (!currentUserId || currentUserId === 'undefined') return; 

    const checkSessionSecurity = async () => {
        try {
            const { data: prof, error } = await supabase
                .from('profiles')
                .select('last_session_id')
                .eq('id', currentUserId)
                .maybeSingle(); // maybeSingle is safer than single()

            if (error || !prof) return;

            const localId = window.sessionStorage.getItem("current_device_session");
            if (localId && prof.last_session_id !== localId) {
                // Multi-device logout logic here...
                 await supabase.auth.signOut();
            window.sessionStorage.clear();
            window.localStorage.clear(); 
            }
        } catch (err) {
            console.error("Security Check Failed:", err);
        }
    };

    const interval = setInterval(checkSessionSecurity, 5000);
    return () => clearInterval(interval);
}, [navigate]);
      

  // Dependency on navigate ensures it stays activeoved 'session' as a dependency, using storage instead

  if (loading) return (
    <div className="h-screen bg-[#FDFBF7] flex items-center justify-center">
       <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen font-sans text-black relative">
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/shop/:categoryName" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/reviews" element={<Reviews />} />
        
        <Route path="/login" element={!session ? <AuthPage /> : <Navigate to="/" replace />} />

        <Route path="/cart" element={session ? <Cart /> : <Navigate to="/login" replace />} />
        <Route path="/checkout" element={session ? <CheckoutPage /> : <Navigate to="/login" state={{ from: location }} replace />} />
        <Route path="/orders" element={session ? <Orders /> : <Navigate to="/login" replace />} />
        <Route path="/order-confirmed" element={session ? <OrderConfirmed /> : <Navigate to="/" />} />

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