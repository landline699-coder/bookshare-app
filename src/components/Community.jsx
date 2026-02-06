// src/components/Community.js
import React, { useState } from 'react';
import { ChevronLeft, Send } from 'lucide-react';

export default function Community({ posts, onPost, onClose, userName }) {
  const [text, setText] = useState('');

  return (
    <div className="fixed inset-0 bg-white z-[200] animate-in slide-in-from-bottom flex flex-col">
      <header className="p-4 border-b flex justify-between items-center bg-white sticky top-0">
        <button onClick={onClose} className="p-2 bg-slate-50 rounded-xl"><ChevronLeft/></button>
        <h1 className="font-black uppercase text-sm tracking-widest">Community Board</h1>
        <div className="w-10"/>
      </header>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar">
        {posts.map((p, i) => (
          <div key={i} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in fade-in">
            <div className="flex justify-between items-center mb-2">
              <div className="text-[10px] font-black text-indigo-600 uppercase">@{p.name}</div>
              <div className="text-[8px] font-bold text-slate-300 uppercase">{p.date}</div>
            </div>
            <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{p.text}"</p>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t flex gap-2 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <input 
          className="flex-1 bg-slate-50 p-4 rounded-2xl outline-none text-xs font-bold" 
          placeholder="I need a 10th Class Maths book..." 
          value={text} 
          onChange={e => setText(e.target.value)} 
        />
        <button 
          onClick={() => { if(text.trim()) { onPost(text); setText(''); } }} 
          className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg active:scale-90 transition-all"
        >
          <Send size={20}/>
        </button>
      </div>
    </div>
  );
}