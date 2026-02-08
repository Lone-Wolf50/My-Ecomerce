import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCart from './useCart';
import { supabase } from "../Database-Server/Superbase-client.js";
import Swal from 'sweetalert2';
import DetailsNavBar from './DetailsNavBar.jsx';

const CheckoutPage = () => {
    const { cart, cartTotal, handleConfirmOrder, isProcessing } = useCart() || { cart: [] };
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        customer_name: "",
        customer_email: "", 
        user_id: "", // REQUIRED for foreign key constraint
        phone_number: "",
        delivery_method: "pickup",
        payment_method: "cash"
    });

  useEffect(() => {
    const fetchUserData = async () => {
        try {
            // 1. Get the email from session storage
            const storedEmail = sessionStorage.getItem('userEmail');

            if (!storedEmail) {
                console.warn("No active session found in storage.");
                return; // Stop here if no email
            }

            // 2. Fetch profile from database
            // We fetch this fresh to ensure we have the most accurate UUID (id)
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('email', storedEmail)
                .maybeSingle();

            if (error) throw error;

            if (profile) {
                // 3. Update state and ensure session storage is synced
                sessionStorage.setItem('userUuid', profile.id);
                
                setFormData(prev => ({ 
                    ...prev, 
                    customer_email: storedEmail,
                    customer_name: profile.full_name,
                    user_id: profile.id // Critical for the 'orders' foreign key
                }));
                
                console.log("Checkout identity verified:", profile.id);
            }
        } catch (err) {
            console.error("Checkout Initialization Error:", err.message);
        }
    };

    fetchUserData();
}, []);
    const handleInput = (e) => {
        const { name, value } = e.target;
        if (name === "phone_number") {
            // This line strips away anything that isn't a number
            const onlyNums = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: onlyNums }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // --- REPLACE YOUR OLD onConfirm WITH THIS ---
    const onConfirm = async () => {
        // 1. Check for empty fields
        if (!formData.customer_name || !formData.customer_email || !formData.phone_number) {
            return Swal.fire("Required", "Please fill in all fields", "warning");
        }

        // 2. NEW: EXACT 10 DIGIT VALIDATION
        const phoneRegex = /^\d{10}$/; 
        if (!phoneRegex.test(formData.phone_number)) {
            return Swal.fire(
                "INVALID PHONE", 
                "Please enter exactly 10 digits (e.g., 05XXXXXXXX)", 
                "error"
            );
        }
        const result = await Swal.fire({
            title: 'CONFIRM ORDER',
            text: `Place order for $${cartTotal}?`,
            showCancelButton: true,
            confirmButtonColor: "#D4AF37",
            cancelButtonColor: "#000",
            background: "white",
            backdrop: `blur(10px)`
        });

        if (result.isConfirmed) {
            // Passing the updated formData including the user_id
            const response = await handleConfirmOrder(formData);
            if (response.success) {
                Swal.fire("ORDER SECURED", "Your order has been placed.", "success")
                .then(() => navigate('/order-confirmed'));
            } else {
                // If this still fails, your useCart.js might need to be checked
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
        <div className="min-h-screen bg-[#FDFBF7] py-20 px-4 select-none">
            <DetailsNavBar />
            <div className="max-w-xl mx-auto backdrop-blur-xl bg-white/40 border border-white/60 p-10 rounded-[2.5rem] shadow-2xl">
                <h1 className="text-4xl font-serif text-[#D4AF37] mb-12 text-center uppercase tracking-widest">Checkout</h1>
                
                <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
                    <div className="space-y-6">
                        <div className="group">
                            <label className="text-[15px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                            <input 
                                name="customer_name" 
                                value={formData.customer_name} 
                                placeholder="YOUR NAME" 
                                onChange={handleInput} 
                                className="w-full bg-transparent border-b border-gray-200 py-3 text-[14px] tracking-widest outline-none focus:border-[#D4AF37] transition-all" 
                            />
                        </div>
                        
                        <div className="group">
                            <label className="text-[15px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Email (Verified)</label>
                            <input 
                                name="customer_email" 
                                value={formData.customer_email} 
                                readOnly 
                                className="w-full bg-black/5 border-b border-gray-200 py-3 px-2 text-[14px] tracking-widest outline-none text-gray-400 cursor-not-allowed italic" 
                            />
                        </div>
                        
                        <div className="group">
                            <label className="text-[15px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Number</label>
                            <input 
                                name="phone_number" 
                                placeholder="0XX XXX XXXX" 
                                maxLength={10} 
                                onChange={handleInput} 
                                className="w-full bg-transparent border-b border-gray-200 py-3 text-[14px] tracking-widest outline-none focus:border-[#D4AF37] transition-all" 
                            />
                        </div>
                    </div>

                    <div className="pt-10 flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grand Total</span>
                            <span className="text-2xl font-serif text-[#D4AF37]">GH&#8373; {cartTotal}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={onConfirm} 
                            disabled={isProcessing}
                            className="bg-black text-white px-10 py-5 rounded-full text-[9px] font-black tracking-widest hover:bg-[#D4AF37] transition-all disabled:opacity-30 shadow-lg active:scale-95"
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