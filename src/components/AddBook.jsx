import React, { useState, useRef } from 'react';
import { Camera, X, Check } from 'lucide-react';

export default function AddBook({ onPublish, onClose, categories, classes }) {
  const [form, setForm] = useState({ title: '', author: '', category: 'Maths', bookClass: '10th', remark: '' });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const handlePublish = async () => {
    if (!form.title) return alert("Title required");
    setLoading(true);
    await onPublish({ ...form, imageUrl: image });
    setLoading(false);
  };

  // 2. Attractive Image Logic
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="font-black text-xl">Sell/Donate Book</h2>
        <button onClick={onClose}><X/></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Image Upload Area */}
        <div onClick={()=>fileRef.current.click()} className="aspect-video bg-slate-100 rounded-2xl border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center overflow-hidden relative">
          {image ? <img src={image} className="w-full h-full object-cover"/> : <div className="text-center text-indigo-400"><Camera size={32}/><p className="text-xs font-bold mt-2">ADD COVER PHOTO</p></div>}
          <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleImage}/>
        </div>

        <input placeholder="Book Name" className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none" onChange={e=>setForm({...form, title:e.target.value})}/>
        
        {/* 3. Category & Class Dropdowns */}
        <div className="grid grid-cols-2 gap-4">
          <select className="p-4 bg-slate-50 rounded-xl font-bold" onChange={e=>setForm({...form, category:e.target.value})}>
            {categories.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select className="p-4 bg-slate-50 rounded-xl font-bold" onChange={e=>setForm({...form, bookClass:e.target.value})}>
            {classes.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        
        <textarea placeholder="Condition (e.g. New, Old, Pages missing)" className="w-full p-4 bg-slate-50 rounded-xl font-bold h-32 resize-none outline-none" onChange={e=>setForm({...form, remark:e.target.value})}/>
      </div>

      <div className="p-4 border-t">
        <button onClick={handlePublish} disabled={loading} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-black flex justify-center gap-2">
          {loading ? "Publishing..." : <><Check/> PUBLISH BOOK</>}
        </button>
      </div>
    </div>
  );
}