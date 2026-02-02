/**
 * 📚 BookShare Pro - Ultra Stable Production Build (v3.0.1 - Expert Fix)
 * * STRICT IMPROVEMENTS & BUG FIXES:
 * - Fixed: isUpdatingProgress ReferenceError (State added back).
 * - Fixed: React Child Object error (String sanitization for all outputs).
 * - Fixed: Mobile Back Button (intercepts exit to close modals).
 * - Fixed: Auth Persistence (Stays logged in via localStorage + Firebase).
 * - Fixed: Strict Deletion (Owner can delete only if book never transferred).
 * - Added: Author Name input field in Listing.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, updateDoc, 
  doc, getDoc, setDoc, deleteDoc, serverTimestamp, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { 
  Plus, BookOpen, Camera, X, Search, ShieldCheck, Users, 
  ChevronLeft, MessageSquare, Phone, Clock, UserCheck, 
  Trash2, LayoutGrid, Bookmark, Timer, TrendingUp, 
  GraduationCap, EyeOff, Eye, Send, Info, LifeBuoy, Inbox, 
  Megaphone, ShieldAlert, Download, LogOut, Headset, Lock, 
  UserPlus, KeyRound, Heart, Loader2, AlertTriangle, Sparkles, Quote, Bell, Volume2, Reply, Filter, CheckCircle2, History
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

// ⚠️ NEVER CHANGE THIS ID TO PREVENT DATA LOSS
const appId = 'school-bookshare-production-v1'; 

const CATEGORIES = ["Maths", "Biology", "Commerce", "Arts", "Science", "Hindi", "Novel", "Self Help & Development", "Biography", "English", "Computer", "Coaching Notes", "Competition related", "Other"];
const CLASSES = ["6th", "7th", "8th", "9th", "10th", "11th", "12th", "College", "Other"];

// --- GLOBAL UTILITIES ---
const compressImage = (base64Str, maxWidth = 600, quality = 0.6) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

const safeDate = (dateStr) => {
  if (!dateStr) return 'Recently';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString('en-IN');
};

const calculateDaysDiff = (dateStr) => {
  if (!dateStr) return 0;
  const start = new Date(dateStr);
  const diffTime = Math.abs(new Date() - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getShortId = (uid) => uid ? String(uid).slice(-4).toUpperCase() : "0000";

export default function App() {
  // --- CORE STATE (Persistent via localStorage) ---
  const [user, setUser] = useState(null);
  const [isAdminAuth, setIsAdminAuth] = useState(() => localStorage.getItem(`${appId}_isAdmin`) === 'true');
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(`${appId}_profile`);
    return saved ? JSON.parse(saved) : null;
  });
  
  const [appMode, setAppMode] = useState(null); 
  const [currentTab, setCurrentTab] = useState('explore'); 

  // Data Listeners
  const [books, setBooks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);

  // UI Flow States
  const [authView, setAuthView] = useState('login'); 
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showMpin, setShowMpin] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Modals & Controls
  const [selectedBook, setSelectedBook] = useState(null);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showAdminBroadcast, setShowAdminBroadcast] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCommunityBoard, setShowCommunityBoard] = useState(false);
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false); // FIXED: Added missing state

  // Search/Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');

  // Input Fields
  const [tempName, setTempName] = useState(''); 
  const [tempClass, setTempClass] = useState('10th');
  const [tempMobile, setTempMobile] = useState('');
  const [tempMpin, setTempMpin] = useState('');
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
  const [replyInput, setReplyInput] = useState({ reqUid: '', text: '' });
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [reportText, setReportText] = useState('');
  const [suggestType, setSuggestType] = useState('demand'); 
  const [suggestMsg, setSuggestMsg] = useState('');
  const [newPagesRead, setNewPagesRead] = useState('');

  const fileInputRef = useRef(null);

  // --- HANDLERS ---
  const handleNumericInput = (val, setter, limit) => {
    if (typeof setter === 'function') setter(val.replace(/\D/g, '').slice(0, limit));
  };

  // 1. MOBILE BACK BUTTON FIX
  useEffect(() => {
    const handlePopState = (e) => {
      if (selectedBook) {
        setSelectedBook(null);
        window.history.pushState(null, "");
      } else if (isAddingBook) {
        setIsAddingBook(false);
        window.history.pushState(null, "");
      } else if (showCommunityBoard) {
        setShowCommunityBoard(false);
        window.history.pushState(null, "");
      } else if (appMode) {
        setAppMode(null);
        window.history.pushState(null, "");
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, ""); 
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedBook, isAddingBook, showCommunityBoard, appMode]);

  // 2. PERSISTENT AUTH INIT
  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (e) { console.error("Firebase Auth Error"); }
    };
    initAuth();

    const unsub = onAuthStateChanged(auth, async (u) => { 
      if (u) {
        setUser(u);
        if (!profile && !isAdminAuth) {
          const snap = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data'));
          if (snap.exists()) {
            const data = snap.data();
            setProfile(data);
            localStorage.setItem(`${appId}_profile`, JSON.stringify(data));
          } else {
            setIsAuthModalOpen(true);
          }
        }
      } else {
        setUser(null);
        setIsAuthModalOpen(true);
      }
    });
    return () => unsub();
  }, [isAdminAuth, profile]);

  // 3. REAL-TIME DATA
  useEffect(() => {
    if (!user) return;
    const unsubBooks = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'books'), (s) => 
      setBooks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSuggest = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), (s) => 
      setSuggestions(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))));
    const unsubNotify = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), (s) => 
      setNotifications(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))));
    const unsubSupport = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'support'), (s) => 
      setSupportMessages(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))));
    
    return () => { unsubBooks(); unsubSuggest(); unsubNotify(); unsubSupport(); };
  }, [user]);

  // 4. MEMOIZED FILTERING
  const filteredBooksList = useMemo(() => {
    let list = [...books];
    if (appMode) list = list.filter(b => b.type === appMode);
    if (currentTab === 'activity' && user) {
      list = list.filter(b => b.ownerId === user.uid || (b.waitlist && b.waitlist.some(r => r.uid === user.uid)) || b.pendingRequesterId === user.uid);
    }
    if (selectedCategory !== 'All') list = list.filter(b => b.category === selectedCategory);
    if (selectedClassFilter !== 'All') list = list.filter(b => b.bookClass === selectedClassFilter);
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      list = list.filter(b => b.title?.toLowerCase().includes(t) || b.author?.toLowerCase().includes(t));
    }
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [books, appMode, currentTab, selectedCategory, selectedClassFilter, searchTerm, user]);

  // --- BUSINESS ACTIONS ---

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem(`${appId}_profile`);
      localStorage.removeItem(`${appId}_isAdmin`);
      setProfile(null); setAppMode(null); setIsAdminAuth(false);
      setCurrentTab('explore'); setShowLogoutConfirm(false); setIsAuthModalOpen(true);
    } catch (e) { console.error(e); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (tempMobile.length !== 10 || tempMpin.length !== 4) { setAuthError('Fill details correctly'); return; }
    try {
      setIsLoading(true);
      const registryRef = doc(db, 'artifacts', appId, 'public', 'data', 'mobile_registry', tempMobile);
      const snap = await getDoc(registryRef);
      if (snap.exists()) { setAuthError('Number already registered.'); setIsLoading(false); return; }
      
      const pData = { name: tempName.trim(), studentClass: tempClass, mobile: tempMobile, mpin: tempMpin, isPrivate: tempIsPrivate, shortId: getShortId(user.uid) };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), pData);
      await setDoc(registryRef, { uid: user.uid, mpin: tempMpin });
      
      setProfile(pData);
      localStorage.setItem(`${appId}_profile`, JSON.stringify(pData));
      setIsAuthModalOpen(false);
    } catch (err) { setAuthError('Registry fail'); } finally { setIsLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const snap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'mobile_registry', loginMobile));
      if (!snap.exists()) { setAuthError('User not found.'); return; }
      const data = snap.data();
      if (data.mpin !== loginMpin) { setAuthError('Wrong PIN'); return; }
      
      const pSnap = await getDoc(doc(db, 'artifacts', appId, 'users', data.uid, 'profile', 'data'));
      if (pSnap.exists()) {
        const pData = pSnap.data();
        setProfile(pData);
        localStorage.setItem(`${appId}_profile`, JSON.stringify(pData));
        setIsAuthModalOpen(false);
      }
    } catch (err) { setAuthError('Login fail'); } finally { setIsLoading(false); }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminId.toLowerCase() === 'admin' && adminKey === 'admin9893@') {
      setIsAdminAuth(true);
      localStorage.setItem(`${appId}_isAdmin`, 'true');
      setProfile({ name: "School Admin", studentClass: "Staff", mobile: "9999999999", isPrivate: false, shortId: "ROOT" });
      setIsAuthModalOpen(false);
    } else setAuthError('Access Denied');
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBookTitle || !user) return;
    try {
      setIsPublishing(true);
      const today = new Date().toISOString();
      const ownerName = `${profile?.name || 'User'}#${getShortId(user.uid)}`;
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'books'), {
        type: appMode, title: newBookTitle, author: newBookAuthor || 'Unknown', category: newBookCategory,
        bookClass: newBookClass, remark: newBookRemark, imageUrl: bookImageUrl, currentOwner: ownerName, ownerClass: profile?.studentClass || 'Staff',
        ownerId: user.uid, contact: profile?.mobile || '9999999999', isPrivate: profile?.isPrivate || false,
        since: today, handoverStatus: 'available', waitlist: [], history: [{ owner: ownerName, startDate: today, action: 'Listed' }], 
        createdAt: serverTimestamp(), readingProgress: { pagesRead: 0, started: false }
      });
      setIsAddingBook(false); setNewBookTitle(''); setNewBookAuthor(''); setBookImageUrl('');
    } catch (err) { alert("Add Fail"); } finally { setIsPublishing(false); }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;
    try {
      if (selectedBook.history?.length === 1 || !selectedBook.history) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id));
        setSelectedBook(null); setShowDeleteConfirm(false);
      } else {
        alert("Cannot delete! Transfer records exist.");
        setShowDeleteConfirm(false);
      }
    } catch (e) { alert("Delete error"); }
  };

  const handleRequestBorrow = async (e) => {
    e.preventDefault();
    if (!selectedBook || borrowMobile.length !== 10) return;
    try {
      setIsPublishing(true);
      const reqObj = { uid: user.uid, name: profile.name, studentClass: profile.studentClass, contact: borrowMobile, message: borrowMsg, ownerReply: "", timestamp: new Date().toISOString() };
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { waitlist: arrayUnion(reqObj) });
      setSelectedBook(null); alert("Request Sent!");
    } catch (e) { alert("Fail"); } finally { setIsPublishing(false); }
  };

  const handleOwnerReply = async (reqUid) => {
    if (!replyInput.text.trim()) return;
    try {
      const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id);
      const updated = selectedBook.waitlist.map(r => r.uid === reqUid ? { ...r, ownerReply: replyInput.text.trim() } : r);
      await updateDoc(bookRef, { waitlist: updated });
      setReplyInput({ reqUid: '', text: '' });
      setSelectedBook({ ...selectedBook, waitlist: updated });
    } catch (e) { alert("Reply Fail"); }
  };

  const handleApproveFromWaitlist = async (reqUser) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { 
        handoverStatus: 'confirming_receipt', pendingRequesterId: reqUser.uid, pendingOwner: reqUser.name, pendingOwnerClass: reqUser.studentClass, pendingContact: reqUser.contact, isPrivate: reqUser.isPrivate, waitlist: arrayRemove(reqUser) 
      });
      setSelectedBook(null); alert("Approved!");
    } catch (e) { console.error(e); }
  };

  const handleConfirmReceipt = async () => {
    try {
      const today = new Date().toISOString();
      const updatedHistory = [...(selectedBook.history || [])];
      updatedHistory.push({ owner: selectedBook.pendingOwner, startDate: today, action: 'Transferred' });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { 
        currentOwner: selectedBook.pendingOwner, ownerClass: selectedBook.pendingOwnerClass, ownerId: selectedBook.pendingRequesterId, contact: selectedBook.pendingContact, isPrivate: selectedBook.isPrivate, history: updatedHistory, since: today, handoverStatus: 'available', pendingRequesterId: null, pendingOwner: null,
        "readingProgress.started": false, "readingProgress.pagesRead": 0, "readingProgress.lastUpdated": today
      });
      setSelectedBook(null); alert("Success!");
    } catch (e) { console.error(e); }
  };

  const handleImageUpload = async (e) => {
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

  const handleBroadcast = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), { message: broadcastMsg, createdAt: serverTimestamp(), sender: "School Admin" });
      setBroadcastMsg(''); setShowAdminBroadcast(false); alert("Broadcasted!");
    } catch (e) { console.error(e); }
  };

  const handleExportCSV = () => {
    if (books.length === 0) return;
    const headers = ["Title", "Author", "Category", "Class", "Holder"];
    const rows = books.map(b => [`"${b.title}"`, `"${b.author}"`, `"${b.category}"`, `"${b.bookClass}"`, `"${b.currentOwner}"`]);
    const csv = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Library_Data.csv`;
    link.click();
  };

  // --- UI RENDER ---

  if (!user) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 overflow-x-hidden selection:bg-blue-100">
      
      {/* AUTH OVERLAY */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-white z-[300] flex items-center justify-center p-6 overflow-y-auto">
          <div className="max-w-sm w-full py-10 text-center animate-in zoom-in-95 duration-500">
            <div className="bg-blue-600 w-24 h-24 rounded-[3rem] mx-auto mb-6 shadow-2xl relative flex items-center justify-center">
               <BookOpen className="text-white w-12 h-12" />
               <div className="absolute -bottom-1 -right-1 bg-white p-2 rounded-2xl shadow-lg">
                 {authView === 'login' ? <KeyRound className="text-blue-600 w-6 h-6"/> : authView === 'register' ? <UserPlus className="text-blue-600 w-6 h-6"/> : <ShieldAlert className="text-red-600 w-6 h-6"/>}
               </div>
            </div>
            <h1 className="text-4xl font-black tracking-tighter">BookShare</h1>
            <div className="bg-slate-100 p-1.5 rounded-[2rem] flex my-10">
               {['login', 'register', 'admin'].map(v => (
                 <button key={v} onClick={() => {setAuthView(v); setAuthError('');}} className={`flex-1 py-3 rounded-[1.5rem] font-black uppercase text-[9px] tracking-widest transition-all ${authView === v ? 'bg-white shadow-lg text-blue-600' : 'text-slate-400'}`}>{v}</button>
               ))}
            </div>
            {authError && <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black border border-rose-100 animate-bounce uppercase text-center">{String(authError)}</div>}
            {authView === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block tracking-widest text-left">Mobile</label><input required type="tel" maxLength={10} className="w-full px-6 py-5 bg-slate-50 rounded-[2rem] font-bold border-2 border-slate-100 focus:border-blue-600 outline-none" value={loginMobile} onChange={e => handleNumericInput(e.target.value, setLoginMobile, 10)} /></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block tracking-widest text-left">PIN</label><div className="relative"><Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input required type={showMpin ? "text" : "password"} maxLength={4} placeholder="••••" className="w-full pl-14 pr-16 py-5 bg-slate-50 rounded-[2rem] font-black text-2xl border-2 border-slate-100 focus:border-blue-600 outline-none tracking-[0.5em] text-left" value={loginMpin} onChange={e => handleNumericInput(e.target.value, setLoginMpin, 4)} /><button type="button" onClick={() => setShowMpin(!showMpin)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 p-2">{showMpin ? <EyeOff size={20}/> : <Eye size={20}/>}</button></div></div>
                <button type="submit" disabled={isLoading} className="w-full py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl mt-6 bg-blue-600 text-white active:scale-95 transition-all">Unlock Dashboard</button>
              </form>
            )}
            {authView === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Name" className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] font-bold border-2 border-slate-100 outline-none" value={tempName} onChange={e => setTempName(e.target.value)} />
                  <select className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] font-bold border-2 border-slate-100 outline-none" value={tempClass} onChange={e => setTempClass(e.target.value)}>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <input required type="tel" maxLength={10} placeholder="Mobile Number" className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] font-bold border-2 border-slate-100 focus:border-blue-600 outline-none" value={tempMobile} onChange={e => handleNumericInput(e.target.value, setTempMobile, 10)} />
                <input required type="password" maxLength={4} placeholder="Set 4-PIN" className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] font-black text-xl text-center tracking-[0.3em] border-2 border-slate-100 focus:border-blue-600 outline-none text-left" value={tempMpin} onChange={e => handleNumericInput(e.target.value, setTempMpin, 4)} />
                <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100 flex items-center justify-between shadow-sm">
                   <div className="flex items-center gap-2 text-left text-left"><ShieldCheck className="text-blue-600" size={18} /><span className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-left">Hide Mobile?</span></div>
                   <button type="button" onClick={() => setTempIsPrivate(!tempIsPrivate)} className={`w-12 h-6 rounded-full relative transition-colors ${tempIsPrivate ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${tempIsPrivate ? 'right-1' : 'left-1'}`} /></button>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl mt-6 bg-slate-900 text-white active:scale-95 transition-all shadow-slate-200">Register Profile</button>
              </form>
            )}
            {authView === 'admin' && (
              <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block tracking-widest text-left">Admin ID</label><input required placeholder="admin" className="w-full px-6 py-5 bg-slate-50 rounded-[2rem] font-bold border-2 border-slate-100 focus:border-red-600 outline-none transition-all" value={adminId} onChange={e => setAdminId(e.target.value)} /></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block tracking-widest text-left">Secret Key</label><input required type="password" placeholder="••••" className="w-full px-6 py-5 bg-slate-50 rounded-[2rem] font-bold border-2 border-slate-100 focus:border-red-600 outline-none transition-all" value={adminKey} onChange={e => setAdminKey(e.target.value)} /></div>
                <button type="submit" className="w-full py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl mt-6 bg-red-600 text-white active:scale-95 shadow-red-100 text-center">Unlock root access</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {!appMode ? (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
          <div className="mb-12 flex flex-col items-center relative text-center">
            <div className="relative mx-auto w-24 h-24 mb-6 text-center text-center">
              <div className="bg-blue-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-200 animate-in slide-in-from-top duration-700 text-center"><BookOpen className="text-white w-12 h-12" /></div>
              <button onClick={() => setShowNotifyModal(true)} className="absolute -top-3 -right-3 bg-rose-500 text-white w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-xl animate-bounce">
                <Bell size={18} fill="currentColor" />
                {notifications.length > 0 && <span className="absolute -top-1 -right-1 bg-white text-rose-600 w-4 h-4 rounded-full text-[8px] font-black border border-rose-100">{notifications.length}</span>}
              </button>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-3">BookShare</h1>
            <div className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">@{profile?.name} {isAdminAuth && "(ROOT)"}</div>
            <button onClick={() => setShowLogoutConfirm(true)} className="text-red-400 hover:text-red-500 font-black uppercase text-[10px] flex items-center gap-2 mt-4 transition-colors text-center text-center"><LogOut size={14} /> Logout</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl text-center">
            <button onClick={() => {setAppMode('sharing'); setCurrentTab('explore');}} className="group bg-white p-8 rounded-[3rem] shadow-xl border flex flex-col items-center transition-all hover:border-blue-200 hover:-translate-y-2"><Users size={40} className="mb-4 text-blue-600" /><h2 className="text-2xl font-black text-center text-center">Sharing Hub</h2></button>
            <button onClick={() => {setAppMode('donation'); setCurrentTab('explore');}} className="group bg-white p-8 rounded-[3rem] shadow-xl border flex flex-col items-center transition-all hover:border-rose-200 hover:-translate-y-2"><Heart size={40} className="mb-4 text-rose-600" /><h2 className="text-2xl font-black text-center text-center">Donation Hub</h2></button>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-4 text-center">
            <button onClick={() => setShowCommunityBoard(true)} className="flex items-center gap-3 bg-blue-50/50 px-6 py-3 rounded-full hover:bg-blue-100 transition-all border border-blue-100 group shadow-sm text-center"><Megaphone size={18} className="text-blue-600 group-hover:rotate-12 transition-transform"/><span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Community Board</span></button>
            <button onClick={() => setIsReportingIssue(true)} className="flex items-center gap-3 bg-white px-6 py-3 rounded-full border-2 hover:bg-slate-50 transition-all active:scale-95 group shadow-sm text-center"><Headset size={18} className="text-slate-500 group-hover:text-blue-600 transition-colors"/><span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-800 text-center">Admin Support</span></button>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500 text-center">
          <header className={`bg-white sticky top-0 z-40 p-4 border-b flex justify-between items-center ${isAdminAuth ? 'border-red-100 border-b-2' : ''}`}>
            <div className="flex items-center gap-4 text-left text-left text-left"><button onClick={() => setAppMode(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-left text-left text-left text-left text-left"><ChevronLeft size={24}/></button><div><h1 className="text-lg font-black uppercase tracking-tight text-left text-left text-left text-left text-left">{appMode} Hub</h1><div className="text-[9px] font-black uppercase text-slate-400 text-left text-left text-left text-left text-left">{currentTab === 'explore' ? 'Student Library' : 'My Activity'}</div></div></div>
            <div className="flex items-center gap-2 text-left text-left text-left text-left text-left">
              <button onClick={() => setShowNotifyModal(true)} className="p-3 bg-rose-50 rounded-2xl text-rose-600 hover:bg-rose-100 transition-colors shadow-sm"><Bell size={20}/></button>
              <button onClick={() => setIsAddingBook(true)} className={`${appMode === 'sharing' ? 'bg-blue-600' : 'bg-rose-600'} text-white h-12 px-5 rounded-2xl flex items-center gap-2 shadow-xl active:scale-90 transition-all text-center text-center text-center text-center text-center text-center`}><Plus size={20}/><span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Add Book</span></button>
            </div>
          </header>
          
          {currentTab === 'explore' && (
            <div className="max-w-5xl mx-auto p-4 space-y-4 animate-in slide-in-from-top duration-300 text-center text-center text-center">
              <div className="relative text-center text-center text-center text-center text-center"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input placeholder="Search library..." className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl font-bold focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none text-left text-left text-left text-left" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
              
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 text-center text-center text-center text-center text-center">
                {['All', ...CATEGORIES].map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase border whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500'}`}>{cat}</button>)}
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 border-t pt-4 text-center text-center text-center text-center text-center">
                <div className="flex items-center gap-2 px-3 text-slate-400 text-center text-center text-center text-center text-center"><Filter size={14}/> <span className="text-[9px] font-black uppercase tracking-tighter text-center">Class:</span></div>
                {['All', ...CLASSES].map(cl => <button key={cl} onClick={() => setSelectedClassFilter(cl)} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase border whitespace-nowrap transition-all ${selectedClassFilter === cl ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100'}`}>{cl}</button>)}
              </div>
            </div>
          )}

          <main className="max-w-5xl mx-auto p-4 pb-24 text-center text-center">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500 text-center text-center text-center text-center text-center">
              {filteredBooksList.map(book => (
                <div key={book.id} onClick={() => setSelectedBook(book)} className="bg-white rounded-[2.5rem] overflow-hidden border shadow-sm cursor-pointer relative group transition-all hover:shadow-xl hover:-translate-y-1 text-center text-center text-center text-center text-center">
                  <div className="aspect-[4/5] bg-slate-100 overflow-hidden relative text-center text-center text-center text-center text-center">
                    {book.imageUrl ? <img src={book.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-[10px] text-center text-center text-center text-center">NO COVER</div>}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-black shadow-sm text-slate-900 uppercase text-center text-center text-center text-center text-center">CL: {String(book.bookClass)}</div>
                    {book.waitlist?.length > 0 && <div className="absolute bottom-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-lg text-[8px] font-black shadow-lg text-center text-center text-center text-center">WAIT: {book.waitlist.length}</div>}
                    {book.handoverStatus === 'confirming_receipt' && <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-[2px] flex items-center justify-center"><div className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-[8px] font-black animate-pulse uppercase">Handover Process</div></div>}
                  </div>
                  <div className="p-4 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><h3 className="font-black text-sm truncate text-left text-left text-left text-left text-left">{String(book.title)}</h3><div className="text-[9px] text-slate-400 font-bold mt-2 uppercase text-left text-left text-left text-left text-left">{String(book.ownerClass)} Holder • {calculateDaysDiff(book.since)}d held</div><div className="w-full h-1 bg-slate-100 mt-3 rounded-full overflow-hidden text-left text-left text-left text-left text-left text-left text-left"><div className="bg-emerald-500 h-full transition-all duration-1000 text-left text-left text-left text-left text-left text-left text-left" style={{ width: `${Math.min((book.readingProgress?.pagesRead || 0) / 2, 100)}%` }}></div></div></div>
                </div>
              ))}
              {filteredBooksList.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase text-xs italic tracking-widest text-center text-center text-center text-center">No results found</div>}
            </div>
          </main>

          <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t p-4 flex justify-around shadow-2xl z-40 text-center text-center text-center text-center text-center text-center text-center text-center">
            <button onClick={() => setCurrentTab('explore')} className={`flex flex-col items-center gap-1 active:scale-90 transition-all ${currentTab === 'explore' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}><LayoutGrid/><span className="text-[8px] font-black uppercase text-center text-center text-center text-center">Library</span></button>
            {isAdminAuth ? <button onClick={() => setCurrentTab('inbox')} className={`flex flex-col items-center gap-1 active:scale-90 transition-all ${currentTab === 'inbox' ? 'text-red-600 scale-110' : 'text-slate-300'}`}><Inbox/><span className="text-[8px] font-black uppercase tracking-widest text-center text-center text-center text-center text-center">Admin</span></button> : <button onClick={() => setCurrentTab('activity')} className={`flex flex-col items-center gap-1 active:scale-90 transition-all ${currentTab === 'activity' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}><Bookmark/><span className="text-[8px] font-black uppercase text-center text-center text-center text-center text-center text-center">Activity</span></button>}
          </nav>
        </div>
      )}

      {/* --- ALL OVERLAYS --- */}

      {/* MODAL: BOOK DETAILS (FIXED: isUpdatingProgress check) */}
      {selectedBook && !showDeleteConfirm && !isUpdatingProgress && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className={`bg-white w-full max-w-lg rounded-t-[3.5rem] sm:rounded-[3.5rem] overflow-hidden animate-in slide-in-from-bottom duration-500 my-auto shadow-2xl ${isAdminAuth ? 'border-4 border-red-100' : ''} text-left text-left text-left text-left text-left text-left text-left text-left`}>
            <div className="h-64 relative bg-slate-200 text-left text-left text-left text-left text-left text-left text-left text-left">
              {selectedBook.imageUrl ? <img src={selectedBook.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black uppercase text-xs text-center text-center text-center text-center text-center text-center">No Cover</div>}
              <div className="absolute top-6 right-6 flex gap-2 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                {user && selectedBook.ownerId === user.uid && (selectedBook.history?.length === 1 || !selectedBook.history) && (
                  <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all text-center text-center text-center text-center text-center text-center text-center text-center text-center"><Trash2 size={20} /></button>
                )}
                <button onClick={() => setSelectedBook(null)} className="bg-black/20 backdrop-blur-md text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center"><X size={20} /></button>
              </div>
            </div>
            <div className="p-8 bg-white max-h-[90dvh] overflow-y-auto no-scrollbar text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
              <h2 className="text-2xl font-black mb-1 text-left text-left text-left text-left text-left text-left text-left text-left text-left">{String(selectedBook.title)}</h2>
              <div className="text-slate-400 font-bold text-xs mb-8 uppercase tracking-widest text-left flex items-center gap-2 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><div className="w-4 h-0.5 bg-slate-200 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"></div> by {String(selectedBook.author)}</div>
              
              <div className="bg-slate-50 p-6 rounded-[3rem] border border-slate-100 flex items-center gap-4 shadow-sm text-left mb-8 relative text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                 <div className={`p-3 rounded-2xl ${isAdminAuth ? 'bg-red-100 text-red-600' : 'bg-white text-blue-600 shadow-sm'} text-left text-left text-left text-left text-left text-left text-left text-left text-left`}><Phone size={20}/></div>
                 <div className="text-left text-sm font-black tracking-widest text-slate-800 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                    {(isAdminAuth || !selectedBook.isPrivate || selectedBook.ownerId === user.uid) ? (
                      <>{String(selectedBook.contact)}{selectedBook.isPrivate && <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[8px] uppercase font-black ml-2 animate-pulse text-left text-left text-left text-left text-left text-left text-left text-left text-left">God Mode</span>}</>
                    ) : (
                      <span className="italic flex items-center gap-2 text-slate-400 font-bold text-left text-left text-left text-left text-left text-left text-left text-left text-left"><EyeOff size={14}/> Hidden Number</span>
                    )}
                 </div>
              </div>

              {/* HANDOVER CONFIRMATION */}
              {selectedBook.handoverStatus === 'confirming_receipt' && selectedBook.pendingRequesterId === user.uid && (
                <div className="mb-8 p-6 bg-blue-600 rounded-[2.5rem] shadow-xl text-center text-white animate-in zoom-in-95 text-center text-center text-center text-center text-center">
                  <Sparkles className="mx-auto mb-3 text-center text-center text-center text-center" size={32}/>
                  <h3 className="text-lg font-black uppercase tracking-tight text-center text-center text-center text-center">Confirm Transfer?</h3>
                  <p className="text-[10px] font-bold opacity-80 mb-6 text-center text-center text-center text-center">Owner has approved your request. Confirm if you have it.</p>
                  <button onClick={handleConfirmReceipt} className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all text-center text-center text-center text-center">I have the Book</button>
                </div>
              )}

              {/* BORROW FORM UI */}
              {user.uid !== selectedBook.ownerId && !selectedBook.waitlist?.some(r => r.uid === user.uid) && selectedBook.handoverStatus === 'available' && (
                 <form onSubmit={handleRequestBorrow} className="space-y-4 mb-8 bg-blue-50 p-6 rounded-[2.5rem] border border-blue-100 text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                    <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-2 text-left text-left text-left text-left text-left text-left text-left">Interested? Send Borrow Request</p>
                    <textarea required placeholder="Message for owner..." className="w-full p-4 bg-white border rounded-2xl text-sm outline-none focus:ring-2 ring-blue-200 resize-none text-left text-left text-left text-left text-left text-left text-left text-left text-left" value={borrowMsg} onChange={e => setBorrowMsg(e.target.value)} />
                    <input required type="tel" maxLength={10} placeholder="Confirm your 10-digit mobile" className="w-full p-4 bg-white border rounded-2xl text-sm outline-none focus:ring-2 ring-blue-200 text-left text-left text-left text-left text-left text-left text-left text-left text-left" value={borrowMobile} onChange={e => handleNumericInput(e.target.value, setBorrowMobile, 10)} />
                    <button type="submit" disabled={isPublishing || borrowMobile.length !== 10} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 text-center text-center text-center text-center text-center text-center text-center">
                       {isPublishing ? <Loader2 className="animate-spin" size={16}/> : <><Send size={16}/> Send Borrow Request</>}
                    </button>
                 </form>
              )}

              {/* REPLY SECTION FOR BORROWER */}
              {selectedBook.waitlist?.filter(r => r.uid === user.uid).map((myReq, idx) => (
                <div key={idx} className="mb-8 space-y-4 text-left text-left text-left text-left text-left">
                  {myReq.ownerReply && (
                    <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-[2rem] shadow-sm text-left animate-in slide-in-from-right text-left text-left text-left text-left text-left text-left text-left">
                      <div className="flex items-center gap-2 mb-2 text-left text-left text-left text-left text-left text-left text-left text-left text-left"><Reply size={16} className="text-emerald-600"/><p className="text-[10px] font-black uppercase text-emerald-600 text-left text-left text-left text-left text-left">Owner's Response</p></div>
                      <p className="text-sm font-black text-emerald-900 text-left text-left text-left text-left text-left text-left text-left text-left">"{String(myReq.ownerReply)}"</p>
                    </div>
                  )}
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4 mb-8 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 text-left shadow-sm text-left text-left text-left text-left text-left text-left text-left text-left text-left"><div className="text-[8px] font-black uppercase text-slate-400 mb-1 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">For Class</div><div className="font-black text-sm flex items-center gap-2 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><GraduationCap size={16} className="text-blue-600" /> {String(selectedBook.bookClass)}</div></div>
                <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 text-left shadow-sm text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><div className="text-[8px] font-black uppercase text-slate-400 mb-1 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">Since</div><div className="font-black text-sm flex items-center gap-2 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><Clock size={16} className="text-emerald-600" /> {calculateDaysDiff(selectedBook.since)} Days</div></div>
              </div>

              {/* BOOK HISTORY */}
              <div className="mb-8 p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] shadow-sm text-left text-left text-left text-left text-left text-left text-left">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-4 flex items-center gap-2 text-left text-left text-left text-left text-left"><History size={16}/> Owner History</p>
                <div className="space-y-4 text-left text-left text-left text-left text-left text-left text-left text-left">
                   {selectedBook.history?.map((h, i) => (
                     <div key={i} className="flex items-start gap-3 relative text-left text-left text-left text-left text-left text-left text-left">
                        {i < selectedBook.history.length - 1 && <div className="absolute left-2.5 top-5 w-0.5 h-full bg-slate-200"></div>}
                        <div className={`w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0 mt-1 ${i === selectedBook.history.length - 1 ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`}></div>
                        <div className="text-left text-left text-left text-left text-left">
                           <div className="text-[11px] font-black">@{String(h.owner)}</div>
                           <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{String(h.action)} on {safeDate(h.startDate)}</div>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              {/* OWNER APPROVAL HUB */}
              {(user.uid === selectedBook.ownerId || isAdminAuth) && selectedBook.waitlist?.length > 0 && selectedBook.handoverStatus === 'available' && (
                <div className={`mt-8 space-y-4 border-2 p-6 rounded-[2.5rem] shadow-sm text-left ${isAdminAuth ? 'bg-red-50/20 border-red-100' : 'bg-blue-50/20 border-blue-100'}`}>
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-4 flex items-center gap-2 text-left text-left text-left text-left text-left text-left text-left text-left"><Users size={16}/> Requests ({selectedBook.waitlist.length})</p>
                   {selectedBook.waitlist.map((req, i) => (
                     <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mb-4 text-left text-left text-left text-left text-left text-left text-left">
                        <div className="flex justify-between items-start mb-3 text-left text-left text-left text-left text-left text-left text-left">
                           <div className="text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><div className="text-sm font-black text-left text-left text-left text-left text-left text-left text-left">@{String(req.name)} (Cl: {String(req.studentClass)})</div><div className="text-[8px] font-bold text-slate-400 uppercase mt-1 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">Mobile: {String(req.contact)}</div></div>
                           <button onClick={() => handleApproveFromWaitlist(req)} className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase shadow-lg transition-all active:scale-95 text-center text-center text-center text-center text-center text-center text-center text-center text-center">Approve</button>
                        </div>
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-2xl italic border text-left text-left text-left text-left text-left text-left text-left text-left">"{String(req.message)}"</p>
                        <div className="mt-4 pt-4 border-t border-slate-50 text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                          {req.ownerReply ? (
                            <div className="bg-emerald-50 p-3 rounded-2xl flex items-center gap-2 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                               <CheckCircle2 size={14} className="text-emerald-600"/>
                               <p className="text-[10px] font-bold text-emerald-800 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">Sent: {String(req.ownerReply)}</p>
                               <button onClick={() => setReplyInput({ reqUid: req.uid, text: req.ownerReply })} className="text-[8px] font-black uppercase text-blue-600 ml-auto text-left text-left text-left text-left">Edit</button>
                            </div>
                          ) : (
                            <div className="flex gap-2 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                               <input placeholder="Coordination reply..." className="flex-1 bg-slate-100 border-none text-[11px] font-bold px-4 py-2.5 rounded-xl outline-none" value={replyInput.reqUid === req.uid ? replyInput.text : ''} onChange={(e) => setReplyInput({ reqUid: req.uid, text: e.target.value })} />
                               <button onClick={() => handleOwnerReply(req.uid)} className="bg-slate-900 text-white p-2.5 rounded-xl active:scale-90 transition-all text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center"><Send size={14}/></button>
                            </div>
                          )}
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 text-center text-left text-left text-left text-left text-left text-left text-left">
          <div className="bg-white w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl animate-in zoom-in-95 text-left text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center">
            <div className="bg-red-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-red-600 shadow-xl text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center"><Trash2 size={48} /></div>
            <h2 className="text-3xl font-black mb-3 text-center text-center text-center text-center text-center text-center text-center text-center text-center tracking-tight text-center text-center text-center text-center text-center text-center">Delete Listing?</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-10 text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center">Listing hamesha ke liye remove ho jayegi.</p>
            <div className="flex gap-4 mt-8 text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 font-black text-slate-400 text-xs text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center uppercase tracking-widest text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center">Stay</button>
              <button onClick={handleDeleteBook} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 shadow-red-100 transition-all text-left text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 text-center text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
          <div className="bg-white w-full max-sm:w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl animate-in zoom-in-95 text-left text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center">
            <div className="bg-red-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-red-600 shadow-xl text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center"><LogOut size={48} /></div>
            <h2 className="text-3xl font-black mb-3 text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center tracking-tight text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center">Logout?</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-10 text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center">Aap is device se sign out ho jayenge.</p>
            <div className="flex gap-4 mt-8 text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 font-black text-slate-400 text-xs text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center uppercase tracking-widest text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center">Stay</button>
              <button onClick={handleLogout} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-center text-center text-center text-center text-center text-center">Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD BOOK */}
      {isAddingBook && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
          <form onSubmit={handleAddBook} className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl max-h-[90dvh] overflow-y-auto no-scrollbar animate-in duration-300 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
            <div className="flex justify-between items-center mb-8 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><h2 className="text-2xl font-black tracking-tight text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">List a Book</h2><button type="button" onClick={() => setIsAddingBook(false)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center"><X size={20}/></button></div>
            <div className="space-y-5 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
              <div onClick={() => !isLoading && fileInputRef.current.click()} className="aspect-video bg-slate-50 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-blue-200 transition-all relative text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                {(isLoading || isPublishing) && <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 font-black uppercase text-[10px] animate-pulse text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center">Processing...</div>}
                {bookImageUrl ? <img src={bookImageUrl} className="w-full h-full object-cover text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center" /> : <><Camera size={48} className="text-slate-200 mb-2 group-hover:text-blue-300 transition-colors text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center" /><div className="text-[10px] font-black uppercase tracking-widest text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center">Add Photo</div></>}<input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
              </div>
              <input required placeholder="Book Title" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-600 transition-all shadow-sm text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left shadow-inner text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left" value={newBookTitle} onChange={e => setNewBookTitle(e.target.value)} />
              <input placeholder="Author Name" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-600 transition-all shadow-sm text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left shadow-inner text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left" value={newBookAuthor} onChange={e => setNewBookAuthor(e.target.value)} />
              
              <div className="grid grid-cols-2 gap-3 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                 <div className="text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><label className="text-[8px] font-black uppercase text-slate-400 ml-2 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">Category</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase text-[10px] outline-none shadow-sm shadow-inner text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left" value={newBookCategory} onChange={e => setNewBookCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                 <div className="text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><label className="text-[8px] font-black uppercase text-slate-400 ml-2 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">Book Class</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase text-[10px] outline-none shadow-sm shadow-inner text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left" value={newBookClass} onChange={e => setNewBookClass(e.target.value)}>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>

              <textarea placeholder="Advice or condition..." className="w-full h-32 p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-sm outline-none focus:border-blue-600 resize-none transition-all shadow-sm text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left shadow-inner text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left" value={newBookRemark} onChange={e => setNewBookRemark(e.target.value)} />
              <button type="submit" disabled={isLoading || isPublishing} className={`w-full py-5 rounded-[2rem] font-black uppercase text-xs text-white shadow-2xl active:scale-95 transition-all text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center ${appMode === 'sharing' ? 'bg-blue-600 shadow-blue-100' : 'bg-rose-600 shadow-rose-100'} disabled:opacity-50 text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center text-center`}>{isPublishing ? "Publishing..." : "List in Library"}</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}