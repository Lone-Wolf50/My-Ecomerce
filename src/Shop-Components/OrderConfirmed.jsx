import React from 'react';
import { useNavigate } from 'react-router-dom';

const generateOrderID = () => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return "LX-" + num;
};

const OrderConfirmed = () => {
  const navigate = useNavigate();
  const orderNumber = generateOrderID();

 return (
    /* The outer div now covers the FULL screen with the correct color */
    <div className="min-h-screen w-full bg-[#FDFBF7] flex items-center justify-center p-6 font-sans">
      
      {/* The Content Card - Restricted in size so it doesn't look "too big" */}
      <div className="w-full max-w-[420px] bg-white rounded-[2.5rem] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.02)] border border-black/[0.01] flex flex-col items-center text-center">
        
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full border border-[#D4AF37]/20 flex items-center justify-center mb-8">
          <span className="material-symbols-outlined text-[#D4AF37] text-[30px]">check</span>
        </div>

        {/* Header */}
        <h1 className="text-[38px] font-medium italic serif-title text-[#D4AF37] tracking-tight mb-2">
          Thank You
        </h1>
        <p className="text-[14px] text-black/50 italic mb-8">
          Your masterpiece is on its way.
        </p>

        {/* Order Number Badge */}
        <div className="mb-10 w-full border-y border-[#D4AF37]/10 py-3">
          <p className="text-[10px] font-black tracking-[0.4em] text-[#D4AF37] uppercase">
            Order No. {orderNumber}
          </p>
        </div>

        {/* Messaging */}
        <p className="text-[11px] text-black/40 leading-relaxed max-w-[280px] mb-12 uppercase tracking-widest font-bold">
          A confirmation email will be sent to you. We are preparing your selection with the utmost attention.
        </p>

        {/* Continue Shopping Button */}
        <button 
          onClick={() => navigate('/')} 
          className="w-full h-14 bg-[#D4AF37] hover:bg-[#B8952E] text-white rounded-full flex items-center justify-center transition-all shadow-lg shadow-[#D4AF37]/20 active:scale-95"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Continue Shopping</span>
        </button>

        {/* Brand Sign-off inside the card to save vertical space */}
        <div className="mt-10 opacity-30">
           <p className="serif-title italic text-black text-[13px]">"Crafted with passion"</p>
        </div>
      </div>
    </div>
  ); 
     
};

export default OrderConfirmed;