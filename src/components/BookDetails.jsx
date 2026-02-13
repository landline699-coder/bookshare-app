// --- 1. IMPORTS (औज़ार) ---
import React, { useState } from 'react';
import { X, User, ShieldCheck, Trash2, Clock, Edit3, Save, ScrollText, MapPin } from 'lucide-react';
import BookHistory from './BookHistory'; 

export default function BookDetails({ 
  book, user, profile, isAdmin, 
  onClose, onBorrow, onReply, onHandover, onReceive, onDelete, onReport 
}) {
  // --- 2. STATES ---
  const [msg, setMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editData, setEditData] = useState({ 
    title: book.title, 
    subject: book.subject, 
    author: book.author || '' 
  });

  // --- 3. LOGIC ---
  const isOriginalOwner = user.uid === book.ownerId; 
  const isTransferred = (book.history || []).length > 1; 
  const canDelete = isAdmin || (isOriginalOwner && !isTransferred); 
  const isOwner = user.uid === book.ownerId || isAdmin;
  const myRequest = (book.waitlist || []).find(r => r.uid === user.uid);

  // ⏳ 24h Rejection Logic (अगले दिन ही रिक्वेस्ट भेज पाएंगे)
  let isBlocked = false; let hoursLeft = 0;
  if (myRequest?.status === 'rejected' && myRequest.rejectionDate) {
    const diff = (new Date().getTime() - new Date(myRequest.rejectionDate).getTime()) / (1000 * 60 * 60);
    if (diff < 24) { isBlocked = true; hoursLeft = Math.ceil(24 - diff); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col relative">
        
        {/* --- 🖼️ HEADER IMAGE & BUTTONS --- */}
        <div className="h-40 bg-indigo-600 relative flex items-center justify-center shrink-0">
          <h1 className="text-3xl font-black text-white/20 uppercase tracking-widest px-8 text-center leading-tight">
            {book.subject}
          </h1>
          
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 p-2 rounded-full text-white hover:bg-black/40 z-10 transition-colors">
            <X size={20} />
          </button>

          {canDelete && !isAdmin && (
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className="absolute top-4 left-4 bg-white/20 p-2 rounded-full text-white hover:bg-white/40 z-10 transition-all"
            >
              {isEditing ? <X size={18}/> : <Edit3 size={18} />}
            </button>
          )}

          {isAdmin && (
            <div className="absolute top-4 left-4 bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-md shadow-lg z-10">
              ADMIN MODE
            </div>
          )}
        </div>

        {/* --- 📖 MAIN CONTENT --- */}
        <div className="p-6 pt-0 flex-1 overflow-y-auto">
          
          <div className="text-center -mt-12 mb-6 relative z-10">
            <div className="w-24 h-24 bg-white rounded-2xl mx-auto shadow-xl flex items-center justify-center text-5xl mb-3 border-4 border-white">📚</div>
            
            {isEditing ? (
              <div className="space-y-4 px-6 animate-in zoom-in-95 duration-200">
                <div className="text-left">
                  <label className="text-[10px] font-black text-indigo-500 uppercase ml-2">Book Title</label>
                  <input className="w-full bg-slate-50 border-2 border-indigo-100 p-3 rounded-xl font-bold text-slate-700 outline-none" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} />
                </div>
                <div className="text-left">
                  <label className="text-[10px] font-black text-indigo-500 uppercase ml-2">Author Name</label>
                  <input className="w-full bg-slate-50 border-2 border-indigo-100 p-3 rounded-xl font-bold text-slate-700 outline-none" value={editData.author} onChange={e => setEditData({...editData, author: e.target.value})} />
                </div>
                <button onClick={() => { onReply(book, null, 'UPDATE', editData); setIsEditing(false); }} className="bg-indigo-600 text-white w-full py-3 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                  <Save size={14} /> SAVE CHANGES
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black text-slate-800 leading-tight">{book.title}</h2>
                <p className="text-sm font-bold text-slate-500 mt-1">By {book.author || 'Unknown Author'}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Class {book.classLevel}</span>
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase">{book.subject}</span>
                </div>
              </>
            )}
          </div>

          {/* --- 🏠 OWNER/ADMIN VIEW --- */}
          {isOwner ? (
            <div className="bg-slate-50 rounded-2xl p-5 border mb-6">
              <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase"><User size={16} className="text-indigo-600"/> Requests ({book.waitlist?.length || 0})</h3>
              <div className="space-y-3">
                {book.waitlist?.map((req, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border shadow-sm">
                    <p className="text-sm font-bold text-slate-800">{req.name}</p>
                    <div className="flex gap-2 mt-3">
                      {req.status === 'pending' && (
                        <>
                          <button onClick={() => onReply(book, req.uid, 'Approved')} className="flex-1 bg-green-600 text-white text-[10px] font-black py-2 rounded-lg">Approve</button>
                          <button onClick={() => onReply(book, req.uid, 'Rejected')} className="flex-1 bg-slate-200 text-slate-600 text-[10px] font-black py-2 rounded-lg">Reject</button>
                        </>
                      )}
                      {req.status === 'approved' && <button onClick={() => onHandover(book, req.uid)} className="w-full bg-indigo-600 text-white text-xs py-3 rounded-xl font-black flex items-center justify-center gap-2"><ShieldCheck size={16} /> Mark as Given</button>}
                    </div>
                  </div>
                ))}
              </div>
              {canDelete ? <button onClick={onDelete} className="w-full mt-6 bg-white border-2 border-rose-100 text-rose-500 py-3 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 uppercase"><Trash2 size={16}/> DELETE BOOK</button> : <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 text-center text-[10px] text-amber-700 font-bold uppercase">Only first owner can delete before transfer.</div>}
            </div>
          ) : (
            /* --- 📨 BORROWER VIEW (एक ही साफ़ सुथरा हिस्सा) --- */
            <div className="space-y-4 mb-6">
              {(() => {
                // 1. अगर अभी 24 घंटे पूरे नहीं हुए (Blocked है)
                if (isBlocked) {
                  return (
                    <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-2xl text-center animate-in fade-in">
                      <Clock className="mx-auto mb-2 text-rose-500" size={24} />
                      <p className="text-sm font-black text-rose-900 uppercase">Request Locked</p>
                      <p className="text-[11px] text-rose-600 font-bold mt-1">
                        Try again in <span className="underline">{hoursLeft} hours</span>.
                      </p>
                    </div>
                  );
                }

                // 2. अगर कोई पुरानी रिक्वेस्ट नहीं है (Fresh Request)
                if (!myRequest) {
                  return (
                    <div className="space-y-4 animate-in slide-in-from-bottom-2">
                      <textarea 
                        value={msg} onChange={e=>setMsg(e.target.value)} 
                        placeholder="Why do you need this book?" 
                        className="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold border-2 focus:border-indigo-100 outline-none" 
                        rows="3" 
                      />
                      <button 
                        onClick={() => onBorrow(book, msg)} 
                        disabled={!msg.trim()} 
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase shadow-xl active:scale-95 transition-all"
                      >
                        Send Request
                      </button>
                    </div>
                  );
                }

                // 3. अगर रिक्वेस्ट पेंडिंग, अप्रूव्ड या हैंडओवर मोड में है
                return (
                  <div className="p-5 rounded-2xl border-2 bg-indigo-50 border-indigo-100 text-center">
                    <p className="font-black text-indigo-800 text-sm uppercase">Status: {myRequest.status.replace('_', ' ')}</p>
                    {/* अगर मालिक ने किताब दे दी है, तो 'I RECEIVED IT' बटन दिखाओ */}
                    {myRequest.status === 'handed_over' && (
                      <button 
                        disabled={isProcessing} 
                        onClick={async () => { setIsProcessing(true); await onReceive(book, { uid: user.uid, name: profile.name, mobile: profile.mobile }); setIsProcessing(false); }} 
                        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black mt-4 shadow-xl active:scale-95 transition-all"
                      >
                        {isProcessing ? 'Saving...' : 'I RECEIVED IT'}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <BookHistory history={book.history} />
        </div>
      </div>
    </div>
  );
}