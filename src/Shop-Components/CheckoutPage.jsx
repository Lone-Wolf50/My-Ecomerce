import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../Database-Server/Superbase-client.js";
import useCart from './useCart';
import DetailsNavBar from './DetailsNavBar';

const CheckoutPage = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [deliveryMethod, setDeliveryMethod] = useState('Pick-Up');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  const isCartEmpty = cart.length === 0;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isCartEmpty) {
      alert("Your cart is empty.");
      return;
    }

    setLoading(true);
    try {
      const finalTotal = deliveryMethod === 'Door Delivery' ? cartTotal + 25 : cartTotal;

      // Cleaned up items for Supabase readability
      const formattedItems = cart.map(item => ({
        product: item.name,
        quantity: item.quantity || 1,
        unit_price: item.price,
        subtotal: (item.price * (item.quantity || 1))
      }));

      const { error } = await supabase.from('orders').insert([{
          customer_name: formData.name,
          customer_email: formData.email,
          phone_number: formData.phone,
          delivery_method: deliveryMethod,
          payment_method: paymentMethod, 
          total_amount: finalTotal,
          items: formattedItems, 
          status: 'pending'
      }]);

      if (error) throw error;

      clearCart();
      navigate('/order-confirmed');
    } catch (error) {
      console.error("Database Error:", error.message);
      alert(`Transaction failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7] font-sans">
      <DetailsNavBar />

      <main className="flex-1 flex flex-col items-center pt-32 pb-20 px-6">
        <div className="mb-12 text-center max-w-md">
          <h2 className="text-[#D4AF37] tracking-[0.3em] text-[32px] font-bold uppercase">Checkout</h2>
          {isCartEmpty && (
            <p className="text-red-600 text-[11px] mt-2 font-black animate-pulse uppercase tracking-widest">
              Action Required: Your bag is empty
            </p>
          )}
        </div>

        <div className="w-full max-w-[580px] space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-10 shadow-xl border border-black/5">
            
            {/* Guest Info */}
            <div className="space-y-5">
              <input
                id="name" required type="text" placeholder="FULL NAME"
                className="w-full h-14 bg-white border-2 border-black/5 rounded-lg px-6 text-[12px] font-black uppercase focus:border-[#D4AF37] outline-none text-black/80"
                value={formData.name} onChange={handleInputChange}
              />

              <input
                id="email" required type="email"
                pattern=".+@gmail\.com" title="Only @gmail.com addresses are accepted"
                placeholder="GMAIL ADDRESS (@GMAIL.COM)"
                className="w-full h-14 bg-white border-2 border-black/5 rounded-lg px-6 text-[12px] font-black uppercase focus:border-[#D4AF37] outline-none text-black/80"
                value={formData.email} onChange={handleInputChange}
              />

              <input
                id="phone" required type="tel"
                pattern="[0-9]{10}" title="Must be exactly 10 digits"
                placeholder="PHONE NUMBER (10 DIGITS)"
                className="w-full h-14 bg-white border-2 border-black/5 rounded-lg px-6 text-[12px] font-black uppercase focus:border-[#D4AF37] outline-none text-black/80"
                value={formData.phone} onChange={handleInputChange}
              />
            </div>

            {/* Delivery Method */}
            <div className="mt-12 space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-black/50 mb-4">Delivery</h3>
              {[
                { id: 'Pick-Up', label: 'Pick-Up', price: 'Free' },
                { id: 'Door Delivery', label: 'Door Delivery', price: '$25.00' }
              ].map((opt) => (
                <div 
                  key={opt.id} onClick={() => setDeliveryMethod(opt.id)}
                  className={`flex items-center justify-between p-5 rounded-xl border-2 cursor-pointer transition-all ${deliveryMethod === opt.id ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-black/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${deliveryMethod === opt.id ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-black/20'}`} />
                    <span className={`text-[12px] font-black uppercase ${deliveryMethod === opt.id ? 'text-black' : 'text-black/40'}`}>{opt.label}</span>
                  </div>
                  <span className="text-[10px] font-black text-[#D4AF37]">{opt.price}</span>
                </div>
              ))}
            </div>

            {/* Payment Method */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              {['Cash', 'MoMo'].map((pay) => (
                <div 
                  key={pay} onClick={() => setPaymentMethod(pay)}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === pay ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-black/5'}`}
                >
                  <span className={`text-[12px] font-black uppercase ${paymentMethod === pay ? 'text-black' : 'text-black/40'}`}>{pay}</span>
                  <span className="text-[9px] text-black/30 font-bold uppercase mt-1">{pay === 'Cash' ? 'Pay on arrival' : 'Mobile Money'}</span>
                </div>
              ))}
            </div>

            <button 
              type="submit" 
              disabled={loading || isCartEmpty} 
              className={`w-full h-16 text-white rounded-xl mt-12 flex items-center justify-center gap-4 transition-all shadow-lg font-black text-[12px] uppercase tracking-[0.3em]
                ${isCartEmpty ? 'bg-black/10 cursor-not-allowed shadow-none' : 'bg-[#D4AF37] hover:bg-[#C5A028] shadow-[#D4AF37]/30'}`}
            >
              {loading ? "Transmitting..." : isCartEmpty ? "Bag is Empty" : "Confirm Order"}
              {!loading && !isCartEmpty && <span className="material-symbols-outlined font-bold">arrow_forward</span>}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;