import React from 'react';
import { useParams } from 'react-router-dom';
import { products } from '../Product'; 
import ProductCard from './ProductCard';
import Navbar from './Navbar';

const CategoryPage = () => {
  const { categoryName } = useParams();

  const filteredProducts = products.filter((p) => {
    const categoryMatch = p.category.toLowerCase();
    const urlMatch = categoryName.toLowerCase();
    return (
      categoryMatch === urlMatch || 
      categoryMatch + 's' === urlMatch || 
      urlMatch.slice(0, -1) === categoryMatch
    );
  });

  return (
    /* UPDATED: Changed to bg-cream and black-solid text to match new branding */
    <main className="min-h-screen bg-cream text-black-solid selection:bg-primary/20 select-none">
      <Navbar />

      {/* Header Section: Accounted for fixed navbar with pt-40 */}
      <div className="flex flex-col items-center gap-4 pt-20 mb-12 md:mb-20 relative px-8">
        <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-black-solid uppercase text-center italic leading-none">
          {categoryName}
        </h1>
        
        <div className="flex items-center gap-4">
          <span className="h-[2px] w-8 bg-primary rounded-full"></span>
          <p className="text-[10px] uppercase font-black tracking-[0.4em] text-black-solid/40">
            {filteredProducts.length} Curated Pieces
          </p>
          <span className="h-[2px] w-8 bg-primary rounded-full"></span>
        </div>
      </div>

      {/* Products Grid */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-12 pb-32">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-40 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-black/5 mx-6">
            <span className="material-symbols-outlined text-4xl text-primary mb-4 opacity-50">inventory_2</span>
            <p className="text-black-solid/30 uppercase tracking-[0.4em] text-[11px] font-black">
              Vault Currently Empty
            </p>
          </div>
        )}
      </section>

      {/* FOOTER: Standard block footer to maintain single page scroll */}
      <footer className="w-full py-20 border-t border-black/10 text-center bg-white/40 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-2xl font-black tracking-[0.4em] text-primary uppercase">LUXE</h2>
              <p className="text-[9px] uppercase tracking-[0.3em] text-black-solid/20 font-bold mt-4">
                  © 2026 Luxury Reimagined — Handcrafted Excellence
              </p>
          </div>
      </footer>
    </main>
  );
};

export default CategoryPage;