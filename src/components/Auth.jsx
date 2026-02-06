// src/components/Auth.js
import React, { useState, useEffect } from 'react';
import { Quote, BookOpen } from 'lucide-react';

const AUTH_QUOTES = [
  "Share books. Share life lessons.",
  "Donate books—knowledge reused is impact multiplied.",
  "Your notes can teach beyond you.",
  "A wider reading community creates a stronger society."
];

export default function Auth({ onLogin, onRegister, onAdminLogin, authError, isLoading }) {
  const [view, setView] = useState('login');
  const [activeQuote, setActiveQuote] = useState(0);
  const [form, setForm] = useState({ name: '', mobile: '', mpin: '', studentClass: '10th', adminId: '', adminKey: '' });

  useEffect(() => {
    const timer = setInterval(() => setActiveQuote((p) => (p + 1) % AUTH_QUOTES.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const handleInput = (field, val, type) => {
    let cleanVal = val;
    if (type === 'alpha') cleanVal = val.replace(/[^a-zA-Z\s]/g, '');
    if (type === 'num') cleanVal = val.replace(/\D/g, '').slice(0, 10);
    if (type === 'pin') cleanVal = val.replace(/\D/g, '').slice(0, 4);
    setForm({ ...form, [field]: cleanVal });
  };

  return (
    <div className="fixed inset-0 bg-white z-[300] flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-sm w-full text-center">
        {/* Animated Quote Box */}
        <div className="relative overflow-hidden mb-10 p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-600 shadow-2xl text-white italic font-black transition-all">
          <Quote size={24} className="opacity-30 mb-3 mx-auto" />
          <p className="min-h-[3rem] animate-in fade-in duration-1000">"{AUTH_QUOTES[activeQuote]}"</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
          {['login', 'register', 'admin'].map(v => (
            <button key={v} onClick={() => setView(v)} className={`flex-1 py-3 rounded-xl font-bold uppercase text-[9px] ${view === v ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>{v}</button>
          ))}
        </div>

        {authError && <div className="mb-4 text-rose-600 font-bold text-[10px] uppercase p-3 rounded-xl bg-rose-50 border border-rose-100">{authError}</div>}

        <form onSubmit={(e) => {
          e.preventDefault();
          if (view === 'login') onLogin(form.mobile, form.mpin);
          else if (view === 'register') onRegister(form);
          else onAdminLogin(form.adminId, form.adminKey);
        }} className="space-y-4 text-left">
          
          {view === 'register' && (
            <>
              <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border focus:border-indigo-300" placeholder="Full Name" value={form.name} onChange={e => handleInput('name', e.target.value, 'alpha')} required />
              <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border" value={form.studentClass} onChange={e => setForm({...form, studentClass: e.target.value})}>
                {["6th", "7th", "8th", "9th", "10th", "11th", "12th", "College"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </>
          )}

          {view === 'admin' ? (
            <>
              <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border" placeholder="Admin ID" onChange={e => handleInput('adminId', e.target.value)} required />
              <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border" type="password" placeholder="Root Key" onChange={e => handleInput('adminKey', e.target.value)} required />
            </>
          ) : (
            <>
              <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border" placeholder="Mobile Number" value={view === 'login' ? form.mobile : form.mobile} onChange={e => handleInput('mobile', e.target.value, 'num')} required />
              <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none tracking-widest font-black border" type="password" placeholder="PIN" value={form.mpin} onChange={e => handleInput('mpin', e.target.value, 'pin')} required />
            </>
          )}

          <button disabled={isLoading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">
            {isLoading ? "Processing..." : view === 'admin' ? "Unlock Root" : view}
          </button>
        </form>
      </div>
    </div>
  );
}