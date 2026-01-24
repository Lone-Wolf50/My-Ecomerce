import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import  useCart from './useCart';
import Navbar from './Navbar';

function Cart() {
    const { cart, removeFromCart, updateQuantity, cartTotal,  } = useCart();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary-gold/30 select-none">
			<Navbar />
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-20">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-12 mb-16">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-12 mb-16">
                    <div className="flex items-center gap-8">
                        {/* THE HIDDEN BACK ARROW (Minimalist) */}
                        <button 
                            onClick={() => navigate(-1)}
                            className="group flex items-center justify-center size-12 rounded-full border border-white/10 hover:border-primary-gold/50 transition-all duration-500 bg-white/5 backdrop-blur-sm"
                        >
                            <span className="material-symbols-outlined text-white/40 group-hover:text-primary-gold group-hover:-translate-x-1 transition-all duration-300">
                                arrow_back_ios_new
                            </span>
                        </button>

                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic">
                            The <span className="text-primary-gold">Cart</span>
                           
                           
                        </h1>
                    </div>
                </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                    {/* Items List - DIFFERENT items wrap below automatically via map */}
                    <div className="lg:col-span-8 space-y-12">
                        {cart.length === 0 ? (
                            <div className="py-32 flex flex-col items-center justify-center border border-white/5 bg-white/[0.02] rounded-[2rem]">
                                <span className="material-symbols-outlined text-6xl text-white/10 mb-6">shopping_bag</span>
                                <p className="text-off-white/30 uppercase tracking-[0.3em] text-xs font-bold mb-8">The bag is empty</p>
                                <Link to="/" className="bg-primary-gold text-black px-12 py-5 rounded-full font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 transition-all">
                                    Explore Collection
                                </Link>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.id} className="flex flex-col md:flex-row gap-10 group relative">
                                    {/* Product Image */}
                                    <div className="w-full md:w-64 aspect-[4/5] bg-white rounded-[2rem] overflow-hidden p-8 flex items-center justify-center shrink-0 shadow-2xl shadow-primary-gold/5">
                                        <img 
                                            src={item.image} 
                                            alt={item.name} 
                                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" 
                                        />
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex flex-col justify-between flex-grow py-4">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-3xl font-black tracking-tighter uppercase italic group-hover:text-primary-gold transition-colors">
                                                    {item.name}
                                                </h3>
                                                <button 
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="size-10 flex items-center justify-center rounded-full border border-white/10 text-white/20 hover:border-red-500 hover:text-red-500 transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-xl">close</span>
                                                </button>
                                            </div>
                                            <p className="text-[11px] uppercase tracking-[0.3em] text-primary-gold font-black mt-2">
                                                {item.category}
                                            </p>
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mt-12">
                                            {/* Quantity Controls */}
                                            <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-6 py-3 gap-8 w-fit">
                                                <button 
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="text-lg hover:text-primary-gold transition-colors font-black"
                                                >
                                                    —
                                                </button>
                                                <span className="text-sm font-black min-w-[20px] text-center">{item.quantity}</span>
                                                <button 
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="text-lg hover:text-primary-gold transition-colors font-black"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Item Price Total */}
                                            <div className="text-right">
                                                <p className="text-xs text-white/30 uppercase tracking-widest font-bold mb-1">Subtotal</p>
                                                <p className="text-3xl font-black italic tracking-tighter">
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
                        <div className="bg-white/[0.03] border border-white/10 backdrop-blur-3xl p-12 rounded-[2.5rem] sticky top-32 shadow-2xl shadow-black">
                            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary-gold mb-10 pb-4 border-b border-white/10">
                                Order Summary
                            </h2>
                            
                            <div className="space-y-6 mb-12">
                                <div className="flex justify-between text-off-white/40 uppercase tracking-widest text-[10px] font-black">
                                    <span>Bag Subtotal</span>
                                    <span className="text-white">${cartTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-off-white/40 uppercase tracking-widest text-[10px] font-black">
                                    <span>Shipping & Handling</span>
                                    <span className="text-primary-gold">Complimentary</span>
                                </div>
                            </div>

                            <div className="pt-8 mb-12 flex justify-between items-end border-t border-white/10">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Total Amount</p>
                                    <span className="text-5xl font-black italic tracking-tighter text-white">
                                        ${cartTotal.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <button className="w-full bg-white text-black py-6 rounded-full font-black text-[11px] uppercase tracking-[0.3em] hover:bg-primary-gold transition-all duration-500 shadow-xl active:scale-95">
                                Finalize Order
                            </button>

                            <p className="mt-8 text-center text-[9px] uppercase tracking-[0.2em] text-white/20 font-bold leading-relaxed">
                                Secure Encrypted Checkout <br/> Global Express Shipping Included
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Cart;