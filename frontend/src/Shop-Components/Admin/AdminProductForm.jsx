import React, { useState, useEffect } from "react";
import { RotateCcw, Save } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

/* Service role client — bypasses RLS for read access */
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * AdminProductForm
 * Self-fetches live categories so the dropdown always reflects
 * the latest state from the Collections tab — no prop needed.
 */
const AdminProductForm = ({
  form, setForm, editingId,
  loading, uploading,
  categories: categoriesProp = [],   // fallback if parent passes them
  onSubmit, onReset, onImageUpload,
}) => {
  const [liveCategories, setLiveCategories] = useState([]);

  /* Fetch categories fresh every time the form mounts or an edit begins */
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const { data } = await supabaseAdmin
          .from("homepage_categories")
          .select("id, name, slug")
          .eq("is_active", true)
          .order("sort_order");
        if (data && data.length > 0) setLiveCategories(data);
      } catch (err) {
        console.error("AdminProductForm category fetch:", err.message);
      }
    };
    fetchCats();
  }, [editingId]); // re-fetch when switching between add/edit

  // Use self-fetched categories first, fall back to parent prop
  const categories = liveCategories.length > 0 ? liveCategories : categoriesProp;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const inputCls =
    "w-full h-12 px-4 rounded-xl border border-black/[0.09] bg-[#F7F5F0] text-[14px] font-bold text-black outline-none focus:border-[#D4AF37]/65 transition-colors placeholder:text-black/22";
  const labelCls =
    "block text-[10px] font-black uppercase tracking-[0.38em] text-black/35 mb-2";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Page header */}
      <div className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.38em] text-black/22 mb-2">
          {editingId ? "Editing Existing Record" : "New Entry"}
        </p>
        <h2 className="text-4xl font-serif italic text-black">
          {editingId ? "Edit Product" : "Add Product"}
        </h2>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">

        {/* Name */}
        <div className="md:col-span-2">
          <label className={labelCls}>Product Name *</label>
          <input
            type="text" required
            value={form.name} onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. The Heritage Satchel"
            className={inputCls}
          />
        </div>

        {/* Category — live dropdown from homepage_categories */}
        <div>
          <label className={labelCls}>
            Category *
            {categories.length === 0 && (
              <span className="ml-2 normal-case font-medium text-amber-500">
                (no categories yet — add in Collections tab)
              </span>
            )}
          </label>
          <div className="relative">
            <select
              required
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={`${inputCls} appearance-none pr-10 cursor-pointer`}
            >
              <option value="" disabled>Select a category…</option>
              {categories.length > 0
                ? categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))
                : /* fallback if DB hasn't loaded */
                  ["crossbody", "underarm", "picnic", "limited"].map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-black/28">
              expand_more
            </span>
          </div>
          {form.category && (
            <p className="text-[10px] text-black/28 font-medium mt-1.5 ml-1">
              Route: <span className="text-[#D4AF37]">/shop/{form.category}</span>
            </p>
          )}
        </div>

        {/* Series */}
        <div>
          <label className={labelCls}>Series / Line</label>
          <input
            type="text"
            value={form.series} onChange={(e) => set("series", e.target.value)}
            placeholder="e.g. Maison Signature"
            className={inputCls}
          />
        </div>

        {/* Price */}
        <div>
          <label className={labelCls}>Price (GH₵) *</label>
          <input
            type="number" required min="0" step="0.01"
            value={form.price} onChange={(e) => set("price", e.target.value)}
            placeholder="0.00"
            className={inputCls}
          />
        </div>

        {/* Previous price */}
        <div>
          <label className={labelCls}>
            Previous Price (GH₵)
            <span className="ml-1 normal-case font-medium text-black/25">optional — shows Sale badge</span>
          </label>
          <input
            type="number" min="0" step="0.01"
            value={form.previous_price} onChange={(e) => set("previous_price", e.target.value)}
            placeholder="Leave blank if not on sale"
            className={inputCls}
          />
        </div>

        {/* Material */}
        <div>
          <label className={labelCls}>Material</label>
          <input
            type="text"
            value={form.material} onChange={(e) => set("material", e.target.value)}
            placeholder="e.g. Full-grain leather"
            className={inputCls}
          />
        </div>

        {/* Origin */}
        <div>
          <label className={labelCls}>Origin</label>
          <input
            type="text"
            value={form.origin} onChange={(e) => set("origin", e.target.value)}
            placeholder="e.g. Florence, Italy"
            className={inputCls}
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className={labelCls}>Description *</label>
          <textarea
            required rows={4}
            value={form.description} onChange={(e) => set("description", e.target.value)}
            placeholder="Describe the product in detail…"
            className="w-full px-4 py-3 rounded-xl border border-black/[0.09] bg-[#F7F5F0] text-[14px] font-bold text-black outline-none focus:border-[#D4AF37]/65 transition-colors resize-none placeholder:text-black/22"
          />
        </div>

        {/* Image upload */}
        <div className="md:col-span-2">
          <label className={labelCls}>Product Image *</label>
          <div className="flex items-center gap-5">
            {/* Preview */}
            <div className="w-24 h-24 rounded-2xl border border-black/[0.09] bg-[#F7F5F0] overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
              {form.image ? (
                <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[28px] text-black/15">image</span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <label className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-xl cursor-pointer transition-all text-[11px] font-black uppercase tracking-widest ${
                uploading
                  ? "bg-black/5 text-black/25 cursor-wait"
                  : "bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white border border-[#D4AF37]/18"
              }`}>
                <span className="material-symbols-outlined text-[18px]">
                  {uploading ? "hourglass_empty" : "cloud_upload"}
                </span>
                {uploading ? "Uploading…" : form.image ? "Replace Image" : "Upload Image"}
                <input
                  type="file" accept="image/*" className="hidden"
                  onChange={onImageUpload} disabled={uploading}
                />
              </label>

              {form.image && (
                <button
                  type="button"
                  onClick={() => set("image", "")}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-red-400 hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 pt-5 border-t border-black/[0.07]">
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-10 py-4 rounded-2xl bg-[#0A0A0A] text-white text-[12px] font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-all shadow-xl shadow-black/10 active:scale-[0.98] disabled:opacity-40"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Save size={16} />
                {editingId ? "Update Product" : "Save to Vault"}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-black/[0.05] text-black/50 text-[12px] font-black uppercase tracking-widest hover:bg-black/[0.1] transition-all active:scale-[0.98] disabled:opacity-40"
          >
            <RotateCcw size={15} />
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;