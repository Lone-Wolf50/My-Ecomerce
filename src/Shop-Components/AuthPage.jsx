import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../Database-Server/Superbase-client.js";
import Swal from 'sweetalert2';

const AuthPage = () => {
  const [view, setView] = useState('login'); 
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false); 
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [timer, setTimer] = useState(0);
  const [pendingUserId, setPendingUserId] = useState(null);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', fullName: '',
    newPassword: '', confirmNewPassword: ''
  });

  // --- OTP TIMER ---
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0 && generatedOtp) {
      setGeneratedOtp(null);
      if (view === 'otp') {
        luxeAlert("EXPIRED", "Security code timed out.", "error");
        setView('login');
      }
    }
    return () => clearInterval(interval);
  }, [timer, generatedOtp, view]);

  const luxeAlert = (title, text, icon = 'error') => {
    Swal.fire({
      title: title.toUpperCase(), text, icon,
      confirmButtonColor: "#D4AF37", background: "#FDFBF7", color: "#000",
      customClass: { popup: 'rounded-[3rem] border border-black/5 shadow-2xl', confirmButton: 'rounded-full px-10 py-3 uppercase text-[10px] font-black' }
    });
  };

  const handleInput = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- CORE OTP LOGIC ---
  const launchOTP = async (userId) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
    const hashedOtp = btoa(code); // Simple hash as requested
    
    const { error } = await supabase
      .from('profiles')
      .update({ otp_code: hashedOtp, otp_expires_at: expiresAt })
      .eq('id', userId);
    
    if (error) throw error;
    
    setGeneratedOtp(code);
    setTimer(60);
    setView('otp');
  };

  const handleAuth = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      if (view === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        
        const newSessionId = crypto.randomUUID(); 
        window.sessionStorage.setItem("current_device_session", newSessionId);
        await supabase.from('profiles').update({ last_session_id: newSessionId }).eq('id', data.user.id);
        navigate('/');

      } else if (view === 'signup') {
        if (formData.password !== formData.confirmPassword) throw new Error("Passwords mismatch.");
        
        const { data, error } = await supabase.auth.signUp({
          email: formData.email, password: formData.password,
          options: { data: { full_name: formData.fullName } }
        });
        if (error) throw error;

        setPendingUserId(data.user.id);
        await launchOTP(data.user.id);

      } else if (view === 'otp') {
        const hashedInput = btoa(otpInput);
        const userId = pendingUserId || (await supabase.from('profiles').select('id').ilike('email', formData.email).maybeSingle()).data?.id;

        if (!userId) throw new Error("Session lost.");

        const { data: profile } = await supabase.from('profiles').select('otp_code, otp_expires_at').eq('id', userId).single();

        if (profile?.otp_code === hashedInput && new Date(profile.otp_expires_at) > new Date()) {
          // Clear OTP
          await supabase.from('profiles').update({ otp_code: null, otp_expires_at: null }).eq('id', userId);
          
          if (view === 'otp' && formData.email && !pendingUserId) {
            setView('reset');
          } else {
            luxeAlert("Verified", "Access granted.", "success");
            navigate('/');
          }
        } else {
          throw new Error("Invalid or expired code.");
        }

      } else if (view === 'forgot') {
        const { data: profile } = await supabase.from('profiles').select('id').ilike('email', formData.email.trim()).maybeSingle();
        if (!profile) throw new Error("Email not registered.");
        await launchOTP(profile.id);

      } else if (view === 'reset') {
        if (formData.newPassword !== formData.confirmNewPassword) throw new Error("Passwords mismatch.");
        
        // Calling your Step 5 SQL Function
        const { data, error } = await supabase.rpc('manual_reset_password', {
          target_email: formData.email,
          new_password: formData.newPassword
        });
        if (error || !data.success) throw new Error(data?.message || "Reset failed");

        luxeAlert("Success", "Password updated.", "success");
        setView('login');
      }
    } catch (err) {
      luxeAlert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 font-sans text-black relative">
      {generatedOtp && (
        <div className="absolute top-10 right-10 w-64 bg-black text-white p-6 rounded-3xl shadow-2xl border border-[#D4AF37]/30 z-50">
          <p className="text-[10px] font-black tracking-[0.3em] text-[#D4AF37] mb-2 uppercase">HUD SECURE CODE</p>
          <h2 className="text-4xl font-mono font-bold tracking-widest">{generatedOtp}</h2>
          <div className="mt-4 w-full bg-white/10 h-[4px] rounded-full overflow-hidden">
            <div className="bg-[#D4AF37] h-full transition-all duration-1000 linear" style={{ width: `${(timer / 60) * 100}%` }}></div>
          </div>
        </div>
      )}

      <div className="w-full max-w-[960px] min-h-[640px] bg-white rounded-[3rem] shadow-2xl flex overflow-hidden border border-black/[0.05]">
        <div className="hidden md:flex w-1/2 bg-[#F7F7F7] items-center justify-center p-12">
          <img src="/Images/summer3.jpg" className="w-full h-full object-contain mix-blend-multiply opacity-80" alt="brand" />
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-center px-12 md:px-20 py-10">
          <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-2">{view === 'otp' ? 'Verification' : 'Protocol'}</p>
          <h1 className="text-[42px] italic font-serif mb-8 leading-none uppercase">{view}</h1>
          
          <form onSubmit={handleAuth} className="space-y-5">
            {view === 'signup' && (
              <input name="fullName" placeholder="FULL NAME" className="w-full h-12 border-b border-black/10 outline-none focus:border-[#D4AF37] text-[11px] font-bold tracking-widest" onChange={handleInput} required />
            )}
            {(view !== 'otp' && view !== 'reset') && (
              <input name="email" type="email" placeholder="EMAIL ADDRESS" className="w-full h-12 border-b border-black/10 outline-none focus:border-[#D4AF37] text-[11px] font-bold tracking-widest" onChange={handleInput} required />
            )}
            {(view === 'login' || view === 'signup') && (
              <div className="relative">
                <input name="password" type={showPass ? "text" : "password"} placeholder="PASSWORD" className="w-full h-12 border-b border-black/10 outline-none focus:border-[#D4AF37] text-[11px] font-bold tracking-widest" onChange={handleInput} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-0 top-3 opacity-30 hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-[18px]">{showPass ? "visibility" : "visibility_off"}</span>
                </button>
              </div>
            )}
            {view === 'signup' && (
              <input name="confirmPassword" type={showPass ? "text" : "password"} placeholder="CONFIRM PASSWORD" className="w-full h-12 border-b border-black/10 outline-none focus:border-[#D4AF37] text-[11px] font-bold tracking-widest" onChange={handleInput} required />
            )}
            {view === 'otp' && (
              <input type="text" maxLength={6} className="w-full h-20 text-center text-4xl font-mono tracking-[0.5em] border-2 border-black rounded-2xl focus:border-[#D4AF37] outline-none" onChange={(e) => setOtpInput(e.target.value)} autoFocus required />
            )}
            {view === 'reset' && (
              <div className="space-y-4">
                <input name="newPassword" type="password" placeholder="NEW PASSWORD" className="w-full h-12 border-b border-black/10 outline-none focus:border-[#D4AF37]" onChange={handleInput} required />
                <input name="confirmNewPassword" type="password" placeholder="CONFIRM NEW" className="w-full h-12 border-b border-black/10 outline-none focus:border-[#D4AF37]" onChange={handleInput} required />
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full h-14 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] mt-8 hover:bg-[#D4AF37] transition-all disabled:opacity-50">
              {loading ? 'Executing...' : 'Proceed'}
            </button>
          </form>

          <div className="mt-10 flex justify-between border-t border-black/5 pt-8">
            <button type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="text-[9px] uppercase font-black text-black/30 hover:text-black tracking-widest">
              {view === 'login' ? 'Create Account' : 'Back to Login'}
            </button>
            {view === 'login' && (
              <button type="button" onClick={() => setView('forgot')} className="text-[9px] uppercase font-black text-[#D4AF37] tracking-widest hover:underline">Lost Access?</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;