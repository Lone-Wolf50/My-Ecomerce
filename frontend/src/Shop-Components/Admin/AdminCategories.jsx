import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Plus, Pencil, Trash2, GripVertical, Eye, EyeOff,
  ImageIcon, Save, X, Loader2, CheckCircle2, AlertCircle,
  Layers, RefreshCw, Upload,
} from "lucide-react";
import Swal from "sweetalert2";

/* ── Admin Supabase client — uses service role key to bypass RLS ──
   Add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file.
   NEVER expose this in user-facing code — admin panel only. */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const Toast = ({ msg, type }) => {
  if (!msg) return null;
  const ok = type === "success";
  return (
    <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-[11px] font-black uppercase tracking-widest border ${
      ok ? "bg-emerald-500 text-white border-emerald-400" : "bg-red-500 text-white border-red-400"
    }`}>
      {ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {msg}
    </div>
  );
};

export default function AdminCategories({ onCategoriesChange }) {
  const [cats, setCats]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState({ msg: "", type: "" });
  const [editId, setEditId]       = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [name, setName]           = useState("");
  const [slug, setSlug]           = useState("");
  const [imageUrl, setImageUrl]   = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive]   = useState(true);
  const toastTimer  = useRef(null);
  const fileInputRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  const fetchCats = async () => {
    console.log("[AdminCategories] Fetching categories...");
    setLoading(true);
    const { data, error } = await supabase
      .from("homepage_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[AdminCategories] Fetch error:", error);
      showToast(error.message, "error");
    } else {
      console.log("[AdminCategories] Fetched", data?.length, "categories:", data);
      const fresh = data || [];
      setCats(fresh);
      // Notify parent (AdminDashboard) so ProductForm dropdown stays in sync
      onCategoriesChange?.(fresh);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCats(); }, []);

  const openNew = () => {
    console.log("[AdminCategories] Opening new category form");
    setEditId(null);
    setName(""); setSlug(""); setImageUrl(""); setImageFile(null); setImagePreview("");
    setSortOrder(cats.length); setIsActive(true);
    setShowForm(true);
  };

  const openEdit = (c) => {
    console.log("[AdminCategories] Opening edit for category:", c.id, c.name);
    setEditId(c.id);
    setName(c.name || "");
    setSlug(c.slug || "");
    setImageUrl(c.image_url || "");
    setImageFile(null);
    setImagePreview(c.image_url || "");
    setSortOrder(c.sort_order ?? 0);
    setIsActive(c.is_active ?? true);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setImageFile(null);
    setImagePreview("");
  };

  /* Handle local file selection */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log("[AdminCategories] Image file selected:", file.name, file.size);
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  /* Upload image file to supabase bucket "product-images" */
  const uploadImage = async (file) => {
    console.log("[AdminCategories] Uploading image to product-images bucket...");
    setUploadingImg(true);
    const ext      = file.name.split(".").pop();
    const fileName = `categories/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    setUploadingImg(false);

    if (error) {
      console.error("[AdminCategories] Image upload error:", error);
      throw new Error(`Image upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(data.path);

    console.log("[AdminCategories] Image uploaded successfully. Public URL:", urlData.publicUrl);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!name.trim()) { showToast("Name is required", "error"); return; }
    setSaving(true);
    console.log(`[AdminCategories] ${editId ? "Updating" : "Creating"} category "${name.trim()}"...`);

    try {
      let finalImageUrl = imageUrl.trim();

      /* If a new file was selected, upload it first */
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const payload = {
        name:       name.trim(),
        slug:       slug.trim() || name.trim().toLowerCase().replace(/\s+/g, "-"),
        image_url:  finalImageUrl,
        sort_order: Number(sortOrder),
        is_active:  isActive,
      };

      console.log("[AdminCategories] Payload to save:", payload);

      if (editId) {
        console.log("[AdminCategories] Executing UPDATE for id:", editId);
        const { data, error } = await supabase
          .from("homepage_categories")
          .update(payload)
          .eq("id", editId)
          .select();

        if (error) {
          console.error("[AdminCategories] UPDATE error:", error);
          // RLS 42501 hint
          if (error.code === "42501") {
            showToast("Permission denied — check Supabase RLS policies", "error");
          } else {
            showToast(error.message, "error");
          }
          setSaving(false);
          return;
        }
        console.log("[AdminCategories] UPDATE successful. Rows updated:", data);
        showToast("Collection updated ✓");
      } else {
        console.log("[AdminCategories] Executing INSERT...");
        const { data, error } = await supabase
          .from("homepage_categories")
          .insert([payload])
          .select();

        if (error) {
          console.error("[AdminCategories] INSERT error:", error);
          if (error.code === "42501") {
            showToast("Permission denied — check Supabase RLS policies (42501)", "error");
          } else {
            showToast(error.message, "error");
          }
          setSaving(false);
          return;
        }
        console.log("[AdminCategories] INSERT successful. New row:", data);
        showToast("Collection created ✓");
      }

      closeForm();
      fetchCats();
    } catch (err) {
      console.error("[AdminCategories] Save exception:", err);
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, catName) => {
    const result = await Swal.fire({
      title: "Delete Collection?",
      text: `"${catName}" will be removed from the homepage.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#1a1a1a",
      confirmButtonText: "Yes, delete",
      background: "#fff", color: "#000",
      customClass: {
        popup: "rounded-[2rem] border border-black/10",
        confirmButton: "rounded-full px-8 py-2.5 text-[10px] font-black uppercase tracking-widest",
        cancelButton:  "rounded-full px-8 py-2.5 text-[10px] font-black uppercase tracking-widest",
      },
    });
    if (!result.isConfirmed) return;
    console.log("[AdminCategories] Deleting category:", id, catName);
    const { error } = await supabase.from("homepage_categories").delete().eq("id", id);
    if (error) {
      console.error("[AdminCategories] DELETE error:", error);
      showToast(error.message, "error");
    } else {
      console.log("[AdminCategories] Deleted successfully:", id);
      showToast("Collection deleted");
      fetchCats();
    }
  };

  const toggleActive = async (cat) => {
    const newVal = !cat.is_active;
    console.log("[AdminCategories] Toggling visibility for:", cat.id, "→", newVal);
    const { error } = await supabase
      .from("homepage_categories")
      .update({ is_active: newVal })
      .eq("id", cat.id);
    if (error) {
      console.error("[AdminCategories] Toggle error:", error);
      showToast(error.message, "error");
    } else {
      console.log("[AdminCategories] Toggle successful:", cat.id, "is_active →", newVal);
      fetchCats();
    }
  };

  return (
    /* ── Light theme for this panel ── */
    <div className="min-h-screen bg-[#F7F5F0] text-black p-5 md:p-8">
      <Toast msg={toast.msg} type={toast.type} />

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C9A227] mb-1">Admin · Collections</p>
          <h1 className="text-2xl font-black uppercase tracking-wider text-black flex items-center gap-3">
            <Layers size={22} className="text-[#C9A227]" /> Homepage Collections
          </h1>
          <p className="text-[11px] text-black/40 font-medium mt-1">Manage the category sections shown on the homepage</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCats}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-black/[0.04] border border-black/[0.1] transition-all shadow-sm"
          >
            <RefreshCw size={15} className="text-black/40" />
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A227] text-black text-[11px] font-black uppercase tracking-widest hover:bg-[#e0b82d] transition-all shadow-md shadow-[#C9A227]/20"
          >
            <Plus size={14} strokeWidth={3} /> New Collection
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total",  value: cats.length,                           color: "text-black" },
          { label: "Active", value: cats.filter(c => c.is_active).length,  color: "text-emerald-600" },
          { label: "Hidden", value: cats.filter(c => !c.is_active).length, color: "text-red-500" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-black/[0.07] rounded-2xl px-5 py-4 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-black/35 mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="text-[#C9A227] animate-spin" />
        </div>
      ) : cats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-black/[0.04] flex items-center justify-center">
            <Layers size={28} className="text-black/20" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-widest text-black/30">No collections yet</p>
          <button onClick={openNew} className="px-6 py-2.5 rounded-xl bg-[#C9A227] text-black text-[10px] font-black uppercase tracking-widest">
            Create First
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {cats.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-4 bg-white border border-black/[0.07] rounded-2xl px-5 py-4 hover:border-[#C9A227]/30 transition-all group shadow-sm"
            >
              <GripVertical size={16} className="text-black/15 shrink-0 cursor-grab" />
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/[0.04] border border-black/[0.07] shrink-0">
                {cat.image_url
                  ? <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={18} className="text-black/20" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[13px] font-black text-black">{cat.name}</p>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    cat.is_active
                      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                      : "text-red-500 bg-red-50 border-red-200"
                  }`}>{cat.is_active ? "Active" : "Hidden"}</span>
                </div>
                <p className="text-[10px] text-black/40 font-mono">/{cat.slug}</p>
                <p className="text-[9px] text-black/25 mt-0.5">Sort: {cat.sort_order}</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleActive(cat)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/[0.04] hover:bg-black/[0.08] border border-black/[0.08] transition-all"
                >
                  {cat.is_active
                    ? <Eye size={14} className="text-emerald-500" />
                    : <EyeOff size={14} className="text-red-400" />}
                </button>
                <button
                  onClick={() => openEdit(cat)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/[0.04] hover:bg-[#C9A227]/15 border border-black/[0.08] hover:border-[#C9A227]/30 transition-all"
                >
                  <Pencil size={13} className="text-[#C9A227]" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/[0.04] hover:bg-red-50 border border-black/[0.08] hover:border-red-200 transition-all"
                >
                  <Trash2 size={13} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Form ── */}
      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative w-full max-w-md bg-white border border-black/[0.09] rounded-3xl p-7 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            {/* Gold top accent */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9A227]/50 to-transparent rounded-t-3xl" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#C9A227] mb-0.5">{editId ? "Editing" : "Creating"}</p>
                <h2 className="text-[16px] font-black uppercase tracking-wider text-black">{editId ? "Edit Collection" : "New Collection"}</h2>
              </div>
              <button
                onClick={closeForm}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/[0.04] hover:bg-black/[0.08] text-black/30 hover:text-black transition-all"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-black/40 mb-2">Name *</label>
                <input
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (!editId) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                  }}
                  placeholder="e.g. New Arrivals"
                  className="w-full bg-[#F7F5F0] border border-black/[0.09] rounded-xl px-4 py-3 text-[13px] text-black placeholder-black/25 focus:outline-none focus:border-[#C9A227] transition-all"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-black/40 mb-2">Slug</label>
                <input
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="auto-generated"
                  className="w-full bg-[#F7F5F0] border border-black/[0.09] rounded-xl px-4 py-3 text-[13px] text-black placeholder-black/25 focus:outline-none focus:border-[#C9A227] transition-all font-mono"
                />
              </div>

              {/* Image upload — no URL typing */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-black/40 mb-2">
                  Category Image
                </label>

                {/* Image preview / placeholder */}
                <div
                  className="relative w-full h-36 rounded-2xl overflow-hidden border-2 border-dashed border-black/[0.12] bg-[#F7F5F0] flex items-center justify-center cursor-pointer hover:border-[#C9A227]/50 hover:bg-[#C9A227]/[0.03] transition-all group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="preview" className="w-full h-full object-cover" onError={() => setImagePreview("")} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex flex-col items-center gap-1.5 text-white">
                          <Upload size={20} />
                          <p className="text-[9px] font-black uppercase tracking-widest">Change Image</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-black/30 group-hover:text-[#C9A227] transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-black/[0.05] group-hover:bg-[#C9A227]/10 flex items-center justify-center transition-colors">
                        <ImageIcon size={20} />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-wider">Click to upload image</p>
                        <p className="text-[9px] font-medium mt-0.5">JPG, PNG, WebP — max 5MB</p>
                      </div>
                    </div>
                  )}
                  {uploadingImg && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 size={24} className="text-[#C9A227] animate-spin" />
                    </div>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {imageFile && (
                  <p className="text-[9px] font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
                    <CheckCircle2 size={11} /> {imageFile.name} — will upload on save
                  </p>
                )}
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-black/40 mb-2">Sort Order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                  className="w-full bg-[#F7F5F0] border border-black/[0.09] rounded-xl px-4 py-3 text-[13px] text-black focus:outline-none focus:border-[#C9A227] transition-all"
                />
              </div>

              {/* Visibility toggle */}
              <div className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-[#F7F5F0] border border-black/[0.07]">
                <div>
                  <p className="text-[12px] font-black text-black">Visible on Homepage</p>
                  <p className="text-[10px] text-black/35 font-medium">Show this collection to shoppers</p>
                </div>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`w-12 h-6 rounded-full transition-all relative ${isActive ? "bg-[#C9A227]" : "bg-black/[0.1]"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isActive ? "left-7" : "left-1"}`} />
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeForm}
                className="flex-1 py-3 rounded-xl border border-black/[0.1] text-[10px] font-black uppercase tracking-widest text-black/40 hover:bg-black/[0.04] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploadingImg}
                className="flex-1 py-3 rounded-xl bg-[#C9A227] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#e0b82d] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-[#C9A227]/20"
              >
                {(saving || uploadingImg)
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Save size={13} />}
                {uploadingImg ? "Uploading…" : saving ? "Saving…" : editId ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}