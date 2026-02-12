// --- 1. IMPORTS ---
import React from 'react';
import { ScrollText, MapPin, CheckCircle2 } from 'lucide-react';

export default function BookHistory({ history }) {
  if (!history || history.length === 0) return null;
  return (
    <div className="mt-8 pt-6 border-t border-slate-100">
      <h3 className="font-black text-slate-500 text-[10px] uppercase tracking-widest flex items-center gap-2 mb-6">
        <ScrollText size={14} className="text-indigo-500" /> Book Journey Log
      </h3>
      <div className="space-y-0 relative pl-2">
        <div className="absolute left-[19px] top-2 bottom-4 w-[2px] bg-slate-100" />
        {history.map((item, index) => {
          const isLatest = index === history.length - 1;
          return (
            <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
              <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm shrink-0 ${isLatest ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                 {isLatest ? <MapPin size={14} /> : <CheckCircle2 size={14} />}
              </div>
              <div className={`flex-1 p-3 rounded-xl border ${isLatest ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100'}`}>
                 <p className={`text-[11px] font-black ${isLatest ? 'text-indigo-900' : 'text-slate-700'}`}>{item.action}</p>
                 {item.owner && <p className="text-[10px] font-medium text-slate-500 mt-0.5">By: <span className="font-bold text-slate-800">{item.owner}</span></p>}
                 <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{item.date}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}