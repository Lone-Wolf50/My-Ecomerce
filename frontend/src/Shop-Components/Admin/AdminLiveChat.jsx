import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Check, Shield, User } from 'lucide-react';
import { supabase } from '../../Database-Server/Superbase-client.js';
import Swal from 'sweetalert2';

const TypingDots = ({ name }) => (
  <div className="flex justify-end animate-in slide-in-from-right-3 duration-300">
    <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-4 py-3 rounded-[1.5rem] rounded-tr-lg flex items-center gap-2">
      <span className="text-[10px] text-[#D4AF37] font-medium italic">{name} is typing</span>
      <div className="flex gap-0.5">
        {[0,1,2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
        ))}
      </div>
    </div>
  </div>
);

/* ── Name entry modal ────────────────────────────────── */
const NameModal = ({ onConfirm }) => {
  const [name, setName] = useState('');
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-sm bg-[#0A0A0A] rounded-[2rem] p-8 border border-white/[0.07] shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-[1rem] bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mx-auto mb-4">
            <Shield size={22} className="text-[#D4AF37]" />
          </div>
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 mb-2">Secure Channel Active</p>
          <h3 className="text-lg font-serif italic text-white">Identify Yourself</h3>
          <p className="text-[11px] text-white/35 mt-1.5">Enter your name so the client knows who they're speaking with.</p>
        </div>
        <div className="space-y-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && onConfirm(name.trim())}
            placeholder="Your name (e.g. Janina)"
            autoFocus
            className="w-full bg-white/[0.06] border border-white/[0.1] rounded-2xl px-5 py-3.5 text-white text-[13px] focus:border-[#D4AF37]/60 outline-none placeholder:text-white/20"
          />
          <button
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
            className="w-full bg-[#D4AF37] text-black py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-30 transition-all"
          >
            Join Chat
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── AdminLiveChat ───────────────────────────────────── */
const AdminLiveChat = ({ session, onResolve }) => {
  const [adminName, setAdminName]   = useState('');
  const [joined, setJoined]         = useState(false);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [sending, setSending]       = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const scrollRef                   = useRef(null);
  const typingTimer                 = useRef(null);
  const channelRef                  = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, userTyping]);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('live_chat_sessions')
      .select('messages')
      .eq('session_id', session.session_id)
      .single();
    setMessages(data?.messages || []);
  }, [session.session_id]);

  const joinChat = async (name) => {
    setAdminName(name);
    setJoined(true);
    await fetchMessages();

    // Stamp admin_name on the session so the user sees who joined
    await supabase
      .from('live_chat_sessions')
      .update({ admin_name: name })
      .eq('session_id', session.session_id);

    // Subscribe to realtime updates on this session row
    const channel = supabase
      .channel(`live_session_${session.session_id}`)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'live_chat_sessions',
        filter: `session_id=eq.${session.session_id}`,
      }, (payload) => {
        const msgs = payload.new.messages || [];
        setMessages(msgs);
        // Clear user typing when a new user message arrives
        if (msgs.length > 0 && msgs[msgs.length - 1].sender === 'user') {
          setUserTyping(false);
        }
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.sender === 'user') {
          setUserTyping(true);
          clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setUserTyping(false), 3000);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ role: 'admin', name });
        }
      });

    channelRef.current = channel;
  };

  useEffect(() => () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    clearTimeout(typingTimer.current);
  }, []);

  const broadcastTyping = async () => {
    if (!channelRef.current) return;
    await channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { sender: 'admin' } });
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');

    const newMsg = {
      id:         `msg_${Date.now()}`,
      sender:     'admin',
      admin_name: adminName,
      message:    text,
      created_at: new Date().toISOString(),
    };

    try {
      // Fetch current messages then append
      const { data: sessionData } = await supabase
        .from('live_chat_sessions')
        .select('messages')
        .eq('session_id', session.session_id)
        .single();

      const updatedMessages = [...(sessionData?.messages || []), newMsg];

      await supabase
        .from('live_chat_sessions')
        .update({ messages: updatedMessages })
        .eq('session_id', session.session_id);

      setMessages(updatedMessages);
    } catch(e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    const result = await Swal.fire({
      title: 'Resolve Session?',
      text: `This will close the live chat session with ${session.user_name}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#000',
      confirmButtonText: 'Resolve',
    });
    if (result.isConfirmed) {
      await supabase
        .from('live_chat_sessions')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('session_id', session.session_id);
      onResolve(session.session_id);
    }
  };

  if (!joined) return <NameModal onConfirm={joinChat} />;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center">
            <User size={14} className="text-white/60" />
          </div>
          <div>
            <p className="text-[11px] font-black text-white tracking-wide">{session.user_name}</p>
            <p className="text-[8px] text-white/30 font-medium">{session.user_email}</p>
          </div>
        </div>
        <button
          onClick={handleResolve}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-500/25 transition-all"
        >
          <Check size={11} /> Resolve
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'user' && (
              <div className="max-w-[78%]">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[7px] font-black uppercase tracking-wider text-white/25">{session.user_name}</span>
                </div>
                <div className="bg-white/[0.08] border border-white/[0.06] px-4 py-3 rounded-[1.4rem] rounded-tl-lg">
                  <p className="text-[13px] text-white/75 leading-relaxed">{msg.message}</p>
                </div>
                <p className="text-[7px] text-white/20 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
            {msg.sender === 'admin' && (
              <div className="max-w-[78%]">
                <div className="bg-[#D4AF37] px-4 py-3 rounded-[1.4rem] rounded-tr-lg shadow-md shadow-[#D4AF37]/20">
                  <p className="text-[13px] text-black font-medium leading-relaxed">{msg.message}</p>
                </div>
                <p className="text-right text-[7px] text-white/20 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>
        ))}
        {userTyping && <TypingDots name={session.user_name} />}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/[0.06] shrink-0">
        <div className="flex items-end gap-2 bg-white/[0.05] rounded-[1.4rem] p-2 focus-within:bg-white/[0.08] transition-colors border border-white/[0.06]">
          <textarea
            value={input}
            onChange={e => { setInput(e.target.value); broadcastTyping(); }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Reply to client…"
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-[13px] text-white py-2 px-3 min-h-[40px] max-h-[90px] placeholder:text-white/20"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 bg-[#D4AF37] text-black rounded-xl flex items-center justify-center hover:brightness-110 active:scale-90 disabled:opacity-25 transition-all shadow-md shrink-0"
          >
            {sending
              ? <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              : <Send size={13} />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLiveChat;