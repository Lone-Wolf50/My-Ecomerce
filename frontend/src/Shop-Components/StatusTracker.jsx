import React from 'react';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  placed:     { color: 'text-gray-500',    dot: 'bg-gray-400',    bg: 'bg-gray-50 border-gray-200'       },
  pending:    { color: 'text-amber-600',   dot: 'bg-amber-400',   bg: 'bg-amber-50 border-amber-200'     },
  processing: { color: 'text-blue-600',    dot: 'bg-blue-400',    bg: 'bg-blue-50 border-blue-200'       },
  shipped:    { color: 'text-violet-600',  dot: 'bg-violet-400',  bg: 'bg-violet-50 border-violet-200'   },
  delivered:  { color: 'text-emerald-600', dot: 'bg-emerald-400', bg: 'bg-emerald-50 border-emerald-200' },
  cancelled:  { color: 'text-red-500',     dot: 'bg-red-400',     bg: 'bg-red-50 border-red-200'         },
  returned:   { color: 'text-orange-500',  dot: 'bg-orange-400',  bg: 'bg-orange-50 border-orange-200'   },
};

const DEFAULT = { color: 'text-gray-400', dot: 'bg-gray-300', bg: 'bg-gray-50 border-gray-200' };

const StatusTracker = ({ currentStatus, orderId }) => {
  const navigate = useNavigate();
  const key = currentStatus?.toLowerCase();
  const cfg = STATUS_CONFIG[key] || DEFAULT;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (orderId) navigate(`/track/${orderId}`); }}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all hover:shadow-sm active:scale-95 ${cfg.bg}`}
    >
      <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} animate-pulse shrink-0`} />
      <div className="flex flex-col items-start leading-none gap-0.5">
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-black/25">Track Order</span>
        <span className={`text-[12px] font-black uppercase tracking-wider ${cfg.color}`}>
          {currentStatus || 'Placed'}
        </span>
      </div>
      <span className="material-symbols-outlined text-[16px] text-black/20 ml-1">chevron_right</span>
    </button>
  );
};

export default StatusTracker;