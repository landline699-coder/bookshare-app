import React, { useState } from 'react';
import { BookOpen, Users, Heart, Sparkles, ArrowRight, FileSpreadsheet, UserCircle, Bell, X } from 'lucide-react';

export default function LandingPage({ 
  profile, 
  setAppMode, 
  setShowProfile, 
  setShowCommunity, 
  isAdminAuth, 
  exportReport,
  myBooksWithRequests, // ✅ New Prop
  onOpenRequest        // ✅ New Prop
}) {
  const [showNotifs, setShowNotifs] = useState(false);

  // Calculate total pending requests
  const totalRequests = myBooksWithRequests?.reduce((acc, book) => acc + (book.waitlist?.filter(r => r.status === 'pending').length || 0), 0) || 0;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col relative">
      
      {/* Header */}
      <div className="p-6 flex justify-between items-center">
         <div className="bg-white p-4 rounded-[1.5rem] shadow-md border border-slate-100">
           <BookOpen className="text-indigo-600" size={32}/>
         </div>
         
         <div className="flex gap-3 items-center">
           {/* ✅ 1. NOTIFICATION BELL */}
           {profile && (
             <div className="relative">
               <button 
                 onClick={() => setShowNotifs(!showNotifs)}
                 className={`p-3 rounded-full shadow-sm border transition-all active:scale-95 ${showNotifs ? 'bg-indigo-100 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-600'}`}
               >
                 <Bell size={24} />
               </button>
               {totalRequests > 0 && (
                 <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-50 animate-bounce">
                   {totalRequests}
                 </div>
               )}

               {/* NOTIFICATION DROPDOWN */}
               {showNotifs && (
                 <div className="absolute right-0 top-14 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 z-50 animate-in slide-in-from-top-2">
                   <div className="flex justify-between items-center mb-3">
                     <h3 className="font-black text-sm text-slate-800 uppercase tracking-widest">Inbox</h3>
                     <button onClick={()=>setShowNotifs(false)}><X size={16} className="text-slate-400"/></button>
                   </div>
                   
                   <div className="space-y-2 max-h-60 overflow-y-auto">
                     {totalRequests === 0 ? (
                       <p className="text-center text-xs text-slate-400 py-4 font-bold">No new requests</p>
                     ) : (
                       myBooksWithRequests.map(book => (
                         book.waitlist.filter(r => r.status === 'pending').map((req, idx) => (
                           <div key={`${book.id}-${idx}`} onClick={() => { onOpenRequest(book); setShowNotifs(false); }} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 active:scale-95 transition-all cursor-pointer hover:bg-indigo-50 hover:border-indigo-100">
                             <div className="flex justify-between">
                               <span className="text-[10px] font-black text-indigo-500 uppercase truncate w-20">{book.title}</span>
                               <span className="text-[9px] font-bold text-slate-400">{req.date}</span>
                             </div>
                             <p className="text-xs font-bold text-slate-700 mt-1">
                               <span className="text-slate-900">{req.name}</span> wants this book.
                             </p>
                           </div>
                         ))
                       ))
                     )}
                   </div>
                 </div>
               )}
             </div>
           )}

           {/* Admin Export */}
           {isAdminAuth && (
             <button onClick={exportReport} className="bg-green-100 text-green-700 p-3 rounded-full shadow-sm border border-green-200 active:scale-95 transition-all">
               <FileSpreadsheet size={24} /> 
             </button>
           )}
           
           {/* Profile */}
           <button onClick={()=>setShowProfile(true)} className="flex items-center gap-3 bg-white pl-4 pr-2 py-2 rounded-full shadow-sm border border-slate-100 active:scale-95 transition-all">
             <div className="text-right">
               <p className="text-xs font-black text-slate-800 leading-tight">{profile?.name.split(' ')[0]}</p>
               <p className="text-[10px] font-bold text-slate-400">{profile?.studentClass || 'Guest'}</p>
             </div>
             <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
               {profile?.name ? profile.name[0] : <UserCircle/>}
             </div>
           </button>
         </div>
      </div>

      {/* Hero Section */}
      <div className="px-6 mt-6 mb-10 text-center">
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">
          Book<span className="text-indigo-600">Share</span>
        </h1>
        <p className="text-slate-500 font-bold text-sm mx-auto w-4/5">
          Share knowledge, help others, and build your library together.
        </p>
      </div>

      {/* Action Cards */}
      <div className="px-6 grid grid-cols-2 gap-4 mb-8">
        <button onClick={()=>setAppMode('Sharing')} className="h-64 bg-white rounded-[3rem] flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(79,70,229,0.1)] border border-slate-100 group active:scale-95 transition-all relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"/>
           <div className="bg-indigo-100 w-20 h-20 rounded-[2rem] flex items-center justify-center text-indigo-600 relative z-10 mb-4 shadow-inner"><Users size={36}/></div>
           <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight relative z-10">Sharing</h2>
        </button>

        <button onClick={()=>setAppMode('Donation')} className="h-64 bg-white rounded-[3rem] flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(244,63,94,0.1)] border border-slate-100 group active:scale-95 transition-all relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"/>
           <div className="bg-rose-100 w-20 h-20 rounded-[2rem] flex items-center justify-center text-rose-600 relative z-10 mb-4 shadow-inner"><Heart size={36}/></div>
           <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight relative z-10">Donation</h2>
        </button>
      </div>

      {/* Community Banner */}
      <div className="px-6 pb-20">
        <button onClick={()=>setShowCommunity(true)} className="w-full bg-slate-900 rounded-[2.5rem] p-8 flex items-center justify-between shadow-2xl shadow-slate-400 active:scale-95 transition-all relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 opacity-90"/>
           <div className="relative z-10 flex items-center gap-5">
             <div className="bg-white/10 p-4 rounded-2xl text-indigo-300 backdrop-blur border border-white/5"><Sparkles size={28}/></div>
             <div className="text-left"><h3 className="text-white font-black text-xl tracking-tight">Community</h3><p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Join the discussion</p></div>
           </div>
           <div className="relative z-10 bg-white text-slate-900 p-3 rounded-full shadow-lg group-hover:translate-x-2 transition-transform"><ArrowRight size={20}/></div>
        </button>
      </div>
    </div>
  );
}