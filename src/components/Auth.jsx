// src/components/Auth.jsx
import React, { useState, useEffect } from 'react';
import { BookOpen, ShieldCheck, User, Lock, ArrowRight } from 'lucide-react';

const QUOTES = [
  { text: "Share a book, share a world.", author: "Community" },
  { text: "Old books can change new lives.", author: "BookShare" },
  { text: "Knowledge grows by sharing.", author: "Proverb" }
];

export default function Auth({ onRegister, onLogin, onAdminLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [form, setForm] = useState({ name: '', mobile: '', mpin: '', studentClass: '10th' });
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setQuoteIndex((p) => (p + 1) % QUOTES.length), 3000);
    return () => clearInterval(timer);
  }, []);

  // 🛡️ Logic to allow ONLY Numbers
  const handleNumInput = (e, field) => {
    const val = e.target.value.replace(/\D/g, ''); // Remove non-digits
    setForm({ ...form, [field]: val });
  };

  const handleSubmit = () => {
    if (isAdminMode) {
      if (form.mpin === 'admin9893@') onAdminLogin('admin', form.mpin);
      else alert("Wrong Admin Password!");
      return;
    }
    if (isLogin) onLogin(form.mobile, form.mpin);
    else onRegister(form);
  };

  return (
    <div className={`fixed inset-0 z-[60] flex flex-col items-center justify-center p-6 text-white transition-colors duration-500 ${isAdminMode ? 'bg-slate-900' : 'bg-indigo-600'}`}>
      
      <button onClick={() => setIsAdminMode(!isAdminMode)} className="absolute top-6 right-6 bg-white/20 p-2 rounded-full backdrop-blur-md active:scale-90 transition-all border border-white/10">
        {isAdminMode ? <User size={24}/> : <ShieldCheck size={24}/>}
      </button>

      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="bg-white/20 p-6 rounded-[2.5rem] backdrop-blur shadow-2xl">
          {isAdminMode ? <ShieldCheck size={48} /> : <BookOpen size={48} />}
        </div>
        {!isAdminMode && (
          <div className="h-16 text-center animate-in fade-in">
             <p className="text-xl font-black uppercase tracking-tight">"{QUOTES[quoteIndex].text}"</p>
          </div>
        )}
      </div>

      <div className="bg-white w-full max-w-sm p-8 rounded-[3rem] shadow-2xl text-slate-800 animate-in slide-in-from-bottom">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-indigo-900 mb-6 flex items-center gap-2">
          {isAdminMode ? <><Lock className="text-rose-500"/> Admin Access</> : (isLogin ? "Student Login" : "New Account")}
        </h2>
        
        <div className="space-y-4">
          {!isAdminMode && !isLogin && (
            <>
              <input placeholder="Full Name" className="w-full p-4 bg-indigo-50 rounded-2xl font-bold outline-none" onChange={e => setForm({...form, name: e.target.value})} />
              <select className="w-full p-4 bg-indigo-50 rounded-2xl font-bold outline-none" onChange={e => setForm({...form, studentClass: e.target.value})}>
                {["6th","7th","8th","9th","10th","11th","12th","College","Other"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </>
          )}
          
          {/* ✅ Mobile: Only Numbers allowed */}
          {!isAdminMode && (
            <input 
              placeholder="Mobile Number" 
              type="tel" 
              maxLength={10} 
              value={form.mobile}
              className="w-full p-4 bg-indigo-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              onChange={(e) => handleNumInput(e, 'mobile')} 
            />
          )}

          {/* ✅ PIN: Only Numbers allowed (unless Admin) */}
          <input 
            placeholder={isAdminMode ? "Enter Admin Password" : "Set 4-Digit PIN"} 
            type={isAdminMode ? "text" : "tel"}
            maxLength={isAdminMode ? 20 : 4} 
            value={form.mpin}
            className={`w-full p-4 rounded-2xl font-bold border-none outline-none ring-2 focus:ring-4 transition-all ${isAdminMode ? 'bg-slate-100 ring-slate-200' : 'bg-indigo-50 ring-indigo-50 focus:ring-indigo-100'}`}
            onChange={(e) => isAdminMode ? setForm({...form, mpin: e.target.value}) : handleNumInput(e, 'mpin')} 
          />
          
          <button onClick={handleSubmit} className={`w-full text-white p-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all flex justify-between items-center ${isAdminMode ? 'bg-slate-800 shadow-slate-300' : 'bg-indigo-600 shadow-indigo-200'}`}>
            <span>{isAdminMode ? "ACCESS PANEL" : (isLogin ? "UNLOCK LIBRARY" : "CREATE PROFILE")}</span>
            <ArrowRight/>
          </button>
        </div>
        
        {!isAdminMode && (
          <p onClick={() => setIsLogin(!isLogin)} className="text-center text-xs font-bold text-slate-400 mt-6 uppercase mt-4">
            {isLogin ? "New here? Register" : "Have account? Login"}
          </p>
        )}
      </div>
    </div>
  );
}