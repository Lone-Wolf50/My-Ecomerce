import React, { useState, useEffect } from 'react';
import { supabase } from "../Database-Server/Superbase-client.js";
import Swal from 'sweetalert2';
import { Mail, X } from 'lucide-react';

const AdminInbox = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); 
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');

  // 1. Initial Load
  useEffect(() => {
    fetchMessages();
  }, []);

  // 2. Auto-scroll: Finds all chat containers and pushes them to the bottom
  useEffect(() => {
    if (messages.length > 0) {
      const scrollContainers = document.querySelectorAll('.chat-scroll-container');
      scrollContainers.forEach(container => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Grouping Logic: Aggregate messages by user_id
      const grouped = data.reduce((acc, msg) => {
        if (!acc[msg.user_id]) {
          acc[msg.user_id] = {
            id: msg.id,
            user_id: msg.user_id,
            user_name: msg.user_name || 'Anonymous User',
            user_email: msg.user_email || 'No Email Provided',
            message_type: msg.message_type,
            status: msg.status,
            is_read: msg.is_read,
            all_messages: [] 
          };
        }
        acc[msg.user_id].all_messages.push(msg);
        
        // Priority status: if any message in the thread is unread, mark the group as unread
        if (msg.status === 'unread') acc[msg.user_id].status = 'unread';
        
        return acc;
      }, {});

      setMessages(Object.values(grouped));
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Improved markAsRead: Targets the User ID to clear the whole thread
  const markThreadAsRead = async (userId) => {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .update({ is_read: true, status: 'read' })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (!error) {
        // Silent refresh to update badges without loading spinners
        const { data } = await supabase
          .from('admin_messages')
          .select('*')
          .order('created_at', { ascending: true });
        
        const grouped = data.reduce((acc, msg) => {
          if (!acc[msg.user_id]) { acc[msg.user_id] = { ...msg, all_messages: [] }; }
          acc[msg.user_id].all_messages.push(msg);
          if (msg.status === 'unread') acc[msg.user_id].status = 'unread';
          return acc;
        }, {});
        setMessages(Object.values(grouped));
      }
    } catch (err) {
      console.error('Mark read error:', err.message);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;

    try {
      const { error: updateError } = await supabase
        .from('admin_messages')
        .update({ 
          admin_reply: replyText, 
          status: 'replied',
          is_read: true, 
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMessage.id); 

      if (updateError) throw updateError;

      // Send notification to user
      await supabase.from('site_notifications').insert([{
        user_id: selectedMessage.user_id,
        title: `Admin Reply`,
        message: replyText
      }]);

      Swal.fire({ title: 'Reply Sent!', icon: 'success', timer: 1500, showConfirmButton: false });
      setReplyText('');
      setSelectedMessage(null);
      fetchMessages(); 
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const resolveThread = async (userId) => {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .update({ status: 'resolved' })
        .eq('user_id', userId);

      if (!error) {
        fetchMessages();
        Swal.fire({ title: 'Thread Resolved', icon: 'success', timer: 1500, showConfirmButton: false });
      }
    } catch (err) {
      console.error('Resolve error:', err.message);
    }
  };

  const filteredMessages = messages.filter(m => {
    if (filter === 'all') return true;
    return m.message_type === filter;
  });

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  const getMessageIcon = (type) => {
    switch(type) {
      case 'cancel': return '🚫';
      case 'return': return '↩️';
      case 'support': return '💬';
      default: return '📧';
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      unread: 'bg-red-50 text-red-600 border-red-200',
      read: 'bg-blue-50 text-blue-600 border-blue-200',
      replied: 'bg-green-50 text-green-600 border-green-200',
      resolved: 'bg-gray-50 text-gray-400 border-gray-200'
    };
    return styles[status] || styles.unread;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[#D4AF37] font-black uppercase tracking-widest animate-pulse">Loading Inbox...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif italic flex items-center">
            Admin Inbox
            {unreadCount > 0 && (
              <span className="ml-4 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full animate-bounce">
                {unreadCount} NEW
              </span>
            )}
          </h2>
          <p className="text-[13px] font-black uppercase tracking-[0.2em] text-black/30 mt-2">
            Conversation Threading Active
          </p>
        </div>

        <div className="flex bg-black/5 p-1.5 rounded-[1.5rem] w-full md:w-auto backdrop-blur-sm">
          {['all', 'cancel', 'return', 'support'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === tab ? 'bg-white shadow-md text-black' : 'text-black/40 hover:text-black'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {filteredMessages.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-black/5 rounded-[3rem]">
            <Mail size={48} className="mx-auto mb-4 text-black/20" />
            <p className="text-black/20 font-serif italic text-xl">Inbox Clean.</p>
          </div>
        ) : (
          filteredMessages.map((group) => (
            <div key={group.user_id} className="p-6 rounded-[2.5rem] bg-white border border-black/5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getMessageIcon(group.message_type)}</span>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tight">{group.user_name}</h3>
                    <p className="text-[11px] text-black/40 font-medium">{group.user_email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusBadge(group.status)}`}>
                    {group.status}
                  </span>
                </div>
              </div>

              {/* CHAT HISTORY BOX - Auto Scrolls to bottom */}
              <div className="chat-scroll-container bg-black/5 p-4 rounded-xl mb-4 max-h-60 overflow-y-auto space-y-4 shadow-inner scroll-smooth">
                {group.all_messages.map((chat, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center opacity-40">
                       <span className="font-bold text-[8px] uppercase">{chat.message_type}</span>
                       <span className="text-[8px]">{new Date(chat.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="bg-white/50 p-3 rounded-lg border border-black/5">
                      <p className="text-sm text-black/70">{chat.reason}</p>
                    </div>
                    
                    {chat.admin_reply && (
                      <div className="pl-6 border-l-2 border-[#D4AF37] mt-2 bg-[#D4AF37]/5 p-2 rounded-r-lg">
                        <span className="font-bold text-[9px] uppercase text-[#D4AF37]">Official Reply</span>
                        <p className="text-sm text-black/60 italic">{chat.admin_reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => {
                    // 1. Set the specific message to reply to
                    const lastMsg = group.all_messages[group.all_messages.length - 1];
                    setSelectedMessage(lastMsg);
                    // 2. Automatically mark the thread as read
                    if (group.status === 'unread') markThreadAsRead(group.user_id);
                  }}
                  className="px-6 py-3 bg-[#D4AF37] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md"
                >
                  Reply to Latest
                </button>

                {group.status !== 'resolved' && (
                  <button
                    onClick={() => resolveThread(group.user_id)}
                    className="px-6 py-3 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all"
                  >
                    Resolve Thread
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-serif italic">Reply to {selectedMessage.user_name}</h3>
                <p className="text-[11px] text-black/40 mt-1 uppercase font-bold tracking-tighter">Secure Admin Channel</p>
              </div>
              <button onClick={() => { setSelectedMessage(null); setReplyText(''); }} className="p-2 bg-black/5 rounded-full hover:bg-black/10">
                <X size={20} />
              </button>
            </div>

            <div className="bg-white border border-black/5 p-4 rounded-xl mb-6">
              <p className="text-[10px] font-black uppercase text-black/30 mb-1">Last User Input:</p>
              <p className="text-sm text-black/70 italic">"{selectedMessage.reason}"</p>
            </div>

            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your official response..."
              className="w-full bg-white border border-black/10 p-5 rounded-2xl focus:border-[#D4AF37] outline-none min-h-[180px] resize-none mb-6 shadow-inner"
            />

            <div className="flex gap-4">
              <button 
                onClick={sendReply} 
                disabled={!replyText.trim()} 
                className="flex-1 bg-[#D4AF37] text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-30"
              >
                Dispatch Reply
              </button>
              <button 
                onClick={() => { setSelectedMessage(null); setReplyText(''); }} 
                className="px-10 bg-black/5 text-black/60 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black/10 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInbox;