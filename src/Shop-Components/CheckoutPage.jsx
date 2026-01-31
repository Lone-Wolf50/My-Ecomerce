import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCart from './useCart';
import { supabase } from "../Database-Server/Superbase-client.js";
import Swal from 'sweetalert2';
import DetailsNavBar from './DetailsNavBar.jsx';

const CheckoutPage = () => {
    const { cart, cartTotal, handleConfirmOrder, isProcessing } = useCart() || { cart: [] };
    const navigate = useNavigate();
    const [loggedInEmail, setLoggedInEmail] = useState("");
    const [formData, setFormData] = useState({
        customer_name: "",
        customer_email: "",
        phone_number: "",
        delivery_method: "pickup",
        payment_method: "cash"
    });

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setLoggedInEmail(user.email);
        };
        checkUser();
    }, []);

    const handleInput = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onConfirm = async () => {
        if (!formData.customer_name || !formData.customer_email || !formData.phone_number) {
            return Swal.fire("Required", "Please fill in all fields", "warning");
        }
        
        if (formData.customer_email.trim().toLowerCase() !== loggedInEmail.toLowerCase()) {
            return Swal.fire("Verification Failed", `Please enter your account email: ${loggedInEmail}`, "error");
        }

        const result = await Swal.fire({
            title: 'CONFIRM ORDER',
            text: `Place order for $${cartTotal}?`,
            showCancelButton: true,
            confirmButtonColor: "#D4AF37",
            cancelButtonColor: "#000",
            background: "rgba(255,255,255,0.9)",
            backdrop: `blur(10px)`
        });

        if (result.isConfirmed) {
            const response = await handleConfirmOrder(formData);
            if (response.success) {
                Swal.fire("ORDER SECURED", "Your order has been placed.", "success")
                .then(() => navigate('/order-confirmed'));
            } else {
                Swal.fire("TRANSACTION ERROR", response.error, "error");
            }
        }
    };

    if (cart.length === 0 && !isProcessing) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <button onClick={() => navigate('/')} className="text-[#D4AF37] font-black tracking-widest border-b border-[#D4AF37] pb-2">BACK TO SHOP</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] py-20 px-4">
             <DetailsNavBar  />
            <div className="max-w-xl mx-auto backdrop-blur-xl bg-white/40 border border-white/60 p-10 rounded-[2.5rem] shadow-2xl">
           
                <h1 className="text-4xl font-serif text-[#D4AF37] mb-12 text-center uppercase tracking-widest">Checkout</h1>
                
                <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
                    <div className="space-y-6">
                        <input name="customer_name" placeholder="FULL NAME" onChange={handleInput} 
                            className="w-full bg-transparent border-b border-gray-200 py-3 text-[11px] tracking-widest outline-none focus:border-[#D4AF37] transition-all" />
                        
                        <input name="customer_email" placeholder="CONFIRM ACCOUNT EMAIL" onChange={handleInput} 
                            className="w-full bg-transparent border-b border-gray-200 py-3 text-[11px] tracking-widest outline-none focus:border-[#D4AF37] transition-all" />
                        
                        <input name="phone_number" placeholder="PHONE NUMBER" maxLength={10} onChange={handleInput} 
                            className="w-full bg-transparent border-b border-gray-200 py-3 text-[11px] tracking-widest outline-none focus:border-[#D4AF37] transition-all" />
                    </div>

                    <div className="pt-10 flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Grand Total</span>
                            <span className="text-3xl font-serif text-[#D4AF37]">${cartTotal}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={onConfirm} 
                            disabled={isProcessing}
                            className="bg-black text-white px-10 py-5 rounded-full text-[10px] font-black tracking-widest hover:bg-[#D4AF37] transition-all disabled:opacity-30"
                        >
                            {isProcessing ? "PROCESSING..." : "CONFIRM →"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CheckoutPage;