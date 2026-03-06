import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../Database-Server/Superbase-client.js";
import {
  Package, ChevronRight, Clock, Truck, CheckCircle, XCircle,
  RotateCcw, ShoppingBag, ArrowLeft, AlertTriangle,
} from "lucide-react";

const STATUS_CONFIG = {
  pending:    { label: "Pending",   color: "text-amber-600",   bg: "bg-amber-50",    border: "border-amber-200",   icon: Clock       },
  processing: { label: "Crafting",  color: "text-blue-600",    bg: "bg-blue-50",     border: "border-blue-200",    icon: Package     },
  shipped:    { label: "Shipped",   color: "text-purple-600",  bg: "bg-purple-50",   border: "border-purple-200",  icon: Truck       },
  delivered:  { label: "Delivered", color: "text-emerald-600", bg: "bg-emerald-50",  border: "border-emerald-200", icon: CheckCircle },
  cancelled:  { label: "Cancelled", color: "text-red-500",     bg: "bg-red-50",      border: "border-red-200",     icon: XCircle     },
  returned:   { label: "Returned",  color: "text-gray-500",    bg: "bg-gray-50",     border: "border-gray-200",    icon: RotateCcw   },
};

/* ── Premium live 1-day return countdown ─────────────────── */
function ReturnCountdown({ deliveredAt, onReturn, isReturning }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!deliveredAt) return;
    const calc = () => {
      const deadline = new Date(new Date(deliveredAt).getTime() + 1 * 24 * 60 * 60 * 1000);
      const msLeft   = deadline - Date.now();
      if (msLeft <= 0) { setTimeLeft(null); return; }
      const totalSecs  = Math.floor(msLeft / 1000);
      const days       = Math.floor(totalSecs / 86400);
      const hours      = Math.floor((totalSecs % 86400) / 3600);
      const mins       = Math.floor((totalSecs % 3600) / 60);
      const secs       = totalSecs % 60;
      setTimeLeft({ days, hours, mins, secs, totalSecs, deadline });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [deliveredAt]);

  if (!timeLeft) return null;

  const urgent = timeLeft.days === 0 && timeLeft.hours < 6;
  const pct    = Math.max(0, Math.min(100, (timeLeft.totalSecs / (1 * 24 * 3600)) * 100));

  return (
    <div className={`mt-4 rounded-2xl overflow-hidden border transition-all ${
      urgent
        ? "bg-gradient-to-br from-orange-50 to-red-50 border-orange-200"
        : "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
    }`}>
      {/* Progress bar at top */}
      <div className={`h-1 w-full ${urgent ? "bg-orange-100" : "bg-emerald-100"}`}>
        <div
          className={`h-full transition-all duration-1000 ${urgent ? "bg-gradient-to-r from-orange-400 to-red-500" : "bg-gradient-to-r from-emerald-400 to-teal-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${urgent ? "bg-orange-100" : "bg-emerald-100"}`}>
              <span className={`text-[14px] ${urgent ? "animate-pulse" : ""}`}>⏱</span>
            </div>
            <div>
              <p className={`text-[8px] font-black uppercase tracking-[0.4em] ${urgent ? "text-orange-700" : "text-emerald-700"}`}>
                Return Window
              </p>
              <p className={`text-[9px] font-bold ${urgent ? "text-orange-500" : "text-emerald-500"}`}>
                {urgent ? "⚠ Expires very soon" : "1-day free return policy"}
              </p>
            </div>
          </div>
        </div>

        {/* Live clock tiles */}
        <div className="flex items-center gap-2 mb-4">
          {[
            { val: String(timeLeft.days).padStart(2, "0"),  label: "days"  },
            { val: String(timeLeft.hours).padStart(2, "0"), label: "hours" },
            { val: String(timeLeft.mins).padStart(2, "0"),  label: "mins"  },
            { val: String(timeLeft.secs).padStart(2, "0"),  label: "secs"  },
          ].map(({ val, label }, i) => (
            <React.Fragment key={label}>
              <div className={`flex-1 rounded-xl text-center py-2.5 px-1 ${
                urgent ? "bg-orange-100/60" : "bg-emerald-100/60"
              }`}>
                <p className={`text-[20px] font-black font-mono leading-none tabular-nums ${
                  urgent ? "text-orange-700" : "text-emerald-700"
                }`}>{val}</p>
                <p className={`text-[7px] font-black uppercase tracking-widest mt-0.5 ${
                  urgent ? "text-orange-500/70" : "text-emerald-500/70"
                }`}>{label}</p>
              </div>
              {i < 3 && (
                <span className={`text-[18px] font-black pb-2 ${urgent ? "text-orange-400" : "text-emerald-400"}`}>:</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Deadline note + return button */}
        <div className="flex items-center justify-between">
          <p className={`text-[9px] font-bold ${urgent ? "text-orange-500/70" : "text-emerald-500/70"}`}>
            Deadline: {new Date(timeLeft.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); onReturn(); }}
            disabled={isReturning}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-sm ${
              urgent
                ? "bg-gradient-to-r from-orange-500 to-red-500 hover:brightness-110"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110"
            }`}
          >
            {isReturning
              ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <RotateCcw size={11} />}
            Return Item
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delivered Thank-You Banner ─────────────────────────────── */
function DeliveredBanner({ order }) {
  return (
    <div className="mt-3 rounded-2xl overflow-hidden border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="h-0.5 bg-gradient-to-r from-emerald-400 to-teal-500 w-full" />
      <div className="px-4 py-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle size={16} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-700 mb-1">
            Delivered — Thank You
          </p>
          <p className="text-[11px] text-emerald-700/80 font-medium leading-relaxed">
            Your piece has arrived. Thank you for choosing <strong>Janina Luxury Bags</strong> — 
            wear it with pride. A confirmation was sent to your email.
          </p>
        </div>
      </div>
    </div>
  );
}


function ShippedNotice({ order }) {
  return (
    <div className="mt-3 flex items-start gap-3 p-3.5 rounded-2xl bg-purple-50 border border-purple-200">
      <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
        <Truck size={13} className="text-purple-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-purple-700 mb-0.5">
          Your order is on its way!
        </p>
        <p className="text-[10px] font-medium text-purple-600/80 leading-relaxed">
          A shipping confirmation was sent to your email. You can cancel below if needed — a return will be arranged on delivery.
        </p>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
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
    } catch (e) { setError("Could not load orders. Please try again."); }
    finally { setLoading(false); }
  }, [userId, userEmail]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /* Real-time subscription for order status updates */
  useEffect(() => {
    if (!userId && !userEmail) return;
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
      }, (payload) => {
        const updated = payload.new;
        setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, userEmail]);

  const handleCancel = async (e, order) => {
    e.stopPropagation();
    const isShipped = order.status === "shipped";
    const confirmed = window.confirm(
      isShipped
        ? `Cancel order #${String(order.id).slice(0,8).toUpperCase()}?\n\nNote: Your item is already in transit. Cancellation will be processed upon return to sender.`
        : `Cancel order #${String(order.id).slice(0,8).toUpperCase()}? This cannot be undone.`
    );
    if (!confirmed) return;
    setCancelling(order.id);
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    if (!error) fetchOrders();
    setCancelling(null);
  };

  const handleReturn = async (order) => {
    const confirmed = window.confirm(`Request a return for order #${String(order.id).slice(0,8).toUpperCase()}?`);
    if (!confirmed) return;
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
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center gap-4 p-6">
      <p className="text-[12px] font-black uppercase tracking-widest text-red-400">{error}</p>
      <button onClick={fetchOrders} className="px-6 py-3 rounded-full bg-black text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#C9A227] transition-all">Try Again</button>
    </div>
  );

  /* ── Empty ── */
  if (orders.length === 0) return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-black/[0.04] flex items-center justify-center">
        <ShoppingBag size={32} className="text-black/20" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-black/25 mb-2">Order History</p>
        <h2 className="text-2xl font-serif italic text-black mb-2">No orders yet</h2>
        <p className="text-[12px] text-black/35 font-medium">Your crafted pieces will appear here once ordered.</p>
      </div>
      <Link to="/" className="px-8 py-3.5 rounded-full bg-[#0A0A0A] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#C9A227] transition-all">
        Explore Collection
      </Link>
    </div>
  );

  /* ── Orders list ── */
  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-28 md:pb-10">

      {/* Header */}
      <div className="max-w-2xl mx-auto px-5 pt-8 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2.5 mb-6 group"
        >
          <div className="w-9 h-9 rounded-full border border-black/[0.1] bg-white flex items-center justify-center shadow-sm group-hover:bg-black group-hover:border-black transition-all duration-200">
            <ArrowLeft size={14} className="text-black/50 group-hover:text-white transition-colors" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-black/35 group-hover:text-black transition-colors">Back</span>
        </button>

        <p className="text-[10px] font-black uppercase tracking-[0.38em] text-black/22 mb-1">Your History</p>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-4xl font-serif italic text-black">Orders</h1>
            <p className="text-[12px] text-black/40 font-medium mt-1">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 h-9 px-4 mb-1 rounded-xl border border-black/[0.08] bg-white text-[9px] font-black uppercase tracking-widest text-black/40 hover:text-black hover:border-black/20 transition-all shrink-0"
          >
            <RotateCcw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-w-2xl mx-auto px-5 space-y-3">
        {orders.map((order) => {
          const cfg   = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
          const Icon  = cfg.icon;
          const items = order.order_items || [];
          const preview = items[0];

          const canCancel = ["pending", "processing", "shipped"].includes(order.status);

          /* Return: only delivered, within 1 days */
          const isDelivered = order.status === "delivered";
          const deliveredAt = order.delivered_at || (isDelivered ? order.updated_at : null);
          const returnDeadline = deliveredAt
            ? new Date(new Date(deliveredAt).getTime() + 1 * 24 * 60 * 60 * 1000)
            : null;
          const showReturn = isDelivered && deliveredAt && returnDeadline && returnDeadline > new Date();

          return (
            <div
              key={order.id}
              onClick={() => navigate(`/track/${order.id}`)}
              className="bg-white rounded-3xl border border-black/[0.06] p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-[#D4AF37]/25 transition-all duration-200 active:scale-[0.99]"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/25 mb-0.5">Order</p>
                  <p className="text-[13px] font-black text-black leading-none">
                    #{String(order.id).slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-[10px] text-black/35 font-medium mt-1">{formatDate(order.created_at)}</p>
                </div>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                  <Icon size={11} /> {cfg.label}
                </span>
              </div>

              {/* Items preview */}
              {items.length > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex -space-x-2">
                    {items.slice(0, 3).map((item, i) => (
                      <div key={i} className="w-12 h-12 rounded-xl border-2 border-white bg-[#F0EDE7] overflow-hidden shadow-sm" style={{ zIndex: 3-i }}>
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-black/20" /></div>}
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="w-12 h-12 rounded-xl border-2 border-white bg-[#F0EDE7] flex items-center justify-center shadow-sm">
                        <span className="text-[10px] font-black text-black/35">+{items.length - 3}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-black truncate">
                      {preview?.name || "Item"}
                      {items.length > 1 && <span className="text-black/35"> +{items.length - 1} more</span>}
                    </p>
                    <p className="text-[10px] text-black/35 font-medium mt-0.5">
                      {items.reduce((s, i) => s + (i.quantity || 1), 0)} item{items.reduce((s, i) => s + (i.quantity || 1), 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom row */}
              <div className="flex items-center justify-between pt-3 border-t border-black/[0.05]">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-black/25 mb-0.5">Total</p>
                  <p className="text-[16px] font-black text-black">{formatCurrency(order.total_amount)}</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                  Track Order <ChevronRight size={13} />
                </div>
              </div>

              {/* ── Shipped notice ── */}
              {order.status === "shipped" && (
                <div onClick={e => e.stopPropagation()}>
                  <ShippedNotice order={order} />
                </div>
              )}

              {/* ── Delivered thank-you banner ── */}
              {isDelivered && (
                <div onClick={e => e.stopPropagation()}>
                  <DeliveredBanner order={order} />
                </div>
              )}

              {/* ── Cancel button ── */}
              {canCancel && (
                <div className="mt-3" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleCancel(e, order)}
                    disabled={cancelling === order.id}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-red-200 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {cancelling === order.id
                      ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      : <XCircle size={13} />}
                    {order.status === "shipped" ? "Cancel Order — In Transit" : "Cancel Order"}
                  </button>
                  {order.status === "shipped" && (
                    <p className="flex items-center justify-center gap-1 text-center text-[9px] text-black/30 font-medium mt-1.5">
                      <AlertTriangle size={9} />
                      Item already shipped — return will be arranged
                    </p>
                  )}
                </div>
              )}

              {/* ── Return countdown (delivered, within 1 day) ── */}
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
          );
        })}
      </div>
    </div>
  );
}