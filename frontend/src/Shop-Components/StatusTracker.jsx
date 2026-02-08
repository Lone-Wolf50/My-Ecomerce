import React from 'react';
import { useNavigate } from 'react-router-dom';

const StatusTracker = ({ currentStatus, orderId }) => {
  const navigate = useNavigate();

  const colors = {
    placed: { text: "text-gray-500", bar: "bg-gray-400" },
    pending: { text: "text-amber-600", bar: "bg-amber-400" },
    processing: { text: "text-blue-600", bar: "bg-blue-400" },
    shipped: { text: "text-purple-600", bar: "bg-purple-400" },
    delivered: { text: "text-green-600", bar: "bg-green-400" },
    cancelled: { text: "text-red-600", bar: "bg-red-400" },
    default: { text: "text-gray-400", bar: "bg-gray-200" }
  };

  const theme = colors[currentStatus?.toLowerCase()] || colors.default;

  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        if (orderId) navigate(`/track/${orderId}`);
      }}
      className="flex items-center gap-3 bg-white hover:bg-black/5 transition-all px-4 py-2.5 rounded-xl border border-black/5 group cursor-pointer"
    >
      <div className={`w-[3px] h-4 rounded-full animate-pulse ${theme.bar}`}></div>
      <div className="flex flex-col items-start">
        <span className="text-[7px] font-black uppercase tracking-[0.2em] text-black/30 leading-none mb-1">Live Status</span>
        <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text} leading-none`}>
          {currentStatus || "PLACED"}
        </span>
      </div>
    </button>
  );
};

export default StatusTracker;
