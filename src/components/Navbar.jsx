import React from 'react';
// 👇 'MessageSquare' को यहाँ जोड़ दिया गया है
import { Bell, User, LogOut, Shield, MessageSquare } from 'lucide-react';

// ✅ 'hasNewComm' प्रॉप को यहाँ जोड़ दिया गया है
export default function Navbar({ 
  profile, onOpenProfile, onOpenAdmin, 
  notifications, totalRequests, onOpenCommunity, 
  onLogout, hasNewComm 
}) {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-40">
      
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black">B</div>
        <span className="font-black text-slate-800 tracking-tight hidden sm:block">BookShare</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        
        {/* Admin Login Button (सुरक्षित है) */}
        <button 
          onClick={onOpenAdmin}
          className="p-2 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-full transition-colors text-slate-500"
          title="Admin Login"
        >
          <Shield size={20} />
        </button>

        {/* 🔥 NEW: Community Button with Notification Dot */}
        <button 
          onClick={onOpenCommunity} 
          className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          title="Community Chat"
        >
          <MessageSquare size={20} />
          
          {/* 🔴 लाल बिंदी: सिर्फ तब दिखेगी जब 'hasNewComm' सच (true) होगा */}
          {hasNewComm && (
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white"></span>
            </span>
          )}
        </button>

        {/* Notifications (Bell) (सुरक्षित है) */}
        <button className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={20} className="text-slate-600" />
          {totalRequests > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
        </button>

        {/* Profile (सुरक्षित है) */}
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