import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useCart from "./useCart";
import { supabase } from "../Database-Server/Superbase-client.js";
import Footer from "./Footer.jsx";
import Swal from 'sweetalert2';
import { Toaster, toast } from 'react-hot-toast';

function Homepage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null); 
  const [userName, setUserName] = useState(""); 
  const [loading, setLoading] = useState(true);
  
  // --- NEW NOTIFICATION STATES ---
  const [notifications, setNotifications] = useState([]);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { cartCount } = useCart();
  const searchRef = useRef(null);
  const dropdownRef = useRef(null); 
  const navigate = useNavigate();

  const luxeAlert = (title, text, icon = 'error') => {
    Swal.fire({
      title: title.toUpperCase(),
      text: text,
      icon: icon,
      confirmButtonColor: "#D4AF37",
      background: "#FDFBF7",
      color: "#000",
      padding: '2rem',
      customClass: {
        popup: 'rounded-[2rem] border border-black/5 shadow-2xl',
        confirmButton: 'rounded-full px-10 py-3 uppercase text-[10px] font-black tracking-widest',
        title: 'font-serif italic tracking-tighter'
      }
    });
  };

  useEffect(() => {
    const checkUser = async () => {
      const { error } = await supabase.from('profiles').select('*').limit(1);
      if (error) {
        luxeAlert("Vault Error", "Could not synchronize with the archive.");
      }
    };
    checkUser();
  }, []);

const fetchNotifications = async (userId) => {
 if (!userId || userId.length < 30) {
    console.warn("Invalid UUID provided to fetchNotifications:", userId);
    return; 
  }
  const { data, error } = await supabase
    .from('site_notifications') 
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Fetch Error:", error.message);
    return;
  }

  if (data) {
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.is_read).length);
  }
};

const deleteNotification = async (id) => {
    const { error } = await supabase.from('site_notifications').delete().eq('id', id); 
    
    if (!error) {
      setNotifications(notifications.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast("Notification Deleted");
    } else {
      console.error("Delete Error:", error.message);
    }
};

const markAsRead = async (id) => {
    const { error } = await supabase
      .from('site_notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } else {
      console.error("Mark Read Error:", error.message);
    }
};

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        const storedEmail = sessionStorage.getItem('userEmail');
        
        if (storedEmail) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles') 
            .select('id, full_name')
            .eq('email', storedEmail)
            .maybeSingle();

          if (profileError) {
             console.error("Profile Error:", profileError.message);
          } else if (profile) {
            setUser({ email: storedEmail, id: profile.id });
            sessionStorage.setItem('userUuid', profile.id);
            setUserName(profile.full_name || "The Collector");
            fetchNotifications(profile.id);
          }
        }

        const { data: productData } = await supabase.from("products").select("*");
        setProducts(productData || []);
        
      } catch (error) {
        console.error("CRITICAL SCRIPT ERROR:", error.message);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
    
    const syncAuth = () => {
      if (!sessionStorage.getItem('userEmail')) {
        setUser(null);
        setUserName("");
        sessionStorage.removeItem('userUuid');
      }
    };

    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  const handleLogout = async () => {
    sessionStorage.clear(); 
    setUser(null);
    setUserName("");
    await supabase.auth.signOut();
    navigate('/'); 
  };

  /* Replace your handleDeleteAccount and the button in the JSX with this */

const handleDeleteAccount = async () => {
    setIsDropdownOpen(false); 
    Swal.fire({
      title: 'TERMINATE ACCOUNT?',
      text: "Permanent action. Your history will be erased from our system.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'DELETE PERMANENTLY',
      background: "#FDFBF7",
      customClass: { popup: 'rounded-[2rem]' }
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Attempt to delete profile from public table first
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);

        // Call your RPC function
        const { error: rpcError } = await supabase.rpc('delete_user');
        
        if (!profileError && !rpcError) {
          sessionStorage.clear();
          await supabase.auth.signOut();
          toast.success("Account Purged");
          navigate('/');
          window.location.reload();
        } else {
          console.error("Purge Error:", profileError || rpcError);
          luxeAlert("Vault Error", "Could not complete termination. Contact administrator.");
        }
      }
    });
  };

/* ... Inside your Mobile Menu JSX ... */

{user && (
  <div className="mt-auto pt-6 border-t border-black/10 flex flex-col gap-3">
    <button onPointerDown={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl active:bg-red-50 active:scale-[0.98] transition-all">
      <span className="material-symbols-outlined text-red-500">logout</span>
      <span className="text-red-500 font-black text-[10px] uppercase tracking-widest">LOGOUT</span>
    </button>
    
    {/* GLASS MORPH DELETE BUTTON */}
    <button 
      onClick={handleDeleteAccount} 
      className="w-full p-4 rounded-2xl bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all shadow-sm"
    >
      Terminate Account
    </button>
  </div>
)}
  const filteredProducts = products.filter((p) => {
    const name = p?.name?.toLowerCase() ?? "";
    const cat = p?.category?.toLowerCase() ?? "";
    const q = searchQuery.toLowerCase();
    return name.includes(q) || cat.includes(q);
  });

  const bagCategories = [
    { id: "crossbody", title: "Crossbody", image: "/Images/Crossbody2.jpg" },
    { id: "underarm", title: "Underarm", image: "/Images/underarms.jpg" },
    { id: "picnic", title: "Summer/Picnic", image: "/Images/summer.jpg" },
    { id: "limited", title: "Limited Edition", image: "/Images/purse2.jpg" },
  ];

const communityImages = [
    { id: 1, url: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=300&q=80" },
    { id: 2, url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=300&q=80" },
    { id: 3, url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=300&q=80" },
    { id: 4, url: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=300&q=80" },
    { id: 5, url: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=300&q=80" },
    { id: 6, url: "https://images.unsplash.com/photo-1590739225287-bd31519780c3?auto=format&fit=crop&w=300&q=80" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-[#D4AF37] font-black uppercase tracking-[0.5em] animate-pulse">LUXE...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-black overflow-x-hidden">
      <Toaster position="top-right" />
      
      {/* 1. NOTIFICATION / MAIL INBOX OVERLAY */}
      {isInboxOpen && (
        <div className="fixed inset-0 z-[110] flex items-start justify-end p-4 md:p-8">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsInboxOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-black/5 flex flex-col max-h-[80vh] animate-in slide-in-from-right-8 duration-500">
            <div className="p-8 border-b border-black/5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter"> Mail</h2>
                <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">Client Notifications</p>
              </div>
              <button onClick={() => setIsInboxOpen(false)} className="p-2 bg-black/5 rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.id} className={`p-6 rounded-3xl border transition-all ${n.is_read ? 'bg-white border-black/5 opacity-60' : 'bg-[#FDFBF7] border-[#D4AF37]/20 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-xs uppercase tracking-tight">{n.title}</h4>
                      {!n.is_read && <div className="size-2 bg-[#D4AF37] rounded-full animate-pulse"></div>}
                    </div>
                    <p className="text-sm text-black/60 mb-4 leading-relaxed">{n.message}</p>
                    <div className="flex gap-4">
                      {!n.is_read && (
                        <button onClick={() => markAsRead(n.id)} className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Mark Read</button>
                      )}
                      <button onClick={() => deleteNotification(n.id)} className="text-[10px] font-black uppercase tracking-widest text-red-500">Delete</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-black/20 italic">
                  <span className="material-symbols-outlined text-4xl mb-2">mail_outline</span>
                  <p>Your inbox is empty</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE SLIDER MENU */}
      <div className={`fixed inset-0 z-[100] transition-all duration-300 ${isMenuOpen ? "visible" : "invisible"}`}>
        <div className={`absolute inset-0 bg-black/10 backdrop-blur-md transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setIsMenuOpen(false)}></div>
        <div className={`absolute top-0 right-0 h-full w-[85%] max-w-xs bg-white/70 backdrop-blur-2xl border-l border-white/20 shadow-2xl transition-transform duration-500 p-8 flex flex-col ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <button className="self-end mb-8 p-2 bg-black/5 rounded-full" onClick={() => setIsMenuOpen(false)}>
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
          <div className="mb-10 pb-6 border-b border-black/5">
            <p className="text-[10px] uppercase font-black text-[#D4AF37] tracking-widest mb-1">{user ? "Authenticated Member" : "Guest Mode"}</p>
            <h2 className="text-2xl font-black italic tracking-tighter text-black">{userName || "The Guest"}</h2>
          </div>
          <nav className="flex flex-col gap-2 flex-1">
          
            
            {/* MOBILE: Visible before and after login */}
            <button 
              onClick={() => { setIsInboxOpen(true); setIsMenuOpen(false); }}
              className="flex items-center justify-between text-xs font-black uppercase tracking-widest p-4 rounded-2xl hover:bg-black/5 transition-all"
            >
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined">mail</span> Inbox
              </div>
              {unreadCount > 0 && <span className="bg-[#D4AF37] text-white size-5 rounded-full flex items-center justify-center text-[9px]">{unreadCount}</span>}
            </button>

            <Link className="flex items-center gap-4 text-xs font-black uppercase tracking-widest p-4 rounded-2xl hover:bg-black/5 transition-all" to="/shop/underarm" onClick={() => setIsMenuOpen(false)}>
              <span className="material-symbols-outlined">grid_view</span> Collection
            </Link>

            <Link className="flex items-center gap-4 text-xs font-black uppercase tracking-widest p-4 rounded-2xl hover:bg-black/5 transition-all" to="/cart" onClick={() => setIsMenuOpen(false)}>
              <span className="material-symbols-outlined">shopping_bag</span> Bag ({cartCount})
            </Link>

           
            {user && (
              <Link className="flex items-center gap-4 text-xs font-black uppercase tracking-widest p-4 rounded-2xl hover:bg-black/5 transition-all" to="/orders" onClick={() => setIsMenuOpen(false)}>
                <span className="material-symbols-outlined">package_2</span> My Orders
              </Link>
            )}
             <Link className="flex items-center gap-4 text-xs font-black uppercase tracking-widest p-4 rounded-2xl hover:bg-black/5 transition-all" to="/reviews" onClick={() => setIsMenuOpen(false)}>
              <span className="material-symbols-outlined">reviews</span> Reviews
            </Link>

          </nav>

          {/* Sign In at Bottom for Guests, Logout for Users */}
          <div className="mt-auto pt-6 border-t border-black/10">
            {user ? (
              <>
                <button onPointerDown={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl active:bg-red-50 active:scale-[0.98] transition-all">
                  <span className="material-symbols-outlined text-red-500">logout</span>
                  <span className="text-red-500 font-black text-[10px] uppercase tracking-widest">LOGOUT</span>
                </button>
                <button 
      onClick={handleDeleteAccount} 
      className="w-full p-4 rounded-2xl bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all shadow-sm"
    >
      Terminate Account
    </button></>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full flex items-center gap-4 p-4 bg-[#D4AF37] rounded-2xl text-white">
                <span className="material-symbols-outlined">login</span>
                <span className="font-black text-[10px] uppercase tracking-widest">Sign In to Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* HEADER: PC AND TABS DISPLAY ALL */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-8 py-6">
          <h1 className="text-2xl font-black tracking-widest cursor-pointer" onClick={() => navigate('/')}>LUXE</h1>
          
          {/* Always display on md and up */}
          <nav className="hidden md:flex items-center gap-10">
            <Link className="text-[10px] font-bold uppercase tracking-[0.3em] hover:text-[#D4AF37] transition-colors" to="/">Home</Link>
            <Link className="text-[10px] font-bold uppercase tracking-[0.3em] hover:text-[#D4AF37] transition-colors" to="/shop/underarm">Shop</Link>
            <Link className="text-[10px] font-bold uppercase tracking-[0.3em] hover:text-[#D4AF37] transition-colors" to="/reviews">Reviews</Link>
            
            <button onClick={() => setIsInboxOpen(true)} className="relative text-[10px] font-bold uppercase tracking-[0.3em] hover:text-[#D4AF37] transition-colors flex items-center gap-2">
              Inbox {unreadCount > 0 && <span className="size-2 bg-[#D4AF37] rounded-full"></span>}
            </button>

            {user ? (
              <div className="relative flex items-center gap-6" ref={dropdownRef}>
                <Link className="text-[10px] font-bold uppercase tracking-[0.3em] hover:text-[#D4AF37] transition-colors" to="/orders">Orders</Link>
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 group border-l border-black/10 pl-6">
                  <span className="text-[10px] font-black text-[#D4AF37] uppercase italic tracking-widest">{userName ? userName.split(' ')[0] : "Collector"}</span>
                  <span className={`material-symbols-outlined text-sm transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-4 w-48 bg-white/90 backdrop-blur-xl border border-black/5 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase hover:bg-black/5 transition-colors">
                      <span className="material-symbols-outlined text-sm">logout</span> Logout
                    </button>
                    <button onClick={handleDeleteAccount} className="w-full flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase hover:bg-red-50 text-red-500 border-t border-black/5">
                      <span className="material-symbols-outlined text-sm">delete_forever</span> Delete
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] border border-[#D4AF37]/20 px-6 py-2 rounded-full hover:bg-[#D4AF37] hover:text-white transition-all" to="/login">Sign In</Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative p-2">
              <span className="material-symbols-outlined text-2xl">shopping_bag</span>
              {cartCount > 0 && <span className="absolute top-0 right-0 bg-[#D4AF37] text-white text-[9px] font-black size-4 flex items-center justify-center rounded-full">{cartCount}</span>}
            </Link>
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(true)}>
              <span className="material-symbols-outlined text-3xl">menu</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-8 pt-32">
        <section className="mt-8 mb-12 flex justify-center relative z-[40]" ref={searchRef}>
          <div className="relative w-full max-w-2xl group">
            <input
              type="text"
              placeholder="Search masterpieces..."
              className="w-full bg-white/40 border border-black/10 rounded-2xl py-5 px-8 focus:border-[#D4AF37]/50 outline-none shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-black/5 rounded-2xl overflow-hidden shadow-2xl z-[60] max-h-60 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(p => (
                    <Link key={p.id} to={`/product/${p.id}`} className="flex items-center gap-4 p-4 hover:bg-[#FDFBF7] border-b border-black/5">
                        <img src={p.image} className="size-10 rounded object-cover" alt="" />
                        <span className="text-xs font-black uppercase">{p.name}</span>
                    </Link>
                    ))
                ) : (
                    <div className="p-4 text-center text-[10px] uppercase font-bold text-black/40">No pieces found</div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-8">
             <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
              {user ? "Welcome back," : "Luxury defined,"} <br/> 
              <span className="text-[#D4AF37] italic font-serif lowercase">
                {(userName && userName !== "The Collector") ? userName.split(' ')[0] : "the collection"}
              </span>
            </h1>
              <p className="text-lg text-black/60 max-w-md">
                {user 
                  ? "Your personal luxury atelier is curated and ready." 
                  : "Explore the most exclusive handcrafted pieces from our latest collection."}
              </p>
              <Link to="/shop/underarm" className="bg-[#D4AF37] text-white w-fit px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
                Explore Collection
              </Link>
            </div>

            <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div 
                className="w-full h-full bg-cover bg-center transition-transform duration-1000 hover:scale-110" 
                style={{ backgroundImage: `url("/Images/summer3.jpg")` }}
              ></div>
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-black/5">
          <h2 className="text-4xl font-black uppercase mb-12 text-black tracking-tighter">Featured Collections</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {bagCategories.map((cat) => (
              <Link key={cat.id} to={`/shop/${cat.id}`} className="group">
                <div className="aspect-[3/4] rounded-[2rem] overflow-hidden bg-white/40 border border-black/5 p-2 mb-4 shadow-lg">
                  <div className="w-full h-full rounded-[1.5rem] bg-cover bg-center group-hover:scale-105 transition-all duration-700" style={{ backgroundImage: `url(${cat.image})` }}></div>
                </div>
                <div className="text-center">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-black">{cat.title}</h3>
                  <p className="text-[9px] text-[#D4AF37] font-bold uppercase mt-1">View Gallery</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="py-20 border-t border-black/5">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center mb-12 text-black">The Community</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {communityImages.map((img) => (
              <div key={img.id} className="aspect-square rounded-2xl overflow-hidden border border-black/5 grayscale hover:grayscale-0 transition-all shadow-sm">
                <div className="w-full h-full bg-cover bg-center bg-gray-200" style={{ backgroundImage: `url(${img.url})` }}></div>
              </div>
            ))}
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}

export default Homepage;