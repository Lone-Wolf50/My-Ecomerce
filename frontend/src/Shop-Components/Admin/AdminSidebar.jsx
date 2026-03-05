import React from "react";
import {
  LayoutGrid, ShoppingBag, BarChart3, Mail, X,
  LogOut, Plus, Layers, ChevronRight,
} from "lucide-react";
import logo from "../../assets/profile.png";

const TABS = [
  { id: "inventory",  label: "Inventory",   sub: "All Products",      icon: LayoutGrid  },
  { id: "orders",     label: "Orders",       sub: "Client Requests",   icon: ShoppingBag },
  { id: "categories", label: "Collections",  sub: "Homepage Sections", icon: Layers      },
  { id: "stats",      label: "Analytics",    sub: "Performance",       icon: BarChart3   },
  { id: "inbox",      label: "Inbox",        sub: "Messages",          icon: Mail        },
];

const SidebarInner = ({ activeTab, go, closeSidebar, unreadInboxCount, showClose }) => (
  <div className="relative flex flex-col h-full bg-[#070707] overflow-hidden select-none">

    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9A227]/55 to-transparent" />
    <div className="absolute right-0 top-[15%] bottom-[15%] w-px bg-gradient-to-b from-transparent via-[#C9A227]/18 to-transparent" />
    <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-[#C9A227]/4 rounded-full blur-[80px]" />

    {/* Header */}
    <div className="relative px-6 py-5 flex items-center justify-between border-b border-white/[0.05]">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/[0.14] shadow-xl shadow-black/40">
            <img src={logo} alt="Janina" className="w-full h-full object-cover" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#070707] rounded-full" />
        </div>
        <div>
          <p className="text-[13px] font-black tracking-[0.2em] text-white leading-none">JANINA</p>
          <p className="text-[8px] tracking-[0.22em] text-[#C9A227] font-bold mt-0.5 uppercase">Admin Console</p>
        </div>
      </div>
      {showClose && (
        <button onClick={closeSidebar} className="w-8 h-8 flex items-center justify-center rounded-xl text-white/25 hover:text-white hover:bg-white/[0.07] transition-all cursor-pointer">
          <X size={16} />
        </button>
      )}
    </div>

    {/* Add product CTA */}
    <div className="px-5 pt-5 pb-2">
      <button
        onClick={() => go("add")}
        className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.97] cursor-pointer ${
          activeTab === "add"
            ? "bg-[#C9A227] text-black shadow-lg shadow-[#C9A227]/25"
            : "bg-[#C9A227]/12 text-[#C9A227] hover:bg-[#C9A227] hover:text-black border border-[#C9A227]/18 hover:shadow-lg hover:shadow-[#C9A227]/20"
        }`}
      >
        <Plus size={14} strokeWidth={3} />
        {activeTab === "add" ? "Adding Product…" : "Add New Product"}
      </button>
    </div>

    <div className="mx-5 my-3 h-px bg-white/[0.05]" />

    {/* Nav items — pointer-events-auto ensures clicks always register */}
    <nav className="flex-1 px-4 py-1 overflow-y-auto space-y-0.5 pointer-events-auto">
      {TABS.map(({ id, label, sub, icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => go(id)}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left transition-all duration-200 group cursor-pointer ${
              active
                ? "bg-white/[0.07] border border-white/[0.09]"
                : "hover:bg-white/[0.05] border border-transparent active:bg-white/[0.08]"
            }`}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {/* Icon pill */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 pointer-events-none ${
              active ? "bg-[#C9A227] shadow-md shadow-[#C9A227]/25" : "bg-white/[0.05] group-hover:bg-white/[0.1]"
            }`}>
              {React.createElement(icon, {
                size: 16,
                className: active ? "text-black" : "text-white/38 group-hover:text-white/70",
              })}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pointer-events-none">
              <p className={`text-[12px] font-black uppercase tracking-widest leading-none transition-colors ${
                active ? "text-white" : "text-white/75 group-hover:text-white"
              }`}>
                {label}
              </p>
              <p className={`text-[10px] font-bold tracking-wide mt-0.5 transition-colors ${
                active ? "text-white/60" : "text-white/45 group-hover:text-white/65"
              }`}>
                {sub}
              </p>
            </div>

            {/* Inbox badge */}
            {id === "inbox" && unreadInboxCount > 0 && (
              <span className={`shrink-0 pointer-events-none min-w-[18px] h-[18px] px-1 rounded-full text-[8px] font-black flex items-center justify-center ${
                active ? "bg-[#C9A227] text-black" : "bg-red-500 text-white animate-pulse"
              }`}>
                {unreadInboxCount > 9 ? "9+" : unreadInboxCount}
              </span>
            )}

            {active && <ChevronRight size={13} className="text-white/22 shrink-0 pointer-events-none" />}
          </button>
        );
      })}
    </nav>

    <div className="mx-5 my-3 h-px bg-white/[0.05]" />

    {/* Footer */}
    <div className="px-5 pb-6 space-y-3">
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/[0.15]">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">All Systems Online</span>
      </div>

      <button
        type="button"
        onClick={() => { sessionStorage.clear(); window.location.replace("/login"); }}
        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl border border-white/[0.07] text-[10px] font-black uppercase tracking-widest text-white/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/22 transition-all cursor-pointer"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <LogOut size={13} />
        Sign Out
      </button>
    </div>
  </div>
);

const AdminSidebar = ({
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  onAddReset,
  unreadInboxCount = 0,
}) => {
  const closeSidebar = () => setIsSidebarOpen?.(false);

  const go = (id) => {
    if (id === "add") onAddReset?.();
    setActiveTab(id);
    closeSidebar();
  };

  return (
    <>
      {/* Desktop sticky sidebar */}
      <aside className="hidden md:block w-[248px] shrink-0 h-screen sticky top-0 self-start overflow-hidden">
        <SidebarInner
          activeTab={activeTab}
          go={go}
          closeSidebar={closeSidebar}
          unreadInboxCount={unreadInboxCount}
          showClose={false}
        />
      </aside>

      {/* Mobile overlay drawer */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[150]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeSidebar}
            style={{ animation: "fadein 0.2s ease" }}
          />
          <aside
            className="absolute left-0 top-0 h-full w-[268px] shadow-2xl z-10 overflow-hidden"
            style={{ animation: "slideLeft 0.28s cubic-bezier(.22,1,.36,1)" }}
          >
            <SidebarInner
              activeTab={activeTab}
              go={go}
              closeSidebar={closeSidebar}
              unreadInboxCount={unreadInboxCount}
              showClose={true}
            />
          </aside>
        </div>
      )}

      <style>{`
        @keyframes fadein    { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideLeft { from { transform: translateX(-100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  );
};

export default AdminSidebar;