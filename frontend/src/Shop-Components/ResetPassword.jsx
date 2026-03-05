import { useState } from "react";
import { supabase } from "../Database-Server/Superbase-client.js";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from 'sweetalert2';
import bcrypt from 'bcryptjs';

function ResetPassword() {
  const [otp, setOtp]                         = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]                 = useState(false);

  const navigate  = useNavigate();
  const location  = useLocation();
  const userEmail = location.state?.userEmail;
  const API_URL   = import.meta.env.VITE_API_URL;

  const luxeAlert = (title, text, icon = 'error') =>
    Swal.fire({ title: title.toUpperCase(), text, icon, confirmButtonColor: '#D4AF37', background: '#FDFBF7', color: '#000', customClass: { popup: 'rounded-[2.5rem] border border-black/5', confirmButton: 'rounded-full px-10 py-3 uppercase text-[10px] font-black tracking-widest' } });

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!userEmail) return luxeAlert('Session Error', 'No email identified. Please restart the process.');
    if (newPassword !== confirmPassword) return luxeAlert('Mismatch', 'Passwords do not match.');

    setLoading(true);
    try {
      const verifyRes  = await fetch(`${API_URL}/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: userEmail, otp }) });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) throw new Error('Invalid or expired OTP sequence.');

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const { error } = await supabase.rpc('manual_reset_password', { target_email: userEmail, new_password: hashedPassword });
      if (error) throw error;

      Swal.fire({ title: 'Success', text: 'Credentials updated. Redirecting…', icon: 'success', timer: 3000, showConfirmButton: false, background: '#FDFBF7', customClass: { popup: 'rounded-[2.5rem]' } });
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      luxeAlert('Security Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center px-5">
      {/* Ambient rings */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-[#D4AF37]/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-[#D4AF37]/8 rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-black/[0.08] border border-black/[0.04] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#D4AF37]/30 via-[#D4AF37] to-[#D4AF37]/30" />

          <div className="p-10 md:p-12">
            {/* Icon */}
            <div className="w-14 h-14 rounded-[1.25rem] bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-[#D4AF37] text-2xl">lock_reset</span>
            </div>

            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/25 mb-2">Vault Security</p>
            <h2 className="text-3xl font-serif italic mb-1 text-black">Reset Credentials</h2>
            <p className="text-[11px] font-bold text-black/30 uppercase tracking-wider mb-8">
              OTP dispatched to: <span className="text-black">{userEmail || '—'}</span>
            </p>

            <form onSubmit={handlePasswordUpdate} className="space-y-5">
              {/* OTP */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-[0.35em] text-black/35 block mb-2">Verification Code</label>
                <input
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  className="w-full bg-[#F7F5F0] border border-black/8 rounded-2xl py-4 px-6 outline-none focus:border-[#D4AF37] transition-colors text-center tracking-[1em] font-black text-lg"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                />
              </div>

              <div className="h-px bg-black/5 my-2" />

              {/* New password */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-[0.35em] text-black/35 block mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  className="w-full bg-[#F7F5F0] border border-black/8 rounded-2xl py-4 px-6 outline-none focus:border-[#D4AF37] transition-colors text-[13px] font-bold"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              {/* Confirm */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-[0.35em] text-black/35 block mb-2">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  className={`w-full bg-[#F7F5F0] border rounded-2xl py-4 px-6 outline-none transition-colors text-[13px] font-bold ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-black/8 focus:border-[#D4AF37]'
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider mt-1.5 ml-1">Passwords don't match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.35em] shadow-lg hover:bg-[#D4AF37] transition-all mt-2 disabled:opacity-30"
              >
                {loading ? 'Verifying…' : 'Authorize Reset'}
              </button>
            </form>

            <button
              onClick={() => navigate('/login')}
              className="w-full mt-4 text-[9px] font-black uppercase tracking-widest text-black/20 hover:text-black transition-colors py-2"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;