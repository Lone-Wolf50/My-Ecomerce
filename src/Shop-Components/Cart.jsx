import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useCart from './useCart';
import Navbar from './Navbar';

function Cart() {
    // Note: ensure your useCart returns 'cart'. If it returns 'cartItems', change it here.
    const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-cream text-black-solid selection:bg-primary/30 select-none">
            <Navbar />
            
            <main className="max-w-[1440px] mx-auto px-6 md:px-12 pt-40 pb-20">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/10 pb-12 mb-16">
                    <div className="flex items-center gap-8">
                        <button 
                            onClick={() => navigate(-1)}
                            className="group flex items-center justify-center size-12 rounded-full border border-black/10 hover:border-primary/50 transition-all duration-500 bg-white/40 backdrop-blur-sm"
                        >
                            <span className="material-symbols-outlined text-black-solid/40 group-hover:text-primary group-hover:-translate-x-1 transition-all duration-300">
                                arrow_back_ios_new
                            </span>
                        </button>

                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-none">
                            The <span className="text-primary">Cart</span>
                        </h1>
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-black-solid/30">
                        {cart.length} pieces in your vault
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                    {/* Items List */}
                    <div className="lg:col-span-8 space-y-10">
                        {cart.length === 0 ? (
                            <div className="py-40 flex flex-col items-center justify-center border border-black/5 bg-white/40 backdrop-blur-xl rounded-[3rem] shadow-xl shadow-black/5">
                                <span className="material-symbols-outlined text-7xl text-primary/20 mb-6">shopping_bag</span>
                                <p className="text-black-solid/30 uppercase tracking-[0.5em] text-[10px] font-black mb-10">Your vault is currently empty</p>
                                <Link to="/" className="bg-black-solid text-white px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-primary transition-all duration-500 shadow-xl">
                                    Continue Shopping
                                </Link>
                            </div>
                        ) : (
                            cart.map((item) => (
                                /* UNIFIED GLASS CONTAINER CARD */
                                <div key={item.id} className="group relative flex flex-col md:flex-row gap-10 p-8 bg-white/40 backdrop-blur-xl border border-black/5 rounded-[3rem] shadow-2xl shadow-black/5 transition-all duration-500 hover:border-primary/20">
                                    
                                    {/* Product Image Container */}
                                    <div className="w-full md:w-64 aspect-[4/5] bg-cream rounded-[2rem] overflow-hidden p-8 flex items-center justify-center shrink-0 border border-black/5 shadow-inner">
                                        <img 
                                            src={item.image} 
                                            alt={item.name} 
                                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000" 
                                        />
                                    </div>

                                    {/* Info & Controls Box - This is the unified part you requested */}
                                    <div className="flex flex-col justify-between flex-grow py-2">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <div className="max-w-[80%]">
                                                    <h3 className="text-3xl font-black tracking-tighter uppercase italic text-black-solid leading-none group-hover:text-primary transition-colors">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-[10px] uppercase tracking-[0.4em] text-primary font-black mt-3">
                                                        {item.category}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="size-10 flex items-center justify-center rounded-full bg-black-solid/5 text-black-solid/20 hover:bg-red-500 hover:text-white transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-xl">close</span>
                                                </button>
                                            </div>
                                            <p className="mt-6 text-[14px] text-black-solid/40 font-light leading-relaxed max-w-sm italic">
                                                Exquisite detailing with signature LUXE craftsmanship.
                                            </p>
                                        </div>

                                        {/* Bottom Control Bar */}
                                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-12 pt-8 border-t border-black/5">
                                            
                                            {/* Quantity Selector Pill */}
                                            <div className="flex flex-col gap-3">
                                                <span className="text-[8px] uppercase tracking-[0.3em] font-black text-black-solid/20">Set Quantity</span>
                                                <div className="flex items-center bg-black-solid rounded-full px-6 py-3 gap-8 w-fit shadow-xl shadow-black/10">
                                                    <button 
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="text-white hover:text-primary transition-colors font-black"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">remove</span>
                                                    </button>
                                                    <span className="text-sm font-black text-white tabular-nums min-w-[12px] text-center">{item.quantity}</span>
                                                    <button 
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="text-white hover:text-primary transition-colors font-black"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">add</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Price grouping */}
                                            <div className="text-right">
                                                <p className="text-[10px] text-black-solid/30 uppercase tracking-[0.3em] font-black mb-1">Subtotal</p>
                                                <p className="text-4xl font-black italic tracking-tighter text-black-solid">
                                                    ${(item.price * item.quantity).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="bg-white/60 border border-black/5 backdrop-blur-3xl p-10 md:p-12 rounded-[3.5rem] sticky top-32 shadow-2xl shadow-black/5">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-10 pb-4 border-b border-black/10">
                                Investment Summary
                            </h2>
                            
                            <div className="space-y-6 mb-12">
                                <div className="flex justify-between text-black-solid/40 uppercase tracking-widest text-[10px] font-black">
                                    <span>Subtotal</span>
                                    <span className="text-black-solid font-black">${cartTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-black-solid/40 uppercase tracking-widest text-[10px] font-black">
                                    <span>Insurance & Freight</span>
                                    <span className="text-primary font-black">Complimentary</span>
                                </div>
                            </div>

                            <div className="pt-8 mb-12 border-t border-black/10">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black-solid/20 mb-2">Grand Total</p>
                                <span className="text-5xl md:text-6xl font-black italic tracking-tighter text-black-solid">
                                    ${cartTotal.toLocaleString()}
                                </span>
                            </div>

                            <button className="w-full bg-black-solid text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] hover:bg-primary transition-all duration-500 shadow-xl shadow-black/10 active:scale-95">
                                Checkout Securely
                            </button>

                            <div className="mt-8 flex flex-col items-center gap-2 opacity-20">
                                <span className="material-symbols-outlined text-xl">verified_user</span>
                                <p className="text-[8px] uppercase tracking-[0.2em] font-black">Fully Encrypted Transaction</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Standard Block Footer */}
            <footer className="w-full py-20 border-t border-black/10 text-center bg-white/40 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-2xl font-black tracking-[0.4em] text-primary uppercase">LUXE</h2>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-black-solid/20 font-bold mt-4">
                        © 2026 Luxury Reimagined — Lone Wolf Collection
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default Cart;