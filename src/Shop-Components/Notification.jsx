import React from 'react';
import useCart from './useCart';

export default function Notification() {
  const { toast } = useCart();

  if (!toast) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="bg-black/90 backdrop-blur-xl border border-primary-gold/40 px-6 py-3 rounded-md shadow-2xl max-w-[300px] w-auto mx-auto">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary-gold text-sm">check_circle</span>
          <p className="text-[10px] uppercase tracking-wider font-bold text-white leading-tight">
            {toast}
          </p>
        </div>
      </div>
    </div>
  );
}