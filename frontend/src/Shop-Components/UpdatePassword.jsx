import React, { useState } from 'react';
import { supabase } from "../Database-Server/Superbase-client.js";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

const UpdatePassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- LUXURY ALERT HELPER ---
  const luxeAlert = (title, text, icon = 'error') => {
    Swal.fire({
      title: title.toUpperCase(),
      text: text,
      icon: icon,
      confirmButtonColor: "#D4AF37",
      background: "#FDFBF7",
      color: "#000",
      customClass: {
        popup: 'rounded-[3rem] border border-black/5',
        confirmButton: 'rounded-full px-10 py-3 uppercase text-[10px] font-black tracking-widest'
      }
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    // IT Guardrails check
    if (newPassword.length < 8 || newPassword.length > 10) {
      luxeAlert("Constraint Violation", "For security, passwords must be exactly between 8 and 10 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      luxeAlert("Mismatch", "The secrets do not match. Please verify your input.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Swal.fire({
        title: "SECURITY UPDATED",
        text: "Credentials redefined. Welcome back to the Atelier.",
        icon: "success",
        timer: 3000,
        showConfirmButton: false,
        background: "#FDFBF7",
        color: "#000",
        customClass: { popup: 'rounded-[3rem]' }
      });

      setTimeout(() => navigate('/'), 3000); 
    } catch (err) {
      luxeAlert("Update Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
      <div className="w-full max-w-[500px] bg-white rounded-[3rem] shadow-2xl border border-black/[0.02] p-12 md:p-16 text-center">
        
        {/* Header */}
        <h2 className="text-[32px] italic text-[#D4AF37] mb-2 font-serif">New Secret</h2>
        <p className="text-[10px] text-black/40 uppercase tracking-[0.2em] mb-12 font-bold">
          Redefine your luxury credentials
        </p>

        <form onSubmit={handleUpdate} className="space-y-8">
          <div className="space-y-6">
            <input
              type="password"
              placeholder="NEW PASSWORD"
              className="w-full h-12 border-b-2 border-black/5 outline-none focus:border-[#D4AF37] text-[12px] font-bold text-black/80 text-center transition-colors placeholder:text-black/20"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="CONFIRM NEW PASSWORD"
              className="w-full h-12 border-b-2 border-black/5 outline-none focus:border-[#D4AF37] text-[12px] font-bold text-black/80 text-center transition-colors placeholder:text-black/20"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-[#D4AF37] text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-[#D4AF37]/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Securing...' : 'Update Credentials'}
          </button>
        </form>

        <div className="mt-10">
          <button 
            onClick={() => navigate('/')}
            className="text-[9px] font-black text-black/30 uppercase tracking-widest hover:text-black transition-colors"
          >
            Cancel and Return
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;