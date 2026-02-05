/**
 * 📚 BookShare Pro - High Scale Optimized (v3.26)
 * MASTER FRAME: Smart Auth Fix + Full Feature Restoration
 * ADDED: Smart Login (Checks Registry & Profile), Chat, Admin Delete, Nav Guard.
 * PRESERVED: Gradient Quotes, Camera, Note Display, Categories, Privacy.
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
  ChevronDown, ChevronRight, Calendar, StickyNote, FileSpreadsheet, Quote, Send, Sparkles, Reply
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
const CATEGORIES = ["Maths", "Biology", "Commerce", "Arts", "Science", "Hindi", "Novel", "Self Help", "Biography", "English", "Computer", "Other"];
const AUTH_QUOTES = [
  "Share books. Share life lessons.",
  "Donate books—knowledge reused is impact multiplied.",
  "Your notes can teach beyond you.",
  "A wider reading community creates a stronger society."
];

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
  
  // UI States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState('login'); 
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [delReason, setDelReason] = useState('');
  const [authError, setAuthError] = useState('');

  // Filters
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  // Inputs
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
  const [newBookRemark, setNewBookRemark] = useState('');
  const [newBookCategory, setNewBookCategory] = useState('Maths');
  const [newBookClass, setNewBookClass] = useState('10th');
  const [bookImageUrl, setBookImageUrl] = useState('');
  const [borrowMsg, setBorrowMsg] = useState('');
  const [borrowMobile, setBorrowMobile] = useState('');
  const [replyText, setReplyText] = useState('');

  const fileInputRef = useRef(null);

  // --- NAVIGATION GUARD ---
  useEffect(() => {
    const handleBackButton = (e) => {
      if (selectedBook) { setSelectedBook(null); e.preventDefault(); }
      else if (isAddingBook) { setIsAddingBook(false); e.preventDefault(); }
      else if (appMode) { setAppMode(null); e.preventDefault(); }
    };
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [selectedBook, isAddingBook, appMode]);

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
        } else if (!isAdminAuth) { setIsAuthModalOpen(true); }
      }
    });
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'books'), (s) => 
      setBooks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [isAdminAuth]);

  useEffect(() => {
    if (selectedBook && profile?.mobile) setBorrowMobile(profile.mobile);
  }, [selectedBook, profile]);

  // --- SMART LOGIN LOGIC ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginMobile || !loginMpin) return setAuthError("Fill all fields");
    try {
      setIsLoading(true);
      setAuthError("");
      const regRef = doc(db, 'artifacts', appId, 'public', 'data', 'mobile_registry', loginMobile);
      const snap = await getDoc(regRef);
      
      if (!snap.exists()) {
        setAuthError("Account not found. Please register.");
        return;
      }

      if (snap.data().mpin !== loginMpin) {
        setAuthError("Wrong PIN. Try again.");
        return;
      }

      const pSnap = await getDoc(doc(db, 'artifacts', appId, 'users', snap.data().uid, 'profile', 'data'));
      if (pSnap.exists()) {
        setProfile(pSnap.data());
        localStorage.setItem(`${appId}_profile`, JSON.stringify(pSnap.data()));
        setIsAuthModalOpen(false);
      }
    } catch (err) { setAuthError("Connection error"); } finally { setIsLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (tempMobile.length !== 10) return setAuthError("Invalid Mobile");
    try {
      setIsLoading(true);
      const regRef = doc(db, 'artifacts', appId, 'public', 'data', 'mobile_registry', tempMobile);
      const snap = await getDoc(regRef);
      if (snap.exists()) return setAuthError("Already registered. Login.");
      
      const pData = { name: tempName.trim(), mobile: tempMobile, mpin: tempMpin, studentClass: tempClass, isPrivate: tempIsPrivate };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), pData);
      await setDoc(regRef, { uid: user.uid, mpin: tempMpin });
      
      setProfile(pData);
      localStorage.setItem(`${appId}_profile`, JSON.stringify(pData));
      setIsAuthModalOpen(false);
    } catch (err) { setAuthError("Reg failed"); } finally { setIsLoading(false); }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminId.toLowerCase() === 'admin' && adminKey === 'admin9893@') {
      setIsAdminAuth(true); localStorage.setItem(`${appId}_isAdmin`, 'true');
      setProfile({ name: "Admin", studentClass: "Staff", mobile: "9999999999" });
      setIsAuthModalOpen(false);
    } else alert("Invalid Key");
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
    } catch (e) { alert("Add Fail"); }
  };

  const handleRequestBorrow = async (e) => {
    e.preventDefault();
    const reqObj = { uid: user.uid, name: profile.name, contact: borrowMobile, message: borrowMsg, ownerReply: "", status: "pending", timestamp: new Date().toISOString() };
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { waitlist: arrayUnion(reqObj) });
    setSelectedBook(null); alert("Requested!");
  };

  const handleSendReply = async (reqUid) => {
    if (!replyText.trim()) return;
    const updated = selectedBook.waitlist.map(r => r.uid === reqUid ? { ...r, ownerReply: replyText.trim() } : r);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { waitlist: updated });
    setReplyText(''); setSelectedBook({...selectedBook, waitlist: updated});
  };

  const handleApprove = async (req) => {
    const updated = selectedBook.waitlist.map(u => u.uid === req.uid ? { ...u, status: "approved" } : { ...u, status: "unavailable", ownerReply: "Book shared with someone else." });
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { 
      handoverStatus: 'confirming_receipt', pendingRequesterId: req.uid, pendingOwner: req.name, pendingContact: req.contact, waitlist: updated 
    });
    setSelectedBook(null);
  };

  const handleConfirmReceipt = async () => {
    const today = getFormatDate();
    const updatedHistory = [...(selectedBook.history || []), { owner: selectedBook.pendingOwner, date: today, action: 'Received' }];
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { 
      currentOwner: selectedBook.pendingOwner, ownerId: selectedBook.pendingRequesterId, contact: selectedBook.pendingContact, 
      history: updatedHistory, handoverStatus: 'available', pendingRequesterId: null, waitlist: [] 
    });
    setSelectedBook(null);
  };

  const handleDelete = async () => {
    if (isAdminAuth && !delReason) return alert("Admin: Reason Required");
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id));
    setShowDeleteConfirm(false); setSelectedBook(null); setDelReason('');
  };

  const filteredBooksList = useMemo(() => {
    let list = [...books];
    if (appMode) list = list.filter(b => b.type === appMode);
    if (currentTab === 'activity') list = list.filter(b => b.ownerId === user?.uid || b.waitlist?.some(r => r.uid === user?.uid));
    if (selectedClassFilter !== 'All') list = list.filter(b => b.bookClass === selectedClassFilter);
    if (selectedCategory !== 'All') list = list.filter(b => b.category === selectedCategory);
    if (searchTerm.trim()) list = list.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [books, appMode, currentTab, selectedClassFilter, selectedCategory, searchTerm, user]);

  if (!user) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 selection:bg-indigo-100 overflow-x-hidden">
      
      {/* AUTH SCREEN */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-white z-[300] flex flex-col items-center justify-center p-6 overflow-y-auto">
          <div className="max-w-sm w-full text-center">
            <div className="relative overflow-hidden mb-10 p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-600 shadow-2xl">
               <Quote size={24} className="text-white/30 mb-3 mx-auto" />
               <p className="text-base font-black italic text-white leading-tight min-h-[3rem] flex items-center justify-center">"{AUTH_QUOTES[activeQuote]}"</p>
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
               {['login', 'register', 'admin'].map(v => <button key={v} onClick={() => {setAuthView(v); setAuthError("");}} className={`flex-1 py-3 rounded-xl font-bold uppercase text-[9px] ${authView===v?'bg-white shadow text-indigo-600':'text-slate-400'}`}>{v}</button>)}
            </div>
            {authError && <div className="mb-4 text-rose-600 font-bold text-[10px] uppercase border border-rose-100 p-3 rounded-xl bg-rose-50">{authError}</div>}
            
            {authView === 'admin' ? (
              <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Admin ID" onChange={e => setAdminId(e.target.value)} />
                <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" type="password" placeholder="Key" onChange={e => setAdminKey(e.target.value)} />
                <button className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl">Unlock Root</button>
              </form>
            ) : authView === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <input className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl outline-none transition-all" placeholder="Mobile Number" value={loginMobile} onChange={e => setLoginMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                <input className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl outline-none transition-all tracking-[0.4em] font-black" type="password" placeholder="PIN" value={loginMpin} onChange={e => setLoginMpin(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                <button disabled={isLoading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">{isLoading ? "Verifying..." : "Login"}</button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 text-left">
                <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Student Name" onChange={e => setTempName(e.target.value)} />
                <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setTempClass(e.target.value)}>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Mobile" onChange={e => setTempMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Set 4-Digit PIN" onChange={e => setTempMpin(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                <div className="flex items-center justify-between px-2"><span className="text-[10px] font-black uppercase text-slate-400 italic">Hide Mobile from strangers?</span><button type="button" onClick={()=>setTempIsPrivate(!tempIsPrivate)} className={`w-10 h-5 rounded-full relative transition-colors ${tempIsPrivate?'bg-indigo-600':'bg-slate-200'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${tempIsPrivate?'right-1':'left-1'}`} /></button></div>
                <button disabled={isLoading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-lg">{isLoading ? "Creating..." : "Create Account"}</button>
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
              <h1 className="text-5xl font-black tracking-tighter">BookShare</h1>
              <div className="bg-slate-200/50 px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-slate-500 inline-block mt-4">@{profile?.name} • {profile?.studentClass}</div>
           </div>
           <div className="grid grid-cols-1 gap-6 w-full max-w-sm">
             <button onClick={()=>{setAppMode('sharing');setCurrentTab('explore');}} className="bg-white p-8 rounded-[3rem] shadow-xl border flex items-center gap-6"><Users className="text-indigo-600" size={32}/><h2 className="text-xl font-black uppercase">Sharing</h2></button>
             <button onClick={()=>{setAppMode('donation');setCurrentTab('explore');}} className="bg-white p-8 rounded-[3rem] shadow-xl border flex items-center gap-6"><Heart className="text-rose-600" size={32}/><h2 className="text-xl font-black uppercase">Donation</h2></button>
           </div>
           <button onClick={()=>setShowLogoutConfirm(true)} className="mt-12 text-slate-400 font-bold uppercase text-[10px]">Logout</button>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right">
          <header className="bg-white sticky top-0 z-40 p-4 border-b flex justify-between items-center shadow-sm">
             <div className="flex items-center gap-4"><button onClick={()=>setAppMode(null)} className="p-2 bg-slate-50 rounded-xl"><ChevronLeft/></button><h1 className="text-lg font-black uppercase tracking-tight leading-none">{appMode}</h1></div>
             <button onClick={()=>setIsAddingBook(true)} className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg active:scale-90 transition-all"><Plus/></button>
          </header>
          <main className="p-4 max-w-5xl mx-auto">
             <div className="mb-6 space-y-4">
                <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input className="w-full pl-12 pr-4 py-4 bg-white border rounded-2xl font-bold outline-none shadow-sm" placeholder="Search books..." onChange={e=>setSearchTerm(e.target.value)}/></div>
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
                  <div key={b.id} onClick={()=>setSelectedBook(b)} className="bg-white rounded-[2.5rem] overflow-hidden border shadow-sm active:scale-95 transition-all">
                    <div className="aspect-[4/5] bg-slate-100 relative">
                      {b.imageUrl && <img src={b.imageUrl} className="w-full h-full object-cover"/>}
                      {currentTab === 'activity' && b.ownerId === user.uid && b.waitlist?.length > 0 && <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-[8px] font-black animate-pulse">REQS: {b.waitlist.length}</div>}
                    </div>
                    <div className="p-4"><h3 className="font-black text-sm truncate uppercase tracking-tight">{b.title}</h3><p className="text-[9px] text-indigo-600 font-bold uppercase italic mt-1">{b.author}</p></div>
                  </div>
                ))}
             </div>
          </main>
        </div>
      )}

      {/* DETAIL MODAL WITH CHAT & BORROW */}
      {selectedBook && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-t-[3.5rem] sm:rounded-[3.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="h-64 relative bg-slate-200">
               {selectedBook.imageUrl && <img src={selectedBook.imageUrl} className="w-full h-full object-cover"/>}
               <div className="absolute top-6 right-6 flex gap-2">
                 {(isAdminAuth || (selectedBook.ownerId === user.uid && selectedBook.history?.length <= 1)) && <button onClick={()=>setShowDeleteConfirm(true)} className="bg-red-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><Trash2 size={20}/></button>}
                 <button onClick={() => setSelectedBook(null)} className="bg-black/20 text-white w-10 h-10 rounded-xl flex items-center justify-center"><X/></button>
               </div>
            </div>
            <div className="p-8 bg-white max-h-[80dvh] overflow-y-auto no-scrollbar text-left">
               <h2 className="text-3xl font-black mb-1 uppercase tracking-tighter text-slate-900 leading-tight">{selectedBook.title}</h2>
               <div className="text-indigo-600 font-black italic text-xs mb-8 uppercase tracking-widest">By {selectedBook.author}</div>
               
               {selectedBook.remark && <div className="mb-8 p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-100 italic text-sm font-bold text-slate-700">"{selectedBook.remark}"</div>}

               {/* CHAT LOGIC RESTORED */}
               {user.uid === selectedBook.ownerId && selectedBook.waitlist?.length > 0 && (
                  <div className="space-y-6 mb-10">
                     <p className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-2"><MessageSquare size={14}/> Incoming Chats</p>
                     {selectedBook.waitlist.map((req, i) => (
                       <div key={i} className="bg-slate-50 p-5 rounded-[2.5rem] border">
                          <div className="flex justify-between items-start mb-3">
                             <div><div className="font-black text-sm uppercase">@{req.name}</div><div className="text-[9px] text-slate-400 font-bold">{req.contact}</div></div>
                             {req.status === 'pending' && <button onClick={() => handleApprove(req)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md">Approve</button>}
                          </div>
                          <div className="bg-white p-4 rounded-2xl border text-xs font-bold text-slate-600 mb-4 italic">"{req.message}"</div>
                          {req.ownerReply ? <div className="bg-indigo-100 p-4 rounded-2xl flex items-center gap-2"><Reply size={14} className="text-indigo-600"/><p className="text-xs font-black text-indigo-800 uppercase">My Reply: {req.ownerReply}</p></div> : 
                            <div className="flex gap-2"><input className="flex-1 p-3 bg-white border rounded-xl text-xs outline-none" placeholder="Reply to student..." onChange={(e)=>setReplyText(e.target.value)} /><button onClick={()=>handleSendReply(req.uid)} className="bg-slate-900 text-white p-3 rounded-xl"><Send size={16}/></button></div>
                          }
                       </div>
                     ))}
                  </div>
               )}

               {user.uid !== selectedBook.ownerId && selectedBook.waitlist?.find(r => r.uid === user.uid) && (
                  <div className="bg-indigo-50 p-6 rounded-[2.5rem] border mb-10">
                     <p className="text-[10px] font-black uppercase text-indigo-600 mb-4 flex items-center gap-2"><MessageSquare size={14}/> Your Conversation</p>
                     <div className="bg-white p-4 rounded-2xl border mb-3 text-right text-xs font-bold text-slate-400 italic">Me: {selectedBook.waitlist.find(r => r.uid === user.uid).message}</div>
                     {selectedBook.waitlist.find(r => r.uid === user.uid).ownerReply && (
                       <div className="bg-indigo-600 p-4 rounded-2xl text-white text-sm font-bold italic animate-in zoom-in-95">"{selectedBook.waitlist.find(r => r.uid === user.uid).ownerReply}"</div>
                     )}
                  </div>
               )}

               {user.uid !== selectedBook.ownerId && !selectedBook.waitlist?.some(r => r.uid === user.uid) && selectedBook.handoverStatus === 'available' && (
                 <form onSubmit={handleRequestBorrow} className="space-y-4 mb-8 bg-indigo-50 p-6 rounded-[2.5rem]">
                    <textarea required placeholder="Message to owner..." className="w-full p-4 bg-white border rounded-2xl text-sm outline-none" value={borrowMsg} onChange={e => setBorrowMsg(e.target.value)} />
                    <input required type="tel" maxLength={10} className="w-full p-4 bg-white border rounded-2xl text-sm font-bold outline-none" value={borrowMobile} onChange={e => setBorrowMobile(e.target.value)} />
                    <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg">Request to Borrow</button>
                 </form>
               )}

               {selectedBook.handoverStatus === 'confirming_receipt' && selectedBook.pendingRequesterId === user.uid && (
                  <button onClick={handleConfirmReceipt} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl mb-10">I Received the Book</button>
               )}

               <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest"><History size={16}/> Timeline</div>
                  {[...(selectedBook.history || [])].reverse().map((h, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border transition-all hover:bg-white shadow-sm">
                       <div className="font-black text-[11px] uppercase text-slate-700">{h.owner}</div>
                       <div className="text-[8px] font-bold text-slate-400 uppercase">{h.date} • {h.action}</div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER NAV */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t p-4 flex justify-around shadow-2xl z-40">
        <button onClick={()=>{setAppMode(null); setCurrentTab('explore')}} className={`flex flex-col items-center gap-1 ${!appMode && currentTab==='explore'?'text-indigo-600':'text-slate-300'}`}><LayoutGrid size={24}/><span className="text-[8px] font-black uppercase">Home</span></button>
        <button onClick={()=>setCurrentTab('activity')} className={`flex flex-col items-center gap-1 ${currentTab==='activity'?'text-indigo-600':'text-slate-300'}`}><Bookmark size={24}/><span className="text-[8px] font-black uppercase">Library</span></button>
        <button onClick={()=>setShowLogoutConfirm(true)} className="flex flex-col items-center gap-1 text-slate-300"><LogOut size={24}/><span className="text-[8px] font-black uppercase">Exit</span></button>
      </nav>

      {/* MODALS (ADD, LOGOUT, DELETE) */}
      {isAddingBook && (
        <div className="fixed inset-0 bg-slate-900/90 z-[150] flex items-center justify-center p-4 overflow-y-auto">
           <form onSubmit={handleAddBook} className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl max-h-[95dvh] overflow-y-auto">
              <h2 className="text-3xl font-black mb-8 tracking-tighter uppercase text-slate-900">List Book</h2>
              <div onClick={() => fileInputRef.current.click()} className="aspect-video bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer mb-5 overflow-hidden active:bg-slate-100 transition-all">
                {bookImageUrl ? <img src={bookImageUrl} className="w-full h-full object-cover"/> : <><Camera className="text-slate-300 mb-2"/><span className="text-[10px] font-black uppercase text-slate-400">Capture Book Pic</span></>}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e)=>{const reader = new FileReader(); reader.onloadend = () => setBookImageUrl(reader.result); reader.readAsDataURL(e.target.files[0]);}}/>
              </div>
              <input required placeholder="Book Title" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none mb-4 border-2 border-transparent focus:border-indigo-100" value={newBookTitle} onChange={e => setNewBookTitle(e.target.value)} />
              <input placeholder="Author" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none mb-4 border-2 border-transparent focus:border-indigo-100" value={newBookAuthor} onChange={e => setNewBookAuthor(e.target.value)} />
              <div className="grid grid-cols-2 gap-3 mb-4">
                 <select className="p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none" onChange={e=>setNewBookCategory(e.target.value)}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
                 <select className="p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none" onChange={e=>setNewBookClass(e.target.value)}>{CLASSES.map(c=><option key={c} value={c}>{c}</option>)}</select>
              </div>
              <textarea placeholder="Condition Note..." className="w-full h-32 p-5 bg-slate-50 rounded-3xl font-bold text-sm outline-none resize-none mb-4 border-2 border-transparent focus:border-indigo-100" value={newBookRemark} onChange={e => setNewBookRemark(e.target.value)} />
              <div className="flex gap-4"><button type="button" onClick={()=>setIsAddingBook(false)} className="flex-1 py-5 font-black uppercase text-xs text-slate-400">Cancel</button><button className="flex-[2] py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Publish</button></div>
           </form>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[250] flex items-center justify-center p-6 text-center">
           <div className="bg-white w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl">
              <Trash2 size={48} className="mx-auto mb-6 text-red-600" />
              <h2 className="text-3xl font-black mb-6 tracking-tighter uppercase">Delete?</h2>
              {isAdminAuth && <textarea placeholder="Admin Reason..." className="w-full p-4 bg-slate-50 border rounded-2xl text-xs mb-6 outline-none font-bold" onChange={(e)=>setDelReason(e.target.value)} />}
              <div className="flex gap-4"><button onClick={()=>setShowDeleteConfirm(false)} className="flex-1 py-4 font-black uppercase text-xs text-slate-400 hover:text-slate-600">Cancel</button><button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Confirm</button></div>
           </div>
        </div>
      )}

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