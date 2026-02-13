import { Link, useNavigate } from "react-router-dom";
import useCart from './useCart'; 

// Assuming your logo is in the public folder or assets
import logo from '../assets/profile.jpg'; 

function Navbar() {
    const { cartCount } = useCart();
    const navigate = useNavigate();

    return (
        <>
            <header className="fixed top-0 left-0 w-full z-50 bg-cream/80 backdrop-blur-xl border-b border-black/5 px-6 py-4 flex items-center justify-between">
                
                {/* LEFT: Logo & Brand */}
                <div 
                    className="flex items-center gap-4 cursor-pointer"
                    onClick={() => navigate('/')}
                >
                    <img 
                        src={logo} 
                        alt="Janina Luxury Bags Logo" 
                        className="h-12 w-auto rounded-sm shadow-sm"
                    />
                    <div className="hidden md:flex flex-col leading-tight">
                        <span className="text-sm font-black tracking-[0.2em] text-black-solid">JANINA</span>
                        <span className="text-[10px] tracking-[0.1em] text-primary uppercase">Luxury Bags</span>
                    </div>
                </div>

                {/* CENTER: Navigation (Optional - Home Icon moved here or kept simple) */}
                <nav className="flex items-center gap-8">
                    <Link to="/" className="text-black-solid hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-2xl">home</span>
                    </Link>
                </nav>

                {/* RIGHT: Dynamic Cart Icon */}
                <Link to="/cart" className="relative p-2 text-black-solid hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-3xl">shopping_bag</span>
                    {cartCount > 0 && (
                        <span className="absolute top-1 right-1 bg-primary text-white text-[9px] font-black size-4 flex items-center justify-center rounded-full">
                            {cartCount}
                        </span>
                    )}
                </Link>
            </header>

            {/* Spacer */}
            <div className="h-24"></div>
        </>
    );
}

export default Navbar;