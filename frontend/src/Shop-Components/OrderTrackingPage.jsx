import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "../Database-Server/Superbase-client.js";
import Navbar from "./Navbar.jsx";

const STAGES = ['placed', 'pending', 'processing', 'shipped', 'delivered'];

const STAGE_CONFIG = {
  placed:     { label: 'Order Placed',  icon: 'receipt_long',            color: 'text-gray-500',    dot: 'bg-gray-400',    ring: 'ring-gray-400/20',    bar: 'bg-gray-400'    },
  pending:    { label: 'Confirmed',     icon: 'verified',                color: 'text-amber-600',   dot: 'bg-amber-400',   ring: 'ring-amber-400/25',   bar: 'bg-amber-400'   },
  processing: { label: 'Processing', icon: 'precision_manufacturing', color: 'text-blue-500',    dot: 'bg-blue-400',    ring: 'ring-blue-400/25',    bar: 'bg-blue-400'    },
  shipped:    { label: 'Shipped',    icon: 'local_shipping',          color: 'text-violet-500',  dot: 'bg-violet-400',  ring: 'ring-violet-400/25',  bar: 'bg-violet-400'  },
  delivered:  { label: 'Delivered',     icon: 'inventory',               color: 'text-emerald-600', dot: 'bg-emerald-400', ring: 'ring-emerald-400/25', bar: 'bg-emerald-400' },
  cancelled:  { label: 'Cancelled',     icon: 'cancel',                  color: 'text-red-500',     dot: 'bg-red-400',     ring: 'ring-red-400/25',     bar: 'bg-red-400'     },
};

const OrderTrackingPage = () => {
  const { Id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!Id || Id === 'undefined') return setLoading(false);
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders').select(`*, order_items (*, products (*))`)
          .eq('id', Id).maybeSingle();
        if (error) throw error;
        setOrder(data);
      } catch (_err) { /* suppress — UI handles the null order state */ }
      finally { setLoading(false); }
    }
    fetchOrder();
  }, [Id]);

  const getReturnStatus = (o) => {
    if (!o || o.status?.toLowerCase() !== 'delivered') return { canReturn: false, message: '', daysRemaining: 0 };
    const days = Math.floor((new Date() - new Date(o.updated_at)) / 864e5);
    const rem = 1 - days;
    return { canReturn: rem > 0, message: rem > 0 ? `${rem} day${rem !== 1 ? 's' : ''} left to return` : 'Return window closed', daysRemaining: Math.max(0, rem) };
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-9 h-9 border-[3px] border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37] animate-pulse">Decrypting path…</p>
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center gap-6 px-5">
      <div className="w-16 h-16 rounded-[1.25rem] bg-black/[0.04] flex items-center justify-center mb-2">
        <span className="material-symbols-outlined text-3xl text-black/20">search_off</span>
      </div>
      <p className="text-[12px] font-black uppercase tracking-widest text-black/25">Archive entry not found</p>
      <button onClick={() => navigate(-1)}
        className="bg-black text-white px-10 py-4 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-all"
      >
        Go Back
      </button>
    </div>
  );

  const rawStatus    = order.status?.toLowerCase() || 'placed';
  const isCancelled  = rawStatus === 'cancelled';
  const foundIndex   = STAGES.indexOf(rawStatus);
  const currentIndex = foundIndex === -1 ? 0 : foundIndex;
  const returnStatus = getReturnStatus(order);
  const currentCfg   = STAGE_CONFIG[rawStatus] || STAGE_CONFIG.placed;

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-32 md:pb-20 select-none">
      <Navbar />

      <div className="max-w-lg mx-auto pt-8 px-5">

        {/* Back */}
        <button onClick={() => navigate('/orders')}
          className="group mb-10 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-black/25 hover:text-black transition-colors"
        >
          <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Back to Orders
        </button>

        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37] mb-2">Live Logistics</p>
          <h1 className="text-4xl md:text-5xl font-serif italic text-black/90 leading-tight">
            Asset #{order.id.slice(0, 8)}
          </h1>
          <p className="text-[12px] font-bold text-black/30 uppercase tracking-wider mt-2">
            {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          {isCancelled && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
              <span className="material-symbols-outlined text-red-500 text-[18px]">cancel</span>
              <p className="text-red-600 text-[10px] font-black uppercase tracking-widest">Order Terminated</p>
            </div>
          )}
        </div>

        {/* Current status hero */}
        {!isCancelled && (
          <div className="mb-10 p-6 rounded-[2rem] bg-white border border-black/[0.05] shadow-sm flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0`}
              style={{ background: 'rgba(0,0,0,0.04)' }}
            >
              <span className={`material-symbols-outlined text-[28px] ${currentCfg.color}`}>{currentCfg.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/25 mb-1">Current Status</p>
              <p className={`text-[20px] font-black uppercase tracking-tight ${currentCfg.color}`}>{currentCfg.label}</p>
              {rawStatus !== 'delivered' && (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${currentCfg.dot} animate-pulse`} />
                  <span className="text-[10px] font-bold text-black/30 uppercase tracking-wide">In Progress</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vertical timeline */}
        <div className="relative pl-12 space-y-9 mb-14">
          <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-black/[0.06] rounded-full" />
          {!isCancelled && (
            <div className={`absolute left-[15px] top-4 w-[2px] rounded-full transition-all duration-1000 ${currentCfg.bar}`}
              style={{ height: `${(currentIndex / (STAGES.length - 1)) * 92}%` }}
            />
          )}

          {STAGES.map((stage, idx) => {
            const cfg       = STAGE_CONFIG[stage] || STAGE_CONFIG.placed;
            const isPast    = idx < currentIndex;
            const isCurrent = idx === currentIndex && !isCancelled;
            const isFuture  = idx > currentIndex;

            return (
              <div key={stage}
                className={`relative flex items-start gap-5 transition-all duration-500 ${isFuture && !isCancelled ? 'opacity-20' : 'opacity-100'}`}
              >
                {/* Dot */}
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 shrink-0 -ml-12 ${
                  isCurrent ? `${cfg.dot} ring-8 ${cfg.ring} shadow-lg scale-110`
                  : isPast ? `${cfg.dot} shadow-sm`
                  : 'bg-white border-2 border-black/[0.1]'
                }`}>
                  {(isPast || isCurrent) && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>

                {/* Text */}
                <div className="-mt-0.5">
                  <p className={`text-[14px] font-black uppercase tracking-[0.15em] ${
                    isCurrent ? cfg.color : isPast ? 'text-black/60' : 'text-black/20'
                  }`}>
                    {cfg.label}
                  </p>

                  {isCurrent && stage === 'delivered' && (
                    <div className={`mt-2 inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${
                      returnStatus.canReturn ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}>
                      {returnStatus.message}
                    </div>
                  )}
                  {isCurrent && stage !== 'delivered' && (
                    <p className={`text-[11px] font-bold mt-0.5 uppercase tracking-tight ${cfg.color} opacity-70`}>Currently active</p>
                  )}
                  {isPast && (
                    <p className="text-[10px] font-bold text-black/25 uppercase tracking-tight mt-0.5">Completed</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Manifest */}
        <div className="bg-white rounded-[2.5rem] border border-black/[0.05] shadow-sm overflow-hidden">
          <div className="px-7 py-5 border-b border-black/[0.05]">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/25">Secure Manifest</p>
          </div>
          <div className="p-5 space-y-3">
            {order.order_items?.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-[#F7F5F0] rounded-2xl">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-black/[0.05] shrink-0">
                  <img src={item.products?.image} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black uppercase tracking-tight truncate">{item.products?.name}</p>
                  <p className="text-[11px] font-bold text-[#D4AF37] mt-0.5">Qty: {item.quantity}</p>
                </div>
                <span className="text-[13px] font-black text-black/40 shrink-0">GH₵{item.price?.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="px-7 py-5 border-t border-dashed border-black/[0.08] flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-black/20">Total Settlement</span>
            <span className="text-2xl font-serif italic text-[#D4AF37]">GH₵{order.total_amount?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;