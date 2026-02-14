import { Link, useNavigate } from "react-router-dom";
import useCart from './useCart'; 
import logo from '../assets/profile.png';
function DetailsNavBar({ category }) {
    const { cartCount } = useCart();
    const navigate = useNavigate();

    return (
        /* UPDATED: Changed to light glass theme (bg-white/40) with black-solid borders */
        <header className="fixed top-0 left-0 w-full z-[60] bg-white/40 backdrop-blur-xl border-b border-black/5 px-6 py-5 flex items-center justify-between">
            
            {/* Back Button - Updated to black-solid */}
            <button 
                onClick={() => navigate(`/shop/${category}`)} 
                className="flex items-center text-black-solid hover:text-primary transition-colors p-2"
                aria-label="Go back"
            >
                <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
            </button>

            {/* Center Logo - Updated colors to match light theme */}
        <div className="flex items-center gap-3 shrink-0">
  {/* Logo */}
  <img
    src={logo}
    alt="Janina Luxury Bags Logo"
    className="h-10 md:h-12 w-auto object-contain rounded-sm"
  />

  {/* Text Block */}
  <div className="flex flex-col leading-tight">
    <span className="text-sm md:text-base font-black tracking-[0.2em] text-black-solid">
      JANINA
    </span>
    <span className="text-[9px] md:text-[10px] tracking-[0.12em] text-primary uppercase">
      Luxury Bags
    </span>
  </div>
</div>


            {/* Cart Icon - Updated colors */}
            <Link to="/cart" className="relative p-2 text-black-solid hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-2xl">shopping_bag</span>
                {cartCount > 0 && (
                    /* Note: Removed animate-pulse to keep it feeling more "static luxury" */
                    <span className="absolute top-1 right-1 bg-primary text-white text-[9px] font-black size-4 flex items-center justify-center rounded-full shadow-sm">
                        {cartCount}
                    </span>
                )}
            </Link>
        </header>
    );
}

export default DetailsNavBar;