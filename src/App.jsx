/**
 * 📚 BookShare Pro - High Scale Optimized (v3.18)
 * UPDATED: Date History, Fixed Logout, Smart Delete with Reason, Admin Excel Export.
 * PRESERVED: Chat System, Note System, Dropdown Filter, Admin Logic.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, updateDoc, 
  doc, getDoc, setDoc, deleteDoc, serverTimestamp, arrayUnion, arrayRemove, query, orderBy 
} from 'firebase/firestore';
import { 
  Plus, BookOpen, Camera, X, Search, ShieldCheck, Users, 
  ChevronLeft, MessageSquare, Phone, Clock, UserCheck, 
  Trash2, LayoutGrid, Bookmark, Timer, TrendingUp, 
  GraduationCap, EyeOff, Eye, Send, Info, LifeBuoy, Inbox, 
  Megaphone, ShieldAlert, Download, LogOut, Headset, Lock, 
  UserPlus, KeyRound, Heart, Loader2, AlertTriangle, Sparkles, Quote, Bell, Volume2, Reply, Filter, CheckCircle2, History, ChevronDown, ChevronRight, Calendar, StickyNote, FileSpreadsheet
} from 'lucide-react';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDjTgnoTmFLWe7rjAxFL9uFqjwIRXmyQ1Y",
  authDomain: "book-77f0c.firebaseapp.com",
  projectId: "book-77f0c",
  storageBucket: "book-77f0c.firebasestorage.app",
  messagingSenderId: "452301945236",
  appId: "1:452301945236:web:c7d9ae9f7132da76a63781"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'school-bookshare-production-v1';

const CATEGORIES = ["Maths", "Biology", "Commerce", "Arts", "Science", "Hindi", "Novel", "Self Help & Development", "Biography", "English", "Computer", "Coaching Notes", "Competition related", "Other"];
const CLASSES = ["6th", "7th", "8th", "9th", "10th", "11th", "12th", "College", "Other"];

const getShortId = (uid) => uid ? String(uid).slice(-4).toUpperCase() : "0000";
const getNowDate = () => {
  const d = new Date();
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}`;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem(`${appId}_profile`)) || null);
  const [isAdminAuth, setIsAdminAuth] = useState(() => localStorage.getItem(`${appId}_isAdmin`) === 'true');
  const [appMode, setAppMode] = useState(null); 
  const [currentTab, setCurrentTab] = useState('explore'); 
  const [books, setBooks] = useState([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState(''); // State for admin reason

  // Form states
  const [borrowMobile, setBorrowMobile] = useState('');
  const [borrowMsg, setBorrowMsg] = useState('');
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookCategory, setNewBookCategory] = useState('Maths');
  const [newBookClass, setNewBookClass] = useState('10th');
  const [newBookRemark, setNewBookRemark] = useState(''); 
  const [bookImageUrl, setBookImageUrl] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    signInAnonymously(auth);
    onAuthStateChanged(auth, async (u) => { 
      if (u) {
        setUser(u);
        const snap = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data'));
        if (snap.exists()) setProfile(snap.data());
        else if (!isAdminAuth) setIsAuthModalOpen(true);
      }
    });
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'books'), (s) => 
      setBooks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [isAdminAuth]);

  // --- LOGOUT FIX ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (e) { console.error(e); }
  };

  // --- SMART DELETE SYSTEM ---
  const handleDeleteBook = async () => {
    if (!selectedBook) return;
    
    // Logic: Admin needs reason, User needs history < 2
    const canUserDelete = selectedBook.ownerId === user.uid && (!selectedBook.history || selectedBook.history.length <= 1);
    
    if (isAdminAuth && !deleteReason.trim()) {
      alert("Admin: Please provide a reason for deletion.");
      return;
    }

    try {
      if (isAdminAuth || canUserDelete) {
        // If Admin, log the reason in a separate audit collection (optional) or just delete
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id));
        alert(isAdminAuth ? `Deleted by Admin. Reason: ${deleteReason}` : "Book Removed Successfully.");
        setSelectedBook(null);
        setShowDeleteConfirm(false);
        setDeleteReason('');
      } else {
        alert("Delete Denied: Book has already been transferred to someone else. Only Admin can delete now.");
      }
    } catch (e) { alert("Delete Fail"); }
  };

  // --- EXCEL (CSV) REAL-TIME EXPORT ---
  const exportToExcel = () => {
    const headers = ["Title", "Author", "Current Owner", "Contact", "Category", "Handover Status", "Last Date"];
    const rows = books.map(b => [
      `"${b.title}"`,
      `"${b.author}"`,
      `"${b.currentOwner}"`,
      `'${b.contact}`, // Quote to keep as string
      `"${b.category}"`,
      `"${b.handoverStatus}"`,
      `"${b.history?.[b.history.length - 1]?.date || 'N/A'}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BookShare_Report_${getNowDate().split(' ')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBookTitle.trim() || !user) return;
    try {
      setIsPublishing(true);
      const today = getNowDate();
      const ownerName = `${profile?.name}#${getShortId(user.uid)}`;
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'books'), {
        type: appMode, title: newBookTitle, author: newBookAuthor || 'Unknown', category: newBookCategory,
        bookClass: newBookClass, remark: newBookRemark, imageUrl: bookImageUrl, currentOwner: ownerName,
        ownerId: user.uid, contact: profile?.mobile, since: today, handoverStatus: 'available', waitlist: [], 
        history: [{ owner: ownerName, date: today, action: 'Listed' }], 
        createdAt: serverTimestamp()
      });
      setIsAddingBook(false); setNewBookTitle(''); setNewBookRemark('');
    } catch (err) { alert("Add Fail"); } finally { setIsPublishing(false); }
  };

  const handleConfirmReceipt = async () => {
    try {
      const today = getNowDate();
      const updatedHistory = [...(selectedBook.history || [])];
      updatedHistory.push({ owner: selectedBook.pendingOwner, date: today, action: 'Transferred' });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { 
        currentOwner: selectedBook.pendingOwner, ownerId: selectedBook.pendingRequesterId, 
        contact: selectedBook.pendingContact, history: updatedHistory, handoverStatus: 'available', 
        pendingRequesterId: null, waitlist: [] 
      });
      setSelectedBook(null); alert("Transfer Complete!");
    } catch (e) { console.error(e); }
  };

  if (!user) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48}/></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 selection:bg-blue-100 overflow-x-hidden">
      
      {/* DASHBOARD */}
      {!appMode ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
           <div className="mb-12">
              <div className="bg-blue-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl mx-auto mb-6"><BookOpen className="text-white w-12 h-12" /></div>
              <h1 className="text-5xl font-black mb-3 tracking-tighter">BookShare</h1>
              <div className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-slate-400">@{profile?.name || "Student"}</div>
              
              {/* FIXED LOGOUT BUTTON */}
              <button onClick={()=>setShowLogoutConfirm(true)} className="text-red-500 text-[10px] font-black uppercase mt-6 flex items-center gap-2 justify-center hover:bg-red-50 px-4 py-2 rounded-full transition-all">
                <LogOut size={14}/> Sign Out Profile
              </button>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
             <button onClick={()=>{setAppMode('sharing');setCurrentTab('explore');}} className="bg-white p-8 rounded-[3rem] shadow-xl border flex flex-col items-center"><Users size={40} className="mb-4 text-blue-600"/><h2 className="text-2xl font-black uppercase">Sharing</h2></button>
             <button onClick={()=>{setAppMode('donation');setCurrentTab('explore');}} className="bg-white p-8 rounded-[3rem] shadow-xl border flex flex-col items-center"><Heart size={40} className="mb-4 text-rose-600"/><h2 className="text-2xl font-black uppercase">Donation</h2></button>
           </div>

           {/* ADMIN EXCEL OPTION */}
           {isAdminAuth && (
             <button onClick={exportToExcel} className="mt-12 bg-emerald-50 text-emerald-600 px-6 py-3 rounded-full flex items-center gap-2 font-black text-[10px] uppercase border border-emerald-100 shadow-sm">
                <FileSpreadsheet size={16}/> Download Live Database (Excel)
             </button>
           )}
        </div>
      ) : (
        <div>
          <header className="bg-white sticky top-0 z-40 p-4 border-b flex justify-between items-center shadow-sm">
             <div className="flex items-center gap-4"><button onClick={()=>setAppMode(null)} className="p-2 bg-slate-100 rounded-xl"><ChevronLeft/></button><div><h1 className="text-lg font-black uppercase">{appMode}</h1><div className="text-[9px] font-black uppercase text-blue-600">{currentTab}</div></div></div>
             <button onClick={()=>setIsAddingBook(true)} className="bg-blue-600 text-white h-12 px-5 rounded-2xl flex items-center gap-2 shadow-xl active:scale-95 transition-all"><Plus size={20}/><span className="text-[10px] font-black uppercase hidden sm:inline">Add Book</span></button>
          </header>

          <main className="max-w-5xl mx-auto p-4 pb-24">
             {currentTab === 'explore' && (
                <div className="mb-6 space-y-4">
                  <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input className="w-full pl-12 pr-4 py-4 bg-white border rounded-2xl font-bold outline-none shadow-sm" placeholder="Search books..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/></div>
                  <div className="flex gap-2 items-center">
                    <div className="relative">
                      <button onClick={()=>setIsClassDropdownOpen(!isClassDropdownOpen)} className="px-5 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg active:scale-95">
                        {selectedClassFilter === 'All' ? 'Class' : selectedClassFilter} <ChevronDown size={14} />
                      </button>
                      {isClassDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white border rounded-3xl shadow-2xl z-[100] p-2">
                           {CLASSES.map(c => ( <button key={c} onClick={()=>{setSelectedClassFilter(c); setIsClassDropdownOpen(false);}} className={`w-full text-left px-4 py-3 rounded-xl text-[11px] font-black uppercase hover:bg-slate-50 transition-colors ${selectedClassFilter === c ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>{c}</button> ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
                      {['All', ...CATEGORIES].map(c=><button key={c} onClick={()=>setSelectedCategory(c)} className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase border whitespace-nowrap transition-all ${selectedCategory===c?'bg-slate-900 text-white shadow-lg':'bg-white text-slate-500'}`}>{c}</button>)}
                    </div>
                  </div>
                </div>
             )}

             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
               {paginatedBooks.map(b => (
                 <div key={b.id} onClick={()=>setSelectedBook(b)} className="bg-white rounded-[2.5rem] overflow-hidden border shadow-sm relative group active:scale-95 transition-all">
                   <div className="aspect-[4/5] bg-slate-100 relative">
                      {b.imageUrl ? <img src={b.imageUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-[10px]">NO COVER</div>}
                   </div>
                   <div className="p-4 text-left">
                      <h3 className="font-black text-sm truncate uppercase tracking-tight text-slate-900">{b.title}</h3>
                      <div className="text-[9px] text-slate-400 font-bold uppercase italic tracking-widest">{b.author}</div>
                   </div>
                 </div>
               ))}
             </div>
          </main>
        </div>
      )}

      {/* DETAIL VIEW WITH DATE HISTORY & SMART DELETE */}
      {selectedBook && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-t-[3.5rem] sm:rounded-[3.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
            <div className="h-64 relative bg-slate-200">
               {selectedBook.imageUrl && <img src={selectedBook.imageUrl} className="w-full h-full object-cover"/>}
               <div className="absolute top-6 right-6 flex gap-2">
                 {/* DELETE LOGIC: User if history=1 OR Admin always */}
                 {(isAdminAuth || (selectedBook.ownerId === user.uid && (!selectedBook.history || selectedBook.history.length <= 1))) && (
                   <button onClick={()=>setShowDeleteConfirm(true)} className="bg-red-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><Trash2 size={20}/></button>
                 )}
                 <button onClick={()=>setSelectedBook(null)} className="bg-black/20 text-white w-10 h-10 rounded-xl flex items-center justify-center"><X size={20}/></button>
               </div>
            </div>
            <div className="p-8 bg-white max-h-[80dvh] overflow-y-auto no-scrollbar">
               <h2 className="text-3xl font-black mb-1 uppercase tracking-tighter text-slate-900 leading-tight">{selectedBook.title}</h2>
               <div className="text-blue-600 font-black italic text-xs mb-8 uppercase tracking-[0.2em]">By {selectedBook.author}</div>
               
               {/* HANDOVER HISTORY WITH DATE */}
               <div className="mb-10 text-left">
                  <div className="flex items-center gap-2 mb-6 text-blue-600 font-black text-[10px] uppercase tracking-widest"><History size={18}/> Transfer Timeline</div>
                  <div className="space-y-3">
                     {[...(selectedBook.history || [])].reverse().map((h, i) => (
                       <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                          <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`}></div>
                          <div className="flex-1">
                            <div className="text-[11px] font-black uppercase text-slate-700">{h.owner}</div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1 mt-1"><Calendar size={10}/> {h.date || "Listed Date Missing"} • {h.action}</div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               {/* CONFIRM RECEIPT (Logic from v3.15 preserved) */}
               {selectedBook.handoverStatus === 'confirming_receipt' && selectedBook.pendingRequesterId === user.uid && (
                 <div className="mb-8 p-6 bg-blue-600 rounded-[2.5rem] shadow-xl text-center text-white">
                    <h3 className="text-lg font-black uppercase mb-4 tracking-tight">Confirm Receipt?</h3>
                    <button onClick={handleConfirmReceipt} className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black uppercase text-xs shadow-lg">Confirm I Got the Book</button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
      
      {/* DELETE MODAL WITH REASON BOX */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[250] flex items-center justify-center p-6 text-center backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl">
              <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={40} className="text-red-600" /></div>
              <h2 className="text-3xl font-black mb-2 tracking-tighter uppercase">Delete?</h2>
              
              {isAdminAuth ? (
                <div className="mb-6">
                  <p className="text-[10px] font-black text-red-600 uppercase mb-4">Admin: Why are you deleting this?</p>
                  <textarea placeholder="Write reason (e.g., Sold out, Duplicate, Irrelevant)..." className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none" value={deleteReason} onChange={(e)=>setDeleteReason(e.target.value)} />
                </div>
              ) : (
                <p className="text-xs text-slate-400 mb-8 font-bold uppercase tracking-widest px-4">Permanent removal. You cannot undo this action.</p>
              )}

              <div className="flex gap-4"><button onClick={()=>setShowDeleteConfirm(false)} className="flex-1 py-4 font-black uppercase text-xs text-slate-400">Cancel</button><button onClick={handleDeleteBook} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Confirm</button></div>
           </div>
        </div>
      )}

      {/* LOGOUT CONFIRM */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[250] flex items-center justify-center p-6 text-center backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm p-12 rounded-[3.5rem] shadow-2xl">
              <LogOut size={60} className="mx-auto mb-8 text-rose-500" />
              <h2 className="text-3xl font-black mb-2 tracking-tighter uppercase leading-none">Logout?</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 px-4 leading-relaxed">Your session will be closed on this device safely.</p>
              <div className="flex gap-4"><button onClick={()=>setShowLogoutConfirm(false)} className="flex-1 py-5 font-black uppercase text-[10px] text-slate-300 hover:text-slate-500 transition-colors">Stay</button><button onClick={handleLogout} className="flex-1 bg-rose-500 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] shadow-xl active:scale-95 transition-all">Sign Out</button></div>
           </div>
        </div>
      )}

      {/* FOOTER NAV STAYS STRICT V3.6 */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t p-4 flex justify-around shadow-2xl z-40">
        <button onClick={()=>setCurrentTab('explore')} className={`flex flex-col items-center gap-1 ${currentTab==='explore'?'text-blue-600':'text-slate-300'}`}><LayoutGrid size={24}/><span className="text-[8px] font-black uppercase">Explore</span></button>
        <button onClick={()=>setCurrentTab('activity')} className={`flex flex-col items-center gap-1 ${currentTab==='activity'?'text-blue-600':'text-slate-300'}`}><Bookmark size={24}/><span className="text-[8px] font-black uppercase">Library</span></button>
        <button onClick={()=>setShowLogoutConfirm(true)} className="flex flex-col items-center gap-1 text-slate-300"><LogOut size={24}/><span className="text-[8px] font-black uppercase">Exit</span></button>
      </nav>

    </div>
  );
}