// src/components/ProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, Shield, Lock, Trash2, AlertTriangle, User } from 'lucide-react';
import { getFirestore, doc, updateDoc, collection, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';

const appId = 'school-bookshare-production-v1';

export default function ProfileSettings({ profile, onClose, onUpdate, isAdmin }) {
  // ✅ FIX: Database connect ab yahan hoga (App load hone ke baad)
  const db = getFirestore(); 
  
  const [data, setData] = useState(profile || {});
  const [newPin, setNewPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);

  // 1. Fetch Complaints (Admin Only)
  useEffect(() => {
    if (isAdmin) {
      const fetchComplaints = async () => {
        try {
          const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'complaints'), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
          console.error("Complaint Fetch Error:", e);
        }
      };
      fetchComplaints();
    }
  }, [isAdmin, db]);

  // 2. Handle Save
  const handleSave = async () => {
    setLoading(true);
    try {
      // Update Main Profile via Parent function
      await onUpdate(data);

      // Update PIN directly in Database
      if (newPin.length > 0) {
        if (newPin.length !== 4) {
          alert("PIN must be 4 digits!");
          setLoading(false);
          return;
        }
        // Mobile Registry Update
        const regRef = doc(db, 'artifacts', appId, 'public', 'data', 'mobile_registry', data.mobile);
        await updateDoc(regRef, { mpin: newPin });
        alert("Password Updated Successfully!");
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert("Error updating profile. Try again.");
    }
    setLoading(false);
  };

  // 3. Delete Complaint
  const handleDeleteComplaint = async (id) => {
    if (window.confirm("Resolve and delete this complaint?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'complaints', id));
      setComplaints(complaints.filter(c => c.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex justify-end">
      <div className="w-full sm:max-w-md h-full bg-slate-50 flex flex-col animate-in slide-in-from-right shadow-2xl">
        
        {/* Header */}
        <div className="p-6 bg-white flex justify-between items-center border-b border-slate-200">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            {isAdmin ? <Shield className="text-rose-600"/> : <User className="text-indigo-600"/>} 
            {isAdmin ? "Admin Control" : "Edit Profile"}
          </h2>
          <button onClick={onClose} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-all"><X size={20}/></button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* A. PROFILE EDIT */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
             <div className="space-y-1">
               <label className="text-xs font-black text-slate-400 uppercase ml-2">Full Name</label>
               <input 
                 value={data.name} 
                 onChange={e => setData({...data, name: e.target.value})} 
                 className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-indigo-500"
               />
             </div>

             <div className="space-y-1">
               <label className="text-xs font-black text-slate-400 uppercase ml-2">Mobile (Locked)</label>
               <input value={data.mobile} disabled className="w-full p-4 bg-slate-100 text-slate-400 rounded-2xl font-bold cursor-not-allowed"/>
             </div>

             <div className="space-y-1">
               <label className="text-xs font-black text-slate-400 uppercase ml-2">Student Class</label>
               <select 
                  value={data.studentClass || 'Your class'} 
                  onChange={e => setData({...data, studentClass: e.target.value})}
                  className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-indigo-500"
               >
                 {["6th","7th","8th","9th","10th","11th","12th","College","Other"].map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>

             {/* Change PIN */}
             <div className="space-y-1">
               <label className="text-xs font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><Lock size={12}/> Change PIN</label>
               <input 
                 type="tel"
                 maxLength={4}
                 placeholder="New 4-Digit PIN"
                 value={newPin} 
                 onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} 
                 className="w-full p-4 bg-indigo-50 rounded-2xl font-bold text-indigo-900 outline-indigo-500 placeholder:text-indigo-300"
               />
             </div>

             <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-3">
                 <div className="bg-indigo-100 p-2 rounded-full text-indigo-600"><Shield size={18}/></div>
                 <div>
                   <p className="font-black text-xs uppercase text-slate-700">Privacy Mode</p>
                   <p className="text-[10px] text-slate-400">Hide number</p>
                 </div>
               </div>
               <button onClick={()=>setData({...data, isPrivate: !data.isPrivate})} className={`w-12 h-6 rounded-full relative transition-all ${data.isPrivate ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.isPrivate ? 'left-7' : 'left-1'}`}/>
               </button>
             </div>
          </div>

          {/* B. ADMIN COMPLAINTS */}
          {isAdmin && (
            <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 space-y-4 animate-in fade-in">
              <h3 className="text-lg font-black text-rose-900 flex items-center gap-2">
                <AlertTriangle className="text-rose-600"/> User Complaints
              </h3>
              
              {complaints.length === 0 ? (
                <p className="text-center text-rose-300 font-bold text-sm py-4">No complaints found.</p>
              ) : (
                <div className="space-y-3">
                  {complaints.map(c => (
                    <div key={c.id} className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black text-rose-400 uppercase">Reporter: {c.reporter}</p>
                          <p className="font-bold text-slate-800 text-sm mt-1">"{c.reason}"</p>
                        </div>
                        <button onClick={() => handleDeleteComplaint(c.id)} className="bg-rose-100 text-rose-600 p-2 rounded-xl active:scale-90">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-200">
          <button onClick={handleSave} disabled={loading} className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2">
            <Save size={20}/> {loading ? "SAVING..." : "SAVE CHANGES"}
          </button>
        </div>

      </div>
    </div>
  );
}