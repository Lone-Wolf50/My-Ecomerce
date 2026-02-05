import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="w-full bg-white/60 backdrop-blur-md border-t border-black/5 pt-24 pb-12 mt-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-16">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-8">
          
          {/* Brand Brief - Spanning 5 columns for more "breathing room" */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="flex items-center gap-3 text-primary">
              <svg className="size-8" fill="currentColor" viewBox="0 0 48 48">
                <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"></path>
              </svg>
              <h2 className="text-3xl font-black tracking-[0.2em] text-black-solid italic">LUXE</h2>
            </div>
            
            <p className="text-[13px] text-black-solid/50 leading-[1.8] max-w-sm font-medium uppercase tracking-widest">
              Ethically crafted luxury since 2012. <br />
              Designed in the heart of Paris, handmade by master artisans in Italy.
            </p>
          </div>

          {/* Navigation Links - Spanning 7 columns */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-12">
            
            {/* Shop Column */}
            <div className="flex flex-col gap-6">
              <h4 className="font-black text-[11px] uppercase tracking-[0.4em] text-primary">Collections</h4>
              <ul className="flex flex-col gap-4 text-[12px] text-black-solid/40 font-bold uppercase tracking-widest">
                <li><Link className="hover:text-primary hover:translate-x-1 transition-all inline-block" to="/shop/underarm">New Arrivals</Link></li>
                <li><Link className="hover:text-primary hover:translate-x-1 transition-all inline-block" to="/shop/crossbody">Bestsellers</Link></li>
                <li><Link className="hover:text-primary hover:translate-x-1 transition-all inline-block" to="/shop/limited">Limited Edition</Link></li>
              </ul>
            </div>

            {/* Support Column */}
            <div className="flex flex-col gap-6">
              <h4 className="font-black text-[11px] uppercase tracking-[0.4em] text-primary">Assistance</h4>
              <ul className="flex flex-col gap-4 text-[12px] text-black-solid/40 font-bold uppercase tracking-widest">
                <li><Link className="hover:text-primary hover:translate-x-1 transition-all inline-block" to="#">Product Care</Link></li>
                <li><Link className="hover:text-primary hover:translate-x-1 transition-all inline-block" to="#">Shipping & Returns</Link></li>
                <li><Link className="hover:text-primary hover:translate-x-1 transition-all inline-block" to="#">Contact Boutique</Link></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div className="flex flex-col gap-6">
              <h4 className="font-black text-[11px] uppercase tracking-[0.4em] text-primary">Corporate</h4>
              <ul className="flex flex-col gap-4 text-[12px] text-black-solid/40 font-bold uppercase tracking-widest">
                <li><Link className="hover:text-primary hover:translate-x-1 transition-all inline-block" to="#">Privacy Policy</Link></li>
                <li><Link className="hover:text-primary hover:translate-x-1 transition-all inline-block" to="#">Terms of Service</Link></li>
                <li><Link className="hover:text-primary hover:translate-x-1 transition-all inline-block" to="#">Accessibility</Link></li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-24 pt-8 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] uppercase tracking-[0.5em] text-black-solid/30 font-bold">
            © 2026 LUXE International S.p.A.
          </p>
          <div className="flex gap-8">
            <span className="text-[10px] uppercase tracking-[0.3em] text-black-solid/20">Paris</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-black-solid/20">Milan</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-black-solid/20">London</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-black-solid/20">New York</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;