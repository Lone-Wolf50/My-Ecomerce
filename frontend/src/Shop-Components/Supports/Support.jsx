import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Search, MessageCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import Navbar from '../Navbar.jsx';
import SupportFAQ from './SupportFAQ.jsx';
import SupportOrderTrack from './SupportOrderTrack.jsx';
import SupportLiveChat from './SupportLiveChat.jsx';

/* ── View keys ──────────────────────────────────────── */
// 'home' | 'faq' | 'track' | 'live'

const MENU_ITEMS = [
  {
    id: 'faq',
    icon: HelpCircle,
    title: 'Frequently Asked Questions',
    desc: 'Answers to common questions about orders, returns, and products.',
    accent: 'bg-amber-50 border-amber-100 text-amber-600',
    dot: 'bg-amber-400',
  },
  {
    id: 'track',
    icon: Search,
    title: 'Track Your Order',
    desc: 'Enter your order ID to get the latest status instantly.',
    accent: 'bg-violet-50 border-violet-100 text-violet-600',
    dot: 'bg-violet-400',
  },
  {
    id: 'live',
    icon: MessageCircle,
    title: 'Live Support',
    desc: 'Connect with a concierge specialist in real time.',
    accent: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    dot: 'bg-emerald-400',
  },
];

const Support = () => {
  const [view, setView]   = useState('home');
  const [user, setUser]   = useState(null);
  const navigate          = useNavigate();

  useEffect(() => {
    const email = sessionStorage.getItem('userEmail');
    const uuid  = sessionStorage.getItem('userUuid');
    const name  = sessionStorage.getItem('userName');
    if (!email || !uuid) { navigate('/login'); return; }
    setUser({ email, id: uuid, name: name || 'Guest' });
  }, [navigate]);

  if (!user) return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  /* ── Live chat fills the whole content area ── */
  if (view === 'live') {
    return (
      <div className="min-h-screen bg-[#F7F5F0] font-sans select-none">
        <Navbar />
        <div className="max-w-3xl mx-auto pt-6 px-5 pb-10">
          <button onClick={() => setView('home')} className="flex items-center gap-2 mb-4 group">
            <div className="w-8 h-8 rounded-full border border-black/[0.1] bg-white flex items-center justify-center group-hover:bg-black group-hover:border-black transition-all">
              <ArrowLeft size={13} className="text-black/40 group-hover:text-white transition-colors" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-black/35 group-hover:text-black transition-colors">Back</span>
          </button>
          <div
            className="bg-white rounded-[2.5rem] border border-black/[0.05] shadow-xl shadow-black/[0.05] overflow-hidden flex flex-col"
            style={{ height: '75vh', minHeight: '540px' }}
          >
            <SupportLiveChat
              user={user}
              onClose={() => setView('home')}
            />
          </div>
        </div>
      </div>
    );
  }

  /* ── FAQ & Track share the same layout ── */
  const isSubView = view === 'faq' || view === 'track';
  const viewTitle = view === 'faq' ? 'FAQ' : view === 'track' ? 'Track Order' : '';

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans select-none">
      <Navbar />

      <div className="max-w-3xl mx-auto pt-10 px-5 pb-16">
        {/* Back button when in sub-view */}
        {isSubView && (
          <button onClick={() => setView('home')} className="flex items-center gap-2 mb-6 group">
            <div className="w-8 h-8 rounded-full border border-black/[0.1] bg-white flex items-center justify-center group-hover:bg-black group-hover:border-black transition-all">
              <ArrowLeft size={13} className="text-black/40 group-hover:text-white transition-colors" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-black/35 group-hover:text-black transition-colors">Back</span>
          </button>
        )}

        {/* Page header */}
        <div className="mb-10">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#D4AF37] mb-2">
            {isSubView ? 'Support Center' : 'Direct Assistance'}
          </p>
          <h1 className="text-4xl font-serif italic text-black/90">
            {isSubView ? viewTitle : 'Support Center'}
          </h1>
          {!isSubView && (
            <p className="text-[12px] text-black/40 mt-2 max-w-sm leading-relaxed">
              How can we assist you today? Choose an option below.
            </p>
          )}
        </div>

        {/* Home menu */}
        {view === 'home' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {MENU_ITEMS.map(({ id, icon: Icon, title, desc, accent, dot }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className="w-full flex items-center gap-5 p-6 bg-white rounded-[2rem] border border-black/[0.06] hover:border-[#D4AF37]/30 hover:shadow-lg hover:shadow-black/[0.04] transition-all duration-300 text-left group active:scale-[0.99]"
              >
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${accent}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                    <h3 className="text-[13px] font-black text-black/80">{title}</h3>
                  </div>
                  <p className="text-[11px] text-black/40 leading-relaxed">{desc}</p>
                </div>
                <ChevronRight size={16} className="text-black/20 group-hover:text-[#D4AF37] transition-colors shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* FAQ sub-view */}
        {view === 'faq' && <SupportFAQ />}

        {/* Track sub-view */}
        {view === 'track' && (
          <SupportOrderTrack onDone={() => setView('home')} />
        )}
      </div>
    </div>
  );
};

export default Support;