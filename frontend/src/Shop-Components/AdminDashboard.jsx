import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from "../Database-Server/Superbase-client.js";
import Swal from 'sweetalert2';
import { Menu, X, Package, ShoppingBag, PlusCircle, BarChart3, LogOut, Mail } from 'lucide-react';
import AdminInbox from './AdminInbox.jsx';

const AdminDashboard = () => {
  // Persist activeTab and orderSubTab in sessionStorage
  const [chartPeriod, setChartPeriod] = useState('Monthly');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('adminActiveTab') || 'inventory';
  });
  const [editingId, setEditingId] = useState(null);
  const [personalMsg, setPersonalMsg] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orderSubTab, setOrderSubTab] = useState(() => {
    return sessionStorage.getItem('adminOrderSubTab') || 'incoming';
  });
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");

  // Persist tab states
  useEffect(() => {
    sessionStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem('adminOrderSubTab', orderSubTab);
  }, [orderSubTab]);

  // Prevent back navigation from admin dashboard
  useEffect(() => {
    const preventBackNavigation = (e) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.pathname);
    };

    // Push initial state
    window.history.pushState(null, '', window.location.pathname);
    
    // Listen for back button
    window.addEventListener('popstate', preventBackNavigation);

    return () => {
      window.removeEventListener('popstate', preventBackNavigation);
    };
  }, []);

  const handleSendPersonalMessage = async (order) => {
    if (!personalMsg.trim()) {
      toast("Please enter a message first.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('site_notifications')
        .insert([
          { 
            user_id: order.user_id,
            title: "Order Update",
            message: personalMsg,
            is_read: false,
            created_at: new Date().toISOString() 
          }
        ]);

      if (error) throw error;
      
      Swal.fire({
        title: 'Dispatched!',
        text: `Your message has been sent to ${order.customer_name}`,
        icon: 'success',
        confirmButtonColor: '#D4AF37'
      });
      
      setPersonalMsg("");
    } catch (err) {
      console.error("Transmission Error:", err.message);
      toast("Database failed to receive the message.");
    } finally {
      setLoading(false);
    }
  };

  const initialForm = {
    name: '', price: '', description: '', category: '',
    material: '', origin: '', series: '', image: ''
  };
  const [form, setForm] = useState(initialForm);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setProducts(data);
  }, []);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, order_items (*)`) 
      .order('created_at', { ascending: false });
    if (!error) setOrders(data);
    else console.error("Order Fetch Error:", error.message);
  }, []);

  const fetchBroadcast = useCallback(async () => {
  const { data, error } = await supabase
    .from('site_notifications')
    .select('message')
    .eq('id','550e8400-e29b-41d4-a716-446655440000')
    .maybeSingle(); // Use maybeSingle() instead of single()

  if (error) {
    console.error("Error fetching:", error.message);
    return;
  }

  if (data) {
    setBroadcastMsg(data.message);
  } else {
    setBroadcastMsg("No active broadcast"); // Handle the 0 rows case gracefully
  }
}, []);
  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchBroadcast();
  }, [fetchProducts, fetchOrders, fetchBroadcast]);

  const toggleOrderStatus = async (orderId, newStatus, customerEmail) => {
    console.log(`--- DEBUG: Updating Order ID: ${orderId} ---`);
    console.log(`Target Status: ${newStatus}`);

    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select();

    if (error) {
      console.error("CRITICAL DB ERROR:", error.message);
      toast("Database failed to update status.");
      return;
    }

    console.log("DB Update Result:", data);

    // Update local state
    setOrders(prevOrders => 
      prevOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
    );

    // Update selected order in modal
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }

    if (newStatus === 'delivered') {
      toast(`ORDER SEALED. Dispatching Confirmation...`);
      
      try {
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
    }
    
    const messages = {
      pending: "Order moved back to Pending",
      processing: "Order is now being Crafted",
      shipped: "Order has been Dispatched! ✈",
      delivered: "Order marked as Delivered ✓",
      cancelled: "Order has been Voided ✕",
      returned: "Return process initiated ↺"
    };

    const toastMessage = messages[newStatus] || `Status updated to ${newStatus}`;
    toast(toastMessage);
  };

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

  const handleUpdateBroadcast = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: fetchError } = await supabase.from('profiles').select('id'); 
      if (fetchError) throw fetchError;

      const notificationsToInsert = profiles.map(profile => ({
        user_id: profile.id, 
        title: "📢 Announcement",
        message: broadcastMsg,
        is_read: false
      }));

      const { error: insertError } = await supabase.from('site_notifications').insert(notificationsToInsert);

      if (insertError) {
        Swal.fire("Error", insertError.message, "error");
      } else {
        toast("Broadcast delivered");
        setBroadcastMsg("");
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

  const incomingCount = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status?.toLowerCase())).length;
  const outgoingCount = orders.filter(o => ['delivered', 'cancelled', 'returned'].includes(o.status?.toLowerCase())).length;
 
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-black font-sans flex">
      <nav className={`
        fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 md:relative md:flex
        transition-transform duration-300 ease-in-out
        w-72 border-r border-black/5 p-8 flex flex-col justify-between h-screen 
        bg-white z-[100] shadow-2xl md:shadow-none md:sticky md:top-0
      `}>
        <div className="space-y-12">
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
              { id: 'inbox', label: 'Inbox', icon: <Mail size={18}/> },
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
          onClick={() => { 
            sessionStorage.clear(); 
            window.location.replace('/login'); 
          }} 
          className="flex items-center justify-center gap-2 text-[10px] font-black uppercase border border-black/10 px-6 py-4 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <LogOut size={14}/> Logout
        </button>
      </nav>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] md:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      <main className="flex-1 p-12 overflow-y-auto">
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
        
        {activeTab === 'inventory' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-serif italic mb-8">Current Collection</h2>
            
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

        {activeTab === 'orders' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-serif italic">Client Requests</h2>
                <p className="text-[13px] font-black uppercase tracking-[0.2em] text-black/30 mt-2">Vault Order Management</p>
              </div>

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

                    <div className="hidden md:block text-[14px] font-medium text-black/60">
                      {order.phone_number}
                    </div>

                    <div className="w-full md:w-auto flex justify-between md:block border-t md:border-none border-black/5 pt-3 md:pt-0">
                      <span className="md:hidden text-[10px] font-black uppercase text-black/20">Assets</span>
                      <span className="text-[14px] font-bold md:font-medium">{order.order_items?.length || 0} Items</span>
                    </div>

                    <div className="w-full md:w-auto flex justify-between md:block">
                      <span className="md:hidden text-[10px] font-black uppercase text-black/20">Value</span>
                      <span className="text-[15px] font-bold text-[#D4AF37]">GH₵{order.total_amount?.toLocaleString()}</span>
                    </div>

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

        {activeTab === 'add' && (
          <div className="max-w-2xl animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
            <h2 className="text-3xl md:text-4xl font-serif italic mb-8">
              {editingId ? 'Modify Artifact' : 'Add New Entry'}
            </h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col md:grid md:grid-cols-2 gap-x-8 gap-y-6">
              
              <div className="md:col-span-2">
                <label className="text-[13px] md:text-[15px] font-black uppercase tracking-widest text-black/40">Product Name</label>
                <input required className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold text-lg md:text-base" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>

              <div className="w-full">
                <label className="text-[13px] md:text-[15px] font-black uppercase tracking-widest text-black/40">Price (GH₵)</label>
                <input required type="number" step="0.01" className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
              </div>

              <div className="w-full">
                <label className="text-[13px] md:text-[15px] font-black uppercase tracking-widest text-black/40">Category</label>
                <input required className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
              </div>

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

              <div className="w-full">
                <label className="text-[13px] md:text-[15px] font-black uppercase tracking-widest text-black/40">Material</label>
                <input className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold" value={form.material} onChange={e => setForm({...form, material: e.target.value})} />
              </div>

              <div className="w-full">
                <label className="text-[13px] md:text-[15px] font-black uppercase tracking-widest text-black/40">Origin</label>
                <input className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold" value={form.origin} onChange={e => setForm({...form, origin: e.target.value})} />
              </div>

              <div className="md:col-span-2">
                <label className="text-[13px] md:text-[15px] font-black uppercase tracking-widest text-black/40">Series / Collection</label>
                <input className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold" value={form.series} onChange={e => setForm({...form, series: e.target.value})} />
              </div>

              <div className="md:col-span-2">
                <label className="text-[13px] md:text-[15px] font-black uppercase tracking-widest text-black/40">Description</label>
                <textarea 
                  className="w-full bg-transparent border border-black/20 p-4 rounded-2xl focus:border-[#D4AF37] outline-none font-medium resize-none" 
                  rows="4"
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Describe the product details, features, and craftsmanship..."
                />
              </div>

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

        {activeTab === 'inbox' && <AdminInbox />}
{activeTab === 'stats' && (() => {
  const totalValue = products.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
  const categories = [...new Set(products.map(p => p.category))];
  
  const totalRevenue = orders.filter(o => o.status?.toLowerCase() === 'delivered')
    .reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
    
  const pendingRevenue = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status?.toLowerCase()))
    .reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);

  const barColors = [
    'linear-gradient(180deg, #FFD700, #D4AF37)', 
    'linear-gradient(180deg, #818CF8, #6366F1)', 
    'linear-gradient(180deg, #F472B6, #EC4899)', 
    'linear-gradient(180deg, #34D399, #10B981)', 
    'linear-gradient(180deg, #FBBF24, #F59E0B)', 
    'linear-gradient(180deg, #60A5FA, #3B82F6)', 
    'linear-gradient(180deg, #A78BFA, #8B5CF6)', 
    'linear-gradient(180deg, #F87171, #EF4444)', 
    'linear-gradient(180deg, #22D3EE, #06B6D4)', 
    'linear-gradient(180deg, #A3E635, #84CC16)', 
    'linear-gradient(180deg, #FB7185, #F43F5E)', 
    'linear-gradient(180deg, #94A3B8, #64748B)', 
  ];

  const getChartData = () => {
    if (chartPeriod === 'Daily') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days.map((day, index) => ({
        name: day,
        amount: orders
          .filter(o => new Date(o.created_at).getDay() === index)
          .reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0)
      }));
    }
    if (chartPeriod === 'Yearly') {
      const currentYear = new Date().getFullYear();
      const years = [currentYear - 2, currentYear - 1, currentYear];
      return years.map(year => ({
        name: year.toString(),
        amount: orders
          .filter(o => new Date(o.created_at).getFullYear() === year)
          .reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0)
      }));
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => ({
      name: month,
      amount: orders
        .filter(o => new Date(o.created_at).getMonth() === index)
        .reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0)
    }));
  };

  const activeChartData = getChartData();
  const maxAmount = Math.max(...activeChartData.map(d => d.amount), 100);
  const periodTotal = activeChartData.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700">
      <h2 className="text-3xl md:text-4xl font-serif italic">Analytics</h2>

      {/* Financial Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-10 bg-black text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <span className="text-[12px] font-black uppercase tracking-widest text-white/40">Financial Pulse</span>
              <div className="p-2 bg-white/10 rounded-full"><BarChart3 size={20} className="text-[#D4AF37]"/></div>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase text-[#D4AF37] mb-1">Cleared Revenue</p>
                <p className="text-4xl font-serif italic">GH₵ {totalRevenue.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                  <span className="text-white/40">Pending: GH₵ {pendingRevenue.toLocaleString()}</span>
                  <span className="text-[#D4AF37]">Flow Ratio</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#D4AF37] transition-all duration-1000" 
                    style={{ width: `${(totalRevenue + pendingRevenue) > 0 ? (totalRevenue / (totalRevenue + pendingRevenue)) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-10 bg-white border border-black/5 rounded-[3rem] flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[12px] font-black uppercase tracking-widest text-black/30">Vault Density</span>
              <div className="px-3 py-1 bg-black/5 rounded-full text-[10px] font-black uppercase">
                Value: GH₵ {(totalValue / 1000).toFixed(1)}k
              </div>
            </div>
            <p className="text-4xl font-serif italic mt-4">{products.length} <span className="text-sm font-sans not-italic text-black/40 ml-2">Total Assets</span></p>
          </div>
          <div className="flex flex-wrap gap-2 mt-8">
            {categories.map(cat => (
              <span key={cat} className="px-4 py-2 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-wider">
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 🚀 PROFESSIONAL FLAT BAR CHART */}
      <div className="mt-12 p-10 bg-white border border-black/5 rounded-[4rem] shadow-xl relative overflow-hidden min-h-[550px] flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 px-4 pt-4">
          <div className="space-y-1">
            <h3 className="text-3xl font-serif italic text-black leading-tight">{chartPeriod} Performance</h3>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-black/30">Gross Volume: GH₵ {periodTotal.toLocaleString()}</p>
          </div>
          
          <div className="overflow-x-auto">
            <div className="flex bg-gray-100/80 p-1.5 rounded-2xl border border-black/5 mr-4 min-w-max">
              {['Daily', 'Monthly', 'Yearly'].map((t) => (
                <button 
                  key={t} 
                  onClick={() => setChartPeriod(t)}
                  className={`px-7 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${chartPeriod === t ? 'bg-black text-white shadow-xl' : 'text-black/30 hover:text-black hover:bg-black/5'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BARS AREA */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex items-end gap-6 md:gap-8 px-8 pb-6 min-w-max h-full">
            {activeChartData.map((data, i) => {
              const barHeight = (data.amount / maxAmount) * 100;
              const displayHeight = Math.max(barHeight, data.amount > 0 ? 8 : 2); 
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-6 group">
                  <div className="relative w-full flex justify-center items-end h-72">
                    
                    {/* Tooltip */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black text-white text-[10px] font-black px-4 py-2 rounded-md z-30 whitespace-nowrap shadow-2xl">
                      GH₵{data.amount.toLocaleString()}
                    </div>
                    
                    {/* THE FLAT BAR */}
                    <div 
                      className="w-full max-w-[45px] rounded-sm shadow-sm transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:brightness-110"
                      style={{ 
                        height: `${displayHeight}%`,
                        backgroundImage: barColors[i % 12],
                        opacity: data.amount > 0 ? 1 : 0.25 
                      }}
                    >
                      <div className="w-full h-full bg-black/5"></div>
                    </div>
                  </div>
                  
                  <span className="text-[11px] font-black uppercase tracking-tighter text-black/40 group-hover:text-black transition-colors">
                    {data.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Global Broadcast */}
      <div className="max-w-xl p-10 bg-white border border-black/5 rounded-[3rem] shadow-sm">
        <h3 className="text-[27px] font-serif italic mb-6 text-[#D4AF37]">Global Homepage Broadcast</h3>
        <textarea 
          value={broadcastMsg}
          onChange={(e) => setBroadcastMsg(e.target.value)}
          className="w-full bg-black/5 border-none p-4 rounded-2xl text-[15px] focus:ring-1 focus:ring-[#D4AF37] outline-none min-h-[100px]"
          placeholder="Tell your clients something important..."
        />
        <button 
          onClick={handleUpdateBroadcast}
          disabled={loading}
          className="mt-6 w-full bg-black text-white py-4 rounded-full text-[13px] font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-all"
        >
          {loading ? "Transmitting..." : "Send Message"}
        </button>
      </div>
    </div>
  );
})()}
      </main>

      {isOrderModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-end md:items-center justify-center">
          <div className="bg-[#FDFBF7] w-full max-w-2xl md:rounded-[3rem] rounded-t-[3rem] p-6 md:p-12 shadow-2xl h-[90vh] md:h-auto overflow-y-auto flex flex-col">
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-3xl font-serif italic">Order Manifest</h3>
                <p className="text-[10px] font-black uppercase text-black/40 tracking-widest mt-1">
                  Registry ID: {selectedOrder.id.slice(0,8)}...
                </p>
                <p className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider mt-2">
                  Placed: {new Date(selectedOrder.created_at).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              
              <div className="relative group">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm"></div>
                <select 
                  value={selectedOrder.status}
                  onChange={(e) => toggleOrderStatus(selectedOrder.id, e.target.value, selectedOrder.customer_email)}
                  className="relative z-10 appearance-none outline-none px-6 py-3 pr-12 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer bg-transparent border-none"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 max-h-[25vh] overflow-y-auto pr-4 mb-8 custom-scrollbar">
              <p className="text-[9px] font-black uppercase text-black/20 mb-2">Inventory Items</p>
              {selectedOrder.order_items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-white border border-black/5 rounded-2xl">
                  <span className="text-[11px] font-black uppercase">Asset #{item.product_id.slice(0,5)}</span>
                  <span className="text-[11px] font-bold text-[#D4AF37]">GH₵{item.price.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="p-8 bg-black rounded-[2.5rem] text-white shadow-xl mb-8">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Direct Client Dispatch</h4>
                <span className="text-[8px] font-bold text-white/30 italic">Secure Channel</span>
              </div>
              
              <textarea 
                value={personalMsg}
                onChange={(e) => setPersonalMsg(e.target.value)}
                placeholder={`Personal note for ${selectedOrder.customer_name}...`}
                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs text-white focus:border-[#D4AF37] outline-none min-h-[100px] resize-none mb-4"
              />
              
              <button 
                onClick={() => handleSendPersonalMessage(selectedOrder)}
                disabled={loading || !personalMsg}
                className="w-full bg-[#D4AF37] text-black py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all active:scale-95 disabled:opacity-20"
              >
                {loading ? "TRANSMITTING TO VAULT..." : "SEND PERSONAL MESSAGE"}
              </button>
            </div>

            <div className="mt-auto pt-8 border-t border-black/10 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase text-black/40">Manifest Total</p>
                <p className="text-3xl font-serif italic text-[#D4AF37]">GH₵{selectedOrder.total_amount?.toLocaleString()}</p>
              </div>
              <button 
                onClick={() => { setIsOrderModalOpen(false); setPersonalMsg(""); }}
                className="bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;