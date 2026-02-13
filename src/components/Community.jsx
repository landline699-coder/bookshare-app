// --- 1. IMPORTS (औज़ार) ---
import React, { useState, useEffect, useRef } from 'react';
// हमने यहाँ Flag आइकॉन को जोड़ दिया है
import { X, Send, User, Trash2, Flag } from 'lucide-react';

export default function Community({ posts, profile, onClose, onPost, isAdmin, onDeletePost, onReportPost }) {
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  // Auto-scroll to bottom logic (सुरक्षित है)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [posts]);

  const handleSend = () => {
    if (!text.trim()) return;
    onPost(text);
    setText('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg h-[80vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header (सुरक्षित है) */}
        <div className="bg-indigo-600 p-4 flex justify-between items-center z-10">
          <div className="text-white">
            <h2 className="text-xl font-black tracking-tight">Community Chat</h2>
            <p className="text-[10px] opacity-80 font-bold uppercase">Student Discussions</p>
          </div>
          <button onClick={onClose} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {posts.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💬</span>
              </div>
              <p className="font-bold text-slate-400">No messages yet.</p>
              <p className="text-xs text-slate-400">Be the first to say hello!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="relative group bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                
                {/* 🛡️ ADMIN DELETE BUTTON */}
                {isAdmin && (
                  <button 
                    onClick={() => onDeletePost(post.id)}
                    className="absolute top-2 right-2 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    title="Delete Message"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                {/* 🚩 NEW: REPORT BUTTON (सिर्फ दूसरों के मैसेज पर दिखेगा) */}
                {post.author !== profile.name && (
                  <button 
                    onClick={() => {
                      const reason = window.prompt("Why are you reporting this message? (Abuse/Spam/Other)");
                      if (reason) onReportPost(post, reason);
                    }}
                    className={`absolute top-2 ${isAdmin ? 'right-10' : 'right-2'} p-2 text-slate-300 hover:text-amber-500 transition-all opacity-0 group-hover:opacity-100`}
                    title="Report Message"
                  >
                    <Flag size={14} />
                  </button>
                )}

                {/* Author Info (सुरक्षित है) */}
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                      <User size={12} />
                   </div>
                   <span className="font-black text-slate-800 text-xs">{post.author}</span>
                   <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                     {post.class || 'Student'}
                   </span>
                </div>

                {/* Message Text (सुरक्षित है) */}
                <p className="text-slate-600 text-sm leading-relaxed font-medium pl-8">
                  {post.text}
                </p>
                
                {/* Time Display */}
                {post.timestamp && (
                  <p className="text-[9px] text-slate-300 font-bold text-right mt-2">
                    {new Date(post.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Area (सुरक्षित है) */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-indigo-300 focus-within:ring-4 ring-indigo-500/10 transition-all">
            <input 
              type="text" 
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..." 
              className="flex-1 bg-transparent px-3 py-2 outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400"
            />
            <button 
              onClick={handleSend}
              disabled={!text.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl shadow-lg shadow-indigo-200 active:scale-90 transition-all"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}