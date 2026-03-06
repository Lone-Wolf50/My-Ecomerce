import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useCart from "./useCart";
import { supabase } from "../Database-Server/Superbase-client.js";
import Swal from "sweetalert2";
import DetailsNavBar from "./DetailsNavBar.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
axios.defaults.timeout = 12000; // 12s — prevents silent hangs showing as "connection error"

// ── Input sanitiser (strips HTML from user fields) ─────────────
const sanitise = (str = "", max = 200) =>
  String(str).replace(/[<>"'`]/g, "").trim().slice(0, max);

const Field = ({ label, children, note }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-[0.35em] text-black/40 mb-2">
      {label}
    </label>
    {children}
    {note && <p className="text-[10px] text-black/28 font-medium mt-1.5 ml-0.5">{note}</p>}
  </div>
);

const CheckoutPage = () => {
  const { cart, cartTotal, handleConfirmOrder, isProcessing } = useCart() || { cart: [] };
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    user_id: "",
    phone_number: "",
    delivery_method: "pickup",
    payment_method: "paystack",
    delivery_location: "",
  });

  const [validating, setValidating] = useState(false);
  const [serverFee, setServerFee]   = useState(null); // set after server validation

  /* ── Pre-fill from session ──────────────────────────────────── */
  useEffect(() => {
    const fetchUser = async () => {
      const storedEmail = sessionStorage.getItem("userEmail");
      if (!storedEmail) return;
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("email", storedEmail)
          .maybeSingle();
        if (error) throw error;
        if (profile) {
          sessionStorage.setItem("userUuid", profile.id);
          setFormData((prev) => ({
            ...prev,
            customer_email: storedEmail,
            customer_name: profile.full_name || "",
            user_id: profile.id,
          }));
        }
      } catch (err) {
        console.error("Checkout init error:", err.message);
      }
    };
    fetchUser();
  }, []);

  /* ── Handlers ───────────────────────────────────────────────── */
  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "phone_number" ? value.replace(/\D/g, "").slice(0, 10) : value,
    }));
  };

  const handleDeliveryMethod = (method) => {
    setFormData((prev) => ({ ...prev, delivery_method: method }));
    if (method === "delivery") {
      Swal.fire({
        title: "DOOR DELIVERY NOTE",
        html: `<p style="font-size:14px;color:#333;line-height:1.7">Our delivery team will <strong>call you</strong> once your order is ready.<br><br>Delivery fees depend on your <strong>location</strong>.</p>`,
        icon: "info",
        confirmButtonColor: "#C9A227",
        background: "#FDFBF7",
        color: "#000",
        customClass: {
          popup: "!rounded-[2rem] !border !border-black/5",
          confirmButton: "!rounded-full !px-10 !py-3 !uppercase !text-[10px] !font-black !tracking-widest",
        },
      });
    }
  };

  /* ── Client-side validation ─────────────────────────────────── */
  const validateLocally = () => {
    const errs = [];
    if (!sanitise(formData.customer_name))        errs.push("Full name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) errs.push("Invalid email address.");
    if (!/^\d{10}$/.test(formData.phone_number))  errs.push("Phone must be exactly 10 digits.");
    if (!formData.user_id)                        errs.push("Session invalid. Please log in again.");
    if (formData.delivery_method === "delivery" && !sanitise(formData.delivery_location))
      errs.push("Delivery location is required.");
    if (!cart || cart.length === 0)               errs.push("Your cart is empty.");
    return errs;
  };

  /* ── Step 1: Validate with server BEFORE opening Paystack ───── */
  const onConfirm = async () => {
    // 1a. Client-side check first (fast feedback)
    const localErrors = validateLocally();
    if (localErrors.length > 0) {
      return Swal.fire({
        title: "Please check your details",
        html: localErrors.map((e) => `<p style="margin:4px 0;font-size:13px;">• ${e}</p>`).join(""),
        icon: "warning",
        confirmButtonColor: "#C9A227",
        background: "#FDFBF7",
        customClass: { popup: "!rounded-[2rem]" },
      });
    }

    setValidating(true);

    try {
      // 1b. Server-side pre-flight — validates + calculates exact fee server-side
      const { data } = await axios.post(`${API_URL}/validate-order`, {
        user_id:         formData.user_id,
        customer_name:   sanitise(formData.customer_name, 100),
        customer_email:  formData.customer_email.trim().toLowerCase(),
        phone_number:    formData.phone_number,
        delivery_method: formData.delivery_method,
        cart: cart.map((item) => ({
          id:       item.id,
          quantity: item.quantity,
          price:    item.price,
        })),
      });

      if (!data.success) {
        const msgs = Array.isArray(data.errors) ? data.errors : [data.error || "Validation failed."];
        return Swal.fire({
          title: "Order Validation Failed",
          html: msgs.map((e) => `<p style="margin:4px 0;font-size:13px;">• ${e}</p>`).join(""),
          icon: "error",
          confirmButtonColor: "#C9A227",
          background: "#FDFBF7",
          customClass: { popup: "!rounded-[2rem]" },
        });
      }

      // 1c. Everything OK — pass server-calculated amounts to Paystack
      setServerFee(data.fee);
      payWithPaystack(data.amount_pesewas, data.fee);
    } catch (err) {
      console.error("Pre-flight error:", err.message);
      Swal.fire({
        title: "Connection Error",
        text: "Could not validate your order. Please check your internet connection and try again.",
        icon: "error",
        confirmButtonColor: "#C9A227",
        background: "#FDFBF7",
        customClass: { popup: "!rounded-[2rem]" },
      });
    } finally {
      setValidating(false);
    }
  };

  /* ── Step 2: Open Paystack — uses server-calculated fee ────── */
  const payWithPaystack = (amountPesewas, processingFee) => {
    if (!window.PaystackPop) {
      return Swal.fire({
        title: "Payment Error",
        text: "Payment provider failed to load. Please refresh and try again.",
        icon: "error",
        confirmButtonColor: "#C9A227",
        background: "#FDFBF7",
      });
    }

    const paystack = new window.PaystackPop();
    // Fee computed on server: 1.5% + GH₵0.50 flat, capped at GH₵2.00
    // Customer bears the fee; merchant receives full product subtotal.

    paystack.newTransaction({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: formData.customer_email,
      amount: amountPesewas,
      currency: "GHS",
      ref: `TRX-${crypto.randomUUID()}`,
      metadata: {
        custom_fields: [
          { display_name: "Customer",        variable_name: "customer_name",      value: sanitise(formData.customer_name, 100) },
          { display_name: "User ID",         variable_name: "user_id",            value: formData.user_id },
          { display_name: "Phone",           variable_name: "phone_number",       value: formData.phone_number },
          { display_name: "Location",        variable_name: "delivery_location",  value: sanitise(formData.delivery_location, 200) },
          { display_name: "Processing Fee",  variable_name: "processing_fee",     value: `GH₵${Number(processingFee || 0).toFixed(2)}` },
        ],
      },
      onSuccess: async (response) => {
        await handlePostPayment(response.reference);
      },
      onCancel: () =>
        Swal.fire({
          title: "Cancelled",
          text: "Your transaction was not completed. No payment was made.",
          icon: "info",
          confirmButtonColor: "#C9A227",
          background: "#FDFBF7",
          customClass: { popup: "!rounded-[2rem]" },
        }),
    });
  };

  /* ── Step 3: Verify on server, then persist order ───────────── */
  const handlePostPayment = async (reference) => {
    try {
      // Verify reference server-side first — prevents replayed references
      const { data: verification } = await axios.get(
        `${API_URL}/verify-payment/${encodeURIComponent(reference)}`
      );

      if (!verification.success) {
        return Swal.fire({
          title: "Payment Unconfirmed",
          text: "We could not verify your payment. Please contact support with reference: " + reference,
          icon: "warning",
          confirmButtonColor: "#C9A227",
          background: "#FDFBF7",
          customClass: { popup: "!rounded-[2rem]" },
        });
      }

      // Payment verified — now save order
      const result = await handleConfirmOrder({
        ...formData,
        customer_name:     sanitise(formData.customer_name, 100),
        delivery_location: sanitise(formData.delivery_location, 200),
        payment_reference: reference,
        status: "paid",
      });

      if (result.success) {
        // Grab the Supabase order UUID returned by handleConfirmOrder
        const orderId = result.orderId || result.id || null;

        // NOTE: Paystack already sends the customer a payment receipt automatically.
        // We do NOT call send-status-update here to avoid a duplicate email.
        // The admin can send a follow-up email via the order status update flow.

        navigate("/order-confirmed", {
          state: {
            reference,
            total:   cartTotal,
            name:    formData.customer_name,
            orderId,
          },
        });
      } else {
        // Payment went through but DB save failed — show reference so support can help
        Swal.fire({
          title: "Order Save Failed",
          html: `<p style="font-size:14px;line-height:1.7">Your payment was successful but we encountered an issue saving your order.<br><br>Please contact us with your payment reference:<br><strong style="color:#C9A227">${reference}</strong></p>`,
          icon: "error",
          confirmButtonColor: "#C9A227",
          background: "#FDFBF7",
          customClass: { popup: "!rounded-[2rem]" },
        });
      }
    } catch (err) {
      console.error("Post-payment error:", err.message);
      Swal.fire({
        title: "Something Went Wrong",
        html: `<p>Your payment may have gone through. Please contact support with reference:<br><strong style="color:#C9A227">${reference}</strong></p>`,
        icon: "warning",
        confirmButtonColor: "#C9A227",
        background: "#FDFBF7",
      });
    }
  };

  /* ── Empty cart state ───────────────────────────────────────── */
  if (!cart || (cart.length === 0 && !isProcessing)) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center space-y-5">
          <span className="material-symbols-outlined text-5xl text-black/10 block">shopping_bag</span>
          <p className="text-[12px] font-black uppercase tracking-widest text-black/30">Your cart is empty</p>
          <button
            onClick={() => navigate("/")}
            className="text-[#C9A227] font-black tracking-widest border-b border-[#C9A227] pb-1 text-[11px] uppercase hover:opacity-70 transition-opacity"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const isSubmitting = validating || isProcessing;

  // ── Fee calculation (shown before payment) ──────────────────
  const FLAT = 0.50, PCT = 0.015, CAP = 2.00;
  const estimatedFee = cartTotal > 0
    ? parseFloat(Math.min((cartTotal + FLAT) / (1 - PCT) - cartTotal, CAP).toFixed(2))
    : 0;
  const displayFee   = serverFee !== null ? serverFee : estimatedFee;
  const displayTotal = parseFloat((cartTotal + displayFee).toFixed(2));

  const inputCls =
    "w-full h-12 border-b-2 border-black/[0.08] bg-transparent outline-none focus:border-[#C9A227] text-[14px] font-semibold text-black transition-colors placeholder:text-black/20";

  return (
    <div className="min-h-screen bg-[#FDFBF7] select-none relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-[#C9A227]/[0.06] rounded-full blur-[130px]" />
        <div className="absolute bottom-[-15%] left-[-5%]  w-[380px] h-[380px] bg-[#C9A227]/[0.04] rounded-full blur-[100px]" />
      </div>

      <DetailsNavBar />

      <div className="relative z-10 max-w-lg mx-auto pt-24 pb-32 md:pb-24 px-5">

        {/* Header */}
        <div className="text-center mb-9">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#C9A227] mb-2">Secure Transaction</p>
          <h1 className="text-3xl md:text-4xl font-serif italic text-black">Checkout</h1>
        </div>

        {/* Card */}
        <div className="bg-white border border-black/[0.07] rounded-[2rem] shadow-xl shadow-black/[0.05] overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent" />

          <div className="p-7 md:p-9">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>

              {/* Full Name */}
              <Field label="Full Name">
                <input name="customer_name" value={formData.customer_name}
                  placeholder="Your full name" onChange={handleInput}
                  maxLength={100} autoComplete="name"
                  className={inputCls} />
              </Field>

              {/* Email — read only */}
              <Field label="Account Email" note="Verified · cannot be changed">
                <input value={formData.customer_email} readOnly
                  className="w-full h-12 bg-black/[0.03] rounded-xl px-4 text-[13px] font-semibold text-black/35 cursor-not-allowed border border-black/[0.05]" />
              </Field>

              {/* Phone */}
              <Field label="Contact Number">
                <div className="relative">
                  <span className="absolute left-0 bottom-3 text-[13px] font-bold text-black/30">+233</span>
                  <input name="phone_number" value={formData.phone_number}
                    placeholder="0XX XXX XXXX" maxLength={10}
                    onChange={handleInput} inputMode="numeric"
                    className={`${inputCls} pl-12`} />
                </div>
              </Field>

              {/* Delivery Method */}
              <Field label="Delivery Method">
                <div className="flex gap-3 mt-1">
                  {[
                    { value: "pickup",   label: "Pickup",   icon: "storefront"     },
                    { value: "delivery", label: "Delivery", icon: "local_shipping" },
                  ].map((opt) => (
                    <button key={opt.value} type="button"
                      onClick={() => handleDeliveryMethod(opt.value)}
                      className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                        formData.delivery_method === opt.value
                          ? "bg-black text-white border-black shadow-lg"
                          : "bg-white text-black/38 border-black/[0.08] hover:border-black/25"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Delivery location */}
              {formData.delivery_method === "delivery" && (
                <Field label="Delivery Location" note="Our team will call you. Fee depends on location.">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-0 bottom-2.5 text-[18px] text-[#C9A227]">location_on</span>
                    <input name="delivery_location" value={formData.delivery_location}
                      placeholder="e.g. East Legon, Accra"
                      onChange={handleInput} maxLength={200}
                      className={`${inputCls} pl-7`} />
                  </div>
                </Field>
              )}

              <div className="h-px bg-black/[0.05]" />

              {/* Order summary */}
              <div className="bg-[#F7F5F0] rounded-2xl p-5 space-y-2.5 border border-black/[0.04]">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-black/25 mb-4">Order Summary</p>
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <span className="text-[13px] font-semibold text-black/60 truncate max-w-[60%]">
                      {sanitise(item.name, 80)}{" "}
                      <span className="text-black/28 font-medium">× {item.quantity}</span>
                    </span>
                    <span className="text-[13px] font-black text-black">
                      GH₵{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
                {/* Processing fee — estimated immediately, confirmed after server validation */}
                <div className="flex justify-between items-center pt-2 border-t border-dashed border-black/[0.06]">
                  <span className="text-[11px] font-semibold text-black/35">
                    Processing fee
                    <span className="text-[9px] font-medium ml-1 text-black/20">(Paystack · 1.5% + GH₵0.50, max GH₵2.00)</span>
                  </span>
                  <span className="text-[12px] font-black text-black/50">GH₵{displayFee.toFixed(2)}</span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-black/35">Shipping</span>
                  <span className="text-[11px] font-black text-[#C9A227] uppercase">Complimentary</span>
                </div>

                {/* Grand total */}
                <div className="pt-4 border-t border-black/[0.08] flex justify-between items-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.35em] text-black/25">Total (incl. fee)</p>
                  <p className="text-2xl font-serif italic text-[#C9A227]">GH₵{displayTotal.toLocaleString()}</p>
                </div>
              </div>

              {/* Pay button */}
              <button type="button" onClick={onConfirm} disabled={isSubmitting}
                className="w-full py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.38em] hover:bg-[#C9A227] transition-all shadow-xl shadow-black/10 active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {validating ? "Validating…" : "Processing…"}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    Pay Now — GH₵{displayTotal.toLocaleString()}
                  </>
                )}
              </button>

              {/* Trust line */}
              <div className="flex items-center justify-center gap-2 opacity-20">
                <span className="material-symbols-outlined text-[15px]">verified_user</span>
                <p className="text-[9px] uppercase tracking-[0.25em] font-black">
                  Powered by Paystack · Secure & Encrypted
                </p>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;