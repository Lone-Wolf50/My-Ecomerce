import { useState, useEffect, useRef, useCallback } from "react";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/* ─────────────────────────────────────────────────────────────────
   SECURITY ARCHITECTURE  (Chief Security Officer decisions)
   ─────────────────────────────────────────────────────────────────
   ✓  ZERO Supabase client. No direct DB access from the browser ever.
   ✓  ZERO bcrypt in the browser. Password hashing is server-only.
   ✓  Login uses a single generic error for wrong email OR wrong pass
      → prevents user enumeration timing attacks.
   ✓  Gmail enforcement on BOTH client (UX) AND server (authoritative).
   ✓  sessionStorage only — clears on tab/window close.
   ✓  OTP attempt counting and expiry enforced on the server.
   ✓  Signup is a 2-step flow: /auth/initiate-signup → OTP → /auth/complete-signup
      The pending signup data (email, hashed password, name) is held
      server-side in a short-lived pending store — never in the client.
   ✓  Forgot-password always returns the same message regardless of
      whether the email exists → prevents account enumeration.
   ✓  maxLength on password inputs raised to 72 (bcrypt safe max).
   ─────────────────────────────────────────────────────────────────── */

/* ── Premium Loaders (3 variants, chosen randomly) ─────────────── */
function LoaderMonogram({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3800); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center overflow-hidden select-none">
      <div className="absolute w-[360px] h-[360px] rounded-full border border-[#C9A227]/8" style={{ animation: "monSpin 12s linear infinite" }} />
      <div className="absolute w-[260px] h-[260px] rounded-full border border-[#C9A227]/12" style={{ animation: "monSpin 7s linear infinite reverse" }} />
      <div className="absolute w-[180px] h-[180px] rounded-full border border-[#C9A227]/18" style={{ animation: "monSpin 4s linear infinite" }} />
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="absolute pointer-events-none" style={{
          width: "1px", height: "80px",
          background: "linear-gradient(to top, transparent, rgba(201,162,39,0.18), transparent)",
          top: "calc(50% - 80px)", left: "50%", transformOrigin: "bottom center",
          transform: `rotate(${i * 30}deg) translateX(-50%)`,
          animation: `monPulse 2.4s ease ${i * 0.12}s infinite alternate`,
        }} />
      ))}
      <div style={{ animation: "monFadeScale 0.9s cubic-bezier(.22,1,.36,1) both", opacity: 0 }}
        className="relative z-10 flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-[88px] h-[88px] rounded-[28px] border border-[#C9A227]/30 bg-[#C9A227]/[0.07] flex items-center justify-center shadow-[0_0_60px_rgba(201,162,39,0.12)]">
            <span className="text-[28px] font-serif italic text-[#C9A227] tracking-widest leading-none">JLB</span>
          </div>
          <span className="absolute -top-px -left-px w-4 h-4 border-t border-l border-[#C9A227]/50 rounded-tl-[8px]" />
          <span className="absolute -top-px -right-px w-4 h-4 border-t border-r border-[#C9A227]/50 rounded-tr-[8px]" />
          <span className="absolute -bottom-px -left-px w-4 h-4 border-b border-l border-[#C9A227]/50 rounded-bl-[8px]" />
          <span className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-[#C9A227]/50 rounded-br-[8px]" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.55em] text-[#C9A227]/90">Janina Luxury Bags</p>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">Initializing vault…</p>
        </div>
        <div className="w-36 h-px bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#C9A227]/50 to-[#C9A227]" style={{ animation: "monBar 3.5s cubic-bezier(.4,0,.2,1) forwards" }} />
        </div>
      </div>
      <style>{`
        @keyframes monFadeScale { from{opacity:0;transform:scale(.82)} to{opacity:1;transform:scale(1)} }
        @keyframes monBar       { from{width:0} to{width:100%} }
        @keyframes monSpin      { to{transform:rotate(360deg)} }
        @keyframes monPulse     { from{opacity:.3} to{opacity:1} }
      `}</style>
    </div>
  );
}

function LoaderWordmark({ onDone }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [setTimeout(() => setPhase(1), 300), setTimeout(() => setPhase(2), 900), setTimeout(onDone, 3600)];
    return () => ts.forEach(clearTimeout);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-[9999] bg-[#030303] flex items-center justify-center overflow-hidden select-none">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="absolute inset-x-0 h-px bg-[#C9A227]/[0.025]" style={{ top: `${10 + i * 10}%` }} />
      ))}
      <div className="absolute w-[600px] h-[320px] bg-[#C9A227]/[0.045] rounded-full blur-[140px] pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-7 transition-all duration-700"
        style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? "translateY(0)" : "translateY(24px)" }}>
        <div className="relative overflow-hidden">
          <h1 className="text-[4.5rem] md:text-[6rem] font-serif italic text-white/75 leading-none tracking-tight">Janina</h1>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(201,162,39,0.7) 50%, transparent 100%)",
            animation: phase >= 2 ? "wSweep 1.4s ease forwards" : "none",
          }} />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-px bg-[#C9A227]/40" />
          <p className="text-[9px] font-black uppercase tracking-[0.65em] text-[#C9A227]/75">Luxury Atelier</p>
          <div className="w-10 h-px bg-[#C9A227]/40" />
        </div>
        <div className="flex items-center gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#C9A227]/50"
              style={{ animation: `wBounce 1.3s ease ${i * 0.22}s infinite` }} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes wSweep  { from{transform:translateX(-110%)} to{transform:translateX(110%)} }
        @keyframes wBounce { 0%,100%{transform:translateY(0);opacity:.35} 50%{transform:translateY(-7px);opacity:1} }
      `}</style>
    </div>
  );
}

function LoaderCurtain({ onDone }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [setTimeout(() => setPhase(1), 500), setTimeout(() => setPhase(2), 1200), setTimeout(onDone, 3900)];
    return () => ts.forEach(clearTimeout);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-[9999] bg-[#0A0A08] flex items-center justify-center overflow-hidden select-none">
      <div className="absolute inset-y-0 left-0 w-1/2 bg-[#050503] z-20 transition-transform duration-[750ms] ease-in-out"
        style={{ transform: phase >= 1 ? "translateX(-100%)" : "translateX(0)" }} />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[#050503] z-20 transition-transform duration-[750ms] ease-in-out"
        style={{ transform: phase >= 1 ? "translateX(100%)" : "translateX(0)" }} />
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 z-10 bg-[#C9A227]/20 blur-sm" />
      <div className="relative z-10 flex flex-col items-center gap-5 transition-all duration-500"
        style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? "scale(1)" : "scale(0.93)" }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-px bg-[#C9A227]/45" />
          <p className="text-[9px] font-black uppercase tracking-[0.65em] text-[#C9A227]/80">Est. MMXXIV</p>
          <div className="w-12 h-px bg-[#C9A227]/45" />
        </div>
        <div className="text-center">
          <h1 className="text-[2.8rem] font-serif italic text-white tracking-wide leading-none">Janina</h1>
          <p className="text-[8px] font-black uppercase tracking-[0.7em] text-[#C9A227]/70 mt-2">Luxury Bags · Atelier</p>
        </div>
        <svg className="w-10 h-10 mt-1" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(201,162,39,0.1)" strokeWidth="1.5" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#C9A227" strokeWidth="1.5"
            strokeDasharray="100" strokeDashoffset="100" strokeLinecap="round"
            style={{ transformOrigin: "center", transform: "rotate(-90deg)", animation: "cRing 2.8s cubic-bezier(.4,0,.2,1) 0.2s forwards" }} />
        </svg>
      </div>
      <style>{`@keyframes cRing { to { stroke-dashoffset: 0 } }`}</style>
    </div>
  );
}

const LOADERS = [LoaderMonogram, LoaderWordmark, LoaderCurtain];

/* ── Strength meter ─────────────────────────────────────────────── */
const StrengthMeter = ({ pass }) => {
  if (!pass) return null;
  const score = [pass.length >= 8, /[0-9]/.test(pass), /[A-Z]/.test(pass), /[^A-Za-z0-9]/.test(pass)].filter(Boolean).length * 25;
  const color = score <= 25 ? "#ef4444" : score <= 50 ? "#f97316" : score <= 75 ? "#eab308" : "#10b981";
  const label = score <= 25 ? "Weak" : score <= 50 ? "Fair" : score <= 75 ? "Good" : "Strong";
  return (
    <div className="mt-2.5 space-y-1">
      <div className="h-0.5 w-full bg-black/[0.07] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <p className="text-[12px] font-black text-right uppercase tracking-widest" style={{ color }}>{label}</p>
    </div>
  );
};

/* ── Field input atom ────────────────────────────────────────────── */
const Field = ({ label, hint, icon, error, className = "", ...props }) => (
  <div className={`group ${className}`}>
    <label className="flex items-center justify-between mb-2">
      {/* LABEL: was text-black/40, now text-black/60 — bolder + slightly larger */}
      <span className="text-[12px] font-black uppercase tracking-[0.3em] text-black/60 group-focus-within:text-[#C9A227] transition-colors duration-200">{label}</span>
      {hint && <span className="text-[12px] font-black text-[#C9A227]/80 bg-[#C9A227]/8 px-2 py-0.5 rounded-full">{hint}</span>}
    </label>
    <div className="relative flex items-center">
      {icon && <span className="absolute left-0 bottom-3 material-symbols-outlined text-[16px] text-black/30 group-focus-within:text-[#C9A227]/60 transition-colors select-none pointer-events-none">{icon}</span>}
      <input
        className={`w-full h-12 bg-transparent outline-none text-[15px] font-semibold text-black transition-all placeholder:text-black/35 ${icon ? "pl-6" : "pl-0"} border-b-2 ${error ? "border-red-400" : "border-black/15 focus:border-[#C9A227]"}`}
        {...props}
      />
    </div>
    {error && (
      <p className="text-[13px] font-bold text-red-500 mt-1.5 flex items-center gap-1">
        <span className="material-symbols-outlined text-[13px]">error</span>{error}
      </p>
    )}
  </div>
);

/* ── OTP digit box ────────────────────────────────────────────────── */
const OtpBox = ({ value, onChange, onKeyDown, onPaste, refEl }) => (
  <input
    ref={refEl}
    type="text"
    inputMode="numeric"
    maxLength={1}
    value={value}
    onChange={onChange}
    onKeyDown={onKeyDown}
    onPaste={onPaste}
    className={`w-11 h-14 text-center text-[22px] font-black border-b-2 bg-transparent outline-none transition-all duration-200 ${
      value ? "border-[#C9A227] text-black" : "border-black/20 text-black/40"
    } focus:border-[#C9A227]`}
  />
);

/* ── Spinner helper ─────────────────────────────────────────────── */
const Spinner = () => (
  <span className="w-[14px] h-[14px] border-2 border-white/25 border-t-white rounded-full animate-spin inline-block" />
);

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const AuthPage = () => {
  const [view, setView]         = useState(() => sessionStorage.getItem("authView") || "login");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetEmail, setResetEmail]   = useState(() => sessionStorage.getItem("resetEmail") || "");
  const [cooldown, setCooldown] = useState(0);
  const [otp, setOtp]           = useState(Array(6).fill(""));
  const [errors, setErrors]     = useState({});
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "", fullName: "" });
  const inputRefs               = useRef(Array(6).fill(null));
  const cooldownRef             = useRef(null);

  const [loaderVariant]  = useState(() => Math.floor(Math.random() * LOADERS.length));
  const [showLoader, setShowLoader]   = useState(false);
  const [redirectTarget, setRedirectTarget] = useState("/");
  const LoaderComponent  = LOADERS[loaderVariant];

  useEffect(() => {
    sessionStorage.setItem("authView",    view);
    sessionStorage.setItem("resetEmail",  resetEmail);
  }, [view, resetEmail]);

  /* Cooldown timer */
  const startCooldown = (s = 120) => {
    setCooldown(s);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => setCooldown(p => {
      if (p <= 1) { clearInterval(cooldownRef.current); return 0; }
      return p - 1;
    }), 1000);
  };
  useEffect(() => () => clearInterval(cooldownRef.current), []);
  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const luxeAlert = useCallback((title, text, icon = "success") =>
    Swal.fire({
      title: title.toUpperCase(), text, icon, confirmButtonColor: "#C9A227",
      background: "#FDFBF7", color: "#000",
      customClass: {
        popup: "rounded-[2rem] border border-black/[0.06]",
        confirmButton: "rounded-full px-10 py-3 uppercase text-[10px] font-black tracking-widest",
      },
    }), []);

  const triggerLoader = (target = "/") => { setRedirectTarget(target); setShowLoader(true); };
  const handleLoaderDone = () => window.location.assign(redirectTarget);

  const navigateTo = (v) => {
    clearInterval(cooldownRef.current);
    setCooldown(0);
    setOtp(Array(6).fill(""));
    setErrors({});
    setFormData({ email: "", password: "", confirmPassword: "", fullName: "" });
    setShowPass(false);
    setShowConfirm(false);
    setView(v);
  };

  /* ── OTP helpers ────────────────────────────────────────── */
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    const next = Array(6).fill("");
    digits.split("").forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    inputRefs.current[Math.min(digits.length, 5)]?.focus();
  };
  const handleOtpChange = (e, i) => {
    const v = e.target.value.replace(/\D/g, "");
    const next = [...otp]; next[i] = v.slice(-1); setOtp(next);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
  };
  const handleOtpKeyDown = (e, i) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      const next = [...otp]; next[i - 1] = ""; setOtp(next);
      inputRefs.current[i - 1]?.focus();
    }
  };

  /* ════════════════════════════════════════════════════════════
     1. LOGIN — no client-side validation of credentials
  ════════════════════════════════════════════════════════════ */
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email:    formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrors({ form: data.error || "Invalid credentials. Please try again." });
        return;
      }
      sessionStorage.setItem("userEmail",              data.user.email);
      sessionStorage.setItem("userUuid",               data.user.id);
      sessionStorage.setItem("isAuthenticated",        "true");
      sessionStorage.setItem("isAdmin",                String(!!data.user.isAdmin));
      sessionStorage.setItem("current_device_session", data.user.sessionId);
      if (data.user.fullName) sessionStorage.setItem("tempUserName", data.user.fullName);
      triggerLoader(data.user.isAdmin ? "/admin-dashboard" : "/");
    } catch {
      setErrors({ form: "Connection error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  /* ════════════════════════════════════════════════════════════
     2. SIGNUP INITIATION
  ════════════════════════════════════════════════════════════ */
  const handleSignup = async (e) => {
    e.preventDefault();
    setErrors({});
    const errs = {};
    if (!formData.fullName.trim())                                    errs.fullName = "Full name is required.";
    if (!formData.email.trim().toLowerCase().endsWith("@gmail.com")) errs.email    = "Only Gmail addresses are accepted.";
    if (formData.password.length < 8)                                errs.password = "Minimum 8 characters.";
    if (formData.password !== formData.confirmPassword)              errs.confirmPassword = "Passwords do not match.";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/initiate-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:    formData.email.trim().toLowerCase(),
          password: formData.password,
          fullName: formData.fullName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrors({ form: data.error || "Could not start registration." });
        return;
      }
      startCooldown(120);
      setView("otp");
      luxeAlert("Code Sent", "Check your Gmail inbox for the 6-digit verification code.");
    } catch {
      setErrors({ form: "Connection error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  /* ════════════════════════════════════════════════════════════
     3. OTP VERIFY
  ════════════════════════════════════════════════════════════ */
  const handleOtpVerify = useCallback(async (otpArr) => {
    const code = (otpArr || otp).join("");
    if (code.length < 6) return;
    setLoading(true);
    setErrors({});
    try {
      const activeEmail = resetEmail || formData.email.trim().toLowerCase();

      const res  = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: activeEmail, otp: code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrors({ otp: data.error || data.message || "Invalid or expired code." });
        setOtp(Array(6).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }

      if (resetEmail) {
        setView("new_password");
        return;
      }

      const regRes  = await fetch(`${API_URL}/auth/complete-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: activeEmail }),
      });
      const regData = await regRes.json();
      if (!regRes.ok || !regData.success) {
        setErrors({ form: regData.error || "Registration failed. Please restart." });
        setView("signup");
        return;
      }
      sessionStorage.setItem("userEmail",              activeEmail);
      sessionStorage.setItem("userUuid",               regData.user.id);
      sessionStorage.setItem("isAuthenticated",        "true");
      sessionStorage.setItem("isAdmin",                "false");
      sessionStorage.setItem("tempUserName",           regData.user.fullName || activeEmail.split("@")[0]);
      sessionStorage.setItem("current_device_session", regData.user.sessionId);
      triggerLoader("/");
    } catch {
      setErrors({ otp: "Connection error. Please try again." });
    } finally {
      setLoading(false);
    }
  }, [otp, resetEmail, formData.email]);

  useEffect(() => {
    if (view === "otp" && otp.join("").length === 6 && !loading) handleOtpVerify(otp);
  }, [otp, view]);

  /* ════════════════════════════════════════════════════════════
     4. RESEND OTP
  ════════════════════════════════════════════════════════════ */
  const handleResend = async () => {
    if (cooldown > 0) return;
    const activeEmail = resetEmail || formData.email.trim().toLowerCase();
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: activeEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { luxeAlert("Error", data.error || "Could not resend.", "error"); return; }
      setOtp(Array(6).fill(""));
      setErrors({});
      startCooldown(120);
      inputRefs.current[0]?.focus();
    } catch {
      luxeAlert("Error", "Connection error.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ════════════════════════════════════════════════════════════
     5. FORGOT PASSWORD
  ════════════════════════════════════════════════════════════ */
  const handleForgotCheck = async (e) => {
    e.preventDefault();
    setErrors({});
    const emailVal = formData.email.trim().toLowerCase();
    setLoading(true);
    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal }),
      });
      setResetEmail(emailVal);
      startCooldown(120);
      setView("otp");
      luxeAlert("Check Your Inbox", "If that address has an account, a code has been sent.");
    } catch {
      setErrors({ form: "Connection error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  /* ════════════════════════════════════════════════════════════
     6. RESET PASSWORD
  ════════════════════════════════════════════════════════════ */
  const handleNewPassword = async (e) => {
    e.preventDefault();
    setErrors({});
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match." });
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, password: formData.password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setErrors({ form: data.error || "Reset failed." }); return; }
      setResetEmail("");
      navigateTo("login");
      luxeAlert("Password Updated", "You can now sign in with your new password.");
    } catch {
      setErrors({ form: "Connection error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  /* ── Loader active ─────────────────────────────────────── */
  if (showLoader) return <LoaderComponent onDone={handleLoaderDone} />;

  /* ── Background ─────────────────────────────────────────── */
  const Bg = () => (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#FDFBF7] overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-[#C9A227]/[0.035] blur-[130px]" />
      <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-[#C9A227]/[0.025] blur-[110px]" />
      <div className="absolute inset-0 opacity-[0.022]" style={{ backgroundImage: "radial-gradient(#8B6F1C 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="absolute top-0 right-[20%] h-full w-px bg-gradient-to-b from-transparent via-[#C9A227]/8 to-transparent" />
      <div className="absolute top-0 left-[35%] h-full w-px bg-gradient-to-b from-transparent via-[#C9A227]/5 to-transparent" />
    </div>
  );

  /* ── Error banner ─────────────────────────────────────── */
  const ErrBanner = ({ msg }) => msg ? (
    <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
      <span className="material-symbols-outlined text-red-400 text-[15px] mt-0.5 shrink-0">gpp_bad</span>
      <p className="text-[13px] font-bold text-red-600">{msg}</p>
    </div>
  ) : null;

  return (
    <>
      <Bg />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-14">
        <div className="w-full flex flex-col items-center gap-6">

          {/* ═══════════════════════════════════════════
              FORGOT PASSWORD
          ═══════════════════════════════════════════ */}
          {view === "forgot" && (
            <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white border border-black/[0.07] rounded-[2rem] shadow-2xl shadow-black/[0.05] overflow-hidden">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-[#C9A227]/50 to-transparent" />
                <div className="p-10">
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#C9A227]/8 border border-[#C9A227]/15 flex items-center justify-center mx-auto mb-5">
                      <span className="material-symbols-outlined text-[#C9A227] text-[24px]">lock_reset</span>
                    </div>
                    {/* was text-black/30 → text-black/55 */}
                    <p className="text-[12px] font-black uppercase tracking-[0.5em] text-black/55 mb-1">Account Recovery</p>
                    <h1 className="text-[1.7rem] font-serif italic text-black">Forgot Password?</h1>
                    {/* was text-black/40 → text-black/60, font-medium → font-semibold */}
                    <p className="text-[14px] text-black/60 font-semibold mt-2 leading-relaxed">Enter your email and we'll send a secure reset code.</p>
                  </div>
                  <form onSubmit={handleForgotCheck} className="space-y-5" noValidate>
                    <Field label="Email Address" icon="mail" type="email" placeholder="yourname@gmail.com"
                      autoComplete="email" value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })} required error={errors.email} />
                    <ErrBanner msg={errors.form} />
                    <button type="submit" disabled={loading}
                      className="w-full h-12 bg-black text-white rounded-2xl text-[13px] font-black uppercase tracking-[0.3em] hover:bg-[#C9A227] transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                      {loading ? <><Spinner />Verifying…</> : "Send Reset Code"}
                    </button>
                    {/* was text-black/30 → text-black/50 */}
                    <button type="button" onClick={() => navigateTo("login")}
                      className="w-full text-[13px] font-black uppercase tracking-widest text-black/50 hover:text-black transition-colors py-1">
                      ← Back to Sign In
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════
              OTP
          ═══════════════════════════════════════════ */}
          {view === "otp" && (
            <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white border border-black/[0.07] rounded-[2rem] shadow-2xl shadow-black/[0.05] overflow-hidden">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-[#C9A227]/50 to-transparent" />
                <div className="p-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#C9A227]/8 border border-[#C9A227]/15 flex items-center justify-center mx-auto mb-5">
                    <span className="material-symbols-outlined text-[#C9A227] text-[24px]">shield_lock</span>
                  </div>
                  {/* was text-black/30 → text-black/55 */}
                  <p className="text-[12px] font-black uppercase tracking-[0.5em] text-black/55 mb-1">Verification</p>
                  <h1 className="text-[1.7rem] font-serif italic text-black mb-1">Enter Code</h1>
                  <p className="text-[14px] font-bold text-[#C9A227] tracking-wide mb-1 truncate px-4">{resetEmail || formData.email}</p>
                  {/* was text-black/35 → text-black/60, font-medium → font-semibold */}
                  <p className="text-[14px] text-black/60 font-semibold mb-8 leading-relaxed">We sent a 6-digit code to your Gmail. Enter it below.</p>

                  <div className="flex items-center justify-center gap-2.5 mb-5">
                    {otp.map((digit, i) => (
                      <OtpBox key={i} value={digit}
                        refEl={el => { inputRefs.current[i] = el; }}
                        onChange={e => handleOtpChange(e, i)}
                        onKeyDown={e => handleOtpKeyDown(e, i)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                      />
                    ))}
                  </div>

                  {errors.otp && (
                    <div className="flex items-center justify-center gap-1.5 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-4 text-left">
                      <span className="material-symbols-outlined text-red-400 text-[14px] shrink-0">error</span>
                      <p className="text-[13px] font-bold text-red-600">{errors.otp}</p>
                    </div>
                  )}

                  {loading && (
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="w-4 h-4 border-2 border-[#C9A227]/25 border-t-[#C9A227] rounded-full animate-spin" />
                      {/* was text-black/30 → text-black/50 */}
                      <span className="text-[13px] font-black uppercase tracking-widest text-black/50">Verifying…</span>
                    </div>
                  )}

                  <div className="mt-3 mb-1">
                    {cooldown > 0
                      /* was text-black/25 → text-black/50 */
                      ? <p className="text-[13px] font-black uppercase tracking-widest text-black/50">Resend in {fmtTime(cooldown)}</p>
                      : <button onClick={handleResend} disabled={loading}
                          className="text-[13px] font-black uppercase tracking-widest text-[#C9A227] hover:text-black transition-colors disabled:opacity-30">
                          Resend Code
                        </button>
                    }
                  </div>
                  {/* was text-black/30 → text-black/50 */}
                  <button type="button" onClick={() => navigateTo(resetEmail ? "forgot" : "signup")}
                    className="mt-4 w-full text-[13px] font-black uppercase tracking-widest text-black/50 hover:text-black transition-colors py-1">
                    ← Go Back
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════
              NEW PASSWORD
          ═══════════════════════════════════════════ */}
          {view === "new_password" && (
            <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white border border-black/[0.07] rounded-[2rem] shadow-2xl shadow-black/[0.05] overflow-hidden">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-[#C9A227]/50 to-transparent" />
                <div className="p-10">
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#C9A227]/8 border border-[#C9A227]/15 flex items-center justify-center mx-auto mb-5">
                      <span className="material-symbols-outlined text-[#C9A227] text-[24px]">key</span>
                    </div>
                    {/* was text-black/30 → text-black/55 */}
                    <p className="text-[12px] font-black uppercase tracking-[0.5em] text-black/55 mb-1">New Password</p>
                    <h1 className="text-[1.7rem] font-serif italic text-black mb-1">Set New Secret</h1>
                    <p className="text-[14px] font-bold text-[#C9A227] tracking-wide truncate">{resetEmail}</p>
                  </div>
                  <form onSubmit={handleNewPassword} className="space-y-5" noValidate>
                    <div>
                      <div className="relative">
                        <Field label="New Password" icon="lock" type={showPass ? "text" : "password"}
                          placeholder="Min. 8 characters" value={formData.password} maxLength={72}
                          autoComplete="new-password"
                          onChange={e => setFormData({ ...formData, password: e.target.value })} required error={errors.password} />
                        <button type="button" onClick={() => setShowPass(p => !p)}
                          className="absolute right-0 bottom-3 text-black/35 hover:text-black transition-colors">
                          <span className="material-symbols-outlined text-[16px]">{showPass ? "visibility_off" : "visibility"}</span>
                        </button>
                      </div>
                      <StrengthMeter pass={formData.password} />
                    </div>
                    <div className="relative">
                      <Field label="Confirm Password" icon="lock_person" type={showConfirm ? "text" : "password"}
                        placeholder="Repeat password" value={formData.confirmPassword} maxLength={72}
                        autoComplete="new-password"
                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} required error={errors.confirmPassword} />
                      <button type="button" onClick={() => setShowConfirm(p => !p)}
                        className="absolute right-0 bottom-3 text-black/35 hover:text-black transition-colors">
                        <span className="material-symbols-outlined text-[16px]">{showConfirm ? "visibility_off" : "visibility"}</span>
                      </button>
                    </div>
                    <ErrBanner msg={errors.form} />
                    <button type="submit" disabled={loading}
                      className="w-full h-12 bg-black text-white rounded-2xl text-[13px] font-black uppercase tracking-[0.3em] hover:bg-[#C9A227] transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                      {loading ? <><Spinner />Updating…</> : "Confirm New Password"}
                    </button>
                    {/* was text-black/30 → text-black/50 */}
                    <button type="button" onClick={() => navigateTo("login")}
                      className="w-full text-[13px] font-black uppercase tracking-widest text-black/50 hover:text-black transition-colors py-1">
                      Cancel
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════
              LOGIN / SIGNUP  (split panel)
          ═══════════════════════════════════════════ */}
          {(view === "login" || view === "signup") && (
            <div className="w-full max-w-[920px] animate-in fade-in duration-500">
              <div className="bg-white border border-black/[0.07] rounded-[2rem] shadow-2xl shadow-black/[0.05] flex overflow-hidden" style={{ minHeight: "580px" }}>

                {/* ── Left brand panel ─────────────────────────── */}
                <div className="hidden md:flex w-[41%] bg-[#080808] flex-col justify-between p-10 relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-60 h-60 bg-[#C9A227]/7 rounded-full blur-[75px] pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-44 h-44 bg-[#C9A227]/5 rounded-full blur-[60px] pointer-events-none" />
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9A227]/45 to-transparent" />
                  <div className="absolute right-0 inset-y-0 w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />

                  {/* Brand header */}
                  <div className="relative z-10">
                    {/* was text-[#C9A227] (already fine) — bumped size slightly */}
                    <p className="text-[12px] font-black uppercase tracking-[0.55em] text-[#C9A227] mb-3">Est. 2024</p>
                    <h2 className="text-[2.5rem] font-serif italic text-white leading-[1.1] tracking-tight">Janina<br/>Luxury</h2>
                    <div className="flex items-center gap-2 mt-4">
                      <div className="w-7 h-px bg-[#C9A227]/35" />
                      {/* was text-white/25 → text-white/50 */}
                      <p className="text-[11px] font-black uppercase tracking-[0.42em] text-white/50">Accra, Ghana</p>
                    </div>
                  </div>

                  {/* Collection image */}
                  <div className="relative z-10 my-4">
                    <div className="relative overflow-hidden rounded-[18px]">
                      <img src="/Images/summer3.jpg" className="w-full h-[200px] object-cover opacity-55" alt="Janina collection" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/70 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 bg-black/55 backdrop-blur-md border border-white/[0.08] rounded-xl px-3 py-1.5">
                        {/* was text-[#C9A227] (already solid) — bumped size */}
                        <p className="text-[11px] font-black uppercase tracking-[0.45em] text-[#C9A227]">New Collection</p>
                      </div>
                    </div>
                  </div>

                  {/* Trust signals */}
                  <div className="relative z-10 space-y-2.5">
                    {[
                      { icon: "verified",       text: "Certified Authentic"  },
                      { icon: "encrypted",      text: "End-to-End Secured"   },
                      { icon: "local_shipping", text: "Premium Delivery"     },
                    ].map(({ icon, text }) => (
                      <div key={icon} className="flex items-center gap-2.5">
                        {/* was text-[#C9A227]/45 → text-[#C9A227]/70 */}
                        <span className="material-symbols-outlined text-[14px] text-[#C9A227]/70">{icon}</span>
                        {/* was text-white/25 → text-white/55 */}
                        <span className="text-[12px] font-bold text-white/55 uppercase tracking-wider">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Right form panel ─────────────────────────── */}
                <div className="w-full md:w-[59%] flex flex-col justify-center px-8 md:px-12 py-10">

                  {/* Tab toggle */}
                  <div className="flex items-center bg-black/[0.04] rounded-2xl p-1 mb-8">
                    {[["login", "Sign In"], ["signup", "Register"]].map(([v, label]) => (
                      <button key={v} onClick={() => navigateTo(v)}
                        className={`flex-1 h-9 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all duration-200 ${
                          view === v ? "bg-black text-white shadow" : "text-black/45 hover:text-black/70"
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Heading */}
                  <div className="mb-6">
                    <h1 className="text-[1.75rem] font-serif italic text-black leading-snug">
                      {view === "login" ? "Welcome back." : "Join the vault."}
                    </h1>
                    {/* was text-black/35 → text-black/60, font-medium → font-semibold, size bump */}
                    <p className="text-[14px] text-black/60 font-semibold mt-1">
                      {view === "login"
                        ? "Sign in to access your exclusive account."
                        : "Create your Janina account. Gmail only."}
                    </p>
                  </div>

                  <ErrBanner msg={errors.form} />

                  {/* ── Login form ── */}
                  {view === "login" && (
                    <form onSubmit={handleLogin} className="space-y-5" noValidate>
                      <Field label="Email Address" icon="mail" name="email" type="email"
                        placeholder="yourname@gmail.com" autoComplete="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })} required error={errors.email} />
                      <div className="relative">
                        <Field label="Password" icon="lock" name="password"
                          type={showPass ? "text" : "password"} maxLength={72}
                          placeholder="Your password" autoComplete="current-password"
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })} required error={errors.password} />
                        <button type="button" onClick={() => setShowPass(p => !p)}
                          className="absolute right-0 bottom-3 text-black/35 hover:text-black transition-colors">
                          <span className="material-symbols-outlined text-[16px]">{showPass ? "visibility_off" : "visibility"}</span>
                        </button>
                      </div>
                      <div className="flex justify-end -mt-1">
                        {/* was text-black/30 → text-black/50 */}
                        <button type="button" onClick={() => { setErrors({}); setFormData(f => ({ ...f, password: "" })); setView("forgot"); }}
                          className="text-[13px] font-black uppercase tracking-widest text-black/50 hover:text-[#C9A227] transition-colors">
                          Forgot password?
                        </button>
                      </div>
                      <button type="submit" disabled={loading}
                        className="w-full h-12 bg-black text-white rounded-2xl text-[13px] font-black uppercase tracking-[0.35em] hover:bg-[#C9A227] transition-all shadow-lg shadow-black/8 active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-2">
                        {loading ? <><Spinner />Signing In…</> : "Sign In"}
                      </button>
                    </form>
                  )}

                  {/* ── Signup form ── */}
                  {view === "signup" && (
                    <form onSubmit={handleSignup} className="space-y-4" noValidate>
                      <Field label="Full Name" icon="person" name="fullName"
                        placeholder="Your full name" autoComplete="name"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })} required error={errors.fullName} />
                      <Field label="Gmail Address" icon="mail" name="email" type="email"
                        placeholder="yourname@gmail.com" autoComplete="email"
                        hint="Gmail only"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })} required error={errors.email} />
                      <div>
                        <div className="relative">
                          <Field label="Password" icon="lock" name="password"
                            type={showPass ? "text" : "password"} maxLength={72}
                            placeholder="8–72 characters" autoComplete="new-password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })} required error={errors.password} />
                          <button type="button" onClick={() => setShowPass(p => !p)}
                            className="absolute right-0 bottom-3 text-black/35 hover:text-black transition-colors">
                            <span className="material-symbols-outlined text-[16px]">{showPass ? "visibility_off" : "visibility"}</span>
                          </button>
                        </div>
                        <StrengthMeter pass={formData.password} />
                      </div>
                      <div className="relative">
                        <Field label="Confirm Password" icon="lock_person" name="confirmPassword"
                          type={showConfirm ? "text" : "password"} maxLength={72}
                          placeholder="Repeat password" autoComplete="new-password"
                          value={formData.confirmPassword}
                          onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} required error={errors.confirmPassword} />
                        <button type="button" onClick={() => setShowConfirm(p => !p)}
                          className="absolute right-0 bottom-3 text-black/35 hover:text-black transition-colors">
                          <span className="material-symbols-outlined text-[16px]">{showConfirm ? "visibility_off" : "visibility"}</span>
                        </button>
                      </div>
                      <button type="submit" disabled={loading}
                        className="w-full h-12 bg-black text-white rounded-2xl text-[13px] font-black uppercase tracking-[0.35em] hover:bg-[#C9A227] transition-all shadow-lg shadow-black/8 active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-2 mt-1">
                        {loading ? <><Spinner />Creating Account…</> : "Create Account"}
                      </button>
                    </form>
                  )}

                  {/* was text-black/25 → text-black/50, font-bold → font-semibold, size bump */}
                  <p className="mt-5 text-center text-[12px] font-semibold text-black/50 leading-relaxed">
                    By continuing you agree to Janina's Terms of Use &amp; Privacy Policy.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default AuthPage;