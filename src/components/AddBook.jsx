// src/components/AddBook.jsx
import React, { useState } from 'react';
// 👇 Yahan 'ArrowRight' add kar diya hai
import { X, Camera, Book, Languages, Loader2, Check, ArrowRight } from 'lucide-react';
import imageCompression from 'browser-image-compression'; 

export default function AddBook({ onPublish, onClose, categories, classes }) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: categories ? categories[0] : 'Other', // Safety check
    bookClass: classes ? classes[0] : 'Other',      // Safety check
    language: 'English',
    imageUrl: '',
    remark: ''
  });

  // 🖼️ IMAGE COMPRESSOR LOGIC
  const handleImageUpload = async (event) => {
    const imageFile = event.target.files[0];
    if (!imageFile) return;

    setIsCompressing(true);
    
    const options = {
      maxSizeMB: 0.2,          // Max 200KB
      maxWidthOrHeight: 800,   // Resize to 800px width
      useWebWorker: true
    };

    try {
      const compressedFile = await imageCompression(imageFile, options);
      
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result });
        setIsCompressing(false);
      };
    } catch (error) {
      console.error("Compression Error:", error);
      setIsCompressing(false);
      alert("Image compression failed!");
    }
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) return alert("Please enter book title");
    onPublish(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Book className="text-indigo-600"/> Add Book
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
        </div>

        {/* Form Area */}
        <div className="space-y-5 overflow-y-auto pr-2 pb-4">
          
          {/* 🖼️ PHOTO SELECTION */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase ml-2">Book Photo</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 flex flex-col items-center justify-center h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:border-indigo-300 transition-all relative overflow-hidden group">
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Camera size={24}/>
                    <span className="text-[10px] font-bold uppercase">Select from Gallery</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                
                {isCompressing && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-600 mb-2" />
                    <span className="text-[10px] font-black uppercase text-indigo-600">Compressing...</span>
                  </div>
                )}
              </label>

              {formData.imageUrl && (
                <div className="bg-green-50 text-green-600 p-2 rounded-full">
                  <Check size={20} />
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-2">Book Title</label>
            
            <input 
              className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-slate-700 outline-none"
              placeholder="e.g. Science NCERT"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              
            />
          </div>
<div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-2">Author Name</label>
            
            <input 
              className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-slate-700 outline-none"
              placeholder="e.g. written by abc"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              
            />
          </div>
          {/* Category & Class */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-2">Category</label>
              <select className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-slate-700 outline-none" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-2">Class</label>
              <select className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-slate-700 outline-none" value={formData.bookClass} onChange={(e) => setFormData({...formData, bookClass: e.target.value})}>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Language Selection */}
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-2">Language</label>
             <div className="flex gap-2">
               {['English', 'Hindi'].map(lang => (
                 <button key={lang} onClick={() => setFormData({...formData, language: lang})} className={`flex-1 p-3 rounded-2xl font-bold text-sm transition-all border-2 ${formData.language === lang ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-100'}`}>{lang}</button>
               ))}
             </div>
          </div>

          {/* Remark */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-2">Note (Optional)</label>
            <textarea className="w-full bg-slate-50 p-4 rounded-2xl font-medium text-sm text-slate-600 outline-none resize-none" rows="2" placeholder="Condition of book..." value={formData.remark} onChange={(e) => setFormData({...formData, remark: e.target.value})} />
          </div>

        </div>

        {/* Submit Button */}
        <button 
          onClick={handleSubmit} 
          disabled={isCompressing}
          className={`w-full p-5 rounded-2xl font-black uppercase tracking-widest mt-6 shadow-xl transition-all flex items-center justify-center gap-2 ${isCompressing ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'}`}
        >
          {isCompressing ? 'Please Wait...' : 'Publish Book'} <ArrowRight size={18} />
        </button>

      </div>
    </div>
  );
}