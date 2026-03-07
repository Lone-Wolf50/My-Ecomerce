import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../Database-Server/Superbase-client.js";
import Swal from "sweetalert2";
import { LayoutGrid, ShoppingBag, BarChart3, Mail, Plus, Menu } from "lucide-react";

import AdminSidebar     from "./AdminSidebar.jsx";
import AdminInventory   from "./AdminInventory.jsx";
import AdminOrders      from "./AdminOrders.jsx";
import AdminOrderModal  from "./AdminOrderModal.jsx";
import AdminProductForm from "./AdminProductForm.jsx";
import AdminAnalytics   from "./AdminAnalytics.jsx";
import AdminInbox       from "./AdminInbox.jsx";
import AdminCategories  from "./AdminCategories.jsx";

const INITIAL_FORM = {
  name: "", price: "", previous_price: "", description: "",
  category: "", material: "", origin: "", series: "", image: "",
};

const TAB_LABELS = {
  inventory: "Inventory", orders: "Orders", inbox: "Inbox",
  categories: "Collections", add: "Add Product", stats: "Analytics",
};

/* ══════════════════════════════════════════════════════════
   Mobile Bottom Navigation Bar
══════════════════════════════════════════════════════════ */
const BOTTOM_TABS = [
  { id: "inventory",  icon: LayoutGrid,  label: "Stock"     },
  { id: "orders",     icon: ShoppingBag, label: "Orders"    },
  { id: "add",        icon: Plus,        label: "Add",      primary: true },
  { id: "inbox",      icon: Mail,        label: "Inbox"     },
  { id: "stats",      icon: BarChart3,   label: "Analytics" },
];

const MobileBottomNav = ({ activeTab, setActiveTab, unreadInboxCount, onMenuOpen }) => (
  <nav className="md:hidden fixed bottom-0 inset-x-0 z-[100]">
    <div className="relative bg-[#070707]/96 backdrop-blur-2xl border-t border-white/[0.06]">

      {/* Gold hairline at top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9A227]/55 to-transparent" />

      <div className="flex items-center justify-around px-1 pt-2 pb-4">

        {BOTTOM_TABS.map(({ id, icon: Icon, label, primary }) => {
          const active  = activeTab === id;
          const isInbox = id === "inbox";

          return primary ? (
            /* ── Primary centre "Add" button ── */
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-label="Add product"
              className={`relative flex items-center justify-center w-14 h-14 -mt-6 rounded-[1.1rem] shadow-2xl transition-all duration-200 active:scale-90 ${active ? "bg-[#C9A227]" : "bg-[#C9A227]/90 hover:bg-[#C9A227]"}`}
              style={{ boxShadow: "0 4px 28px rgba(201,162,39,0.45)" }}
            >
              <Icon size={22} strokeWidth={2.5} className="text-black" />
            </button>
          ) : (
            /* ── Regular tab buttons ── */
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-2xl transition-all duration-200 active:scale-90 group"
            >
              {/* Icon container */}
              <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${active ? "bg-[#C9A227]/14" : "group-hover:bg-white/[0.05]"}`}>
                <Icon
                  size={18}
                  strokeWidth={active ? 2.4 : 1.8}
                  className={`transition-colors duration-200 ${active ? "text-[#C9A227]" : "text-white/28 group-hover:text-white/50"}`}
                />
                {/* Inbox unread badge */}
                {isInbox && unreadInboxCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 bg-red-500 text-white text-[7px] font-black rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {unreadInboxCount > 9 ? "9+" : unreadInboxCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[7.5px] font-black uppercase tracking-widest transition-colors duration-200 ${
                active ? "text-[#C9A227]" : "text-white/20 group-hover:text-white/38"
              }`}>
                {label}
              </span>

              {/* Active underline dot */}
              {active && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C9A227]" />
              )}
            </button>
          );
        })}

        {/* ── "More" button opens full sidebar drawer ── */}
        <button
          onClick={onMenuOpen}
          className="relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-2xl transition-all active:scale-90 group"
        >
          <div className="relative w-9 h-9 rounded-xl flex items-center justify-center group-hover:bg-white/[0.05] transition-colors">
            <Menu size={18} strokeWidth={1.8} className="text-white/28 group-hover:text-white/50" />
            {/* Dot showing Collections tab exists */}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#C9A227]/50 rounded-full border border-[#070707]" />
          </div>
          <span className="text-[7.5px] font-black uppercase tracking-widest text-white/20 group-hover:text-white/38">More</span>
        </button>

      </div>
    </div>
  </nav>
);

/* ══════════════════════════════════════════════════════════
   AdminDashboard
══════════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const [activeTab, setActiveTab]             = useState(() => sessionStorage.getItem("adminActiveTab") || "inventory");
  const [isSidebarOpen, setIsSidebarOpen]     = useState(false);
  const [chartPeriod, setChartPeriod]         = useState("Monthly");

  const [products, setProducts]               = useState([]);
  const [orders, setOrders]                   = useState([]);
  const [categories, setCategories]           = useState([]);
  const [broadcastMsg, setBroadcastMsg]       = useState("");
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);

  const [form, setForm]                       = useState(INITIAL_FORM);
  const [editingId, setEditingId]             = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [uploading, setUploading]             = useState(false);

  const mainRef                               = useRef(null);
  const [selectedOrder, setSelectedOrder]     = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [personalMsg, setPersonalMsg]         = useState("");

  useEffect(() => { sessionStorage.setItem("adminActiveTab", activeTab); }, [activeTab]);

  // Prevent back navigation
  useEffect(() => {
    const handle = () => window.history.pushState(null, "", window.location.pathname);
    window.history.pushState(null, "", window.location.pathname);
    window.addEventListener("popstate", handle);
    return () => window.removeEventListener("popstate", handle);
  }, []);

  /* ── Fetching ── */
  const fetchProducts = useCallback(async () => {
    console.log("[fetchProducts] Fetching active products...");
    const { data, error } = await supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false });
    console.log("[fetchProducts] Result — count:", data?.length, "| error:", error);
    if (!error) setProducts(data || []);
  }, []);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase.from("orders").select("*, order_items (*)").order("created_at", { ascending: false });
    if (!error) setOrders(data || []);
    /* order fetch error — UI shows empty state */
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from("homepage_categories").select("id, name, slug").order("sort_order");
    setCategories(data || []);
  }, []);

  const fetchBroadcast = useCallback(async () => {
    const { data } = await supabase.from("site_notifications").select("message")
      .eq("id", "550e8400-e29b-41d4-a716-446655440000").maybeSingle();
    setBroadcastMsg(data?.message || "");
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    const { count } = await supabase.from("admin_messages")
      .select("id", { count: "exact", head: true }).eq("status", "unread");
    setUnreadInboxCount(count || 0);
  }, []);

  useEffect(() => {
    fetchProducts(); fetchOrders(); fetchCategories(); fetchBroadcast(); fetchUnreadCount();
  }, [fetchProducts, fetchOrders, fetchCategories, fetchBroadcast, fetchUnreadCount]);

  // Refresh badge when admin opens inbox
  useEffect(() => { if (activeTab === "inbox") fetchUnreadCount(); }, [activeTab, fetchUnreadCount]);

  // Reset scroll position when switching tabs
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [activeTab]);

  const toast = (msg) =>
    Swal.fire({ title: msg, icon: "success", timer: 2000, showConfirmButton: false, background: "#FDFBF7" });

  /* ── Orders ── */
  const toggleOrderStatus = async (orderId, newStatus, customerEmail) => {
    const updatePayload = { status: newStatus };
    if (newStatus === 'delivered') {
      updatePayload.delivered_at = new Date().toISOString();
    }
    const { error } = await supabase.from("orders").update(updatePayload).eq("id", orderId).select();
    if (error) { toast("Database failed to update status."); return; }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    if (selectedOrder?.id === orderId) setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
    const msgs = {
      pending: "Order moved back to Pending",    processing: "Order is now being Crafted",
      shipped: "Order has been Dispatched! ✈",   delivered: "Order marked as Delivered ✓",
      cancelled: "Order has been Voided ✕",       returned: "Return process initiated ↺",
    };
    toast(msgs[newStatus] || `Status → ${newStatus}`);
  };

  const handleSendPersonalMessage = async (order) => {
    if (!personalMsg.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("site_notifications").insert([{
        user_id: order.user_id, title: "Order Update", message: personalMsg,
        is_read: false, created_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      Swal.fire({ title: "Dispatched!", text: `Message sent to ${order.customer_name}`, icon: "success", confirmButtonColor: "#D4AF37" });
      setPersonalMsg("");
    } catch (_err) { Swal.fire("Error", "Message could not be sent.", "error"); }
    finally { setLoading(false); }
  };

  /* ── Products ── */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const filePath = `product-uploads/${Date.now()}.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
      setForm((prev) => ({ ...prev, image: data.publicUrl }));
      toast("Image uploaded to vault");
    } catch (err) { Swal.fire("Upload Error", err.message, "error"); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.image)    return Swal.fire("Missing Asset", "Please upload a product image first.", "warning");
    if (!form.category) return Swal.fire("Category Required", "Please select a category.", "warning");
    setLoading(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), previous_price: form.previous_price ? parseFloat(form.previous_price) : null };
      if (editingId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingId);
        if (error) throw error;
        toast("Registry Updated");
      } else {
        const { error } = await supabase.from("products").insert([{ ...payload, id: crypto.randomUUID() }]);
        if (error) throw error;
        toast("Product Archived");
      }
      setForm(INITIAL_FORM); setEditingId(null); setActiveTab("inventory"); fetchProducts();
    } catch (err) { Swal.fire("Error", err.message, "error"); }
    finally { setLoading(false); }
  };

  const handleEdit   = (product) => { setForm(product); setEditingId(product.id); setActiveTab("add"); };

  const handleDelete = async (id) => {
    const r = await Swal.fire({ title: "Confirm Deletion", text: "This artifact will be purged from the archives.", icon: "warning", showCancelButton: true, confirmButtonColor: "#000", confirmButtonText: "DELETE" });
    if (r.isConfirmed) {
      console.log("[handleDelete] Attempting soft delete for product id:", id);
      try {
        const { data, error } = await supabase
          .from("products")
          .update({ is_active: false })
          .eq("id", id)
          .select();

        console.log("[handleDelete] Supabase response — data:", data, "| error:", error);

        if (error) {
          console.error("[handleDelete] Delete failed:", error.message, error.details, error.hint);
          Swal.fire("Error", error.message, "error");
          return;
        }

        if (!data || data.length === 0) {
          console.warn("[handleDelete] No rows updated — does this product id exist?", id);
          Swal.fire("Warning", "Product not found or already deleted.", "warning");
          return;
        }

        console.log("[handleDelete] Success — product marked inactive:", data);
        fetchProducts();
        toast("Deleted");
      } catch (err) {
        console.error("[handleDelete] Unexpected error:", err);
        Swal.fire("Error", err.message, "error");
      }
    }
  };

  const handleUpdateBroadcast = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase.from("profiles").select("id");
      if (error) throw error;
      const { error: ie } = await supabase.from("site_notifications").insert(
        profiles.map((p) => ({ user_id: p.id, title: "📢 Announcement", message: broadcastMsg, is_read: false }))
      );
      if (ie) throw ie;
      toast("Broadcast delivered"); setBroadcastMsg("");
    } catch (err) { Swal.fire("Error", err.message, "error"); }
    finally { setLoading(false); }
  };

  const goTab = (id) => {
    if (id === "add") { setEditingId(null); setForm(INITIAL_FORM); }
    setActiveTab(id);
  };

  /* ── Render ── */
  return (
    <div className="h-screen bg-[#F2EFE9] text-black font-sans flex overflow-hidden">

      {/* Sidebar — sticky on md+, drawer overlay on mobile */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onAddReset={() => { setEditingId(null); setForm(INITIAL_FORM); }}
        unreadInboxCount={unreadInboxCount}
      />

      {/* Main content — pb-28 leaves room for mobile bottom nav */}
      <main ref={mainRef} className="flex-1 p-5 md:p-8 lg:p-10 min-h-screen pb-28 md:pb-10 overflow-y-auto">

        {/* Mobile page header — just title, no hamburger (that's in bottom nav "More") */}
        <div className="md:hidden mb-6 pt-1">
          <p className="text-[8px] font-black uppercase tracking-[0.45em] text-[#C9A227] leading-none mb-1">Admin Console</p>
          <h1 className="text-[1.6rem] font-serif italic text-black leading-tight">
            {TAB_LABELS[activeTab] || activeTab}
          </h1>
        </div>

        {/* Tab panels */}
        {activeTab === "inventory"  && <AdminInventory products={products} onEdit={handleEdit} onDelete={handleDelete} />}
        {activeTab === "orders"     && <AdminOrders orders={orders} onViewOrder={(o) => { setSelectedOrder(o); setIsOrderModalOpen(true); }} onRefresh={fetchOrders} />}
        {activeTab === "inbox"      && <AdminInbox onReadUpdate={fetchUnreadCount} onLiveCountChange={setUnreadInboxCount} />}
        {activeTab === "categories" && <AdminCategories onCategoriesChange={fetchCategories} />}
        {activeTab === "add"        && (
          <AdminProductForm
            form={form} setForm={setForm} editingId={editingId}
            loading={loading} uploading={uploading}
            categories={categories}
            onSubmit={handleSubmit}
            onReset={() => { setForm(INITIAL_FORM); setEditingId(null); toast("Form Cleared"); }}
            onImageUpload={handleImageUpload}
          />
        )}
        {activeTab === "stats" && (
          <AdminAnalytics
            products={products} orders={orders}
            chartPeriod={chartPeriod} setChartPeriod={setChartPeriod}
            broadcastMsg={broadcastMsg} setBroadcastMsg={setBroadcastMsg}
            onUpdateBroadcast={handleUpdateBroadcast} loading={loading}
          />
        )}
      </main>

      {/* ── Mobile bottom navigation bar ── */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={goTab}
        unreadInboxCount={unreadInboxCount}
        onMenuOpen={() => setIsSidebarOpen(true)}
      />

      {/* Order detail modal */}
      {isOrderModalOpen && selectedOrder && (
        <AdminOrderModal
          order={selectedOrder} personalMsg={personalMsg}
          setPersonalMsg={setPersonalMsg} loading={loading}
          onClose={() => { setIsOrderModalOpen(false); setPersonalMsg(""); }}
          onStatusChange={toggleOrderStatus}
          onSendMessage={handleSendPersonalMessage}
        />
      )}
    </div>
  );
};

export default AdminDashboard;