import React from 'react';
import { X, AlertTriangle, Trash2, CheckCircle, Download } from 'lucide-react';

export default function AdminReports({ reports, onClose, onResolve, onDeleteBook, onExport }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl h-[80vh] flex flex-col">
        
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-rose-100 p-2 rounded-lg text-rose-600"><AlertTriangle size={24} /></div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Admin Dashboard</h2>
              <p className="text-xs text-slate-400 font-bold">{reports.length} Active Issues</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* 🟢 EXCEL BUTTON */}
            <button onClick={onExport} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-green-200 active:scale-95 transition-all">
              <Download size={16} /> Excel Export
            </button>
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {reports.length === 0 ? (
  <div className="text-center py-16 flex flex-col items-center">
    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
      <CheckCircle size={40} className="text-green-500"/>
    </div>
    <p className="font-black text-slate-800 text-lg">No Pending Complaints</p>
    <p className="text-sm text-slate-500 max-w-[250px] mx-auto mt-2">
      Everything is running smoothly. Click the <b>Excel Export</b> button above to download all book and student details.
    </p>
  </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="bg-white border border-rose-100 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between shadow-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase">Report</span>
                    <span className="text-xs font-black text-rose-600 uppercase">{report.reason}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 mb-1">Book: "{report.bookTitle}"</p>
                  <p className="text-xs text-slate-500">By: {report.reporterName} • Owner: {report.bookOwner}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onResolve(report.id)} className="px-4 py-2 bg-slate-50 border text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-100">Dismiss</button>
                  <button onClick={() => onDeleteBook(report.bookId, report.id)} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 flex items-center gap-2"><Trash2 size={14}/> Delete Book</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}