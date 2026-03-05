import { useState, useEffect, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase        = createClient(supabaseUrl, supabaseAnonKey);
const API_URL         = import.meta.env.VITE_API_URL || "http://localhost:3001";

/* ══════════════════════════════════════════════════════════════
   PREMIUM LOADERS  — 3 variants, chosen randomly on mount
══════════════════════════════════════════════════════════════ */

/* Variant 1 ── JLB monogram burst */
function LoaderMonogram({ onDone }) {
  // Delayed: show for at least 3.8s so user sees it fully
  useEffect(() => { const t = setTimeout(onDone, 3800); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center overflow-hidden select-none">
      {/* Rotating rings */}
      <div className="absolute w-[360px] h-[360px] rounded-full border border-[#C9A227]/8"
        style={{ animation: "spin 12s linear infinite" }} />
      <div className="absolute w-[260px] h-[260px] rounded-full border border-[#C9A227]/12"
        style={{ animation: "spin 7s linear infinite reverse" }} />
      <div className="absolute w-[180px] h-[180px] rounded-full border border-[#C9A227]/18"
        style={{ animation: "spin 4s linear infinite" }} />

      {/* Gold radial rays */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            width: "1px", height: "80px",
            background: "linear-gradient(to top, transparent, rgba(201,162,39,0.18), transparent)",
            top: "calc(50% - 80px)", left: "50%",
            transformOrigin: "bottom center",
            transform: `rotate(${i * 30}deg) translateX(-50%)`,
            animation: `pulse 2.4s ease ${i * 0.12}s infinite alternate`,
          }}
        />
      ))}

      {/* Core */}
      <div style={{ animation: "fadeInScale 0.9s cubic-bezier(.22,1,.36,1) both", opacity: 0 }}
        className="relative z-10 flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-[88px] h-[88px] rounded-[28px] border border-[#C9A227]/30 bg-[#C9A227]/[0.07] flex items-center justify-center shadow-[0_0_60px_rgba(201,162,39,0.12)]">
            <span className="text-[28px] font-serif italic text-[#C9A227] tracking-widest leading-none">JLB</span>
          </div>
          {/* Corner accents */}
          <span className="absolute -top-px -left-px w-4 h-4 border-t border-l border-[#C9A227]/50 rounded-tl-[8px]" />
          <span className="absolute -top-px -right-px w-4 h-4 border-t border-r border-[#C9A227]/50 rounded-tr-[8px]" />
          <span className="absolute -bottom-px -left-px w-4 h-4 border-b border-l border-[#C9A227]/50 rounded-bl-[8px]" />
          <span className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-[#C9A227]/50 rounded-br-[8px]" />
        </div>

        <div className="text-center space-y-1">
          <p className="text-[8px] font-black uppercase tracking-[0.55em] text-[#C9A227]/70">Janina Luxury Bags</p>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/18">Initializing vault…</p>
        </div>

        {/* Gold progress bar */}
        <div className="w-36 h-px bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#C9A227]/50 to-[#C9A227]"
            style={{ animation: "loadBar 3.5s cubic-bezier(.4,0,.2,1) forwards" }} />
        </div>
      </div>

      <style>{`
        @keyframes fadeInScale { from{opacity:0;transform:scale(.82)} to{opacity:1;transform:scale(1)} }
        @keyframes loadBar     { from{width:0} to{width:100%} }
        @keyframes spin        { to{transform:rotate(360deg)} }
        @keyframes pulse       { from{opacity:.3} to{opacity:1} }
      `}</style>
    </div>
  );
}

/* Variant 2 ── Gold sweep wordmark */
function LoaderWordmark({ onDone }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(onDone, 3600);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#030303] flex items-center justify-center overflow-hidden select-none">
      {/* Horizontal texture lines */}
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="absolute inset-x-0 h-px bg-[#C9A227]/[0.025]" style={{ top: `${10 + i * 10}%` }} />
      ))}
      {/* Ambient glow */}
      <div className="absolute w-[600px] h-[320px] bg-[#C9A227]/[0.045] rounded-full blur-[140px] pointer-events-none" />

      <div
        className="relative z-10 flex flex-col items-center gap-7 transition-all duration-700"
        style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? "translateY(0)" : "translateY(24px)" }}
      >
        {/* Wordmark with sweep */}
        <div className="relative overflow-hidden">
          <h1 className="text-[4.5rem] md:text-[6rem] font-serif italic text-white/75 leading-none tracking-tight">
            Janina
          </h1>
          {/* Animated gold sweep overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(201,162,39,0.7) 50%, transparent 100%)",
              animation: phase >= 2 ? "sweep 1.4s ease forwards" : "none",
            }}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="w-10 h-px bg-[#C9A227]/40" />
          <p className="text-[8px] font-black uppercase tracking-[0.65em] text-[#C9A227]/55">Luxury Atelier</p>
          <div className="w-10 h-px bg-[#C9A227]/40" />
        </div>

        {/* Bouncing dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#C9A227]/50"
              style={{ animation: `dotBounce 1.3s ease ${i * 0.22}s infinite` }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes sweep      { from{transform:translateX(-110%)} to{transform:translateX(110%)} }
        @keyframes dotBounce  { 0%,100%{transform:translateY(0);opacity:.35} 50%{transform:translateY(-7px);opacity:1} }
      `}</style>
    </div>
  );
}

/* Variant 3 ── Curtain reveal with Roman crest */
function LoaderCurtain({ onDone }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(onDone, 3900);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0A0A08] flex items-center justify-center overflow-hidden select-none">
      {/* Left curtain */}
      <div
        className="absolute inset-y-0 left-0 w-1/2 bg-[#050503] z-20 transition-transform duration-[750ms] ease-in-out"
        style={{ transform: phase >= 1 ? "translateX(-100%)" : "translateX(0)" }}
      />
      {/* Right curtain */}
      <div
        className="absolute inset-y-0 right-0 w-1/2 bg-[#050503] z-20 transition-transform duration-[750ms] ease-in-out"
        style={{ transform: phase >= 1 ? "translateX(100%)" : "translateX(0)" }}
      />

      {/* Curtain edge glow */}
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 z-10 bg-[#C9A227]/20 blur-sm" />

      {/* Content revealed behind curtain */}
      <div
        className="relative z-10 flex flex-col items-center gap-5 transition-all duration-500"
        style={{
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? "scale(1)" : "scale(0.93)",
        }}
      >
        {/* Roman crest header */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-px bg-[#C9A227]/45" />
            <p className="text-[8px] font-black uppercase tracking-[0.65em] text-[#C9A227]/60">Est. MMXXIV</p>
            <div className="w-12 h-px bg-[#C9A227]/45" />
          </div>
        </div>

        {/* Wordmark */}
        <div className="text-center">
          <h1 className="text-[2.8rem] font-serif italic text-white tracking-wide leading-none">Janina</h1>
          <p className="text-[7px] font-black uppercase tracking-[0.7em] text-[#C9A227]/50 mt-2">Luxury Bags · Atelier</p>
        </div>

        {/* Progress ring */}
        <svg className="w-10 h-10 mt-1" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(201,162,39,0.1)" strokeWidth="1.5" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#C9A227" strokeWidth="1.5"
            strokeDasharray="100" strokeDashoffset="100" strokeLinecap="round"
            style={{
              transformOrigin: "center",
              transform: "rotate(-90deg)",
              animation: "ringFill 2.8s cubic-bezier(.4,0,.2,1) 0.2s forwards",
            }}
          />
        </svg>
      </div>

      <style>{`
        @keyframes ringFill { to { stroke-dashoffset: 0 } }
      `}</style>
    </div>
  );
}

const LOADERS = [LoaderMonogram, LoaderWordmark, LoaderCurtain];

/* ════════════════════════════════════════════════════════════ */

const GlassCard = ({ children, className = "" }) => (
  <div className={`w-full bg-white border border-black/[0.09] rounded-[2rem] shadow-2xl shadow-black/[0.07] ${className}`}>
    {children}
  </div>
);

const StrengthMeter = ({ pass }) => {
  if (!pass) return null;
  const score = (() => {
    let s = 0;
    if (pass.length >= 8)          s += 25;
    if (/[0-9]/.test(pass))        s += 25;
    if (/[A-Z]/.test(pass))        s += 25;
    if (/[^A-Za-z0-9]/.test(pass)) s += 25;
    return s;
  })();
  const color = score <= 25 ? "bg-red-400" : score <= 50 ? "bg-orange-400" : score <= 75 ? "bg-amber-400" : "bg-emerald-400";
  const label = score <= 25 ? "Weak" : score <= 50 ? "Fair" : score <= 75 ? "Good" : "Strong";
  return (
    <div className="w-full mt-2">
      <div className="h-0.5 w-full bg-black/[0.07] rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-[8px] font-black text-right mt-1 text-black/35 uppercase tracking-widest">{label}</p>
    </div>
  );
};

const AuthInput = ({ label, ...props }) => (
  <div>
    {label && (
      <label className="text-[9px] font-black uppercase tracking-[0.32em] text-black/55 block mb-2">{label}</label>
    )}
    <input
      className="w-full h-12 px-0 border-b-2 border-black/10 bg-transparent outline-none focus:border-[#C9A227] text-[14px] font-semibold text-black transition-colors placeholder:text-black/22"
      {...props}
    />
  </div>
);

/* ── Main AuthPage ─────────────────────────────────────────── */
const AuthPage = () => {
  const [view, setView]         = useState(() => sessionStorage.getItem("authView") || "login");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [resetEmail, setResetEmail]   = useState(() => sessionStorage.getItem("resetEmail") || "");
  const [resendCount, setResendCount] = useState(0);
  const [otp, setOtp]           = useState(new Array(6).fill(""));
  const inputRefs               = useRef([]);
  const [isOtpPending, setIsOtpPending] = useState(false);
  const [timer, setTimer]       = useState(0);
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "", fullName: "" });

  /* Pick loader variant once, randomly */
  const [loaderVariant]   = useState(() => Math.floor(Math.random() * LOADERS.length));
  const [showLoader, setShowLoader] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState("/");
  const LoaderComponent = LOADERS[loaderVariant];

  useEffect(() => {
    sessionStorage.setItem("authView", view);
    sessionStorage.setItem("resetEmail", resetEmail);
  }, [view, resetEmail]);

  const navigateTo = (newView) => {
    setResendCount(0); setTimer(0); setIsOtpPending(false);
    setOtp(new Array(6).fill(""));
    setFormData({ email: "", password: "", confirmPassword: "", fullName: "" });
    setView(newView);
  };

  const handleOtpChange = (el, index) => {
    if (isNaN(el.value)) return;
    const next = [...otp]; next[index] = el.value; setOtp(next);
    if (el.value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1].focus();
  };

  /* luxeAlert — only used for errors and non-login flows.
     After loader triggers we do NOT show any alert. */
  const luxeAlert = useCallback((title, text, icon = "success") =>
    Swal.fire({
      title: title.toUpperCase(), text, icon,
      confirmButtonColor: "#C9A227",
      background: "#FDFBF7", color: "#000",
      customClass: {
        popup: "rounded-[2rem] border border-black/[0.06]",
        confirmButton: "rounded-full px-10 py-3 uppercase text-[10px] font-black tracking-widest",
      },
    }), []);

  /* Show premium loader then redirect — NO alert before redirect */
  const triggerLoader = (target = "/") => {
    setRedirectTarget(target);
    setShowLoader(true);
  };

  const handleLoaderDone = () => {
    // Redirect immediately after loader without SweetAlert
    window.location.assign(redirectTarget);
  };

  const handleAuth = useCallback(async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    const emailVal = formData.email.trim().toLowerCase();
    const passVal  = formData.password.trim();
    const nameVal  = formData.fullName?.trim() || "";

    try {
      if (view === "login") {
        const { data: adminRecord } = await supabase.from("admin_credentials").select("*").eq("email", emailVal).maybeSingle();
        const isAdmin = adminRecord && await bcrypt.compare(passVal, adminRecord.password);
        if (isAdmin) {
          sessionStorage.setItem("userEmail", emailVal);
          sessionStorage.setItem("isAuthenticated", "true");
          sessionStorage.setItem("isAdmin", "true");
          triggerLoader("/admin-dashboard");
          return;
        }
        const { data: user, error: userError } = await supabase.from("profiles").select("*").eq("email", emailVal).maybeSingle();
        if (userError || !user) throw new Error("Invalid credentials. Access denied.");
        if (!user.password) throw new Error("Account profile incomplete. Please contact support.");
        const match = await bcrypt.compare(passVal, user.password);
        if (match) {
          const sid = crypto.randomUUID();
          await supabase.from("profiles").update({ last_session_id: sid }).eq("email", emailVal);
          sessionStorage.setItem("userEmail", user.email);
          sessionStorage.setItem("userUuid", user.id);
          sessionStorage.setItem("current_device_session", sid);
          sessionStorage.setItem("isAuthenticated", "true");
          sessionStorage.setItem("isAdmin", "false");
          sessionStorage.setItem("loginSuccessFlag", "true");
          sessionStorage.setItem("tempUserName", user.full_name || emailVal.split("@")[0]);
          triggerLoader("/");
        } else {
          throw new Error("Invalid credentials.");
        }

      } else if (view === "signup") {
        const res  = await fetch(`${API_URL}/send-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailVal }) });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Communication failure.");
        setTimer(120); setIsOtpPending(true); setView("otp");
        luxeAlert("Code Sent", "Verification code dispatched to inbox.");

      } else if (view === "otp") {
        const enteredOtp  = otp.join("");
        const activeEmail = resetEmail || emailVal;
        const verifyRes   = await fetch(`${API_URL}/verify-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: activeEmail, otp: enteredOtp }) });
        const verifyData  = await verifyRes.json();
        if (!verifyData.success) throw new Error("Invalid verification code.");
        if (resetEmail) { setIsOtpPending(false); setTimer(0); setView("new_password"); luxeAlert("Authorized", "Update your password."); return; }
        if (!passVal) throw new Error("Session expired. Please restart signup.");
        const hashed = await bcrypt.hash(passVal, 10);
        const { error: insertError } = await supabase.from("profiles").insert({
          email: activeEmail, password: hashed, full_name: nameVal,
          created_at: new Date().toISOString(),
        });
        if (insertError) {
          if (insertError.code === "23505") throw new Error("Email already registered.");
          throw insertError;
        }
        sessionStorage.setItem("userEmail", activeEmail);
        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("loginSuccessFlag", "true");
        sessionStorage.setItem("tempUserName", nameVal || activeEmail.split("@")[0]);
        triggerLoader("/");
      }
    } catch (err) { luxeAlert("Error", err.message, "error"); }
    finally { setLoading(false); }
  }, [view, formData, otp, resetEmail, luxeAlert]);

  useEffect(() => {
    if (otp.join("").length === 6 && view === "otp") handleAuth();
  }, [otp, view, handleAuth]);

  useEffect(() => {
    let interval;
    if (timer > 0) { interval = setInterval(() => setTimer(p => p - 1), 1000); }
    else if (timer === 0 && isOtpPending) {
      if (resendCount >= 2) {
        setIsOtpPending(false);
        luxeAlert("Expired", "Max attempts reached.", "error");
        navigateTo("login");
      }
    }
    return () => clearInterval(interval);
  }, [timer, isOtpPending, resendCount, luxeAlert]);

  const formatTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleForgotCheck = async (e) => {
    e.preventDefault();
    const emailVal = formData.email.trim().toLowerCase();
    setLoading(true);
    try {
      const { data } = await supabase.from("profiles").select("email").eq("email", emailVal).maybeSingle();
      if (!data) throw new Error("Identity not found.");
      const res     = await fetch(`${API_URL}/send-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailVal }) });
      const otpData = await res.json();
      if (!otpData.success) throw new Error("Failed to send security code.");
      setResetEmail(data.email); setTimer(120); setIsOtpPending(true); setView("otp");
      luxeAlert("Verified", "Security code dispatched to your inbox.");
    } catch (err) { luxeAlert("Denied", err.message, "error"); }
    finally { setLoading(false); }
  };

  const handleOverride = async (e) => {
    e.preventDefault();
    const newPass     = formData.password.trim();
    const confirmPass = formData.confirmPassword.trim();
    const targetEmail = (resetEmail || sessionStorage.getItem("resetEmail"))?.trim().toLowerCase();
    if (!targetEmail) return luxeAlert("Error", "Session expired. Restart recovery.", "error");
    if (newPass.length < 8 || newPass.length > 15) return luxeAlert("Error", "Password must be 8–15 characters.", "error");
    if (newPass !== confirmPass) return luxeAlert("Error", "Passwords do not match.", "error");
    setLoading(true);
    try {
      const hashed = await bcrypt.hash(newPass, 10);
      const { data, error } = await supabase.from("profiles").update({ password: hashed }).eq("email", targetEmail).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Identity not found.");
      sessionStorage.removeItem("resetEmail"); setResetEmail("");
      setFormData({ email: targetEmail, password: "", confirmPassword: "", fullName: "" });
      luxeAlert("Success", "Password updated.");
      setView("login");
    } catch (err) { luxeAlert("Error", err.message, "error"); }
    finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (resendCount >= 2) { luxeAlert("Limit Reached", "Max attempts exhausted.", "error"); navigateTo("login"); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/send-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: formData.email }) });
      const data = await res.json();
      if (!data.success) throw new Error("Failed to resend code.");
      setResendCount(p => p + 1); setTimer(120); setOtp(new Array(6).fill(""));
      luxeAlert("Resent", `New code sent. (${2 - (resendCount + 1)} attempts remaining)`);
    } catch (err) { luxeAlert("Error", err.message, "error"); }
    finally { setLoading(false); }
  };

  /* ── Render ── */
  return (
    <>
      {/* Premium loader overlay — shown only, no alert after */}
      {showLoader && <LoaderComponent onDone={handleLoaderDone} />}

      <div className="min-h-[100dvh] w-full bg-[#FDFBF7] flex items-center justify-center p-5 font-sans text-black overflow-y-auto relative select-none">

        {/* Ambient blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#C9A227]/[0.07] rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] bg-[#C9A227]/[0.04] rounded-full blur-[90px]" />
        </div>

        {/* OTP timer pill */}
        <div className={`fixed top-5 right-5 bg-white border border-black/[0.07] px-5 py-3 rounded-2xl shadow-lg z-50 transition-all duration-500 ${
          isOtpPending ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}>
          <p className="text-[8px] font-black tracking-[0.3em] text-[#C9A227] uppercase mb-0.5">Session Active</p>
          <p className="text-lg font-mono font-bold text-black tracking-widest text-center">{formatTime(timer)}</p>
        </div>

        <div className="w-full flex justify-center relative z-10">

          {/* ── OTP ── */}
          {view === "otp" && (
            <GlassCard className="max-w-sm p-10 text-center animate-in zoom-in-95 duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#C9A227]/10 border border-[#C9A227]/20 flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-[#C9A227] text-2xl">shield_lock</span>
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/45 mb-1">Identity Verification</p>
              <h1 className="text-2xl font-serif italic text-black mb-1">Enter Code</h1>
              <p className="text-[11px] font-bold text-[#C9A227] uppercase tracking-widest mb-7">Code sent to inbox</p>
              <div className="flex justify-between gap-2 mb-6">
                {otp.map((data, index) => (
                  <input
                    key={index} type="text" maxLength="1"
                    ref={(el) => (inputRefs.current[index] = el)}
                    value={data}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-full h-13 text-center text-xl font-mono font-bold bg-[#F7F5F0] border-2 border-transparent rounded-2xl focus:border-[#C9A227] focus:bg-white outline-none transition-all"
                    style={{ height: "52px" }}
                  />
                ))}
              </div>
              <div className="h-8 flex items-center justify-center mb-6">
                {timer > 0 ? (
                  <p className="text-xl font-mono font-black text-[#C9A227]">{formatTime(timer)}</p>
                ) : resendCount < 2 ? (
                  <button onClick={handleResendOtp} className="text-[10px] font-black uppercase text-[#C9A227] hover:underline tracking-widest">
                    Resend Code ({2 - resendCount} left)
                  </button>
                ) : (
                  <p className="text-[10px] font-black uppercase text-red-400 tracking-widest">Attempt Limit Exceeded</p>
                )}
              </div>
              <button onClick={() => navigateTo("login")} className="text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-black transition-colors">Cancel</button>
            </GlassCard>
          )}

          {/* ── Forgot Password ── */}
          {view === "forgot" && (
            <GlassCard className="max-w-sm p-10 text-center animate-in zoom-in-95 duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#C9A227]/10 border border-[#C9A227]/20 flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-[#C9A227] text-2xl">lock_reset</span>
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/45 mb-1">Account Recovery</p>
              <h1 className="text-2xl font-serif italic text-black mb-7">Recover Password</h1>
              <form onSubmit={handleForgotCheck} className="space-y-6 text-left">
                <AuthInput label="Email Address" type="email" placeholder="your@email.com"
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                <button type="submit" disabled={loading}
                  className="w-full h-12 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.32em] hover:bg-[#C9A227] transition-all disabled:opacity-30">
                  {loading ? "Verifying…" : "Verify Email"}
                </button>
                <button type="button" onClick={() => navigateTo("login")}
                  className="w-full text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-black transition-colors py-1">
                  Back to Login
                </button>
              </form>
            </GlassCard>
          )}

          {/* ── New Password ── */}
          {view === "new_password" && (
            <GlassCard className="max-w-sm p-10 text-center animate-in zoom-in-95 duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#C9A227]/10 border border-[#C9A227]/20 flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-[#C9A227] text-2xl">key</span>
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/45 mb-1">Update Password</p>
              <h1 className="text-2xl font-serif italic text-black mb-1">New Secret</h1>
              <p className="text-[11px] font-bold text-[#C9A227] tracking-widest mb-7 truncate">{resetEmail}</p>
              <form onSubmit={handleOverride} className="space-y-5 text-left">
                <div>
                  <AuthInput label="New Password" type={showPass ? "text" : "password"} maxLength={15}
                    placeholder="Min. 8 characters" value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                  <StrengthMeter pass={formData.password} />
                </div>
                <AuthInput label="Confirm Password" type={showPass ? "text" : "password"} maxLength={15}
                  placeholder="Repeat password" value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors">
                  <span className="material-symbols-outlined text-sm">{showPass ? "visibility_off" : "visibility"}</span>
                  {showPass ? "Hide" : "Show"}
                </button>
                <button type="submit" disabled={loading}
                  className="w-full h-12 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.32em] hover:bg-[#C9A227] transition-all disabled:opacity-30 mt-2">
                  {loading ? "Updating…" : "Confirm Reset"}
                </button>
                <button type="button" onClick={() => navigateTo("login")}
                  className="w-full text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-black transition-colors py-1">
                  Cancel
                </button>
              </form>
            </GlassCard>
          )}

          {/* ── Login / Signup ── */}
          {(view === "login" || view === "signup") && (
            <div className="w-full max-w-[860px] animate-in fade-in duration-500">
              <GlassCard className="flex overflow-hidden min-h-[520px]">

                {/* Left brand panel */}
                <div className="hidden md:flex w-[44%] bg-[#0A0A0A] flex-col justify-between p-10 relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#C9A227]/8 rounded-full blur-[60px] pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#C9A227]/5 rounded-full blur-[50px] pointer-events-none" />
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9A227]/40 to-transparent" />
                  <div className="relative z-10">
                    <p className="text-[9px] font-black uppercase tracking-[0.45em] text-[#C9A227] mb-2">Est. 2024</p>
                    <h2 className="text-3xl font-serif italic text-white leading-tight">Janina<br />Luxury</h2>
                  </div>
                  <div className="relative z-10">
                    <img src="/Images/summer3.jpg" className="w-full h-48 object-cover rounded-2xl opacity-75 mb-8" alt="brand" />
                    <p className="text-[11px] text-white/40 font-medium leading-relaxed">
                      Every piece is a testament to artisanship, luxury, and timeless design.
                    </p>
                  </div>
                </div>

                {/* Right form panel */}
                <div className="w-full md:w-[56%] flex flex-col justify-center px-8 md:px-10 py-10">
                  <div className="mb-8">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/45 mb-2">
                      {view === "login" ? "Welcome Back" : "Create Account"}
                    </p>
                    <h1 className="text-3xl font-serif italic text-black">
                      {view === "login" ? "Sign In" : "Sign Up"}
                    </h1>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-5">
                    {view === "signup" && (
                      <AuthInput label="Full Name" name="fullName" placeholder="Your full name"
                        value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
                    )}
                    <AuthInput label="Email Address" name="email" type="email" placeholder="your@email.com"
                      value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                    <div>
                      <div className="relative">
                        <AuthInput label="Password" name="password" type={showPass ? "text" : "password"} maxLength={15}
                          placeholder="8–15 characters" value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                        <button type="button" onClick={() => setShowPass(p => !p)}
                          className="absolute right-0 bottom-3 text-black/30 hover:text-black transition-colors">
                          <span className="material-symbols-outlined text-[18px]">{showPass ? "visibility_off" : "visibility"}</span>
                        </button>
                      </div>
                      {view === "signup" && <StrengthMeter pass={formData.password} />}
                    </div>
                    {view === "signup" && (
                      <AuthInput label="Confirm Password" name="confirmPassword" type={showPass ? "text" : "password"} maxLength={15}
                        placeholder="Repeat password" value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
                    )}
                    <button type="submit" disabled={loading}
                      className="w-full h-12 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.38em] mt-4 hover:bg-[#C9A227] transition-all shadow-lg shadow-black/10 active:scale-[0.98] disabled:opacity-30">
                      {loading ? "Processing…" : view === "login" ? "Sign In" : "Continue"}
                    </button>
                  </form>

                  <div className="mt-7 flex justify-between items-center border-t border-black/[0.06] pt-5">
                    <button type="button" onClick={() => navigateTo(view === "login" ? "signup" : "login")}
                      className="text-[10px] uppercase font-black text-black/35 hover:text-[#C9A227] transition-colors tracking-widest">
                      {view === "login" ? "Create Account" : "Back to Login"}
                    </button>
                    {view === "login" && (
                      <button type="button" onClick={() => setView("forgot")}
                        className="text-[10px] uppercase font-black text-black/35 hover:text-[#C9A227] transition-colors tracking-widest">
                        Forgot Password?
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AuthPage;