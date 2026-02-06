// src/components/AdminDashboard.js
import React from 'react';
import { Shield, Users, Book, FileSpreadsheet, MessageSquare, X, Trash2 } from 'lucide-react';

export default function AdminDashboard({ books, community, onClose, onExport, onDeleteBook }) {
  const stats = {
    totalBooks: books.length,
    activeRequests: books.reduce((acc, b) => acc + (b.waitlist?.length || 0), 0),
    sharing: books.filter(b => b.type === 'sharing').length,
    donations: books.filter(b => b.type === 'donation').length
  };

  return (
    <div className="fixed inset-0 bg-white z-[400] flex flex-col animate-in slide-in-from-right">
      <header className="p-6 border-b flex justify-between items-center bg-slate-900 text-white">
        <div className="flex items-center gap-3">
          <Shield className="text-red-500" />
          <h1 className="font-black uppercase tracking-widest text-sm">Root Control Center</h1>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
            <Book className="text-indigo-600 mb-2" size={20} />
            <div className="text-2xl font-black text-slate-800">{stats.totalBooks}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Total Books</div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
            <Users className="text-emerald-600 mb-2" size={20} />
            <div className="text-2xl font-black text-slate-800">{stats.activeRequests}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Active Reqs</div>
          </div>
        </div>

        {/* --- QUICK ACTIONS --- */}
        <section>
          <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Global Tools</p>
          <button 
            onClick={onExport}
            className="w-full p-6 bg-white border-2 border-emerald-100 rounded-[2.5rem] flex items-center justify-between group active:scale-95 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <FileSpreadsheet />
              </div>
              <div className="text-left">
                <p className="font-black text-slate-800 uppercase text-xs">Export Database</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase italic">Download CSV Format</p>
              </div>
            </div>
            <ChevronRight className="text-slate-200 group-hover:text-emerald-500 transition-all" />
          </button>
        </section>

        {/* --- RECENT ACTIVITY --- */}
        <section className="space-y-4 pb-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Community Posts</p>
          {community.slice(0, 5).map((post, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-indigo-600 uppercase">@{post.name}</p>
                <p className="text-xs font-bold text-slate-600 mt-1">"{post.text}"</p>
              </div>
              <div className="text-[8px] font-bold text-slate-300 uppercase">{post.date}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}