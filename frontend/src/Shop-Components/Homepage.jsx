import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useCart from "./useCart";
import { supabase } from "../Database-Server/Superbase-client.js";
import Footer from "./Footer.jsx";
import Swal from 'sweetalert2';

function Homepage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null); 
  const [userName, setUserName] = useState(""); 
  const [loading, setLoading] = useState(true);
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
      customClass: {
        popup: 'rounded-[2rem] border border-black/5',
        confirmButton: 'rounded-full px-10 py-3 uppercase text-[10px] font-black tracking-widest'
      }
    });
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
        // CHANGED: Query the 'profiles' table instead of 'registry'
        const { data: profile, error: profileError } = await supabase
          .from('profiles') 
          .select('id, full_name') // Using 'full_name' to match your schema image
          .eq('email', storedEmail)
          .maybeSingle();

        if (profileError) {
          console.error("DATABASE ERROR:", profileError.message);
        } else if (profile) {
          console.log("DATABASE SUCCESS: Profile found:", profile);
          
          setUser({ email: storedEmail, id: profile.id });
          sessionStorage.setItem('userUuid', profile.id);

          // Use full_name from your profiles table, fallback to "The Collector"
          const actualName = profile.full_name || "The Collector";
          setUserName(actualName); 
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

  initializePage();    const syncAuth = () => {
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
  // --- END OF FIXED LOGIC ---

  const handleDeleteAccount = async () => {
    setIsDropdownOpen(false); 
    Swal.fire({
      title: 'TERMINATE ACCOUNT?',
      text: " This action is permanent. Your membership and history will be erased from the atelier.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#000',
      confirmButtonText: 'DELETE PERMANENTLY',
      cancelButtonText: 'CANCEL',
      background: "#FDFBF7",
      customClass: {
        popup: 'rounded-[2rem]',
        confirmButton: 'rounded-full px-6 py-3 text-[10px] font-black',
        cancelButton: 'rounded-full px-6 py-3 text-[10px] font-black'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        const { error } = await supabase.rpc('delete_user');
        
        if (!error) {
          window.sessionStorage.clear();
          await supabase.auth.signOut();
          
          Swal.fire({
            title: 'ACCOUNT DELETED',
            text: 'Your data has been scrubbed from our servers.',
            icon: 'success',
            confirmButtonColor: "#D4AF37",
            background: "#FDFBF7"
          }).then(() => {
            navigate('/');
            window.location.reload();
          });
        } else {
          luxeAlert("Termination Failed", error.message);
          setLoading(false);
        }
      }
    });
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
    { id: 0, url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCaO_LALs2EBDmGdlSVgY5zgAkBgK-_UdMJCsbL4rRDxcNo6b2-x-JpTyIzx9fxGhwLYik_Hlc9-3ev3lpKNfcbVtkp8rce1Xuk3lrDNpHH1oIgSx7daCpPKVC5Y_YvtzLhn6FfFwJhv1z9hn87F-WmbNv824ktlhzpzYX7BwH8NWsHRzjYp59ASmc1Q5ZI_NhZfdXrscoOAvX68beROynof5d2sXZ-T-J7J5oiEFFndReSy2GrDRtpv8wdMitzv3RDaiQoyRofQNRB" },
    { id: 1, url: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=300&q=80" },
    { id: 2, url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBNED0C7MdztWGjxuuoAXZqoJt9lpF7ktn-Wq9aC-CTZfkja91zoZu75mR3wW6ryZAvgi8TkVgDYe4I2Aid35BQ3oB9uzUkfi0gylLvRrGtETPfDxU3L3Z-aDrXM3Tr0fuwzrCu2HFfe1nEs4dAlMIukE97yGCZzaffMM8_UxVZE_S1Z5Zenpm2RyqJjrmMijwRg-wB2qWINsdaKs9OD_3OHng8zRajYxB7uZhCFCSmeQpa7bdQu2r1bSVQco5Dti3IHs8wU8QwIrkr" },
    { id: 3, url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAa1S9Um7rKrxmYtsz21zrkWZgzdC5dEdHu7knBkemhqVYr_WR2q3_ANmyeuv_j-Q31IeJTn0J3_LPF8gZyVdZvCjsGCk8w1nIy_QDF-8qBKNKxCaChNGqXRSg_ae_c8CbYYsoBLNZl1aTPC3gyurgAEA_q_ARsPT1AGw_B7zXtBXFJ8Z6PFBr5-60V0qWop168Aw89MnAVAmif8m_BILOa32UUWzeOv-OPL85Be6a0vL_3YhDDJtc2GHhvCY3DWzPKTnO74g4K1nNA" },
    { id: 4, url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCU_QFPGUmN26qDIuE7hxad3VCnfvA_iBqBEPIshFBMhq9iyobQO6FFvdgclPaWM1f20GXnJ7p3p5llBV8L7o4FxB2Z7p3pQgVyZW99EME01n6WyZUtVJT-jtJ5dBvocDsRQwyMkqZOfOS2kkKyv_HaeeEZuY_JFBP9P3uCkLa0_eHFYEoCBeMY23cCnDPeSMbMQFXW6nKTL8iv5KWDdZGdfXZ1s3oYgCdUSo07E-I93YL0Jm2RzHUczVz_zwEs5ewqQj7lTYZnUfNn" },
    { id: 5, url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnmzwGNV5VBmlE-NXOhdeBNLTYezQ5sl6tVIkI-7Re_kfE380_Hrnvzb88CsroL79Xn7piTqRgBTfqoaemOKjSfflv-AQ7We8BKHigU4NSCB4OdryAMy3NR38KbvSIuJitPxkW05D43PmdhH7stMsym5uxAG_QwTgxrNcISfUlbzUwGQcL6Pk31mbHTXCsHzz8v1BJSdrdy9FtYAjc4pHdOXskW2IVihc3hSsM-sNsaPewva-A0hnxhBhhyQcoqlcMeGPw4MdFK_Vy" },
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
      
      {/* MOBILE SLIDER MENU */}
      <div className={`fixed inset-0 z-[100] transition-all duration-300 ${isMenuOpen ? "visible" : "invisible"}`}>
        <div className={`absolute inset-0 bg-black/10 backdrop-blur-md transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setIsMenuOpen(false)}></div>
        
        <div className={`absolute top-0 right-0 h-full w-[85%] max-w-xs bg-white/70 backdrop-blur-2xl border-l border-white/20 shadow-2xl transition-transform duration-500 p-8 flex flex-col ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <button className="self-end mb-8 p-2 bg-black/5 rounded-full" onClick={() => setIsMenuOpen(false)}>
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>

          <div className="mb-10 pb-6 border-b border-black/5">
            <p className="text-[10px] uppercase font-black text-[#D4AF37] tracking-widest mb-1">
              {user ? "Authenticated Member" : "Guest Mode"}
            </p>
            <h2 className="text-2xl font-black italic tracking-tighter text-black">
              {userName || "The Guest"}
            </h2>
          </div>

          <nav className="flex flex-col gap-2 flex-1">
            <Link className="flex items-center gap-4 text-xs font-black uppercase tracking-widest p-4 rounded-2xl hover:bg-black/5 transition-all" to="/" onClick={() => setIsMenuOpen(false)}>
              <span className="material-symbols-outlined">home</span> Home
            </Link>
            <Link className="flex items-center gap-4 text-xs font-black uppercase tracking-widest p-4 rounded-2xl hover:bg-black/5 transition-all" to="/shop/underarm" onClick={() => setIsMenuOpen(false)}>
              <span className="material-symbols-outlined">grid_view</span> Collection
            </Link>
            <Link className="flex items-center gap-4 text-xs font-black uppercase tracking-widest p-4 rounded-2xl hover:bg-black/5 transition-all" to="/reviews" onClick={() => setIsMenuOpen(false)}>
              <span className="material-symbols-outlined">star</span> Reviews
            </Link>
            {user && (
              <Link className="flex items-center gap-4 text-xs font-black uppercase tracking-widest p-4 rounded-2xl hover:bg-black/5 transition-all" to="/orders" onClick={() => setIsMenuOpen(false)}>
                <span className="material-symbols-outlined">package_2</span> My Orders
              </Link>
            )}
            <Link className="flex items-center gap-4 text-xs font-black uppercase tracking-widest p-4 rounded-2xl hover:bg-black/5 transition-all" to="/cart" onClick={() => setIsMenuOpen(false)}>
              <span className="material-symbols-outlined">shopping_bag</span> Bag ({cartCount})
            </Link>
            
            {!user && (
              <Link className="flex items-center gap-4 text-[10px] font-black uppercase text-[#D4AF37] tracking-[0.2em] p-4 mt-4 border border-[#D4AF37]/20 rounded-2xl" to="/login" onClick={() => setIsMenuOpen(false)}>
                <span className="material-symbols-outlined">login</span> Sign In
              </Link>
            )}
          </nav>

          {/* MOBILE SLIDER MENU BOTTOM SECTION */}
{user && (
  <div className="mt-auto pt-6 border-t border-black/10">
    {/* Logout Button */}
    <button 
      onPointerDown={handleLogout} 
      className="w-full flex items-center gap-4 p-4 rounded-2xl active:bg-red-50 active:scale-[0.98] transition-all group touch-manipulation"
    >
      <span className="material-symbols-outlined text-red-500">logout</span>
      <span className="text-red-500 font-black text-[10px] uppercase tracking-widest">LOGOUT</span>
    </button>

    {/* Delete Account Button - Now visible on mobile */}
    <button 
      onClick={handleDeleteAccount} 
      className="w-full p-4 text-[9px] text-black/30 font-bold uppercase underline tracking-tighter text-left hover:text-red-500 transition-colors"
    >
      DELETE ACCOUNT
    </button>
  </div>
)}
          
        </div>
      </div>

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-8 py-6">
          <h1 className="text-2xl font-black tracking-widest cursor-pointer" onClick={() => navigate('/')}>LUXE</h1>
          
          <nav className="hidden md:flex items-center gap-10">
            <Link className="text-[10px] font-bold uppercase tracking-[0.3em] hover:text-[#D4AF37] transition-colors" to="/">Home</Link>
            <Link className="text-[10px] font-bold uppercase tracking-[0.3em] hover:text-[#D4AF37] transition-colors" to="/shop/underarm">Shop</Link>
            <Link className="text-[10px] font-bold uppercase tracking-[0.3em] hover:text-[#D4AF37] transition-colors" to="/reviews">Reviews</Link>
            
            {user ? (
              <div className="relative flex items-center gap-6" ref={dropdownRef}>
                <Link className="text-[10px] font-bold uppercase tracking-[0.3em] hover:text-[#D4AF37] transition-colors" to="/orders">Orders</Link>
                
                <div className="relative">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 group border-l border-black/10 pl-6"
                  >
                    <span className="text-[10px] font-black text-[#D4AF37] uppercase italic tracking-widest group-hover:underline transition-all">
                      {userName ? userName.split(' ')[0] : "Collector"}
                    </span>
                    <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-4 w-48 bg-white/90 backdrop-blur-xl border border-black/5 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-black/5 transition-colors">
                        <span className="material-symbols-outlined text-sm">logout</span> Logout
                      </button>
                      <button onClick={handleDeleteAccount} className="w-full flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 text-red-500 transition-colors border-t border-black/5">
                        <span className="material-symbols-outlined text-sm text-red-500">delete_forever</span> Delete Account
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] border border-[#D4AF37]/20 px-6 py-2 rounded-full hover:bg-[#D4AF37] hover:text-white transition-all" to="/login">
                Sign In
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative p-2">
              <span className="material-symbols-outlined text-2xl">shopping_bag</span>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-[#D4AF37] text-white text-[9px] font-black size-4 flex items-center justify-center rounded-full">
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