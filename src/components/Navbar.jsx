// src/components/Navbar.jsx
import React from 'react';
import { LayoutGrid, Plus, LogOut } from 'lucide-react';

export default function Navbar({ appMode, setAppMode, onAddClick, onLogoutClick }) {
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t p-4 pb-6 flex justify-around items-center z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
      
      {/* Home Button */}
      <button 
        onClick={() => setAppMode(null)} 
        className={`flex flex-col items-center gap-1 active:scale-90 transition-all ${!appMode ? 'text-indigo-600' : 'text-slate-300'}`}
      >
        <div className={`p-2 rounded-2xl ${!appMode ? 'bg-indigo-50' : ''}`}>
          <LayoutGrid size={24}/>
        </div>
        <span className="text-[9px] font-black uppercase">Home</span>
      </button>

      {/* Add Book Button */}
      <button 
        onClick={onAddClick} 
        className="bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 -mt-10 border-[6px] border-slate-50 active:scale-90 transition-all"
      >
        <Plus size={30}/>
      </button>

      {/* Logout Button */}
      <button 
        onClick={onLogoutClick} 
        className="flex flex-col items-center gap-1 text-slate-400 hover:text-rose-500 active:scale-90 transition-all group"
      >
        <div className="p-2 rounded-2xl group-hover:bg-rose-50 group-active:bg-rose-100 transition-colors">
          <LogOut size={22}/>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[2px] antialiased">Logout</span>
      </button>

    </nav>
  );
}