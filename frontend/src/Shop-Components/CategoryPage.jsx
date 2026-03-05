import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../Database-Server/Superbase-client.js";
import ProductCard from "./ProductCard";
import Navbar from "./Navbar";
import Footer from "./Footer";

const CategoryPage = () => {
  const { categoryName } = useParams();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("products").select("*");
        if (error) throw error;
        const matched = data.filter((p) => {
          const cat = p.category.toLowerCase();
          const url = categoryName.toLowerCase();
          return cat === url || cat + "s" === url || url.slice(0, -1) === cat;
        });
        setFilteredProducts(matched);
      } catch (err) {
        console.error("Error fetching category:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryProducts();
  }, [categoryName]);

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-black select-none">
      <Navbar />

      {/* Hero Header */}
      <section className="relative pt-16 pb-12 md:pb-16 px-5 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#D4AF37]/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-[1440px] mx-auto text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37] mb-3">Collection</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase italic leading-none text-black mb-6">
            {categoryName}
          </h1>
          <div className="flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-[#D4AF37]/40" />
            <p className="text-[12px] uppercase font-black tracking-[0.4em] text-black/35">
              {loading ? "Counting…" : `${filteredProducts.length} Total Masterpieces `}
            </p>
            <span className="h-px w-12 bg-[#D4AF37]/40" />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-10 lg:px-16 pb-32 md:pb-24">
        {loading ? (
          <div className="text-center py-40">
            <div className="w-10 h-10 border-[3px] border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-5" />
            <p className="text-[11px] uppercase font-black tracking-[0.4em] text-[#D4AF37]">Curating Collection…</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-40 bg-white/60 backdrop-blur-xl rounded-[3rem] border border-black/[0.05] mx-0 md:mx-6">
            <span className="material-symbols-outlined text-5xl text-[#D4AF37]/40 mb-5 block">inventory_2</span>
            <p className="text-black/30 uppercase tracking-[0.4em] text-[12px] font-black">Currently Unavailable</p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default CategoryPage;