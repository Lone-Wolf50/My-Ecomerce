import React, { useLayoutEffect, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../Database-Server/Superbase-client.js";
import ProductCard from "./ProductCard";
import useCart from "./useCart";
import Navbar from "./Navbar";
import Footer from "./Footer.jsx";

export default function ProductDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { addToCart, cart } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded]     = useState(false);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  /* Sync cart to Supabase */
  useEffect(() => {
    const uuid = sessionStorage.getItem("userUuid");
    if (!uuid || !cart?.length) return;
    supabase.from("active_sessions_cart")
      .upsert({ user_id: uuid, items: cart, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
      .then(({ error }) => { if (error) console.error("Cart sync:", error.message); });
  }, [cart]);

  /* Fetch product + related */
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: p, error: pe } = await supabase.from("products").select("*").eq("id", id).single();
        if (pe) throw pe;
        setProduct(p);
        const { data: rel } = await supabase.from("products").select("*")
          .eq("category", p.category).neq("id", id).limit(4);
        setRelated(rel || []);
      } catch (err) { console.error(err.message); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const discount = product?.previous_price
    ? Math.round((1 - product.price / product.previous_price) * 100)
    : null;

  /* ── Loading ──────────────────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-9 h-9 border-[2.5px] border-[#C9A227] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#C9A227] animate-pulse">
          Curating Details…
        </p>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center gap-5 px-5">
      <span className="material-symbols-outlined text-5xl text-black/12">search_off</span>
      <p className="text-[12px] font-black uppercase tracking-widest text-black/25">Item not found</p>
      <button
        onClick={() => navigate(-1)}
        className="bg-black text-white px-9 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#C9A227] transition-all"
      >
        Go Back
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F5F0] select-none">
      <Navbar />

      <main className="max-w-[1300px] mx-auto px-5 md:px-10 lg:px-16 pt-8 pb-20">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-7 text-[10px] font-black uppercase tracking-wider text-black/30">
          <button onClick={() => navigate("/")} className="hover:text-black transition-colors">Home</button>
          <span className="material-symbols-outlined text-[13px]">chevron_right</span>
          <button onClick={() => navigate(`/shop/${product.category}`)} className="hover:text-black transition-colors capitalize">
            {product.category}
          </button>
          <span className="material-symbols-outlined text-[13px]">chevron_right</span>
          <span className="text-black/60 truncate max-w-[180px]">{product.name}</span>
        </div>

        {/* ── Product Layout ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 mb-16 lg:mb-24">

          {/* Image Panel */}
          <div className="relative">
            <div
              className="relative overflow-hidden bg-white border border-black/[0.05] shadow-lg shadow-black/[0.04]"
              style={{ borderRadius: "24px", aspectRatio: "4/5" }}
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain p-8 md:p-10 drop-shadow-xl transition-transform duration-700 hover:scale-[1.02]"
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.series && (
                  <span className="bg-white/90 backdrop-blur-sm text-black/55 text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-black/[0.06]">
                    {product.series}
                  </span>
                )}
                {discount && (
                  <span className="bg-[#C9A227] text-white text-[8px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md">
                    −{discount}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details Panel */}
          <div className="flex flex-col justify-center lg:py-2">

            {/* Eyebrow */}
            <p className="text-[10px] font-black uppercase tracking-[0.42em] text-[#C9A227] mb-2.5">
              {product.series || product.category}
            </p>

            {/* Name */}
            <h1 className="text-3xl md:text-4xl lg:text-[3rem] font-black uppercase tracking-tighter leading-none text-black mb-5">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-end gap-3 mb-6 pb-6 border-b border-black/[0.07]">
              <span className="text-2xl md:text-3xl font-black text-[#C9A227] tracking-tighter">
                GH₵{product.price?.toLocaleString()}
              </span>
              {product.previous_price && (
                <span className="text-[16px] text-black/28 line-through mb-0.5">
                  GH₵{product.previous_price?.toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-[15px] text-black/60 leading-relaxed font-medium mb-7">
              {product.description}
            </p>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-2.5 mb-7">
              {[
                { label: "Material", value: product.material },
                { label: "Origin",   value: product.origin   },
                { label: "Category", value: product.category },
                { label: "Series",   value: product.series   },
              ]
                .filter((s) => s.value)
                .map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-white border border-black/[0.05] p-3.5 shadow-sm"
                    style={{ borderRadius: "14px" }}
                  >
                    <p className="text-[8px] font-black uppercase tracking-[0.35em] text-black/28 mb-1">{label}</p>
                    <p className="text-[13px] font-black text-black capitalize">{value}</p>
                  </div>
                ))}
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-5 mb-6 py-4 border-y border-black/[0.06]">
              {[
                { icon: "verified",       text: "Authentic"     },
                { icon: "local_shipping", text: "Door Delivery" },
                { icon: "autorenew",      text: "5-Day Return"  },
              ].map(({ icon, text }) => (
                <div key={icon} className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#C9A227]">{icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-wide text-black/50">{text}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex gap-2.5">
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-4 font-black text-[12px] uppercase tracking-[0.28em] transition-all duration-300 active:scale-[0.98] shadow-lg ${
                  added
                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                    : "bg-[#C9A227] text-white hover:brightness-110 shadow-[#C9A227]/22"
                }`}
                style={{ borderRadius: "14px" }}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {added ? "check_circle" : "shopping_bag"}
                </span>
                {added ? "Added to Cart" : "Add to Cart"}
              </button>

              <button
                onClick={() => navigate("/cart")}
                className="flex items-center justify-center w-14 bg-[#0A0A0A] text-white hover:bg-black/80 transition-all shadow-lg"
                style={{ borderRadius: "14px" }}
              >
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Related Products ───────────────────────────────── */}
        {related.length > 0 && (
          <section className="pt-10 md:pt-12 border-t border-black/[0.06]">
            <div className="flex items-center justify-between mb-7">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.42em] text-[#C9A227] mb-1">More From</p>
                <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase capitalize">
                  {product.category}
                </h2>
              </div>
              <button
                onClick={() => navigate(`/shop/${product.category}`)}
                className="hidden md:flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-black/35 hover:text-black transition-colors"
              >
                View All
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}