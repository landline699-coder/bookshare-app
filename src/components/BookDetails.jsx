// src/components/BookDetails.js
import React, { useState } from 'react';
import { X, Trash2, History, Calendar, StickyNote, MessageSquare, Reply, Send, CheckCircle2 } from 'lucide-react';

export default function BookDetails({ 
  book, user, isAdmin, onBorrow, onApprove, onConfirm, onReply, onDelete, onClose 
}) {
  const [msg, setMsg] = useState('');
  const [reply, setReply] = useState('');

  if (!book) return null;

  const isOwner = book.ownerId === user.uid;
  const hasRequested = book.waitlist?.some(r => r.uid === user.uid);
  const myRequest = book.waitlist?.find(r => r.uid === user.uid);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-t-[3.5rem] sm:rounded-[3.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
        
        {/* Cover Image & Header Actions */}
        <div className="h-64 relative bg-slate-200">
          {book.imageUrl && <img src={book.imageUrl} className="w-full h-full object-cover" alt="Book Cover" />}
          <div className="absolute top-6 right-6 flex gap-2">
            {(isAdmin || (isOwner && book.history?.length <= 1)) && (
              <button onClick={onDelete} className="bg-red-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><Trash2 size={20}/></button>
            )}
            <button onClick={onClose} className="bg-black/20 text-white w-10 h-10 rounded-xl flex items-center justify-center"><X/></button>
          </div>
        </div>

        <div className="p-8 bg-white max-h-[70dvh] overflow-y-auto no-scrollbar text-left">
          <h2 className="text-3xl font-black mb-1 uppercase tracking-tighter text-slate-900">{book.title}</h2>
          <div className="text-indigo-600 font-black italic text-xs mb-8 uppercase tracking-widest text-left">By {book.author}</div>
          
          {/* Condition Note */}
          {book.remark && (
            <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-100 rounded-[2rem] relative">
              <StickyNote className="text-amber-400 absolute -top-3 -left-2 rotate-[-12deg]" size={28}/>
              <p className="text-[10px] font-black text-amber-600 uppercase mb-2">Condition Note:</p>
              <p className="text-sm font-bold text-slate-700 italic">"{book.remark}"</p>
            </div>
          )}

          {/* --- BORROWER FLOW --- */}
          {!isOwner && !hasRequested && book.handoverStatus === 'available' && (
            <div className="mb-10 p-6 bg-indigo-50 rounded-[2.5rem] border border-indigo-100">
              <p className="text-[10px] font-black uppercase text-indigo-600 mb-4 flex items-center gap-2"><Plus size={14}/> Request this book</p>
              <textarea 
                className="w-full p-4 bg-white border rounded-2xl text-sm outline-none font-bold mb-4" 
                placeholder="Why do you need this book?..."
                onChange={(e) => setMsg(e.target.value)}
              />
              <button 
                onClick={() => onBorrow(msg)}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all"
              >
                Send Request
              </button>
            </div>
          )}

          {/* --- MESSAGING & STATUS --- */}
          {!isOwner && hasRequested && (
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200 mb-10">
              <p className="text-[10px] font-black uppercase text-indigo-600 mb-4 flex items-center gap-2"><MessageSquare size={14}/> Conversation</p>
              <div className="bg-white p-4 rounded-2xl border mb-3 text-right text-xs font-bold text-slate-400 italic">Me: {myRequest.message}</div>
              {myRequest.ownerReply && (
                <div className="bg-indigo-600 p-4 rounded-2xl text-white text-sm font-bold italic animate-in zoom-in-95">"{myRequest.ownerReply}"</div>
              )}
              {book.handoverStatus === 'confirming_receipt' && book.pendingRequesterId === user.uid && (
                <button onClick={onConfirm} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg mt-6 flex items-center justify-center gap-2">
                  <CheckCircle2 size={16}/> I Received this Book
                </button>
              )}
            </div>
          )}

          {/* --- OWNER WAITLIST --- */}
          {isOwner && book.waitlist?.length > 0 && (
            <div className="space-y-6 mb-10">
              <p className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-2"><Users size={14}/> Student Waitlist ({book.waitlist.length})</p>
              {book.waitlist.map((req, i) => (
                <div key={i} className="bg-slate-50 p-5 rounded-[2.5rem] border border-slate-200">
                  <div className="flex justify-between items-start mb-3">
                    <div><div className="font-black text-sm uppercase text-slate-800">@{req.name}</div><div className="text-[9px] text-slate-400 font-bold">{req.contact}</div></div>
                    {req.status === 'pending' && (
                      <button onClick={() => onApprove(req)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md">Approve</button>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-2xl border text-xs font-bold text-slate-600 mb-4 italic">"{req.message}"</div>
                  <div className="flex gap-2">
                    <input className="flex-1 p-3 bg-white border rounded-xl text-xs outline-none" placeholder="Reply to student..." onChange={(e) => setReply(e.target.value)} />
                    <button onClick={() => onReply(req.uid, reply)} className="bg-slate-900 text-white p-3 rounded-xl"><Send size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Handover Timeline */}
          <div className="space-y-3 mt-6">
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><History size={16}/> History</p>
            {[...(book.history || [])].reverse().map((h, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border transition-all hover:bg-white shadow-sm">
                <div className="font-black text-[11px] uppercase text-slate-700">{h.owner}</div>
                <div className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1"><Calendar size={10}/> {h.date} • {h.action}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}