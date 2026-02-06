// src/components/ProfileSettings.js
import React, { useState } from 'react';
import { User, ShieldCheck, ChevronRight, Save, X, Smartphone } from 'lucide-react';

export default function ProfileSettings({ profile, onUpdate, onClose, classes }) {
  const [tempProfile, setTempProfile] = useState({ ...profile });

  return (
    <div className="fixed inset-0 bg-white z-[200] animate-in slide-in-from-bottom flex flex-col">
      <header className="p-6 border-b flex justify-between items-center bg-white sticky top-0">
        <button onClick={onClose} className="p-2 bg-slate-50 rounded-xl"><X/></button>
        <h1 className="font-black uppercase text-sm tracking-widest">My Profile</h1>
        <div className="w-10"/>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center py-6">
          <div className="w-24 h-24 bg-indigo-100 rounded-[2.5rem] flex items-center justify-center text-indigo-600 mb-4 border-4 border-indigo-50 shadow-inner">
            <User size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase">{profile.name}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profile.studentClass} Student</p>
        </div>

        {/* Edit Form */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Personal Details</p>
          <div className="bg-slate-50 p-4 rounded-3xl space-y-4 border border-slate-100">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-indigo-500 uppercase ml-2">Full Name</label>
              <input 
                className="w-full bg-white p-4 rounded-2xl outline-none font-bold text-sm border"
                value={tempProfile.name}
                onChange={(e) => setTempProfile({...tempProfile, name: e.target.value.replace(/[^a-zA-Z\s]/g, '')})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-indigo-500 uppercase ml-2">Class / Grade</label>
              <select 
                className="w-full bg-white p-4 rounded-2xl outline-none font-bold text-sm border"
                value={tempProfile.studentClass}
                onChange={(e) => setTempProfile({...tempProfile, studentClass: e.target.value})}
              >
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Privacy Settings</p>
          <div className="bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm">
                <Smartphone size={20}/>
              </div>
              <div>
                <p className="font-black text-xs text-slate-800 uppercase">Private Number</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-1">Hide mobile from public</p>
              </div>
            </div>
            <button 
              onClick={() => setTempProfile({...tempProfile, isPrivate: !tempProfile.isPrivate})}
              className={`w-12 h-6 rounded-full transition-all relative ${tempProfile.isPrivate ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${tempProfile.isPrivate ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white border-t">
        <button 
          onClick={() => onUpdate(tempProfile)}
          className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Save size={18}/> Save Profile Changes
        </button>
      </div>
    </div>
  );
}