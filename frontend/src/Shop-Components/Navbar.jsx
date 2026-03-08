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

  /* ── Terminate Account ─────────────────────────────────────── */
  const handleTerminateAccount = async () => {
    const { default: Swal } = await import("sweetalert2");
    const result = await Swal.fire({
      title: "Terminate Account?",
      html: `<p style="font-size:13px;color:#555;line-height:1.6">This will <strong>permanently delete</strong> your account, all orders, and personal data.<br><br>This action <strong>cannot be undone</strong>.</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete Everything",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#0A0A0A",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    // Second confirmation — type email
    const { value: typedEmail } = await Swal.fire({
      title: "Confirm your email",
      input: "email",
      inputPlaceholder: "Enter your email address",
      inputAttributes: { autocapitalize: "off" },
      showCancelButton: true,
      confirmButtonText: "Delete Account",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#0A0A0A",
      preConfirm: (val) => {
        if (val !== userEmail) {
          Swal.showValidationMessage("Email does not match your account");
          return false;
        }
        return val;
      },
    });
    if (!typedEmail) return;

    try {
      const { supabase } = await import("../Database-Server/Superbase-client.js");
      const { deleteAccountCascade } = await import("./DeleteAccountCascade.js");
      const uuid = sessionStorage.getItem("userUuid");

      if (!uuid) throw new Error("User ID not found. Please log in again.");

      const { success, error } = await deleteAccountCascade(supabase, uuid);
      if (!success) throw new Error(error || "Deletion failed.");

      sessionStorage.clear();
      localStorage.clear();
      await Swal.fire({
        title: "Account Deleted",
        text: "Your account and all associated data have been permanently removed.",
        icon: "success",
        confirmButtonColor: "#0A0A0A",
        customClass: { popup: "rounded-3xl", confirmButton: "rounded-xl font-black text-sm" },
      });
      window.location.href = "/";
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message || "Could not delete account. Please contact support.",
        icon: "error",
        confirmButtonColor: "#0A0A0A",
        customClass: { popup: "rounded-3xl", confirmButton: "rounded-xl font-black text-sm" },
      });
    }
  };

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
        className={`fixed top-0 left-0 w-full z-50 h-[60px] transition-all duration-500 ${
          scrolled
            ? "bg-white/95 backdrop-blur-2xl shadow-[0_1px_0_rgba(0,0,0,0.07)]"
            : "bg-black/30 backdrop-blur-xl border-b border-white/10"
        }`}
      >
        <div className="max-w-[1440px] mx-auto h-full px-5 md:px-10 lg:px-16 flex items-center">

          {/* Brand */}
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/20 shadow-sm group-hover:shadow-md transition-all">
              <img src={logo} alt="Janina" className="w-full h-full object-cover" />
            </div>
            <div className="leading-none">
              <p className={`text-[12px] font-black tracking-[0.28em] transition-colors group-hover:text-[#C9A227] ${scrolled ? "text-black" : "text-white"}`}>JANINA</p>
              <p className="text-[7px] tracking-[0.18em] text-[#C9A227] uppercase font-bold mt-0.5">Luxury Bags</p>
            </div>
          </button>

          {/* Desktop centre nav */}
          <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
            {NAV_LINKS.map(({ path, label }) => (
              <Link
                key={path} to={path}
                className={`relative text-[10px] font-black uppercase tracking-[0.2em] transition-colors group ${
                  isActive(path)
                    ? scrolled ? "text-black" : "text-white"
                    : scrolled ? "text-black/45 hover:text-black" : "text-white/55 hover:text-white"
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
                  : "bg-white/10 border-white/20 hover:bg-white/20 text-white/70"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">search</span>
              <span className={`text-[10px] font-bold tracking-wider min-w-[80px] ${scrolled ? "text-black/35" : "text-white/50"}`}>Search bags…</span>
              <span className={`text-[8px] font-black border rounded px-1.5 py-0.5 tracking-wider ${scrolled ? "text-black/20 border-black/10" : "text-white/30 border-white/20"}`}>⌘K</span>
            </button>

            {/* Search icon — mobile */}
            <button
              onClick={() => setSearchOpen(true)}
              className={`md:hidden flex items-center justify-center w-9 h-9 rounded-full border transition-all ${
                scrolled ? "bg-white/60 border-black/[0.07] hover:bg-white" : "bg-white/10 border-white/20 hover:bg-white/20"
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${scrolled ? "text-black/75" : "text-white"}`} style={{ fontVariationSettings: "'wght' 600" }}>search</span>
            </button>

            {/* Inbox — mobile */}
            {isLoggedIn && (
              <Link
                to="/inbox"
                className={`md:hidden relative flex items-center justify-center w-9 h-9 rounded-full border transition-all ${
                  scrolled ? "bg-white/60 border-black/[0.07] hover:bg-white" : "bg-white/10 border-white/20 hover:bg-white/20"
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${scrolled ? "text-black/75" : "text-white"}`} style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}>mail</span>
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
                className="md:hidden relative flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#C9A227] hover:bg-[#0A0A0A] transition-all duration-300 group"
              >
                <span className="material-symbols-outlined text-[15px] text-white" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>local_mall</span>
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-[16px] h-[16px] bg-white text-[#C9A227] text-[7px] font-black flex items-center justify-center rounded-full transition-all">
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
                  className="relative flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#C9A227] hover:bg-[#0A0A0A] transition-all duration-300 group"
                >
                  <span className="material-symbols-outlined text-[15px] text-white" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>local_mall</span>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-[17px] h-[17px] bg-white text-[#C9A227] text-[8px] font-black flex items-center justify-center rounded-full transition-all">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* User dropdown — hover */}
                <div className="relative">
                  <button className={`peer flex items-center gap-2 h-9 px-3 rounded-full border transition-all cursor-pointer ${
                    scrolled ? "border-black/[0.08] bg-white/60 hover:bg-white" : "border-white/20 bg-white/10 hover:bg-white/20"
                  }`}>
                    <div className="w-5 h-5 rounded-full bg-[#C9A227]/20 flex items-center justify-center shrink-0 ring-1 ring-[#C9A227]/40">
                      <span className="text-[9px] font-black text-[#C9A227]">{userName.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider max-w-[60px] truncate ${scrolled ? "text-black/60" : "text-white/80"}`}>{userName}</span>
                    <span className={`material-symbols-outlined text-[12px] ${scrolled ? "text-black/25" : "text-white/40"}`}>expand_more</span>
                  </button>

                  <div className="absolute right-0 top-full pt-2 w-52 z-50
                    opacity-0 pointer-events-none translate-y-1
                    peer-hover:opacity-100 peer-hover:pointer-events-auto peer-hover:translate-y-0
                    hover:opacity-100 hover:pointer-events-auto hover:translate-y-0
                    transition-all duration-200">
                    <div className="bg-white border border-black/[0.07] rounded-2xl shadow-2xl overflow-hidden">
                      {/* User info header */}
                      <div className="px-4 py-3 bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#C9A227]/20 flex items-center justify-center ring-1 ring-[#C9A227]/40 shrink-0">
                            <span className="text-[11px] font-black text-[#C9A227]">{userName.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white truncate">{userName}</p>
                            <p className="text-[8px] text-white/30 font-medium truncate">{userEmail}</p>
                          </div>
                        </div>
                      </div>

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

                      {/* Divider */}
                      <div className="border-t border-black/[0.08]" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-black/50 hover:text-black hover:bg-[#F7F5F0] transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[13px]">logout</span>
                        Sign Out
                      </button>

                      {/* Terminate Account — danger zone */}
                      <div className="border-t border-red-100">
                        <button
                          onClick={handleTerminateAccount}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[13px]">delete_forever</span>
                          Terminate Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className={`hidden md:flex items-center gap-2 h-9 px-5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  scrolled
                    ? "bg-[#C9A227] text-white hover:bg-[#0A0A0A]"
                    : "bg-white text-[#0A0A0A] hover:bg-[#C9A227] hover:text-white"
                }`}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ══ MOBILE BOTTOM TAB BAR — Glass on dark ═══════════════ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/85 backdrop-blur-2xl border-t border-white/[0.08]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch justify-around h-[58px] px-1">
          {MOBILE_TABS.map(({ path, icon, label }) => {
            const active = isActive(path);
            return (
              <Link
                key={path} to={path}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1 transition-all"
              >
                {active && (
                  <>
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-[#C9A227]" />
                    <span className="absolute inset-x-1 inset-y-0 rounded-2xl bg-white/[0.05]" />
                  </>
                )}
                <span
                  className={`material-symbols-outlined text-[20px] transition-colors ${active ? "text-[#C9A227]" : "text-white/35"}`}
                  style={{ fontVariationSettings: active ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 300" }}
                >{icon}</span>
                <span className={`text-[8px] uppercase tracking-wider font-bold leading-none transition-colors ${active ? "text-[#C9A227]" : "text-white/30"}`}>
                  {label}
                </span>
              </Link>
            );
          })}

          {isLoggedIn ? (
            /* Profile / logout tab on mobile */
            <div className="relative flex-1 group">
              <button className="flex flex-col items-center justify-center gap-0.5 w-full h-full cursor-pointer">
                <div className="w-5 h-5 rounded-full bg-[#C9A227]/20 flex items-center justify-center ring-1 ring-[#C9A227]/40">
                  <span className="text-[9px] font-black text-[#C9A227]">{userName.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-[8px] uppercase tracking-wider font-bold leading-none text-white/30">Me</span>
              </button>

              {/* Mobile profile popup (tap) */}
              <div className="absolute bottom-full right-0 mb-2 w-52
                opacity-0 pointer-events-none scale-95 origin-bottom-right
                group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-focus-within:scale-100
                transition-all duration-200">
                <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                  {/* User header */}
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white truncate">{userName}</p>
                    <p className="text-[8px] text-white/30 font-medium truncate mt-0.5">{userEmail}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors border-b border-white/[0.05]"
                  >
                    <span className="material-symbols-outlined text-[13px]">logout</span>
                    Sign Out
                  </button>
                  <button
                    onClick={handleTerminateAccount}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[13px]">delete_forever</span>
                    Terminate Account
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 transition-all ${isActive("/login") ? "text-[#C9A227]" : "text-white/30"}`}
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={closeSearch} />
          <div className="absolute top-0 left-0 right-0 z-10 bg-[#0A0A0A]/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
            <div className="max-w-2xl mx-auto px-5 pt-4 pb-4">
              <div className="flex items-center gap-3 bg-white/[0.07] rounded-2xl border border-white/10 px-4 py-3.5">
                <span className="material-symbols-outlined text-[18px] text-[#C9A227] shrink-0">search</span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for luxury bags…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[14px] font-semibold text-white placeholder:text-white/25"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}>
                    <span className="material-symbols-outlined text-[16px] text-white/30">close</span>
                  </button>
                )}
                <button
                  onClick={closeSearch}
                  className="text-[9px] font-black uppercase tracking-widest text-white/20 border border-white/[0.12] rounded-lg px-2 py-1 hover:text-white transition-colors ml-1"
                >
                  Esc
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 bg-[#111] rounded-2xl border border-white/[0.08] overflow-hidden shadow-xl max-h-[55vh] overflow-y-auto">
                  {searchResults.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => goProduct(p.id)}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 hover:bg-white/[0.05] transition-colors text-left ${
                        i < searchResults.length - 1 ? "border-b border-white/[0.05]" : ""
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/[0.08] shrink-0 bg-white/[0.05]">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black uppercase tracking-tight text-white truncate">{p.name}</p>
                        <p className="text-[10px] font-bold text-[#C9A227] mt-0.5 uppercase tracking-wide">{p.category}</p>
                      </div>
                      <span className="text-[14px] font-black text-white shrink-0">GH₵{p.price?.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.trim() && !searchResults.length && (
                <div className="mt-2 py-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-white/12 mb-2 block">search_off</span>
                  <p className="text-[11px] font-black uppercase tracking-widest text-white/25">No results found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}