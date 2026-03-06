import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/profile.png";

const COLS = {
  collections: [
    { label: "New Arrivals",    path: "/shop/new"      },
    { label: "Crossbody Bags",  path: "/shop/crossbody"},
    { label: "Underarm Bags",   path: "/shop/underarm" },
    { label: "Summer / Picnic", path: "/shop/picnic"   },
    { label: "Limited Edition", path: "/shop/limited"  },
  ],
  service: [
    { label: "My Orders",  path: "/orders"  },
    { label: "Track Order",path: "/orders"  },
    { label: "Support",    path: "/support" },
    { label: "Reviews",    path: "/reviews" },
    { label: "Sign In",    path: "/login"   },
  ],
};

export default function Footer() {
  const [email, setEmail]       = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleJoin = (e) => {
    e.preventDefault();
    if (email.trim()) { setSubmitted(true); setEmail(""); }
  };

  return (
    <footer className="relative mt-16 md:mt-24 bg-[#080808] text-white overflow-hidden">

      {/* Ambient glows */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[280px] bg-[#C9A227]/7 rounded-full blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 right-[-8%] w-[420px] h-[420px] bg-[#C9A227]/5 rounded-full blur-[90px]" />

      {/* Top gold accent line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#C9A227]/55 to-transparent" />

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">

        {/* ── MAIN CONTENT ──────────────────────────────────── */}
        <div className="py-14 md:py-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_1.2fr] gap-10 lg:gap-14">

          {/* ── Brand + newsletter ─── */}
          <div className="flex flex-col gap-7 sm:col-span-2 lg:col-span-1">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/[0.12] shadow-lg">
                <img src={logo} alt="Janina" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-[15px] font-black tracking-[0.22em] text-white leading-none">JANINA</p>
                <p className="text-[8px] tracking-[0.2em] text-[#C9A227] font-bold mt-0.5">Luxury Bags · Ghana</p>
              </div>
            </div>

            <p className="text-[13px] text-white/42 leading-relaxed max-w-[300px] font-medium">
              Handcrafted luxury bags curated for the remarkable. Every stitch, a statement. Every piece, a legacy.
            </p>

            {/* Newsletter */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.42em] text-white/28 mb-3">The Vault — Insider Access</p>
              {submitted ? (
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span className="text-[12px] font-black uppercase tracking-wider">You're in the vault.</span>
                </div>
              ) : (
                <form onSubmit={handleJoin} className="flex gap-2">
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 h-11 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 text-[13px] font-bold text-white placeholder:text-white/18 outline-none focus:border-[#C9A227]/50 transition-colors"
                  />
                  <button type="submit"
                    className="h-11 px-5 bg-[#C9A227] text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shrink-0 shadow-lg shadow-[#C9A227]/20"
                  >
                    Join
                  </button>
                </form>
              )}
            </div>

            {/* Social */}
            <div className="flex items-center gap-3">
              {[
                { icon: "photo_camera", label: "Instagram" },
                { icon: "chat",         label: "WhatsApp"  },
                { icon: "language",     label: "Website"   },
              ].map(({ icon, label }) => (
                <button key={icon} aria-label={label}
                  className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-[#C9A227]/20 hover:border-[#C9A227]/40 transition-all group"
                >
                  <span className="material-symbols-outlined text-[18px] text-white/30 group-hover:text-[#C9A227] transition-colors">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Collections ─────────── */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.48em] text-[#C9A227] mb-5 pb-3 border-b border-white/[0.06]">
              Collections
            </h4>
            <ul className="space-y-3">
              {COLS.collections.map(({ label, path }) => (
                <li key={label}>
                  <Link to={path}
                    className="text-[13px] font-bold text-white/40 hover:text-white hover:pl-1.5 uppercase tracking-wide transition-all duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Service ─────────────── */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.48em] text-[#C9A227] mb-5 pb-3 border-b border-white/[0.06]">
              Service
            </h4>
            <ul className="space-y-3">
              {COLS.service.map(({ label, path }) => (
                <li key={label}>
                  <Link to={path}
                    className="text-[13px] font-bold text-white/40 hover:text-white hover:pl-1.5 uppercase tracking-wide transition-all duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Promise + trust ─────── */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.48em] text-[#C9A227] mb-5 pb-3 border-b border-white/[0.06]">
              Our Promise
            </h4>
            <ul className="space-y-3 mb-7">
              {[
                "3-Day Free Returns",
                "Authenticity Certified",
                "Complimentary Shipping",
                "Insured Packaging",
                "Secure Payments",
              ].map((txt) => (
                <li key={txt} className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[15px] text-[#C9A227]/65 shrink-0">check_circle</span>
                  <span className="text-[12px] font-bold text-white/40 uppercase tracking-wide">{txt}</span>
                </li>
              ))}
            </ul>

            {/* Trust badges */}
            <div className="space-y-2.5 pt-5 border-t border-white/[0.06]">
              {[
                { icon: "verified_user", text: "256-bit Encryption"  },
                { icon: "lock",          text: "Private & Secure"    },
                { icon: "credit_card",   text: "Powered by Paystack" },
              ].map(({ icon, text }) => (
                <div key={icon} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-white/18">{icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/18">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR ─────────────────────────────────────── */}
        <div className="border-t border-white/[0.05] py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] uppercase tracking-[0.55em] font-black text-white/18">
            © 2026 Janina Luxury Bags · Accra, Ghana
          </p>
          <div className="flex items-center gap-5 md:gap-7">
            {["Privacy Policy", "Terms of Use", "Cookies"].map((item) => (
              <span key={item}
                className="text-[10px] uppercase tracking-widest font-bold text-white/15 hover:text-white/40 transition-colors cursor-pointer"
              >
                {item}
              </span>
            ))}
          </div>
          <p className="text-[9px] uppercase tracking-[0.3em] font-black text-white/12">
            Crafted with precision
          </p>
        </div>
      </div>
    </footer>
  );
}