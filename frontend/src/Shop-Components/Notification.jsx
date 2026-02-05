import React from 'react';
import useCart from './useCart';

export default function Notification() {
  const { toast } = useCart();

  if (!toast) return null;

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-500">
      {/* UPDATED: Changed to light glass theme (bg-white/60) with a refined shadow */}
      <div className="bg-white/60 backdrop-blur-xl border border-black/5 px-8 py-4 rounded-[1.5rem] shadow-2xl shadow-black/10 min-w-[280px] text-center">
        <div className="flex flex-col items-center gap-2">
          {/* Subtle gold icon check */}
          <span className="material-symbols-outlined text-primary text-xl">
            verified
          </span>
          
          {/* UPDATED: Text color to black-solid with premium spacing */}
          <p className="text-[10px] uppercase tracking-[0.3em] font-black text-black-solid leading-tight">
            {toast}
          </p>
        </div>
      </div>
    </div>
  );
}