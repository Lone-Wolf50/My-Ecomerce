import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import { supabase } from "../Database-Server/Superbase-client.js";
import Swal from 'sweetalert2';

import OrderTrackingPage from "./OrderTrackingPage.jsx";
import Homepage          from "./Homepage.jsx";
import Cart              from "./Cart.jsx";
import CategoryPage      from "./CategoryPage.jsx";
import ShopAllPage       from "./ShopAllPage.jsx";
import ProductDetail     from "./ProductDetail.jsx";
import CheckoutPage      from "./CheckoutPage.jsx";
import OrderConfirmed    from "./OrderConfirmed.jsx";
import AuthPage          from "./AuthPage.jsx";
import Orders            from "./Orders.jsx";
import Reviews           from "./Reviews.jsx";
import Inbox             from "./Inbox.jsx";
import AdminDashboard    from "./Admin/AdminDashboard.jsx";
import Support           from "./Supports/Support.jsx";

// Crypto polyfill
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
  const location  = useLocation();
  const navigate  = useNavigate();

  /* Login success — no popup, loader already handled the transition */
  useEffect(() => {
    sessionStorage.removeItem('loginSuccessFlag');
    sessionStorage.removeItem('tempUserName');
  }, []);

  /* Session init */
  useEffect(() => {
    async function getInitialSession() {
      const manualUser = sessionStorage.getItem('userEmail');
      if (manualUser) {
        setSession({ user: { email: manualUser } });
      } else {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
      }
      setLoading(false);
    }
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s && !sessionStorage.getItem('userEmail')) setSession(null);
      else if (s) setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  /* Multi-device security check */
  useEffect(() => {
    const check = async () => {
      const uuid    = sessionStorage.getItem('userUuid');
      const localId = sessionStorage.getItem('current_device_session');
      if (!uuid || !localId) return;
      try {
        const { data } = await supabase.from('profiles').select('last_session_id').eq('id', uuid).maybeSingle();
        if (data && data.last_session_id !== localId) {
          sessionStorage.clear(); localStorage.clear();
          Swal.fire({ title: "SESSION EXPIRED", text: "Another device signed in. This session is terminated.", icon: "warning", confirmButtonColor: "#000" })
            .then(() => { window.location.href = "/login"; });
        }
      } catch (err) { console.error("Security check:", err); }
    };
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  // Scroll-to-top on every route change.
  // WHY: React Router never reloads the page so window scroll position persists
  // between routes. Without this, navigating from a scrolled page dumps you
  // halfway down the next page.
  useEffect(() => {
    console.log(
      `%c[ScrollReset] ${location.pathname} → window.scrollTo(0,0)`,
      'color:#C9A227;font-weight:bold;font-size:11px;'
    );
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

    const isAdmin = session && sessionStorage.getItem("isAdmin") === "true";

  if (loading) return (
    <div className="h-screen bg-[#FDFBF7] flex items-center justify-center">
      <div className="w-9 h-9 border-[3px] border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="bg-[#F7F5F0] font-sans text-black">
      <Routes>
        {/* ── Public routes ─────────────────────────────────── */}
        <Route path="/"                  element={<Homepage />} />
        <Route path="/shop/all"          element={<ShopAllPage />} />
        <Route path="/shop/:categoryName" element={<CategoryPage />} />
        <Route path="/product/:id"       element={<ProductDetail />} />
        <Route path="/reviews"           element={<Reviews />} />
        <Route path="/support"           element={<Support />} />

        {/* Login — redirect home if already signed in */}
        <Route path="/login"             element={!session ? <AuthPage /> : <Navigate to="/" replace />} />

        {/* ── Protected: requires login ──────────────────── */}
        <Route path="/cart"         element={session ? <Cart />         : <Navigate to="/login" state={{ from: location }} replace />} />
        <Route path="/orders"       element={session ? <Orders />       : <Navigate to="/login" replace />} />
        <Route path="/inbox"        element={session ? <Inbox />        : <Navigate to="/login" replace />} />
        <Route path="/checkout"     element={session ? <CheckoutPage /> : <Navigate to="/login" state={{ from: location }} replace />} />
        <Route path="/order-confirmed" element={session ? <OrderConfirmed /> : <Navigate to="/" />} />
        <Route path="/track/:Id"    element={session ? <OrderTrackingPage /> : <Navigate to="/login" replace />} />

        {/* ── Admin only ─────────────────────────────────── */}
        <Route path="/admin-dashboard" element={isAdmin ? <AdminDashboard /> : <Navigate to="/login" replace />} />

        {/* ── 404 ────────────────────────────────────────── */}
        <Route path="*" element={
          <div className="h-screen bg-[#FDFBF7] flex flex-col items-center justify-center text-center p-6 gap-6">
            <h1 className="text-[120px] font-serif italic text-[#D4AF37]/20 leading-none">404</h1>
            <p className="text-[13px] font-black uppercase tracking-widest text-black/25">Page Not Found</p>
            <button onClick={() => navigate('/')}
              className="bg-black text-white px-10 py-4 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-[#C9A227] transition-all"
            >
              Return to Home
            </button>
          </div>
        } />
      </Routes>
    </div>
  );
}

export default RoutePages;