import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "../Database-Server/Superbase-client.js";
import Navbar from "./Navbar.jsx";

const OrderTrackingPage = () => {
  const { Id } = useParams(); 
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // The sequence you requested
  const stages = ["placed", "pending", "processing", "shipped", "delivered"];

  // Color scheme for each stage
  const colors = {
    placed: { text: "text-gray-600", bar: "bg-gray-400", dot: "bg-gray-400", ring: "ring-gray-400/20" },
    pending: { text: "text-amber-600", bar: "bg-amber-400", dot: "bg-amber-400", ring: "ring-amber-400/20" },
    processing: { text: "text-blue-600", bar: "bg-blue-400", dot: "bg-blue-400", ring: "ring-blue-400/20" },
    shipped: { text: "text-purple-600", bar: "bg-purple-400", dot: "bg-purple-400", ring: "ring-purple-400/20" },
    delivered: { text: "text-green-600", bar: "bg-green-400", dot: "bg-green-400", ring: "ring-green-400/20" },
    cancelled: { text: "text-red-600", bar: "bg-red-400", dot: "bg-red-400", ring: "ring-red-400/20" },
    default: { text: "text-gray-400", bar: "bg-gray-200", dot: "bg-gray-200", ring: "ring-gray-200/20" }
  };

  useEffect(() => {
    async function fetchOrderDetails() {
      if (!Id || Id === "undefined") return setLoading(false);
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select(`*, order_items (*, products (*))`)
          .eq('id', Id)
          .maybeSingle();
        
        if (error) throw error;
        setOrder(data);
      } catch (err) {
        console.error("🚨 Fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrderDetails();
  }, [Id]);

  // Helper function to calculate return eligibility
  const getReturnStatus = (order) => {
    if (!order || order.status?.toLowerCase() !== 'delivered') {
      return { canReturn: false, message: '', daysRemaining: 0 };
    }

    const deliveryDate = new Date(order.updated_at);
    const currentDate = new Date();
    const daysSinceDelivery = Math.floor((currentDate - deliveryDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = 5 - daysSinceDelivery;

    return {
      canReturn: daysRemaining > 0,
      message: daysRemaining > 0 
        ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left to return` 
        : 'Item not returnable',
      daysRemaining: Math.max(0, daysRemaining)
    };
  };

  if (loading) return (
    <div className="h-screen bg-[#FDFBF7] flex items-center justify-center font-black text-[10px] tracking-[0.5em] animate-pulse text-[#D4AF37]">
      DECRYPTING_PATH...
    </div>
  );

  if (!order) return (
    <div className="h-screen bg-[#FDFBF7] flex flex-col items-center justify-center gap-6">
      <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Archive Entry Not Found</p>
      <button onClick={() => navigate(-1)} className="bg-black text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest">
        Go Back
      </button>
    </div>
  );

  // SAFE STATUS LOGIC
  const rawStatus = order.status?.toLowerCase() || 'placed';
  const isCancelled = rawStatus === 'cancelled';
  const returnStatus = getReturnStatus(order);
  
  // Find the index, but default to 0 (placed) if the status is unrecognized
  const foundIndex = stages.indexOf(rawStatus);
  const currentIndex = foundIndex === -1 ? 0 : foundIndex;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-black pb-20 font-sans">
      <Navbar />
      <div className="max-w-xl mx-auto pt-32 px-8">
        <button 
          onClick={() => navigate('/')} 
          className="group mb-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-black transition-all"
        >
          <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Return to Home
        </button>
        
        <header className="mb-20">
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37]">Live Logistic Sequence</span>
          <h1 className="text-4xl font-serif italic mt-2 text-black/90">Asset #{order.id.slice(0,8)}</h1>
          {isCancelled && (
            <div className="mt-4 px-4 py-2 bg-red-50 border border-red-100 inline-block rounded-lg">
              <p className="text-red-600 text-[9px] font-black uppercase tracking-widest">Status: Terminated / Cancelled</p>
            </div>
          )}
        </header>

        {/* VERTICAL TIMELINE - Professional Version */}
        <div className="relative space-y-14 pl-6 mb-20">
          {/* Background Track (The faint line) */}
          <div className="absolute left-[19px] top-3 bottom-3 w-[2px] bg-black/[0.08]"></div>
          
          {/* Active Progress Line - Uses current stage color */}
          {!isCancelled && (
            <div 
              className={`absolute left-[19px] top-3 w-[2px] transition-all duration-1000 ease-out ${colors[rawStatus]?.bar || colors.default.bar}`}
              style={{ height: `${(currentIndex / (stages.length - 1)) * 100}%` }}
            ></div>
          )}

          {stages.map((stage, idx) => {
            const isPast = idx < currentIndex;
            const isCurrent = idx === currentIndex && !isCancelled;
            const stageColor = colors[stage] || colors.default;
            const isDeliveredStage = stage === 'delivered' && isCurrent;
            
            return (
              <div key={stage} className={`flex items-start gap-8 transition-all duration-700 ${
                isCurrent ? 'opacity-100' : isPast ? 'opacity-100' : 'opacity-30'
              }`}>
                
                {/* Status Dot - Enhanced with proper colors */}
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isCurrent 
                    ? `${stageColor.dot} ring-8 ${stageColor.ring} scale-110 shadow-lg` 
                    : isPast 
                    ? `${stageColor.dot} shadow-md` 
                    : 'bg-white border-2 border-black/10'
                }`}>
                  {/* Inner dot for completed stages */}
                  {(isPast || isCurrent) && (
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  )}
                </div>

                {/* Status Text - Enhanced readability */}
                <div className="flex-1 -mt-1">
                  <h3 className={`text-[13px] font-black uppercase tracking-[0.25em] mb-2 ${
                    isCurrent ? stageColor.text : isPast ? stageColor.text : 'text-black/30'
                  }`}>
                    {stage}
                  </h3>
                  
                  {/* Special handling for delivered stage */}
                  {isDeliveredStage ? (
                    <div className="space-y-2">
                      <div className={`px-3 py-1.5 rounded-lg inline-block ${
                        returnStatus.canReturn 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <p className={`text-[9px] font-bold uppercase tracking-tight ${
                          returnStatus.canReturn ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {returnStatus.message}
                        </p>
                      </div>
                    </div>
                  ) : isCurrent && !isDeliveredStage ? (
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stageColor.dot} animate-pulse`}></div>
                      <p className={`text-[10px] font-bold uppercase tracking-tight ${stageColor.text}`}>
                        In Progress
                      </p>
                    </div>
                  ) : isPast ? (
                    <p className="text-[9px] font-semibold text-black/40 uppercase tracking-tight">
                      Completed
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* ORDER SUMMARY */}
        <div className="mt-24 pt-10 border-t border-black/5">
           <p className="text-[9px] font-black uppercase tracking-widest text-black/20 mb-8 italic">Secure Manifest</p>
           <div className="space-y-4">
             {order.order_items?.map((item, i) => (
               <div key={i} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-black/[0.02]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FDFBF7] border border-black/5 overflow-hidden">
                      <img src={item.products?.image} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-tight">{item.products?.name}</p>
                      <p className="text-[9px] font-bold text-[#D4AF37]">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-serif italic text-black/40">GH₵{item.price?.toLocaleString()}</span>
               </div>
             ))}
           </div>
           
           <div className="mt-10 pt-6 border-t border-dashed border-black/10 flex justify-between items-end">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-20">Total Settlement</span>
              <span className="text-2xl font-serif italic">GH₵{order.total_amount?.toLocaleString()}</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;