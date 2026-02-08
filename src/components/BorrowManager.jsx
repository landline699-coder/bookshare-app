import React from 'react';
import { Send, CheckCircle, Package, Clock } from 'lucide-react';

export default function BorrowManager({ book, user, onHandover, onReceive }) {
  // Check if there is an active request (Approved or Handed Over)
  const activeRequest = book.waitlist?.find(r => r.status === 'approved' || r.status === 'handed_over');

  if (!activeRequest) return null;

  const isOwner = user.uid === book.ownerId;
  const isBorrower = user.uid === activeRequest.uid;

  return (
    <div className="mt-6 p-6 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 animate-in fade-in">
      <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Package size={18}/> Handover Process
      </h3>

      {/* 1. OWNER VIEW: Transfer Button */}
      {isOwner && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-indigo-400 uppercase">Step 1: Physical Handover</p>
          {activeRequest.status === 'approved' ? (
            <button 
              onClick={() => onHandover(book, activeRequest.uid)}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-95 transition-all"
            >
              <Send size={18}/> I gave the book
            </button>
          ) : (
            <div className="bg-white p-4 rounded-2xl text-indigo-600 font-bold text-center border border-indigo-200 flex items-center justify-center gap-2">
              <CheckCircle size={18}/> Status: Handed Over
            </div>
          )}
        </div>
      )}

      {/* 2. BORROWER VIEW: Receive Button */}
      {isBorrower && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-indigo-400 uppercase">Step 2: Confirm Receipt</p>
          {activeRequest.status === 'handed_over' ? (
            <button 
              onClick={() => onReceive(book, activeRequest)}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-95 transition-all"
            >
              <CheckCircle size={18}/> I got the book
            </button>
          ) : (
            <div className="bg-white p-4 rounded-2xl text-slate-400 font-bold text-center border border-slate-100 flex items-center justify-center gap-2">
              <Clock size={18}/> Waiting for Owner...
            </div>
          )}
        </div>
      )}
    </div>
  );
}