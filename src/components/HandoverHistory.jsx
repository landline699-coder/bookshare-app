// src/components/HandoverHistory.js
import React from 'react';
import { History, Calendar, ArrowDown } from 'lucide-react';

export default function HandoverHistory({ history = [] }) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-6 mt-10 border-t pt-8">
      <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4">
        <History size={16} /> Book Journey & Timeline
      </div>
      
      <div className="relative pl-4 space-y-4">
        {/* The connecting line */}
        <div className="absolute left-[1.15rem] top-2 bottom-2 w-0.5 bg-slate-100" />

        {[...history].reverse().map((event, i) => (
          <div key={i} className="relative flex items-start gap-4 group">
            {/* Timeline Dot */}
            <div className={`mt-1.5 w-3 h-3 rounded-full border-2 z-10 ${
              i === 0 ? 'bg-indigo-600 border-indigo-200 animate-pulse' : 'bg-white border-slate-300'
            }`} />
            
            <div className="flex-1 bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100 transition-all group-hover:bg-white group-hover:shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-black text-[11px] uppercase text-slate-700 tracking-tight">
                    {event.owner}
                  </p>
                  <p className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-1 ${
                    event.action === 'Listed' ? 'bg-blue-100 text-blue-600' : 
                    event.action === 'Received' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {event.action}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border">
                  <Calendar size={10} /> {event.date}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}