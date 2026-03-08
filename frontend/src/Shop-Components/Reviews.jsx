import { useState, useRef, useEffect } from "react";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import Swal from "sweetalert2";

/* ── Static review data ─────────────────────────────────────── */
const ALL_REVIEWS = [
  {
    id: 1,
    name: "Amara Osei",
    location: "Accra, GH",
    date: "Nov 3, 2024",
    title: "An Absolute Statement Piece",
    content:
      "I've owned luxury bags from several European houses, and Janina holds its own effortlessly. The leather has a warmth and depth you can't find in mass-produced pieces. It arrives impeccably packaged — the unboxing alone is an experience.",
    rating: 5,
    verified: true,
    product: "Noir Signature Tote",
    helpful: 38,
  },
  {
    id: 2,
    name: "Efua Mensah-Bonsu",
    location: "Kumasi, GH",
    date: "Oct 19, 2024",
    title: "Worth Every Pesewa",
    content:
      "The craftsmanship is genuinely world-class. I use it daily for work and it hasn't shown a single mark in four months. The gold hardware is weighty and solid — nothing like the plated finishes on cheaper alternatives.",
    rating: 5,
    verified: true,
    product: "Aurum Crossbody",
    helpful: 21,
  },
  {
    id: 3,
    name: "Kofi Asante",
    location: "London, UK",
    date: "Sep 28, 2024",
    title: "A Gift She Still Talks About",
    content:
      "Ordered as an anniversary gift with express delivery. It arrived two days early, wrapped beautifully with a handwritten note. She was speechless. The quality photographs even better in person — deep, rich leather with immaculate stitching throughout.",
    rating: 5,
    verified: true,
    product: "Velour Evening Clutch",
    helpful: 44,
  },
  {
    id: 4,
    name: "Abena Frimpong",
    location: "Accra, GH",
    date: "Sep 4, 2024",
    title: "Understated Elegance",
    content:
      "I was looking for something that commands attention without screaming for it. This bag does that perfectly. The structured silhouette holds its shape all day and transitions seamlessly from boardroom to dinner. Truly timeless.",
    rating: 5,
    verified: true,
    product: "Structured Day Bag",
    helpful: 17,
  },
  {
    id: 5,
    name: "Nana Yaa Acheampong",
    location: "Takoradi, GH",
    date: "Aug 20, 2024",
    title: "Flawless Customer Experience",
    content:
      "From first enquiry to delivery, the service was exceptional. They responded to every question within the hour. The bag itself is stunning — my colleagues thought it was from a Parisian maison. I couldn't be more pleased.",
    rating: 5,
    verified: false,
    product: "Prestige Tote",
    helpful: 12,
  },
  {
    id: 6,
    name: "Kwame Darko",
    location: "Accra, GH",
    date: "Aug 5, 2024",
    title: "Exceptional Build Quality",
    content:
      "Every seam is perfectly aligned. The interior lining is a luxurious suede that makes retrieving items feel deliberate and refined. This is clearly designed by people who understand what luxury actually means — not just a label, but a standard.",
    rating: 5,
    verified: true,
    product: "Executive Briefcase",
    helpful: 29,
  },
];

const RATING_DISTRIBUTION = [92, 5, 2, 1, 0];

/* ── Star display ───────────────────────────────────────────── */
function Stars({ rating, size = "sm" }) {
  const sz = size === "lg" ? "text-xl" : "text-sm";
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`material-symbols-outlined ${sz} ${i < rating ? "text-[#C9A227]" : "text-black/15"}`}
          style={{ fontVariationSettings: i < rating ? "'FILL' 1" : "'FILL' 0" }}
        >
          star
        </span>
      ))}
    </div>
  );
}

/* ── Interactive star picker ────────────────────────────────── */
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <span
            className="material-symbols-outlined text-2xl transition-colors"
            style={{
              color: star <= (hover || value) ? "#C9A227" : "#D1C8B0",
              fontVariationSettings: star <= (hover || value) ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            star
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── Single Review Card ─────────────────────────────────────── */
function ReviewCard({ review, index }) {
  const [helpful, setHelpful] = useState(review.helpful);
  const [voted, setVoted]     = useState(false);

  const handleHelpful = (e) => {
    e.preventDefault();
    if (voted) return;
    setHelpful(p => p + 1);
    setVoted(true);
  };

  return (
    <div
      className="group bg-white rounded-[2rem] border border-black/[0.06] p-7 md:p-9 hover:border-[#C9A227]/30 hover:shadow-[0_12px_50px_rgba(201,162,39,0.08)] transition-all duration-400"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3.5">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg text-white"
            style={{ background: `hsl(${(review.id * 47) % 360}, 40%, 55%)` }}
          >
            {review.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-black text-[15px] text-black uppercase italic tracking-tight leading-none">
                {review.name}
              </p>
              {review.verified && (
                <span className="flex items-center gap-0.5 text-[8px] font-black uppercase tracking-[0.25em] text-[#C9A227]">
                  <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  Verified
                </span>
              )}
            </div>
            <p className="text-[10px] text-black/35 font-medium mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px]">location_on</span>
              {review.location}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <Stars rating={review.rating} />
          <p className="text-[9px] text-black/25 font-bold uppercase tracking-widest mt-1">{review.date}</p>
        </div>
      </div>

      {/* Product tag */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A227]/8 border border-[#C9A227]/15 mb-5">
        <span className="material-symbols-outlined text-[11px] text-[#C9A227]">shopping_bag</span>
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#C9A227]">{review.product}</span>
      </div>

      {/* Quote */}
      <h4 className="text-xl md:text-2xl font-black italic tracking-tighter text-black mb-3 leading-tight">
        "{review.title}"
      </h4>
      <p className="text-black/60 leading-relaxed text-[14px] md:text-[15px] font-medium">
        {review.content}
      </p>

      {/* Helpful */}
      <div className="flex items-center justify-between mt-6 pt-5 border-t border-black/[0.05]">
        <button
          onClick={handleHelpful}
          className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
            voted ? "text-[#C9A227]" : "text-black/25 hover:text-black/50"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: voted ? "'FILL' 1" : "'FILL' 0" }}>
            thumb_up
          </span>
          Helpful ({helpful})
        </button>
        <div className="flex items-center gap-1.5">
          {[...Array(review.rating)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-[#C9A227]" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   WRITE REVIEW MODAL (SweetAlert2 powered — FAKES submission)
══════════════════════════════════════════════════════════════ */
async function openReviewModal() {
  let selectedRating = 5;

  const { value: formValues, isConfirmed } = await Swal.fire({
    title: "",
    html: `
      <div style="text-align:left; font-family: inherit;">
        <p style="font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:.38em; color:#C9A227; margin-bottom:4px;">Share Your Experience</p>
        <h2 style="font-size:24px; font-weight:900; font-style:italic; color:#0a0a0a; margin:0 0 20px; letter-spacing:-.03em;">Write a Review</h2>

        <div style="margin-bottom:16px;">
          <label style="display:block; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:.3em; color:#0a0a0a; margin-bottom:6px;">Your Name</label>
          <input id="swal-name" type="text" placeholder="e.g. Ama K."
            style="width:100%; padding:12px 14px; border:1.5px solid #e5e5e5; border-radius:14px; font-size:14px; font-weight:600; background:#FDFBF7; outline:none; box-sizing:border-box;"
            onfocus="this.style.borderColor='#C9A227'" onblur="this.style.borderColor='#e5e5e5'" />
        </div>

        <div style="margin-bottom:16px;">
          <label style="display:block; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:.3em; color:#0a0a0a; margin-bottom:6px;">Product Purchased</label>
          <select id="swal-product"
            style="width:100%; padding:12px 14px; border:1.5px solid #e5e5e5; border-radius:14px; font-size:13px; font-weight:600; background:#FDFBF7; outline:none; appearance:none; box-sizing:border-box;">
            <option>Noir Signature Tote</option>
            <option>Aurum Crossbody</option>
            <option>Velour Evening Clutch</option>
            <option>Structured Day Bag</option>
            <option>Prestige Tote</option>
            <option>Executive Briefcase</option>
          </select>
        </div>

        <div style="margin-bottom:16px;">
          <label style="display:block; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:.3em; color:#0a0a0a; margin-bottom:8px;">Your Rating</label>
          <div id="swal-stars" style="display:flex; gap:8px;">
            ${[1,2,3,4,5].map(s => `
              <button type="button" data-star="${s}" onclick="
                window.__jlbRating=${s};
                document.querySelectorAll('#swal-stars button').forEach((b,i)=>{
                  b.querySelector('span').style.color = i<${s} ? '#C9A227' : '#D1C8B0';
                });
              " style="background:none;border:none;cursor:pointer;padding:0;font-size:28px;">
                <span class="material-symbols-outlined" style="color:${s <= 5 ? '#C9A227' : '#D1C8B0'}; font-variation-settings:'FILL' 1;">star</span>
              </button>
            `).join("")}
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <label style="display:block; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:.3em; color:#0a0a0a; margin-bottom:6px;">Review Title</label>
          <input id="swal-title" type="text" placeholder="Summarise your experience..."
            style="width:100%; padding:12px 14px; border:1.5px solid #e5e5e5; border-radius:14px; font-size:14px; font-weight:600; background:#FDFBF7; outline:none; box-sizing:border-box;"
            onfocus="this.style.borderColor='#C9A227'" onblur="this.style.borderColor='#e5e5e5'" />
        </div>

        <div>
          <label style="display:block; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:.3em; color:#0a0a0a; margin-bottom:6px;">Your Review</label>
          <textarea id="swal-body" rows="4" placeholder="Tell us about the quality, craftsmanship, and how it made you feel..."
            style="width:100%; padding:12px 14px; border:1.5px solid #e5e5e5; border-radius:14px; font-size:14px; font-weight:600; background:#FDFBF7; outline:none; resize:none; font-family:inherit; box-sizing:border-box;"
            onfocus="this.style.borderColor='#C9A227'" onblur="this.style.borderColor='#e5e5e5'"></textarea>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Submit Review",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#C9A227",
    cancelButtonColor: "#0a0a0a",
    customClass: {
      popup: "rounded-3xl",
      confirmButton: "rounded-xl font-black text-sm px-6",
      cancelButton: "rounded-xl font-black text-sm px-6",
      htmlContainer: "text-left",
    },
    preConfirm: () => {
      const name  = document.getElementById("swal-name")?.value?.trim();
      const title = document.getElementById("swal-title")?.value?.trim();
      const body  = document.getElementById("swal-body")?.value?.trim();
      if (!name || !title || !body) {
        Swal.showValidationMessage("Please fill in all fields before submitting.");
        return false;
      }
      return { name, title, body };
    },
    didOpen: () => {
      window.__jlbRating = 5;
    },
    willClose: () => {
      delete window.__jlbRating;
    },
  });

  if (!isConfirmed) return;

  /* ── Fake loading ── */
  Swal.fire({
    title: "",
    html: `
      <div style="text-align:center; padding:10px 0;">
        <div style="width:48px;height:48px;border:3px solid #C9A227;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div>
        <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.4em;color:#C9A227;">Submitting…</p>
        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
      </div>
    `,
    showConfirmButton: false,
    allowOutsideClick: false,
    customClass: { popup: "rounded-3xl" },
    timer: 1800,
  });

  /* ── Success toast ── */
  setTimeout(() => {
    Swal.fire({
      icon: "success",
      title: "Review Received!",
      html: `<p style="color:#6b7280;font-size:13px">Thank you for sharing your experience. Your review is currently under moderation and will appear on the page once approved.</p>`,
      confirmButtonText: "Wonderful",
      confirmButtonColor: "#C9A227",
      customClass: {
        popup: "rounded-3xl",
        confirmButton: "rounded-xl font-black text-sm",
        icon: "border-none",
      },
    });
  }, 2000);
}

/* ══════════════════════════════════════════════════════════════
   MAIN REVIEWS PAGE
══════════════════════════════════════════════════════════════ */
function Reviews() {
  const [visible, setVisible]       = useState(4);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter]         = useState("all");

  const filtered = filter === "all" ? ALL_REVIEWS : ALL_REVIEWS.filter(r => r.rating === parseInt(filter));

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisible(p => Math.min(p + 3, filtered.length));
      setLoadingMore(false);
    }, 900);
  };

  return (
    <div className="bg-[#FDFBF7] text-black min-h-screen selection:bg-[#C9A227]/20">
      <Navbar />

      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#C9A227]/[0.05] rounded-full blur-[130px]" />
        <div className="absolute bottom-[5%] left-[-5%] w-[400px] h-[400px] bg-[#C9A227]/[0.03] rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 max-w-[1200px] mx-auto px-5 md:px-10 lg:px-16">

        {/* ══════════════════════════════════════════════
            HERO SECTION
        ══════════════════════════════════════════════ */}
        <section className="pt-32 pb-20 border-b border-black/[0.07]">
          <div className="flex flex-col lg:flex-row items-start gap-16 lg:gap-20">

            {/* Left: Headline */}
            <div className="lg:w-1/2">
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#C9A227] mb-4">Collector Voices</p>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter leading-none mb-8 text-black">
                Defined<br />
                <span className="text-[#C9A227]">by You</span>
              </h1>
              <p className="text-black/50 text-base md:text-lg font-medium leading-relaxed max-w-sm mb-10">
                Every bag carries a story. Here's what our community of collectors says about the craftsmanship, service, and legacy of Janina Luxury Bags.
              </p>
              <button
                onClick={openReviewModal}
                className="group inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-[#C9A227] transition-all duration-300 shadow-lg hover:shadow-[0_8px_30px_rgba(201,162,39,0.3)]"
              >
                <span className="material-symbols-outlined text-[18px]">rate_review</span>
                Write a Review
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Right: Rating Card */}
            <div className="w-full lg:w-auto lg:flex-1">
              <div className="bg-white rounded-[2.5rem] border border-black/[0.06] p-8 md:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col md:flex-row gap-10">

                  {/* Score */}
                  <div className="flex flex-col items-center justify-center md:pr-10 md:border-r border-black/[0.07]">
                    <span className="text-7xl md:text-8xl font-black italic tracking-tighter text-black leading-none">4.9</span>
                    <div className="flex gap-0.5 my-3">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-xl text-[#C9A227]"
                          style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                    </div>
                    <p className="text-[9px] uppercase tracking-[0.3em] font-black text-black/30">1,240 Reviews</p>
                  </div>

                  {/* Distribution */}
                  <div className="flex-grow space-y-3">
                    {RATING_DISTRIBUTION.map((pct, i) => (
                      <div key={i} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest">
                        <span className="w-3 text-black/50">{5 - i}</span>
                        <div className="flex-grow h-2 bg-black/[0.05] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#C9A227] to-[#E8C84A] transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-black/30 text-right">{pct}%</span>
                      </div>
                    ))}

                    <div className="pt-5 grid grid-cols-3 gap-3">
                      {[
                        { icon: "workspace_premium", label: "Quality", val: "99%" },
                        { icon: "local_shipping",    label: "Shipping", val: "97%" },
                        { icon: "support_agent",     label: "Service",  val: "98%" },
                      ].map((stat) => (
                        <div key={stat.label} className="text-center p-3 rounded-2xl bg-[#FDFBF7] border border-black/[0.05]">
                          <span className="material-symbols-outlined text-[16px] text-[#C9A227] mb-1 block">{stat.icon}</span>
                          <p className="text-[13px] font-black text-black">{stat.val}</p>
                          <p className="text-[8px] font-black uppercase tracking-widest text-black/30">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            PROMISE PILLARS
        ══════════════════════════════════════════════ */}
        <section className="py-20 border-b border-black/[0.07]">
          <div className="text-center mb-14">
            <p className="text-[9px] font-black uppercase tracking-[0.45em] text-[#C9A227] mb-3">Our Standard</p>
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-black">The Janina Promise</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "precision_manufacturing",
                title: "Artisan Craftsmanship",
                desc: "Each piece is handmade by master artisans using full-grain leather selected for texture, durability, and character.",
              },
              {
                icon: "local_shipping",
                title: "Protected Delivery",
                desc: "Every order is shipped in signature protective packaging with full tracking and discreet presentation.",
              },
              {
                icon: "verified_user",
                title: "Lifetime Commitment",
                desc: "We stand behind every stitch. Our care team is available to assist long after your purchase.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="group p-8 rounded-[2rem] bg-white border border-black/[0.06] hover:border-[#C9A227]/30 hover:shadow-[0_8px_40px_rgba(201,162,39,0.07)] transition-all duration-400 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#C9A227]/8 border border-[#C9A227]/15 flex items-center justify-center mx-auto mb-6 group-hover:bg-[#C9A227]/15 transition-colors">
                  <span className="material-symbols-outlined text-[22px] text-[#C9A227]">{item.icon}</span>
                </div>
                <h3 className="text-lg font-black italic uppercase tracking-tight mb-3">{item.title}</h3>
                <p className="text-black/50 font-medium text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            REVIEWS GRID
        ══════════════════════════════════════════════ */}
        <section className="py-20">

          {/* Section header + filter */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.45em] text-[#C9A227] mb-2">All Reviews</p>
              <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-black">
                {filtered.length} Testimonials
              </h2>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {["all", "5", "4", "3"].map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setVisible(4); }}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                    filter === f
                      ? "bg-[#C9A227] text-white border-[#C9A227] shadow-md"
                      : "bg-white text-black/40 border-black/[0.08] hover:border-[#C9A227]/40 hover:text-black/70"
                  }`}
                >
                  {f === "all" ? "All Stars" : `${f} ★`}
                </button>
              ))}
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.slice(0, visible).map((review, i) => (
              <ReviewCard key={review.id} review={review} index={i} />
            ))}
          </div>

          {/* Load more */}
          {visible < filtered.length && (
            <div className="mt-14 flex flex-col items-center gap-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="group flex items-center gap-3 px-10 py-4 rounded-full border border-[#C9A227]/30 text-[#C9A227] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#C9A227] hover:text-white transition-all duration-400 disabled:opacity-50"
              >
                {loadingMore ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                )}
                {loadingMore ? "Loading Stories…" : `Load More (${filtered.length - visible} remaining)`}
              </button>
              <p className="text-[9px] font-bold text-black/20 uppercase tracking-widest">
                Showing {Math.min(visible, filtered.length)} of {filtered.length} reviews
              </p>
            </div>
          )}

          {/* All loaded */}
          {visible >= filtered.length && filtered.length > 0 && (
            <div className="mt-14 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#C9A227]/8 border border-[#C9A227]/15">
                <span className="material-symbols-outlined text-[14px] text-[#C9A227]">done_all</span>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C9A227]">All {filtered.length} reviews displayed</p>
              </div>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════
            BOTTOM CTA
        ══════════════════════════════════════════════ */}
        <section className="py-20 border-t border-black/[0.07] mb-8">
          <div className="bg-[#0A0A0A] rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden text-center">
            {/* Gold glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.08)_0%,transparent_70%)] pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#C9A227] mb-4">Own a Janina Piece?</p>
              <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white mb-6 leading-tight">
                Your Story Belongs Here
              </h2>
              <p className="text-white/40 text-sm md:text-base font-medium max-w-lg mx-auto mb-10 leading-relaxed">
                Every review helps another collector discover the craftsmanship they deserve. Share your experience and join our community.
              </p>
              <button
                onClick={openReviewModal}
                className="inline-flex items-center gap-3 bg-[#C9A227] text-black px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:brightness-110 transition-all shadow-xl shadow-[#C9A227]/20 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">rate_review</span>
                Write Your Review
              </button>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

/* ── Mini ChevronRight used inside hero ── */
function ChevronRight({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default Reviews;