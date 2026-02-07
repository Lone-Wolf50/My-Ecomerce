import React from 'react';
import { Link } from 'react-router-dom';
import useCart from './useCart';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  return (
    /* UPDATED: Changed to light glass style (bg-white/40) and black borders */
    <div className="group w-full h-full flex flex-col bg-white/40 backdrop-blur-md border border-black/5 p-4 rounded-[2.5rem] hover:border-primary/40 transition-all duration-500 shadow-xl shadow-black/5">
      
      {/* Image Container */}
      <Link to={`/product/${product.id}`} className="block aspect-[4/5] overflow-hidden bg-cream rounded-[2rem] mb-4 border border-black/5">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
      </Link>

      <div className="flex flex-col flex-grow text-center mb-4 px-2">
        <Link to={`/product/${product.id}`} className="block mb-1 group-hover:text-primary transition-colors">
          {/* UPDATED: Text color to black-solid */}
          <h3 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] leading-tight min-h-[2.2rem] flex items-center justify-center text-black-solid">
            {product.name}
          </h3>
        </Link>
        {/* UPDATED: Price color to primary gold */}
        <p className="text-primary font-bold text-[12px] md:text-sm mt-auto">
          GH&#8373;{product.price}
        </p>
      </div>

      {/* UPDATED: Button colors for light theme */}
      <button 
        onClick={() => addToCart(product)}
        className="w-full py-4 bg-black-solid hover:bg-primary text-white text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 rounded-2xl shadow-lg shadow-black/10"
      >
        Add to Cart
      </button>
    </div>
  );
}