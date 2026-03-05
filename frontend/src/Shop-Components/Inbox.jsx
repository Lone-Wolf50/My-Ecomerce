import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../Database-Server/Superbase-client.js";
import Navbar from "./Navbar.jsx";
import Swal from "sweetalert2";

const swalOpts = {
  confirmButtonColor: "#D4AF37", background: "#FDFBF7", color: "#000",
  customClass: {
    popup: "!rounded-[2rem] !border !border-black/5",
    confirmButton: "!rounded-full !px-8 !py-3 !uppercase !text-[10px] !font-black !tracking-widest",
  },
};

const TYPE_STYLE = {
  order_update: { label: "Order Update",  bg: "bg-blue-50",    text: "text-blue-600",   dot: "bg-blue-400"    },
  message:      { label: "Message",       bg: "bg-violet-50",  text: "text-violet-600", dot: "bg-violet-400"  },
  promotion:    { label: "Promotion",     bg: "bg-amber-50",   text: "text-amber-600",  dot: "bg-amber-400"   },
  system:       { label: "System",        bg: "bg-gray-50",    text: "text-gray-500",   dot: "bg-gray-400"    },
};

function getStyle(type) {
  return TYPE_STYLE[type] || TYPE_STYLE.system;
}

export default function Inbox() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState("all"); // all | unread | read
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    const uuid = sessionStorage.getItem("userUuid");
    if (!uuid) { navigate("/login"); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("site_notifications")
        .select("*")
        .eq("user_id", uuid)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error("Inbox fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from("site_notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const markAllRead = async () => {
    const uuid = sessionStorage.getItem("userUuid");
    const { error } = await supabase
      .from("site_notifications")
      .update({ is_read: true })
      .eq("user_id", uuid)
      .eq("is_read", false);
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const deleteNotification = async (id) => {
    const { error } = await supabase
      .from("site_notifications")
      .delete()
      .eq("id", id);
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const clearAll = async () => {
    const { isConfirmed } = await Swal.fire({
      title: "Clear all notifications?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Clear All",
      ...swalOpts,
    });
    if (!isConfirmed) return;
    const uuid = sessionStorage.getItem("userUuid");
    const { error } = await supabase
      .from("site_notifications")
      .delete()
      .eq("user_id", uuid);
    if (!error) setNotifications([]);
  };

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read")   return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
      <div className="text-center space-y-3">
        <div className="w-9 h-9 border-[3px] border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37]">Loading Inbox…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-black select-none">
      <Navbar />

      <div className="max-w-2xl mx-auto pt-7 px-4 md:px-8 pb-32 md:pb-20">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/[0.07] pb-6 mb-8">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#D4AF37] mb-1.5">Communications</p>
            <h1 className="text-3xl md:text-4xl font-serif italic text-black/90 flex items-center gap-3">
              Inbox
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center bg-[#D4AF37] text-white text-[9px] font-black rounded-full px-2.5 py-1 tracking-widest">
                  {unreadCount} new
                </span>
              )}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="px-4 py-2 rounded-xl bg-black/[0.05] text-[9px] font-black uppercase tracking-widest text-black/50 hover:text-black hover:bg-black/[0.09] transition-all"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="px-4 py-2 rounded-xl bg-red-50 border border-red-100 text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-100 transition-all"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex bg-black/[0.04] p-1 rounded-2xl border border-black/[0.04] w-full mb-6">
          {[
            { id: "all",    label: "All",    count: notifications.length },
            { id: "unread", label: "Unread", count: unreadCount           },
            { id: "read",   label: "Read",   count: notifications.length - unreadCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${
                filter === tab.id ? "bg-white text-black shadow-md" : "text-black/30 hover:text-black/60"
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black ${
                filter === tab.id ? "bg-black text-white" : "bg-black/[0.06] text-black/30"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="py-24 text-center bg-white rounded-[2rem] border border-black/[0.04]">
              <span className="material-symbols-outlined text-4xl text-black/10 block mb-3">mail_outline</span>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-black/20">
                {filter === "unread" ? "No unread messages" : "Your inbox is empty"}
              </p>
            </div>
          ) : filtered.map((n) => {
            const style = getStyle(n.type);
            return (
              <div
                key={n.id}
                className={`bg-white rounded-[1.75rem] border transition-all duration-300 overflow-hidden ${
                  n.is_read ? "border-black/[0.05] opacity-70" : "border-[#D4AF37]/20 shadow-md shadow-black/[0.03]"
                }`}
              >
                {/* Unread indicator stripe */}
                {!n.is_read && (
                  <div className="h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                )}

                <div className="p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Type badge */}
                      <span className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-wider ${style.bg} ${style.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${!n.is_read ? "animate-pulse" : ""}`} />
                        {style.label}
                      </span>
                      <span className="text-[8px] font-bold text-black/25 uppercase tracking-wider whitespace-nowrap">
                        {new Date(n.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!n.is_read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="p-1.5 rounded-lg bg-black/[0.04] hover:bg-[#D4AF37]/10 transition-colors"
                          title="Mark as read"
                        >
                          <span className="material-symbols-outlined text-[14px] text-black/30 hover:text-[#D4AF37]">done</span>
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="p-1.5 rounded-lg bg-black/[0.04] hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[14px] text-black/30 hover:text-red-500">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className={`text-[13px] font-black uppercase tracking-tight mb-2 ${n.is_read ? "text-black/50" : "text-black"}`}>
                    {n.title}
                  </h3>

                  {/* Message */}
                  <p className="text-[11px] text-black/50 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}