import { Link, useNavigate } from "react-router-dom";
import useCart from './useCart';
import logo from '../assets/profile.png';

function DetailsNavBar() {
  const { cartCount } = useCart();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 w-full z-[60] bg-white/60 backdrop-blur-2xl border-b border-black/[0.06] px-5 md:px-10 flex items-center justify-between h-[72px]">

      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 group"
      >
        <div className="w-10 h-10 rounded-xl bg-black/[0.05] hover:bg-black/[0.09] flex items-center justify-center transition-colors">
          <span className="material-symbols-outlined text-[20px] text-black/50 group-hover:text-black group-hover:-translate-x-0.5 transition-all">arrow_back_ios_new</span>
        </div>
        <span className="hidden md:block text-[11px] font-black uppercase tracking-widest text-black/40 group-hover:text-black transition-colors">Back</span>
      </button>

      {/* Logo */}
      <button onClick={() => navigate('/')} className="flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-lg overflow-hidden border border-black/[0.08]">
          <img src={logo} alt="Janina" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-black tracking-[0.25em] text-black group-hover:text-[#D4AF37] transition-colors">JANINA</span>
          <span className="text-[8px] tracking-[0.12em] text-[#D4AF37] uppercase font-bold">Luxury Bags</span>
        </div>
      </button>

      {/* Cart */}
      <Link to="/cart" className="relative flex items-center gap-2 h-10 px-4 rounded-xl bg-black hover:bg-[#D4AF37] transition-all duration-300 group">
        <span className="material-symbols-outlined text-[18px] text-white">shopping_bag</span>
        <span className="text-[11px] font-black text-white hidden md:block uppercase tracking-wide">Cart</span>
        {cartCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#D4AF37] group-hover:bg-black text-white text-[9px] font-black flex items-center justify-center rounded-full transition-colors shadow-sm">
            {cartCount}
          </span>
        )}
      </Link>
    </header>
  );
}

export default DetailsNavBar;