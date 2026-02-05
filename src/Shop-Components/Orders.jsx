import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../Database-Server/Superbase-client.js";
import Navbar from "./Navbar.jsx";
import useCart from "./useCart"; 
import Swal from 'sweetalert2';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ongoing"); 
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const storedUuid = sessionStorage.getItem('userUuid');
      if (!storedUuid) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            product_id,
            quantity,
            price,
            products (*) 
          )
        `) 
        .eq("user_id", storedUuid)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      console.log("✅ Orders Fetched Successfully:", data);
      setOrders(data || []);
    } catch (err) {
      console.error("❌ Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // --- UPDATED: CANCEL LOGIC (Moves to History instead of Deleting) ---
  const handleCancelOrder = async (orderId) => {
    const result = await Swal.fire({
      title: 'CANCEL ORDER?',
      text: "This will move the order to your cancelled history.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#000',
      cancelButtonColor: '#d33',
      confirmButtonText: 'CONFIRM CANCEL',
      background: "#FDFBF7",
    });

    if (result.isConfirmed) {
      try {
        // We use UPDATE so it stays in the DB but changes status
        const { error } = await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', orderId);

        if (error) throw error;

        console.log(` Order ${orderId} status updated to: cancelled`);
        
        // Update local state so the UI moves the card immediately
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
        
        Swal.fire('Cancelled', 'Order moved to history.', 'success');
      } catch (err) {
        console.error("❌ Error cancelling order:", err.message);
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const handleReorder = (items) => {
    items.forEach(item => { if (item.products) addToCart(item.products); });
    Swal.fire({ title: 'Added to Bag', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
  };

  // --- FILTER LOGIC WITH LOGGING ---
  const filteredOrders = orders.filter(order => {
    const status = order.status?.toLowerCase();
    if (activeTab === "ongoing") {
      return status === "pending" || status === "processing" || status === "shipped";
    }
    // 'history' tab shows everything else
    return status === "delivered" || status === "cancelled" || status === "returned";
  });

  console.log(` Current Tab: ${activeTab} | Items showing: ${filteredOrders.length}`);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37] animate-pulse">SYNCING_ARCHIVES...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 md:px-20 font-sans text-black relative overflow-hidden">
      <Navbar />
      
      <div className="max-w-3xl mx-auto mt-20 relative z-10">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif italic text-black/80">Order History</h1>
            <div className="h-[1px] w-12 bg-[#D4AF37] mt-2"></div>
          </div>

          <div className="flex bg-black/5 p-1 rounded-full border border-black/10 backdrop-blur-sm shadow-inner">
            <button 
              onClick={() => setActiveTab("ongoing")}
              className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'ongoing' ? 'bg-white text-black shadow-sm' : 'text-black/40'}`}
            >
              Ongoing
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-black shadow-sm' : 'text-black/40'}`}
            >
              History
            </button>
          </div>
        </header>
        
        <div className="flex flex-col gap-5">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-white/20 rounded-[2rem] border border-dashed border-black/10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">No {activeTab} records found.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const status = order.status?.toLowerCase();
              const items = order.order_items || []; 
              const orderDate = new Date(order.created_at);

              return (
                <div 
                  key={order.id} 
                  className="relative p-6 rounded-[2rem] bg-white/60 backdrop-blur-xl border-t border-l border-white/90 border-r border-b border-black/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#D4AF37] opacity-70">REF: {order.id.slice(0, 8)}</span>
                      <h2 className="text-lg font-bold block leading-tight">
                        {orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </h2>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-black/5">
                      <span className={`h-1.5 w-1.5 rounded-full ${status === 'cancelled' || status === 'returned' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${status === 'cancelled' || status === 'returned' ? 'text-red-500' : 'text-green-600'}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-center bg-white/40 p-2.5 rounded-2xl border border-white/60">
                        <div className="w-10 h-10 bg-white rounded-lg overflow-hidden border border-black/5 flex items-center justify-center shrink-0">
                          {item.products?.image ? (
                            <img src={item.products.image} alt="Item" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-[7px] font-black text-gray-400">N/A</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-wider text-black/80 truncate">{item.products?.name || "Product"}</p>
                          <p className="text-[9px] font-bold opacity-40">QTY: {item.quantity} — ${item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-5 border-t border-black/5">
                    <div>
                      <p className="text-[8px] font-bold uppercase opacity-30 leading-none mb-1">Total</p>
                      <p className="text-xl font-serif italic text-black/90">${order.total_amount}</p>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleReorder(items)}
                        className="px-5 py-2 rounded-full bg-black text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-all"
                      >
                        Reorder
                      </button>
                      {activeTab === "ongoing" && (
                        <button 
                          onClick={() => handleCancelOrder(order.id)}
                          className="px-5 py-2 rounded-full border border-red-100 text-red-400 text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
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