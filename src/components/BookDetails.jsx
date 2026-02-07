// src/components/BookDetails.jsx
import React, { useState } from 'react';
import { X, Send, User, Trash2, CheckCircle, MessageCircle, Shield, MapPin, Phone, AlertTriangle } from 'lucide-react';

export default function BookDetails({ book, user, isAdmin, onClose, onBorrow, onReply, onDelete, onComplain }) {
  if (!book) return null;

  const [msg, setMsg] = useState('');
  const [reply, setReply] = useState('');
  
  const waitlist = book.waitlist || [];
  const isOwner = user && user.uid === book.ownerId;
  const myRequest = user ? waitlist.find(r => r.uid === user.uid) : null;
  const hasPower = isAdmin || isOwner;

  // 🛡️ Report Function
  const handleReport = () => {
    const reason = prompt("Direct Message to Admin: \nWhat's the issue with this book?");
    if (reason) {
      onComplain(book.id, reason);
      alert("Report Sent to Admin! 🛡️");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex justify-end">
      
      {/* Main Panel */}
      <div className="w-full h-full bg-white sm:max-w-md flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl relative">
        
        {/* --- HERO IMAGE SECTION --- */}
        <div className="relative h-[40vh] w-full flex-shrink-0 group bg-slate-900">
          {book.imageUrl ? (
            <img src={book.imageUrl} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 font-black text-2xl">NO COVER</div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"/>

          {/* Close Button */}
          <button onClick={onClose} className="absolute top-5 left-5 bg-black/20 hover:bg-black/40 backdrop-blur-md p-3 rounded-full text-white transition-all active:scale-90 border border-white/10 z-20">
            <X size={24}/>
          </button>

          {/* ⚠️ REPORT BUTTON (Direct to Admin) - Only for Non-Owners */}
          {!isOwner && !isAdmin && (
            <button 
              onClick={handleReport}
              className="absolute top-5 right-5 bg-rose-500/20 hover:bg-rose-600 backdrop-blur-md p-3 rounded-full text-white transition-all active:scale-90 border border-white/10 z-20 shadow-lg"
            >
              <AlertTriangle size={24}/>
            </button>
          )}

          {/* Book Info */}
          <div className="absolute bottom-0 left-0 w-full p-6 text-white z-10">
            <div className="flex gap-2 mb-3">
              <span className="bg-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">{book.category}</span>
              <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">{book.bookClass}</span>
            </div>
            <h1 className="text-3xl font-black uppercase leading-tight mb-2 tracking-tight">{book.title}</h1>
            <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-wide">
              <User size={14}/> <span>{book.currentOwner}</span>
              <span className="mx-1">•</span>
              <MapPin size={14}/> <span>Available</span>
            </div>
          </div>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="flex-1 overflow-y-auto bg-white relative -mt-6 rounded-t-[2rem] z-10 px-6 pt-8 pb-32">
          
          {/* A. OWNER DASHBOARD */}
          {isOwner ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Shield className="text-indigo-600" size={20}/> Manage Requests
                </h3>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{waitlist.length} Pending</span>
              </div>

              {waitlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300 space-y-4 border-2 border-dashed border-slate-100 rounded-3xl">
                  <MessageCircle size={48} className="opacity-20"/>
                  <p className="font-bold text-sm">No requests yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {waitlist.map((req, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-slate-100">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-200">
                            {req.name ? req.name[0] : 'U'}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm">{req.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{req.date}</p>
                          </div>
                        </div>
                        {req.mobile && (
                          <a href={`tel:${req.mobile}`} className="bg-green-100 text-green-700 p-2 rounded-xl active:scale-90 transition-all">
                            <Phone size={18}/>
                          </a>
                        )}
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none text-xs font-medium text-slate-600 mb-4 border border-slate-100 ml-4 relative">
                        "{req.message}"
                      </div>
                      {req.ownerReply ? (
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                          <CheckCircle size={14}/> Sent: {req.ownerReply}
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input placeholder="Type a reply..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all" onChange={e => setReply(e.target.value)}/>
                          <button onClick={() => onReply(book, req.uid, reply)} className="bg-indigo-600 text-white p-3 rounded-xl active:scale-90 transition-all shadow-lg shadow-indigo-200"><Send size={16}/></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* B. BORROWER VIEW */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><MessageCircle size={100}/></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Condition & Note</p>
                <p className="text-slate-700 font-medium italic text-sm leading-relaxed relative z-10">"{book.remark || "No specific details provided by owner."}"</p>
              </div>
              {myRequest ? (
                <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] text-center space-y-4 shadow-xl shadow-indigo-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent"/>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-2 text-white border border-white/30"><CheckCircle size={32}/></div>
                  <div><h3 className="font-black text-2xl">Request Sent!</h3><p className="text-indigo-200 text-xs font-medium mt-1">Wait for {book.currentOwner} to reply.</p></div>
                  {myRequest.ownerReply && (
                    <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-lg mt-6 text-left animate-in zoom-in">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Reply from Owner</p>
                      <p className="font-bold text-sm">{myRequest.ownerReply}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1"><div className="h-px bg-slate-200 flex-1"/><span className="text-[10px] font-black text-slate-400 uppercase">Send Request</span><div className="h-px bg-slate-200 flex-1"/></div>
                  <textarea placeholder={`Hi ${book.currentOwner}, is this book available?`} className="w-full p-6 bg-slate-50 rounded-[2rem] text-sm font-bold border-2 border-transparent outline-none focus:bg-white focus:border-indigo-500 focus:shadow-xl transition-all h-36 resize-none placeholder:text-slate-300" onChange={e => setMsg(e.target.value)}/>
                  <p className="text-[10px] text-center text-slate-400 font-medium">Your number will be shared securely.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- BOTTOM ACTION BAR --- */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50 rounded-t-[2rem]">
          {hasPower ? (
            <div className="flex gap-2">
               {isAdmin && !isOwner && <div className="bg-rose-100 text-rose-600 px-4 py-4 rounded-2xl font-black text-xs flex items-center border border-rose-200">ADMIN</div>}
               <button onClick={() => { if(window.confirm(isAdmin ? "ADMIN: Delete this book?" : "Delete your listing?")) onDelete(); }} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2 hover:bg-rose-50 hover:text-rose-500 transition-colors active:scale-95">
                <Trash2 size={20}/> Delete Listing
              </button>
            </div>
          ) : !myRequest ? (
            <button onClick={() => onBorrow(book, msg)} disabled={!msg.trim()} className={`w-full py-4 rounded-2xl font-black uppercase shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${msg.trim() ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              <Send size={20}/> Send Request
            </button>
          ) : (
             <div className="text-center text-xs font-bold text-indigo-400 uppercase tracking-widest py-3 bg-indigo-50 rounded-xl border border-indigo-100">Request Status Above</div>
          )}
        </div>

      </div>
    </div>
  );
}