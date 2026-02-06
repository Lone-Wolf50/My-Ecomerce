import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from "../Database-Server/Superbase-client.js";
import Swal from 'sweetalert2';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory');
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    name: '', price: '', description: '', category: '',
    material: '', origin: '', series: '', image: ''
  };
  const [form, setForm] = useState(initialForm);

  // FIX 1: Wrap fetchProducts in useCallback to prevent it from being recreated every render
  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setProducts(data);
  }, []);

  // FIX 2: Ensure the dependency array is empty so this ONLY runs once on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // NEW: Handle Local Image Upload to Supabase Storage
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-uploads/${fileName}`;

      // 1. Upload to 'product-images' bucket (Make sure this bucket is PUBLIC in Supabase)
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setForm((prev) => ({ ...prev, image: data.publicUrl }));
      toast("Image uploaded to vault");
    } catch (err) {
      Swal.fire("Upload Error", err.message, "error");
    } finally {
      setUploading(false);
    }
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Safety check: Don't allow submission if image upload hasn't finished
    if (!form.image) {
      return Swal.fire("Missing Asset", "Please upload an image first.", "warning");
    }

    setLoading(true);

    try {
      // 1. Prepare the payload with a numeric price
      const payload = { 
        ...form, 
        price: parseFloat(form.price) 
      };
      
      if (editingId) {
        // UPDATE: 'id' is already in the database
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        toast("Registry Updated");
      } else {
        // INSERT: Generate a new ID manually to avoid the "null" constraint error
        const newProduct = {
          ...payload,
          id: crypto.randomUUID() // Generates a unique string for your 'text' id column
        };

        const { error } = await supabase
          .from('products')
          .insert([newProduct]);

        if (error) throw error;
        toast("Product Archived");
      }

      // 2. Reset everything back to default
      setForm(initialForm);
      setEditingId(null);
      setActiveTab('inventory');
      fetchProducts(); // Refresh the list
      
    } catch (err) {
      console.error("Archive Error:", err.message);
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (product) => {
    setForm(product);
    setEditingId(product.id);
    setActiveTab('add');
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'CONFIRM DELETION',
      text: "This artifact will be purged from the archives.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#000',
      cancelButtonColor: '#d33',
      confirmButtonText: 'DELETE'
    });

    if (result.isConfirmed) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
      toast("Deleted successfully");
    }
  };

  const toast = (msg) => {
    Swal.fire({ title: msg, icon: "success", timer: 2000, showConfirmButton: false, background: "#FDFBF7" });
  };

  const totalValue = products.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-black font-sans flex">
      {/* SIDEBAR NAVIGATION */}
      <nav className="w-64 border-r border-black/10 p-8 flex flex-col justify-between h-screen sticky top-0 bg-[#FDFBF7] z-10">
        <div>
          <h1 className="text-2xl font-serif italic mb-12 tracking-tighter text-[#D4AF37]">Atelier Admin</h1>
          <ul className="space-y-6">
            <li onClick={() => setActiveTab('inventory')} className={`cursor-pointer text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${activeTab === 'inventory' ? 'text-[#D4AF37]' : 'text-black/40 hover:text-black'}`}>Inventory</li>
            <li onClick={() => { setActiveTab('add'); setEditingId(null); setForm(initialForm); }} className={`cursor-pointer text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${activeTab === 'add' ? 'text-[#D4AF37]' : 'text-black/40 hover:text-black'}`}>Add Product</li>
            <li onClick={() => setActiveTab('stats')} className={`cursor-pointer text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${activeTab === 'stats' ? 'text-[#D4AF37]' : 'text-black/40 hover:text-black'}`}>Analytics</li>
          </ul>
        </div>
        <button onClick={() => { sessionStorage.clear(); window.location.assign('/login'); }} className="text-[10px] font-black uppercase border border-black px-6 py-3 rounded-full hover:bg-black hover:text-white transition-all">Logout</button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-12 overflow-y-auto">
        
        {activeTab === 'inventory' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl font-serif italic mb-8">Current Collection</h2>
            <div className="grid grid-cols-1 gap-2">
              <div className="grid grid-cols-6 p-4 text-[9px] font-black uppercase text-black/40 border-b border-black/10">
                <div className="col-span-2">Product</div>
                <div>Category</div>
                <div>Price</div>
                <div>Origin</div>
                <div className="text-right">Actions</div>
              </div>
              {products.map(p => (
                <div key={p.id} className="grid grid-cols-6 p-6 items-center border border-black/5 bg-white rounded-xl hover:shadow-2xl hover:shadow-black/5 transition-all">
                  <div className="col-span-2 flex items-center gap-4">
                    <img src={p.image} className="w-12 h-12 object-cover rounded bg-gray-100" alt={p.name} />
                    <div>
                      <div className="font-bold text-xs uppercase tracking-tight">{p.name}</div>
                      <div className="text-[10px] text-black/40 italic">{p.series || 'Masterpiece'}</div>
                    </div>
                  </div>
                  <div className="text-[11px] font-medium uppercase">{p.category}</div>
                  <div className="text-[11px] font-bold">${p.price?.toLocaleString()}</div>
                  <div className="text-[11px] uppercase tracking-widest">{p.origin}</div>
                  <div className="text-right space-x-4">
                    <button onClick={() => handleEdit(p)} className="text-[9px] font-black uppercase text-[#D4AF37]">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-[9px] font-black uppercase text-red-400">Void</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'add' && (
  <div className="max-w-2xl animate-in fade-in slide-in-from-right-4 duration-500">
    <h2 className="text-4xl font-serif italic mb-8">{editingId ? 'Modify Artifact' : 'Add New Entry'}</h2>
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-8 gap-y-6">
      <div className="col-span-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Product Name</label>
        <input required className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Price (USD)</label>
        <input required type="number" step="0.01" className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Category</label>
        <input required className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
      </div>

      {/* IMAGE UPLOAD REMAINS THE SAME */}
        {/* NEW IMAGE UPLOAD BLOCK */}
              <div className="col-span-2 p-6 border-2 border-dashed border-black/10 rounded-3xl bg-black/5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 block mb-4">Visual Documentation (Local Upload)</label>
                <div className="flex items-center gap-6">
                  {form.image && (
                    <img src={form.image} className="w-24 h-24 object-cover rounded-2xl border border-black/10" alt="Preview" />
                  )}
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="text-[10px] uppercase font-black cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-black file:text-white hover:file:bg-[#D4AF37] transition-all"
                    />
                    <p className="text-[9px] text-black/40 mt-2">Max size 5MB. Format: JPG, PNG, WEBP.</p>
                  </div>
                </div>
                {uploading && <div className="mt-4 h-1 w-full bg-black/5 rounded-full overflow-hidden"><div className="h-full bg-[#D4AF37] animate-progress"></div></div>}
              </div>

      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Material</label>
        <input className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold" value={form.material} onChange={e => setForm({...form, material: e.target.value})} />
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Origin</label>
        <input className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold" value={form.origin} onChange={e => setForm({...form, origin: e.target.value})} />
      </div>

      {/* FIXED: Added Series input here */}
      <div className="col-span-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Series / Collection</label>
        <input className="w-full bg-transparent border-b border-black/20 p-2 focus:border-[#D4AF37] outline-none font-bold italic" placeholder="Masterpiece" value={form.series} onChange={e => setForm({...form, series: e.target.value})} />
      </div>

      <div className="col-span-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Description</label>
        <textarea rows="3" className="w-full bg-transparent border border-black/10 p-4 focus:border-[#D4AF37] outline-none rounded-xl mt-2 font-medium" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
      </div>
      <button disabled={loading || uploading} className="col-span-2 bg-black text-white py-6 rounded-full text-[11px] font-black uppercase tracking-[0.3em] hover:bg-[#D4AF37] disabled:bg-black/20 transition-all">
        {loading ? 'Transmitting...' : (editingId ? 'Update Registry' : 'Archive Product')}
      </button>
    </form>
  </div>
)}


        {activeTab === 'stats' && (
          <div className="animate-in zoom-in-95 duration-500">
            <h2 className="text-4xl font-serif italic mb-12">Vault Analytics</h2>
            <div className="grid grid-cols-3 gap-8">
              <div className="p-10 bg-white border border-black/5 rounded-[3rem] shadow-sm">
                <div className="text-[10px] font-black uppercase text-black/30 mb-2">Inventory Depth</div>
                <div className="text-5xl font-serif italic">{products.length}</div>
                <div className="text-[10px] mt-4 uppercase font-bold text-[#D4AF37]">Active SKUs</div>
              </div>
              <div className="p-10 bg-white border border-black/5 rounded-[3rem] shadow-sm">
                <div className="text-[10px] font-black uppercase text-black/30 mb-2">Total Asset Value</div>
                <div className="text-5xl font-serif italic">${(totalValue / 1000).toFixed(1)}k</div>
                <div className="text-[10px] mt-4 uppercase font-bold text-[#D4AF37]">Market Estimate</div>
              </div>
              <div className="p-10 bg-white border border-black/5 rounded-[3rem] shadow-sm">
                <div className="text-[10px] font-black uppercase text-black/30 mb-2">Category Spread</div>
                <div className="text-5xl font-serif italic">{categories.length}</div>
                <div className="text-[10px] mt-4 uppercase font-bold text-[#D4AF37]">Distinct Collections</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;