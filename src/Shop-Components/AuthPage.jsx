import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../Database-Server/Superbase-client.js";

const AuthPage = () => {
  // view: 'login', 'signup', or 'recovery'
  const [view, setView] = useState('login'); 
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  const handleInput = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e) => {
    e.preventDefault();

    // 1. IT Security Guardrails
    if (!formData.email.endsWith('@gmail.com')) {
      alert("Please use a valid @gmail.com address.");
      return;
    }

    if (view === 'signup' || view === 'login') {
      if (formData.password.length < 8 || formData.password.length > 10) {
        alert("Password must be between 8 and 10 characters.");
        return;
      }
    }

    if (view === 'signup' && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);
    
    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        navigate('/');
      } else if (view === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { 
            data: { full_name: formData.fullName },
            // This ensures they are redirected correctly after Gmail verification
            emailRedirectTo: window.location.origin 
          }
        });
        if (error) throw error;
        alert("Success! Check your Gmail to verify your account.");
      } else {
        // Password Recovery Logic
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
        alert("A recovery link has been sent to your Gmail.");
        setView('login');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[960px] h-[640px] bg-white rounded-[3rem] shadow-2xl border border-black/[0.02] flex overflow-hidden">
        
        {/* LEFT: Fixed Product Image */}
        <div className="hidden md:flex w-1/2 bg-[#EFEFEF] relative items-center justify-center p-12">
          <img src="/Images/summer3.jpg" alt="Luxe Bag" className="w-full h-full object-contain mix-blend-multiply" />
          <div className="absolute top-12 left-12">
            <h2 className="serif-title text-[20px] tracking-[0.3em] text-black/70 uppercase">Luxe</h2>
          </div>
        </div>

        {/* RIGHT: Sliding Form Panels */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-12 md:px-20 relative overflow-hidden">
          
          {/* 1. LOGIN PANEL */}
          <div className={`w-full transition-all duration-700 ease-in-out ${view === 'login' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none absolute'}`}>
            <h1 className="text-[38px] italic serif-title text-[#D4AF37] mb-2">Welcome Back</h1>
            <p className="text-[10px] text-black/40 uppercase tracking-[0.2em] mb-10 font-bold">Log in to your private collection.</p>
            
            <form onSubmit={handleAuth} className="space-y-5">
              <input name="email" type="email" placeholder="GMAIL ADDRESS" className="w-full h-12 border-b-2 border-black/5 outline-none focus:border-[#D4AF37] text-[12px] font-bold text-black/80" onChange={handleInput} required />
              <input name="password" type="password" placeholder="PASSWORD" className="w-full h-12 border-b-2 border-black/5 outline-none focus:border-[#D4AF37] text-[12px] font-bold text-black/80" onChange={handleInput} required />
              
              <div className="flex justify-end">
                <span onClick={() => setView('recovery')} className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest cursor-pointer hover:underline underline-offset-4">Forgot Password?</span>
              </div>

              <button disabled={loading} className="w-full h-14 bg-[#D4AF37] text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-[#D4AF37]/20 transition-all active:scale-95">
                {loading ? 'Entering...' : 'Login'}
              </button>
            </form>
            <p className="mt-10 text-[10px] text-center text-black/40 uppercase tracking-widest">
              No account? <span onClick={() => setView('signup')} className="text-[#D4AF37] cursor-pointer font-black underline underline-offset-4">Sign up</span>
            </p>
          </div>

          {/* 2. SIGN UP PANEL */}
          <div className={`w-full transition-all duration-700 ease-in-out ${view === 'signup' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none absolute'}`}>
            <h1 className="text-[32px] italic serif-title text-[#D4AF37] mb-2">Create Account</h1>
            <p className="text-[10px] text-black/40 uppercase tracking-[0.2em] mb-6 font-bold">Experience timeless elegance.</p>
            
            <form onSubmit={handleAuth} className="space-y-3">
              <input name="fullName" type="text" placeholder="FULL NAME" className="w-full h-10 border-b-2 border-black/5 outline-none focus:border-[#D4AF37] text-[11px] font-bold text-black/80" onChange={handleInput} required />
              <input name="email" type="email" placeholder="GMAIL ADDRESS" className="w-full h-10 border-b-2 border-black/5 outline-none focus:border-[#D4AF37] text-[11px] font-bold text-black/80" onChange={handleInput} required />
              <input name="password" type="password" placeholder="PASSWORD (8-10 CHARS)" className="w-full h-10 border-b-2 border-black/5 outline-none focus:border-[#D4AF37] text-[11px] font-bold text-black/80" onChange={handleInput} required />
              <input name="confirmPassword" type="password" placeholder="CONFIRM PASSWORD" className="w-full h-10 border-b-2 border-black/5 outline-none focus:border-[#D4AF37] text-[11px] font-bold text-black/80" onChange={handleInput} required />
              
              <button disabled={loading} className="w-full h-12 bg-[#D4AF37] text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] mt-6 shadow-lg shadow-[#D4AF37]/20 transition-all active:scale-95">
                {loading ? 'Creating...' : 'Register Now'}
              </button>
            </form>
            <p className="mt-8 text-[10px] text-center text-black/40 uppercase tracking-widest">
              Already a member? <span onClick={() => setView('login')} className="text-[#D4AF37] cursor-pointer font-black underline underline-offset-4">Login</span>
            </p>
          </div>

          {/* 3. RECOVERY PANEL */}
          <div className={`w-full transition-all duration-700 ease-in-out ${view === 'recovery' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none absolute'}`}>
            <h1 className="text-[32px] italic serif-title text-[#D4AF37] mb-2">Recover Access</h1>
            <p className="text-[10px] text-black/40 uppercase tracking-[0.2em] mb-10 font-bold">We will send a reset link to your email.</p>
            
            <form onSubmit={handleAuth} className="space-y-6">
              <input name="email" type="email" placeholder="YOUR GMAIL ADDRESS" className="w-full h-12 border-b-2 border-black/5 outline-none focus:border-[#D4AF37] text-[12px] font-bold text-black/80" onChange={handleInput} required />
              <button disabled={loading} className="w-full h-14 bg-[#D4AF37] text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-[#D4AF37]/20 transition-all active:scale-95">
                {loading ? 'Sending...' : 'Send Recovery Link'}
              </button>
            </form>
            <div className="mt-8 text-center">
              <span onClick={() => setView('login')} className="text-[10px] font-black text-black/40 uppercase tracking-widest cursor-pointer hover:text-black">Back to Sign In</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;