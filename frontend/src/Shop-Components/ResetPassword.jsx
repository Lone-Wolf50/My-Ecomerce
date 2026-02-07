import { useState } from "react";
import { supabase } from "../Database-Server/Superbase-client.js";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from 'sweetalert2';
import bcrypt from 'bcryptjs'; // Required to hash the password before sending to RPC

function ResetPassword() {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = location.state?.userEmail;
  const API_URL = import.meta.env.VITE_API_URL; // Ensure this is in your .env

  const luxeAlert = (title, text, icon = 'error') => {
    Swal.fire({
      title: title.toUpperCase(),
      text: text,
      icon: icon,
      confirmButtonColor: "#D4AF37",
      background: "#FDFBF7",
      color: "#000",
      customClass: {
        popup: 'rounded-[2.5rem] border border-black/5',
        confirmButton: 'rounded-full px-10 py-3 uppercase text-[10px] font-black tracking-widest'
      }
    });
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (!userEmail) {
      luxeAlert("Session Error", "No email identified. Please restart the process.");
      return;
    }

    if (newPassword !== confirmPassword) {
      luxeAlert("Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    
    try {
      // 1. VERIFY THE OTP FIRST via your backend
      const verifyRes = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, otp: otp }),
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        throw new Error("Invalid or expired OTP sequence.");
      }

      // 2. HASH THE NEW PASSWORD
      // Since we are using a manual RPC, we must hash it on the client 
      // or ensure the RPC hashes it. (Standard practice: hash before DB insert)
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 3. EXECUTE RPC RESET
      const { error } = await supabase.rpc('manual_reset_password', {
        target_email: userEmail,
        new_password: hashedPassword
      });

      if (error) throw error;

      Swal.fire({
        title: "SUCCESS",
        text: "Credentials updated. Redirecting to login...",
        icon: "success",
        timer: 3000,
        showConfirmButton: false,
        background: "#FDFBF7",
        color: "#000",
        customClass: { popup: 'rounded-[2.5rem]' }
      });

      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      luxeAlert("Security Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-8">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-black/5">
        <h2 className="text-3xl font-black tracking-tighter mb-2 uppercase text-black">Reset Vault</h2>
        <p className="text-[10px] font-bold text-black/40 uppercase mb-8 tracking-widest">
          Enter OTP sent to: <span className="text-black">{userEmail || "Unknown"}</span>
        </p>
        
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          {/* OTP INPUT FIELD */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest ml-1 mb-2 block text-black/60">Verification Code (OTP)</label>
            <input
              type="text"
              placeholder="123456"
              maxLength={6}
              className="w-full bg-[#FDFBF7] border border-black/10 rounded-xl py-4 px-6 outline-none focus:border-[#D4AF37] transition-all text-center tracking-[1em] font-black text-lg"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              required
            />
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-widest ml-1 mb-2 block text-black/60">New Secret Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-[#FDFBF7] border border-black/10 rounded-xl py-4 px-6 outline-none focus:border-[#D4AF37] transition-all text-xs font-bold"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-widest ml-1 mb-2 block text-black/60">Confirm New Secret</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-[#FDFBF7] border border-black/10 rounded-xl py-4 px-6 outline-none focus:border-[#D4AF37] transition-all text-xs font-bold"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-[#D4AF37] transition-all mt-4"
          >
            {loading ? "Verifying..." : "Authorize Reset"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;