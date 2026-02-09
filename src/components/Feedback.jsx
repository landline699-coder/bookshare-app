import React, { useEffect } from 'react';
import { Loader2, Cloud, Search, CheckCircle, AlertTriangle, X } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 1. LOADERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * GlobalLoader: जब पूरी ऐप सिंक हो रही हो या कोई भारी काम चल रहा हो
 * (Overlay jo user ko click karne se rokta hai)
 */
export function GlobalLoader({ message = "Processing..." }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center mb-6">
        {/* Outer Ring */}
        <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        {/* Inner Icon */}
        <div className="absolute text-indigo-600 animate-pulse">
          <Cloud size={32} />
        </div>
      </div>
      <p className="text-xl font-black text-slate-800 tracking-tight">{message}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 animate-pulse">
        Please wait a moment
      </p>
    </div>
  );
}

/**
 * LoadingScreen: ऐप शुरू होते समय दिखने वाली स्क्रीन
 */
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-50">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
      <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Book Share</h2>
      <p className="text-[10px] font-bold text-slate-400 mt-1">Version 1.0</p>
    </div>
  );
}

/**
 * ButtonLoader: बटन के अंदर छोटा लोडर
 */
export function ButtonLoader() {
  return <Loader2 className="animate-spin" size={18} />;
}

/* -------------------------------------------------------------------------- */
/* 2. EMPTY STATES                             */
/* -------------------------------------------------------------------------- */

/**
 * EmptyState: जब कोई डेटा न मिले (Search result zero, No books)
 */
export function EmptyState({ message = "Nothing found here.", subMessage = "Try searching for something else." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in zoom-in-95 duration-500">
      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
        <Search className="text-slate-300" size={40} />
      </div>
      <h3 className="text-lg font-black text-slate-800 mb-1">{message}</h3>
      <p className="text-xs font-medium text-slate-400 max-w-[200px] leading-relaxed">
        {subMessage}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. TOAST NOTIFICATIONS                      */
/* -------------------------------------------------------------------------- */

/**
 * Toast: सफलता या गलती का मैसेज दिखाने के लिए (Popup)
 */
export function Toast({ toast, onClose }) {
  // 3 सेकंड बाद अपने आप बंद हो जाएगा
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] w-[90%] max-w-sm animate-in slide-in-from-top-10 fade-in duration-300">
      <div className={`relative overflow-hidden rounded-2xl shadow-2xl p-4 pr-12 border ${
        isSuccess ? 'bg-white border-green-100' : 'bg-white border-rose-100'
      }`}>
        
        {/* Background Accent */}
        <div className={`absolute top-0 left-0 w-1 h-full ${
          isSuccess ? 'bg-green-500' : 'bg-rose-500'
        }`} />

        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full shrink-0 ${
            isSuccess ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {isSuccess ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          </div>
          
          <div>
            <h4 className={`text-sm font-black ${
              isSuccess ? 'text-green-800' : 'text-rose-800'
            }`}>
              {isSuccess ? 'Success!' : 'Error'}
            </h4>
            <p className="text-xs font-medium text-slate-600 mt-0.5 leading-snug">
              {toast.message}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 p-2 text-slate-300 hover:text-slate-600 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}