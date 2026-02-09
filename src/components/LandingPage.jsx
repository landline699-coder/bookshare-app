import React, { useState, useEffect } from 'react';
import { BookOpen, Heart, MessageSquare, ArrowRight, Quote } from 'lucide-react';

export default function LandingPage({ profile, onSetMode, setShowCommunity, setShowProfile }) {
  const [currentQuote, setCurrentQuote] = useState(0);

  // ✍️ INSPIRATIONAL QUOTES LIST
  const quotes = [
    { text: "आज का पाठक, कल का नेता होता है।", author: "Margaret Fuller" },
    { text: "किताबें वे विमान हैं जिनसे आप कहीं भी जा सकते हैं।", author: "Gwen Glazer" },
    { text: "शिक्षा सबसे शक्तिशाली हथियार है जिसे आप दुनिया बदलने के लिए उपयोग कर सकते हैं।", author: "Nelson Mandela" },
    { text: "एक अच्छी किताब, सौ अच्छे दोस्तों के बराबर होती है।", author: "APJ Abdul Kalam" },
    { text: "ज्ञान बांटने से बढ़ता है, इसे अपनी तक सीमित न रखें।", author: "Indian Wisdom" }
  ];

  // 🔄 AUTO-SLIDE LOGIC (Every 4 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pt-6">
      
      {/* 🟢 HERO HEADER (Clean & Minimal) */}
      <div className="text-center">
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-1">
          Book<span className="text-indigo-600">Share</span>
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-8">
          Share Knowledge • Build Library
        </p>
      </div>

      {/* 🟢 NEW: SLIDING QUOTES SECTION (With Premium BG) */}
      <div className="relative max-w-2xl mx-auto px-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-200">
          
          {/* Abstract BG Decorations */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full -ml-10 -mb-10 blur-xl" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <Quote className="text-white/30 mb-4" size={32} />
            
            <div key={currentQuote} className="animate-in slide-in-from-bottom-4 duration-500">
              <p className="text-white text-lg sm:text-xl font-bold leading-tight mb-4 italic">
                "{quotes[currentQuote].text}"
              </p>
              <p className="text-indigo-200 text-xs font-black uppercase tracking-widest">
                — {quotes[currentQuote].author}
              </p>
            </div>

            {/* Dots Indicator */}
            <div className="flex gap-2 mt-6">
              {quotes.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full transition-all duration-300 ${idx === currentQuote ? 'w-6 bg-white' : 'w-2 bg-white/30'}`} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 MAIN ACTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-3xl mx-auto px-4">
        
        {/* Sharing Card */}
        <button 
          onClick={() => onSetMode('Sharing')}
          className="group relative overflow-hidden bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all text-center active:scale-95"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <BookOpen size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Sharing</h3>
            <p className="text-xs font-medium text-slate-400 mt-1">Borrow & Read Books</p>
          </div>
        </button>

        {/* Donation Card */}
        <button 
          onClick={() => onSetMode('Donation')}
          className="group relative overflow-hidden bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-rose-100 transition-all text-center active:scale-95"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <Heart size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Donation</h3>
            <p className="text-xs font-medium text-slate-400 mt-1">Give Books for Free</p>
          </div>
        </button>

      </div>

      {/* 🟢 COMMUNITY BANNER */}
      <div className="max-w-3xl mx-auto px-4 pb-10">
        <div 
          onClick={() => setShowCommunity(true)}
          className="bg-slate-900 rounded-[2rem] p-6 flex items-center justify-between cursor-pointer group hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl text-indigo-400">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold">Community Discussion</h3>
              <p className="text-slate-400 text-xs font-medium tracking-wide uppercase">Join the student circle</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <ArrowRight className="text-white" size={20} />
          </div>
        </div>
      </div>

    </div>
  );
}