import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Use your backend URL from .env (e.g., http://localhost:3001)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const AuthPage = () => {
	const [view, setView] = useState(
		() => sessionStorage.getItem("authView") || "login",
	);
	const [loading, setLoading] = useState(false);
	const [showPass, setShowPass] = useState(false);
	const [resetEmail, setResetEmail] = useState(
		() => sessionStorage.getItem("resetEmail") || "",
	);
	const [resendCount, setResendCount] = useState(0);
	const [otp, setOtp] = useState(new Array(6).fill(""));
	const inputRefs = useRef([]);
	const [isOtpPending, setIsOtpPending] = useState(false);
	const [timer, setTimer] = useState(0);

	const [formData, setFormData] = useState({
		email: "",
		password: "",
		confirmPassword: "",
		fullName: "",
	});

	const calculateStrength = (pass) => {
		if (!pass) return 0;
		let score = 0;
		if (pass.length >= 8) score += 25;
		if (/[0-9]/.test(pass)) score += 25;
		if (/[A-Z]/.test(pass)) score += 25;
		if (/[^A-Za-z0-9]/.test(pass)) score += 25;
		return score;
	};

	const getStrengthColor = (score) => {
		if (score <= 25) return "bg-red-500";
		if (score <= 50) return "bg-orange-500";
		if (score <= 75) return "bg-yellow-500";
		return "bg-green-500";
	};

	const navigateTo = (newView) => {
		console.log(`Navigation: Moving from ${view} to ${newView}`);

		setResendCount(0); // Reset attempts
		setTimer(0);
		setIsOtpPending(false);
		setTimer(0);
		setOtp(new Array(6).fill(""));
		setFormData({ email: "", password: "", confirmPassword: "", fullName: "" });
		setView(newView);
	};

	useEffect(() => {
		sessionStorage.setItem("authView", view);
		sessionStorage.setItem("resetEmail", resetEmail);
	}, [view, resetEmail]);

	const handleOtpChange = (element, index) => {
		if (isNaN(element.value)) return false;
		const newOtp = [...otp];
		newOtp[index] = element.value;
		setOtp(newOtp);
		if (element.value !== "" && index < 5) inputRefs.current[index + 1].focus();
	};

	const handleKeyDown = (e, index) => {
		if (e.key === "Backspace" && !otp[index] && index > 0)
			inputRefs.current[index - 1].focus();
	};

	useEffect(() => {
		if (otp.join("").length === 6 && view === "otp") {
			console.log("OTP: 6 digits entered. Auto-submitting for verification...");
			handleAuth();
		}
	}, [otp]);

	useEffect(() => {
		let interval;
		if (timer > 0) {
			interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
		} else if (timer === 0 && isOtpPending) {
			// Timer hit zero
			if (resendCount >= 2) {
				// ONLY redirect if they are out of retries
				setIsOtpPending(false);
				luxeAlert(
					"EXPIRED",
					"Protocol timed out. Max attempts reached.",
					"error",
				);
				navigateTo("login");
			} else {
				// Stay on page, the UI will now show the "Resend" button automatically
				console.log("Timer expired, awaiting resend choice...");
			}
		}
		return () => clearInterval(interval);
	}, [timer, isOtpPending, resendCount, view]);

	// The Fixed Formatter
	const formatTime = (s) => {
		const m = Math.floor(s / 60);
		const rs = s % 60;
		return `${m.toString().padStart(2, "0")}:${rs.toString().padStart(2, "0")}`;
	};

	const luxeAlert = (title, text, icon = "success") => {
		Swal.fire({
			title: title.toUpperCase(),
			text,
			icon,
			confirmButtonColor: "#D4AF37",
			background: "#FDFBF7",
			color: "#000",
			customClass: {
				popup: "rounded-[3rem] border border-black/5 shadow-2xl",
				confirmButton:
					"rounded-full px-10 py-3 uppercase text-[10px] font-black",
			},
		});
	};

	// Replace your handleAuth 'signup' and 'otp' logic with this:
const handleAuth = async (e) => {
  if (e) e.preventDefault();
  setLoading(true);
  
  // 1. DATA PREP
  // Lowercase the email (standard practice)
  const emailVal = formData.email.trim().toLowerCase();
  // DO NOT lowercase the password. bcrypt is case-sensitive!
  const passVal = formData.password.trim(); 
  const nameVal = formData.fullName?.trim() || "";
  
  
		try {
if (view === "login") {
      setLoading(true);
      try {
        // 1. QUERY THE PLAIN-TEXT ADMIN TABLE
        const { data: adminRecord, error: adminError } = await supabase
          .from("admin_credentials")
          .select("*")
          .eq("email", emailVal)
          .maybeSingle();

        // CHECK FOR DATABASE ERRORS (Table missing, RLS, etc.)
        if (adminError) {
          console.error("Database Error:", adminError);
          throw new Error("System connectivity issue. Please try again.");
        }

        // 2. ADMIN PLAIN TEXT CHECK
        if (adminRecord && adminRecord.password === passVal) {
          console.log("Admin verified via database.");
          
          sessionStorage.setItem("userEmail", emailVal);
          sessionStorage.setItem("isAuthenticated", "true");
          sessionStorage.setItem("isAdmin", "true");
          
          luxeAlert("ADMIN ACCESS", "Identity confirmed. Entering Vault.");
          setTimeout(() => window.location.assign("/admin-dashboard"), 1000);
          return; 
        }

        // 3. FALLBACK: STANDARD USER CHECK (BCRYPT)
        console.log("No Admin match. Checking standard profiles...");
        const { data: user, error: userError } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", emailVal)
          .maybeSingle();

        if (userError || !user) {
          throw new Error("Invalid credentials. Access denied.");
        }

        if (!user.password) {
          throw new Error("Account profile incomplete. Please contact support.");
        }

        const passwordMatch = await bcrypt.compare(passVal, user.password);

        if (passwordMatch) {
          const currentSessionId = crypto.randomUUID();

          await supabase
            .from("profiles")
            .update({ last_session_id: currentSessionId })
            .eq("email", emailVal);

          sessionStorage.setItem("userEmail", user.email);
          sessionStorage.setItem("userUuid", user.id);
          sessionStorage.setItem("current_device_session", currentSessionId);
          sessionStorage.setItem("isAuthenticated", "true");
          sessionStorage.setItem("isAdmin", "false");

          luxeAlert("SUCCESS", `Welcome back`);
          setTimeout(() => window.location.assign("/"), 1000);
        } else {
          throw new Error("Invalid credentials.");
        }
      } catch (err) {
        luxeAlert("ERROR", err.message, "error");
      } finally {
        setLoading(false);
      }
    
    } else if (view === "signup") {
      // 3. SIGNUP FLOW (OTP Request)
      const response = await fetch(`${API_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal }),
      });
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Communication failure.");
      
      setTimer(120);
      setIsOtpPending(true);
      setView("otp");
      luxeAlert("SENT", "Sequence dispatched to inbox.");
      
    } else if (view === "otp") {
      // 4. VERIFY & ARCHIVE FLOW
      const enteredOtp = otp.join("");
      
      const verifyRes = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal, otp: enteredOtp }),
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        throw new Error("Invalid sequence code.");
      }
      
      // Critical check: Ensure password wasn't lost during state change
      if (!passVal) {
        throw new Error("Session expired. Please restart signup.");
      }

      // Hash the original, case-sensitive password
      const hashedPassword = await bcrypt.hash(passVal, 10);
      
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          email: emailVal,
          password: hashedPassword,
          full_name: nameVal,
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        if (insertError.code === '23505') throw new Error("Email already registered.");
        throw insertError;
      }
      
      sessionStorage.setItem("userEmail", emailVal);
      sessionStorage.setItem("isAuthenticated", "true");
      luxeAlert("WELCOME", "Identity archived successfully.");
      setTimeout(() => window.location.assign("/"), 1000);
    }
  } catch (err) {
    luxeAlert("ERROR", err.message, "error");
  } finally {
    setLoading(false);
  }
};const handleForgotCheck = async (e) => {
  if (e) e.preventDefault();
  
  // FIX: Normalize email to match how it was stored during signup
  const emailVal = formData.email.trim().toLowerCase();
  
  console.log("Forgot Password: Checking registry for:", emailVal);
  setLoading(true);
  
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", emailVal) // Use normalized email
      .maybeSingle();

    if (error) throw error;

    if (data) {
      console.log("Forgot Pass: Identity confirmed.");
      // Clear passwords so the fields are empty on the next screen
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      
      setResetEmail(data.email); // Use the email returned from DB
      setView("new_password");
      luxeAlert("IDENTITY VERIFIED", "Log found. Proceed with override.");
    } else {
      throw new Error("Identity not found in logs.");
    }
  } catch (err) {
    luxeAlert("DENIED", err.message, "error");
  } finally {
    setLoading(false);
  }
};
const handleOverride = async (e) => {
  if (e) e.preventDefault();

  // FIX: Do NOT use .toLowerCase() on passwords. 
  // We want to preserve the user's choice of caps/lowercase.
  const newPass = formData.password.trim(); 
  const confirmPass = formData.confirmPassword.trim();
  
  const targetEmail = (resetEmail || sessionStorage.getItem("resetEmail"))?.trim().toLowerCase();

  if (!targetEmail) {
    return luxeAlert("ERROR", "Session expired. Restart recovery.", "error");
  }
  
  if (newPass.length < 8 || newPass.length > 15) {
    return luxeAlert("ERROR", "Password must be 8-15 characters.", "error");
  }
  if (newPass !== confirmPass) {
    return luxeAlert("ERROR", "Passwords do not match.", "error");
  }

  setLoading(true);
  try {
    // Bcrypt will hash 'Pass123' and 'pass123' differently.
    const hashedPassword = await bcrypt.hash(newPass, 10);
  
    const { data, error } = await supabase
      .from("profiles")
      .update({ password: hashedPassword })
      .eq("email", targetEmail)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("Target identity not found.");
    }

    sessionStorage.removeItem("resetEmail");
    setResetEmail("");

    // Keep the email for login, but clear the sensitive fields
    setFormData({
      email: targetEmail, 
      password: "",
      confirmPassword: "",
      fullName: ""
    });

    luxeAlert("SUCCESS", "Vault updated. Case-sensitive password saved.");
    setView("login"); 
  } catch (err) {
    luxeAlert("ERROR", err.message, "error");
  } finally {
    setLoading(false);
  }
};
	const StrengthMeter = ({ pass }) => {
		if (!pass) return null;
		const score = calculateStrength(pass);
		return (
			<div className="w-full mt-2">
				<div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
					<div
						className={`h-full transition-all duration-500 ${getStrengthColor(score)}`}
						style={{ width: `${score}%` }}
					></div>
				</div>
				<p className="text-[7px] font-black text-right mt-1 opacity-50 uppercase tracking-widest">
					Strength: {score}%
				</p>
			</div>
		);
	};
	const handleResendOtp = async () => {
		if (resendCount >= 2) {
			luxeAlert(
				"LIMIT REACHED",
				"Max attempts exhausted. Restart the process.",
				"error",
			);
			navigateTo("login");
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(`${API_URL}/send-otp`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: formData.email }),
			});

			const data = await response.json();
			if (!data.success) throw new Error("Failed to resend code.");

			setResendCount((prev) => prev + 1);
			setTimer(120); // Reset to 2 minutes
			setOtp(new Array(6).fill("")); // Clear the old inputs
			luxeAlert(
				"RESENT",
				`New code sent. (${2 - (resendCount + 1)} attempts remaining)`,
			);
		} catch (err) {
			luxeAlert("ERROR", err.message, "error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-[100dvh] w-full bg-[#FDFBF7] flex items-center justify-center p-4 font-sans text-black overflow-y-auto relative">
			<div
				className={`fixed top-4 right-4 w-40 bg-black text-white p-4 rounded-2xl shadow-2xl border border-[#D4AF37]/30 z-50 transition-all duration-500 ${isOtpPending ? "opacity-100" : "opacity-0 pointer-events-none"}`}
			>
				<p className="text-[7px] font-black tracking-widest text-[#D4AF37] uppercase mb-1 text-center">
					Session Active
				</p>
				<h2 className="text-xl font-mono font-bold text-center tracking-widest">
					AWAITING
				</h2>
			</div>

			<div className="w-full flex justify-center">
				{view === "otp" && (
					<div className="w-full max-w-[400px] bg-white/40 backdrop-blur-3xl border border-white/20 p-10 rounded-[3rem] shadow-2xl text-center animate-in zoom-in duration-300">
						<h1 className="text-2xl font-serif italic mb-2 uppercase">
							Verify
						</h1>
						<p className="text-[9px] font-black tracking-[0.3em] uppercase opacity-40 mb-10 text-[#D4AF37]">
							Enter OTP Sequence
						</p>

						<div className="flex justify-between gap-2 mb-6">
							{otp.map((data, index) => (
								<input
									key={index}
									type="text"
									maxLength="1"
									ref={(el) => (inputRefs.current[index] = el)}
									value={data}
									onChange={(e) => handleOtpChange(e.target, index)}
									onKeyDown={(e) => handleKeyDown(e, index)}
									className="w-full h-14 text-center text-2xl font-mono font-bold bg-white/60 border border-black/10 rounded-xl focus:border-[#D4AF37] outline-none shadow-inner"
								/>
							))}
						</div>

						{/* Timer / Resend Logic */}
						{/* Inside your OTP View JSX */}
						<div className="mb-6">
							{timer > 0 ? (
								/* Show the countdown if time is remaining */
								<div className="text-[11px] font-mono font-black text-[#D4AF37]">
									{formatTime(timer)}
								</div>
							) : /* Timer is 0 - Show Resend or Limit Reached */
							resendCount < 2 ? (
								<button
									type="button"
									onClick={handleResendOtp}
									className="text-[10px] font-black uppercase text-[#D4AF37] hover:underline tracking-widest animate-pulse"
								>
									Resend Code ({2 - resendCount} left)
								</button>
							) : (
								<div className="text-[10px] font-black uppercase text-red-500 tracking-widest">
									Attempt Limit Exceeded
								</div>
							)}
						</div>

						<button
							onClick={() => navigateTo("login")}
							className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
						>
							Abort Session
						</button>
					</div>
				)}
				{view === "forgot" && (
					<div className="w-full max-w-[400px] bg-white/40 backdrop-blur-3xl border border-white/20 p-10 rounded-[3rem] shadow-2xl text-center animate-in zoom-in duration-300">
						<h1 className="text-2xl font-serif italic mb-2 uppercase">
							Recovery
						</h1>
						<p className="text-[9px] font-black tracking-[0.3em] uppercase opacity-40 mb-10 text-[#D4AF37]">
							Enter Identity Email
						</p>
						<form onSubmit={handleForgotCheck} className="space-y-6">
							<input
								type="email"
								placeholder="EMAIL ADDRESS"
								autoComplete="off"
								value={formData.email}
								className="w-full h-10 border-b border-black/10 outline-none focus:border-[#D4AF37] text-[10px] font-black bg-transparent text-center"
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
								required
							/>
							<button
								type="submit"
								className="w-full h-12 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] hover:bg-[#D4AF37] transition-all"
							>
								Verify Email
							</button>
							<button
								type="button"
								onClick={() => navigateTo("login")}
								className="text-[10px] font-black uppercase opacity-60 hover:opacity-100 transition-opacity"
							>
								Back to Login
							</button>
						</form>
					</div>
				)}

				{view === "new_password" && (
					<div className="w-full max-w-[400px] bg-white/40 backdrop-blur-3xl border border-white/20 p-10 rounded-[3rem] shadow-2xl text-center animate-in zoom-in duration-300">
						<h1 className="text-2xl font-serif italic mb-2 uppercase">
							Reset
						</h1>
						<p className="text-[9px] font-black tracking-[0.3em] uppercase opacity-40 mb-10 text-[#D4AF37]">
							Updating: {resetEmail}
						</p>
						<form onSubmit={handleOverride} className="space-y-6">
							<div className="relative">
								<input
									type={showPass ? "text" : "password"}
									maxLength={15}
									autoComplete="new password"
									placeholder="NEW PASSWORD"
									value={formData.password}
									className="w-full h-10 border-b border-black/10 outline-none focus:border-[#D4AF37] text-[10px] font-black bg-transparent"
									onChange={(e) =>
										setFormData({ ...formData, password: e.target.value })
									}
									required
								/>
								<button
									type="button"
									onClick={() => setShowPass(!showPass)}
									className="absolute right-0 top-1 text-2xl"
								>
									{showPass ? "🐵" : "🙈"}
								</button>
								<StrengthMeter pass={formData.password} />
							</div>
							<input
								type={showPass ? "text" : "password"}
								maxLength={15}
								placeholder="CONFIRM NEW PASSWORD"
								value={formData.confirmPassword}
								className="w-full h-10 border-b border-black/10 outline-none focus:border-[#D4AF37] text-[10px] font-black  bg-transparent"
								onChange={(e) =>
									setFormData({ ...formData, confirmPassword: e.target.value })
								}
								required
							/>
							<button
								type="submit"
								className="w-full h-12 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] hover:bg-[#D4AF37] transition-all"
							>
								Confirm 
							</button>
							<button
								type="button"
								onClick={() => navigateTo("login")}
								className="text-[10px] font-black uppercase opacity-60 hover:opacity-100 transition-opacity"
							>
								Cancel
							</button>
						</form>
					</div>
				)}

				{(view === "login" || view === "signup") && (
					<div className="w-full max-w-[900px] bg-white rounded-[3rem] shadow-2xl flex overflow-hidden border border-black/[0.05] min-h-[550px] animate-in fade-in duration-500">
						<div className="hidden md:flex w-1/2 bg-[#F7F7F7] items-center justify-center p-12 border-r border-black/5">
							<img
								src="/Images/summer3.jpg"
								className="w-full h-full object-contain mix-blend-multiply opacity-80"
								alt="brand"
							/>
						</div>
						<div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 py-10">
							<h1 className="text-[38px] italic font-serif mb-6 leading-none uppercase tracking-tighter">
								{view}
							</h1>
							<form onSubmit={handleAuth} className="space-y-4">
								{view === "signup" && (
									<input
										name="fullName"
										placeholder="FULL NAME"
										autoComplete="off"
										value={formData.fullName}
										className="w-full h-10 border-b border-black/10 outline-none focus:border-[#D4AF37] text-[10px] font-black "
										onChange={(e) =>
											setFormData({ ...formData, fullName: e.target.value })
										}
										required
									/>
								)}

								<input
									name="email"
									type="email"
									placeholder="EMAIL ADDRESS"
									autoComplete="off"
									value={formData.email}
									className="w-full h-10 border-b border-black/10 outline-none focus:border-[#D4AF37] text-[10px] font-black"
									onChange={(e) =>
										setFormData({ ...formData, email: e.target.value })
									}
									required
								/>

								<div className="relative">
									<input
										name="password"
										autoComplete="off"
										type={showPass ? "text" : "password"}
										maxLength={15}
										placeholder="PASSWORD (8-15 chars)"
										value={formData.password}
										className="w-full h-10 border-b border-black/10 outline-none focus:border-[#D4AF37] text-[10px] font-black "
										onChange={(e) =>
											setFormData({ ...formData, password: e.target.value })
										}
										required
									/>
									<button
										type="button"
										onClick={() => setShowPass(!showPass)}
										className="absolute right-0 top-1 text-2xl"
									>
										{showPass ? "🐵" : "🙈"}
									</button>
									{view === "signup" && (
										<StrengthMeter pass={formData.password} />
									)}
								</div>

								{view === "signup" && (
									<input
										name="confirmPassword"
										type={showPass ? "text" : "password"}
										autoComplete="off"
										maxLength={15}
										placeholder="CONFIRM PASSWORD"
										value={formData.confirmPassword}
										className="w-full h-10 border-b border-black/10 outline-none focus:border-[#D4AF37] text-[10px] font-black "
										onChange={(e) =>
											setFormData({
												...formData,
												confirmPassword: e.target.value,
											})
										}
										required
									/>
								)}

								<button
									type="submit"
									disabled={loading}
									className="w-full h-12 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] mt-10 hover:bg-[#D4AF37] transition-all shadow-lg active:scale-95"
								>
									{loading
										? "Processing..."
										: view === "login"
											? "Login"
											: "Proceed"}
								</button>
							</form>
							<div className="mt-10 flex justify-between border-t border-black/5 pt-6">
								<button
									type="button"
									onClick={() =>
										navigateTo(view === "login" ? "signup" : "login")
									}
									className="text-[10px] uppercase font-black text-black hover:text-[#D4AF37] transition-colors tracking-widest"
								>
									{view === "login" ? "Create Account" : "Back to Login"}
								</button>
								{view === "login" && (
									<button
										type="button"
										onClick={() => setView("forgot")}
										className="text-[10px] uppercase font-black text-black hover:text-[#D4AF37] transition-colors tracking-widest"
									>
										Forgot Password?
									</button>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default AuthPage;
