import { useState } from "react";
import Navbar from './Navbar.jsx';

function Review() {
    const [isLoading, setIsLoading] = useState(false);
    
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
        // ... other reviews
    ];

    return (
        /* FIX: Removed min-h-screen and flex-col. 
           The page now flows naturally from top to bottom as one single piece.
        */
        <div className="bg-cream text-black-solid selection:bg-primary/20">
            <Navbar />
            
            {/* Content starts here. pt-32 ensures content isn't 
               hidden behind your fixed Navbar.
            */}
            <main className="w-full">
                
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 border-b border-black/10 pb-24">
                        <div className="text-center lg:text-left lg:w-1/2">
                            <h1 className="text-5xl md:text-7xl lg:text-8xl mb-8 font-black uppercase italic text-black-solid leading-tight tracking-tighter">
                                Excellence <br />
                                <span className="text-primary">Defined by You</span>
                            </h1>
                            <p className="text-black-solid/60 max-w-md mx-auto lg:mx-0 text-lg md:text-xl font-light leading-relaxed">
                                Hear from our community of collectors and discover why LUXE is
                                the choice for timeless luxury leather artistry.
                            </p>
                        </div>

                        {/* Rating Card */}
                        <div className="bg-white/40 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] flex flex-col md:flex-row gap-10 w-full lg:max-w-2xl border border-black/5 shadow-2xl shadow-black/5">
                            <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-black/10 pb-8 md:pb-0 md:pr-12">
                                <span className="text-6xl md:text-7xl font-black italic tracking-tighter">4.9</span>
                                <div className="flex text-primary my-4">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className="material-symbols-outlined fill-icon">star</span>
                                    ))}
                                </div>
                                <p className="text-[10px] uppercase tracking-[0.3em] font-black text-black-solid/40">1,240 Reviews</p>
                            </div>
                            
                            <div className="flex-grow space-y-3">
                                {[92, 5, 2, 1, 0].map((percent, i) => (
                                    <div key={i} className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest">
                                        <span className="w-4">{5 - i}</span>
                                        <div className="flex-grow h-1 bg-black/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${percent}%` }}></div>
                                        </div>
                                        <span className="w-8 text-black-solid/40">{percent}%</span>
                                    </div>
                                ))}
                                <div className="pt-6">
                                    <button className="w-full bg-black-solid text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-primary transition-all duration-500 shadow-lg">
                                        Write A Review
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Promise Section */}
                <section className="bg-white/20">
                    <div className="max-w-7xl mx-auto px-6 py-28">
                        <div className="text-center mb-20">
                            <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-6 text-black-solid tracking-tighter">Our Promise</h2>
                            <p className="text-black-solid/40 max-w-lg mx-auto text-[10px] font-bold uppercase tracking-[0.3em]">Quality in every stitch, legacy in every interaction.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
                            {[
                                { icon: 'precision_manufacturing', title: 'Authentic Artistry', desc: 'Meticulously handmade using premium materials.' },
                                { icon: 'local_shipping', title: 'Secure Delivery', desc: 'Global door-to-door reliability with full tracking.' },
                                { icon: 'verified_user', title: 'Lifetime Support', desc: 'Dedicated care ensuring your investment is valued.' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col items-center text-center group p-10 rounded-[2rem] bg-white/40 border border-black/5">
                                    <div className="size-20 bg-cream rounded-full flex items-center justify-center mb-8 border border-black/5 text-primary">
                                        <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                                    </div>
                                    <h3 className="text-xl font-black uppercase italic mb-4 tracking-tight">{item.title}</h3>
                                    <p className="text-black-solid/60 font-medium leading-relaxed text-sm">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="max-w-5xl mx-auto px-6 py-28">
                    <h2 className="text-4xl md:text-5xl font-black uppercase italic text-primary text-center mb-24 tracking-tighter">Collector Testimonials</h2>
                    <div className="space-y-20">
                        {REVIEWS.map((review, index) => (
                            <div key={review.id} className={`flex flex-col md:flex-row gap-12 ${index !== 0 ? "pt-20 border-t border-black/10" : ""}`}>
                                <div className="md:w-48 shrink-0">
                                    <p className="font-black text-lg text-black-solid uppercase italic tracking-tighter">{review.name}</p>
                                    {review.verified && (
                                        <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1 mt-1">
                                            <span className="material-symbols-outlined text-xs">verified</span> Verified Buyer
                                        </p>
                                    )}
                                    <p className="text-black-solid/30 text-[10px] font-bold uppercase tracking-widest mt-4">{review.date}</p>
                                </div>
                                <div className="flex-grow">
                                    <h4 className="text-2xl md:text-3xl mb-4 font-black italic tracking-tighter text-black-solid">"{review.title}"</h4>
                                    <p className="text-black-solid/70 leading-relaxed text-lg font-light">{review.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-28 flex flex-col items-center pb-20">
                        <button 
                            onClick={() => setIsLoading(true)} 
                            className="px-12 py-5 rounded-full border border-primary/30 text-primary font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary hover:text-white transition-all duration-500"
                        >
                            Load More Stories
                        </button>
                        {isLoading && <p className="mt-8 text-black-solid/40 animate-pulse text-[10px] font-black uppercase tracking-widest">Syncing Reviews...</p>}
                    </div>
                </section>
            </main>

            {/* FOOTER: Placed at the very bottom of the natural flow. 
               No absolute or fixed positioning here.
            */}
            <footer className="w-full py-20 border-t border-black/10 text-center bg-white/40 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-2xl font-black tracking-[0.4em] text-primary uppercase">LUXE</h2>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-black-solid/20 font-bold mt-4">
                        © 2026 Luxury Reimagined — Handcrafted Excellence
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default Review;