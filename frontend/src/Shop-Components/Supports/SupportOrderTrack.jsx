import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle, XCircle, Clock, RotateCcw, ArrowRight } from 'lucide-react';
import { supabase } from '../../Database-Server/Superbase-client.js';

const STATUS_CONFIG = {
  pending:    { label: 'Pending Review',  color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200',   icon: Clock,        desc: 'Your order has been received and is awaiting confirmation.' },
  processing: { label: 'Being Crafted',   color: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200',    icon: Package,      desc: 'Our artisans are carefully preparing your piece.' },
  shipped:    { label: 'In Transit',      color: 'text-violet-600',  bg: 'bg-violet-50',   border: 'border-violet-200',  icon: Truck,        desc: 'Your order is on its way. Expect delivery in 1–3 business days.' },
  delivered:  { label: 'Delivered',       color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200', icon: CheckCircle,  desc: 'Your order has been delivered. We hope you love it!' },
  cancelled:  { label: 'Cancelled',       color: 'text-red-500',     bg: 'bg-red-50',      border: 'border-red-200',     icon: XCircle,      desc: 'This order has been cancelled. Contact us if this was unintended.' },
  returned:   { label: 'Return Initiated',color: 'text-orange-500',  bg: 'bg-orange-50',   border: 'border-orange-200',  icon: RotateCcw,    desc: 'Return process is underway. Refund will be processed in 3–5 days.' },
};

const PROGRESS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

const SupportOrderTrack = ({ onDone }) => {
  const [inputId, setInputId]   = useState('');
  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleSearch = async () => {
    // Only hex characters are valid in a UUID prefix
    const clean = inputId.trim().toUpperCase().replace(/[^A-F0-9]/g, '');
    if (clean.length < 6) { setError('Please enter at least 6 characters of your order ID.'); return; }

    setLoading(true); setError(''); setOrder(null);

    try {
      // PostgREST cannot apply ilike to a UUID column without a cast.
      // We call a Postgres RPC function that does the cast server-side.
      //
      // ── Run this ONCE in your Supabase SQL Editor ──────────────────
      //
      //   CREATE OR REPLACE FUNCTION search_order_by_prefix(p_prefix text)
      //   RETURNS TABLE (
      //     id           uuid,
      //     status       text,
      //     customer_name text,
      //     total_amount  numeric,
      //     created_at    timestamptz
      //   )
      //   LANGUAGE sql STABLE SECURITY DEFINER AS $$
      //     SELECT id, status, customer_name, total_amount, created_at
      //     FROM orders
      //     WHERE id::text ILIKE (p_prefix || '%')
      //     LIMIT 1;
      //   $$;
      //
      // ──────────────────────────────────────────────────────────────

      const prefix = clean.slice(0, 8).toLowerCase(); // UUIDs stored lowercase in Postgres

      const { data: rows, error: rpcErr } = await supabase
        .rpc('search_order_by_prefix', { p_prefix: prefix });

      if (rpcErr) throw rpcErr;

      if (!rows || rows.length === 0) {
        setAttempts(a => a + 1);
        setError(attempts >= 2
          ? "We couldn't find that order. Double-check your confirmation email for the order ID."
          : 'No order found with that ID. Please check and try again.');
        return;
      }

      // RPC returns flat rows — fetch order_items separately
      const base = rows[0];
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', base.id);

      setOrder({ ...base, order_items: items || [] });
      setAttempts(0);

    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  const cfg  = order ? (STATUS_CONFIG[order.status] || STATUS_CONFIG.pending) : null;
  const Icon = cfg?.icon;

  const stepIndex    = order ? PROGRESS_STEPS.indexOf(order.status) : -1;
  const showProgress = order && !['cancelled', 'returned'].includes(order.status);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto">

      {/* Search bar */}
      <div className="mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/30 mb-3">
          Enter Your Order ID
        </p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              value={inputId}
              onChange={e => { setInputId(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 3FA2B91C"
              maxLength={8}
              className="w-full bg-white border border-black/[0.08] rounded-2xl px-5 py-4 text-[14px] font-mono font-bold uppercase tracking-widest focus:border-[#D4AF37] focus:outline-none transition-colors placeholder:text-black/20 placeholder:font-sans placeholder:tracking-normal placeholder:normal-case"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !inputId.trim()}
            className="px-6 bg-[#D4AF37] text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 flex items-center gap-2 shadow-md shadow-[#D4AF37]/20"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Search size={13} /> Search</>
            }
          </button>
        </div>
        <p className="text-[9px] text-black/25 font-medium mt-2 pl-1">
          Enter the 8-character Order ID from your confirmation email or Order Confirmed page — e.g. <span className="font-mono font-bold text-black/40">3FA2B91C</span>
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl mb-5 animate-in slide-in-from-top-2 duration-300">
          <p className="text-[12px] font-black text-red-500">{error}</p>
        </div>
      )}

      {/* Result */}
      {order && cfg && (
        <div className="bg-white rounded-[2rem] border border-black/[0.06] overflow-hidden shadow-lg shadow-black/[0.04] animate-in zoom-in-95 duration-400">

          {/* Status header */}
          <div className={`px-7 py-5 ${cfg.bg} border-b ${cfg.border}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                <Icon size={18} className={cfg.color} />
              </div>
              <div>
                <p className={`text-[9px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</p>
                <p className="text-[11px] text-black/40 font-medium mt-0.5">{cfg.desc}</p>
              </div>
            </div>
          </div>

          <div className="p-7 space-y-5">

            {/* Order info grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Order ID',  value: `#${order.id.slice(0,8).toUpperCase()}` },
                { label: 'Customer', value: order.customer_name },
                { label: 'Total',    value: `GH₵${Number(order.total_amount || 0).toLocaleString()}` },
                { label: 'Date',     value: new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-black/[0.025] rounded-2xl p-3.5">
                  <p className="text-[8px] font-black uppercase tracking-wider text-black/25 mb-1">{label}</p>
                  <p className="text-[12px] font-black text-black/75 truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Progress stepper */}
            {showProgress && (
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-black/25 mb-3">Progress</p>
                <div className="flex items-center justify-between relative">
                  {PROGRESS_STEPS.map((step, i) => {
                    const done   = i <= stepIndex;
                    const active = i === stepIndex;
                    return (
                      <React.Fragment key={step}>
                        <div className="flex flex-col items-center gap-1.5 z-10">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                            done ? 'bg-[#D4AF37] shadow-md shadow-[#D4AF37]/30' : 'bg-black/[0.06]'
                          } ${active ? 'ring-2 ring-[#D4AF37]/30 ring-offset-2' : ''}`}>
                            <span className={`text-[8px] font-black ${done ? 'text-white' : 'text-black/25'}`}>{i + 1}</span>
                          </div>
                          <span className={`text-[7px] font-black uppercase tracking-wider ${done ? 'text-[#D4AF37]' : 'text-black/20'}`}>
                            {step.slice(0, 4)}
                          </span>
                        </div>
                        {i < PROGRESS_STEPS.length - 1 && (
                          <div className="flex-1 h-0.5 mx-1 mb-4">
                            <div className="h-full bg-black/[0.05] rounded-full overflow-hidden">
                              <div className={`h-full bg-[#D4AF37] rounded-full transition-all duration-700 ${i < stepIndex ? 'w-full' : 'w-0'}`} />
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Done */}
            <button
              onClick={onDone}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-black text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-all active:scale-95"
            >
              Done <ArrowRight size={12} />
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default SupportOrderTrack;