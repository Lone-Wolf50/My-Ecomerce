import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../Database-Server/Superbase-client.js";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ProductCard from "./ProductCard";

const ShopAllPage = () => {
  const [categories, setCategories]   = useState([]);
  const [products,   setProducts]     = useState([]);
  const [activeSlug, setActiveSlug]   = useState("all");
  const [loading,    setLoading]      = useState(true);
  const [heroVis,    setHeroVis]      = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          supabase.from("homepage_categories").select("*").eq("is_active", true).order("sort_order"),
          supabase.from("products").select("*"),
        ]);
        if (catRes.data) setCategories(catRes.data);
        if (prodRes.data) setProducts(prodRes.data);
      } catch (err) {
        console.error("ShopAll fetch error:", err.message);
      } finally {
        setLoading(false);
        setTimeout(() => setHeroVis(true), 80);
      }
    };
    fetchAll();
  }, []);

  const filtered =
    activeSlug === "all"
      ? products
      : products.filter((p) => p.category?.toLowerCase() === activeSlug?.toLowerCase());

  const activeCat = categories.find((c) => c.slug === activeSlug);

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-black select-none">
      <Navbar />

      {/* ── EDITORIAL HERO ─────────────────────────────────────── */}
      <section className="relative pt-20 pb-0 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[700px] h-[400px] bg-[#C9A227]/[0.07] rounded-full blur-[120px]" />
          <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-[#C9A227]/[0.04] rounded-full blur-[80px]" />
        </div>

        <div className={`relative max-w-[1440px] mx-auto px-5 md:px-10 lg:px-16 transition-all duration-700 ${heroVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <p className="text-[9px] font-black uppercase tracking-[0.6em] text-[#C9A227] mb-4">
            Janina · Complete Collection
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <h1 className="text-[clamp(52px,9vw,110px)] font-black tracking-tighter uppercase italic leading-none text-black">
              {activeSlug === "all"
                ? "All Pieces"
                : activeCat?.name || activeSlug}
            </h1>
            <p className="text-[12px] font-black uppercase tracking-[0.35em] text-black/25 pb-2">
              {loading ? "—" : `${filtered.length} Curated ${filtered.length === 1 ? "Piece" : "Pieces"}`}
            </p>
          </div>

          {/* Gold rule */}
          <div className="h-px bg-gradient-to-r from-[#C9A227]/60 via-[#C9A227]/20 to-transparent mb-10" />
        </div>
      </section>

      {/* ── CATEGORY FILTER STRIP ───────────────────────────────── */}
      <section className="sticky top-[60px] z-30 bg-[#F7F5F0]/95 backdrop-blur-xl border-b border-black/[0.06] shadow-sm">
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 lg:px-16">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {/* All tab */}
            <button
              onClick={() => setActiveSlug("all")}
              className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap ${
                activeSlug === "all"
                  ? "bg-black text-white shadow-lg"
                  : "bg-white text-black/45 border border-black/[0.08] hover:border-black/25"
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">apps</span>
              All
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${activeSlug === "all" ? "bg-white/20 text-white" : "bg-black/[0.05] text-black/40"}`}>
                {products.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = products.filter((p) => p.category?.toLowerCase() === cat.slug?.toLowerCase()).length;
              const active = activeSlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveSlug(cat.slug)}
                  className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap ${
                    active
                      ? "bg-[#C9A227] text-black shadow-lg shadow-[#C9A227]/25"
                      : "bg-white text-black/45 border border-black/[0.08] hover:border-[#C9A227]/40 hover:text-black"
                  }`}
                >
                  {cat.name}
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${active ? "bg-black/15 text-black" : "bg-black/[0.05] text-black/40"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CATEGORY HERO IMAGE (when filtered) ─────────────────── */}
      {activeSlug !== "all" && activeCat?.image_url && (
        <div className="relative h-[220px] md:h-[300px] overflow-hidden mb-0">
          <img
            src={activeCat.image_url}
            alt={activeCat.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F7F5F0] via-[#F7F5F0]/20 to-transparent" />
        </div>
      )}

      {/* ── PRODUCT GRID ────────────────────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-10 lg:px-16 pt-10 pb-32 md:pb-24">
        {loading ? (
          <div className="text-center py-40">
            <div className="w-10 h-10 border-[3px] border-[#C9A227] border-t-transparent rounded-full animate-spin mx-auto mb-5" />
            <p className="text-[11px] uppercase font-black tracking-[0.4em] text-[#C9A227]">Curating Collection…</p>
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Categories grid at the bottom when viewing "all" */}
            {activeSlug === "all" && categories.length > 0 && (
              <div className="mt-20 pt-12 border-t border-black/[0.07]">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#C9A227] mb-2">Browse By</p>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">Collections</h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {categories.map((cat) => {
                    const count = products.filter((p) => p.category?.toLowerCase() === cat.slug?.toLowerCase()).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => { setActiveSlug(cat.slug); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className="group relative overflow-hidden rounded-[1.5rem] aspect-[4/3] cursor-pointer"
                      >
                        <img
                          src={cat.image_url}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9A227] mb-0.5">{count} Pieces</p>
                          <h3 className="text-[16px] font-black uppercase text-white tracking-tight leading-tight">{cat.name}</h3>
                        </div>
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <span className="material-symbols-outlined text-[14px] text-white">arrow_forward</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-40 bg-white/60 backdrop-blur-xl rounded-[3rem] border border-black/[0.05]">
            <span className="material-symbols-outlined text-5xl text-[#C9A227]/40 mb-5 block">inventory_2</span>
            <p className="text-black/30 uppercase tracking-[0.4em] text-[12px] font-black mb-2">Currently Unavailable</p>
            <p className="text-black/20 text-[11px]">This collection is being curated. Check back soon.</p>
          </div>
        )}
      </section>

      <Footer />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ShopAllPage;