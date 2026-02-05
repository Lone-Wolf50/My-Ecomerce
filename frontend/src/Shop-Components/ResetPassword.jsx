import { useState } from "react";
import { supabase } from "../Database-Server/Superbase-client.js";
import { useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import Swal from 'sweetalert2';

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the email passed from the Forgot Password verification step
  const userEmail = location.state?.userEmail;

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
      luxeAlert("Session Error", "No email identified. Please go back to the forgot password page.");
      return;
    }

    if (newPassword !== confirmPassword) {
      luxeAlert("Mismatch", "Passwords do not match. Please verify your credentials.");
      return;
    }

    setLoading(true);
    
    try {
      // Logic Change: Use the RPC function to bypass email authentication
      const { error } = await supabase.rpc('manual_reset_password', {
        target_email: userEmail,
        new_password: newPassword
      });

      if (error) throw error;

      Swal.fire({
        title: "SUCCESS",
        text: "Your secret credentials have been updated. Redirecting to the login...",
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
        <h2 className="text-3xl font-black tracking-tighter mb-2 uppercase text-black">New Secret</h2>
        <p className="text-[10px] font-bold text-black/40 uppercase mb-8 tracking-widest">
          Resetting password for: <span className="text-black">{userEmail || "Unknown User"}</span>
        </p>
        
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest ml-1 mb-2 block text-black/60">New Password</label>
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
            <label className="text-[9px] font-black uppercase tracking-widest ml-1 mb-2 block text-black/60">Confirm Password</label>
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
            className="w-full bg-[#D4AF37] text-white py-5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:opacity-90 transition-opacity mt-4"
          >
            {loading ? "Syncing..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;