import React, { useState } from 'react';
import { X, User, Lock, Globe, Save, GraduationCap, LogOut } from 'lucide-react';

export default function ProfileSettings({ profile, onClose, onUpdate, onLogout }) {
  // Local states
  const [name, setName] = useState(profile?.name || '');
  const [studentClass, setStudentClass] = useState(profile?.studentClass || '10th');
  const [isPrivate, setIsPrivate] = useState(profile?.isContactPrivate || false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-end">
      <div className="bg-white w-full max-w-sm h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">My Profile</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500">
            <X size={20}/>
          </button>
        </div>

        {/* Form Area */}
        <div className="flex-1 space-y-6 overflow-y-auto pr-1">
          
          {/* 1. Name & Class */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal Details</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1">Student Name</label>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3 focus-within:border-indigo-200 transition-colors">
                <User size={18} className="text-slate-400" />
                <input 
                  value={name} 
                  onChange={e=>setName(e.target.value)} 
                  className="bg-transparent w-full outline-none text-sm font-bold text-slate-700" 
                  placeholder="Enter your name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1">Current Class</label>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                <GraduationCap size={18} className="text-slate-400" />
                <select 
                  value={studentClass} 
                  onChange={e=>setStudentClass(e.target.value)} 
                  className="bg-transparent w-full outline-none text-sm font-bold text-slate-700"
                >
                  {["6th","7th","8th","9th","10th","11th","12th","College","Other"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Privacy Toggle */}
          <div className="p-5 rounded-3xl bg-indigo-50 border border-indigo-100 transition-all hover:shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-indigo-600" />
                <span className="font-black text-slate-800 text-sm italic">Privacy Mode</span>
              </div>
              <button 
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${isPrivate ? 'bg-indigo-600 shadow-lg shadow-indigo-300' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${isPrivate ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              When <b>ON</b>, your mobile number is hidden from other students. Only the <b>Admin</b> can see it.
            </p>
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="mt-auto pt-6 border-t border-slate-100 space-y-3">
          <button 
            onClick={() => { onUpdate({...profile, name, studentClass, isContactPrivate: isPrivate}); }}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Save size={18}/> SAVE CHANGES
          </button>
          
          <button 
            onClick={onLogout} 
            className="w-full py-4 text-rose-500 font-bold text-[10px] uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={16}/> Logout Account
          </button>
        </div>

      </div>
    </div>
  );
}