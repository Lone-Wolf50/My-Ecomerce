import React, { useState, useEffect } from 'react';
import { ArrowUpRight, RefreshCw } from 'lucide-react';

const STATUS_CONFIG = {
  delivered:  { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  cancelled:  { dot: 'bg-red-400',     badge: 'bg-red-50 text-red-500 border-red-100'             },
  returned:   { dot: 'bg-orange-400',  badge: 'bg-orange-50 text-orange-500 border-orange-100'    },
  pending:    { dot: 'bg-amber-400 animate-pulse', badge: 'bg-amber-50 text-amber-600 border-amber-100' },
  processing: { dot: 'bg-blue-400 animate-pulse',  badge: 'bg-blue-50 text-blue-600 border-blue-100'   },
  shipped:    { dot: 'bg-violet-400',  badge: 'bg-violet-50 text-violet-600 border-violet-100'    },
};

const AdminOrders = ({ orders, onViewOrder, onRefresh }) => {
  const [subTab, setSubTab] = useState('incoming');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (onRefresh) await onRefresh();
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  // Auto-refresh every 30s so admin sees new orders without manual refresh
  useEffect(() => {
    if (!onRefresh) return;
    const id = setInterval(() => { onRefresh(); }, 30000);
    return () => clearInterval(id);
  }, [onRefresh]);

  const incomingCount = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status?.toLowerCase())).length;
  const outgoingCount = orders.filter(o => ['delivered', 'cancelled', 'returned'].includes(o.status?.toLowerCase())).length;

  const filtered = orders.filter(order => {
    const s = order.status?.toLowerCase();
    return subTab === 'incoming'
      ? ['pending', 'processing', 'shipped'].includes(s)
      : ['delivered', 'cancelled', 'returned'].includes(s);
  });

  return (
    <div style={{ animation: 'fadeSlide 0.5s ease' }}>
      <style>{`@keyframes fadeSlide{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.38em] text-black/20 mb-1.5">Vault Order Management</p>
          <h2 className="text-3xl font-serif italic">Client Requests</h2>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-black/[0.08] bg-white text-[9px] font-black uppercase tracking-widest text-black/40 hover:text-black hover:border-black/20 transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>

          <div className="flex bg-black/[0.04] p-1 rounded-2xl flex-1 md:flex-none border border-black/[0.04]">
            {[
              { id: 'incoming', label: 'Incoming', count: incomingCount },
              { id: 'outgoing', label: 'Outgoing', count: outgoingCount },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`
                  flex-1 md:flex-none px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest
                  flex items-center justify-center gap-2 transition-all duration-200
                  ${subTab === tab.id ? 'bg-white shadow-md text-black' : 'text-black/30 hover:text-black/60'}
                `}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${subTab === tab.id ? 'bg-black text-white' : 'bg-black/[0.07] text-black/30'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-black/[0.05] overflow-hidden shadow-sm">
        {/* Column headers */}
        <div className="hidden md:grid grid-cols-[2fr_1fr_0.7fr_1fr_auto] px-6 py-3.5 border-b border-black/[0.04] bg-[#FDFBF7]">
          {['Client', 'Phone', 'Items', 'Value', ''].map((h, i) => (
            <div key={i} className="text-[8px] font-black uppercase tracking-[0.28em] text-black/25">{h}</div>
          ))}
        </div>

        <div className="divide-y divide-black/[0.04]">
          {filtered.map((order) => {
            const s = order.status?.toLowerCase();
            const cfg = STATUS_CONFIG[s] || STATUS_CONFIG.pending;

            return (
              <div
                key={order.id}
                className="flex flex-col md:grid md:grid-cols-[2fr_1fr_0.7fr_1fr_auto] items-center
                  px-5 md:px-6 py-4 gap-3 md:gap-0
                  hover:bg-[#FDFBF7] transition-colors duration-150 group"
              >
                {/* Client */}
                <div className="w-full flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-[12px] uppercase tracking-tight truncate">{order.customer_name}</p>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider border ${cfg.badge}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Phone */}
                <div className="hidden md:block text-[12px] text-black/40 font-medium tabular-nums">
                  {order.phone_number}
                </div>

                {/* Items */}
                <div className="w-full flex justify-between md:block">
                  <span className="md:hidden text-[8px] font-black uppercase text-black/20">Items</span>
                  <span className="text-[12px] font-bold text-black/60">{order.order_items?.length || 0}</span>
                </div>

                {/* Amount */}
                <div className="w-full flex justify-between md:block">
                  <span className="md:hidden text-[8px] font-black uppercase text-black/20">Value</span>
                  <span className="text-[13px] font-black text-[#D4AF37]">GH₵{order.total_amount?.toLocaleString()}</span>
                </div>

                {/* CTA */}
                <div className="w-full flex justify-end">
                  <button
                    onClick={() => onViewOrder(order)}
                    className="flex items-center gap-1.5 w-full md:w-auto justify-center
                      bg-black/[0.06] text-black/60 hover:bg-black hover:text-white
                      px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest
                      transition-all duration-200 group-hover:bg-black group-hover:text-white"
                  >
                    View <ArrowUpRight size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-[1rem] bg-black/[0.03] flex items-center justify-center mx-auto mb-4">
              <span className="text-black/15 text-xl">∅</span>
            </div>
            <p className="text-black/20 font-serif italic">No {subTab} requests</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;