// src/components/AddBook.jsx
import React, { useState } from 'react';
import { X, Camera, Book, Languages } from 'lucide-react';

export default function AddBook({ onPublish, onClose, categories, classes }) {
  const [formData, setFormData] = useState({
    title: '',
    category: categories[0],
    bookClass: classes[0],
    language: 'English', // ✅ Default Language
    imageUrl: '', // Optional
    remark: ''
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) return alert("Please enter book title");
    onPublish(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Book className="text-indigo-600"/> Add Book
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} className="text-slate-500"/>
          </button>
        </div>

        {/* Scrollable Form Area */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          
          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-2">Book Title</label>
            <input 
              className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:border-indigo-200"
              placeholder="e.g. Science NCERT"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          {/* Grid for Dropdowns */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-2">Category</label>
              <select 
                className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-slate-700 outline-none appearance-none"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-2">Class</label>
              <select 
                className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-slate-700 outline-none appearance-none"
                value={formData.bookClass}
                onChange={(e) => setFormData({...formData, bookClass: e.target.value})}
              >
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* ✅ NEW: LANGUAGE OPTION */}
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-2 flex items-center gap-1">
               <Languages size={12}/> Language
             </label>
             <div className="flex gap-2">
               {['English', 'Hindi'].map(lang => (
                 <button 
                   key={lang}
                   onClick={() => setFormData({...formData, language: lang})}
                   className={`flex-1 p-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                     formData.language === lang 
                       ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' 
                       : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-100'
                   }`}
                 >
                   {lang}
                 </button>
               ))}
             </div>
          </div>

          {/* Image URL (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-2">Cover Image URL (Optional)</label>
            <div className="relative">
              <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              <input 
                className="w-full bg-slate-50 p-4 pl-12 rounded-2xl font-medium text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                placeholder="Paste image link..."
                value={formData.imageUrl}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
              />
            </div>
          </div>

          {/* Remark / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-2">Note (Condition, etc.)</label>
            <textarea 
              className="w-full bg-slate-50 p-4 rounded-2xl font-medium text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
              rows="3"
              placeholder="e.g. Pages are slightly torn..."
              value={formData.remark}
              onChange={(e) => setFormData({...formData, remark: e.target.value})}
            />
          </div>

        </div>

        {/* Submit Button */}
        <button 
          onClick={handleSubmit} 
          className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest mt-6 shadow-xl shadow-slate-300 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-slate-800"
        >
          Publish Book <ArrowRight size={18} />
        </button>

      </div>
    </div>
  );
}