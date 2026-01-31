import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../Database-Server/Superbase-client.js";
import Navbar from "./Navbar.jsx";
import Swal from 'sweetalert2';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      // Fetching all columns including the JSONB 'items' column
      const { data, error } = await supabase
        .from("orders")
        .select('*') 
        .eq("user_id", user.id) 
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchOrders();
    const orderSubscription = supabase
      .channel('order-status-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, 
        (payload) => {
          setOrders((prev) => prev.map((order) => order.id === payload.new.id ? { ...order, ...payload.new } : order));
        }
      ).subscribe();
    return () => supabase.removeChannel(orderSubscription);
  }, [fetchOrders]);

  const handleCancelOrder = async (orderId) => {
    Swal.fire({
      title: 'CANCEL ORDER?',
      text: "Are you sure you want to terminate this order request?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#000',
      confirmButtonText: 'YES, CANCEL ORDER',
      background: "#FDFBF7",
      customClass: {
        popup: 'rounded-[2rem]',
        confirmButton: 'rounded-full px-6 py-3 text-[10px] font-black uppercase tracking-widest',
        cancelButton: 'rounded-full px-6 py-3 text-[10px] font-black uppercase tracking-widest'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
          if (error) throw error;
          
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
          
          Swal.fire({
            title: 'CANCELLED',
            text: 'Your order has been successfully cancelled.',
            icon: 'success',
            confirmButtonColor: "#D4AF37"
          });
        } catch (err) {
          Swal.fire('Error', err.message, 'error');
        }
      }
    });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37] animate-pulse">ARCHIVE_SYNC...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 md:px-20 font-sans text-black">
      <Navbar />
      <div className="max-w-4xl mx-auto mt-20">
        <header className="mb-12 md:mb-20 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-serif italic text-black/80">Order Details</h1>
          <div className="h-[1px] w-16 bg-[#D4AF37] mt-4 mx-auto md:mx-0"></div>
        </header>
        
        <div className="space-y-16">
          {orders.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">No historical records found.</p>
              <button onClick={() => navigate('/')} className="mt-6 text-[10px] underline tracking-widest font-bold text-[#D4AF37]">RETURN TO HOME</button>
            </div>
          ) : (
            orders.map((order) => {
              const status = order.status?.toLowerCase();
              const isCancelled = status === 'cancelled';
              const isDelivered = status === 'delivered';
              
              // Reading directly from your JSONB column
              const items = order.items || []; 

              // Logic for 5-day cancellation window
              const orderDate = new Date(order.created_at);
              const currentDate = new Date();
              const diffInTime = currentDate.getTime() - orderDate.getTime();
              const diffInDays = diffInTime / (1000 * 3600 * 24);
              const isPastCancellationWindow = diffInDays > 5;

              return (
                <div key={order.id} className="group border-b border-black/10 pb-12 last:border-0">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between items-baseline mb-8 gap-4">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Order Ref. {order.id.slice(0, 8)}</span>
                      <h2 className="text-xl md:text-2xl font-bold block mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </h2>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {!isCancelled && !isDelivered && (
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                        )}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isCancelled ? 'text-red-500' : isDelivered ? 'text-blue-500' : 'text-green-600'}`}>
                        {order.status}
                        </span>
                    </div>
                  </div>

                  {/* Items list from JSONB */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                        <img 
                          src={item.image} 
                          alt="" 
                          className="w-20 h-20 object-cover rounded-xl bg-[#F9F6F0]"
                          onError={(e) => { e.target.src = "https://placehold.co/200x200?text=Luxe"; }}
                        />
                        <div className="flex-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-black/70">{item.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-[10px] font-bold opacity-40">QTY: {item.quantity}</p>
                            <p className="text-xs font-serif italic text-[#D4AF37]">${item.price}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer & Conditional Cancellation Button */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6">
                    <div className="w-full md:w-auto text-center md:text-left">
                      <p className="text-[9px] font-bold uppercase opacity-30 leading-none">Total Investment</p>
                      <p className="text-2xl font-serif italic">${order.total_amount}</p>
                    </div>

                    {status === 'pending' && (
                        <div className="flex flex-col items-center md:items-end gap-2">
                             <button 
                                onClick={() => !isPastCancellationWindow && handleCancelOrder(order.id)}
                                disabled={isPastCancellationWindow}
                                className={`w-full md:w-auto px-10 py-3 rounded-full border transition-all text-[10px] font-black uppercase tracking-[0.2em] 
                                    ${isPastCancellationWindow 
                                        ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50' 
                                        : 'border-red-400 text-red-500 hover:bg-red-500 hover:text-white active:scale-95'
                                    }`}
                            >
                                {isPastCancellationWindow ? "🔒 VOID WINDOW EXPIRED" : "CANCEL ORDER"}
                            </button>
                            {!isPastCancellationWindow && (
                                <p className="text-[7px] font-bold tracking-widest text-red-400/50 uppercase">
                                    Window expires in {Math.max(0, (5 - diffInDays).toFixed(1))} days
                                </p>
                            )}
                        </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Orders;