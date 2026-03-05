import { useState } from "react";
import { Link } from "react-router-dom";
import useCart from "./useCart";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const discount = product.previous_price
    ? Math.round((1 - product.price / product.previous_price) * 100)
    : null;

  return (
    <div
      className="group relative flex flex-col bg-white overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-black/[0.08]"
      style={{ borderRadius: "18px" }}
    >
      {/* Image */}
      <Link
        to={`/product/${product.id}`}
        className="block relative overflow-hidden bg-[#F4F1EC]"
        style={{ aspectRatio: "4/5" }}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />

        {/* Bottom gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Series badge */}
        {product.series && (
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-md text-black/55 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
              {product.series}
            </span>
          </div>
        )}

        {/* Discount badge */}
        {discount && (
          <div className="absolute top-3 right-3">
            <span className="bg-[#C9A227] text-white text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
              −{discount}%
            </span>
          </div>
        )}

        {/* Add to cart — slides up on hover */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAdd}
            className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all duration-300 active:scale-95 ${
              added
                ? "bg-emerald-500 text-white"
                : "bg-[#0A0A0A]/90 text-white backdrop-blur-sm hover:bg-[#C9A227]"
            }`}
          >
            {added ? "✓ Added" : "Add to Cart"}
          </button>
        </div>
      </Link>

      {/* Info */}
      <div className="px-4 pt-3.5 pb-4">
        <p className="text-[8px] font-black uppercase tracking-[0.35em] text-[#C9A227] mb-1">
          {product.category}
        </p>
        <Link to={`/product/${product.id}`}>
          <h3 className="text-[13px] font-black uppercase tracking-tight text-black leading-snug line-clamp-1 group-hover:text-[#C9A227] transition-colors duration-300">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-end gap-2 mt-2.5">
          <span className="text-[15px] font-black text-black tracking-tight leading-none">
            GH₵{product.price?.toLocaleString()}
          </span>
          {product.previous_price && (
            <span className="text-[11px] text-black/25 line-through mb-px">
              GH₵{product.previous_price?.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}