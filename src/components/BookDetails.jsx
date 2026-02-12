// --- 1. IMPORTS (औज़ार) ---
import React, { useState } from 'react';
import { X, Trash2, Edit3, Save, Clock, ShieldCheck, CheckCircle, Flag } from 'lucide-react';
import BookHistory from './BookHistory';
import * as fb from '../services/firebaseService';

export default function BookDetails({ book, user, profile, isAdmin, onClose, onBorrow, onReply, onHandover, onReceive, onDelete, onReport }) {
  // --- 2. LOCAL STATES (अस्थायी याददाश्त) ---
  const [msg, setMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: book.title, subject: book.subject });
  const [isProcessing, setIsProcessing] = useState(false);

  // --- 3. LOGIC (नियम: कौन डिलीट कर सकता है) ---
  const isOriginalOwner = user.uid === book.ownerId;
  const isTransferred = book.history?.length > 1;
  const canModify = isAdmin || (isOriginalOwner && !isTransferred);
  const myRequest = book.waitlist?.find(r => r.uid === user.uid);

  // ⏳ 24h Rejection Logic (अगले दिन ही रिक्वेस्ट भेज पाएंगे)
  let isBlocked = false; let hoursLeft = 0;
  if (myRequest?.status === 'rejected' && myRequest.rejectionDate) {
    const diff = (new Date().getTime() - new Date(myRequest.rejectionDate).getTime()) / (1000 * 60 * 60);
    if (diff < 24) { isBlocked = true; hoursLeft = Math.ceil(24 - diff); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col relative">
        
        {/* Header & Edit Button */}
        <div className="h-32 bg-indigo-600 relative flex items-center justify-center">
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 p-2 rounded-full text-white"><X size={20}/></button>
          {canModify && !isAdmin && <button onClick={() => setIsEditing(!isEditing)} className="absolute top-4 left-4 bg-white/20 p-2 rounded-full text-white">{isEditing ? <X size={18}/> : <Edit3 size={18} />}</button>}
        </div>

        <div className="p-6 pt-0 flex-1">
          {/* Title & Stats */}
          <div className="text-center -mt-12 mb-6 relative">
            <div className="w-24 h-24 bg-white rounded-2xl mx-auto shadow-xl flex items-center justify-center text-5xl mb-3 border-4 border-white">📚</div>
            {isEditing ? (
              <div className="space-y-2">
                <input className="w-full p-2 border-2 border-indigo-100 rounded-lg text-center font-bold" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} />
                <button onClick={async () => { await fb.updateBook(book.id, editData); setIsEditing(false); }} className="bg-green-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase">Save</button>
              </div>
            ) : ( <h2 className="text-2xl font-black text-slate-800">{book.title}</h2> )}
          </div>

          {/* Owner/Borrower Logic (क्या डिलीट कर सकते हैं?) */}
          {user.uid === book.ownerId || isAdmin ? (
            <div className="bg-slate-50 p-5 rounded-2xl border mb-6">
              {book.waitlist?.map((req, i) => (
                <div key={i} className="bg-white p-3 rounded-xl mb-2 shadow-sm border">
                  <p className="font-bold text-sm">{req.name}</p>
                  {req.status === 'pending' && <div className="flex gap-2 mt-2"><button onClick={() => onReply(book, req.uid, 'Approved')} className="bg-green-600 text-white text-[10px] px-3 py-2 rounded-lg font-bold">Approve</button><button onClick={() => onReply(book, req.uid, 'Rejected')} className="bg-slate-100 text-slate-600 text-[10px] px-3 py-2 rounded-lg font-bold">Reject</button></div>}
                  {req.status === 'approved' && <button disabled={isProcessing} onClick={async () => { setIsProcessing(true); await onHandover(book, req.uid); setIsProcessing(false); }} className="w-full bg-indigo-600 text-white text-[10px] py-2 rounded-lg font-bold mt-2">{isProcessing ? 'Processing...' : 'Mark as Given'}</button>}
                </div>
              ))}
              {canModify ? <button onClick={onDelete} className="w-full mt-4 bg-rose-50 text-rose-600 py-3 rounded-xl font-black text-[10px] border border-rose-100 flex items-center gap-2 justify-center"><Trash2 size={14}/> DELETE BOOK</button> : <p className="text-[10px] text-amber-600 font-bold text-center mt-4 bg-amber-50 p-2 rounded-lg">Only first owner can delete before transfer.</p>}
            </div>
          ) : (
            <div className="mb-6">
              {myRequest ? (
                <div className="p-4 bg-slate-50 rounded-xl border-2 text-center">
                  <p className="font-black text-slate-800 uppercase text-xs">Status: {myRequest.status}</p>
                  {myRequest.status === 'handed_over' && <button disabled={isProcessing} onClick={async () => { setIsProcessing(true); await onReceive(book, { uid: user.uid, name: profile.name, mobile: profile.mobile }); setIsProcessing(false); }} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black mt-3">{isProcessing ? 'Saving...' : 'I RECEIVED IT'}</button>}
                </div>
              ) : isBlocked ? (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-center"><p className="text-rose-600 text-[10px] font-black uppercase tracking-widest">Retry in {hoursLeft}h</p></div>
              ) : (
                <div className="space-y-3">
                  <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Message owner..." className="w-full bg-slate-50 p-3 rounded-xl text-sm border-2 border-transparent focus:border-indigo-100" rows="2" />
                  <button onClick={() => onBorrow(book, msg)} disabled={!msg.trim()} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-xs">Send Request</button>
                </div>
              )}
            </div>
          )}
          {/* History Module (इतिहास) */}
          <BookHistory history={book.history} />
        </div>
      </div>
    </div>
  );
}