import React from 'react';
import { Link } from 'react-router-dom';
import useCart from './useCart';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  return (
    <div className="group w-full h-full flex flex-col bg-white/[0.03] backdrop-blur-md border border-white/10 p-4 rounded-[2rem] hover:border-primary-gold/40 transition-all duration-500 shadow-xl">
      {/* Image: Rounded corners to match the card */}
      <Link to={`/product/${product.id}`} className="block aspect-[4/5] overflow-hidden bg-white rounded-[1.5rem] mb-4">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
      </Link>

      <div className="flex flex-col flex-grow text-center mb-4 px-2">
        <Link to={`/product/${product.id}`} className="block mb-1 group-hover:text-primary-gold transition-colors">
          <h3 className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] leading-tight min-h-[2.2rem] flex items-center justify-center">
            {product.name}
          </h3>
        </Link>
        <p className="text-primary-gold font-medium text-[11px] md:text-xs mt-auto">
          ${product.price}
        </p>
      </div>

      <button 
        onClick={() => addToCart(product)}
        className="w-full py-4 bg-white/[0.08] hover:bg-primary-gold hover:text-black border border-white/10 text-white text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 rounded-xl"
      >
        Add to Cart
      </button>
    </div>
  );
}