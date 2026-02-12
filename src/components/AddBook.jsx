// AddBook.jsx के अंदर इनपुट वाले हिस्से को ऐसे बदलें:
<div className="space-y-4">
  <div className="text-left">
    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Book Title</label>
    <input 
      value={formData.title} 
      onChange={e => setFormData({...formData, title: e.target.value})} // 👈 Title के लिए
      className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-slate-100"
      placeholder="e.g. Science Part 1"
    />
  </div>

  <div className="text-left">
    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Author Name</label>
    <input 
      value={formData.author} 
      onChange={e => setFormData({...formData, author: e.target.value})} // 👈 Author के लिए अलग!
      className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-slate-100"
      placeholder="e.g. NCERT"
    />
  </div>
</div>