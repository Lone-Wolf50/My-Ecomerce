import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const AdminInventory = ({ products, onEdit, onDelete }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-black/20 mb-2">
          {products.length} Assets Archived
        </p>
        <h2 className="text-4xl font-serif italic">Current Collection</h2>
      </div>

      {/* Desktop header row */}
      <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] px-6 mb-3 text-[9px] font-black uppercase tracking-[0.25em] text-black/25">
        <div>Product</div>
        <div>Category</div>
        <div>Price</div>
        <div>Origin</div>
        <div className="text-right pr-2">Actions</div>
      </div>

      <div className="space-y-2">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] items-center
              p-5 md:px-6 md:py-4 rounded-2xl
              bg-white border border-black/[0.06] hover:border-[#D4AF37]/30
              hover:shadow-lg hover:shadow-black/[0.04]
              transition-all duration-300 gap-4 md:gap-0 group"
          >
            {/* Product */}
            <div className="w-full flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={p.image}
                  className="w-14 h-14 object-cover rounded-xl bg-gray-50"
                  alt={p.name}
                />
                <div className="absolute inset-0 rounded-xl ring-1 ring-black/5" />
              </div>
              <div>
                <p className="font-black text-[13px] uppercase tracking-tight leading-tight">{p.name}</p>
                <p className="text-[11px] text-black/35 italic font-medium mt-0.5">{p.series || 'Masterpiece'}</p>
              </div>
            </div>

            {/* Category */}
            <div className="w-full flex justify-between md:block">
              <span className="md:hidden text-[9px] font-black uppercase text-black/20">Category</span>
              <span className="text-[12px] font-bold uppercase tracking-wide text-black/60">{p.category}</span>
            </div>

            {/* Price */}
            <div className="w-full flex justify-between md:block">
              <span className="md:hidden text-[9px] font-black uppercase text-black/20">Price</span>
              <div>
                <span className="text-[14px] font-black text-[#D4AF37]">GH₵{p.price?.toLocaleString()}</span>
                {p.previous_price && (
                  <span className="block text-[10px] text-black/25 line-through">
                    GH₵{p.previous_price.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Origin */}
            <div className="w-full flex justify-between md:block">
              <span className="md:hidden text-[9px] font-black uppercase text-black/20">Origin</span>
              <span className="text-[12px] uppercase tracking-widest text-black/40 font-medium">{p.origin || '—'}</span>
            </div>

            {/* Actions */}
            <div className="w-full flex justify-end gap-2 pt-3 md:pt-0 border-t md:border-none border-black/5">
              <button
                onClick={() => onEdit(p)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-all"
              >
                <Pencil size={11} /> Edit
              </button>
              <button
                onClick={() => onDelete(p.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 size={11} /> Void
              </button>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="py-24 text-center rounded-[2.5rem] border-2 border-dashed border-black/5">
            <p className="text-black/20 font-serif italic text-xl">Vault is empty.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInventory;