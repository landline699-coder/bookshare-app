import React, { useState } from 'react';
// ✅ Fixed Import Line (No '...' here)
import { X, User, Phone, ShieldCheck, Trash2, CheckCircle, Clock, AlertCircle, Flag } from 'lucide-react';

export default function BookDetails({ 
  book, user, profile, isAdmin, 
  onClose, onBorrow, onReply, onHandover, onReceive, onDelete, onReport 
}) {
  const [msg, setMsg] = useState('');

  // 🔥 POWER LOGIC: आप मालिक हैं अगर (1) ये आपकी किताब है, या (2) आप ADMIN हैं
  const isOwner = user.uid === book.ownerId || isAdmin;
  
  // चेक करें कि क्या मैंने (User) पहले से रिक्वेस्ट भेजी है?
  const myRequest = book.waitlist?.find(r => r.uid === user.uid);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      
      {/* Main Card */}
      <div className="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col relative">
        
        {/* 1. HEADER IMAGE & CLOSE BUTTON */}
        <div className="h-40 bg-indigo-600 relative flex items-center justify-center shrink-0">
          <h1 className="text-3xl font-black text-white/20 uppercase tracking-widest px-8 text-center leading-tight">
            {book.subject}
          </h1>
          
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 bg-black/20 p-2 rounded-full text-white hover:bg-black/40 transition-colors z-10"
          >
            <X size={20} />
          </button>

          {/* 🚩 REPORT BUTTON (Only for Students, NOT Owner/Admin) */}
          {!isOwner && !isAdmin && (
            <button 
              onClick={() => {
                const reason = prompt("Why are you reporting this book? (e.g., Fake Content, Abuse)");
                if (reason) onReport(book, reason);
              }}
              className="absolute top-4 left-4 p-2 bg-rose-500/20 hover:bg-rose-600 text-white/90 hover:text-white rounded-full transition-all z-10"
              title="Report this book"
            >
              <Flag size={18} />
            </button>
          )}

          {/* Admin Badge */}
          {isAdmin && (
            <div className="absolute top-4 left-4 bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-md shadow-lg border border-yellow-500 z-10">
              ADMIN MODE
            </div>
          )}
        </div>

        {/* 2. BOOK INFO CONTENT */}
        <div className="p-6 pt-0 flex-1 overflow-y-auto">
          
          {/* Book Icon & Title */}
          <div className="text-center -mt-12 mb-6 relative z-10">
            <div className="w-24 h-24 bg-white rounded-2xl mx-auto shadow-xl flex items-center justify-center text-5xl mb-3 border-4 border-white">
              📚
            </div>
            <h2 className="text-2xl font-black text-slate-800 leading-tight">{book.title}</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
               <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                 Class {book.classLevel}
               </span>
               <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                 {book.subject}
               </span>
            </div>
          </div>

          {/* 🟢 SECTION A: OWNER / ADMIN VIEW */}
          {isOwner && (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 animate-in slide-in-from-bottom-4">
              
              <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
                <User size={16} className="text-indigo-600"/> 
                Requests ({book.waitlist?.length || 0})
              </h3>
              
              <div className="space-y-3">
                {(!book.waitlist || book.waitlist.length === 0) && (
                  <p className="text-xs text-slate-400 text-center py-4 italic">No requests yet.</p>
                )}
                
                {book.waitlist?.map((req, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    
                    {/* Request Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{req.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{req.mobile}</p>
                        {req.message && <p className="text-[11px] text-slate-500 mt-1 italic">"{req.message}"</p>}
                      </div>
                      
                      {/* Status Badge */}
                      <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wide ${
                        req.status === 'approved' ? 'bg-green-100 text-green-700' : 
                        req.status === 'handed_over' ? 'bg-indigo-100 text-indigo-700' :
                        req.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {req.status === 'pending' && (
                        <>
                          <button onClick={() => onReply(book, req.uid, 'Approved')} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors shadow-sm">
                            Approve
                          </button>
                          <button onClick={() => onReply(book, req.uid, 'Rejected')} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-lg transition-colors">
                            Reject
                          </button>
                        </>
                      )}
                      
                      {/* Handover Button (Step 1 of Transfer) */}
                      {req.status === 'approved' && (
                        <button 
                          onClick={() => onHandover(book, req.uid)} 
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                        >
                           <ShieldCheck size={16} /> Mark as Given (Handover)
                        </button>
                      )}

                      {/* Waiting State */}
                      {req.status === 'handed_over' && (
                        <div className="w-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold py-2 rounded-lg text-center animate-pulse flex items-center justify-center gap-2">
                          <Clock size={14}/> Waiting for receiver...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* DELETE BUTTON (Critical Action) */}
              <button 
                onClick={onDelete} 
                className="w-full mt-6 bg-white border-2 border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={16}/> {isAdmin ? "DELETE BOOK (ADMIN)" : "DELETE MY BOOK"}
              </button>
            </div>
          )}

          {/* 🟢 SECTION B: BORROWER VIEW (Students) */}
          {!isOwner && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              
              {myRequest ? (
                // --- Request Status View ---
                <div className={`p-5 rounded-2xl border-2 ${
                  myRequest.status === 'approved' ? 'bg-green-50 border-green-100' : 
                  myRequest.status === 'handed_over' ? 'bg-indigo-50 border-indigo-100' :
                  myRequest.status === 'rejected' ? 'bg-rose-50 border-rose-100' :
                  'bg-orange-50 border-orange-100'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {myRequest.status === 'approved' && <CheckCircle size={18} className="text-green-600"/>}
                    {myRequest.status === 'pending' && <Clock size={18} className="text-orange-600"/>}
                    {myRequest.status === 'rejected' && <AlertCircle size={18} className="text-rose-600"/>}
                    
                    <h3 className="font-black text-slate-800 uppercase tracking-wide text-sm">
                      Status: {myRequest.status.replace('_', ' ')}
                    </h3>
                  </div>
                  
                  {myRequest.status === 'pending' && (
                    <p className="text-xs text-slate-500 font-medium">Waiting for the owner to accept your request.</p>
                  )}
                  
                  {myRequest.status === 'rejected' && (
                    <p className="text-xs text-rose-500 font-bold">Owner rejected this request. Try another book.</p>
                  )}

                  {/* ✅ Approved: Show Contact (Privacy Aware) */}
                  {myRequest.status === 'approved' && (
                    <div className="mt-3 bg-white p-3 rounded-xl border border-green-100 shadow-sm">
                       <p className="text-[10px] text-green-700 font-bold mb-2 uppercase tracking-wide">Owner Agreed! Contact Details:</p>
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                           <Phone size={14}/>
                         </div>
                         <div>
                           {/* 🔒 PRIVACY LOGIC: Hide number if private & not admin */}
                           {book.ownerPrivacy && !isAdmin ? (
                             <>
                               <p className="text-sm font-black text-slate-800">Contact School Admin</p>
                               <p className="text-[9px] text-rose-500 font-bold uppercase">Number Hidden by Owner</p>
                             </>
                           ) : (
                             <>
                               <p className="text-lg font-black text-slate-800 tracking-tight">{book.contact}</p>
                               <p className="text-[9px] text-slate-400 font-bold uppercase">Mobile Number</p>
                             </>
                           )}
                         </div>
                       </div>
                    </div>
                  )}

                  {/* ✅ Handover: Confirm Receive Button */}
                  {myRequest.status === 'handed_over' && (
                    <div className="mt-4">
                       <p className="text-xs text-indigo-700 font-bold mb-3 text-center">Owner says they gave you the book.</p>
                       <button 
                         onClick={() => onReceive(book, { uid: user.uid, name: profile.name, mobile: profile.mobile })}
                         className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-xl shadow-indigo-200 animate-bounce flex items-center justify-center gap-2"
                       >
                         YES, I RECEIVED IT! <CheckCircle size={18}/>
                       </button>
                    </div>
                  )}
                </div>
              ) : (
                // --- New Request Form ---
                <div className="space-y-4">
                   <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                     <p className="text-xs text-indigo-800 font-medium leading-relaxed">
                       Write a short message to the owner asking to borrow this book.
                     </p>
                   </div>
                   <textarea 
                     value={msg} 
                     onChange={e=>setMsg(e.target.value)} 
                     placeholder="Example: Can I collect this tomorrow during lunch break?" 
                     className="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 border-2 border-transparent focus:border-indigo-100 transition-all resize-none"
                     rows="3"
                   />
                   <button 
                     onClick={() => onBorrow(book, msg)}
                     disabled={!msg.trim()}
                     className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl transition-transform active:scale-95"
                   >
                     Send Request
                   </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}