import React, { useState } from 'react';
import { supabase } from "../Database-Server/Superbase-client.js";
import { useNavigate } from "react-router-dom";

const UpdatePassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();

    // IT Guardrails
    if (newPassword.length < 8 || newPassword.length > 10) {
      alert("Password must be between 8 and 10 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      alert("Security updated. Welcome back to the Atelier.");
      navigate('/'); // Redirect to homepage or login
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
      <div className="w-full max-w-[500px] bg-white rounded-[3rem] shadow-2xl border border-black/[0.02] p-12 md:p-16 text-center">
        
        {/* Header */}
        <h2 className="serif-title text-[32px] italic text-[#D4AF37] mb-2">New Secret</h2>
        <p className="text-[10px] text-black/40 uppercase tracking-[0.2em] mb-12 font-bold">
          Redefine your luxury credentials
        </p>

        <form onSubmit={handleUpdate} className="space-y-8">
          <div className="space-y-6">
            <input
              type="password"
              placeholder="NEW PASSWORD"
              className="w-full h-12 border-b-2 border-black/5 outline-none focus:border-[#D4AF37] text-[12px] font-bold text-black/80 text-center transition-colors"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="CONFIRM NEW PASSWORD"
              className="w-full h-12 border-b-2 border-black/5 outline-none focus:border-[#D4AF37] text-[12px] font-bold text-black/80 text-center transition-colors"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
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