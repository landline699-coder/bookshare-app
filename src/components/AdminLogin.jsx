import React, { useState } from 'react';
import { ShieldCheck, X, Lock, KeyRound } from 'lucide-react';

export default function AdminLogin({ onClose, onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // 🔑 SECRET PASSWORD
    if (password === 'admin9893@') {
      onLogin(true); // App ko batao ki Admin aa gaya
      onClose();     // Modal band karo
    } else {
      setError('Wrong Password! Access Denied.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500" />
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200">
          <X size={20} className="text-slate-600"/>
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl rotate-3 hover:rotate-0 transition-transform">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Admin Portal</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 focus-within:border-slate-900 focus-within:ring-4 ring-slate-900/10 transition-all flex items-center gap-3">
            <KeyRound size={20} className="text-slate-400" />
            <input 
              type="password" 
              autoFocus
              placeholder="Enter Secret Key" 
              className="bg-transparent w-full outline-none font-bold text-slate-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-xs font-black text-rose-500 text-center bg-rose-50 p-2 rounded-lg">{error}</p>}

          <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
            Verify & Access
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[10px] text-slate-300 font-medium">
            System ID: BOOK-SHARE-SECURE-V1
          </p>
        </div>
      </div>
    </div>
  );
}