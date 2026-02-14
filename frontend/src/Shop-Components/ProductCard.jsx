import { Link } from 'react-router-dom';
import useCart from './useCart';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  return (
    /* Compact, professional card with balanced proportions */
    <div className="group w-full flex flex-col bg-white/60 backdrop-blur-md border border-black/5 rounded-3xl hover:border-primary/40 hover:shadow-2xl transition-all duration-500 shadow-lg shadow-black/5 overflow-hidden">
      
      {/* Image Container - 3:4 aspect ratio for better proportions */}
      <Link to={`/product/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-cream">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Subtle overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>
      </Link>

      {/* Content Section - Compact padding */}
      <div className="flex flex-col p-4 md:p-5 gap-3">
        {/* Product Name */}
        <Link to={`/product/${product.id}`} className="block group-hover:text-primary transition-colors">
          <h3 className="text-xs md:text-sm font-black uppercase tracking-wider leading-tight text-black-solid line-clamp-2 min-h-[2rem] md:min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>
        
        {/* Price & Button Row */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-primary font-black text-base md:text-lg">
            GH₵{product.price.toLocaleString()}
          </p>
          
          <button 
            onClick={() => addToCart(product)}
            className="flex items-center justify-center gap-1.5 px-4 md:px-5 py-2 md:py-2.5 bg-black-solid hover:bg-primary text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all duration-500 rounded-full shadow-md hover:shadow-lg active:scale-95"
          >
            <span className="hidden md:inline">Add</span>
            <span className="material-symbols-outlined text-sm md:text-base">add_shopping_cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
