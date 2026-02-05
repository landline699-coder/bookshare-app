/**
 * 📚 BookShare Pro - High Scale Optimized (v3.24)
 * LOCKED FRAME: v3.23 Base
 * ADDED: Categories, Class Filters, and Gradient Quote Background.
 * PRESERVED: Camera Support, Book Notes, Admin Logic, Privacy Mode.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, updateDoc, 
  doc, getDoc, setDoc, deleteDoc, serverTimestamp, arrayUnion, arrayRemove, query, orderBy 
} from 'firebase/firestore';
import { 
  Plus, BookOpen, Camera, X, Search, Users, ChevronLeft, MessageSquare, Phone, 
  Trash2, LayoutGrid, Bookmark, LogOut, Heart, Loader2, History, 
  ChevronDown, ChevronRight, Calendar, StickyNote, FileSpreadsheet, Quote, Send, Sparkles
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

const CLASSES = ["6th", "7th", "8th", "9th", "10th", "11th", "12th", "College", "Other"];
const CATEGORIES = ["Maths", "Biology", "Commerce", "Arts", "Science", "Hindi", "Novel", "Self Help", "English", "Other"];
const AUTH_QUOTES = [
  "Share books. Share life lessons.",
  "Donate books—knowledge reused is impact multiplied.",
  "Your notes can teach beyond you.",
  "A wider reading community creates a stronger society."
];

// --- UTILITIES ---
const compressImage = (base64Str, maxWidth = 500, quality = 0.5) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width; let height = img.height;
      if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

const getShortId = (uid) => uid ? String(uid).slice(-4).toUpperCase() : "0000";
const getFormatDate = () => {
  const d = new Date();
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem(`${appId}_profile`)) || null);
  const [isAdminAuth, setIsAdminAuth] = useState(localStorage.getItem(`${appId}_isAdmin`) === 'true');
  const [appMode, setAppMode] = useState(null); 
  const [currentTab, setCurrentTab] = useState('explore'); 
  const [books, setBooks] = useState([]);
  const [activeQuote, setActiveQuote] = useState(0);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState('login'); 
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filters
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  // Input States
  const [tempName, setTempName] = useState('');
  const [tempMobile, setTempMobile] = useState('');
  const [tempMpin, setTempMpin] = useState('');
  const [tempClass, setTempClass] = useState('10th');
  const [tempIsPrivate, setTempIsPrivate] = useState(false);
  const [loginMobile, setLoginMobile] = useState('');
  const [loginMpin, setLoginMpin] = useState('');
  const [adminId, setAdminId] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookCategory, setNewBookCategory] = useState('Maths');
  const [newBookClass, setNewBookClass] = useState('10th');
  const [newBookRemark, setNewBookRemark] = useState('');
  const [bookImageUrl, setBookImageUrl] = useState('');
  const [borrowMsg, setBorrowMsg] = useState('');
  const [borrowMobile, setBorrowMobile] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setActiveQuote((p) => (p + 1) % AUTH_QUOTES.length), 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    signInAnonymously(auth);
    onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const snap = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data'));
        if (snap.exists()) {
          setProfile(snap.data());
          localStorage.setItem(`${appId}_profile`, JSON.stringify(snap.data()));
        } else if (!isAdminAuth) setIsAuthModalOpen(true);
      }
    });
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'books'), (s) => 
      setBooks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [isAdminAuth]);

  // ACTIONS
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const comp = await compressImage(reader.result);
      setBookImageUrl(comp);
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const regRef = doc(db, 'artifacts', appId, 'public', 'data', 'mobile_registry', tempMobile);
      const pData = { name: tempName.trim(), mobile: tempMobile, mpin: tempMpin, studentClass: tempClass, isPrivate: tempIsPrivate };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), pData);
      await setDoc(regRef, { uid: user.uid, mpin: tempMpin });
      setProfile(pData); setIsAuthModalOpen(false);
    } catch (err) { setAuthError("Error"); } finally { setIsLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const snap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'mobile_registry', loginMobile));
      if (!snap.exists() || snap.data().mpin !== loginMpin) return setAuthError("Invalid");
      const pSnap = await getDoc(doc(db, 'artifacts', appId, 'users', snap.data().uid, 'profile', 'data'));
      if (pSnap.exists()) { setProfile(pSnap.data()); setIsAuthModalOpen(false); }
    } catch (err) { setAuthError("Fail"); } finally { setIsLoading(false); }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminId.toLowerCase() === 'admin' && adminKey === 'admin9893@') {
      setIsAdminAuth(true); localStorage.setItem(`${appId}_isAdmin`, 'true');
      setProfile({ name: "Admin", studentClass: "Staff", mobile: "9999999999", isPrivate: false });
      setIsAuthModalOpen(false);
    } else setAuthError("Denied");
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      const today = getFormatDate();
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'books'), {
        type: appMode, title: newBookTitle, author: newBookAuthor || 'Unknown', remark: newBookRemark,
        imageUrl: bookImageUrl, currentOwner: profile.name, ownerId: user.uid, contact: profile.mobile,
        isPrivate: profile.isPrivate || false, bookClass: newBookClass, category: newBookCategory,
        handoverStatus: 'available', history: [{ owner: profile.name, date: today, action: 'Listed' }],
        waitlist: [], createdAt: serverTimestamp()
      });
      setIsAddingBook(false); setNewBookTitle('');
    } catch (e) { alert("Fail"); }
  };

  const filteredBooksList = useMemo(() => {
    let list = [...books];
    if (appMode) list = list.filter(b => b.type === appMode);
    if (selectedClassFilter !== 'All') list = list.filter(b => b.bookClass === selectedClassFilter);
    if (selectedCategory !== 'All') list = list.filter(b => b.category === selectedCategory);
    if (searchTerm.trim()) list = list.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [books, appMode, selectedClassFilter, selectedCategory, searchTerm]);

  if (!user) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 selection:bg-blue-100 overflow-x-hidden">
      
      {/* AUTH SCREEN WITH GRADIENT QUOTE BG */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-white z-[300] flex flex-col items-center justify-center p-6 overflow-y-auto">
          <div className="max-w-sm w-full text-center">
            
            {/* ATTRACTIVE QUOTE BOX */}
            <div className="relative overflow-hidden mb-10 p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 shadow-2xl shadow-purple-200 animate-in zoom-in-95 duration-700">
               <Sparkles className="absolute top-4 right-4 text-white/20 animate-pulse" />
               <Quote size={24} className="text-white/30 mb-3 mx-auto" />
               <p className="text-base font-black italic text-white leading-tight min-h-[3rem] flex items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-1000">
                 "{AUTH_QUOTES[activeQuote]}"
               </p>
               <div className="flex gap-1.5 mt-6 justify-center">
                  {AUTH_QUOTES.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${activeQuote === i ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`}></div>)}
               </div>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
               {['login', 'register', 'admin'].map(v => <button key={v} onClick={() => setAuthView(v)} className={`flex-1 py-3 rounded-xl font-bold uppercase text-[9px] ${authView===v?'bg-white shadow text-indigo-600':'text-slate-400'}`}>{v}</button>)}
            </div>

            {authView === 'admin' ? (
              <form onSubmit={handleAdminLogin} className="space-y-4"><input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Admin ID" onChange={e => setAdminId(e.target.value)} /><input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" type="password" placeholder="Key" onChange={e => setAdminKey(e.target.value)} /><button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl">Unlock Root</button></form>
            ) : authView === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4 text-left"><input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Mobile" onChange={e => setLoginMobile(e.target.value)} /><input className="w-full p-4 bg-slate-50 rounded-2xl outline-none tracking-widest font-black" type="password" placeholder="PIN" onChange={e => setLoginMpin(e.target.value)} /><button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-indigo-100">Login</button></form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 text-left">
                <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Student Name" onChange={e => setTempName(e.target.value)} />
                <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={tempClass} onChange={e => setTempClass(e.target.value)}>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Mobile" onChange={e => setTempMobile(e.target.value)} />
                <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Set 4-Digit PIN" onChange={e => setTempMpin(e.target.value)} />
                <div className="flex items-center justify-between px-2"><span className="text-[10px] font-black uppercase text-slate-400">Privacy Mode (Hide Mobile?)</span><button type="button" onClick={()=>setTempIsPrivate(!tempIsPrivate)} className={`w-10 h-5 rounded-full relative transition-colors ${tempIsPrivate?'bg-indigo-600':'bg-slate-200'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${tempIsPrivate?'right-1':'left-1'}`} /></button></div>
                <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-lg">Register</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {!appMode ? (
        <div className="h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
           <div className="mb-12">
              <div className="bg-indigo-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl mx-auto mb-6"><BookOpen className="text-white w-12 h-12" /></div>
              <h1 className="text-5xl font-black tracking-tighter text-slate-900">BookShare</h1>
              <p className="mt-4 text-slate-400 font-bold uppercase text-[10px]">@{profile?.name} • {profile?.studentClass}</p>
           </div>
           <div className="grid grid-cols-1 gap-6 w-full max-w-sm">
             <button onClick={()=>{setAppMode('sharing');setCurrentTab('explore');}} className="bg-white p-8 rounded-[3rem] shadow-xl border flex items-center gap-6"><Users className="text-indigo-600" size={32}/><h2 className="text-xl font-black uppercase">Sharing</h2></button>
             <button onClick={()=>{setAppMode('donation');setCurrentTab('explore');}} className="bg-white p-8 rounded-[3rem] shadow-xl border flex items-center gap-6"><Heart className="text-rose-600" size={32}/><h2 className="text-xl font-black uppercase">Donation</h2></button>
           </div>
           <button onClick={()=>setShowLogoutConfirm(true)} className="mt-12 text-slate-400 font-bold uppercase text-[10px]">Logout Profile</button>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right">
          <header className="bg-white sticky top-0 z-40 p-4 border-b flex justify-between items-center shadow-sm">
             <div className="flex items-center gap-4"><button onClick={()=>setAppMode(null)} className="p-2 bg-slate-50 rounded-xl"><ChevronLeft/></button><h1 className="text-lg font-black uppercase tracking-tight">{appMode}</h1></div>
             <button onClick={()=>setIsAddingBook(true)} className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg active:scale-90 transition-all"><Plus/></button>
          </header>
          <main className="p-4 max-w-5xl mx-auto">
             <div className="mb-6 space-y-4">
                <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input className="w-full pl-12 pr-4 py-4 bg-white border rounded-2xl font-bold outline-none shadow-sm" placeholder="Search..." onChange={e=>setSearchTerm(e.target.value)}/></div>
                
                {/* RESTORED FILTERS */}
                <div className="flex gap-2 items-center">
                    <div className="relative">
                      <button onClick={()=>setIsClassDropdownOpen(!isClassDropdownOpen)} className="px-5 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg active:scale-95">
                        {selectedClassFilter === 'All' ? 'Class' : selectedClassFilter} <ChevronDown size={14} />
                      </button>
                      {isClassDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white border rounded-3xl shadow-2xl z-[100] p-2 animate-in fade-in zoom-in-95">
                           {CLASSES.map(c => ( <button key={c} onClick={()=>{setSelectedClassFilter(c); setIsClassDropdownOpen(false);}} className={`w-full text-left px-4 py-3 rounded-xl text-[11px] font-black uppercase hover:bg-slate-50 ${selectedClassFilter === c ? 'bg-indigo-50 text-indigo-600' : ''}`}>{c}</button> ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
                      {['All', ...CATEGORIES].map(c=><button key={c} onClick={()=>setSelectedCategory(c)} className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase border whitespace-nowrap transition-all ${selectedCategory===c?'bg-slate-900 text-white shadow-lg':'bg-white text-slate-500'}`}>{c}</button>)}
                    </div>
                </div>
             </div>

             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredBooksList.map(b => (
                  <div key={b.id} onClick={()=>setSelectedBook(b)} className="bg-white rounded-[2rem] overflow-hidden border shadow-sm active:scale-95 transition-all">
                    <div className="aspect-[4/5] bg-slate-100 relative">{b.imageUrl && <img src={b.imageUrl} className="w-full h-full object-cover"/>}</div>
                    <div className="p-4"><h3 className="font-black text-sm truncate uppercase tracking-tight text-slate-800">{b.title}</h3><p className="text-[9px] text-indigo-600 font-bold uppercase italic mt-1">{b.author}</p></div>
                  </div>
                ))}
             </div>
          </main>
        </div>
      )}

      {/* DETAIL MODAL WITH NOTE DISPLAY */}
      {selectedBook && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-t-[3.5rem] sm:rounded-[3.5rem] overflow-hidden animate-in slide-in-from-bottom duration-500">
            <div className="h-64 relative bg-slate-200">
               {selectedBook.imageUrl && <img src={selectedBook.imageUrl} className="w-full h-full object-cover"/>}
               <button onClick={() => setSelectedBook(null)} className="absolute top-6 right-6 bg-black/20 text-white p-2 rounded-xl"><X/></button>
            </div>
            <div className="p-10 max-h-[70vh] overflow-y-auto no-scrollbar text-left">
               <h2 className="text-3xl font-black mb-1 uppercase tracking-tighter text-slate-900 leading-tight">{selectedBook.title}</h2>
               <div className="text-indigo-600 font-black italic text-xs mb-8 uppercase tracking-widest">By {selectedBook.author}</div>
               
               {/* RESTORED BOOK NOTE DISPLAY */}
               {selectedBook.remark && (
                  <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-100 rounded-[2rem] relative">
                     <StickyNote className="text-amber-400 absolute -top-3 -left-2 rotate-[-12deg]" size={28}/>
                     <p className="text-[10px] font-black text-amber-600 uppercase mb-2 tracking-widest">Owner's Note:</p>
                     <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{selectedBook.remark}"</p>
                  </div>
               )}

               <div className="bg-slate-50 p-6 rounded-[2.5rem] border flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-2xl bg-white text-indigo-600 shadow-sm"><Phone size={20}/></div>
                  <div><div className="text-[8px] font-black text-slate-400 uppercase">Contact</div><div className="font-black text-sm">{(isAdminAuth || !selectedBook.isPrivate || selectedBook.ownerId === user.uid) ? selectedBook.contact : "Private Mode"}</div></div>
               </div>

               <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest"><History size={16}/> Timeline</div>
                  {[...(selectedBook.history || [])].reverse().map((h, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border">
                       <div className="font-black text-[11px] uppercase text-slate-700">{h.owner}</div>
                       <div className="text-[8px] font-bold text-slate-400 uppercase">{h.date} • {h.action}</div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD BOOK MODAL WITH PIC & CATEGORIES */}
      {isAddingBook && (
        <div className="fixed inset-0 bg-slate-900/90 z-[150] flex items-center justify-center p-4">
           <form onSubmit={handleAddBook} className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
              <h2 className="text-3xl font-black mb-8 tracking-tighter uppercase text-slate-900">List Book</h2>
              <div className="space-y-5">
                 {/* CAMERA UPLOAD */}
                 <div onClick={() => !isLoading && fileInputRef.current.click()} className="aspect-video bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:bg-slate-100">
                    {bookImageUrl ? <img src={bookImageUrl} className="w-full h-full object-cover"/> : (
                      <> <Camera className="text-slate-300 mb-2" size={32}/><span className="text-[10px] font-black uppercase text-slate-400">Capture Book Pic</span> </>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                 </div>

                 <input required placeholder="Book Title" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-100" value={newBookTitle} onChange={e => setNewBookTitle(e.target.value)} />
                 <input placeholder="Author" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-100" value={newBookAuthor} onChange={e => setNewBookAuthor(e.target.value)} />
                 
                 {/* RESTORED DROPDOWNS */}
                 <div className="grid grid-cols-2 gap-3">
                    <select className="w-full p-4 bg-slate-50 rounded-2xl font-black text-[10px] outline-none" onChange={e => setNewBookCategory(e.target.value)} value={newBookCategory}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl font-black text-[10px] outline-none" onChange={e => setNewBookClass(e.target.value)} value={newBookClass}>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                 </div>

                 <textarea placeholder="Write a note (e.g. Near new, with solutions)..." className="w-full h-32 p-5 bg-slate-50 rounded-3xl font-bold text-sm outline-none resize-none border-2 border-transparent focus:border-indigo-100" value={newBookRemark} onChange={e => setNewBookRemark(e.target.value)} />
                 <div className="flex gap-4 pt-4"><button type="button" onClick={()=>setIsAddingBook(false)} className="flex-1 py-5 font-black uppercase text-xs text-slate-400">Cancel</button><button disabled={isLoading} className="flex-[2] py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Publish Book</button></div>
              </div>
           </form>
        </div>
      )}

      {/* FOOTER NAV */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t p-4 flex justify-around shadow-2xl z-40">
        <button onClick={()=>{setAppMode(null); setCurrentTab('explore')}} className={`flex flex-col items-center gap-1 ${!appMode && currentTab==='explore'?'text-indigo-600':'text-slate-300'}`}><LayoutGrid size={24}/><span className="text-[8px] font-black uppercase">Home</span></button>
        <button onClick={()=>setCurrentTab('activity')} className={`flex flex-col items-center gap-1 ${currentTab==='activity'?'text-indigo-600':'text-slate-300'}`}><Bookmark size={24}/><span className="text-[8px] font-black uppercase">Library</span></button>
        <button onClick={()=>setShowLogoutConfirm(true)} className="flex flex-col items-center gap-1 text-slate-300"><LogOut size={24}/><span className="text-[8px] font-black uppercase">Exit</span></button>
      </nav>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[250] flex items-center justify-center p-6 text-center backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm p-12 rounded-[3.5rem] shadow-2xl">
              <LogOut size={60} className="mx-auto mb-8 text-rose-500" />
              <h2 className="text-3xl font-black mb-10 tracking-tighter uppercase leading-none">Logout?</h2>
              <div className="flex gap-4"><button onClick={()=>setShowLogoutConfirm(false)} className="flex-1 py-5 font-black uppercase text-[10px] text-slate-300">Stay</button><button onClick={()=>{signOut(auth); localStorage.clear(); window.location.reload();}} className="flex-1 bg-rose-500 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] shadow-xl active:scale-95 transition-all">Sign Out</button></div>
           </div>
        </div>
      )}
    </div>
  );
}