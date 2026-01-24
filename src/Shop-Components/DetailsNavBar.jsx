import { Link, useNavigate } from "react-router-dom";
import useCart from './useCart'; 

function DetailsNavBar({ category }) {
    const { cartCount } = useCart();
    const navigate = useNavigate();

    return (
        <header className="fixed top-0 left-0 w-full z-[60] bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex items-center justify-between">
            {/* Back Button - Goes to category, no text displayed */}
            <button 
                onClick={() => navigate(`/shop/${category}`)} 
                className="flex items-center text-off-white hover:text-primary-gold transition-colors p-2"
                aria-label="Go back"
            >
                <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
            </button>

            {/* Center Logo */}
            <div className="flex items-center gap-2">
                <div className="text-primary-gold">
                    <svg className="size-6" fill="currentColor" viewBox="0 0 48 48">
                        <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"></path>
                    </svg>
                </div>
                <span className="text-[11px] font-black tracking-[0.3em] text-white">LUXE</span>
            </div>

            {/* Cart Icon */}
            <Link to="/cart" className="relative p-2 text-off-white hover:text-primary-gold transition-colors">
                <span className="material-symbols-outlined text-2xl">shopping_bag</span>
                {cartCount > 0 && (
                    <span className="absolute top-1 right-1 bg-primary-gold text-black text-[9px] font-black size-4 flex items-center justify-center rounded-full animate-pulse">
                        {cartCount}
                    </span>
                )}
            </Link>
        </header>
    );
}

export default DetailsNavBar;