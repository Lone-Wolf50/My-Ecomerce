import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../Database-Server/Superbase-client.js";
import Navbar from "./Navbar.jsx";
import Swal from 'sweetalert2';

function Support() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  // Scroll to bottom whenever messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const initPage = async () => {
      const storedEmail = sessionStorage.getItem('userEmail');
      const storedUuid = sessionStorage.getItem('userUuid');
      const userName = sessionStorage.getItem('userName');

      if (!storedEmail || !storedUuid) {
        navigate('/login');
        return;
      }

      setUser({ email: storedEmail, id: storedUuid, name: userName });
      await fetchMessages(storedUuid);

      // Real-time listener for Admin replies
      const channel = supabase
        .channel(`support_${storedUuid}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'admin_messages', 
            filter: `user_id=eq.${storedUuid}` 
          }, 
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setMessages(prev => [...prev, payload.new]);
            } else if (payload.eventType === 'UPDATE') {
              setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
            }
          }
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    };

    initPage();
  }, [navigate]);

  const fetchMessages = async (userId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('admin_messages')
        .insert([{
          user_id: user.id,
          user_email: user.email,
          user_name: user.name || 'Guest',
          message_type: 'support',
          reason: message,
          status: 'unread',
          is_read: false
        }]);

      if (error) throw error;

      setMessage('');
      // Message will be added via Real-time or fetch
      await fetchMessages(user.id);
      
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#D4AF37] font-black uppercase tracking-widest text-[10px]">Connecting to Concierge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] select-none font-sans">
      <Navbar />
      
      <div className="max-w-4xl mx-auto pt-32 px-6 pb-20">
        <div className="mb-10 text-center md:text-left">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37] mb-2 block">Direct Assistance</span>
          <h1 className="text-4xl md:text-5xl font-serif italic text-black/90">Support Center</h1>
          <div className="h-[1px] w-20 bg-[#D4AF37] mt-4 mb-4 hidden md:block"></div>
          <p className="text-sm text-black/50 max-w-md leading-relaxed">
            Inquire about orders, returns, or product care. Our specialists respond within hours.
          </p>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-2xl shadow-black/5 overflow-hidden flex flex-col h-[650px]">
          
          {/* Messages Header */}
          <div className="px-8 py-4 border-b border-black/5 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Support Live</span>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth bg-[#fafafa]/30"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-4xl text-black/20">chat_bubble</span>
                </div>
                <h2 className="font-serif italic text-2xl text-black/80 mb-2">No messages yet</h2>
                <p className="text-sm text-black/40 max-w-xs">Send a message below to start a conversation with our boutique support.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-6">
                  {/* User Message (Right Side) */}
                  <div className="flex justify-end animate-in slide-in-from-right-4 duration-500">
                    <div className="max-w-[85%] md:max-w-[70%] text-right">
                      <div className="bg-[#D4AF37] text-white px-6 py-4 rounded-[2rem] rounded-tr-none shadow-lg shadow-[#D4AF37]/10">
                        <p className="text-sm leading-relaxed font-medium">{msg.reason}</p>
                      </div>
                      <span className="text-[9px] font-bold text-black/20 mt-2 block uppercase tracking-tighter">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Sent
                      </span>
                    </div>
                  </div>

                  {/* Admin Reply (Left Side) */}
                  {msg.admin_reply && (
                    <div className="flex justify-start animate-in slide-in-from-left-4 duration-500">
                      <div className="max-w-[85%] md:max-w-[70%]">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-white text-[16px]">verified_user</span>
                          </div>
                          <span className="text-[9px] font-black uppercase text-black/40 tracking-widest">Luxe Concierge</span>
                        </div>
                        <div className="bg-white border border-black/10 p-6 rounded-[2rem] rounded-tl-none shadow-sm">
                          <p className="text-sm text-black/70 leading-relaxed italic">"{msg.admin_reply}"</p>
                        </div>
                        <span className="text-[9px] font-bold text-black/20 mt-2 block uppercase tracking-tighter">
                          {new Date(msg.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Official Response
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-black/5">
            <div className="relative flex items-end gap-3 bg-black/5 rounded-[2rem] p-2 transition-all focus-within:bg-black/[0.08]">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="How can we assist you today?"
                className="flex-1 bg-transparent border-none rounded-2xl py-4 px-6 focus:ring-0 outline-none resize-none text-sm min-h-[56px] max-h-[150px]"
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="w-12 h-12 bg-[#D4AF37] text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-90 transition-all disabled:opacity-30 disabled:grayscale"
              >
                <span className="material-symbols-outlined text-xl">send</span>
              </button>
            </div>
            <div className="flex justify-center gap-6 mt-4">
               <p className="text-[9px] text-black/20 font-bold uppercase tracking-widest">Shift + Enter for New Line</p>
               <p className="text-[9px] text-black/20 font-bold uppercase tracking-widest">Secure Encryption Active</p>
            </div>
          </div>
        </div>

        {/* Footer Help Badges */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: 'history', title: '24/7 History', desc: 'Your chat history is saved securely.' },
            { icon: 'encrypted', title: 'Privacy', desc: 'End-to-end encrypted messaging.' },
            { icon: 'stars', title: 'Priority', desc: 'VIP members get instant routing.' }
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-4">
              <span className="material-symbols-outlined text-[#D4AF37] text-2xl">{item.icon}</span>
              <div>
                <h4 className="text-[10px] font-black uppercase text-black/80">{item.title}</h4>
                <p className="text-[11px] text-black/40 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Support;