import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../Database-Server/Superbase-client.js";
import Swal from "sweetalert2";
import {
  Package, ChevronRight, Clock, Truck, CheckCircle, XCircle,
  RotateCcw, ShoppingBag, ArrowLeft, AlertTriangle, RefreshCw,
} from "lucide-react";

/* ── Status Config — light-theme palette ─────────────────────── */
const STATUS_CONFIG = {
  pending:    { label: "Pending",    textColor: "text-amber-700",    bg: "bg-amber-50",    border: "border-amber-200",   dot: "bg-amber-500",    icon: Clock,        accent: "#D97706" },
  processing: { label: "Crafting",   textColor: "text-sky-700",      bg: "bg-sky-50",      border: "border-sky-200",     dot: "bg-sky-500",      icon: Package,      accent: "#0284C7" },
  shipped:    { label: "Shipped",    textColor: "text-violet-700",   bg: "bg-violet-50",   border: "border-violet-200",  dot: "bg-violet-500",   icon: Truck,        accent: "#7C3AED" },
  delivered:  { label: "Delivered",  textColor: "text-emerald-700",  bg: "bg-emerald-50",  border: "border-emerald-200", dot: "bg-emerald-500",  icon: CheckCircle,  accent: "#059669" },
  cancelled:  { label: "Cancelled",  textColor: "text-red-600",      bg: "bg-red-50",      border: "border-red-200",     dot: "bg-red-500",      icon: XCircle,      accent: "#DC2626" },
  returned:   { label: "Returned",   textColor: "text-stone-600",    bg: "bg-stone-100",   border: "border-stone-200",   dot: "bg-stone-400",    icon: RotateCcw,    accent: "#78716C" },
};

/* ── Return Countdown ────────────────────────────────────────── */
function ReturnCountdown({ deliveredAt, onReturn, isReturning }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!deliveredAt) return;
    const calc = () => {
      const deadline = new Date(new Date(deliveredAt).getTime() + 24 * 60 * 60 * 1000);
      const msLeft = deadline - Date.now();
      if (msLeft <= 0) { setTimeLeft(null); return; }
      const totalSecs = Math.floor(msLeft / 1000);
      setTimeLeft({
        days: Math.floor(totalSecs / 86400),
        hours: Math.floor((totalSecs % 86400) / 3600),
        mins: Math.floor((totalSecs % 3600) / 60),
        secs: totalSecs % 60,
        totalSecs,
        deadline,
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [deliveredAt]);

  if (!timeLeft) return null;
  const urgent = timeLeft.days === 0 && timeLeft.hours < 6;
  const pct = Math.max(0, Math.min(100, (timeLeft.totalSecs / 86400) * 100));

  return (
    <div className={`mt-4 rounded-2xl overflow-hidden border ${urgent ? "border-orange-200 bg-orange-50" : "border-emerald-200 bg-emerald-50"}`}>
      <div className="h-1 w-full bg-black/5">
        <div
          className={`h-full transition-all duration-1000 ${urgent ? "bg-gradient-to-r from-orange-400 to-red-500" : "bg-gradient-to-r from-emerald-400 to-teal-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="px-4 py-4">
        <p className={`text-[9px] font-black uppercase tracking-[0.35em] mb-3 ${urgent ? "text-orange-600" : "text-emerald-700"}`}>
          ⏱ Return Window {urgent ? "— Expires Soon" : "— 1-Day Policy"}
        </p>
        <div className="flex items-center gap-2 mb-4">
          {[
            { val: String(timeLeft.days).padStart(2, "0"),  label: "D" },
            { val: String(timeLeft.hours).padStart(2, "0"), label: "H" },
            { val: String(timeLeft.mins).padStart(2, "0"),  label: "M" },
            { val: String(timeLeft.secs).padStart(2, "0"),  label: "S" },
          ].map(({ val, label }, i) => (
            <React.Fragment key={label}>
              <div className={`flex-1 text-center py-2.5 rounded-xl ${urgent ? "bg-orange-100" : "bg-emerald-100"}`}>
                <p className={`text-[20px] font-black font-mono leading-none ${urgent ? "text-orange-700" : "text-emerald-700"}`}>{val}</p>
                <p className={`text-[7px] font-black uppercase tracking-widest mt-0.5 ${urgent ? "text-orange-500" : "text-emerald-500"}`}>{label}</p>
              </div>
              {i < 3 && <span className={`text-[16px] font-black pb-2 ${urgent ? "text-orange-300" : "text-emerald-300"}`}>:</span>}
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <p className={`text-[9px] font-bold ${urgent ? "text-orange-500" : "text-emerald-600"}`}>
            Deadline: {new Date(timeLeft.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); onReturn(); }}
            disabled={isReturning}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-sm ${
              urgent ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gradient-to-r from-emerald-500 to-teal-600"
            }`}
          >
            {isReturning ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <RotateCcw size={11} />}
            Return Item
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delivered Banner ─────────────────────────────────────────── */
function DeliveredBanner() {
  return (
    <div className="mt-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 overflow-hidden">
      <div className="h-px bg-gradient-to-r from-emerald-200/0 via-emerald-400 to-emerald-200/0 w-full" />
      <div className="px-4 py-3.5 flex items-start gap-3">
        <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle size={14} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-emerald-700 mb-1">Delivered — Thank You</p>
          <p className="text-[11px] text-emerald-700/80 font-medium leading-relaxed">
            Your piece has arrived. Thank you for choosing <strong>Janina Luxury Bags</strong> — wear it with pride.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Shipped Notice ───────────────────────────────────────────── */
function ShippedNotice() {
  return (
    <div className="mt-4 flex items-start gap-3 p-3.5 rounded-2xl bg-violet-50 border border-violet-200">
      <div className="w-7 h-7 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
        <Truck size={13} className="text-violet-600" />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-violet-700 mb-0.5">Your order is on its way!</p>
        <p className="text-[10px] font-medium text-violet-600/80 leading-relaxed">
          Shipping confirmation sent to your email. Cancel below if needed — return arranged on delivery.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN ORDERS COMPONENT
══════════════════════════════════════════════════════════════ */
export default function Orders() {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [returning, setReturning]   = useState(null);
  const navigate = useNavigate();

  const userEmail = sessionStorage.getItem("userEmail");
  const userId    = sessionStorage.getItem("userUuid");

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      let query = supabase
        .from("orders").select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (userId)         query = query.eq("user_id", userId);
      else if (userEmail) query = query.eq("customer_email", userEmail);
      else { setError("Not logged in"); setLoading(false); return; }
      const { data, error: err } = await query;
      if (err) setError(err.message);
      else setOrders(data || []);
    } catch { setError("Could not load orders. Please try again."); }
    finally { setLoading(false); }
  }, [userId, userEmail]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /* Real-time order updates */
  useEffect(() => {
    if (!userId && !userEmail) return;
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        const updated = payload.new;
        setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, userEmail]);

  const handleCancel = async (e, order) => {
    e.stopPropagation();
    const isShipped = order.status === "shipped";
    const result = await Swal.fire({
      title: isShipped ? "Cancel In-Transit Order?" : "Cancel This Order?",
      html: isShipped
        ? `<p style="color:#6b7280;font-size:13px">Order <strong>#${String(order.id).slice(0,8).toUpperCase()}</strong> is already on its way. Cancellation will be processed upon item return.</p>`
        : `<p style="color:#6b7280;font-size:13px">Order <strong>#${String(order.id).slice(0,8).toUpperCase()}</strong> will be permanently cancelled. This cannot be undone.</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel It",
      cancelButtonText: "Keep Order",
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#C9A227",
      customClass: { popup: "rounded-3xl", confirmButton: "rounded-xl font-black text-sm", cancelButton: "rounded-xl font-black text-sm" },
    });
    if (!result.isConfirmed) return;
    setCancelling(order.id);
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    if (!error) fetchOrders();
    setCancelling(null);
  };

  const handleReturn = async (order) => {
    const result = await Swal.fire({
      title: "Request a Return?",
      html: `<p style="color:#6b7280;font-size:13px">We'll arrange collection for order <strong>#${String(order.id).slice(0,8).toUpperCase()}</strong>. Our team will reach out within 24 hours.</p>`,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Yes, Return It",
      cancelButtonText: "Keep It",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#C9A227",
      customClass: { popup: "rounded-3xl", confirmButton: "rounded-xl font-black text-sm", cancelButton: "rounded-xl font-black text-sm" },
    });
    if (!result.isConfirmed) return;
    setReturning(order.id);
    const { error } = await supabase.from("orders").update({ status: "returned" }).eq("id", order.id);
    if (!error) fetchOrders();
    setReturning(null);
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };
  const formatCurrency = (amount) =>
    `GH₵${Number(amount || 0).toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl border border-[#C9A227]/30 bg-[#C9A227]/10 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/30">Loading Orders</p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
        <AlertTriangle size={22} className="text-red-500" />
      </div>
      <p className="text-[12px] font-black uppercase tracking-widest text-red-500">{error}</p>
      <button onClick={fetchOrders} className="px-6 py-3 rounded-full bg-[#C9A227] text-white text-[11px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-md">
        Try Again
      </button>
    </div>
  );

  /* ── Empty ── */
  if (orders.length === 0) return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="w-24 h-24 rounded-[2rem] bg-[#C9A227]/8 border border-[#C9A227]/15 flex items-center justify-center">
        <ShoppingBag size={36} className="text-[#C9A227]/40" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-black/30 mb-2">Order History</p>
        <h2 className="text-3xl font-serif italic text-black mb-2">No orders yet</h2>
        <p className="text-sm text-black/40 font-medium">Your crafted pieces will appear here once ordered.</p>
      </div>
      <Link to="/" className="px-10 py-4 rounded-full bg-black text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#C9A227] transition-all shadow-lg">
        Explore Collection
      </Link>
    </div>
  );

  /* ── Orders List ── */
  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32 md:pb-16">

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-[#C9A227]/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-[#C9A227]/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* ── Page Header ── */}
      <div className="relative z-10 max-w-2xl mx-auto px-5 pt-10 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2.5 mb-10 group"
        >
          <div className="w-10 h-10 rounded-full border border-black/10 bg-white flex items-center justify-center group-hover:bg-[#C9A227] group-hover:border-[#C9A227] transition-all duration-200 shadow-sm">
            <ArrowLeft size={15} className="text-black/40 group-hover:text-white transition-colors" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-black/30 group-hover:text-black/60 transition-colors">Back</span>
        </button>

        <div className="flex items-end justify-between gap-3 mb-2">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.38em] text-[#C9A227] mb-2">Purchase History</p>
            <h1 className="text-5xl font-black italic tracking-tighter text-black leading-none">My Orders</h1>
            <p className="text-[12px] text-black/35 font-bold mt-2 uppercase tracking-wider">
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 h-10 px-4 rounded-2xl border border-black/10 bg-white text-[9px] font-black uppercase tracking-widest text-black/35 hover:text-black hover:border-black/25 hover:shadow-md transition-all shrink-0 shadow-sm"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>

        {/* Gold rule */}
        <div className="h-px bg-gradient-to-r from-[#C9A227]/0 via-[#C9A227]/50 to-[#C9A227]/0 mt-6" />
      </div>

      {/* ── Order Cards ── */}
      <div className="relative z-10 max-w-2xl mx-auto px-5 space-y-4">
        {orders.map((order, index) => {
          const cfg  = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
          const Icon = cfg.icon;
          const items   = order.order_items || [];
          const preview = items[0];
          const canCancel = ["pending", "processing", "shipped"].includes(order.status);
          const isDelivered = order.status === "delivered";
          const deliveredAt = order.delivered_at || (isDelivered ? order.updated_at : null);
          const returnDeadline = deliveredAt
            ? new Date(new Date(deliveredAt).getTime() + 24 * 60 * 60 * 1000)
            : null;
          const showReturn = isDelivered && deliveredAt && returnDeadline && returnDeadline > new Date();

          return (
            <div
              key={order.id}
              onClick={() => navigate(`/track/${order.id}`)}
              className="relative group cursor-pointer rounded-3xl overflow-hidden transition-all duration-300 bg-white border border-black/[0.07] hover:border-[#C9A227]/40 hover:shadow-[0_12px_50px_rgba(201,162,39,0.12)] active:scale-[0.99] shadow-sm"
            >
              {/* Status left accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-3xl transition-all duration-300"
                style={{ backgroundColor: cfg.accent, opacity: 0.7 }}
              />

              {/* Order number badge */}
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/[0.04] border border-black/[0.07]">
                <span className="text-[8px] font-black text-black/20 uppercase tracking-widest">#{String(index + 1).padStart(2, "0")}</span>
              </div>

              <div className="pl-7 pr-5 pt-5 pb-5">

                {/* ── Top Row ── */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.38em] text-black/30 mb-1.5">Order Reference</p>
                    <p className="text-[16px] font-black text-black font-mono leading-none tracking-tight">
                      #{String(order.id).slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-[10px] text-black/35 font-medium mt-1.5 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[11px]">calendar_today</span>
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg.textColor} ${cfg.bg} ${cfg.border} shrink-0`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${order.status === "pending" || order.status === "processing" ? "animate-pulse" : ""}`} />
                    {cfg.label}
                  </span>
                </div>

                {/* ── Items Preview ── */}
                {items.length > 0 && (
                  <div className="flex items-center gap-3.5 mb-5 p-3.5 rounded-2xl bg-[#FDFBF7] border border-black/[0.06]">
                    <div className="flex -space-x-2.5">
                      {items.slice(0, 3).map((item, i) => (
                        <div
                          key={i}
                          className="w-12 h-12 rounded-xl border-2 border-white bg-stone-100 overflow-hidden shadow-md"
                          style={{ zIndex: 3 - i }}
                        >
                          {item.image
                            ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-black/20" /></div>}
                        </div>
                      ))}
                      {items.length > 3 && (
                        <div className="w-12 h-12 rounded-xl border-2 border-white bg-[#C9A227]/10 flex items-center justify-center shadow-md" style={{ zIndex: 0 }}>
                          <span className="text-[10px] font-black text-[#C9A227]">+{items.length - 3}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-black truncate">
                        {preview?.name || "Item"}
                        {items.length > 1 && <span className="text-black/30 font-bold"> +{items.length - 1} more</span>}
                      </p>
                      <p className="text-[10px] text-black/35 font-medium mt-0.5">
                        {items.reduce((s, i) => s + (i.quantity || 1), 0)} piece{items.reduce((s, i) => s + (i.quantity || 1), 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Bottom Row: Total + CTA ── */}
                <div className="flex items-center justify-between pt-4 border-t border-black/[0.06]">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.38em] text-black/25 mb-1">Total Paid</p>
                    <p className="text-[22px] font-black tracking-tighter leading-none" style={{ color: cfg.accent }}>
                      {formatCurrency(order.total_amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#C9A227]/10 border border-[#C9A227]/25 text-[#C9A227] text-[10px] font-black uppercase tracking-widest group-hover:bg-[#C9A227] group-hover:text-white transition-all duration-300">
                    Track <ChevronRight size={13} />
                  </div>
                </div>

                {/* ── Shipped Notice ── */}
                {order.status === "shipped" && (
                  <div onClick={e => e.stopPropagation()}>
                    <ShippedNotice />
                  </div>
                )}

                {/* ── Delivered Banner ── */}
                {isDelivered && (
                  <div onClick={e => e.stopPropagation()}>
                    <DeliveredBanner />
                  </div>
                )}

                {/* ── Cancel Button ── */}
                {canCancel && (
                  <div className="mt-4" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleCancel(e, order)}
                      disabled={cancelling === order.id}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-200 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {cancelling === order.id
                        ? <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        : <XCircle size={13} />}
                      {order.status === "shipped" ? "Cancel Order — In Transit" : "Cancel Order"}
                    </button>
                    {order.status === "shipped" && (
                      <p className="flex items-center justify-center gap-1 text-center text-[9px] text-black/25 font-medium mt-1.5">
                        <AlertTriangle size={9} />
                        Item already shipped — return will be arranged
                      </p>
                    )}
                  </div>
                )}

                {/* ── Return Countdown ── */}
                {showReturn && (
                  <div onClick={e => e.stopPropagation()}>
                    <ReturnCountdown
                      deliveredAt={order.delivered_at}
                      onReturn={() => handleReturn(order)}
                      isReturning={returning === order.id}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="relative z-10 max-w-2xl mx-auto px-5 pt-10 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/15">
          All times are in your local timezone
        </p>
      </div>
    </div>
  );
}