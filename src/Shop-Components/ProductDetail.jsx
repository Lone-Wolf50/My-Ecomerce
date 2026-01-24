import React, { useLayoutEffect } from 'react';
import { useParams } from 'react-router-dom';
import { products } from '../Product';
import ProductCard from './ProductCard';
import useCart from './useCart'; 
import DetailsNavBar from './DetailsNavBar'; 

const ProductDetail = () => {
  // FIXED: Changed 'productId' to 'id' to match your Holder.jsx route (:id)
  const { id } = useParams();
  const { addToCart } = useCart();

  // Find the product using the 'id' from the URL
  const product = products.find(p => String(p.id) === String(id));

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
  }, [id]);

  if (!product) return (
    <div className="p-20 text-primary-gold font-display bg-black min-h-screen">
      Product not found. (Searching for ID: {id})
    </div>
  );

  // Logic for related items
  const related = products
    .filter(p => p.category === product.category && String(p.id) !== String(id))
    .slice(0, 4);

  return (
    <div className="bg-black min-h-screen selection:bg-primary-gold/30">
      <DetailsNavBar category={product.category} />

      <main key={id} className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-32 pb-12 font-display animate-in fade-in duration-700">
        
        <div className="flex flex-col lg:flex-row gap-10 lg:h-[75vh] items-stretch mb-24">
          {/* Image Box */}
          <div className="w-full lg:w-[60%] bg-white rounded-[2.5rem] flex items-center justify-center p-8 lg:p-16 shadow-2xl overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name} 
              className="max-h-full max-w-full object-contain animate-in zoom-in-95 duration-1000" 
            />
          </div>

          {/* Text Box */}
          <div className="w-full lg:w-[40%] flex flex-col justify-center max-w-[420px] mx-auto lg:ml-auto lg:mr-0">
            <p className="text-[10px] font-black text-primary-gold uppercase tracking-[0.6em] mb-3">{product.series}</p>
            <h1 className="text-4xl lg:text-5xl font-black text-off-white uppercase mb-4 tracking-tighter leading-[0.9]">{product.name}</h1>
            <p className="text-2xl font-medium text-primary-gold mb-8">${product.price?.toLocaleString()}</p>
            
            <div className="border-t border-white/10 pt-8 mb-10">
              <p className="text-off-white/40 text-[13px] leading-relaxed font-light mb-8 italic">{product.description}</p>
              <div className="flex gap-12">
                <div className="flex flex-col gap-1">
                  <p className="text-[8px] uppercase font-black text-white/20 tracking-[0.2em]">Material</p>
                  <p className="text-[11px] text-off-white">{product.material}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[8px] uppercase font-black text-white/20 tracking-[0.2em]">Origin</p>
                  <p className="text-[11px] text-off-white">{product.origin}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => addToCart(product)}
              className="w-full bg-primary-gold text-black py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white transition-all rounded-2xl shadow-lg active:scale-[0.98]"
            >
              Add to Bag
            </button>
          </div>
        </div>

        {/* Related Products Section */}
        {related.length > 0 && (
          <section className="border-t border-white/5 pt-20">
            <h3 className="text-[9px] font-black tracking-[0.4em] text-white/60 uppercase mb-12 text-center">Explore Similar Pieces</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map(item => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ProductDetail;