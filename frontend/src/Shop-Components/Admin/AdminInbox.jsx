import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../Database-Server/Superbase-client.js';
import Swal from 'sweetalert2';
import { Mail, X, Send, CheckCircle, MessageCircle, Search, Calendar } from 'lucide-react';
import AdminLiveChat from './AdminLiveChat.jsx';

/* ─── Thread Card (support messages) ─────────────────── */
const STATUS_STYLES = {
  unread:   'bg-red-50 text-red-500 border-red-200',
  read:     'bg-blue-50 text-blue-500 border-blue-200',
  replied:  'bg-emerald-50 text-emerald-600 border-emerald-200',
  resolved: 'bg-black/[0.04] text-black/30 border-black/10',
};

const ThreadCard = ({ group, onReply, onResolve, onRead }) => {
  const getIcon = (type) => ({ cancel: '🚫', return: '↩️', support: '💬' }[type] || '📧');

  return (
    <div className="p-6 rounded-[2rem] bg-white border border-black/[0.06] hover:border-[#D4AF37]/25 hover:shadow-lg hover:shadow-black/[0.04] transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-black/[0.04] flex items-center justify-center text-lg shrink-0">
            {getIcon(group.message_type)}
          </div>
          <div>
            <h3 className="font-black text-[13px] uppercase tracking-tight">{group.user_name}</h3>
            <p className="text-[10px] text-black/30 font-medium mt-0.5">{group.user_email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase text-black/20">{group.all_messages.length} msg{group.all_messages.length !== 1 ? 's' : ''}</span>
          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${STATUS_STYLES[group.status] || STATUS_STYLES.unread}`}>
            {group.status}
          </span>
        </div>
      </div>

      {/* Latest message preview */}
      <div className="bg-black/[0.03] p-4 rounded-2xl mb-4 max-h-44 overflow-y-auto space-y-3 border border-black/[0.04]">
        {group.all_messages.map((chat, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-black uppercase tracking-wider text-black/25">{chat.message_type}</span>
              <span className="text-[8px] text-black/20">{new Date(chat.created_at).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-black/[0.06] shadow-sm">
              <p className="text-[12px] text-black/65 leading-relaxed">{chat.reason}</p>
            </div>
            {chat.admin_reply && (
              <div className="ml-4 pl-4 border-l-2 border-[#D4AF37] bg-[#D4AF37]/5 p-2.5 rounded-r-xl">
                <span className="text-[8px] font-black uppercase text-[#D4AF37]">Official Reply</span>
                <p className="text-[12px] text-black/55 italic mt-0.5">{chat.admin_reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2.5 flex-wrap">
        <button
          onClick={() => {
            const lastMsg = group.all_messages[group.all_messages.length - 1];
            onReply(lastMsg);
            if (group.status === 'unread') onRead(group.user_id);
          }}
          className="px-5 py-2.5 bg-[#D4AF37] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-md shadow-[#D4AF37]/20 flex items-center gap-1.5"
        >
          <Send size={11} /> Reply
        </button>
        {group.status !== 'resolved' && (
          <button
            onClick={() => onResolve(group.user_id)}
            className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-1.5"
          >
            <CheckCircle size={11} /> Resolve
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Reply Modal ──────────────────────────────────── */
const ReplyModal = ({ message, replyText, setReplyText, onSend, onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[150] flex items-center justify-center p-4">
      <div className="bg-[#FDFBF7] w-full max-w-xl rounded-[2.5rem] p-9 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-7">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/20 mb-1">Secure Admin Channel</p>
            <h3 className="text-2xl font-serif italic">Reply to {message.user_name}</h3>
          </div>
          <button onClick={onClose} className="p-2.5 bg-black/5 rounded-xl hover:bg-black/10 transition-colors">
            <X size={17} />
          </button>
        </div>
        <div className="bg-white border border-black/[0.06] p-4 rounded-2xl mb-5 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-wider text-black/20 mb-1.5">Last User Message</p>
          <p className="text-[13px] text-black/60 italic">"{message.reason}"</p>
        </div>
        <textarea
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          placeholder="Type your official response…"
          className="w-full bg-white border border-black/10 p-5 rounded-2xl focus:border-[#D4AF37] outline-none min-h-[140px] resize-none mb-5 shadow-inner text-[14px] transition-colors"
        />
        <div className="flex gap-3">
          <button
            onClick={onSend}
            disabled={!replyText.trim()}
            className="flex-1 bg-[#D4AF37] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-25 flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/25"
          >
            <Send size={13} /> Dispatch Reply
          </button>
          <button onClick={onClose} className="px-8 bg-black/5 text-black/50 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black/10 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Resolved Archive Tab ─────────────────────────── */
const ResolvedArchive = () => {
  const [resolved, setResolved]   = useState([]);
  const [search, setSearch]       = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('admin_messages')
        .select('*')
        .eq('status', 'resolved')
        .order('updated_at', { ascending: false });

      if (data) {
        // Group by user_id — show latest entry per user
        const grouped = data.reduce((acc, msg) => {
          if (!acc[msg.user_id]) {
            acc[msg.user_id] = {
              user_id:    msg.user_id,
              user_name:  msg.user_name || 'Anonymous',
              user_email: msg.user_email || '',
              resolved_at: msg.updated_at,
              all_messages: [],
            };
          }
          acc[msg.user_id].all_messages.push(msg);
          // Track latest resolved date
          if (new Date(msg.updated_at) > new Date(acc[msg.user_id].resolved_at)) {
            acc[msg.user_id].resolved_at = msg.updated_at;
          }
          return acc;
        }, {});
        setResolved(Object.values(grouped));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = resolved.filter(r => {
    const matchName  = r.user_name.toLowerCase().includes(search.toLowerCase()) ||
                       r.user_email.toLowerCase().includes(search.toLowerCase());
    const matchDate  = !dateFilter || r.resolved_at?.startsWith(dateFilter);
    return matchName && matchDate;
  });

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-3 bg-white border border-black/[0.08] rounded-2xl text-[12px] focus:border-[#D4AF37] outline-none transition-colors"
          />
        </div>
        <div className="relative">
          <Calendar size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="pl-10 pr-4 py-3 bg-white border border-black/[0.08] rounded-2xl text-[12px] focus:border-[#D4AF37] outline-none transition-colors"
          />
        </div>
        {(search || dateFilter) && (
          <button
            onClick={() => { setSearch(''); setDateFilter(''); }}
            className="px-4 py-3 bg-black/[0.05] text-black/50 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black/10 transition-all"
          >
            Clear
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-[9px] font-black uppercase tracking-widest text-black/25">
        {filtered.length} resolved thread{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-black/[0.05] rounded-[2.5rem]">
          <p className="text-black/20 font-serif italic text-lg">No resolved threads found.</p>
        </div>
      ) : (
        filtered.map(r => (
          <div key={r.user_id} className="bg-white rounded-[2rem] border border-black/[0.06] overflow-hidden">
            {/* Row header */}
            <button
              onClick={() => setExpanded(expanded === r.user_id ? null : r.user_id)}
              className="w-full flex items-center justify-between px-6 py-5 hover:bg-black/[0.02] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-black/[0.04] flex items-center justify-center">
                  <span className="text-base">✅</span>
                </div>
                <div>
                  <p className="font-black text-[13px] uppercase tracking-tight">{r.user_name}</p>
                  <p className="text-[10px] text-black/30 mt-0.5">{r.user_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-[8px] font-black uppercase tracking-widest text-black/20">Resolved</p>
                  <p className="text-[11px] font-black text-black/50">
                    {new Date(r.resolved_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase border bg-black/[0.04] text-black/30 border-black/10">
                  {r.all_messages.length} msg{r.all_messages.length !== 1 ? 's' : ''}
                </span>
              </div>
            </button>

            {/* Expanded messages */}
            {expanded === r.user_id && (
              <div className="border-t border-black/[0.04] px-6 pb-5 pt-4 space-y-3 bg-black/[0.01]">
                {r.all_messages.map((msg, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[8px] font-black uppercase tracking-wider text-black/25">{msg.message_type}</span>
                      <span className="text-[8px] text-black/20">
                        {new Date(msg.created_at).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-black/[0.06] shadow-sm">
                      <p className="text-[12px] text-black/65">{msg.reason}</p>
                    </div>
                    {msg.admin_reply && (
                      <div className="ml-4 pl-3 border-l-2 border-[#D4AF37] bg-[#D4AF37]/5 p-2.5 rounded-r-xl">
                        <span className="text-[8px] font-black uppercase text-[#D4AF37]">Reply</span>
                        <p className="text-[12px] text-black/55 italic mt-0.5">{msg.admin_reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

/* ─── Main AdminInbox ──────────────────────────────── */
const AdminInbox = ({ onReadUpdate, onLiveCountChange }) => {
  const [messages, setMessages]           = useState([]);
  const [liveSessions, setLiveSessions]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [tab, setTab]                     = useState('messages'); // 'messages' | 'live' | 'resolved'
  const [filter, setFilter]               = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText]         = useState('');
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => { fetchMessages(); fetchLiveSessions(); }, []);

  // Bubble combined badge count (unread messages + active live sessions) up to sidebar
  useEffect(() => {
    const unread = messages.filter(m => m.status === 'unread').length;
    const live   = liveSessions.length;
    onLiveCountChange?.(unread + live);
  }, [messages, liveSessions, onLiveCountChange]);

  useEffect(() => {
    if (messages.length > 0) {
      document.querySelectorAll('.chat-scroll').forEach(el => { el.scrollTop = el.scrollHeight; });
    }
  }, [messages]);

  // Realtime: new live chat sessions
  useEffect(() => {
    const channel = supabase
      .channel('live_sessions_admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat_sessions' }, () => {
        fetchLiveSessions();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_chat_sessions' }, () => {
        fetchLiveSessions();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_messages').select('*').neq('status', 'resolved').order('created_at', { ascending: true });
      if (error) throw error;

      // Group by user_id — ONE card per unique user
      const grouped = data.reduce((acc, msg) => {
        if (!acc[msg.user_id]) {
          acc[msg.user_id] = {
            id: msg.id, user_id: msg.user_id,
            user_name:    msg.user_name || 'Anonymous',
            user_email:   msg.user_email || '',
            message_type: msg.message_type,
            status:       msg.status,
            all_messages: [],
          };
        }
        acc[msg.user_id].all_messages.push(msg);
        // Bubble up unread status
        if (msg.status === 'unread') acc[msg.user_id].status = 'unread';
        return acc;
      }, {});
      setMessages(Object.values(grouped));
    } catch (err) {
      /* fetch error — UI shows empty state */
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveSessions = async () => {
    const { data } = await supabase
      .from('live_chat_sessions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    setLiveSessions(data || []);
  };

  const markThreadAsRead = async (userId) => {
    await supabase.from('admin_messages').update({ is_read: true, status: 'read' }).eq('user_id', userId).eq('is_read', false);
    fetchMessages();
    onReadUpdate?.();
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;
    try {
      const { error } = await supabase.from('admin_messages').update({
        admin_reply: replyText, status: 'replied', is_read: true, updated_at: new Date().toISOString()
      }).eq('id', selectedMessage.id);
      if (error) throw error;

      await supabase.from('site_notifications').insert([{
        user_id: selectedMessage.user_id, title: 'Admin Reply', message: replyText
      }]);

      Swal.fire({ title: 'Reply Sent!', icon: 'success', timer: 1500, showConfirmButton: false });
      setReplyText(''); setSelectedMessage(null); fetchMessages();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const resolveThread = async (userId) => {
    const { error } = await supabase.from('admin_messages').update({ status: 'resolved', updated_at: new Date().toISOString() }).eq('user_id', userId);
    if (!error) {
      fetchMessages();
      Swal.fire({ title: 'Thread Resolved', icon: 'success', timer: 1500, showConfirmButton: false });
    }
  };

  const handleLiveResolve = async (sessionId) => {
    await fetchLiveSessions();
    setActiveSession(null);
    Swal.fire({ title: 'Session Resolved', icon: 'success', timer: 1500, showConfirmButton: false });
  };

  const filtered = messages.filter(m => filter === 'all' || m.message_type === filter);
  const unreadCount = messages.filter(m => m.status === 'unread').length;
  const liveCount   = liveSessions.length;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-7 h-7 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-black/20 mb-2">
            Unified Message Center
          </p>
          <h2 className="text-4xl font-serif italic flex items-center gap-3">
            Admin Inbox
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full animate-bounce shadow-lg shadow-red-500/30">
                {unreadCount} new
              </span>
            )}
          </h2>
        </div>

        {/* Main tab switcher */}
        <div className="flex bg-black/[0.04] p-1.5 rounded-[1.5rem] w-full md:w-auto gap-0.5">
          {[
            { id: 'messages', label: 'Messages', count: unreadCount },
            { id: 'live',     label: 'Live Chat', count: liveCount },
            { id: 'resolved', label: 'Archive',   count: 0 },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 md:flex-none px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 justify-center ${tab === t.id ? 'bg-white shadow-md text-black' : 'text-black/30 hover:text-black'}`}
            >
              {t.id === 'live' && <MessageCircle size={11} />}
              {t.label}
              {t.count > 0 && (
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black ${tab === t.id ? 'bg-black text-white' : t.id === 'live' ? 'bg-emerald-500 text-white animate-pulse' : 'bg-red-500 text-white animate-pulse'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages Tab ── */}
      {tab === 'messages' && (
        <>
          {/* Type filter */}
          <div className="flex bg-black/[0.04] p-1.5 rounded-[1.5rem] w-full md:w-auto mb-6 gap-0.5">
            {['all', 'cancel', 'return', 'support'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white shadow-md text-black' : 'text-black/30 hover:text-black'}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-black/[0.05] rounded-[2.5rem]">
                <Mail size={36} className="mx-auto mb-3 text-black/15" />
                <p className="text-black/20 font-serif italic text-xl">Inbox is clean.</p>
              </div>
            ) : (
              filtered.map(group => (
                <ThreadCard
                  key={group.user_id}
                  group={group}
                  onReply={setSelectedMessage}
                  onResolve={resolveThread}
                  onRead={markThreadAsRead}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* ── Live Chat Tab ── */}
      {tab === 'live' && (
        <div>
          {activeSession ? (
            <div
              className="bg-[#0A0A0A] rounded-[2rem] overflow-hidden flex flex-col"
              style={{ height: '72vh' }}
            >
              <AdminLiveChat
                session={activeSession}
                onResolve={handleLiveResolve}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {liveSessions.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-black/[0.05] rounded-[2.5rem]">
                  <MessageCircle size={36} className="mx-auto mb-3 text-black/15" />
                  <p className="text-black/20 font-serif italic text-xl">No active live sessions.</p>
                  <p className="text-[11px] text-black/20 mt-2">Clients will appear here when they request live support.</p>
                </div>
              ) : (
                liveSessions.map(session => (
                  <button
                    key={session.session_id}
                    onClick={() => setActiveSession(session)}
                    className="w-full flex items-center justify-between p-5 bg-white rounded-[2rem] border border-black/[0.06] hover:border-[#D4AF37]/30 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                        <MessageCircle size={17} className="text-emerald-600" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
                      </div>
                      <div>
                        <p className="font-black text-[13px] uppercase tracking-tight">{session.user_name}</p>
                        <p className="text-[10px] text-black/30 mt-0.5">{session.user_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] text-black/25 font-medium">
                        {new Date(session.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                      </span>
                      <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[8px] font-black uppercase tracking-widest border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        Join
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Resolved Archive Tab ── */}
      {tab === 'resolved' && <ResolvedArchive />}

      <ReplyModal
        message={selectedMessage}
        replyText={replyText}
        setReplyText={setReplyText}
        onSend={sendReply}
        onClose={() => { setSelectedMessage(null); setReplyText(''); }}
      />
    </div>
  );
};

export default AdminInbox;