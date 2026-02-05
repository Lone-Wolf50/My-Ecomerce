import React, { useLayoutEffect, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../Database-Server/Superbase-client.js";
import ProductCard from "./ProductCard";
import useCart from "./useCart";
import DetailsNavBar from "./DetailsNavBar";

const ProductDetail = () => {
    const { id } = useParams();
    // Destructure 'cart' so we can watch it for changes
    const { addToCart, cart } = useCart();

    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- 1. CART SYNC TO DATABASE ---
    // This effect handles the 'upsert' logic to prevent 409 Conflict errors.
    // It runs every time the 'cart' state changes.
    useEffect(() => {
        const syncCartToSupabase = async () => {
            const storedUuid = sessionStorage.getItem('userUuid');
            
            // Only sync if there is a logged-in user and items in the cart
            if (storedUuid && cart && cart.length > 0) {
                try {
                    const { error } = await supabase
                        .from('active_sessions_cart')
                        .upsert({ 
                            user_id: storedUuid, 
                            items: cart, 
                            updated_at: new Date().toISOString() 
                        }, { onConflict: 'user_id' }); // KEY FIX: Updates if exists, inserts if not.

                    if (error) throw error;
                    console.log("DEBUG: Cart synced successfully.");
                } catch (err) {
                    console.error("DEBUG: Cart Sync Error:", err.message);
                }
            }
        };

        syncCartToSupabase();
    }, [cart]);

    // --- 2. VIEWPORT MANAGEMENT ---
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTo(0, 0);
    }, [id]);

    // --- 3. DATA FETCHING ---
    useEffect(() => {
        const fetchProductData = async () => {
            setLoading(true);
            try {
                // Fetch main product details
                const { data: mainProduct, error: productError } = await supabase
                    .from("products")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (productError) throw productError;
                setProduct(mainProduct);

                // Fetch related products in the same category
                if (mainProduct) {
                    const { data: relatedData, error: relatedError } = await supabase
                        .from("products")
                        .select("*")
                        .eq("category", mainProduct.category)
                        .neq("id", id)
                        .limit(4);

                    if (relatedError) throw relatedError;
                    setRelated(relatedData || []);
                }
            } catch (error) {
                console.error("Error fetching product details:", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [id]);

    // --- 4. RENDER STATES ---
    if (loading)
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <div className="text-primary font-black uppercase tracking-[0.5em] animate-pulse">
                    Curating Details...
                </div>
            </div>
        );

    if (!product)
        return (
            <div className="p-20 text-primary font-black bg-cream min-h-screen flex flex-col items-center justify-center gap-6">
                <p className="tracking-widest uppercase">Archive piece not found.</p>
                <p className="text-black-solid/20 text-[10px]">Reference ID: {id}</p>
            </div>
        );

    return (
        <div className="bg-cream min-h-screen selection:bg-primary/20 text-black-solid">
            <DetailsNavBar category={product.category} />

            <main
                key={id}
                className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-40 pb-12 animate-in fade-in duration-700"
            >
                <div className="flex flex-col lg:flex-row gap-10 lg:h-[75vh] items-stretch mb-24">
                    {/* Image Box */}
                    <div className="w-full lg:w-[60%] bg-white/40 backdrop-blur-xl rounded-[3rem] border border-black/5 flex items-center justify-center p-8 lg:p-16 shadow-2xl shadow-black/5 overflow-hidden">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain animate-in zoom-in-95 duration-1000 drop-shadow-2xl"
                        />
                    </div>

                    {/* Content Box */}
                    <div className="w-full lg:w-[40%] flex flex-col justify-center max-w-[420px] mx-auto lg:ml-auto lg:mr-0">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.6em] mb-3">
                            {product.series}
                        </p>
                        <h1 className="text-4xl lg:text-6xl font-black text-black-solid uppercase mb-4 tracking-tighter leading-[0.9] italic">
                            {product.name}
                        </h1>
                        <p className="text-2xl font-black text-primary mb-8">
                            ${product.price?.toLocaleString()}
                        </p>

                        <div className="border-t border-black/10 pt-8 mb-10">
                            <p className="text-black-solid/60 text-[14px] leading-relaxed font-light mb-8">
                                {product.description}
                            </p>

                            <div className="flex gap-12">
                                <div className="flex flex-col gap-1">
                                    <p className="text-[8px] uppercase font-black text-black-solid/20 tracking-[0.2em]">
                                        Material
                                    </p>
                                    <p className="text-[11px] font-bold text-black-solid/70">
                                        {product.material}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-[8px] uppercase font-black text-black-solid/20 tracking-[0.2em]">
                                        Origin
                                    </p>
                                    <p className="text-[11px] font-bold text-black-solid/70">
                                        {product.origin}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => addToCart(product)}
                            className="w-full bg-black-solid text-white py-6 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-primary transition-all duration-500 rounded-2xl shadow-xl shadow-black/10 active:scale-[0.98]"
                        >
                            Add to Bag
                        </button>
                    </div>
                </div>

                {/* Related Products */}
                {related.length > 0 && (
                    <section className="border-t border-black/10 pt-20">
                        <div className="flex flex-col items-center mb-12">
                            <h3 className="text-[10px] font-black tracking-[0.5em] text-black-solid uppercase mb-2">
                                Explore Similar Pieces
                            </h3>
                            <div className="h-1 w-12 bg-primary rounded-full"></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {related.map((item) => (
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