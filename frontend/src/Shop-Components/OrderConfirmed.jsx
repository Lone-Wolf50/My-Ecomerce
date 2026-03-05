import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OrderConfirmed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { reference, total, name, orderId } = location.state || {};

  // Short tracking ID — first 8 chars of the Supabase UUID, uppercased
  // e.g. "3fa2b91c-e29b-41d4-a716-446655440000" -> "3FA2B91C"
  const shortOrderId = orderId ? String(orderId).slice(0, 8).toUpperCase() : null;

  // Stable fallback ref — computed once inside useState initializer (pure)
  const [fallbackRef] = useState(() => 'LX-' + Math.floor(100000 + Math.random() * 900000));

  const [visible, setVisible] = useState(false);
  const [checkVisible, setCheckVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 60);
    const t2 = setTimeout(() => setCheckVisible(true), 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const orderRef = reference || fallbackRef;
  const displayName = name ? name.split(' ')[0] : 'Valued Client';

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-5 relative overflow-hidden">

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/8 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[100px]" />
      </div>

      {/* Decorative rings */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[600px] border border-[#D4AF37]/[0.05] rounded-full" />
        <div className="absolute w-[380px] h-[380px] border border-[#D4AF37]/[0.08] rounded-full" />
      </div>

      {/* Card */}
      <div className={`relative z-10 w-full max-w-[370px] transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        <div className="bg-white/65 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] shadow-2xl shadow-black/[0.07] overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37] to-[#D4AF37]/20" />

          <div className="p-8 flex flex-col items-center text-center gap-5">

            {/* Animated checkmark */}
            <div className="relative mt-1">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M5 14L11 20L23 8" stroke="#D4AF37" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray="30"
                    strokeDashoffset={checkVisible ? 0 : 30}
                    style={{ transition: 'stroke-dashoffset 0.7s ease' }}
                  />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/15 animate-ping" />
            </div>

            {/* Heading */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-black/25 mb-2">Order Confirmed</p>
              <h1 className="text-[40px] font-serif italic text-[#D4AF37] leading-tight">
                Thank You,<br />{displayName}
              </h1>
              <p className="text-[13px] text-black/35 font-medium mt-1.5 italic">Leading with excellence.</p>
            </div>

            {/* Ref band — shows Paystack ref + prominent short Order ID for tracking */}
            <div className="w-full border-y border-[#D4AF37]/15 py-4 space-y-3">
              {/* Paystack payment reference */}
              <p className="text-[9px] font-black tracking-[0.5em] text-[#D4AF37] uppercase">{orderRef}</p>

              {/* Short Order ID — what the client types in Support > Track Order */}
              {shortOrderId && (
                <div className="bg-[#D4AF37]/8 border border-[#D4AF37]/20 rounded-2xl px-4 py-3">
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-black/30 mb-1.5">
                    Your Order ID — save this to track your order
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[22px] font-mono font-black text-black tracking-widest">
                      #{shortOrderId}
                    </p>
                    <span className="text-[8px] font-black uppercase tracking-widest text-black/30 bg-white border border-black/[0.08] px-3 py-1.5 rounded-xl">
                      Use in Support
                    </span>
                  </div>
                  <p className="text-[9px] text-black/30 font-medium mt-1.5">
                    Also sent to your email · visible on your Orders page
                  </p>
                </div>
              )}
            </div>

            {/* Info grid */}
            <div className="w-full bg-[#FDFBF7]/80 rounded-2xl p-4 space-y-2.5 border border-black/[0.04]">
              {[
                { label: 'Status',        value: 'Confirmed'         },
                { label: 'Total',         value: total ? `GH₵${Number(total).toLocaleString()}` : '—' },
                { label: 'Shipping',      value: 'Calculated at Delivery'     },
                { label: 'Delivery', value: '3–5 Business Days' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-[11px] font-black uppercase tracking-wider text-black/25">{label}</span>
                  <span className={`text-[11px] font-black uppercase tracking-wide ${label === 'Total' ? 'text-[#D4AF37]' : 'text-black/65'}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="w-full space-y-2.5 pb-1">
              <button onClick={() => navigate('/orders')}
                className="w-full h-12 bg-[#D4AF37] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-lg shadow-[#D4AF37]/20 hover:brightness-105 active:scale-95 transition-all"
              >
                Track My Order
              </button>
              <button onClick={() => navigate('/')}
                className="w-full h-11 bg-white/70 backdrop-blur-sm border border-black/[0.08] text-black/50 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-all"
              >
                Continue Shopping
              </button>
            </div>

            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 pb-1">
              Confirmation sent to your email
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmed;