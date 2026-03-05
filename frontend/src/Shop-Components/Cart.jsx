import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useCart from './useCart';
import Navbar from './Navbar';
import Footer from './Footer';

function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-black select-none">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-5 md:px-10 lg:px-16 pt-10 pb-32 md:pb-24">

        {/* Header */}
        <div className="flex items-end justify-between border-b border-black/[0.08] pb-8 mb-10">
          <div className="flex items-center gap-5">
            <button onClick={() => navigate(-1)}
              className="group w-11 h-11 rounded-2xl border border-black/[0.08] bg-white hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all flex items-center justify-center shrink-0"
            >
              <span className="material-symbols-outlined text-[20px] text-black/40 group-hover:text-[#D4AF37] group-hover:-translate-x-0.5 transition-all">arrow_back_ios_new</span>
            </button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/25 mb-1">Review Selection</p>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">Your Cart</h1>
            </div>
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-black/25 hidden md:block">
            {cart.length} {cart.length === 1 ? 'piece' : 'pieces'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">

          {/* Items */}
          <div className="lg:col-span-7 space-y-4">
            {cart.length === 0 ? (
              <div className="py-28 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-black/[0.05] shadow-sm">
                <div className="w-20 h-20 rounded-[1.5rem] bg-black/[0.04] flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-4xl text-black/15">shopping_bag</span>
                </div>
                <p className="text-black/25 uppercase tracking-[0.4em] text-[11px] font-black mb-8">Your cart is empty</p>
                <Link to="/"
                  className="bg-black text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-[#D4AF37] transition-all shadow-lg"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id}
                  className="group flex gap-5 bg-white rounded-[2rem] border border-black/[0.05] p-5 hover:border-[#D4AF37]/25 hover:shadow-lg hover:shadow-black/[0.04] transition-all duration-300"
                >
                  <Link to={`/product/${item.id}`} className="shrink-0">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-[#F7F5F0] overflow-hidden border border-black/[0.04]">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  </Link>

                  <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-1">{item.category}</p>
                        <h3 className="font-black text-[16px] md:text-[18px] uppercase tracking-tight leading-tight truncate">{item.name}</h3>
                      </div>
                      <button onClick={() => removeFromCart(item.id)}
                        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-black/[0.04] text-black/30 hover:bg-red-50 hover:text-red-500 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center bg-black rounded-full overflow-hidden shadow-md">
                        <button onClick={() => updateQuantity(item.id, -1)} disabled={item.quantity <= 1}
                          className="w-10 h-10 flex items-center justify-center text-white hover:text-[#D4AF37] transition-colors disabled:opacity-25"
                        >
                          <span className="material-symbols-outlined text-[17px]">remove</span>
                        </button>
                        <span className="w-8 text-center text-[14px] font-black text-white tabular-nums">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)}
                          className="w-10 h-10 flex items-center justify-center text-white hover:text-[#D4AF37] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[17px]">add</span>
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black/25 mb-0.5">Subtotal</p>
                        <p className="text-2xl md:text-3xl font-black italic tracking-tighter">GH₵{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28 bg-[#0A0A0A] text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#D4AF37]/3 rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/[0.08]">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">Order Summary</h2>
                  <span className="text-[11px] font-black uppercase text-white/20">{cart.length} items</span>
                </div>

                {cart.length > 0 && (
                  <div className="space-y-3 mb-7">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span className="text-[12px] font-bold text-white/50 uppercase tracking-tight truncate max-w-[60%]">{item.name}</span>
                        <span className="text-[12px] font-black text-white/70">GH₵{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 mb-8 border-t border-white/[0.08] pt-6">
                  <div className="flex justify-between text-[12px] font-black uppercase tracking-wider">
                    <span className="text-white/35">Subtotal</span>
                    <span className="text-white/70">GH₵{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[12px] font-black uppercase tracking-wider">
                    <span className="text-white/35">Shipping</span>
                    <span className="text-[#D4AF37]">Calculated at Delivery</span>
                  </div>
                </div>

                <div className="pt-6 mb-8 border-t border-white/[0.08]">
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/25 mb-2">Grand Total</p>
                  <span className="text-5xl md:text-6xl font-black italic tracking-tighter text-white">GH₵{cartTotal.toLocaleString()}</span>
                </div>

                <button disabled={cart.length === 0} onClick={() => navigate('/checkout')}
                  className="w-full bg-[#D4AF37] text-black py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.35em] hover:brightness-110 transition-all active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed shadow-xl shadow-[#D4AF37]/20"
                >
                  Proceed to Checkout
                </button>

                <div className="mt-6 flex items-center justify-center gap-2 opacity-25">
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-black">Secured & Encrypted</p>
                </div>
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