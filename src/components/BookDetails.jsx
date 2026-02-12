import React, { useState } from 'react';
import { X, User, ShieldCheck, Trash2, Clock, Edit3, Save } from 'lucide-react';
import BookHistory from './BookHistory';

export default function BookDetails({ book, user, profile, isAdmin, onClose, onBorrow, onReply, onDelete }) {
  const [msg, setMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: book.title, subject: book.subject, author: book.author || '' });

  const isOwner = user.uid === book.ownerId || isAdmin;
  const myRequest = (book.waitlist || []).find(r => r.uid === user.uid);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto relative">
        <div className="h-32 bg-indigo-600 relative flex items-center justify-center">
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 p-2 rounded-full text-white"><X size={20} /></button>
          {isOwner && !isAdmin && (
            <button onClick={() => setIsEditing(!isEditing)} className="absolute top-4 left-4 bg-white/20 p-2 rounded-full text-white">
              {isEditing ? <X size={18}/> : <Edit3 size={18} />}
            </button>
          )}
        </div>

        <div className="p-6 pt-0">
          <div className="text-center -mt-10 mb-6">
            <div className="w-20 h-20 bg-white rounded-2xl mx-auto shadow-xl flex items-center justify-center text-4xl border-4 border-white">📚</div>
            {isEditing ? (
              <div className="space-y-3 mt-4">
                <input className="w-full border-2 p-2 rounded-xl text-center" value={editData.title} onChange={e=>setEditData({...editData, title: e.target.value})} placeholder="Title" />
                <input className="w-full border-2 p-2 rounded-xl text-center" value={editData.author} onChange={e=>setEditData({...editData, author: e.target.value})} placeholder="Author" />
                <button onClick={() => { onReply(book, null, 'UPDATE', editData); setIsEditing(false); }} className="bg-indigo-600 text-white px-6 py-2 rounded-full text-xs font-black">SAVE</button>
              </div>
            ) : (
              <div className="mt-2">
                <h2 className="text-xl font-black text-slate-800">{book.title}</h2>
                <p className="text-sm font-bold text-slate-500">By {book.author || 'Unknown'}</p>
              </div>
            )}
          </div>

          {!isOwner && (
            <div className="mb-6">
              {(() => {
                const rejectionTime = myRequest?.rejectionDate ? new Date(myRequest.rejectionDate).getTime() : 0;
                const hoursPassed = (new Date().getTime() - rejectionTime) / (1000 * 60 * 60);
                if (myRequest?.status === 'rejected' && hoursPassed < 24) {
                  return <div className="bg-rose-50 p-4 rounded-xl text-center text-rose-600 font-bold text-xs">Request Locked: Try in {Math.ceil(24-hoursPassed)}h</div>
                }
                return myRequest ? (
                  <div className="p-4 bg-indigo-50 text-indigo-700 rounded-xl text-center font-bold">Status: {myRequest.status}</div>
                ) : (
                  <button onClick={() => onBorrow(book, msg)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase">Send Request</button>
                );
              })()}
            </div>
          )}

          <BookHistory history={book.history} />
          {isOwner && <button onClick={onDelete} className="w-full mt-6 text-rose-500 font-black text-xs uppercase border-2 border-rose-100 py-3 rounded-xl">Delete Book</button>}
        </div>
      </div>
    </div>
  );
}