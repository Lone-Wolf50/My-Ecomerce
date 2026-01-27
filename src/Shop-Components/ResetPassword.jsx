import { useState } from "react";
import { supabase } from "../Database-Server/Superbase-client.js";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessage("Password updated successfully! Redirecting...");
      setTimeout(() => navigate("/"), 3000); // Send them back to login/home
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-8">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-black/5">
        <h2 className="text-3xl font-black tracking-tighter mb-2 uppercase">New Secret</h2>
        <p className="text-[10px] font-bold text-black/40 uppercase mb-8 tracking-widest">Update your Luxe credentials</p>
        
        <form onSubmit={handlePasswordUpdate} className="space-y-6">
          <input
            type="password"
            placeholder="ENTER NEW PASSWORD"
            className="w-full bg-cream/50 border border-black/10 rounded-xl py-4 px-6 outline-none focus:border-primary transition-all text-xs font-bold"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:opacity-90 transition-opacity"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
        {message && <p className="mt-6 text-center text-primary font-bold text-[10px] uppercase">{message}</p>}
      </div>
    </div>
  );
}

export default ResetPassword;