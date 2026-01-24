import { useState } from "react";
import Navbar from './Navbar.jsx';

function Review() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const REVIEWS = [
        {
            id: 1,
            name: "Mila Waters",
            date: "Oct 12, 2023",
            title: "An Ethereal Masterpiece",
            content: "The craftsmanship is surprisingly resilient. I've used it daily for my city commute and it looks as pristine as the day I unboxed it. The structure is architectural yet fluid.",
            helpfulCount: 24,
            verified: true,
            rating: 5,
        },
        // ... (Keep your other reviews here)
    ];

    return (
        <div className="select-none bg-primary-black text-off-white min-h-screen">
            <Navbar />
            
            {/* Main Wrapper - Removed the 600px constraint */}
            <main className="w-full">
                
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 border-b border-white/10 pb-24">
                        <div className="text-center lg:text-left lg:w-1/2">
                            <h1 className="font-editorial text-5xl md:text-7xl lg:text-8xl mb-8 italic text-primary-gold leading-tight">
                                Excellence <br />
                                Defined by You
                            </h1>
                            <p className="text-off-white/80 max-w-md mx-auto lg:mx-0 text-lg md:text-xl font-light leading-relaxed">
                                Hear from our community of collectors and discover why LUXE is
                                the choice for timeless luxury leather artistry.
                            </p>
                        </div>

                        {/* Rating Card */}
                        <div className="bg-card-dark p-8 md:p-10 rounded-3xl flex flex-col md:flex-row gap-10 w-full lg:max-w-2xl border border-white/5 shadow-2xl">
                            <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 pb-8 md:pb-0 md:pr-12">
                                <span className="text-6xl md:text-7xl font-editorial font-bold italic">4.9</span>
                                <div className="flex text-accent-gold my-4">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className="material-symbols-outlined fill-icon">star</span>
                                    ))}
                                </div>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-off-white/40">1,240 Reviews</p>
                            </div>
                            
                            <div className="flex-grow space-y-3">
                                {[92, 5, 2, 1, 0].map((percent, i) => (
                                    <div key={i} className="flex items-center gap-4 text-sm">
                                        <span className="w-4 font-bold">{5 - i}</span>
                                        <div className="flex-grow h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary-gold" style={{ width: `${percent}%` }}></div>
                                        </div>
                                        <span className="w-8 text-off-white/60">{percent}%</span>
                                    </div>
                                ))}
                                <div className="pt-6">
                                    <button className="w-full bg-accent-gold text-black py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform">
                                        Write A Review
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Promise Section - Fixed Grid for PC */}
                <section className="bg-stone-900/30">
                    <div className="max-w-7xl mx-auto px-6 py-28">
                        <div className="text-center mb-20">
                            <h2 className="font-editorial text-4xl md:text-5xl italic mb-6 text-primary-gold">Our Promise</h2>
                            <p className="text-off-white/60 max-w-lg mx-auto text-base">Quality in every stitch, legacy in every interaction.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
                            {[
                                { icon: 'precision_manufacturing', title: 'Authentic Artistry', desc: 'Meticulously handmade using premium materials.' },
                                { icon: 'local_shipping', title: 'Secure Delivery', desc: 'Global door-to-door reliability with full tracking.' },
                                { icon: 'verified_user', title: 'Lifetime Support', desc: 'Dedicated care ensuring your investment is valued.' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col items-center text-center group p-8 rounded-2xl hover:bg-white/5 transition-colors">
                                    <div className="size-20 bg-card-dark rounded-full flex items-center justify-center mb-8 border border-white/5 text-primary-gold group-hover:border-primary-gold transition-all duration-500">
                                        <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                                    </div>
                                    <h3 className="font-editorial text-2xl italic mb-4">{item.title}</h3>
                                    <p className="text-off-white/70 font-light">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials - Fixed spacing for wide screens */}
                <section className="max-w-5xl mx-auto px-6 py-28">
                    <h2 className="font-editorial text-4xl md:text-5xl italic text-primary-gold text-center mb-24">Collector Testimonials</h2>
                    <div className="space-y-20">
                        {REVIEWS.map((review, index) => (
                            <div key={review.id} className={`flex flex-col md:flex-row gap-12 ${index !== 0 ? "pt-20 border-t border-white/5" : ""}`}>
                                <div className="md:w-48 shrink-0">
                                    <p className="font-bold text-lg text-off-white">{review.name}</p>
                                    {review.verified && (
                                        <p className="text-primary-gold text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                                            <span className="material-symbols-outlined text-xs">verified</span> Verified Buyer
                                        </p>
                                    )}
                                    <p className="text-off-white/40 text-[10px] uppercase mt-4">{review.date}</p>
                                </div>
                                <div className="flex-grow">
                                    <h4 className="font-editorial text-2xl md:text-3xl mb-4 italic">"{review.title}"</h4>
                                    <p className="text-off-white/80 leading-relaxed text-lg font-light">{review.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-28 flex flex-col items-center">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="px-12 py-5 rounded-full border border-primary-gold/30 text-primary-gold font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-primary-gold hover:text-black transition-all">
                            Load More Stories
                        </button>
                        {isMenuOpen && <p className="mt-8 text-off-white/40 animate-pulse text-sm italic">Loading......</p>}
                    </div>
                </section>
            </main>

            <footer className="py-12 border-t border-white/5 text-center">
                <h2 className="text-xl font-editorial text-primary-gold tracking-widest">LUXE</h2>
                <p className="text-[9px] uppercase tracking-widest text-white/20 mt-4">© 2026 Luxury Reimagined</p>
            </footer>
        </div>
    );
}
export default Review;