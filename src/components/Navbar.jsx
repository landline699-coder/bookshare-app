import React from 'react';
import { Bell, User, LogOut, Shield } from 'lucide-react';

export default function Navbar({ profile, onOpenProfile, onOpenAdmin, notifications, totalRequests, onOpenCommunity, onLogout }) {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-40">
      
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black">B</div>
        <span className="font-black text-slate-800 tracking-tight hidden sm:block">BookShare</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        
        {/* 🔥 NEW: Admin Login Button */}
        <button 
          onClick={onOpenAdmin}
          className="p-2 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-full transition-colors text-slate-500"
          title="Admin Login"
        >
          <Shield size={20} />
        </button>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={20} className="text-slate-600" />
          {totalRequests > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
        </button>

        {/* Profile */}
        <div onClick={onOpenProfile} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 pr-3 rounded-full border border-transparent hover:border-slate-100 transition-all">
          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
            {profile?.name?.[0] || <User size={16}/>}
          </div>
          <div className="hidden sm:block text-left">
             <p className="text-xs font-black text-slate-700 leading-none">{profile?.name || 'User'}</p>
             <p className="text-[9px] font-bold text-slate-400 uppercase">{profile?.studentClass || 'Student'}</p>
          </div>
        </div>
      </div>
    </nav>
  );
}