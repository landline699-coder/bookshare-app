import React, { useState } from 'react';
import { X, User, Phone, Trash2, MessageCircle, Send, AlertTriangle, Clock, BookOpen, CheckCircle, Edit2, Save, ThumbsUp, XCircle, Loader2 } from 'lucide-react';
import BorrowManager from './BorrowManager'; 

export default function BookDetails({ 
  book, user, profile, isAdmin, onClose, onBorrow, onReply, onDelete, onComplain, onHandover, onReceive, onUpdate 
}) {
  const [message, setMessage] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: book.title, remark: book.remark || '' });

  // ✅ NEW: PROCESSING STATE (To stop double clicks)
  const [processingReqId, setProcessingReqId] = useState(null);

  const isOwnerByUID = user && user.uid === book.ownerId;
  const isOwnerByProfile = profile && book.currentOwner === profile.name && book.contact === profile.mobile;
  
  const isOwner = isOwnerByUID || isOwnerByProfile;
  const isAdminOrOwner = isAdmin || isOwner;
  
  const myRequest = book.waitlist?.find(r => r.uid === user?.uid);
  const canEdit = isOwner && book.handoverStatus === 'available';

  const handleBorrowClick = async () => {
    if (isSending) return; // Double check
    setIsSending(true);
    await onBorrow(book, message);
    setIsSending(false); 
  };

  const handleSaveEdit = async () => {
    await onUpdate(book.id, editData);
    setIsEditing(false);
  };

  // ✅ NEW: SAFE REPLY HANDLER
  const handleReplyClick = async (reqUid, actionText) => {
    if (processingReqId) return; // Stop if already working
    setProcessingReqId(reqUid); // Lock button
    await onReply(book, reqUid, actionText);
    setProcessingReqId(null); // Unlock button
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto hide-scrollbar">
        
        {/* Header */}
        <div className="relative mb-6">
          <button onClick={onClose} className="absolute top-2 right-2 p-2 bg-white/50 backdrop-blur-md rounded-full shadow-sm z-10 hover:bg-white transition-all"><X size={20} className="text-slate-800"/></button>
          <div className="aspect-video bg-slate-100 rounded-[2rem] overflow-hidden shadow-inner border border-slate-100 relative">
            {book.imageUrl ? <img src={book.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-300"><BookOpen size={48} /></div>}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm text-indigo-600">{book.category}</div>
          </div>
        </div>

        {/* Info */}
        <div className="mb-6">
          {isEditing ? (
            <div className="space-y-3 animate-in fade-in">
               <input className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-800 border border-slate-200" value={editData.title} onChange={e=>setEditData({...editData, title:e.target.value})} placeholder="Book Title"/>
               <textarea className="w-full p-3 bg-slate-50 rounded-xl font-medium text-sm text-slate-600 border border-slate-200" value={editData.remark} onChange={e=>setEditData({...editData, remark:e.target.value})} placeholder="Note/Condition"/>
               <div className="flex gap-2">
                 <button onClick={handleSaveEdit} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold flex justify-center gap-2"><Save size={18}/> Save</button>
                 <button onClick={()=>setIsEditing(false)} className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-xl font-bold">Cancel</button>
               </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-2">
                 <h2 className="text-2xl font-black text-slate-900 leading-tight w-3/4">{book.title}</h2>
                 <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">{book.bookClass}</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-6 h-6 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm">{book.currentOwner[0]}</div>
                 <p className="text-xs font-bold text-slate-500">Owned by <span className="text-slate-900">{book.currentOwner}</span></p>
              </div>
              {book.remark && <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Condition & Note</p><p className="text-sm font-medium text-slate-700 leading-relaxed">{book.remark}</p></div>}
            </>
          )}
        </div>

        <BorrowManager book={book} user={user} onHandover={onHandover} onReceive={onReceive} />

        {/* Action Buttons */}
        <div className="space-y-3 mt-6">
           {isAdminOrOwner ? (
             <div className="flex gap-2">
               {canEdit && !isEditing && (
                 <button onClick={()=>setIsEditing(true)} className="flex-1 bg-indigo-50 text-indigo-600 py-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all"><Edit2 size={18}/> Edit</button>
               )}
               <button onClick={onDelete} className="flex-1 bg-rose-50 text-rose-600 py-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2 hover:bg-rose-100 transition-all"><Trash2 size={18}/> Delete</button>
             </div>
           ) : myRequest ? (
             <div className="w-full bg-indigo-50 text-indigo-600 py-4 rounded-2xl font-bold text-center border border-indigo-100 flex flex-col items-center">
               <span className="flex items-center gap-2 uppercase tracking-widest text-xs font-black"><CheckCircle size={14}/> Status</span>
               <span className="text-lg font-black">{myRequest.status.toUpperCase()}</span>
               {myRequest.ownerReply && <p className="text-xs mt-1 text-slate-400">Owner says: {myRequest.ownerReply}</p>}
             </div>
           ) : (
             <div className="space-y-2">
                <div className="relative">
                  <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                  <input className="w-full bg-slate-50 p-4 pl-12 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="Message to owner..." value={message} onChange={(e)=>setMessage(e.target.value)}/>
                </div>
                {/* ⏳ BUTTON DISABLED ON SENDING */}
                <button 
                  onClick={handleBorrowClick} 
                  disabled={!message.trim() || isSending}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:scale-95 transition-all"
                >
                  {isSending ? 'Sending...' : 'Request Book'} {!isSending && <Send size={16}/>}
                </button>
             </div>
           )}
           {!isOwner && !isAdmin && <button onClick={()=>setIsReporting(!isReporting)} className="w-full py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors flex items-center justify-center gap-1"><AlertTriangle size={12}/> Report Issue</button>}
           {isReporting && <div className="bg-rose-50 p-4 rounded-2xl animate-in fade-in"><input className="w-full bg-white p-3 rounded-xl text-xs font-bold mb-2 outline-none border border-rose-100" placeholder="Reason..." value={reportReason} onChange={e=>setReportReason(e.target.value)}/><button onClick={()=>{onComplain(book.id, reportReason); setIsReporting(false)}} className="w-full bg-rose-500 text-white py-2 rounded-xl text-xs font-black uppercase">Submit Report</button></div>}
        </div>

        {/* ✅ OWNER REQUEST LIST (With Fix) */}
        {isOwner && book.waitlist && book.waitlist.length > 0 && (
          <div className="mt-8 border-t border-slate-100 pt-6 animate-in slide-in-from-bottom-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2"><User size={16} className="text-indigo-600"/> Requests ({book.waitlist.length})</h3>
            <div className="space-y-4">
              {book.waitlist.map((req, idx) => (
                <div key={idx} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div><p className="text-sm font-black text-slate-800">{req.name}</p><p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5"><Phone size={10}/> {req.mobile}</p></div>
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${req.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{req.status}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl text-xs text-slate-600 font-medium mb-3 italic">"{req.message}"</div>
                  
                  {/* ✅ SAFE BUTTONS (Cannot double click) */}
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleReplyClick(req.uid, "Request Approved")}
                        disabled={processingReqId === req.uid}
                        className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {processingReqId === req.uid ? <Loader2 className="animate-spin" size={14}/> : <><ThumbsUp size={14}/> Accept</>}
                      </button>
                      <button 
                        onClick={() => handleReplyClick(req.uid, "Request Rejected")}
                        disabled={processingReqId === req.uid}
                        className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                      >
                         {processingReqId === req.uid ? <Loader2 className="animate-spin" size={14}/> : <><XCircle size={14}/> Reject</>}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}