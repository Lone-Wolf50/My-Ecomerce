import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
        user_id: "", 
        phone_number: "",
        delivery_method: "pickup",
        payment_method: "paystack"
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const storedEmail = sessionStorage.getItem('userEmail');
                if (!storedEmail) return;

                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .eq('email', storedEmail)
                    .maybeSingle();

                if (error) throw error;

                if (profile) {
                    sessionStorage.setItem('userUuid', profile.id);
                    setFormData(prev => ({ 
                        ...prev, 
                        customer_email: storedEmail,
                        customer_name: profile.full_name,
                        user_id: profile.id 
                    }));
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
            const onlyNums = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: onlyNums }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
const payWithPaystack = () => {
    const paystack = new window.PaystackPop();
    
    // Formula to pass the 1.95% fee to the customer
    // We use Math.ceil to avoid losing fractions of a pesewa
    const priceInPesewas = cartTotal * 100;
    const totalToCharge = Math.ceil(priceInPesewas / (1 - 0.0195)); 

    paystack.newTransaction({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: formData.customer_email,
        amount: totalToCharge, 
        currency: "GHS",
        ref: `TRX-${Math.floor(Math.random() * 1000000000 + 1)}`,
        
        metadata: {
            custom_fields: [
                { display_name: "Customer Name", variable_name: "customer_name", value: formData.customer_name },
                { display_name: "User ID", variable_name: "user_id", value: formData.user_id },
                { display_name: "Phone", variable_name: "phone_number", value: formData.phone_number }
            ]
        },
        // IMPORTANT: Rename 'callback' to 'onSuccess'
        onSuccess: async (response) => {
            await handlePostPayment(response.reference);
        },
        // IMPORTANT: Rename 'onClose' to 'onCancel'
        onCancel: () => {
            Swal.fire("CANCELLED", "Transaction was not completed.", "info");
        },
    });
};

    const handlePostPayment = async (reference) => {
    const orderData = {
        ...formData,
        payment_reference: reference,
        status: 'paid'
    };

    const response = await handleConfirmOrder(orderData);

    if (response.success) {
        // 1. Fire the email (we do this in the background)
       axios.post(`${import.meta.env.VITE_API_URL}/send-status-update`, {
            email: formData.customer_email,
            customerName: formData.customer_name,
            orderId: reference,
            totalAmount: cartTotal
        }).catch(err => console.error("Email notification failed:", err));
        // 2. Show SweetAlert and THEN navigate to home (not order-confirmed)
        Swal.fire({
            title: "ORDER SECURED",
            text: "Payment successful. Your assets are being prepared.",
            icon: "success",
            confirmButtonColor: "#000000",
            confirmButtonText: "BACK TO SHOP"
        }).then(() => {
            navigate('/'); // Redirect to Home or Shop instead of /order-confirmed
        });
    } else {
        Swal.fire("DATABASE ERROR", "Payment verified but order saving failed. Please contact support.", "error");
    }
};
    const onConfirm = () => {
        if (!formData.customer_name || !formData.customer_email || !formData.phone_number) {
            return Swal.fire("Required", "Please fill in all fields", "warning");
        }
        if (!/^\d{10}$/.test(formData.phone_number)) {
            return Swal.fire("INVALID PHONE", "Please enter exactly 10 digits", "error");
        }

        payWithPaystack();
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
                            <input name="customer_name" value={formData.customer_name} placeholder="YOUR NAME" onChange={handleInput} className="w-full bg-transparent border-b border-gray-200 py-3 text-[14px] tracking-widest outline-none focus:border-[#D4AF37] transition-all" />
                        </div>
                        <div className="group">
                            <label className="text-[15px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Email (Verified)</label>
                            <input name="customer_email" value={formData.customer_email} readOnly className="w-full bg-black/5 border-b border-gray-200 py-3 px-2 text-[14px] tracking-widest outline-none text-gray-400 cursor-not-allowed italic" />
                        </div>
                        <div className="group">
                            <label className="text-[15px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Number</label>
                            <input name="phone_number" value={formData.phone_number} placeholder="0XX XXX XXXX" maxLength={10} onChange={handleInput} className="w-full bg-transparent border-b border-gray-200 py-3 text-[14px] tracking-widest outline-none focus:border-[#D4AF37] transition-all" />
                        </div>
                    </div>
                    <div className="pt-10 flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grand Total</span>
                            <span className="text-2xl font-serif text-[#D4AF37]">GH₵ {cartTotal}</span>
                        </div>
                        <button type="button" onClick={onConfirm} disabled={isProcessing} className="bg-black text-white px-10 py-5 rounded-full text-[9px] font-black tracking-widest hover:bg-[#D4AF37] transition-all disabled:opacity-30 shadow-lg active:scale-95">
                            {isProcessing ? "PROCESSING..." : "PAY NOW →"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CheckoutPage;