import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useCart from './useCart';
import Navbar from './Navbar';
import Footer from './Footer';

function Cart() {
    const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-cream text-black-solid selection:bg-primary/30 select-none">
            <Navbar />
            
            <main className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 pt-32 md:pt-40 pb-20">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 border-b border-black/10 pb-8 md:pb-12 mb-8 md:mb-16">
                    <div className="flex items-center gap-4 md:gap-8">
                        <button 
                            onClick={() => navigate(-1)}
                            className="group flex items-center justify-center size-10 md:size-12 rounded-full border border-black/10 hover:border-primary/50 transition-all duration-500 bg-white/40 backdrop-blur-sm shrink-0"
                        >
                            <span className="material-symbols-outlined text-xl md:text-2xl text-black-solid/80 group-hover:text-primary group-hover:-translate-x-1 transition-all duration-300">
                                arrow_back_ios_new
                            </span>
                        </button>

                        <h1 className="text-3xl md:text-6xl lg:text-8xl font-black tracking-tighter uppercase italic leading-none">
                            The <span className="text-primary">Cart</span>
                        </h1>
                    </div>
                    <p className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-black-solid/30">
                        {cart.length} {cart.length === 1 ? 'item' : 'items'}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-20">
                    {/* Items List */}
                    <div className="lg:col-span-8 space-y-4 md:space-y-6">
                        {cart.length === 0 ? (
                            <div className="py-20 md:py-40 flex flex-col items-center justify-center border border-black/5 bg-white/40 backdrop-blur-xl rounded-3xl md:rounded-[3rem] shadow-xl shadow-black/5">
                                <span className="material-symbols-outlined text-5xl md:text-7xl text-primary/20 mb-4 md:mb-6">shopping_bag</span>
                                <p className="text-black-solid/30 uppercase tracking-[0.3em] md:tracking-[0.5em] text-[9px] md:text-[10px] font-black mb-6 md:mb-10">Your cart is empty</p>
                                <Link to="/" className="bg-black-solid text-white px-8 md:px-12 py-4 md:py-5 rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.25em] md:tracking-[0.3em] hover:bg-primary transition-all duration-500 shadow-xl">
                                    Continue Shopping
                                </Link>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.id} className="group relative bg-white/50 backdrop-blur-xl border border-black/5 rounded-2xl md:rounded-3xl shadow-lg shadow-black/5 transition-all duration-500 hover:border-primary/20 hover:shadow-xl overflow-hidden">
                                    
                                    {/* Mobile Layout */}
                                    <div className="md:hidden">
                                        <div className="relative">
                                            <div className="aspect-[16/9] bg-cream p-4 flex items-center justify-center border-b border-black/5">
                                                <img 
                                                    src={item.image} 
                                                    alt={item.name} 
                                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" 
                                                />
                                            </div>
                                            <button 
                                                onClick={() => removeFromCart(item.id)}
                                                className="absolute top-3 right-3 size-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-black-solid/60 hover:bg-red-500 hover:text-white transition-all shadow-md"
                                            >
                                                <span className="material-symbols-outlined text-lg">close</span>
                                            </button>
                                        </div>

                                        <div className="p-4 space-y-4">
                                            <div>
                                                <h3 className="text-xl font-black tracking-tight uppercase text-black-solid leading-tight group-hover:text-primary transition-colors">
                                                    {item.name}
                                                </h3>
                                                <p className="text-[11px] uppercase tracking-[0.3em] text-primary font-black mt-1.5">
                                                    {item.category}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between gap-4 pt-4 border-t border-black/5">
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[10px] uppercase tracking-wider font-black text-black-solid/50">Qty</span>
                                                    <div className="flex items-center bg-black-solid rounded-full px-4 py-2 gap-4 shadow-md">
                                                        <button 
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                            disabled={item.quantity <= 1}
                                                            className="text-white hover:text-primary transition-colors font-black disabled:opacity-30"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">remove</span>
                                                        </button>
                                                        <span className="text-sm font-black text-white tabular-nums min-w-[16px] text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <button 
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            className="text-white hover:text-primary transition-colors font-black"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">add</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-[10px] text-black-solid/40 uppercase tracking-wider font-black mb-1">Total</p>
                                                    <p className="text-2xl font-black italic tracking-tighter text-black-solid">
                                                        GH₵{(item.price * item.quantity).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tablet/Desktop Layout */}
                                    <div className="hidden md:flex gap-6 lg:gap-8 p-5 lg:p-6">
                                        <div className="w-32 lg:w-48 aspect-[3/4] bg-cream rounded-2xl overflow-hidden p-4 lg:p-6 flex items-center justify-center shrink-0 border border-black/5 shadow-inner">
                                            <img 
                                                src={item.image} 
                                                alt={item.name} 
                                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000" 
                                            />
                                        </div>

                                        <div className="flex flex-col justify-between flex-grow">
                                            <div>
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <h3 className="text-2xl lg:text-3xl font-black tracking-tighter uppercase text-black-solid leading-none group-hover:text-primary transition-colors">
                                                            {item.name}
                                                        </h3>
                                                        <p className="text-[12px] lg:text-[14px] uppercase tracking-[0.3em] lg:tracking-[0.4em] text-primary font-black mt-2 lg:mt-3">
                                                            {item.category}
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="size-9 lg:size-10 flex items-center justify-center rounded-full bg-black-solid/5 text-black-solid/60 hover:bg-red-500 hover:text-white transition-all"
                                                    >
                                                        <span className="material-symbols-outlined text-lg lg:text-xl">close</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-end justify-between gap-6 mt-6 lg:mt-8 pt-5 lg:pt-6 border-t border-black/5">
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[11px] lg:text-[13px] uppercase tracking-[0.25em] font-black text-black-solid/60">Quantity</span>
                                                    <div className="flex items-center bg-black-solid rounded-full px-5 lg:px-6 py-2.5 lg:py-3 gap-6 lg:gap-8 shadow-xl shadow-black/10">
                                                        <button 
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                            disabled={item.quantity <= 1}
                                                            className="text-white hover:text-primary transition-colors font-black disabled:opacity-30"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">remove</span>
                                                        </button>
                                                        <span className="text-sm font-black text-white tabular-nums min-w-[12px] text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <button 
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            className="text-white hover:text-primary transition-colors font-black"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">add</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-[13px] lg:text-[15px] text-black-solid/30 uppercase tracking-[0.25em] lg:tracking-[0.3em] font-black mb-1">Subtotal</p>
                                                    <p className="text-3xl lg:text-4xl font-black italic tracking-tighter text-black-solid">
                                                        GH₵{(item.price * item.quantity).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="lg:sticky lg:top-32 bg-white/60 border border-black/5 backdrop-blur-3xl p-6 md:p-8 lg:p-10 rounded-3xl md:rounded-[3.5rem] shadow-2xl shadow-black/5">
                            <h2 className="text-[13px] md:text-[15px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-primary mb-6 md:mb-10 pb-3 md:pb-4 border-b border-black/10">
                                Order Summary
                            </h2>
                            
                            <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
                                <div className="flex justify-between text-black-solid/40 uppercase tracking-wider text-[11px] md:text-[12px] font-black">
                                    <span>Subtotal</span>
                                    <span className="text-black-solid font-black">GH₵{cartTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-black-solid/40 uppercase tracking-wider text-[11px] md:text-[12px] font-black">
                                    <span>Shipping</span>
                                    <span className="text-primary font-black">Free</span>
                                </div>
                            </div>

                            <div className="pt-6 md:pt-8 mb-8 md:mb-12 border-t border-black/10">
                                <p className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-black-solid/50 mb-2">Grand Total</p>
                                <span className="text-4xl md:text-5xl lg:text-6xl font-black italic tracking-tighter text-black-solid">
                                    GH₵{cartTotal.toLocaleString()}
                                </span>
                            </div>

                            <button 
                                disabled={cart.length === 0}
                                onClick={() => navigate('/checkout')} 
                                className="w-full bg-black-solid text-white py-4 md:py-5 lg:py-6 rounded-2xl font-black text-[11px] md:text-[12px] uppercase tracking-[0.3em] md:tracking-[0.4em] hover:bg-primary transition-all duration-500 shadow-xl shadow-black/10 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Proceed to Checkout
                            </button>

                            <div className="mt-6 md:mt-8 flex flex-col items-center gap-2 opacity-20">
                                <span className="material-symbols-outlined text-lg md:text-xl">verified_user</span>
                                <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black text-center">Secure Payment</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Cart;