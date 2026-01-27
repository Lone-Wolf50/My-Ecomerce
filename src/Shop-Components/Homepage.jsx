import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useCart from "./useCart";
import { supabase } from "../Database-Server/Superbase-client.js";
import Footer from "./Footer.jsx";

function Homepage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [userName, setUserName] = useState(""); 
  const [loading, setLoading] = useState(true);
  const { cartCount } = useCart();
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        // 1. Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check metadata first, then fall back to profiles table
          const nameFromMeta = user.user_metadata?.full_name || user.user_metadata?.fullName;
          
          if (nameFromMeta) {
            setUserName(nameFromMeta);
          } else {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .single();
            if (profile) setUserName(profile.full_name);
          }
        }

        // 2. Load Products
        const { data, error } = await supabase.from("products").select("*");
        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error("Initialization Error:", error.message);
      } finally {
        setLoading(false);
      }
    };
    initializePage();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/'); 
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Lone Wolf, this will permanently remove your Luxe account. Proceed?");
    if (confirmDelete) {
      const { error } = await supabase.rpc('delete_user');
      if (!error) {
        await supabase.auth.signOut();
        navigate('/');
      } else {
        alert(error.message);
      }
    }
  };

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
    { id: 0, url: "/Images/community1.jpg" },
    { id: 1, url: "/Images/community2.jpg" },
    { id: 2, url: "/Images/community3.jpg" },
    { id: 3, url: "/Images/community4.jpg" },
    { id: 4, url: "/Images/community5.jpg" },
    { id: 5, url: "/Images/community6.jpg" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-primary font-black uppercase tracking-[0.5em] animate-pulse">LUXE...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-black-solid overflow-x-hidden">
      
      {/* MOBILE SLIDER MENU */}
      <div className={`fixed inset-0 z-[100] transition-all duration-300 ${isMenuOpen ? "visible" : "invisible"}`}>
        <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setIsMenuOpen(false)}></div>
        <div className={`absolute top-0 right-0 h-full w-[85%] max-w-xs bg-white shadow-2xl transition-transform duration-500 p-8 flex flex-col ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          
          <button className="self-end mb-8 p-2" onClick={() => setIsMenuOpen(false)}>
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>

          {/* User Section in Menu */}
          <div className="mb-10 pb-6 border-b border-black/5">
            <p className="text-[10px] uppercase font-black text-primary tracking-widest mb-1">Authenticated Member</p>
            <h2 className="text-2xl font-black italic tracking-tighter text-black-solid">
              {userName || "The Collector"}
            </h2>
          </div>

          <nav className="flex flex-col gap-6 flex-1">
            <Link className="text-sm font-black uppercase tracking-widest py-2" to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link className="text-sm font-black uppercase tracking-widest py-2" to="/shop/underarm" onClick={() => setIsMenuOpen(false)}>The Collection</Link>
            <Link className="text-sm font-black uppercase tracking-widest py-2" to="/cart" onClick={() => setIsMenuOpen(false)}>Your Bag ({cartCount})</Link>
          </nav>

          {/* ACCESSIBLE BOTTOM SECTION (Larger Hit Areas) */}
          <div className="mt-auto pt-6 border-t border-black/10">
            <button 
                onClick={handleLogout} 
                className="w-full flex items-center gap-4 p-4 -ml-4 rounded-2xl active:bg-red-50 transition-colors group"
            >
              <span className="material-symbols-outlined text-red-500 group-active:scale-90 transition-transform">logout</span>
              <span className="text-red-500 font-black text-xs uppercase tracking-widest">Sign Out</span>
            </button>
            
            <div className="mt-2">
                <button 
                    onClick={handleDeleteAccount} 
                    className="p-4 -ml-4 text-[9px] text-black/30 font-bold uppercase underline tracking-tighter block w-full text-left"
                >
                    Terminate Account
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-50 bg-cream/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-8 py-6">
          <h1 className="text-2xl font-black tracking-widest">LUXE</h1>
          
          <nav className="hidden md:flex items-center gap-12">
            <Link className="text-[11px] font-bold uppercase tracking-[0.3em] hover:text-primary transition-colors" to="/">Home</Link>
            <Link className="text-[11px] font-bold uppercase tracking-[0.3em] hover:text-primary transition-colors" to="/shop/underarm">Shop</Link>
            <div className="h-4 w-[1px] bg-black/10 mx-2"></div>
            <span className="text-[10px] font-black text-primary uppercase italic tracking-widest">{userName || "Guest"}</span>
            <button onClick={handleLogout} className="material-symbols-outlined text-xl hover:text-red-500 transition-colors">logout</button>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative p-2">
              <span className="material-symbols-outlined text-2xl">shopping_bag</span>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-white text-[9px] font-black size-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(true)}>
              <span className="material-symbols-outlined text-3xl">menu</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-8 pt-32">
        {/* SEARCH */}
        <section className="mt-8 mb-12 flex justify-center relative z-[40]" ref={searchRef}>
          <div className="relative w-full max-w-2xl group">
            <input
              type="text"
              placeholder="Search masterpieces..."
              className="w-full bg-white/40 border border-black/10 rounded-2xl py-5 px-8 focus:border-primary/50 outline-none shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-black/5 rounded-2xl overflow-hidden shadow-2xl z-[60] max-h-60 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(p => (
                    <Link key={p.id} to={`/product/${p.id}`} className="flex items-center gap-4 p-4 hover:bg-cream border-b border-black/5">
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

        {/* HERO */}
        <section className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-8 order-1 lg:order-1">
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-black-solid leading-none">
                Welcome back, <br/> 
                <span className="text-primary italic font-serif lowercase">
                  {userName.split(' ')[0] || "Collector"}
                </span>
              </h1>
              <p className="text-lg text-black/60 max-w-md">
                Your personal luxury atelier is curated and ready.
              </p>
              <Link to="/shop/underarm" className="bg-primary text-white w-fit px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
                Explore Collection
              </Link>
            </div>

            <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl order-2 lg:order-2">
              <div 
                className="w-full h-full bg-cover bg-center" 
                style={{ backgroundImage: `url("/Images/summer3.jpg")` }}
              ></div>
            </div>
          </div>
        </section>

        {/* FEATURED COLLECTIONS */}
        <section className="py-20 border-t border-black/5">
          <h2 className="text-4xl font-black uppercase mb-12 text-black-solid tracking-tighter">Featured Collections</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {bagCategories.map((cat) => (
              <Link key={cat.id} to={`/shop/${cat.id}`} className="group">
                <div className="aspect-[3/4] rounded-[2rem] overflow-hidden bg-white/40 border border-black/5 p-2 mb-4 shadow-lg shadow-black/5">
                  <div className="w-full h-full rounded-[1.5rem] bg-cover bg-center group-hover:scale-105 transition-all duration-700" style={{ backgroundImage: `url(${cat.image})` }}></div>
                </div>
                <div className="text-center">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-black-solid">{cat.title}</h3>
                  <p className="text-[9px] text-primary font-bold uppercase mt-1">View Gallery</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* COMMUNITY */}
        <section className="py-20 border-t border-black/5">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center mb-12 text-black-solid">The Community</h3>
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