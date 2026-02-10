import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../Database-Server/Superbase-client.js";
import Navbar from "./Navbar.jsx";
import useCart from "./useCart"; 
import Swal from 'sweetalert2';
import StatusTracker from "./StatusTracker"; 

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
            product_id, quantity, price,
            products (*) 
          )
        `) 
        .eq("user_id", storedUuid)
        .order("created_at", { ascending: false });

      if (error) throw error;
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

  // Helper to send messages to Admin
  const sendAdminMessage = async (order, reason, type) => {
    const storedUuid = sessionStorage.getItem('userUuid');
    
    const { error } = await supabase.from('admin_messages').insert([{
      user_id: storedUuid,
      user_email: order.customer_email || 'No email provided',
      user_name: order.customer_name || 'Valued Client',
      order_id: order.id,
      message_type: type, 
      reason: reason,
      status: 'unread'
    }]);

    if (error) console.error("Admin Message Error:", error.message);
  };

  const handleCancelOrder = async (order) => {
    const { value: reason } = await Swal.fire({
      title: 'CANCEL ORDER?',
      input: 'textarea',
      inputLabel: 'Reason for cancellation',
      inputPlaceholder: 'Please provide a reason (min 10 characters)...',
      inputAttributes: { 'aria-label': 'Type your reason here' },
      showCancelButton: true,
      confirmButtonColor: '#000',
      background: "#FDFBF7",
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Please provide a detailed reason (at least 10 characters).';
        }
      }
    });

    if (reason) {
      try {
        const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
        if (error) throw error;
        
        await sendAdminMessage(order, reason, 'cancel');
        
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));
        Swal.fire('Cancelled', 'Order cancellation submitted.', 'success');
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const handleReturnOrder = async (order) => {
    const { value: reason } = await Swal.fire({
      title: 'INITIATE RETURN?',
      input: 'textarea',
      inputLabel: 'Reason for return',
      inputPlaceholder: 'Tell us why you are returning this item (min 10 characters)...',
      showCancelButton: true,
      confirmButtonColor: '#D4AF37',
      background: "#FDFBF7",
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Reason must be at least 10 characters.';
        }
      }
    });

    if (reason) {
      try {
        const { error } = await supabase.from('orders').update({ status: 'returned' }).eq('id', order.id);
        if (error) throw error;

        await sendAdminMessage(order, reason, 'return');

        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'returned' } : o));
        Swal.fire('Initiated', 'Our team will review your return request.', 'success');
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const handleReorder = (items) => {
    items.forEach(item => { if (item.products) addToCart(item.products); });
    Swal.fire({ title: 'Added to Bag', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
  };

  const getReturnStatus = (order) => {
    const status = order.status?.toLowerCase();
    if (status !== 'delivered') return { canReturn: false, message: '', daysRemaining: 0 };

    // Fallback: If delivered_at is null, we treat "now" as the delivery date
    const deliveredAtDate = order.delivered_at ? new Date(order.delivered_at) : new Date();
    const diffDays = Math.floor((new Date() - deliveredAtDate) / (1000 * 60 * 60 * 24));
    
    const daysRemaining = 5 - diffDays;
    const canReturn = daysRemaining > 0;

    return {
      canReturn,
      message: canReturn ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left to return` : 'Not returnable',
      daysRemaining: Math.max(0, daysRemaining)
    };
  };

  const filteredOrders = orders.filter(order => {
    const status = order.status?.toLowerCase();
    if (activeTab === "ongoing") {
      return ["pending", "processing", "shipped"].includes(status);
    }
    return ["delivered", "cancelled", "returned"].includes(status);
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37] animate-pulse">ACCESSING_VAULT...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 md:px-20 font-sans text-black relative overflow-hidden select-none">
      <Navbar />
      <div className="max-w-4xl mx-auto mt-24 relative z-10">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/5 pb-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">Private Collection</span>
            <h1 className="text-4xl font-serif italic text-black/90 mt-1">Order Archives</h1>
          </div>
          <div className="flex bg-black/[0.03] p-1.5 rounded-full border border-black/5 backdrop-blur-md">
            {['ongoing', 'history'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                  activeTab === tab ? 'bg-white text-black shadow-xl shadow-black/5' : 'text-black/30 hover:text-black'
                }`}>
                {tab}
              </button>
            ))}
          </div>
        </header>
        
        <div className="flex flex-col gap-8">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-32 bg-white/40 rounded-[3rem] border border-dashed border-black/10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20 italic underline underline-offset-8">No records found in this sector</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const items = order.order_items || []; 
              const returnStatus = getReturnStatus(order);
              const status = order.status?.toLowerCase();
              const isDelivered = status === 'delivered';
              const canCancel = ["processing", "shipped"].includes(status);

              return (
                <div key={order.id} className="group relative p-8 md:p-10 rounded-[3rem] bg-white border border-black/[0.03] shadow-sm transition-all hover:shadow-2xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.5em]">Registry ID • {order.id.slice(0, 8)}</p>
                      <h2 className="text-2xl md:text-3xl font-serif italic text-black/90">{new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</h2>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusTracker currentStatus={order.status} orderId={order.id} />
                      {isDelivered && (
                        <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-colors duration-300 ${
                          returnStatus.canReturn 
                            ? 'bg-green-50 text-green-600 border border-green-200' 
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}>
                          {returnStatus.message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-5 p-4 rounded-[1.5rem] bg-[#FDFBF7] border border-black/[0.02] transition-colors hover:bg-white hover:border-black/10">
                        <div className="w-16 h-16 rounded-2xl bg-white p-1 border border-black/5 overflow-hidden shadow-sm flex-shrink-0">
                          {item.products?.image ? (
                            <img src={item.products.image} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-black/20">N/A</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-wider text-black/80 truncate">{item.products?.name || "Bespoke Artifact"}</p>
                          <p className="text-[10px] font-bold text-black/40 mt-1 uppercase tracking-tighter">
                            Qty: {item.quantity} — <span className="text-[#D4AF37]">GH₵{item.price.toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-black/[0.05] gap-6">
                    <div className="text-center sm:text-left">
                      <span className="text-[9px] font-black uppercase text-black/20 tracking-[0.3em] block mb-1 font-sans">Total</span>
                      <span className="text-3xl font-serif italic text-black">GH&#8373; {order.total_amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto flex-wrap justify-center sm:justify-end">
                      <button 
                        onClick={() => handleReorder(items)} 
                        className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all active:scale-95 shadow-lg shadow-black/10">
                        Reorder
                      </button>
                      
                      {canCancel && (
                        <button 
                          onClick={() => handleCancelOrder(order)} 
                          className="flex-1 sm:flex-none px-8 py-4 rounded-2xl border border-red-200 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:border-red-500 hover:bg-red-100 transition-all active:scale-95">
                          Cancel Order
                        </button>
                      )}

                      {isDelivered && (
                        returnStatus.canReturn ? (
                          <button 
                            onClick={() => handleReturnOrder(order)} 
                            className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all active:scale-95">
                            Return Item
                          </button>
                        ) : (
                          <button 
                            disabled 
                            className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-gray-100 border border-gray-200 text-gray-400 text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
                            title="Return period has expired">
                            Not Returnable
                          </button>
                        )
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
