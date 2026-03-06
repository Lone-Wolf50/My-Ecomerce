import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useCart from "./useCart";
import logo from "../assets/profile.png";

export default function Navbar() {
  const { cartCount }   = useCart();
  const navigate        = useNavigate();
  const { pathname }    = useLocation();

  const [searchOpen, setSearchOpen]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");
  const [allProducts, setAllProducts]     = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [scrolled, setScrolled]           = useState(false);
  const [unreadCount, setUnreadCount]     = useState(0);
  const inputRef = useRef(null);

  const isLoggedIn = !!sessionStorage.getItem("userEmail");
  const userEmail  = sessionStorage.getItem("userEmail");
  const rawName    = sessionStorage.getItem("tempUserName")
                   || userEmail?.split("@")[0] || "";
  const userName   = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !userEmail) return;
    const fetchUnread = async () => {
      const { supabase } = await import("../Database-Server/Superbase-client.js");
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_email", userEmail)
        .eq("is_read", false);
      setUnreadCount(count || 0);
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 30_000);
    return () => clearInterval(id);
  }, [isLoggedIn, userEmail]);

  useEffect(() => {
    if (!searchOpen || allProducts.length) return;
    import("../Database-Server/Superbase-client.js").then(({ supabase }) => {
      supabase.from("products").select("id,name,price,image,category")
        .then(({ data }) => { if (data) setAllProducts(data); });
    });
  }, [searchOpen, allProducts.length]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    setSearchResults(
      allProducts.filter(p =>
        p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
      ).slice(0, 7)
    );
  }, [searchQuery, allProducts]);

  useEffect(() => { if (searchOpen) inputRef.current?.focus(); }, [searchOpen]);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") closeSearch(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  useEffect(() => {
    const fn = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  const closeSearch  = () => { setSearchOpen(false); setSearchQuery(""); };
  const goProduct    = (id) => { closeSearch(); navigate(`/product/${id}`); };
  const handleLogout = () => { sessionStorage.clear(); window.location.href = "/"; };
  const isActive     = (p) => pathname === p;

  const NAV_LINKS = [
    { path: "/",        label: "Home"    },
    ...(isLoggedIn ? [{ path: "/orders", label: "Orders" }] : []),
    { path: "/reviews", label: "Reviews" },
    { path: "/support", label: "Support" },
    ...(isLoggedIn ? [{ path: "/inbox",  label: "Inbox"  }] : []),
  ];

  const MOBILE_TABS = [
    { path: "/",        icon: "home",         label: "Home"    },
    ...(isLoggedIn ? [{ path: "/orders", icon: "inventory_2", label: "Orders" }] : []),
    { path: "/reviews", icon: "star",         label: "Reviews" },
    { path: "/support", icon: "chat_bubble",  label: "Support" },
  ];

  return (
    <>
      {/* ══ TOP BAR ══════════════════════════════════════════════ */}
      <header
        className={`fixed top-0 left-0 w-full z-50 h-[60px] transition-all duration-300 ${
          scrolled
            ? "bg-white/97 backdrop-blur-2xl shadow-[0_1px_0_rgba(0,0,0,0.07)]"
            : "bg-[#F7F5F0]/80 backdrop-blur-xl"
        }`}
      >
        <div className="max-w-[1440px] mx-auto h-full px-5 md:px-10 lg:px-16 flex items-center">

          {/* Brand */}
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-black/[0.08] shadow-sm group-hover:shadow-md transition-all">
              <img src={logo} alt="Janina" className="w-full h-full object-cover" />
            </div>
            <div className="leading-none">
              <p className="text-[12px] font-black tracking-[0.28em] text-black group-hover:text-[#C9A227] transition-colors">JANINA</p>
              <p className="text-[7px] tracking-[0.18em] text-[#C9A227] uppercase font-bold mt-0.5">Luxury Bags</p>
            </div>
          </button>

          {/* Desktop centre nav */}
          <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
            {NAV_LINKS.map(({ path, label }) => (
              <Link
                key={path} to={path}
                className={`relative text-[10px] font-black uppercase tracking-[0.2em] transition-colors group ${
                  isActive(path) ? "text-black" : "text-black/45 hover:text-black"
                }`}
              >
                {label}
                <span className={`absolute -bottom-0.5 left-0 h-px bg-[#C9A227] transition-all duration-300 ${
                  isActive(path) ? "w-full" : "w-0 group-hover:w-full"
                }`} />
              </Link>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-3 ml-auto">

            {/* Search pill — desktop */}
            <button
              onClick={() => setSearchOpen(true)}
              className={`hidden md:flex items-center gap-2.5 h-9 px-4 rounded-full border transition-all duration-200 ${
                scrolled
                  ? "bg-[#F7F5F0] border-black/[0.09] hover:border-[#C9A227]/50 text-black/50"
                  : "bg-white/60 border-black/[0.07] hover:bg-white/90 text-black/40"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">search</span>
              <span className="text-[10px] font-bold text-black/35 tracking-wider min-w-[80px]">Search bags…</span>
              <span className="text-[8px] font-black text-black/20 border border-black/10 rounded px-1.5 py-0.5 tracking-wider">⌘K</span>
            </button>

            {/* Search icon — mobile */}
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-white/60 border border-black/[0.07] transition-all hover:bg-white"
            >
              <span className="material-symbols-outlined text-[20px] text-black/75" style={{ fontVariationSettings: "'wght' 600" }}>search</span>
            </button>

            {/* Inbox — mobile */}
            {isLoggedIn && (
              <Link
                to="/inbox"
                className="md:hidden relative flex items-center justify-center w-9 h-9 rounded-full bg-white/60 border border-black/[0.07] transition-all hover:bg-white"
              >
                <span className="material-symbols-outlined text-[20px] text-black/75" style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}>mail</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[7px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart pill — mobile */}
            {isLoggedIn && (
              <Link
                to="/cart"
                className="md:hidden relative flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#0A0A0A] hover:bg-[#C9A227] transition-all duration-300 group"
              >
                <span className="material-symbols-outlined text-[15px] text-white" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>local_mall</span>
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-[16px] h-[16px] bg-[#C9A227] group-hover:bg-white text-white group-hover:text-black text-[7px] font-black flex items-center justify-center rounded-full transition-all">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Desktop: Cart + User dropdown */}
            {isLoggedIn ? (
              <div className="hidden md:flex items-center gap-2">
                {/* Cart */}
                <Link
                  to="/cart"
                  className="relative flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#0A0A0A] hover:bg-[#C9A227] transition-all duration-300 group"
                >
                  <span className="material-symbols-outlined text-[15px] text-white" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>local_mall</span>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-[17px] h-[17px] bg-[#C9A227] group-hover:bg-white text-white group-hover:text-black text-[8px] font-black flex items-center justify-center rounded-full transition-all">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* User dropdown — hover */}
                <div className="relative">
                  <button className="peer flex items-center gap-2 h-9 px-3 rounded-full border border-black/[0.08] bg-white/60 hover:bg-white transition-all cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-[#C9A227]/15 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-black text-[#C9A227]">{userName.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-black/60 max-w-[60px] truncate">{userName}</span>
                    <span className="material-symbols-outlined text-[12px] text-black/25">expand_more</span>
                  </button>

                  <div className="absolute right-0 top-full pt-2 w-44 z-50
                    opacity-0 pointer-events-none translate-y-1
                    peer-hover:opacity-100 peer-hover:pointer-events-auto peer-hover:translate-y-0
                    hover:opacity-100 hover:pointer-events-auto hover:translate-y-0
                    transition-all duration-200">
                    <div className="bg-white border border-black/[0.07] rounded-2xl shadow-xl overflow-hidden">
                      {[
                        { to: "/orders",  icon: "inventory_2", label: "My Orders" },
                        { to: "/reviews", icon: "star",        label: "Reviews"   },
                        { to: "/inbox",   icon: "mail",        label: "Inbox", badge: unreadCount },
                        { to: "/support", icon: "chat_bubble", label: "Support"   },
                      ].map(({ to, icon, label, badge }, i, arr) => (
                        <Link
                          key={to} to={to}
                          className={`flex items-center gap-2.5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-black/55 hover:text-black hover:bg-[#F7F5F0] transition-colors ${i < arr.length - 1 ? "border-b border-black/[0.05]" : ""}`}
                        >
                          <span className="material-symbols-outlined text-[13px]">{icon}</span>
                          <span className="flex-1">{label}</span>
                          {badge > 0 && (
                            <span className="min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[7px] font-black flex items-center justify-center rounded-full">
                              {badge > 9 ? "9+" : badge}
                            </span>
                          )}
                        </Link>
                      ))}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors border-t border-black/[0.05] cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[13px]">logout</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-2 h-9 px-5 rounded-full bg-[#C9A227] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#0A0A0A] transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ══ MOBILE BOTTOM TAB BAR ════════════════════════════════ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/97 backdrop-blur-2xl border-t border-black/[0.06]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch justify-around h-[54px] px-1">
          {MOBILE_TABS.map(({ path, icon, label }) => {
            const active = isActive(path);
            return (
              <Link
                key={path} to={path}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1 transition-all"
              >
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[#C9A227]" />}
                <span
                  className={`material-symbols-outlined text-[20px] transition-colors ${active ? "text-black" : "text-black/28"}`}
                  style={{ fontVariationSettings: active ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 300" }}
                >{icon}</span>
                <span className={`text-[8px] uppercase tracking-wider font-bold leading-none transition-colors ${active ? "text-black" : "text-black/28"}`}>
                  {label}
                </span>
              </Link>
            );
          })}

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-red-400/60" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>logout</span>
              <span className="text-[8px] uppercase tracking-wider font-bold leading-none text-red-400/60">Out</span>
            </button>
          ) : (
            <Link
              to="/login"
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 transition-all ${isActive("/login") ? "text-[#C9A227]" : "text-black/28"}`}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive("/login") ? "'FILL' 1" : "'FILL' 0, 'wght' 300" }}>login</span>
              <span className="text-[8px] uppercase tracking-wider font-bold leading-none">Sign In</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-[60px]" />

      {/* ══ SEARCH OVERLAY ═══════════════════════════════════════ */}
      {searchOpen && (
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={closeSearch} />
          <div className="absolute top-0 left-0 right-0 z-10 bg-white shadow-2xl border-b border-black/[0.06]">
            <div className="max-w-2xl mx-auto px-5 pt-4 pb-4">
              <div className="flex items-center gap-3 bg-[#F7F5F0] rounded-2xl border border-black/[0.07] px-4 py-3.5">
                <span className="material-symbols-outlined text-[18px] text-[#C9A227] shrink-0">search</span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for luxury bags…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[14px] font-semibold text-black placeholder:text-black/25"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}>
                    <span className="material-symbols-outlined text-[16px] text-black/30">close</span>
                  </button>
                )}
                <button
                  onClick={closeSearch}
                  className="text-[9px] font-black uppercase tracking-widest text-black/20 border border-black/[0.08] rounded-lg px-2 py-1 hover:text-black transition-colors ml-1"
                >
                  Esc
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 bg-white rounded-2xl border border-black/[0.06] overflow-hidden shadow-xl max-h-[55vh] overflow-y-auto">
                  {searchResults.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => goProduct(p.id)}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 hover:bg-[#F7F5F0] transition-colors text-left ${
                        i < searchResults.length - 1 ? "border-b border-black/[0.04]" : ""
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-black/[0.05] shrink-0 bg-[#F0EDE7]">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black uppercase tracking-tight text-black truncate">{p.name}</p>
                        <p className="text-[10px] font-bold text-[#C9A227] mt-0.5 uppercase tracking-wide">{p.category}</p>
                      </div>
                      <span className="text-[14px] font-black text-black shrink-0">GH₵{p.price?.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.trim() && !searchResults.length && (
                <div className="mt-2 py-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-black/12 mb-2 block">search_off</span>
                  <p className="text-[11px] font-black uppercase tracking-widest text-black/25">No results found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}