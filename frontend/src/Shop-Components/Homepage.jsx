import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useCart from "./useCart";
import { supabase } from "../Database-Server/Superbase-client.js";
import Footer from "./Footer.jsx";
import Navbar from "./Navbar.jsx";

/* ── Hero slides — editorial people + brand story, NO bags ── */
const HERO_SLIDES = [
  {
    id: 1,
    // Elegant woman in luxury fashion editorial
    img: "https://www.shutterstock.com/shutterstock/photos/2479904535/display_1500/stock-photo-portrait-of-stylish-young-woman-in-a-suit-posing-with-lady-s-leather-handbag-on-a-brown-studio-2479904535.jpg",
    eyebrow: "Janina Luxury Bags",
    title: "Crafted for\nthe Remarkable",
    sub: "Every stitch a declaration. Every piece, a legacy.",
    align: "left",
    
  },
  {
    id: 2,
    // Confident woman street fashion
    img: "https://images.unsplash.com/photo-1765115070689-43485654f37b?w=500&auto=format&fit=crop&q=60",
    eyebrow: "The Luxury Collection",
    title: "Where Luxury\nMeets Legacy",
    sub: "Handcrafted leather. Eternal elegance. Yours alone.",
    align: "center",
  },
  {
    id: 3,
    // Stylish woman editorial portrait
    img: "https://i.pinimg.com/1200x/ba/ce/47/bace4744b2d2173afa57a9b2ca7f4799.jpg",
    eyebrow: "Signature Series",
    title: "The Art of\nPossession",
    sub: "Limited. Intentional. Irreplaceable.",
    align: "left",
  },
  {
    id: 4,
    // Luxury fashion editorial — power dressing
    img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=85",
    eyebrow: "Worn by Those Who Know",
    title: "Beyond\nFashion",
    sub: "Investment pieces for the discerning collector.",
    align: "right",
  },
  {
    id: 5,
    // Sophisticated woman luxury lifestyle
    img: "https://i.pinimg.com/1200x/6b/34/b1/6b34b1565ee02f24512430b99e549eda.jpg",
    eyebrow: "New Season — Now Live",
    title: "Exclusive\nAccess",
    sub: "The vault is open. Claim yours before it closes.",
    align: "left",
  },
];

const FEATURES = [
  { icon: "verified",       title: "Certified Authentic", desc: "Every piece guaranteed genuine." },
  { icon: "local_shipping", title: "Premium Delivery",    desc: "Insured, fast shipping worldwide." },
  { icon: "autorenew",      title: "1-Day Returns",       desc: "Hassle-free return policy." },
  { icon: "support_agent",  title: "24/7 Support",      desc: "Always here when you need us." },
];

const SPOT_PER_PAGE = 4;

export default function Homepage() {
  const navigate      = useNavigate();
  const { addToCart } = useCart();

  const [heroIdx, setHeroIdx] = useState(0);
  const [heroVis, setHeroVis] = useState(true);
  const heroTimerRef          = useRef(null);

  const [cats, setCats]     = useState([]);
  const [catIdx, setCatIdx] = useState(0);
  const [catVis, setCatVis] = useState(true);
  const catTimer            = useRef(null);

  const [allProds, setAllProds] = useState([]);
  const [spotPage, setSpotPage] = useState(0);
  const [spotVis, setSpotVis]   = useState(true);

  /* ── Fetch ── */
  useEffect(() => {
    supabase.from("homepage_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          supabase.from("homepage_categories").select("*").order("sort_order", { ascending: true })
            .then(({ data: d }) => setCats(d || []));
        } else {
          setCats(data || []);
        }
      });
  }, []);

  useEffect(() => {
    supabase.from("products").select("*").then(({ data }) => {
      if (data?.length) setAllProds([...data].sort(() => Math.random() - 0.5));
    });
  }, []);

  /* ── Transition helper ── */
  const transition = (setVis, update, delay = 380) => {
    setVis(false);
    setTimeout(() => { update(); setVis(true); }, delay);
  };

  /* ── Hero auto-advance 7s ── */
  const resetHeroTimer = () => {
    clearInterval(heroTimerRef.current);
    heroTimerRef.current = setInterval(() => {
      transition(setHeroVis, () => setHeroIdx(p => (p + 1) % HERO_SLIDES.length));
    }, 7000);
  };

  useEffect(() => {
    resetHeroTimer();
    return () => clearInterval(heroTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Category carousel 5s ── */
  const resetCatTimer = () => {
    clearInterval(catTimer.current);
    catTimer.current = setInterval(() => {
      transition(setCatVis, () => setCatIdx(p => (p + 1) % Math.max(cats.length, 1)));
    }, 5000);
  };

  useEffect(() => {
    if (!cats.length) return;
    resetCatTimer();
    return () => clearInterval(catTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cats.length]);

  /* ── Spotlight 40s ── */
  useEffect(() => {
    const total = Math.ceil(allProds.length / SPOT_PER_PAGE);
    if (total < 2) return;
    const t = setInterval(() => {
      transition(setSpotVis, () => setSpotPage(p => (p + 1) % total));
    }, 40000);
    return () => clearInterval(t);
  }, [allProds.length]);

  const goHero = (dir) => {
    resetHeroTimer();
    transition(setHeroVis, () => setHeroIdx(p => (p + dir + HERO_SLIDES.length) % HERO_SLIDES.length));
  };

  const goCat = (dir) => {
    resetCatTimer();
    transition(setCatVis, () => setCatIdx(p => (p + dir + cats.length) % cats.length));
  };

  const goSpot = (pg) => transition(setSpotVis, () => setSpotPage(pg));

  const totalSpotPages = Math.max(1, Math.ceil(allProds.length / SPOT_PER_PAGE));
  const visibleSpot    = allProds.slice(spotPage * SPOT_PER_PAGE, spotPage * SPOT_PER_PAGE + SPOT_PER_PAGE);
  const desktopCats    = cats.slice(0, 4);
  const hasMoreCats    = cats.length > 4;
  const currentCat     = cats[catIdx];

  const slide = HERO_SLIDES[heroIdx];
  const alignClass = slide.align === "center"
    ? "items-center text-center"
    : slide.align === "right"
    ? "items-end text-right"
    : "items-start text-left";

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-black select-none">
      <Navbar />

      {/* ══ HERO CAROUSEL — full bleed, no buttons, image + text only ══ */}
      <section className="relative w-full h-[75dvh] md:h-[88dvh] max-h-[900px] min-h-[420px] overflow-hidden">

        {/* Slides */}
        {HERO_SLIDES.map((s, i) => (
          <div
            key={s.id}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === heroIdx ? 1 : 0, zIndex: i === heroIdx ? 10 : 0 }}
          >
            <img
              src={s.img}
              alt=""
              className="w-full h-full object-cover"
              style={{ transform: i === heroIdx ? "scale(1.04)" : "scale(1)", transition: "transform 7s ease" }}
            />
            {/* Multi-layer gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
          </div>
        ))}

        {/* Text content */}
        <div
          className={`absolute inset-0 z-20 flex flex-col justify-end pb-16 md:pb-20 px-7 md:px-16 lg:px-24 transition-all duration-600 ${
            heroVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
        >
          <div className={`flex flex-col gap-3 max-w-2xl ${
            slide.align === "center" ? "mx-auto items-center text-center"
            : slide.align === "right" ? "ml-auto items-end text-right"
            : "items-start text-left"
          }`}>
            {/* Eyebrow */}
            <div className="flex items-center gap-3">
              {slide.align !== "right" && <div className="w-8 h-px bg-[#C9A227]" />}
              <p className="text-[9px] font-black uppercase tracking-[0.6em] text-[#C9A227]">
                {slide.eyebrow}
              </p>
              {slide.align === "right" && <div className="w-8 h-px bg-[#C9A227]" />}
            </div>

            {/* Main heading */}
            <h1 className="text-[2.4rem] md:text-[3.6rem] lg:text-[4.2rem] font-serif italic text-white leading-[0.92] tracking-tight whitespace-pre-line drop-shadow-2xl">
              {slide.title}
            </h1>

            {/* Subline */}
            <p className="text-[13px] md:text-[15px] text-white/55 font-medium leading-relaxed max-w-md">
              {slide.sub}
            </p>
          </div>
        </div>

        {/* Gold progress bar at very bottom */}
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-white/[0.08] z-30">
          <div
            key={heroIdx}
            className="h-full bg-[#C9A227]"
            style={{ animation: "heroProgress 7s linear forwards" }}
          />
        </div>

        {/* Dot nav */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { resetHeroTimer(); transition(setHeroVis, () => setHeroIdx(i)); }}
              className={`rounded-full transition-all duration-500 ${
                i === heroIdx ? "w-7 h-[5px] bg-[#C9A227]" : "w-[5px] h-[5px] bg-white/35 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        {/* Arrow nav */}
        <button
          onClick={() => goHero(-1)}
          className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/30 backdrop-blur-md border border-white/15 hover:bg-[#C9A227] hover:border-[#C9A227] items-center justify-center transition-all duration-300 group"
        >
          <span className="material-symbols-outlined text-white text-[20px] group-hover:text-black">chevron_left</span>
        </button>
        <button
          onClick={() => goHero(1)}
          className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/30 backdrop-blur-md border border-white/15 hover:bg-[#C9A227] hover:border-[#C9A227] items-center justify-center transition-all duration-300 group"
        >
          <span className="material-symbols-outlined text-white text-[20px] group-hover:text-black">chevron_right</span>
        </button>

        {/* Slide counter top-right */}
        <div className="absolute top-7 right-7 z-30 hidden md:flex items-center gap-1.5">
          <span className="text-[13px] font-black text-white tabular-nums">{String(heroIdx + 1).padStart(2, "0")}</span>
          <span className="text-white/25 text-[10px] font-bold">/ {String(HERO_SLIDES.length).padStart(2, "0")}</span>
        </div>

        <style>{`
          @keyframes heroProgress { from { width: 0 } to { width: 100% } }
        `}</style>
      </section>

      {/* ══ COLLECTIONS ══════════════════════════════════════════ */}
      {cats.length > 0 && (
        <section className="py-8 md:py-12">

          {/* Mobile carousel */}
          <div className="md:hidden">
            <div className="px-4 flex items-end justify-between mb-4">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.45em] text-[#C9A227] mb-1">Browse</p>
                <h2 className="text-[1.1rem] font-black tracking-tighter uppercase">Our Collections</h2>
              </div>
              {cats.length > 1 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => goCat(-1)} className="w-8 h-8 rounded-full bg-white border border-black/[0.08] flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                  </button>
                  <button onClick={() => goCat(1)} className="w-8 h-8 rounded-full bg-white border border-black/[0.08] flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                  </button>
                </div>
              )}
            </div>

            {currentCat && (
              <div className={`transition-all duration-500 ${catVis ? "opacity-100" : "opacity-0"}`}>
                <Link to={`/shop/${currentCat.slug}`} className="block group relative overflow-hidden" style={{ height: "220px" }}>
                  <img src={currentCat.image_url} alt={currentCat.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-[8px] font-black uppercase tracking-[0.35em] text-[#C9A227] mb-1">Collection · {catIdx + 1}/{cats.length}</p>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white leading-none mb-3">{currentCat.name}</h3>
                    <span className="inline-flex items-center gap-1.5 bg-[#C9A227] text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">
                      Shop Now <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </span>
                  </div>
                </Link>
              </div>
            )}

            {cats.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3 px-4">
                {cats.map((_, di) => (
                  <button key={di} onClick={() => { resetCatTimer(); transition(setCatVis, () => setCatIdx(di)); }}
                    className={`rounded-full transition-all duration-400 ${di === catIdx ? "w-6 h-1.5 bg-[#C9A227]" : "w-1.5 h-1.5 bg-black/20"}`} />
                ))}
              </div>
            )}
          </div>

          {/* Desktop grid */}
          <div className="hidden md:block max-w-[1200px] mx-auto px-10 lg:px-16">
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.45em] text-[#C9A227] mb-1">Browse</p>
                <h2 className="text-xl font-black tracking-tighter uppercase">Our Collections</h2>
              </div>
              {hasMoreCats && (
                <Link to="/shop/all" className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors">
                  View All ({cats.length}) <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3.5" style={{ gridAutoRows: "200px" }}>
              {desktopCats[0] && (
                <Link to={`/shop/${desktopCats[0].slug}`} className="col-span-2 row-span-2 relative group overflow-hidden rounded-[1.5rem]">
                  <img src={desktopCats[0].image_url} alt={desktopCats[0].name} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <p className="text-[8px] font-black uppercase tracking-[0.35em] text-[#C9A227] mb-1">Featured</p>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white leading-none mb-3">{desktopCats[0].name}</h3>
                    <span className="inline-flex items-center gap-1.5 bg-[#C9A227] text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest group-hover:brightness-110 transition-all">
                      Shop Now <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                    </span>
                  </div>
                </Link>
              )}

              {desktopCats.slice(1, 4).map((cat) => (
                <Link key={cat.id} to={`/shop/${cat.slug}`} className="relative group overflow-hidden rounded-[1.5rem]">
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-[12px] font-black uppercase tracking-tight text-white leading-tight">{cat.name}</h3>
                    <p className="text-[8px] font-bold text-white/50 uppercase tracking-wider mt-0.5">Shop →</p>
                  </div>
                </Link>
              ))}

              {hasMoreCats ? (
                <Link to="/shop/all" className="relative group overflow-hidden rounded-[1.5rem] bg-[#F0EDE7] flex flex-col items-center justify-center gap-2.5 border border-black/[0.07]">
                  <div className="w-10 h-10 rounded-full bg-[#C9A227]/10 flex items-center justify-center group-hover:bg-[#C9A227] transition-all duration-300">
                    <span className="material-symbols-outlined text-[20px] text-[#C9A227] group-hover:text-white transition-colors">grid_view</span>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-black/50 group-hover:text-black transition-colors">View All</p>
                    <p className="text-[8px] font-bold text-black/30 mt-0.5">{cats.length} Collections</p>
                  </div>
                </Link>
              ) : desktopCats.length < 4 ? (
                Array.from({ length: 4 - desktopCats.length }).map((_, i) => (
                  <div key={`ph-${i}`} className="rounded-[1.5rem] bg-black/[0.03]" />
                ))
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* ══ FEATURED PRODUCTS ════════════════════════════════════ */}
      {allProds.length > 0 && (
        <section className="py-8 md:py-12 bg-white border-y border-black/[0.05]">
          <div className="max-w-[1200px] mx-auto px-4 md:px-10 lg:px-16">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.45em] text-[#C9A227] mb-1">Curated Picks</p>
                <h2 className="text-[1.1rem] md:text-xl font-black tracking-tighter uppercase">Featured Products</h2>
              </div>
              <div className="flex items-center gap-2.5">
                {totalSpotPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => goSpot((spotPage - 1 + totalSpotPages) % totalSpotPages)}
                      className="w-7 h-7 rounded-full bg-black/[0.05] border border-black/[0.07] hover:border-[#C9A227]/50 flex items-center justify-center transition-all">
                      <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                    </button>
                    <span className="text-[9px] font-black text-black/40 tabular-nums">{spotPage + 1}/{totalSpotPages}</span>
                    <button onClick={() => goSpot((spotPage + 1) % totalSpotPages)}
                      className="w-7 h-7 rounded-full bg-black/[0.05] border border-black/[0.07] hover:border-[#C9A227]/50 flex items-center justify-center transition-all">
                      <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    </button>
                  </div>
                )}
                <button onClick={() => navigate("/shop/crossbody")}
                  className="hidden md:flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-black/40 hover:text-black transition-colors">
                  View All <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </button>
              </div>
            </div>

            <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 transition-all duration-500 ${spotVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
              {visibleSpot.map((product) => (
                <SpotCard key={product.id} product={product} onAdd={addToCart} />
              ))}
            </div>

            {totalSpotPages > 1 && (
              <div className="flex justify-center gap-1.5 mt-6">
                {Array.from({ length: totalSpotPages }).map((_, i) => (
                  <button key={i} onClick={() => goSpot(i)}
                    className={`rounded-full transition-all duration-400 ${i === spotPage ? "w-6 h-1.5 bg-[#C9A227]" : "w-1.5 h-1.5 bg-black/15 hover:bg-black/30"}`} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══ FEATURES STRIP ═══════════════════════════════════════ */}
      <section className="border-y border-black/[0.06] bg-[#F7F5F0]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 lg:px-16 py-8 md:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2 group">
                <div className="w-10 h-10 rounded-2xl bg-[#C9A227]/10 flex items-center justify-center group-hover:bg-[#C9A227] transition-all duration-300">
                  <span className="material-symbols-outlined text-[20px] text-[#C9A227] group-hover:text-white transition-colors">{f.icon}</span>
                </div>
                <h4 className="text-[11px] md:text-[12px] font-black uppercase tracking-tight text-black">{f.title}</h4>
                <p className="text-[10px] text-black/55 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SpotCard({ product, onAdd }) {
  const [added, setAdded] = useState(false);
  const handleAdd = (e) => {
    e.preventDefault();
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };
  const discount = product.previous_price
    ? Math.round((1 - product.price / product.previous_price) * 100)
    : null;

  return (
    <Link to={`/product/${product.id}`}
      className="group relative flex flex-col bg-white overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-black/[0.07]"
      style={{ borderRadius: "16px" }}>
      <div className="relative overflow-hidden bg-[#F0EDE7]" style={{ aspectRatio: "3/4" }}>
        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" />
        {discount && (
          <span className="absolute top-2.5 right-2.5 bg-[#C9A227] text-white text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">−{discount}%</span>
        )}
        {product.series && (
          <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-black/70 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">{product.series}</span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button onClick={handleAdd}
            className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
              added ? "bg-emerald-500 text-white" : "bg-[#0A0A0A]/90 text-white backdrop-blur-sm hover:bg-[#C9A227]"
            }`}>
            {added ? "✓ Added" : "Quick Add"}
          </button>
        </div>
      </div>
      <div className="px-3 pt-2.5 pb-3">
        <p className="text-[7px] font-black uppercase tracking-[0.32em] text-[#C9A227] mb-0.5">{product.category}</p>
        <h3 className="text-[11px] md:text-[12px] font-black uppercase tracking-tight text-black leading-snug line-clamp-1 group-hover:text-[#C9A227] transition-colors">{product.name}</h3>
        <div className="flex items-end gap-1.5 mt-1.5">
          <span className="text-[13px] md:text-[14px] font-black tracking-tighter text-black leading-none">GH₵{product.price?.toLocaleString()}</span>
          {product.previous_price && (
            <span className="text-[10px] text-black/30 line-through mb-px">GH₵{product.previous_price?.toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}