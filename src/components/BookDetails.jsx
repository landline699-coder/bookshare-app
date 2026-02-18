import React, { useState } from 'react';
import { X, User, ShieldCheck, Trash2, Edit3, Save, Send } from 'lucide-react';
import BookHistory from './BookHistory'; 

export default function BookDetails({ 
  book, user, profile, isAdmin, onClose, onBorrow, onReply, onHandover, onReceive, onDelete 
}) {
  const [msg, setMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editData, setEditData] = useState({ title: book.title, subject: book.subject, author: book.author || '', classLevel: book.classLevel || '' });

  const isOriginalOwner = user.uid === book.ownerId; 
  const isTransferred = (book.history || []).length > 1; 
  const isOwner = user.uid === book.ownerId || isAdmin;
  const myRequest = (book.waitlist || []).find(r => r.uid === user.uid);

  const canEdit = (!isTransferred && isOriginalOwner) || (isTransferred && isAdmin);
  const canDelete = isAdmin || (isOriginalOwner && !isTransferred);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col relative border-4 border-white">
        
        {/* Header & Edit Button with Name */}
        <div className="h-40 bg-indigo-600 relative flex items-center justify-center shrink-0">
          <h1 className="text-3xl font-black text-white/20 uppercase tracking-widest px-8 text-center leading-tight">{book.subject}</h1>
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 p-2 rounded-full text-white hover:bg-black/40"><X size={20} /></button>
          {canEdit && (
            <button onClick={() => setIsEditing(!isEditing)} className="absolute top-4 left-4 bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-white flex items-center gap-2 border border-white/40 shadow-lg">
              {isEditing ? <><X size={16}/> <span className="text-[10px] font-black uppercase tracking-widest">Cancel</span></> : <><Edit3 size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Edit</span></>}
            </button>
          )}
        </div>

        <div className="p-6 pt-0 flex-1 overflow-y-auto">
          <div className="text-center -mt-12 mb-6 relative z-10">
            <div className="w-24 h-24 bg-white rounded-2xl mx-auto shadow-xl flex items-center justify-center text-5xl mb-3 border-4 border-white">📚</div>
            {isEditing ? (
              <div className="space-y-4 px-6 text-left animate-in zoom-in-95">
                <input className="w-full bg-slate-50 border-2 p-3 rounded-xl font-bold" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} placeholder="Title" />
                <input className="w-full bg-slate-50 border-2 p-3 rounded-xl font-bold" value={editData.author} onChange={e => setEditData({...editData, author: e.target.value})} placeholder="Author" />
                <button onClick={() => { onReply(book, null, 'UPDATE', editData); setIsEditing(false); }} className="bg-indigo-600 text-white w-full py-3 rounded-xl font-black uppercase tracking-widest shadow-lg active:scale-95"><Save size={16} /> Save Changes</button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black text-slate-800 leading-tight">{book.title}</h2>
                <p className="text-sm font-bold text-slate-500 mt-1 italic">By {book.author || 'Unknown Author'}</p>
              </>
            )}
          </div>

          {/* 🤝 RESTORED: Owner vs Borrower logic */}
          {isOwner ? (
            <div className="bg-slate-50 rounded-2xl p-5 border mb-6">
              <h3 className="font-black text-slate-700 mb-4 text-xs uppercase flex items-center gap-2 tracking-widest"><User size={14} className="text-indigo-600"/> Requests ({book.waitlist?.length || 0})</h3>
              <div className="space-y-3">
                {book.waitlist?.map((req, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border shadow-sm">
                    <p className="text-sm font-bold text-slate-800">{req.name}</p>
                    <div className="flex gap-2 mt-3">
                      {req.status === 'pending' && (
                        <>
                          <button onClick={() => onReply(book, req.uid, 'Approved')} className="flex-1 bg-green-600 text-white text-[10px] font-black py-2 rounded-lg hover:bg-green-700">Approve</button>
                          <button onClick={() => onReply(book, req.uid, 'Rejected')} className="flex-1 bg-slate-200 text-slate-600 text-[10px] font-black py-2 rounded-lg hover:bg-slate-300">Reject</button>
                        </>
                      )}
                      {req.status === 'approved' && <button onClick={() => onHandover(book, req.uid)} className="w-full bg-indigo-600 text-white text-xs py-3 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg"><ShieldCheck size={16} /> Mark as Given</button>}
                    </div>
                  </div>
                ))}
              </div>
              {canDelete && <button onClick={onDelete} className="w-full mt-6 bg-white border-2 border-rose-100 text-rose-500 py-3 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 uppercase tracking-widest"><Trash2 size={16}/> Delete Book</button>}
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {!myRequest || myRequest.status === 'rejected' ? (
                <div className="space-y-4 animate-in slide-in-from-bottom-2">
                  <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Why do you need this book?" className="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold border-2 focus:border-indigo-100 outline-none" rows="3" />
                  <button onClick={() => { onBorrow(book, msg); setMsg(''); }} disabled={!msg.trim()} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"><Send size={18} /> Send Request</button>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border-2 bg-indigo-50 border-indigo-100 text-center">
                  {/* यहाँ '?' लगाने से अगर status नहीं होगा, तो ऐप क्रैश नहीं होगी */}
<p className="font-black ...">
  Status: {myRequest?.status ? myRequest.status.replace('_', ' ') : 'Pending'}
</p>
                  {myRequest.status === 'handed_over' && (
                    <button disabled={isProcessing} onClick={async () => { setIsProcessing(true); await onReceive(book, { uid: user.uid, name: profile.name, mobile: profile.mobile }); setIsProcessing(false); }} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black mt-4 shadow-xl active:scale-95">I RECEIVED IT</button>
                  )}
                </div>
              )}
            </div>
          )}

          <BookHistory history={book.history} />
        </div>
      </div>
    </div>
  );
}