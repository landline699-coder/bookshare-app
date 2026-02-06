import React from 'react';
import { Loader2, Inbox, CheckCircle, AlertCircle } from 'lucide-react';

export const LoadingScreen = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white space-y-4">
      <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Connecting to Library...</p>
    </div>
  );
};

export const EmptyState = ({ message = "No books found" }) => {
  return (
    <div className="col-span-2 py-20 text-center flex flex-col items-center justify-center w-full">
      <Inbox size={48} className="text-slate-200 mb-4" />
      <p className="text-sm font-bold text-slate-400">{message}</p>
    </div>
  );
};

export const Toast = ({ type, message, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[500] animate-in slide-in-from-top duration-300">
      <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
        type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
      }`}>
        {type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
        <p className="text-xs font-black uppercase tracking-tight">{message}</p>
      </div>
    </div>
  );
};