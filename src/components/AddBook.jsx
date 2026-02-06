// src/components/AddBook.jsx
import React, { useState, useRef } from 'react';
import { Camera, X, PlusCircle } from 'lucide-react';

export default function AddBook({ onPublish, onClose, categories, classes }) {
  const [form, setForm] = useState({ title: '', author: '', remark: '', category: 'Maths', bookClass: '10th' });
  const [imgUrl, setImgUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const fileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || isPublishing) return;
    setIsPublishing(true);
    try {
      await onPublish({ ...form, imageUrl: imgUrl });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[150] flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase text-slate-900">List Your Book</h2>
          <button type="button" onClick={onClose} className="p-2 bg-slate-100 rounded-xl"><X size={20}/></button>
        </div>
        
        <div onClick={() => fileRef.current.click()} className="aspect-video bg-slate-100 border-4 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer mb-6 overflow-hidden">
          {imgUrl ? <img src={imgUrl} className="w-full h-full object-cover" /> : <div className="text-center"><Camera className="text-slate-300 mx-auto" size={40} /><p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Tap to Take Photo</p></div>}
          <input type="file" ref={fileRef} className="hidden" accept="image/*" capture="environment" onChange={(e) => {
             const file = e.target.files[0];
             const reader = new FileReader();
             reader.onloadend = () => setImgUrl(reader.result);
             reader.readAsDataURL(file);
          }} />
        </div>

        <div className="space-y-4 text-left">
          <input required placeholder="Book Title" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-indigo-500" onChange={e => setForm({...form, title: e.target.value})} />
          <input placeholder="Author Name" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-indigo-500" onChange={e => setForm({...form, author: e.target.value})} />
          
          <div className="grid grid-cols-2 gap-3">
            <select className="p-4 bg-slate-50 rounded-2xl font-black uppercase text-[10px]" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="p-4 bg-slate-50 rounded-2xl font-black uppercase text-[10px]" value={form.bookClass} onChange={e => setForm({...form, bookClass: e.target.value})}>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* ✅ Wapis laya gaya Note Feature */}
          <textarea 
            placeholder="Write something about book (e.g. New condition, 2 pages missing...)" 
            className="w-full h-24 p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none outline-indigo-500 resize-none"
            onChange={e => setForm({...form, remark: e.target.value})}
          />

          <button disabled={isPublishing} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
            <PlusCircle size={20}/> {isPublishing ? "Publishing..." : "Add Book Now"}
          </button>
        </div>
      </form>
    </div>
  );
}