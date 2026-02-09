import React, { useState } from 'react';
import { User, Smartphone, Lock, ArrowRight, Loader2, LogIn, ChevronLeft } from 'lucide-react';
import * as fb from '../services/firebaseService';

export default function Auth() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false); // 👈 नया स्टेट
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Fields
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentClass, setStudentClass] = useState('10th');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isResetMode) {
        // --- FORGOT PASSWORD LOGIC ---
        // नोट: नकली ईमेल होने के कारण ईमेल नहीं जाएगा, पर हम बच्चों को एडमिन का नंबर दिखा सकते हैं
        setMessage("Password reset request sent to Admin. Please contact your teacher.");
      } else if (isLoginMode) {
        await fb.loginUser(mobile, password);
      } else {
        await fb.registerUser(mobile, password, { name, mobile, studentClass, role: 'student' });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
            {isResetMode ? <Lock className="text-white" size={32} /> : isLoginMode ? <LogIn className="text-white" size={32} /> : <User className="text-white" size={32} />}
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            {isResetMode ? 'Reset Password' : isLoginMode ? 'Welcome Back!' : 'Join BookShare'}
          </h1>
        </div>

        {error && <div className="mb-6 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl text-center">⚠️ {error}</div>}
        {message && <div className="mb-6 p-3 bg-green-50 border border-green-100 text-green-600 text-xs font-bold rounded-xl text-center">✅ {message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isResetMode ? (
            // --- Reset Mode Field ---
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
              <Smartphone size={20} className="text-slate-400" />
              <input required type="number" value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="Enter Registered Mobile" className="bg-transparent w-full outline-none text-slate-700 font-bold" />
            </div>
          ) : (
            // --- Login/Register Fields ---
            <>
              {!isLoginMode && (
                <div className="space-y-4 animate-in slide-in-from-top-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3"><User size={20} className="text-slate-400" /><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Full Name" className="bg-transparent w-full outline-none text-slate-700 font-bold" /></div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><select value={studentClass} onChange={e=>setStudentClass(e.target.value)} className="bg-transparent w-full outline-none text-slate-700 font-bold">{["6th","7th","8th","9th","10th","11th","12th","College","Other"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
              )}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3"><Smartphone size={20} className="text-slate-400" /><input required type="number" value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="Mobile Number" className="bg-transparent w-full outline-none text-slate-700 font-bold" /></div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3"><Lock size={20} className="text-slate-400" /><input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="bg-transparent w-full outline-none text-slate-700 font-bold" /></div>
            </>
          )}

          <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 mt-4">
            {loading ? <Loader2 className="animate-spin" /> : isResetMode ? 'Send Request' : isLoginMode ? 'Login' : 'Create Account'} 
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 text-center pt-6 border-t border-slate-100 flex flex-col gap-4">
          {isResetMode ? (
            <button onClick={() => setIsResetMode(false)} className="text-slate-500 font-bold text-xs flex items-center justify-center gap-1"><ChevronLeft size={14}/> Back to Login</button>
          ) : (
            <>
              <button onClick={() => setIsResetMode(true)} className="text-indigo-600 font-bold text-xs">Forgot Password?</button>
              <button onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }} className="text-slate-500 font-bold text-xs">
                {isLoginMode ? "New student? Register here" : "Already have an account? Login"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}