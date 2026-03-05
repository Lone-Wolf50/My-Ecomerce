import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, Shield } from 'lucide-react';
import { supabase } from '../../Database-Server/Superbase-client.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const TypingDots = ({ name }) => (
  <div className="flex items-center gap-3 animate-in slide-in-from-left-3 duration-300">
    <div className="w-7 h-7 rounded-lg bg-[#0A0A0A] flex items-center justify-center shrink-0">
      <Shield size={12} className="text-[#D4AF37]" />
    </div>
    <div className="bg-white border border-black/[0.07] px-4 py-3 rounded-[1.5rem] rounded-tl-lg shadow-sm flex items-center gap-2">
      <span className="text-[10px] text-black/35 font-medium italic">{name} is typing</span>
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  </div>
);

const ConnectingScreen = ({ adminName }) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 py-12">
    {adminName ? (
      <div className="text-center animate-in zoom-in-95 duration-500 space-y-4">
        <div className="w-16 h-16 rounded-[1.5rem] bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mx-auto">
          <Shield size={28} className="text-[#D4AF37]" />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37] mb-2">Connected</p>
          <h3 className="text-xl font-serif italic text-black">{adminName} has joined</h3>
          <p className="text-[11px] text-black/40 mt-1">You may now start your conversation.</p>
        </div>
      </div>
    ) : (
      <div className="text-center space-y-5">
        <div className="relative w-16 h-16 mx-auto">
          <div className="w-16 h-16 rounded-[1.5rem] bg-[#0A0A0A] flex items-center justify-center">
            <Shield size={26} className="text-[#D4AF37]" />
          </div>
          <div className="absolute inset-0 rounded-[1.5rem] border-2 border-[#D4AF37]/30 animate-ping" />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-black/25 mb-2">Connecting</p>
          <h3 className="text-xl font-serif italic text-black">Reaching our concierge…</h3>
          <p className="text-[11px] text-black/35 mt-2 max-w-xs mx-auto leading-relaxed">
            Our specialist has been notified. Please hold — they'll be with you shortly.
          </p>
        </div>
        <div className="flex justify-center gap-2">
          {[0,1,2].map(i => (
            <span key={i} className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    )}
  </div>
);

/* ── Shown when admin resolves the session ─────────────────── */
const ResolvedScreen = ({ onClose }) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 py-12 bg-[#FAFAF8]">
    <div className="text-center animate-in zoom-in-95 duration-500 space-y-4">
      <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
        <Shield size={28} className="text-emerald-500" />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-2">Session Closed</p>
        <h3 className="text-xl font-serif italic text-black">Chat Resolved</h3>
        <p className="text-[12px] text-black/40 mt-2 max-w-xs mx-auto leading-relaxed">
          Our concierge has marked this session as resolved. We hope we were able to help!
        </p>
      </div>
      <button
        onClick={onClose}
        className="px-8 py-3 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-all"
      >
        Back to Support
      </button>
    </div>
  </div>
);

/* ── Main LiveChat ───────────────────────────────────────────── */
const SupportLiveChat = ({ user, onClose }) => {
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [sending, setSending]         = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const [adminName, setAdminName]     = useState('');
  const [adminTyping, setAdminTyping] = useState(false);
  const [resolved, setResolved]       = useState(false);
  const [sessionId]                   = useState(() => `live_${user.id}_${Date.now()}`);

  const scrollRef      = useRef(null);
  const typingTimer    = useRef(null);
  const graceTimer     = useRef(null);   // 5-second grace period timer
  const sessionCreated = useRef(false);  // true once session row exists in DB
  const inputRef       = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, adminTyping]);

  /* ── Commit session to DB + notify admin ────────────────────── */
  const commitSession = useCallback(async () => {
    if (sessionCreated.current) return;
    sessionCreated.current = true;

    await supabase.from('live_chat_sessions').insert([{
      session_id: sessionId,
      user_id:    user.id,
      user_email: user.email,
      user_name:  user.name || 'Guest',
      status:     'active',
      messages:   [],
    }]);

    try {
      await fetch(`${API_URL}/notify-admin-live-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: user.name || 'A client', userEmail: user.email, sessionId }),
      });
    } catch (e) {
      console.warn('Admin notify failed:', e);
    }
  }, [sessionId, user]);

  /* ── Grace period: wait 5 s before creating session ───────── */
  // If the user closes the chat within 5 seconds, nothing is created.
  // As soon as they type+send, session is committed immediately.
  useEffect(() => {
    graceTimer.current = setTimeout(() => commitSession(), 5000);
    return () => {
      clearTimeout(graceTimer.current);
    };
  }, [commitSession]);

  /* ── Realtime: watch for updates & resolve events ────────── */
  useEffect(() => {
    const channel = supabase
      .channel(`live_session_${sessionId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public',
        table: 'live_chat_sessions',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        const updated = payload.new;
        // Admin resolved → show resolved screen
        if (updated.status === 'resolved') {
          setResolved(true);
          return;
        }
        setMessages(updated.messages || []);
        if (updated.admin_name) { setAdminName(updated.admin_name); setAdminOnline(true); }
        const msgs = updated.messages || [];
        if (msgs.length > 0 && msgs[msgs.length - 1].sender === 'admin') setAdminTyping(false);
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.sender === 'admin') {
          setAdminTyping(true);
          clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setAdminTyping(false), 3000);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const adminPresent = Object.values(state).flat().some(p => p.role === 'admin');
        setAdminOnline(adminPresent);
        const adminEntry = Object.values(state).flat().find(p => p.role === 'admin' && p.name);
        if (adminEntry?.name) setAdminName(adminEntry.name);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ role: 'user', userId: user.id, name: user.name });
      });

    return () => { clearTimeout(typingTimer.current); supabase.removeChannel(channel); };
  }, [sessionId, user.id, user.name]);

  const broadcastTyping = useCallback(async () => {
    const ch = supabase.channel(`live_session_${sessionId}`);
    await ch.send({ type: 'broadcast', event: 'typing', payload: { sender: 'user' } });
  }, [sessionId]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    // User is actively engaging — commit session immediately, cancel grace timer
    clearTimeout(graceTimer.current);
    await commitSession();

    setSending(true);
    const text = input.trim();
    setInput('');

    const newMsg = { id: `msg_${Date.now()}`, sender: 'user', message: text, created_at: new Date().toISOString() };

    try {
      const { data: session } = await supabase
        .from('live_chat_sessions').select('messages').eq('session_id', sessionId).single();
      const updatedMessages = [...(session?.messages || []), newMsg];
      await supabase.from('live_chat_sessions').update({ messages: updatedMessages }).eq('session_id', sessionId);
      setMessages(updatedMessages);
    } catch (e) {
      console.error('Send failed:', e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  // Close without creating a session if still within grace period
  const handleClose = () => { clearTimeout(graceTimer.current); onClose(); };

  const isConnected = adminOnline || messages.some(m => m.sender === 'admin');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-black/[0.05] flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0A0A0A] flex items-center justify-center">
            <Shield size={15} className="text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-black/70">
              {adminName || 'Luxe Concierge'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${resolved ? 'bg-emerald-400' : isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
              <span className={`text-[8px] font-bold uppercase tracking-wider ${resolved ? 'text-emerald-500' : isConnected ? 'text-emerald-500' : 'text-amber-500'}`}>
                {resolved ? 'Resolved' : isConnected ? 'Connected' : 'Connecting…'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={handleClose} className="p-2 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] transition-colors">
          <X size={14} className="text-black/40" />
        </button>
      </div>

      {/* Body */}
      {resolved ? (
        <ResolvedScreen onClose={onClose} />
      ) : !isConnected ? (
        <ConnectingScreen adminName={adminName} />
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-5 bg-[#FAFAF8]">
          <div className="flex justify-start animate-in slide-in-from-left-3 duration-300">
            <div className="max-w-[75%]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-[#0A0A0A] flex items-center justify-center"><Shield size={11} className="text-[#D4AF37]" /></div>
                <span className="text-[8px] font-black uppercase tracking-wider text-black/30">{adminName || 'Concierge'}</span>
              </div>
              <div className="bg-white border border-black/[0.07] px-5 py-3.5 rounded-[1.5rem] rounded-tl-lg shadow-sm">
                <p className="text-[13px] text-black/65 leading-relaxed italic">"Hello, I'm {adminName || 'your concierge'}. How may I assist you today?"</p>
              </div>
            </div>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in ${msg.sender === 'user' ? 'slide-in-from-right-3' : 'slide-in-from-left-3'} duration-300`}>
              {msg.sender === 'admin' && (
                <div className="max-w-[75%]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-lg bg-[#0A0A0A] flex items-center justify-center"><Shield size={11} className="text-[#D4AF37]" /></div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-black/30">{msg.admin_name || adminName || 'Concierge'}</span>
                  </div>
                  <div className="bg-white border border-black/[0.07] px-5 py-3.5 rounded-[1.5rem] rounded-tl-lg shadow-sm">
                    <p className="text-[13px] text-black/65 leading-relaxed italic">"{msg.message}"</p>
                  </div>
                  <p className="text-[7px] text-black/20 mt-1 font-medium">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
              {msg.sender === 'user' && (
                <div className="max-w-[75%]">
                  <div className="bg-[#D4AF37] text-white px-5 py-3.5 rounded-[1.5rem] rounded-tr-lg shadow-md shadow-[#D4AF37]/15">
                    <p className="text-[13px] leading-relaxed font-medium">{msg.message}</p>
                  </div>
                  <p className="text-right text-[7px] text-black/20 mt-1 font-medium">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
          ))}
          {adminTyping && <TypingDots name={adminName || 'Concierge'} />}
        </div>
      )}

      {/* Input — hidden when resolved */}
      {isConnected && !resolved && (
        <div className="p-4 bg-white border-t border-black/[0.05] shrink-0">
          <div className="flex items-end gap-2 bg-black/[0.03] rounded-[1.5rem] p-2 focus-within:bg-black/[0.06] transition-colors">
            <textarea
              ref={inputRef} value={input}
              onChange={e => { setInput(e.target.value); broadcastTyping(); }}
              onKeyDown={handleKeyDown}
              placeholder="Type your message…" rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-[13px] py-2.5 px-4 min-h-[44px] max-h-[100px] placeholder:text-black/25"
            />
            <button onClick={handleSend} disabled={!input.trim() || sending}
              className="w-11 h-11 bg-[#D4AF37] text-white rounded-2xl flex items-center justify-center hover:brightness-110 active:scale-90 transition-all disabled:opacity-25 shrink-0 shadow-md shadow-[#D4AF37]/20"
            >
              {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          <p className="text-center text-[7px] text-black/20 font-bold uppercase tracking-widest mt-2">⏎ Enter to send · ⇧⏎ New line</p>
        </div>
      )}
    </div>
  );
};

export default SupportLiveChat;