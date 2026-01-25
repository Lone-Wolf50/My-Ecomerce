import React, { useLayoutEffect } from 'react';
import { useParams } from 'react-router-dom';
import { products } from '../Product';
import ProductCard from './ProductCard';
import useCart from './useCart'; 
import DetailsNavBar from './DetailsNavBar'; 

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();

  const product = products.find(p => String(p.id) === String(id));

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
  }, [id]);

  if (!product) return (
    <div className="p-20 text-primary font-black bg-cream min-h-screen">
      Product not found. (Searching for ID: {id})
    </div>
  );

  const related = products
    .filter(p => p.category === product.category && String(p.id) !== String(id))
    .slice(0, 4);

  return (
    /* UPDATED: Changed bg-black to bg-cream and text-off-white to black-solid */
    <div className="bg-cream min-h-screen selection:bg-primary/20 text-black-solid">
      <DetailsNavBar category={product.category} />

      <main key={id} className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-40 pb-12 animate-in fade-in duration-700">
        
        <div className="flex flex-col lg:flex-row gap-10 lg:h-[75vh] items-stretch mb-24">
          
          {/* Image Box - Light Glass Style */}
          <div className="w-full lg:w-[60%] bg-white/40 backdrop-blur-xl rounded-[3rem] border border-black/5 flex items-center justify-center p-8 lg:p-16 shadow-2xl shadow-black/5 overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name} 
              className="max-h-full max-w-full object-contain animate-in zoom-in-95 duration-1000 drop-shadow-2xl" 
            />
          </div>

          {/* Text Box */}
          <div className="w-full lg:w-[40%] flex flex-col justify-center max-w-[420px] mx-auto lg:ml-auto lg:mr-0">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.6em] mb-3">{product.series}</p>
            <h1 className="text-4xl lg:text-6xl font-black text-black-solid uppercase mb-4 tracking-tighter leading-[0.9] italic">
                {product.name}
            </h1>
            <p className="text-2xl font-black text-primary mb-8">${product.price?.toLocaleString()}</p>
            
            <div className="border-t border-black/10 pt-8 mb-10">
              <p className="text-black-solid/60 text-[14px] leading-relaxed font-light mb-8">
                {product.description}
              </p>
              
              <div className="flex gap-12">
                <div className="flex flex-col gap-1">
                  <p className="text-[8px] uppercase font-black text-black-solid/20 tracking-[0.2em]">Material</p>
                  <p className="text-[11px] font-bold text-black-solid/70">{product.material}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[8px] uppercase font-black text-black-solid/20 tracking-[0.2em]">Origin</p>
                  <p className="text-[11px] font-bold text-black-solid/70">{product.origin}</p>
                </div>
              </div>
            </div>

            {/* UPDATED: Button matches the new theme */}
            <button 
              onClick={() => addToCart(product)}
              className="w-full bg-black-solid text-white py-6 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-primary transition-all duration-500 rounded-2xl shadow-xl shadow-black/10 active:scale-[0.98]"
            >
              Add to Bag
            </button>
          </div>
        </div>

        {/* Related Products Section */}
        {related.length > 0 && (
          <section className="border-t border-black/10 pt-20">
            <div className="flex flex-col items-center mb-12">
                <h3 className="text-[10px] font-black tracking-[0.5em] text-black-solid uppercase mb-2">Explore Similar Pieces</h3>
                <div className="h-1 w-12 bg-primary rounded-full"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {related.map(item => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Matching Footer */}
      <footer className="w-full py-20 border-t border-black/10 text-center bg-white/20 mt-20">
          <h2 className="text-2xl font-black tracking-[0.4em] text-primary uppercase">LUXE</h2>
          <p className="text-[9px] uppercase tracking-[0.3em] text-black-solid/20 font-bold mt-4">
              © 2026 Luxury Reimagined — Handcrafted Excellence
          </p>
      </footer>
    </div>
  );
};

export default ProductDetail;