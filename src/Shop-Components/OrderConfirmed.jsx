import React from 'react';
import { useNavigate } from 'react-router-dom';

const generateOrderID = () => "LX-" + Math.floor(100000 + Math.random() * 900000);

const OrderConfirmed = () => {
  const navigate = useNavigate();
  const orderNumber = generateOrderID();

  return (
    <div className="min-h-screen w-full bg-[#FDFBF7] flex items-center justify-center p-6">
      <div className="w-full max-w-[420px] bg-white rounded-[2.5rem] p-10 shadow-xl flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full border border-[#D4AF37]/20 flex items-center justify-center mb-8">
          <span className="text-[#D4AF37] font-bold">✓</span>
        </div>
        <h1 className="text-[38px] font-serif italic text-[#D4AF37] mb-2">Thank You</h1>
        <p className="text-[14px] text-black/50 italic mb-8">Your masterpiece is on its way.</p>
        <div className="mb-10 w-full border-y border-[#D4AF37]/10 py-3">
          <p className="text-[10px] font-black tracking-[0.4em] text-[#D4AF37] uppercase">Order No. {orderNumber}</p>
        </div>
        <button onClick={() => navigate('/')} className="w-full h-14 bg-[#D4AF37] text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-lg active:scale-95 transition-all">
          Continue Shopping
        </button>
      </div>
    </div>
  ); 
};

export default OrderConfirmed;