/**
 * 📚 BookShare Pro - Ultimate Stable Version
 * Updates:
 * - Fixed: 'bookImageUrl' and 'notifications' state definition errors.
 * - Fixed: Icon ReferenceErrors (Heart, Loader2, etc.).
 * - Fixed: Scope errors for 'handleLogout'.
 * - Performance: useMemo optimization for smooth book browsing.
 * - Privacy: Hide mobile numbers from others while keeping them visible to Admin.
 * - Security: MPIN based Login & Registration.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
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
  UserPlus, KeyRound, Heart, Loader2, AlertTriangle, Sparkles, Quote
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
const appId = 'book-exchange-2025-v1'; 

const CATEGORIES = ["Maths", "Biology", "Commerce", "Arts", "Science", "Competition related", "Other"];
const CLASSES = ["6th", "7th", "8th", "9th", "10th", "11th", "12th", "College", "Other"];

// --- PERFORMANCE HELPERS ---
const compressImage = (base64Str, maxWidth = 800, quality = 0.7) => {
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
  });
};

const safeFormatDate = (dateStr) => {
  if (!dateStr) return 'Recently';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString('en-IN');
};

const getShortId = (uid) => uid ? uid.slice(-4).toUpperCase() : "0000";

const calculateDaysDiff = (dateStr) => {
  if (!dateStr) return 0;
  const start = new Date(dateStr);
  const diffTime = Math.abs(new Date() - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function App() {
  // --- STATE DEFINITIONS (Ensured all exist) ---
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); 
  const [appMode, setAppMode] = useState(null); 
  const [currentTab, setCurrentTab] = useState('explore'); 
  const [books, setBooks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Auth States
  const [authView, setAuthView] = useState('login'); 
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showMpin, setShowMpin] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form Field States
  const [tempName, setTempName] = useState(''); 
  const [tempClass, setTempClass] = useState('10th');
  const [tempMobile, setTempMobile] = useState('');
  const [tempMpin, setTempMpin] = useState('');
  const [tempIsPrivate, setTempIsPrivate] = useState(false);
  const [loginMobile, setLoginMobile] = useState('');
  const [loginMpin, setLoginMpin] = useState('');
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookCategory, setNewBookCategory] = useState('Maths');
  const [newBookRemark, setNewBookRemark] = useState(''); 
  const [bookImageUrl, setBookImageUrl] = useState('');
  const [borrowMsg, setBorrowMsg] = useState('');
  const [borrowMobile, setBorrowMobile] = useState(''); 
  const [newPagesRead, setNewPagesRead] = useState('');
  const [reportText, setReportText] = useState('');
  const [suggestType, setSuggestType] = useState('demand'); 
  const [suggestMsg, setSuggestMsg] = useState('');

  // UI Control States
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [showCommunityBoard, setShowCommunityBoard] = useState(false);
  const [isAddingSuggestion, setIsAddingSuggestion] = useState(false);
  const [isRequestingTransfer, setIsRequestingTransfer] = useState(false);
  const [isAdminModeModal, setIsAdminModeModal] = useState(false);
  const [isSettingName, setIsSettingName] = useState(false);
  const [adminPassAttempt, setAdminPassAttempt] = useState('');
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fileInputRef = useRef(null);

  // 1. Auth Init & Profile Handling
  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (e) { console.error(e); }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, async (u) => { 
      if (u) {
        setUser(u);
        const snap = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data'));
        if (snap.exists()) {
          setProfile(snap.data());
          setIsAuthModalOpen(false);
        } else if (!isAdminAuth) {
          setIsAuthModalOpen(true);
        }
      } else {
        setUser(null);
        setIsAuthModalOpen(true);
      }
    });
    return () => unsub();
  }, [isAdminAuth]);

  // 2. Real-time Listeners
  useEffect(() => {
    if (!user) return;
    const unsubBooks = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'books'), (s) => 
      setBooks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSuggest = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), (s) => 
      setSuggestions(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))));
    const unsubSupport = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'support'), (s) => 
      setSupportMessages(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))));
    const unsubNotify = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), (s) => 
      setNotifications(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))));
    return () => { unsubBooks(); unsubSuggest(); unsubSupport(); unsubNotify(); };
  }, [user]);

  // 3. Optimized Filter Logic
  const filteredBooks = useMemo(() => {
    let list = books;
    if (appMode) list = list.filter(b => b.type === appMode);
    if (currentTab === 'activity' && user) {
      list = list.filter(b => b.ownerId === user.uid || (b.waitlist && b.waitlist.some(r => r.uid === user.uid)) || b.pendingRequesterId === user.uid);
    }
    if (selectedCategory !== 'All') list = list.filter(b => b.category === selectedCategory);
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      list = list.filter(b => b.title?.toLowerCase().includes(t) || b.author?.toLowerCase().includes(t));
    }
    return [...list].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [books, appMode, currentTab, selectedCategory, searchTerm, user]);

  // --- HANDLERS ---

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setProfile(null); setAppMode(null); setIsAdminAuth(false);
      setCurrentTab('explore'); setShowLogoutConfirm(false); setIsAuthModalOpen(true);
    } catch (e) { console.error(e); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!tempName.trim() || tempMobile.length !== 10 || tempMpin.length !== 4) {
      setAuthError('Please enter valid 10-digit Mobile & 4-digit PIN');
      return;
    }
    try {
      setIsLoading(true);
      const registryRef = doc(db, 'artifacts', appId, 'public', 'data', 'mobile_registry', tempMobile);
      const check = await getDoc(registryRef);
      if (check.exists()) { setAuthError('Mobile registered already. Please Login.'); setIsLoading(false); return; }
      const profileData = { name: tempName.trim(), studentClass: tempClass, mobile: tempMobile, mpin: tempMpin, isPrivate: tempIsPrivate, shortId: getShortId(user.uid) };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), profileData);
      await setDoc(registryRef, { uid: user.uid, mpin: tempMpin });
      setProfile(profileData); setIsAuthModalOpen(false);
    } catch (err) { setAuthError('Registration Error.'); } finally { setIsLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      setIsLoading(true);
      const registrySnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'mobile_registry', loginMobile));
      if (!registrySnap.exists()) { setAuthError('Mobile number not found.'); return; }
      const { uid, mpin } = registrySnap.data();
      if (mpin !== loginMpin) { setAuthError('Wrong MPIN!'); return; }
      const pSnap = await getDoc(doc(db, 'artifacts', appId, 'users', uid, 'profile', 'data'));
      if (pSnap.exists()) { setProfile(pSnap.data()); setIsAuthModalOpen(false); }
    } catch (err) { setAuthError('Login failure.'); } finally { setIsLoading(false); }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result);
      setBookImageUrl(compressed);
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBookTitle || !user) return;
    try {
      const today = new Date().toISOString();
      const nameTag = `${profile?.name || 'Admin'}#${getShortId(user.uid)}`;
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'books'), {
        type: appMode, title: newBookTitle, author: newBookAuthor, category: newBookCategory,
        remark: newBookRemark, imageUrl: bookImageUrl, currentOwner: nameTag, 
        ownerClass: profile?.studentClass || 'Staff', ownerId: user.uid, contact: profile?.mobile || '9999999999', 
        isPrivate: profile?.isPrivate || false, since: today, transferPending: false, handoverStatus: 'available',
        waitlist: [], readingProgress: { started: false, pagesRead: 0, lastUpdated: today },
        history: [{ owner: profile?.name, startDate: today, action: 'Listed' }],
        createdAt: serverTimestamp()
      });
      setIsAddingBook(false); setNewBookTitle(''); setBookImageUrl('');
    } catch (err) { console.error(err); }
  };

  const handleRequestWaitlist = async (e) => {
    e.preventDefault();
    if (borrowMobile.length !== 10) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), {
        waitlist: arrayUnion({ uid: user.uid, name: profile?.name || 'User', studentClass: profile?.studentClass || 'N/A', contact: borrowMobile, isPrivate: profile?.isPrivate || false, message: borrowMsg, timestamp: new Date().toISOString() })
      });
      setIsRequestingTransfer(false); setSelectedBook(null);
    } catch (e) { console.error(e); }
  };

  const handleApproveFromWaitlist = async (reqUser) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { 
        handoverStatus: 'confirming_receipt', pendingRequesterId: reqUser.uid, pendingOwner: reqUser.name, pendingOwnerClass: reqUser.studentClass, pendingContact: reqUser.contact, isPrivate: reqUser.isPrivate, waitlist: arrayRemove(reqUser) 
      });
      setSelectedBook(null);
    } catch (e) { console.error(e); }
  };

  const handleConfirmReceipt = async () => {
    try {
      const today = new Date().toISOString();
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { 
        currentOwner: selectedBook.pendingOwner, ownerClass: selectedBook.pendingOwnerClass, ownerId: selectedBook.pendingRequesterId, contact: selectedBook.pendingContact, isPrivate: selectedBook.isPrivate, since: today, handoverStatus: 'available', pendingRequesterId: null, pendingOwner: null,
        "readingProgress.started": false, "readingProgress.pagesRead": 0, "readingProgress.lastUpdated": today
      });
      setSelectedBook(null);
    } catch (e) { console.error(e); }
  };

  const handleNumericInput = (value, setter, limit) => {
    setter(value.replace(/\D/g, '').slice(0, limit));
  };

  const handleAdminVerify = (e) => {
    e.preventDefault();
    if (adminPassAttempt === 'admin123') {
      setIsAdminAuth(true); setIsAdminModeModal(false);
      if (!profile) setProfile({ name: "System Admin", studentClass: "Staff", mobile: "9999999999", isPrivate: false, shortId: "ROOT" });
      setIsAuthModalOpen(false);
    } else setAdminPassAttempt('');
  };

  const handleExportCSV = () => {
    if (books.length === 0) return;
    const headers = ["Title", "Author", "Category", "Current Holder", "Contact"];
    const rows = books.map(b => [`"${b.title}"`, `"${b.author}"`, `"${b.category}"`, `"${b.currentOwner}"`, `'${b.contact}`]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "Library_Report.csv");
    document.body.appendChild(link); link.click();
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    if (!selectedBook) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { "readingProgress.started": true, "readingProgress.pagesRead": Number(newPagesRead), "readingProgress.lastUpdated": new Date().toISOString() });
      setIsUpdatingProgress(false); setSelectedBook(null);
    } catch (e) { console.error(e); }
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'support'), {
        message: reportText, senderName: profile?.name || 'User',
        senderClass: profile?.studentClass || 'Unknown', senderMobile: profile?.mobile || '9999999999',
        senderUid: user.uid, createdAt: serverTimestamp()
      });
      setReportText(''); setIsReportingIssue(false);
      alert("Sent Successfully!");
    } catch (e) { console.error(e); }
  };

  const handleAddSuggestion = async (e) => {
    e.preventDefault();
    if (!suggestMsg.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), {
        type: suggestType, message: suggestMsg, 
        userName: profile?.name || 'User', userClass: profile?.studentClass || 'Staff', createdAt: serverTimestamp()
      });
      setSuggestMsg(''); setIsAddingSuggestion(false);
    } catch (err) { console.error(err); }
  };

  const handleDeleteBook = async () => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id)); setSelectedBook(null); setShowDeleteConfirm(false); } catch (e) { console.error(e); }
  };

  // --- UI RENDER ---

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 selection:bg-blue-100 overflow-x-hidden">
      
      {/* AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-white z-[300] flex items-center justify-center p-6 overflow-y-auto">
          <div className="max-w-sm w-full py-10 text-center animate-in zoom-in-95 duration-500">
            <div className="bg-blue-600 w-24 h-24 rounded-[3rem] flex items-center justify-center mx-auto mb-6 shadow-2xl relative">
               <BookOpen className="text-white w-12 h-12" />
               <div className="absolute -bottom-1 -right-1 bg-white p-2 rounded-2xl shadow-lg">
                 {authView === 'login' ? <KeyRound className="text-blue-600 w-6 h-6"/> : <UserPlus className="text-blue-600 w-6 h-6"/>}
               </div>
            </div>
            <h1 className="text-4xl font-black mb-2 tracking-tighter">BookShare</h1>
            <div className="bg-slate-100 p-1.5 rounded-[2rem] flex mb-8">
               <button onClick={() => setAuthView('login')} className={`flex-1 py-4 rounded-[1.5rem] font-black uppercase text-[10px] ${authView === 'login' ? 'bg-white shadow-xl text-blue-600' : 'text-slate-400'}`}>Login</button>
               <button onClick={() => setAuthView('register')} className={`flex-1 py-4 rounded-[1.5rem] font-black uppercase text-[10px] ${authView === 'register' ? 'bg-white shadow-xl text-blue-600' : 'text-slate-400'}`}>Register</button>
            </div>
            {authError && <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black border border-rose-100 flex items-center gap-2 animate-bounce uppercase tracking-widest"><AlertTriangle size={14}/> {authError}</div>}
            
            {authView === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block tracking-widest">Mobile Number</label><input required type="tel" maxLength={10} className="w-full px-6 py-5 bg-slate-50 rounded-[2rem] font-bold border-2 border-slate-100 focus:border-blue-600 outline-none" value={loginMobile} onChange={e => handleNumericInput(e.target.value, setLoginMobile, 10)} /></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block tracking-widest">4-Digit PIN</label><div className="relative"><Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input required type={showMpin ? "text" : "password"} maxLength={4} className="w-full pl-14 pr-16 py-5 bg-slate-50 rounded-[2rem] font-black text-2xl border-2 border-slate-100 focus:border-blue-600 outline-none tracking-[0.5em]" value={loginMpin} onChange={e => handleNumericInput(e.target.value, setLoginMpin, 4)} /><button type="button" onClick={() => setShowMpin(!showMpin)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 p-2">{showMpin ? <EyeOff size={20}/> : <Eye size={20}/>}</button></div></div>
                <button type="submit" disabled={isLoading} className="w-full py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl mt-6 bg-blue-600 text-white active:scale-95 shadow-blue-100 transition-all flex items-center justify-center gap-3">{isLoading ? <Loader2 className="animate-spin"/> : "Access Account"}</button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Name" className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] font-bold border-2 border-slate-100" value={tempName} onChange={e => setTempName(e.target.value)} />
                  <select className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] font-bold border-2 border-slate-100" value={tempClass} onChange={e => setTempClass(e.target.value)}>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <input required type="tel" maxLength={10} placeholder="Mobile" className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] font-bold border-2 border-slate-100 focus:border-blue-600 outline-none" value={tempMobile} onChange={e => handleNumericInput(e.target.value, setTempMobile, 10)} />
                <input required type="password" maxLength={4} placeholder="Set 4-PIN" className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] font-black text-xl text-center tracking-[0.3em] border-2 border-slate-100 focus:border-blue-600 outline-none" value={tempMpin} onChange={e => handleNumericInput(e.target.value, setTempMpin, 4)} />
                <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100 flex items-center justify-between shadow-sm">
                   <div className="flex items-center gap-2"><ShieldCheck className="text-blue-600" size={18} /><span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Privacy Mode</span></div>
                   <button type="button" onClick={() => setTempIsPrivate(!tempIsPrivate)} className={`w-12 h-6 rounded-full relative transition-colors ${tempIsPrivate ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${tempIsPrivate ? 'right-1' : 'left-1'}`} /></button>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl mt-6 bg-slate-900 text-white active:scale-95 transition-all shadow-slate-200">{isLoading ? <Loader2 className="animate-spin"/> : "Register Student"}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MAIN DASHBOARD */}
      {!appMode ? (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-12 flex flex-col items-center">
            <div className="relative mx-auto w-24 h-24 mb-6"><div className="bg-blue-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-200 animate-in slide-in-from-top duration-700"><BookOpen className="text-white w-12 h-12" /></div></div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-3">BookShare</h1>
            <div className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">@{profile?.name} {isAdminAuth && "(ADMIN)"}</div>
            <button onClick={() => setShowLogoutConfirm(true)} className="text-red-400 hover:text-red-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 mt-4 transition-colors"><LogOut size={14} /> Switch Account</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl animate-in slide-in-from-bottom duration-700">
            <button onClick={() => {setAppMode('sharing'); setCurrentTab('explore');}} className="group bg-white p-8 rounded-[3rem] shadow-xl border flex flex-col items-center transition-all hover:border-blue-200 hover:-translate-y-2"><Users size={40} className="mb-4 text-blue-600 group-hover:scale-110 transition-transform" /><h2 className="text-2xl font-black">Sharing Hub</h2></button>
            <button onClick={() => {setAppMode('donation'); setCurrentTab('explore');}} className="group bg-white p-8 rounded-[3rem] shadow-xl border flex flex-col items-center transition-all hover:border-rose-200 hover:-translate-y-2"><Heart size={40} className="mb-4 text-rose-600 group-hover:scale-110 transition-transform" /><h2 className="text-2xl font-black">Donation Hub</h2></button>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <button onClick={() => setShowCommunityBoard(true)} className="flex items-center gap-3 bg-blue-50/50 px-6 py-3 rounded-full hover:bg-blue-100 transition-all border border-blue-100 group"><Megaphone size={18} className="text-blue-600 group-hover:rotate-12 transition-transform"/><span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Community Board</span></button>
            <button onClick={() => setIsReportingIssue(true)} className="flex items-center gap-3 bg-white px-6 py-3 rounded-full border-2 hover:bg-slate-50 transition-all active:scale-95 group"><Headset size={18} className="text-slate-500 group-hover:text-blue-600 transition-colors"/><span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-800">Admin Support</span></button>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <header className={`bg-white sticky top-0 z-40 p-4 border-b flex justify-between items-center ${isAdminAuth ? 'border-red-100' : ''}`}>
            <div className="flex items-center gap-4"><button onClick={() => setAppMode(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronLeft size={24}/></button><div><h1 className="text-lg font-black uppercase tracking-tight">{appMode} Hub</h1><div className="text-[9px] font-black uppercase text-slate-400">{currentTab === 'explore' ? 'Student Library' : 'My Activity'}</div></div></div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowCommunityBoard(true)} className="p-3 bg-slate-50 rounded-2xl text-slate-600 hover:bg-slate-100 transition-colors"><Megaphone size={20}/></button>
              <button onClick={() => setIsAddingBook(true)} className={`${appMode === 'sharing' ? 'bg-blue-600' : 'bg-rose-600'} text-white h-12 px-5 rounded-2xl flex items-center gap-2 shadow-xl active:scale-90 transition-all shadow-blue-100`}><Plus size={20}/><span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Add Book</span></button>
            </div>
          </header>
          
          {currentTab === 'explore' && (
            <div className="max-w-5xl mx-auto p-4 space-y-4 animate-in slide-in-from-top duration-300">
              <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input placeholder="Search books..." className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl font-bold focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">{['All', ...CATEGORIES].map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase border whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:border-blue-200'}`}>{cat}</button>)}</div>
            </div>
          )}

          <main className="max-w-5xl mx-auto p-4 pb-24">
            {currentTab === 'inbox' && isAdminAuth ? (
              <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                <div className="flex justify-between items-center bg-red-50 p-6 rounded-[2.5rem] border border-red-100 shadow-sm text-left"><div><h2 className="text-xl font-black text-red-900">Admin Support Inbox</h2><p className="text-[9px] font-bold text-red-600 uppercase tracking-widest">Complaints & Suggestions</p></div><button onClick={handleExportCSV} className="bg-red-600 text-white p-4 rounded-2xl shadow-xl active:scale-95 transition-all"><Download size={20}/></button></div>
                {supportMessages.map(msg => <div key={msg.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm text-left"><div className="text-sm font-black">@{msg.senderName} (Class {msg.senderClass})</div><p className="mt-4 text-slate-700 bg-slate-50 p-5 rounded-[2rem] italic leading-relaxed">"{msg.message}"</p></div>)}
                {supportMessages.length === 0 && <div className="text-center py-20 text-slate-300 font-black uppercase text-xs italic">Inbox is clear</div>}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
                {filteredBooks.map(book => (
                  <div key={book.id} onClick={() => setSelectedBook(book)} className="bg-white rounded-[2.5rem] overflow-hidden border shadow-sm cursor-pointer relative group transition-all hover:shadow-xl hover:-translate-y-1">
                    <div className="aspect-[4/5] bg-slate-100 overflow-hidden relative">
                      {book.imageUrl ? <img src={book.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><BookOpen size={40}/></div>}
                      {book.waitlist?.length > 0 && <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-lg text-[8px] font-black shadow-lg">WAIT: {book.waitlist.length}</div>}
                    </div>
                    <div className="p-4 text-left"><h3 className="font-black text-sm truncate">{book.title}</h3><div className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-widest">{book.ownerClass} • {calculateDaysDiff(book.since)} days</div><div className="w-full h-1 bg-slate-100 mt-3 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${Math.min((book.readingProgress?.pagesRead || 0) / 2, 100)}%` }}></div></div></div>
                  </div>
                ))}
                {filteredBooks.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase text-xs italic">No books matching filters</div>}
              </div>
            )}
          </main>

          <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t p-4 flex justify-around shadow-2xl z-40">
            <button onClick={() => setCurrentTab('explore')} className={`flex flex-col items-center gap-1 active:scale-90 transition-all ${currentTab === 'explore' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}><LayoutGrid/><span className="text-[8px] font-black uppercase">Library</span></button>
            {isAdminAuth ? <button onClick={() => setCurrentTab('inbox')} className={`flex flex-col items-center gap-1 active:scale-90 transition-all ${currentTab === 'inbox' ? 'text-red-600 scale-110' : 'text-slate-300'}`}><Inbox/><span className="text-[8px] font-black uppercase">Reports</span></button> : <button onClick={() => setCurrentTab('activity')} className={`flex flex-col items-center gap-1 active:scale-90 transition-all ${currentTab === 'activity' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}><Bookmark/><span className="text-[8px] font-black uppercase">My Books</span></button>}
          </nav>
        </div>
      )}

      {/* --- MODALS --- */}
      {isReportingIssue && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[130] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 text-left">
             <div className="flex justify-between items-center mb-8"><div className="flex items-center gap-4 text-left"><div className="bg-blue-600 p-4 rounded-3xl text-white shadow-xl shadow-blue-100"><Headset size={28} /></div><div className="text-left"><h2 className="text-2xl font-black">Admin Support</h2><p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Secure Student Helpdesk</p></div></div><button onClick={() => setIsReportingIssue(false)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"><X size={20}/></button></div>
             <form onSubmit={handleSendReport} className="space-y-6 text-left"><textarea required placeholder="Apni dikkat ya suggestion batayein..." className="w-full h-48 p-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-bold text-sm outline-none focus:border-blue-600 transition-all shadow-inner resize-none text-left" value={reportText} onChange={e => setReportText(e.target.value)} /><button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"><Send size={18}/> Send to Admin</button></form>
          </div>
        </div>
      )}

      {selectedBook && !isRequestingTransfer && !isUpdatingProgress && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto text-left">
          <div className={`bg-white w-full max-w-lg rounded-t-[3.5rem] sm:rounded-[3.5rem] overflow-hidden animate-in slide-in-from-bottom duration-500 my-auto shadow-2xl ${isAdminAuth ? 'border-4 border-red-100' : ''} text-left`}>
            <div className="h-64 relative bg-slate-200 text-left">
              {selectedBook.imageUrl ? <img src={selectedBook.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black uppercase text-xs">No Cover</div>}
              <div className="absolute top-6 right-6 flex gap-2">{(isAdminAuth || (selectedBook.ownerId === user.uid && selectedBook.history.length === 1)) && <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"><Trash2 size={20} /></button>}<button onClick={() => setSelectedBook(null)} className="bg-black/20 backdrop-blur-md text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><X size={20} /></button></div>
            </div>
            <div className="p-8 bg-white max-h-[90dvh] sm:max-h-[70vh] overflow-y-auto no-scrollbar text-left">
              <h2 className="text-2xl font-black mb-1 text-left">{selectedBook.title}</h2>
              <div className="text-slate-400 font-bold text-xs mb-8 uppercase tracking-widest text-left flex items-center gap-2"><div className="w-4 h-0.5 bg-slate-200"></div> by {selectedBook.author}</div>
              {selectedBook.remark && <div className="mb-8 bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100 italic text-slate-700 leading-relaxed text-left relative overflow-hidden group shadow-sm"><Quote size={40} className="absolute -right-2 -top-2 text-blue-100 -rotate-12 group-hover:rotate-0 transition-transform duration-700"/>"{selectedBook.remark}"</div>}
              <div className="bg-slate-50 p-6 rounded-[3rem] border border-slate-100 flex items-center gap-4 shadow-sm text-left mb-8"><div className={`p-3 rounded-2xl ${isAdminAuth ? 'bg-red-100 text-red-600' : 'bg-white text-blue-600 shadow-sm'}`}><Phone size={20}/></div><div className="text-left text-sm font-black tracking-widest text-slate-800">{(isAdminAuth || !selectedBook.isPrivate || selectedBook.ownerId === user.uid) ? selectedBook.contact : <span className="italic flex items-center gap-2 text-slate-400 font-bold"><EyeOff size={14}/> Hidden Number</span>}</div></div>
              <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 text-left shadow-sm"><div className="text-[8px] font-black uppercase text-slate-400 mb-1">Class</div><div className="font-black text-sm flex items-center gap-2"><GraduationCap size={16} className="text-blue-600" /> {selectedBook.ownerClass}</div></div>
                <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 text-left shadow-sm"><div className="text-[8px] font-black uppercase text-slate-400 mb-1">Held For</div><div className="font-black text-sm flex items-center gap-2"><Clock size={16} className="text-emerald-600" /> {calculateDaysDiff(selectedBook.since)} Days</div></div>
              </div>
              {(user.uid === selectedBook.ownerId || isAdminAuth) && selectedBook.waitlist?.length > 0 && selectedBook.handoverStatus === 'available' && (
                <div className={`mt-8 space-y-4 border-2 p-6 rounded-[2.5rem] shadow-sm text-left ${isAdminAuth ? 'bg-red-50/20 border-red-100' : 'bg-blue-50/20 border-blue-100'}`}>
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-[0.2em] flex items-center gap-2"><Users size={16}/> Student Requests ({selectedBook.waitlist.length})</p>
                   {selectedBook.waitlist.map((req, i) => <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm"><div className="text-left"><div className="text-sm font-black">@{req.name}</div><div className="text-[8px] font-bold text-slate-400 uppercase mt-1">Class: {req.studentClass} | {req.contact}</div></div><button onClick={() => handleApproveFromWaitlist(req)} className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase shadow-lg shadow-blue-100 active:scale-95 transition-all">Approve</button></div>)}
                </div>
              )}
              {selectedBook.handoverStatus === 'confirming_receipt' && selectedBook.pendingRequesterId === user.uid && <button onClick={handleConfirmReceipt} className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase mt-8 shadow-xl animate-bounce tracking-widest text-xs">Confirm Receipt</button>}
              {!isAdminAuth && user.uid !== selectedBook.ownerId && !selectedBook.waitlist?.some(r => r.uid === user.uid) && <button onClick={() => { setBorrowMobile(profile?.mobile || ''); setIsRequestingTransfer(true); }} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase mt-8 flex items-center justify-center gap-3 shadow-2xl active:scale-95 shadow-blue-100 tracking-widest text-xs"><Send size={18} /> Request Borrow</button>}
            </div>
          </div>
        </div>
      )}

      {/* OTHER UTILITY MODALS (LOGOUT, ADMIN, ADD, etc.) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 text-center text-left">
          <div className="bg-white w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl animate-in zoom-in-95 text-left">
            <div className="bg-red-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-red-600 shadow-xl"><LogOut size={48} /></div>
            <h2 className="text-3xl font-black mb-3 text-center tracking-tight">Switch Account?</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-10 text-center leading-relaxed">Sign out of current profile.</p>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 font-black text-slate-400 text-xs uppercase tracking-widest">Stay</button>
              <button onClick={handleLogout} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all text-left text-center">Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN ADMIN LOGIN */}
      <button onDoubleClick={() => setIsAdminModeModal(true)} className="fixed bottom-0 left-0 w-16 h-16 opacity-0 z-[100]"></button>
      {isAdminModeModal && (
        <div className="fixed inset-0 bg-black/95 z-[150] flex items-center justify-center p-6 backdrop-blur-xl">
           <div className="bg-white w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl text-center animate-in zoom-in-95">
               <ShieldAlert size={48} className="mx-auto mb-6 text-red-600 shadow-lg shadow-red-100" />
               <h2 className="text-3xl font-black mb-2 tracking-tight">Admin Key</h2>
               <form onSubmit={handleAdminVerify} className="space-y-5">
                 <input type="password" placeholder="Key" className="w-full p-6 bg-slate-100 rounded-3xl font-black text-center text-2xl outline-none focus:border-red-600 border-2 border-transparent transition-all shadow-inner" value={adminPassAttempt} onChange={e => setAdminPassAttempt(e.target.value)} />
                 <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl active:scale-95 transition-all text-center">Unlock Root Access</button>
               </form>
               <button onClick={()=>setIsAdminModeModal(false)} className="mt-8 text-[10px] font-black uppercase text-slate-300 text-center">Cancel</button>
            </div>
        </div>
      )}

      {/* ADD BOOK MODAL */}
      {isAddingBook && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
          <form onSubmit={handleAddBook} className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl max-h-[90dvh] overflow-y-auto no-scrollbar animate-in duration-300 text-left">
            <div className="flex justify-between items-center mb-8 text-left"><h2 className="text-2xl font-black tracking-tight text-left">List a Book</h2><button type="button" onClick={() => setIsAddingBook(false)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"><X size={20}/></button></div>
            <div className="space-y-5 text-left">
              <div onClick={() => !isLoading && fileInputRef.current.click()} className="aspect-video bg-slate-50 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-blue-200 transition-all relative">
                {isLoading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 font-black uppercase text-[10px] animate-pulse">Processing...</div>}
                {bookImageUrl ? <img src={bookImageUrl} className="w-full h-full object-cover" /> : <><Camera size={48} className="text-slate-200 mb-2 group-hover:text-blue-300 transition-colors" /><div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Add Book Photo</div></>}<input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageChange} />
              </div>
              <input required placeholder="Book Title" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-600 transition-all shadow-sm text-left" value={newBookTitle} onChange={e => setNewBookTitle(e.target.value)} />
              <input placeholder="Author Name" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-600 transition-all shadow-sm text-left" value={newBookAuthor} onChange={e => setNewBookAuthor(e.target.value)} />
              <select className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase text-[10px] outline-none shadow-sm text-left" value={newBookCategory} onChange={e => setNewBookCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <textarea placeholder="Condition, advice, etc." className="w-full h-32 p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-sm outline-none focus:border-blue-600 resize-none transition-all shadow-sm text-left shadow-inner" value={newBookRemark} onChange={e => setNewBookRemark(e.target.value)} />
              <button type="submit" disabled={isLoading} className={`w-full py-5 rounded-[2rem] font-black uppercase text-xs text-white shadow-2xl active:scale-95 transition-all text-center ${appMode === 'sharing' ? 'bg-blue-600 shadow-blue-100' : 'bg-rose-600 shadow-rose-100'} disabled:opacity-50`}>Publish Listing</button>
            </div>
          </form>
        </div>
      )}

      {/* COMMUNITY BOARD */}
      {showCommunityBoard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex justify-center sm:items-center items-end p-0 sm:p-4 text-left">
          <div className="bg-white w-full max-w-2xl sm:rounded-[3rem] rounded-t-[3rem] h-[90vh] sm:h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500 shadow-2xl text-left">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center text-left shrink-0">
              <div className="flex items-center gap-3 text-left">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100"><Megaphone size={24} /></div>
                <div className="text-left"><h2 className="text-xl font-black text-left tracking-tight">Community Board</h2><div className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-left">Public Chat</div></div>
              </div>
              <button onClick={() => setShowCommunityBoard(false)} className="bg-slate-100 p-2.5 rounded-xl hover:bg-slate-200 transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/30 text-left">
              {suggestions.map(s => (
                <div key={s.id} className={`p-6 rounded-[2.5rem] border transition-all hover:scale-[1.02] ${s.type === 'demand' ? 'bg-white border-blue-100 shadow-sm' : 'bg-rose-50/50 border-rose-100 shadow-sm'} text-left relative group`}>
                  <div className="flex items-center justify-between mb-4 text-left">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${s.type === 'demand' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>{s.type}</span>
                    <span className="text-[9px] font-bold text-slate-300 text-left">{safeFormatDate(s.createdAt?.toDate?.()?.toISOString())}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed italic text-left">"{s.message}"</p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-left">
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">@{s.userName} (Class {s.userClass})</div>
                  </div>
                </div>
              ))}
              {suggestions.length === 0 && <div className="text-center py-20 opacity-20"><Megaphone size={64} className="mx-auto mb-4" /><div className="font-black uppercase text-[10px] tracking-widest text-center">No posts yet</div></div>}
            </div>
            <div className="p-6 border-t border-slate-100 bg-white text-left text-center">
              <button onClick={() => setIsAddingSuggestion(true)} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs shadow-2xl active:scale-95 transition-all text-center">Post Public Message</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}