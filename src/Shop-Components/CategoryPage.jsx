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
    <main className="min-h-screen bg-black text-white selection:bg-primary-gold/30 select-none">
      <Navbar />

      {/* Refined Header - text-6xl is better for PC than 8xl */}
      <div className="flex flex-col items-center gap-4 pt-12 md:pt-20 mb-12 md:mb-16 relative px-8">
        <h1 className="text-3xl md:text-6xl font-black tracking-tighter text-primary-gold uppercase text-center">
          {categoryName}
        </h1>
        
        <div className="flex items-center gap-3 opacity-30">
          <span className="h-[1px] w-6 bg-primary-gold"></span>
          <p className="text-[9px] uppercase font-bold tracking-[0.3em]">
            {filteredProducts.length} Pieces
          </p>
          <span className="h-[1px] w-6 bg-primary-gold"></span>
        </div>
      </div>

      {/* Grid: 2 cols mobile, 3 cols tablet, 4 cols PC for better space usage */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-12 pb-32">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 justify-items-center">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32">
            <p className="text-white/20 uppercase tracking-widest text-[10px] font-bold italic">
              Empty Vault.
            </p>
          </div>
        )}
      </section>
    </main>
  );
};

export default CategoryPage;