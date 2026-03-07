import React from 'react';
import { X, Send, Package, User, Hash, Phone, MapPin } from 'lucide-react';
import { supabase } from '../../Database-Server/Superbase-client.js';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

const STATUS_STYLE = {
  pending:    { bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-400'   },
  processing: { bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-400'    },
  shipped:    { bg: 'bg-violet-50',  text: 'text-violet-600',  dot: 'bg-violet-400'  },
  delivered:  { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400' },
  cancelled:  { bg: 'bg-red-50',     text: 'text-red-500',     dot: 'bg-red-400'     },
  returned:   { bg: 'bg-orange-50',  text: 'text-orange-500',  dot: 'bg-orange-400'  },
};

const API_URL     = import.meta.env.VITE_API_URL     || 'http://localhost:3001';
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_SECRET_TOKEN || '';

if (!ADMIN_TOKEN) {
  // Warn loudly in dev so the missing env var is obvious
  console.warn('[AdminOrderModal] VITE_ADMIN_SECRET_TOKEN is not set — status emails will fail with 401.');
}

const adminHeaders = {
  'Content-Type': 'application/json',
  'x-admin-token': ADMIN_TOKEN,
};

// Wrapper: throws a descriptive error if the server rejects the request
async function sendAdminEmail(endpoint, body) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => String(res.status));
    throw new Error(`${endpoint} failed (${res.status}): ${text}`);
  }
  return res.json();
}

const AdminOrderModal = ({
  order,
  personalMsg,
  setPersonalMsg,
  loading,
  onClose,
  onStatusChange,
  onSendMessage,
}) => {
  if (!order) return null;

  const style = STATUS_STYLE[order.status?.toLowerCase()] || STATUS_STYLE.pending;

  const handleStatusChange = async (orderId, newStatus, email) => {
    const prevStatus = order.status?.toLowerCase();
    const updatePayload = { status: newStatus };
    if (newStatus === 'delivered' && prevStatus !== 'delivered') {
      updatePayload.delivered_at = new Date().toISOString();
    }

    // 1. Update DB first
    const { error: dbError } = await supabase.from('orders').update(updatePayload).eq('id', orderId);
    if (dbError) {
      alert(`Failed to update order status: ${dbError.message}`);
      return;
    }

    // 2. Fire status emails — errors are surfaced so you know if delivery failed
    if (newStatus === 'shipped' && prevStatus !== 'shipped') {
      try {
        await sendAdminEmail('/send-shipped-email', {
          email,
          customerName: order.customer_name,
          orderId,
        });
      } catch (err) {
        // Don't block the UI — DB is already updated — but alert so admin knows
        alert(`Order marked shipped ✓, but shipping email failed:
${err.message}

Check your VITE_ADMIN_SECRET_TOKEN env var.`);
      }
    }

    if (newStatus === 'delivered' && prevStatus !== 'delivered') {
      try {
        await sendAdminEmail('/send-delivered-email', {
          email,
          customerName: order.customer_name,
          orderId,
          totalAmount: order.total_amount,
        });
      } catch (err) {
        alert(`Order marked delivered ✓, but delivery email failed:
${err.message}

Check your VITE_ADMIN_SECRET_TOKEN env var.`);
      }
    }

    onStatusChange(orderId, newStatus, email);
  };

  // Delivery type label
  const deliveryType = order.delivery_type || order.shipping_type || null;
  const isDoor = deliveryType === 'door' || deliveryType === 'door_delivery' || order.delivery_method === 'delivery';
  const deliveryAddress  = order.delivery_address  || order.shipping_address || null;
  const deliveryLocation = order.delivery_location || null;
  const deliveryFee      = order.delivery_fee != null ? Number(order.delivery_fee) : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-lg z-[110] flex items-end md:items-center justify-center p-0 md:p-6">
      <div
        className="bg-[#FDFBF7] w-full max-w-xl md:rounded-[2.5rem] rounded-t-[2.5rem] shadow-[0_32px_80px_rgba(0,0,0,0.25)] max-h-[94vh] overflow-y-auto flex flex-col"
        style={{ animation: 'slideUp 0.32s cubic-bezier(.22,1,.36,1)' }}
      >
        <style>{`@keyframes slideUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        <div className="h-1 rounded-t-[2.5rem] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        <div className="p-6 md:p-8 flex flex-col gap-5">

          {/* ── Header ── */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${style.text}`}>{order.status}</span>
              </div>
              <h3 className="text-xl font-serif italic text-black/90">Order Manifest</h3>
              <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mt-1">
                {new Date(order.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={order.status}
                  onChange={e => handleStatusChange(order.id, e.target.value, order.customer_email)}
                  className={`appearance-none ${style.bg} ${style.text} border-0 outline-none px-4 py-2 pr-8 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all`}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${style.text} text-[10px]`}>▾</div>
              </div>
              <button onClick={onClose} className="p-2 bg-black/[0.05] rounded-xl hover:bg-black/10 transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* ── Client details grid — now 2x2 with phone + delivery ── */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Name */}
            <div className="flex items-center gap-2.5 p-3.5 bg-white rounded-2xl border border-black/[0.05]">
              <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                <User size={13} className="text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-wider text-black/30 mb-0.5">Client</p>
                <p className="text-[11px] font-black uppercase tracking-tight text-black truncate">{order.customer_name}</p>
              </div>
            </div>

            {/* Order ID */}
            <div className="flex items-center gap-2.5 p-3.5 bg-white rounded-2xl border border-black/[0.05]">
              <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                <Hash size={13} className="text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-wider text-black/30 mb-0.5">Order ID</p>
                <p className="text-[10px] font-black font-mono text-black/50 truncate">{order.id.slice(0, 10)}…</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-2.5 p-3.5 bg-white rounded-2xl border border-black/[0.05]">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Phone size={13} className="text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-wider text-black/30 mb-0.5">Phone</p>
                <p className="text-[11px] font-black font-mono text-black truncate">
                  {order.phone_number || '—'}
                </p>
              </div>
            </div>

            {/* Delivery type */}
            <div className={`flex items-center gap-2.5 p-3.5 rounded-2xl border ${isDoor ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-black/[0.05]'}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isDoor ? 'bg-emerald-100' : 'bg-black/[0.04]'}`}>
                <MapPin size={13} className={isDoor ? 'text-emerald-600' : 'text-black/30'} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-wider text-black/30 mb-0.5">Delivery</p>
                <p className={`text-[11px] font-black uppercase tracking-tight truncate ${isDoor ? 'text-emerald-700' : 'text-black/50'}`}>
                  {isDoor ? 'Door Delivery' : (order.delivery_method === 'pickup' ? 'Pickup' : 'Not specified')}
                </p>
                {deliveryLocation && (
                  <p className="text-[10px] font-bold text-emerald-600 truncate">{deliveryLocation}</p>
                )}
                {deliveryFee != null && deliveryFee > 0 && (
                  <p className="text-[10px] font-black text-[#D4AF37]">Fee: GH₵{deliveryFee.toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Door delivery address (full width) ── */}
          {isDoor && deliveryAddress && (
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={14} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-700 mb-1">Delivery Address</p>
                <p className="text-[13px] font-medium text-emerald-800 leading-relaxed">{deliveryAddress}</p>
              </div>
            </div>
          )}

          {/* ── Items list ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package size={12} className="text-black/30" />
              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-black/30">
                {order.order_items?.length || 0} Item{order.order_items?.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {order.order_items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center px-4 py-3 bg-white border border-black/[0.05] rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#F0EDE7] flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-black text-black/30">{idx + 1}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tight text-black/60">
                      {item.name || `Asset #${item.product_id?.slice(0, 6)}`}
                    </span>
                  </div>
                  <span className="text-[12px] font-black text-[#D4AF37]">GH₵{item.price?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Message panel ── */}
          <div className="rounded-[1.75rem] overflow-hidden" style={{ background: '#0A0A0A' }}>
            <div className="px-6 pt-5 pb-1">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[9px] font-black uppercase tracking-[0.22em] text-[#D4AF37]">Direct Client Dispatch</h4>
                <span className="text-[7px] font-bold text-white/20 italic">Secure Channel</span>
              </div>
              <textarea
                value={personalMsg}
                onChange={e => setPersonalMsg(e.target.value)}
                placeholder={`Personal note for ${order.customer_name}…`}
                className="w-full bg-white/[0.05] border border-white/[0.08] p-3.5 rounded-2xl text-[11px] text-white focus:border-[#D4AF37]/50 outline-none min-h-[70px] resize-none mb-4 placeholder:text-white/20"
              />
            </div>
            <div className="px-4 pb-4">
              <button
                onClick={() => onSendMessage(order)}
                disabled={loading || !personalMsg.trim()}
                className="w-full bg-[#D4AF37] text-black py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-25 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Send size={12} />
                {loading ? 'Transmitting…' : 'Send Message'}
              </button>
            </div>
          </div>

          {/* ── Footer total ── */}
          <div className="flex justify-between items-center pt-4 border-t border-black/[0.07]">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.22em] text-black/25 mb-1">Total Paid</p>
              <p className="text-[2rem] font-serif italic text-[#D4AF37] leading-none">GH₵{order.total_amount?.toLocaleString()}</p>
              {deliveryFee != null && deliveryFee > 0 && (
                <p className="text-[10px] text-black/35 font-medium mt-1">
                  Incl. GH₵{deliveryFee} delivery · {deliveryLocation || 'Door delivery'}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="bg-black text-white px-7 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 transition-colors active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderModal;