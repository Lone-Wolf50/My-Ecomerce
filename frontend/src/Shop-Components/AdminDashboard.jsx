import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from "../Database-Server/Superbase-client.js";
import Swal from 'sweetalert2';
import { Menu, X, Package, ShoppingBag, PlusCircle, BarChart3, LogOut } from 'lucide-react';

const AdminDashboard = () => {
  // --- EXISTING STATES ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory');
  const [editingId, setEditingId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const [orderSubTab, setOrderSubTab] = useState('incoming'); // 'incoming' or 'outgoing'
  // --- NEW STATES FOR ORDERS & NOTIFICATIONS ---
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");

  const initialForm = {
    name: '', price: '', description: '', category: '',
    material: '', origin: '', series: '', image: ''
  };
  const [form, setForm] = useState(initialForm);

  // --- FETCH PRODUCTS ---
  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setProducts(data);
  }, []);

  // --- FETCH ORDERS ---
  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, order_items (*)`) 
      .order('created_at', { ascending: false });
    if (!error) setOrders(data);
    else console.error("Order Fetch Error:", error.message);
  }, []);

  // --- FETCH CURRENT BROADCAST ---
  const fetchBroadcast = useCallback(async () => {
    const { data, error } = await supabase
      .from('site_notifications')
      .select('message')
      .eq('id', 1)
      .single();
    if (!error && data) setBroadcastMsg(data.message);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchBroadcast();
  }, [fetchProducts, fetchOrders, fetchBroadcast]);

// --- UPDATED: TOGGLE ORDER STATUS & TRIGGER NODEJS EMAIL ---
const toggleOrderStatus = async (orderId, newStatus, customerEmail) => {
  console.log(`--- DEBUG: Updating Order ID: ${orderId} ---`);
  console.log(`Target Status: ${newStatus}`);

  // 1. Update Supabase Database
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select(); // select() helps confirm what the DB actually saved

  if (error) {
    console.error("CRITICAL DB ERROR:", error.message);
    toast("Database failed to update status.");
    return;
  }

  console.log("DB Update Result:", data);

  // 2. Update local state for immediate UI feedback
  setOrders(prevOrders => 
    prevOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
  );

  if (selectedOrder && selectedOrder.id === orderId) {
    setSelectedOrder({ ...selectedOrder, status: newStatus });
  }

  // 3. TRIGGER NODEJS EMAIL (Only if marked as completed)
  if (newStatus === 'completed') {
    toast(`ORDER SEALED. Dispatching Confirmation...`);
    
    try {
      // Replace 'http://localhost:3001' with your deployed backend URL if necessary
      const response = await fetch("http://localhost:3001/send-status-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: customerEmail,
          customerName: selectedOrder?.customer_name,
          orderId: orderId,
          totalAmount: selectedOrder?.total_amount
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log("Email notification sent successfully");
      }
    } catch (err) {
      console.error("Failed to trigger Node.js email:", err);
    }
  } const messages = {
    pending: "Order moved back to Pending",
    processing: "Order is now being Crafted",
    shipped: "Order has been Dispatched! ✈",
    delivered: "Order marked as Delivered ✓",
    cancelled: "Order has been Voided ✕",
    returned: "Return process initiated ↺"
  };

  // Use the newStatus to show the correct toast, or a default if not found
  const toastMessage = messages[newStatus] || `Status updated to ${newStatus}`;
  
  toast(toastMessage);

};

  // --- IMAGE UPLOAD ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setForm((prev) => ({ ...prev, image: data.publicUrl }));
      toast("Image uploaded to vault");
    } catch (err) {
      Swal.fire("Upload Error", err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  // --- HANDLE SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.image) return Swal.fire("Missing Asset", "Please upload an image first.", "warning");
    setLoading(true);
    try {
      const payload = { ...form, price: parseFloat(form.price) };
      if (editingId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingId);
        if (error) throw error;
        toast("Registry Updated");
      } else {
        const { error } = await supabase.from('products').insert([{ ...payload, id: crypto.randomUUID() }]);
        if (error) throw error;
        toast("Product Archived");
      }
      setForm(initialForm);
      setEditingId(null);
      setActiveTab('inventory');
      fetchProducts();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  
  // --- SEND NOTIFICATION TO EVERYONE (GLOBAL BROADCAST) ---

const handleUpdateBroadcast = async () => {
  setLoading(true);
  try {
    const { data: profiles, error: fetchError } = await supabase.from('profiles').select('id'); 
    if (fetchError) throw fetchError;

    const notificationsToInsert = profiles.map(profile => ({
      user_id: profile.id, 
      title: " Announcement",
      message: broadcastMsg,
      is_read: false
    }));

    const { error: insertError } = await supabase.from('site_notifications').insert(notificationsToInsert);

    if (insertError) {
      Swal.fire("Error", insertError.message, "error");
    } else {
      toast("Broadcast delivered");
      setBroadcastMsg(""); // <--- THIS CLEARS THE TEXTAREA AFTER SUCCESS
    }
  } catch (err) {
    console.error("CRITICAL SCRIPT ERROR:", err.message);
  } finally {
    setLoading(false);
  }
};
  const handleEdit = (product) => {
    setForm(product);
    setEditingId(product.id);
    setActiveTab('add');
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'CONFIRM DELETION',
      text: "This artifact will be purged from the archives.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#000',
      confirmButtonText: 'DELETE'
    });
    if (result.isConfirmed) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
      toast("Deleted successfully");
    }
  };

  const toast = (msg) => {
    Swal.fire({ title: msg, icon: "success", timer: 2000, showConfirmButton: false, background: "#FDFBF7" });
  };

  const totalValue = products.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
  const categories = [...new Set(products.map(p => p.category))];
 const incomingCount = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status?.toLowerCase())).length;
const outgoingCount = orders.filter(o => ['delivered', 'cancelled', 'returned'].includes(o.status?.toLowerCase())).length;
 
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-black font-sans flex">
   {/* 1. SIDEBAR NAVIGATION (Highest Z-Index to cover everything) */}
    <nav className={`
      fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
      md:translate-x-0 md:relative md:flex
      transition-transform duration-300 ease-in-out
      w-72 border-r border-black/5 p-8 flex flex-col justify-between h-screen 
      bg-white z-[100] shadow-2xl md:shadow-none md:sticky md:top-0
    `}>
      <div className="space-y-12">
        {/* Mobile Close Button (Optional: so they can close without clicking overlay) */}
        <div className="md:hidden flex justify-end">
          <button onClick={() => setIsSidebarOpen(false)} className="p-2">
            <X size={28} />
          </button>
        </div>

        <h1 className="text-2xl font-serif italic tracking-tighter text-[#D4AF37]">
          Admin Dashboard
        </h1>

        <ul className="space-y-2">
          {[
            { id: 'inventory', label: 'Inventory', icon: <Package size={18}/> },
            { id: 'orders', label: 'Client Requests', icon: <ShoppingBag size={18}/> },
            { id: 'add', label: 'Add Product', icon: <PlusCircle size={18}/> },
            { id: 'stats', label: 'Analytics', icon: <BarChart3 size={18}/> }
          ].map((item) => (
            <li 
              key={item.id}
              onClick={() => { 
                setActiveTab(item.id); 
                setIsSidebarOpen(false); 
                if(item.id === 'add') { setEditingId(null); setForm(initialForm); }
              }} 
              className={`cursor-pointer text-[12px] font-black uppercase tracking-widest transition-all p-4 rounded-xl flex items-center gap-4 ${
                activeTab === item.id ? 'bg-black text-white' : 'text-black/40 hover:bg-black/5 hover:text-black'
              }`}
            >
              {item.icon} {item.label}
            </li>
          ))}
        </ul>
      </div>

      <button 
        onClick={() => { sessionStorage.clear(); window.location.assign('/login'); }} 
        className="flex items-center justify-center gap-2 text-[10px] font-black uppercase border border-black/10 px-6 py-4 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
      >
        <LogOut size={14}/> Logout
      </button>
    </nav>

    {/* 2. OVERLAY */}
    {isSidebarOpen && (
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] md:hidden" 
        onClick={() => setIsSidebarOpen(false)} 
      />
    )} <main className="flex-1 p-12 overflow-y-auto">
      {/* MOBILE HEADER (Inside main, so it gets covered by Sidebar) */}
      <div className="md:hidden flex items-center justify-between p-6 bg-transparent">
        <div className="flex flex-col">
           <h1 className="text-xl font-serif italic text-[#D4AF37]">Admin</h1>
           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black/30">Management</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="p-3 bg-white border border-black/5 rounded-2xl shadow-sm active:scale-95 transition-transform"
        >
          <Menu size={24} />
        </button>
      </div>
        
       {/* INVENTORY TAB - RESPONSIVE GRID */}
        {activeTab === 'inventory' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-serif italic mb-8">Current Collection</h2>
            
            {/* Desktop Header */}
            <div className="hidden md:grid grid-cols-6 p-4 text-[15px] font-black uppercase text-black/40 border-b border-black/10 mb-2">
              <div className="col-span-2">Product</div>
              <div>Category</div>
              <div>Price</div>
              <div>Origin</div>
              <div className="text-right">Actions</div>
            </div>

            <div className="space-y-4 md:space-y-2">
              {products.map(p => (
                <div key={p.id} className="flex flex-col md:grid md:grid-cols-6 p-6 items-center border border-black/5 bg-white rounded-2xl hover:shadow-xl transition-all gap-4 md:gap-0">
                  <div className="w-full md:col-span-2 flex items-center gap-4">
                    <img src={p.image} className="w-16 h-16 md:w-12 md:h-12 object-cover rounded-lg bg-gray-100" alt={p.name} />
                    <div>
                      <div className="font-bold text-sm md:text-xs uppercase tracking-tight">{p.name}</div>
                      <div className="text-[15px] md:text-[15px] text-black/40 italic">{p.series || 'Masterpiece'}</div>
                    </div>
                  </div>
                  
                  <div className="w-full flex justify-between md:block">
                    <span className="md:hidden text-[10px] font-black text-black/30 uppercase">Category</span>
                    <span className="text-[14px] font-medium uppercase">{p.category}</span>
                  </div>
                  
                  <div className="w-full flex justify-between md:block">
                    <span className="md:hidden text-[10px] font-black text-black/30 uppercase">Price</span>
                    <span className="text-[15px] font-bold text-[#D4AF37]">GH&#8373;{p.price?.toLocaleString()}</span>
                  </div>

                  <div className="w-full flex justify-between md:block">
                    <span className="md:hidden text-[10px] font-black text-black/30 uppercase">Origin</span>
                    <span className="text-[14px] uppercase tracking-widest">{p.origin}</span>
                  </div>

                  <div className="w-full flex justify-end gap-6 md:gap-4 pt-4 md:pt-0 border-t md:border-none border-black/5">
                    <button onClick={() => handleEdit(p)} className="text-[13px] font-black uppercase text-[#D4AF37]">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-[13px] font-black uppercase text-red-400">Void</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

       {/* ORDERS TAB */}
{/* ORDERS TAB */}
{activeTab === 'orders' && (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
      <div>
        <h2 className="text-3xl md:text-4xl font-serif italic">Client Requests</h2>
        <p className="text-[13px] font-black uppercase tracking-[0.2em] text-black/30 mt-2">Vault Order Management</p>
      </div>

      {/* SUB-TAB NAVIGATION */}
     {/* SUB-TAB NAVIGATION WITH BADGES */}
<div className="flex bg-black/5 p-1.5 rounded-[1.5rem] w-full md:w-auto backdrop-blur-sm">
  <button 
    onClick={() => setOrderSubTab('incoming')}
    className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
      orderSubTab === 'incoming' ? 'bg-white shadow-md text-black' : 'text-black/40 hover:text-black'
    }`}
  >
    Incoming 
    <span className={`px-2 py-0.5 rounded-full text-[9px] ${orderSubTab === 'incoming' ? 'bg-black text-white' : 'bg-black/10 text-black/40'}`}>
      {incomingCount}
    </span>
  </button>
  
  <button 
    onClick={() => setOrderSubTab('outgoing')}
    className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
      orderSubTab === 'outgoing' ? 'bg-white shadow-md text-black' : 'text-black/40 hover:text-black'
    }`}
  >
    Outgoing
    <span className={`px-2 py-0.5 rounded-full text-[9px] ${orderSubTab === 'outgoing' ? 'bg-white text-black bg-black/10' : 'bg-black/10 text-black/40'}`}>
      {outgoingCount}
    </span>
  </button>
</div>
    </div>

    {/* Header - Only visible on Desktop */}
    <div className="hidden md:grid grid-cols-6 px-8 mb-4 text-[15px] font-black uppercase tracking-[0.2em] text-black/30">
      <div className="col-span-2">Client Details</div>
      <div>Phone</div>
      <div>Assets</div>
      <div>Total Value</div>
      <div className="text-right">Action</div>
    </div>

    <div className="space-y-3">
      {orders
        .filter(order => {
          const s = order.status?.toLowerCase();
          if (orderSubTab === 'incoming') {
            return s === 'pending' || s === 'processing' || s === 'shipped';
          }
          return s === 'delivered' || s === 'cancelled' || s === 'returned';
        })
        .map((order) => (
          <div 
            key={order.id} 
            className="group bg-white rounded-[2rem] md:rounded-full border border-black/5 p-4 md:px-8 md:py-4 flex flex-col md:grid md:grid-cols-6 items-center gap-4 md:gap-0 hover:shadow-xl hover:shadow-black/[0.02] transition-all duration-500"
          >
            {/* Client & Status */}
            <div className="w-full md:col-span-2 flex items-center gap-4">
              <div className="relative">
                <div className={`w-3 h-3 rounded-full ${
                  order.status === 'delivered' ? 'bg-green-400' : 
                  order.status === 'cancelled' ? 'bg-red-400' : 
                  'bg-amber-400 animate-pulse'
                }`}></div>
                <div className={`absolute inset-0 w-3 h-3 rounded-full blur-[4px] ${
                  order.status === 'delivered' ? 'bg-green-400/50' : 
                  order.status === 'cancelled' ? 'bg-red-400/50' : 
                  'bg-amber-400/50'
                }`}></div>
              </div>
              <div>
                <div className="font-bold uppercase text-[13px] tracking-tight">{order.customer_name}</div>
                <div className="text-[10px] text-black/40 font-medium uppercase">{order.status}</div>
              </div>
            </div>

            {/* Phone - Desktop Only */}
            <div className="hidden md:block text-[14px] font-medium text-black/60">
              {order.phone_number}
            </div>

            {/* Assets Count */}
            <div className="w-full md:w-auto flex justify-between md:block border-t md:border-none border-black/5 pt-3 md:pt-0">
              <span className="md:hidden text-[10px] font-black uppercase text-black/20">Assets</span>
              <span className="text-[14px] font-bold md:font-medium">{order.order_items?.length || 0} Items</span>
            </div>

            {/* Total Value */}
            <div className="w-full md:w-auto flex justify-between md:block">
              <span className="md:hidden text-[10px] font-black uppercase text-black/20">Value</span>
              <span className="text-[15px] font-bold text-[#D4AF37]">GH₵{order.total_amount?.toLocaleString()}</span>
            </div>

            {/* Action Button */}
            <div className="w-full md:w-auto flex justify-end pt-2 md:pt-0">
              <button 
                onClick={() => { setSelectedOrder(order); setIsOrderModalOpen(true); }}
                className="w-full md:w-auto bg-black text-white px-6 py-3 md:py-2 rounded-full md:rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-all"
              >
                View Manifest
              </button>
            </div>
          </div>
        ))}

      {/* Empty State */}
      {orders.filter(order => {
          const s = order.status?.toLowerCase();
          return orderSubTab === 'incoming' 
            ? (s === 'pending' || s === 'processing' || s === 'shipped')
            : (s === 'delivered' || s === 'cancelled' || s === 'returned');
      }).length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-black/5 rounded-[3rem]">
          <p className="text-black/20 font-serif italic text-xl">
            No {orderSubTab} requests found.
          </p>
        </div>
      )}
    </div>
  </div>
)}
        {/* ADD/EDIT TAB */}
       {activeTab === 'add' && (
  <div className="max-w-2xl animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
    <h2 className="text-3xl md:text-4xl font-serif italic mb-8">
      {editingId ? 'Modify Artifact' : 'Add New Entry'}
    </h2>
    
    <form onSubmit={handleSubmit} className="flex flex-col md:grid md:grid-cols-2 gap-x-8 gap-y-6">
      
      {/* Product Name - Always full width */}
      <div className="md:col-span-2">
        <label className="text-[13px] md:text-[15px] font-black uppercase tracking-widest text-black/40">Product Name</label>
        <input required className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold text-lg md:text-base" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
      </div>

      {/* Price and Category - Stacked on mobile, side-by-side on desktop */}
      <div className="w-full">
        <label className="text-[13px] md:text-[15px] font-black uppercase tracking-widest text-black/40">Price (GH₵)</label>
        <input required type="number" step="0.01" className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
      </div>

      <div className="w-full">
        <label className="text-[13px] md:text-[15px] font-black uppercase tracking-widest text-black/40">Category</label>
        <input required className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
      </div>

      {/* Visual Documentation - Re-styled for mobile stacking */}
      <div className="md:col-span-2 p-6 md:p-8 border-2 border-dashed border-black/10 rounded-[2rem] bg-black/[0.02]">
        <label className="text-[10px] font-black uppercase tracking-widest text-black/40 block mb-6 text-center md:text-left">
          Visual Documentation (Local Upload)
        </label>
        <div className="flex flex-col md:flex-row items-center gap-6">
          {form.image ? (
            <img src={form.image} className="w-32 h-32 md:w-24 md:h-24 object-cover rounded-2xl border border-black/10 shadow-lg" alt="Preview" />
          ) : (
            <div className="w-32 h-32 md:w-24 md:h-24 rounded-2xl bg-black/5 flex items-center justify-center border border-black/5">
              <span className="text-[10px] font-bold text-black/20 uppercase">No Image</span>
            </div>
          )}
          <div className="flex-1 w-full text-center md:text-left">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              disabled={uploading} 
              className="text-[10px] uppercase font-black cursor-pointer 
                file:mr-0 md:file:mr-4 file:mb-4 md:file:mb-0
                file:py-3 file:px-6 file:rounded-full file:border-0 
                file:text-[10px] file:font-black file:bg-black file:text-white 
                hover:file:bg-[#D4AF37] transition-all w-full md:w-auto" 
            />
            {uploading && <p className="text-[9px] font-bold uppercase tracking-widest mt-2 animate-pulse text-[#D4AF37]">Uploading to Vault...</p>}
          </div>
        </div>
      </div>

      {/* Material and Origin */}
      <div className="w-full">
        <label className="text-[13px] md:text-[15px] font-black uppercase tracking-widest text-black/40">Material</label>
        <input className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold" value={form.material} onChange={e => setForm({...form, material: e.target.value})} />
      </div>

      <div className="w-full">
        <label className="text-[13px] md:text-[15px] font-black uppercase tracking-widest text-black/40">Origin</label>
        <input className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold" value={form.origin} onChange={e => setForm({...form, origin: e.target.value})} />
      </div>

      {/* Series - Full Width */}
      <div className="md:col-span-2">
        <label className="text-[13px] md:text-[15px] font-black uppercase tracking-widest text-black/40">Series / Collection</label>
        <input className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold italic" value={form.series} onChange={e => setForm({...form, series: e.target.value})} />
      </div>

      {/* FORM ACTIONS */}
<div className="md:col-span-2 flex flex-col md:flex-row gap-4 mt-6">
  <button 
    type="submit"
    disabled={loading || uploading} 
    className="flex-[2] bg-black text-white py-5 md:py-6 rounded-full text-[11px] font-black uppercase tracking-[0.3em] hover:bg-[#D4AF37] disabled:bg-black/20 transition-all shadow-xl active:scale-95"
  >
    {loading ? 'Transmitting...' : (editingId ? 'Update Registry' : 'Add Product')}
  </button>

  <button 
    type="button"
    onClick={() => {
      setForm(initialForm);
      setEditingId(null);
      toast("Form Cleared");
    }}
    className="flex-1 bg-transparent border border-black/10 text-black/40 py-5 md:py-6 rounded-full text-[11px] font-black uppercase tracking-[0.3em] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all active:scale-95"
  >
    Reset
  </button>
</div>
    </form>
  </div>
)}

        {/* ANALYTICS & NOTIFICATIONS */}
        {activeTab === 'stats' && (
         <div className="space-y-6 md:space-y-12 animate-in zoom-in-95 duration-500">
             <h2 className="text-3xl md:text-4xl font-serif italic">Analytics</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
             <div className="p-8 md:p-10 bg-white border border-black/5 rounded-[2rem] md:rounded-[3rem]">
                  <div className="text-[12px] font-black uppercase text-black/30 mb-2">Inventory</div>
                  <div className="text-4xl md:text-5xl font-serif italic">{products.length}</div>
                </div>
              
              <div className="p-8 md:p-10 bg-white border border-black/5 rounded-[2rem] md:rounded-[3rem]">
                  <div className="text-[12px] font-black uppercase text-black/30 mb-2">Total Asset Value</div>
                  <div className="text-4xl md:text-5xl font-serif italic">GH&#8373;{(totalValue / 1000).toFixed(1)}k</div>
                </div>
                <div className="p-8 md:p-10 bg-white border border-black/5 rounded-[2rem] md:rounded-[3rem]">
                  <div className="text-[12px] font-black uppercase text-black/30 mb-2">Categories</div>
                  <div className="text-4xl md:text-5xl font-serif italic">{categories.length}</div>
                </div>
            </div>

            <div className="max-w-xl p-10 bg-white border border-black/5 rounded-[3rem] shadow-sm">
                <h3 className="text-[27px] font-serif italic mb-6 text-[#D4AF37]">Global Homepage Broadcast</h3>
                <label className="text-[13px] font-black uppercase tracking-widest text-black/40 mb-3 block">Custom Notification Bar Message</label>
                <textarea 
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    className="w-full bg-black/5 border-none p-4 rounded-2xl text-[15px] focus:ring-1 focus:ring-[#D4AF37] outline-none"
                    placeholder="Tell your clients something important..."
                />
                <button 
                    onClick={handleUpdateBroadcast}
                    disabled={loading}
                    className="mt-6 w-full bg-black text-white py-4 rounded-full text-[13px] font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-all"
                >
                    Send Message
                </button>
            </div>
          </div>
        )}
      </main>

      {/* ORDER MANIFEST MODAL */}
    {/* ORDER MANIFEST MODAL */}
{/* ORDER MANIFEST MODAL */}
{/* ORDER MANIFEST MODAL */}
{isOrderModalOpen && selectedOrder && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center">
    <div className="bg-[#FDFBF7] w-full max-w-2xl md:rounded-[3rem] rounded-t-[3rem] p-6 md:p-12 shadow-2xl animate-in slide-in-from-bottom-10 h-[90vh] md:h-auto overflow-y-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-3xl font-serif italic">Order Manifest</h3>
          <p className="text-[10px] font-black uppercase text-black/40 tracking-widest mt-1">
            Client: {selectedOrder.customer_name}
          </p>
        </div>
        
        {/* GLASS-MORPHISM DROPDOWN */}
        <div className="relative group">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm transition-all group-hover:bg-white/60"></div>
          
          <select 
            value={selectedOrder.status}
            onChange={(e) => toggleOrderStatus(
              selectedOrder.id, 
              e.target.value, 
              selectedOrder.customer_email
            )}
            className={`relative z-10 appearance-none outline-none px-6 py-3 pr-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none bg-transparent
              ${selectedOrder.status === 'delivered' ? 'text-green-600' : 
                selectedOrder.status === 'cancelled' ? 'text-red-500' : 
                selectedOrder.status === 'shipped' ? 'text-blue-500' : 'text-black/80'}`}
          >
            {/* Using a helper-style label for the current selection */}
            <optgroup label="Action Required" className="bg-white text-black">
              <option value="pending">◌ Revert to Pending</option>
              <option value="processing">⚙ Still Processing</option>
              <option value="shipped">✈ Order Dispatched</option>
            </optgroup>
            
            <optgroup label="Finalize (To User History)" className="bg-white text-black">
              <option value="delivered">✓ Parcel Delivered</option>
              <option value="cancelled">✕ Cancel Order</option>
              <option value="returned">↺ Process Return</option>
            </optgroup>
          </select>

          {/* Creative Status Label Overlay (The "Be Creative" part) */}
          <div className="absolute -bottom-5 right-2 whitespace-nowrap">
             <span className="text-[8px] font-bold italic uppercase tracking-tighter opacity-60">
                {selectedOrder.status === 'delivered' && "Signed & Sealed"}
                {selectedOrder.status === 'shipped' && "In Transit..."}
                {selectedOrder.status === 'processing' && "Crafting fulfillment"}
                {selectedOrder.status === 'pending' && "Awaiting Review"}
                {selectedOrder.status === 'cancelled' && "Voided"}
             </span>
          </div>

          {/* Custom Chevron Arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-4 z-20 flex items-center opacity-40">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
      </div>

      <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
        {selectedOrder.order_items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center p-4 bg-white/50 border border-black/5 rounded-2xl transition-all hover:bg-white/80">
            <div>
              <div className="text-[11px] font-black uppercase">PID: {item.product_id}</div>
              <div className="text-[9px] text-black/40 italic">Unit Price: GH₵{item.price}</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] font-bold">qty: {item.quantity}</div>
              <div className="text-[10px] font-black text-[#D4AF37]">GH₵{(item.price * item.quantity).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-8 border-t border-black/10 flex justify-between items-center">
        <div>
          <div className="text-[10px] font-black uppercase text-black/40">Total Order Value</div>
          <div className="text-3xl font-serif italic text-[#D4AF37]">GH₵{selectedOrder.total_amount?.toLocaleString()}</div>
        </div>
        <button 
          onClick={() => setIsOrderModalOpen(false)} 
          className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-black/10 transition-transform active:scale-95"
        >
          Close Manifest
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default AdminDashboard;
