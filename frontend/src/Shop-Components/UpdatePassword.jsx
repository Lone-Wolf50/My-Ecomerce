import React, { useState } from 'react';
import { supabase } from "../Database-Server/Superbase-client.js";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

const UpdatePassword = () => {
  const [newPassword, setNewPassword]           = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [loading, setLoading]                   = useState(false);
  const navigate = useNavigate();

  const luxeAlert = (title, text, icon = 'error') =>
    Swal.fire({ title: title.toUpperCase(), text, icon, confirmButtonColor: '#D4AF37', background: '#FDFBF7', color: '#000', customClass: { popup: 'rounded-[2.5rem] border border-black/5', confirmButton: 'rounded-full px-10 py-3 uppercase text-[10px] font-black tracking-widest' } });

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8 || newPassword.length > 10)
      return luxeAlert('Constraint', 'Password must be 8–10 characters.');
    if (newPassword !== confirmPassword)
      return luxeAlert('Mismatch', 'The passwords do not match.');

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      Swal.fire({ title: 'Security Updated', text: 'Credentials redefined. Redirecting…', icon: 'success', timer: 3000, showConfirmButton: false, background: '#FDFBF7', customClass: { popup: 'rounded-[2.5rem]' } });
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      luxeAlert('Update Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const mismatch = confirmPassword && confirmPassword !== newPassword;

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-6 overflow-hidden">
      {/* Ambient rings */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-[#D4AF37]/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-[#D4AF37]/8 rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-[460px]">
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-black/[0.08] border border-black/[0.04] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#D4AF37]/30 via-[#D4AF37] to-[#D4AF37]/30" />

          <div className="p-11 md:p-14 flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-14 h-14 rounded-[1.25rem] bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-[#D4AF37] text-2xl">key</span>
            </div>

            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/25 mb-2">Account Security</p>
            <h2 className="text-3xl font-serif italic text-[#D4AF37] mb-1">New Secret</h2>
            <p className="text-[11px] font-bold text-black/30 uppercase tracking-wider mb-10">Redefine your luxury credentials</p>

            <form onSubmit={handleUpdate} className="w-full space-y-5 text-left">
              <div>
                <label className="text-[9px] font-black uppercase tracking-[0.35em] text-black/30 block mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  className="w-full border-b-2 border-black/8 bg-transparent py-3 outline-none focus:border-[#D4AF37] text-[13px] font-bold text-black/80 transition-colors placeholder:text-black/15"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-[0.35em] text-black/30 block mb-2">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  className={`w-full border-b-2 bg-transparent py-3 outline-none text-[13px] font-bold transition-colors placeholder:text-black/15 ${mismatch ? 'border-red-300' : 'border-black/8 focus:border-[#D4AF37]'}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {mismatch && (
                  <p className="text-[9px] text-red-400 font-bold uppercase tracking-wide mt-1.5">Passwords don't match</p>
                )}
              </div>

              {/* Strength indicator */}
              {newPassword.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[3, 6, 8, 10].map((threshold, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-0.5 rounded-full transition-colors ${newPassword.length >= threshold ? 'bg-[#D4AF37]' : 'bg-black/8'}`}
                      />
                    ))}
                  </div>
                  <p className="text-[8px] font-bold text-black/20 uppercase tracking-widest">
                    {newPassword.length < 6 ? 'Weak' : newPassword.length < 8 ? 'Fair' : 'Strong'}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || mismatch}
                className="w-full h-14 bg-[#D4AF37] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.35em] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-30 mt-2"
              >
                {loading ? 'Securing…' : 'Update Credentials'}
              </button>
            </form>

            <button
              onClick={() => navigate('/')}
              className="mt-5 text-[9px] font-black text-black/20 uppercase tracking-widest hover:text-black transition-colors"
            >
              Cancel and Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;
