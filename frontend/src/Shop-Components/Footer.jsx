import { useState } from "react";
import { Link } from "react-router-dom";

function Footer() {
  const [activeInfo, setActiveInfo] = useState(null);

  const footerSections = [
    {
      id: "collections",
      title: "Collections",
      type: "link", 
      links: [
        { name: "New Arrivals", path: "/shop/new" },
        { name: "Bestsellers", path: "/shop/popular" },
        { name: "Limited Edition", path: "/shop/limited" },
      ],
    },
    {
      id: "assistance",
      title: "Assistance",
      type: "info", 
      links: [
        { name: "Track Order", info: "Check your order status in the 'My Orders' section of your account." },
        { name: "Shipping", info: "We deliver within 2-3 business days. Insured worldwide." },
        { name: "Returns", info: "We offer a 5-day collection service from your home for all returns and exchanges." },
      ],
    },
    {
      id: "corporate",
      title: "Corporate",
      type: "info", 
      links: [
        { name: "The Maison", info: "Founded in 2012. Our Product combines traditional craft with modern tech." },
        { name: "Sustainability", info: "Our leather is sourced from gold-rated tanneries with 0% water waste targets." },
        { name: "Privacy", info: "Your data is stored on private Swiss servers and is never shared with third parties." },
      ],
    },
  ];

  const handleInteraction = (name) => {
    setActiveInfo(activeInfo === name ? null : name);
  };

  return (
    <footer className="relative w-full mt-16 md:mt-24 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,#7000ff10,transparent_40%),radial-gradient(circle_at_90%_80%,#ff3d0010,transparent_40%)] animate-pulse" />
      
      {/* Glass Container */}
      <div className="w-full bg-white/10 backdrop-blur-[60px] backdrop-saturate-150 border-t border-white/30 py-10 md:py-16">
        
        <div className="max-w-[1440px] mx-auto px-6 md:px-8 lg:px-16">
          {/* Main Content */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 md:gap-12 lg:gap-16">
            
            {/* Brand Logo - Compact on Mobile */}
            <div className="lg:w-1/4">
              <h2 className="text-2xl md:text-3xl font-black tracking-[0.4em] italic text-black-solid">LUXE</h2>
              <p className="mt-2 md:mt-4 text-[11px] md:text-[13px] text-black-solid/40 font-bold uppercase tracking-[0.25em] md:tracking-[0.3em]">
                Excellence in every stitch.
              </p>
            </div>

            {/* Navigation Grid - Responsive */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
              {footerSections.map((section) => (
                <div key={section.id} className="flex flex-col gap-4 md:gap-5">
                  <h4 className="font-black text-[11px] md:text-[13px] uppercase tracking-[0.4em] md:tracking-[0.5em] text-primary/60 border-b border-black/5 pb-2">
                    {section.title}
                  </h4>
                  <ul className="flex flex-col gap-3 md:gap-4">
                    {section.links.map((link) => (
                      <li 
                        key={link.name} 
                        className="relative group"
                        onMouseEnter={() => section.type === "info" && setActiveInfo(link.name)}
                        onMouseLeave={() => setActiveInfo(null)}
                        onClick={() => section.type === "info" && handleInteraction(link.name)}
                      >
                        {section.type === "link" ? (
                          <Link 
                            to={link.path}
                            className="text-[12px] md:text-[13px] text-black-solid/50 font-bold uppercase tracking-[0.2em] hover:text-primary transition-colors"
                          >
                            {link.name}
                          </Link>
                        ) : (
                          <div className="flex flex-col cursor-pointer">
                            <span className={`text-[12px] md:text-[13px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${activeInfo === link.name ? 'text-primary translate-x-1' : 'text-black-solid/50'}`}>
                              {link.name}
                            </span>
                            
                            {/* Info Dropdown - Compact on Mobile */}
                            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeInfo === link.name ? 'max-h-40 opacity-100 mt-2 md:mt-3' : 'max-h-0 opacity-0'}`}>
                              <div className="p-3 md:p-4 bg-white/30 backdrop-blur-3xl border border-white/40 rounded-lg shadow-xl">
                                <p className="text-[11px] md:text-[12px] leading-relaxed text-black-solid/70 font-bold italic tracking-wide">
                                  {link.info}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Bar - Compact on Mobile */}
          <div className="mt-10 md:mt-16 lg:mt-20 pt-6 md:pt-8 lg:pt-10 border-t border-black/[0.03] flex flex-col sm:flex-row justify-between items-center gap-4 md:gap-6">
            <p className="text-[9px] md:text-[11px] uppercase tracking-[0.5em] md:tracking-[0.8em] text-black-solid/20 font-black">
              © 2026 LUXE S.p.A.
            </p>
            <div className="flex gap-4 md:gap-6 lg:gap-7 grayscale opacity-12">
                <span className="text-[10px] md:text-[12px] uppercase tracking-[0.3em] md:tracking-[0.4em]">Milan</span>
                <span className="text-[10px] md:text-[12px] uppercase tracking-[0.3em] md:tracking-[0.4em]">Paris</span>
                <span className="text-[10px] md:text-[12px] uppercase tracking-[0.3em] md:tracking-[0.4em]">NYC</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
