/**
 * 📚 BookShare Pro - High Scale Optimized (v3.4)
 * * SCALABILITY UPGRADES:
 * - UI Virtualization: Renders books in batches (24 at a time) to prevent lag.
 * - Load More Mechanism: Handles thousands of items smoothly.
 * - Image Optimization: Aggressive compression for fast loading of large lists.
 * - Ordered Data: Ensures newest listings always appear top.
 * - Robust Error Handling: Prevents app crashes on network spikes.
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
  UserPlus, KeyRound, Heart, Loader2, AlertTriangle, Sparkles, Quote, Bell, Volume2, Reply, Filter, CheckCircle2, History, ChevronDown
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
const appId = 'school-bookshare-production-v1'; // PERMANENT ID

const CATEGORIES = ["Maths", "Biology", "Commerce", "Arts", "Science", "Hindi", "Novel", "Self Help & Development", "Biography", "English", "Computer", "Coaching Notes", "Competition related", "Other"];
const CLASSES = ["6th", "7th", "8th", "9th", "10th", "11th", "12th", "College", "Other"];
const BATCH_SIZE = 24; // Number of books to load at a time

// --- UTILITIES ---
const compressImage = (base64Str, maxWidth = 500, quality = 0.5) => {
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
  // --- CORE STATE ---
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(`${appId}_profile`);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [isAdminAuth, setIsAdminAuth] = useState(() => localStorage.getItem(`${appId}_isAdmin`) === 'true');
  const [appMode, setAppMode] = useState(null); 
  const [currentTab, setCurrentTab] = useState('explore'); 

  // --- DATA STATE ---
  const [books, setBooks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);

  // --- UI STATE ---
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE); // For Pagination
  const [authView, setAuthView] = useState('login'); 
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showMpin, setShowMpin] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // --- MODALS ---
  const [selectedBook, setSelectedBook] = useState(null);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showAdminBroadcast, setShowAdminBroadcast] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCommunityBoard, setShowCommunityBoard] = useState(false);
  const [isAddingSuggestion, setIsAddingSuggestion] = useState(false); 
  const [isRequestingTransfer, setIsRequestingTransfer] = useState(false); 
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  const [isAdminModeModal, setIsAdminModeModal] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  // --- FILTERS & INPUTS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');

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

  // Auth Init
  useEffect(() => {
    const initAuth = async () => { try { await signInAnonymously(auth); } catch (e) { console.error(e); } };
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
          } else { setIsAuthModalOpen(true); }
        }
      } else { setUser(null); setIsAuthModalOpen(true); }
    });
    return () => unsub();
  }, [isAdminAuth, profile]);

  // Data Listeners
  useEffect(() => {
    if (!user) return;
    // We use standard snapshot because 'orderBy' in snapshot requires index which user might not have set.
    // We sort in Client Side (filteredBooksList) for robustness.
    const unsubBooks = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'books'), (s) => 
      setBooks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSuggest = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), (s) => 
      setSuggestions(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))));
    const unsubNotify = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), (s) => 
      setNotifications(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))));
    const unsubSupport = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'support'), (s) => 
      setSupportMessages(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))));
    return () => { unsubBooks(); unsubSuggest(); unsubNotify(); unsubSupport(); };
  }, [user]);

  // Back Button Fix
  useEffect(() => {
    const handlePop = () => {
      if (selectedBook) { setSelectedBook(null); window.history.pushState(null, ""); }
      else if (isAddingBook) { setIsAddingBook(false); window.history.pushState(null, ""); }
      else if (showCommunityBoard) { setShowCommunityBoard(false); window.history.pushState(null, ""); }
      else if (appMode) { setAppMode(null); window.history.pushState(null, ""); }
    };
    window.addEventListener('popstate', handlePop);
    window.history.pushState(null, ""); 
    return () => window.removeEventListener('popstate', handlePop);
  }, [selectedBook, isAddingBook, showCommunityBoard, appMode]);

  // --- OPTIMIZED FILTERING ---
  const filteredBooksList = useMemo(() => {
    let list = [...books];
    if (appMode) list = list.filter(b => b.type === appMode);
    if (currentTab === 'activity' && user) list = list.filter(b => b.ownerId === user.uid || (b.waitlist && b.waitlist.some(r => r.uid === user.uid)) || b.pendingRequesterId === user.uid);
    if (selectedCategory !== 'All') list = list.filter(b => b.category === selectedCategory);
    if (selectedClassFilter !== 'All') list = list.filter(b => b.bookClass === selectedClassFilter);
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      list = list.filter(b => b.title?.toLowerCase().includes(t) || b.author?.toLowerCase().includes(t));
    }
    // Newest first sorting
    return list.sort((a, b) => (b.createdAt?.seconds || 0) < (a.createdAt?.seconds || 0) ? 1 : -1).reverse();
  }, [books, appMode, currentTab, selectedCategory, selectedClassFilter, searchTerm, user]);

  // Pagination Logic
  const paginatedBooks = useMemo(() => {
    return filteredBooksList.slice(0, visibleCount);
  }, [filteredBooksList, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + BATCH_SIZE);
  };

  // --- ACTIONS ---
  const handleLogout = async () => {
    try { await signOut(auth); localStorage.clear(); window.location.reload(); } catch (e) { console.error(e); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (tempMobile.length !== 10 || tempMpin.length !== 4) return;
    try {
      setIsLoading(true);
      const regRef = doc(db, 'artifacts', appId, 'public', 'data', 'mobile_registry', tempMobile);
      const snap = await getDoc(regRef);
      if (snap.exists()) { setAuthError('Mobile registered. Login.'); setIsLoading(false); return; }
      const pData = { name: tempName.trim(), studentClass: tempClass, mobile: tempMobile, mpin: tempMpin, isPrivate: tempIsPrivate, shortId: getShortId(user.uid) };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), pData);
      await setDoc(regRef, { uid: user.uid, mpin: tempMpin });
      setProfile(pData); localStorage.setItem(`${appId}_profile`, JSON.stringify(pData)); setIsAuthModalOpen(false);
    } catch (err) { setAuthError('Error'); } finally { setIsLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const snap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'mobile_registry', loginMobile));
      if (!snap.exists()) { setAuthError('Not Found'); return; }
      if (snap.data().mpin !== loginMpin) { setAuthError('Wrong PIN'); return; }
      const pSnap = await getDoc(doc(db, 'artifacts', appId, 'users', snap.data().uid, 'profile', 'data'));
      if (pSnap.exists()) { setProfile(pSnap.data()); localStorage.setItem(`${appId}_profile`, JSON.stringify(pSnap.data())); setIsAuthModalOpen(false); }
    } catch (err) { setAuthError('Login fail'); } finally { setIsLoading(false); }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminId.toLowerCase() === 'admin' && adminKey === 'admin9893@') {
      setIsAdminAuth(true); localStorage.setItem(`${appId}_isAdmin`, 'true');
      setProfile({ name: "Admin", studentClass: "Staff", mobile: "9999999999", isPrivate: false, shortId: "ROOT" });
      setIsAuthModalOpen(false);
    } else setAuthError('Denied');
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBookTitle || !user) return;
    try {
      setIsPublishing(true);
      const today = new Date().toISOString();
      const ownerName = `${profile?.name}#${getShortId(user.uid)}`;
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'books'), {
        type: appMode, title: newBookTitle, author: newBookAuthor || 'Unknown', category: newBookCategory,
        bookClass: newBookClass, remark: newBookRemark, imageUrl: bookImageUrl, currentOwner: ownerName, ownerClass: profile?.studentClass || 'Staff',
        ownerId: user.uid, contact: profile?.mobile, isPrivate: profile?.isPrivate || false,
        since: today, handoverStatus: 'available', waitlist: [], history: [{ owner: ownerName, startDate: today, action: 'Listed' }], 
        createdAt: serverTimestamp(), readingProgress: { pagesRead: 0, started: false }
      });
      setIsAddingBook(false); setNewBookTitle(''); setNewBookAuthor(''); setBookImageUrl('');
    } catch (err) { alert("Add Fail"); } finally { setIsPublishing(false); }
  };

  const handleRequestBorrow = async (e) => {
    e.preventDefault();
    if (!selectedBook || borrowMobile.length !== 10) return;
    try {
      setIsPublishing(true);
      const reqObj = { uid: user.uid, name: profile.name, studentClass: profile.studentClass, contact: borrowMobile, message: borrowMsg, ownerReply: "", timestamp: new Date().toISOString() };
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { waitlist: arrayUnion(reqObj) });
      setSelectedBook(null); alert("Sent!");
    } catch (e) { alert("Fail"); } finally { setIsPublishing(false); }
  };

  const handleApproveFromWaitlist = async (reqUser) => {
    try {
      const newWaitlist = selectedBook.waitlist.filter(u => u.uid !== reqUser.uid);
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { 
        handoverStatus: 'confirming_receipt', pendingRequesterId: reqUser.uid, pendingOwner: reqUser.name, pendingOwnerClass: reqUser.studentClass, pendingContact: reqUser.contact, isPrivate: false, waitlist: newWaitlist 
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
        currentOwner: selectedBook.pendingOwner, ownerClass: selectedBook.pendingOwnerClass, ownerId: selectedBook.pendingRequesterId, contact: selectedBook.pendingContact, isPrivate: false, history: updatedHistory, since: today, handoverStatus: 'available', pendingRequesterId: null, pendingOwner: null,
        "readingProgress.started": false, "readingProgress.pagesRead": 0
      });
      setSelectedBook(null); alert("Received!");
    } catch (e) { console.error(e); }
  };

  const handleOwnerReply = async (reqUid) => {
    if (!replyInput.text.trim()) return;
    try {
      const updated = selectedBook.waitlist.map(r => r.uid === reqUid ? { ...r, ownerReply: replyInput.text.trim() } : r);
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { waitlist: updated });
      setReplyInput({ reqUid: '', text: '' }); setSelectedBook({ ...selectedBook, waitlist: updated });
    } catch (e) { alert("Error"); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const comp = await compressImage(reader.result);
      setBookImageUrl(comp); setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), { message: broadcastMsg, createdAt: serverTimestamp(), sender: "School Admin" });
      setBroadcastMsg(''); setShowAdminBroadcast(false); alert("Sent!");
    } catch (e) { console.error(e); }
  };

  const handleExportCSV = () => {
    if (books.length === 0) return;
    const headers = ["Title", "Author", "Category", "Class", "Holder", "Contact"];
    const rows = books.map(b => [`"${b.title}"`, `"${b.author}"`, `"${b.category}"`, `"${b.bookClass}"`, `"${b.currentOwner}"`, `'${b.contact}`]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "Data.csv";
    link.click();
  };

  const handleDeleteBook = async () => {
    try {
      if (selectedBook.history?.length === 1 || !selectedBook.history || isAdminAuth) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id));
        setSelectedBook(null); setShowDeleteConfirm(false);
      } else alert("Cannot delete transferred book.");
    } catch (e) { console.error(e); }
  };

  const handleAddSuggestion = async (e) => {
    e.preventDefault();
    if (!suggestMsg.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), { type: suggestType, message: suggestMsg, userName: profile?.name, userClass: profile?.studentClass, createdAt: serverTimestamp() });
      setSuggestMsg(''); setIsAddingSuggestion(false);
    } catch (err) { console.error(err); }
  };

  const handleSendSupport = async (e) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'support'), { message: reportText, senderName: profile.name, senderClass: profile.studentClass, senderMobile: profile.mobile, senderUid: user.uid, createdAt: serverTimestamp() });
      setReportText(''); setIsReportingIssue(false); alert("Sent!");
    } catch (e) { console.error(e); }
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { "readingProgress.started": true, "readingProgress.pagesRead": Number(newPagesRead), "readingProgress.lastUpdated": new Date().toISOString() });
      setIsUpdatingProgress(false); setSelectedBook(null);
    } catch (e) { console.error(e); }
  };

  const handleAdminVerify = (e) => {
    e.preventDefault();
    if (adminPassAttempt === 'admin9893@') {
      setIsAdminAuth(true); localStorage.setItem(`${appId}_isAdmin`, 'true');
      setProfile({ name: "Admin", studentClass: "Staff", mobile: "9999999999", isPrivate: false, shortId: "ROOT" });
      setIsAuthModalOpen(false); setIsAdminModeModal(false);
    } else setAdminPassAttempt('');
  };

  // --- UI RENDER ---
  if (!user) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={48}/></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 overflow-x-hidden selection:bg-blue-100">
      
      {/* AUTH */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-white z-[300] flex items-center justify-center p-6 overflow-y-auto">
          <div className="max-w-sm w-full py-10 text-center animate-in zoom-in-95">
             <div className="bg-blue-600 w-24 h-24 rounded-[3rem] mx-auto mb-6 flex items-center justify-center shadow-2xl"><BookOpen className="text-white w-12 h-12" /></div>
             <h1 className="text-4xl font-black mb-10">BookShare</h1>
             <div className="bg-slate-100 p-1.5 rounded-[2rem] flex mb-8">
               {['login', 'register', 'admin'].map(v => <button key={v} onClick={() => {setAuthView(v); setAuthError('');}} className={`flex-1 py-3 rounded-[1.5rem] font-black uppercase text-[9px] ${authView === v ? 'bg-white shadow-lg text-blue-600' : 'text-slate-400'}`}>{v}</button>)}
             </div>
             {authError && <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase">{authError}</div>}
             {authView === 'login' && <form onSubmit={handleLogin} className="space-y-4"><input className="w-full px-6 py-5 bg-slate-50 rounded-[2rem] font-bold outline-none" placeholder="Mobile" value={loginMobile} onChange={e => handleNumericInput(e.target.value, setLoginMobile, 10)} /><input type={showMpin?"text":"password"} className="w-full px-6 py-5 bg-slate-50 rounded-[2rem] font-black tracking-[0.5em] outline-none" placeholder="PIN" value={loginMpin} onChange={e => handleNumericInput(e.target.value, setLoginMpin, 4)} /><button type="button" onClick={()=>setShowMpin(!showMpin)} className="text-xs text-slate-400 font-bold uppercase mb-4 block">Show PIN</button><button disabled={isLoading} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl">Unlock</button></form>}
             {authView === 'register' && <form onSubmit={handleRegister} className="space-y-4"><input className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] font-bold outline-none" placeholder="Name" value={tempName} onChange={e => setTempName(e.target.value)} /><select className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] font-bold outline-none" value={tempClass} onChange={e => setTempClass(e.target.value)}>{CLASSES.map(c=><option key={c} value={c}>{c}</option>)}</select><input className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] font-bold outline-none" placeholder="Mobile" value={tempMobile} onChange={e => handleNumericInput(e.target.value, setTempMobile, 10)} /><input className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] font-black tracking-[0.3em] outline-none" placeholder="PIN" value={tempMpin} onChange={e => handleNumericInput(e.target.value, setTempMpin, 4)} /><div className="flex items-center justify-between px-2"><span className="text-[10px] font-black uppercase text-slate-400">Hide Mobile?</span><button type="button" onClick={()=>setTempIsPrivate(!tempIsPrivate)} className={`w-10 h-5 rounded-full relative ${tempIsPrivate?'bg-blue-600':'bg-slate-300'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${tempIsPrivate?'right-1':'left-1'}`}/></button></div><button disabled={isLoading} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs shadow-2xl mt-6">Register Profile</button></form>}
             {authView === 'admin' && <form onSubmit={handleAdminLogin} className="space-y-4"><input className="w-full px-6 py-5 bg-slate-50 rounded-[2rem] font-bold outline-none" placeholder="ID" value={adminId} onChange={e => setAdminId(e.target.value)} /><input type="password" className="w-full px-6 py-5 bg-slate-50 rounded-[2rem] font-bold outline-none" placeholder="Key" value={adminKey} onChange={e => setAdminKey(e.target.value)} /><button className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl">Root Access</button></form>}
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {!appMode ? (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
           <div className="mb-12 text-center"><div className="bg-blue-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl mx-auto mb-6"><BookOpen className="text-white w-12 h-12" /></div><h1 className="text-5xl font-black mb-3">BookShare</h1><div className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-slate-400">@{profile?.name}</div><button onClick={()=>setShowLogoutConfirm(true)} className="text-red-400 text-[10px] font-black uppercase mt-4 flex items-center gap-2 justify-center"><LogOut size={14}/> Logout</button></div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl"><button onClick={()=>{setAppMode('sharing');setCurrentTab('explore');}} className="bg-white p-8 rounded-[3rem] shadow-xl border flex flex-col items-center"><Users size={40} className="mb-4 text-blue-600"/><h2 className="text-2xl font-black">Sharing</h2></button><button onClick={()=>{setAppMode('donation');setCurrentTab('explore');}} className="bg-white p-8 rounded-[3rem] shadow-xl border flex flex-col items-center"><Heart size={40} className="mb-4 text-rose-600"/><h2 className="text-2xl font-black">Donation</h2></button></div>
           <div className="mt-12 flex justify-center gap-4"><button onClick={()=>setShowCommunityBoard(true)} className="bg-blue-50 px-6 py-3 rounded-full flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase"><Megaphone size={16}/> Board</button><button onClick={()=>setIsReportingIssue(true)} className="bg-slate-50 px-6 py-3 rounded-full flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase"><Headset size={16}/> Support</button></div>
        </div>
      ) : (
        <div>
          <header className={`bg-white sticky top-0 z-40 p-4 border-b flex justify-between items-center ${isAdminAuth?'border-red-100':''}`}>
             <div className="flex items-center gap-4"><button onClick={()=>setAppMode(null)}><ChevronLeft/></button><div><h1 className="text-lg font-black uppercase">{appMode}</h1><div className="text-[9px] font-black uppercase text-slate-400">{currentTab}</div></div></div>
             <div className="flex items-center gap-2"><button onClick={()=>setShowNotifyModal(true)} className="p-3 bg-rose-50 rounded-2xl text-rose-600"><Bell size={20}/></button><button onClick={()=>setIsAddingBook(true)} className="bg-blue-600 text-white h-12 px-5 rounded-2xl flex items-center gap-2 shadow-xl"><Plus size={20}/><span className="text-[10px] font-black uppercase hidden sm:inline">Add</span></button></div>
          </header>

          {currentTab === 'explore' && <div className="max-w-5xl mx-auto p-4 space-y-4"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl font-bold outline-none" placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/></div><div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">{['All', ...CATEGORIES].map(c=><button key={c} onClick={()=>setSelectedCategory(c)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase border whitespace-nowrap ${selectedCategory===c?'bg-slate-900 text-white':'bg-white text-slate-500'}`}>{c}</button>)}</div><div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 border-t pt-4"><div className="flex items-center gap-2 px-3 text-slate-400"><Filter size={14}/><span className="text-[9px] font-black uppercase">Class:</span></div>{['All', ...CLASSES].map(c=><button key={c} onClick={()=>setSelectedClassFilter(c)} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase border whitespace-nowrap ${selectedClassFilter===c?'bg-blue-600 text-white':'bg-white text-slate-400'}`}>{c}</button>)}</div></div>}

          <main className="max-w-5xl mx-auto p-4 pb-24">
             {currentTab === 'inbox' && isAdminAuth ? (
               <div className="space-y-6">
                 <div className="flex justify-between items-center bg-red-50 p-6 rounded-[2.5rem] border border-red-100"><div><h2 className="text-xl font-black text-red-900">Admin Control</h2><p className="text-[9px] font-bold text-red-600 uppercase">Records & Broadcast</p></div><button onClick={handleExportCSV} className="bg-red-600 text-white p-4 rounded-2xl"><Download size={20}/></button></div>
                 <button onClick={()=>setShowAdminBroadcast(true)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase shadow-xl flex items-center justify-center gap-3"><Volume2 size={20}/> Broadcast</button>
                 {supportMessages.map(msg => <div key={msg.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm"><div className="text-sm font-black">@{msg.senderName} ({msg.senderClass})</div><p className="mt-4 text-slate-700 italic">"{msg.message}"</p></div>)}
               </div>
             ) : (
               <>
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                 {paginatedBooks.map(b => (
                   <div key={b.id} onClick={()=>setSelectedBook(b)} className="bg-white rounded-[2.5rem] overflow-hidden border shadow-sm relative group">
                     <div className="aspect-[4/5] bg-slate-100 relative">{b.imageUrl ? <img src={b.imageUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-[10px]">NO COVER</div>}{b.waitlist?.length > 0 && <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-lg text-[8px] font-black shadow-lg">WAIT: {b.waitlist.length}</div>}{b.handoverStatus === 'confirming_receipt' && <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-[2px] flex items-center justify-center"><div className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-[8px] font-black animate-pulse uppercase">Handover</div></div>}</div>
                     <div className="p-4"><h3 className="font-black text-sm truncate">{b.title}</h3><div className="text-[9px] text-slate-400 font-bold mt-2 uppercase">{b.ownerClass} • {calculateDaysDiff(b.since)}d</div></div>
                   </div>
                 ))}
               </div>
               {visibleCount < filteredBooksList.length && <div className="mt-8 text-center"><button onClick={handleLoadMore} className="bg-slate-100 px-6 py-3 rounded-full text-slate-500 font-black text-[10px] uppercase hover:bg-slate-200">Load More</button></div>}
               </>
             )}
          </main>

          <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t p-4 flex justify-around shadow-2xl z-40"><button onClick={()=>setCurrentTab('explore')} className={`flex flex-col items-center gap-1 ${currentTab==='explore'?'text-slate-900':'text-slate-300'}`}><LayoutGrid/><span className="text-[8px] font-black uppercase">Library</span></button>{isAdminAuth ? <button onClick={()=>setCurrentTab('inbox')} className={`flex flex-col items-center gap-1 ${currentTab==='inbox'?'text-red-600':'text-slate-300'}`}><Inbox/><span className="text-[8px] font-black uppercase">Admin</span></button> : <button onClick={()=>setCurrentTab('activity')} className={`flex flex-col items-center gap-1 ${currentTab==='activity'?'text-slate-900':'text-slate-300'}`}><Bookmark/><span className="text-[8px] font-black uppercase">Activity</span></button>}</nav>
        </div>
      )}

      {selectedBook && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-t-[3.5rem] sm:rounded-[3.5rem] overflow-hidden animate-in slide-in-from-bottom duration-500 shadow-2xl">
            <div className="h-64 relative bg-slate-200">
               {selectedBook.imageUrl ? <img src={selectedBook.imageUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black">NO COVER</div>}
               <div className="absolute top-6 right-6 flex gap-2">{(isAdminAuth || (selectedBook.ownerId === user.uid && selectedBook.history?.length === 1)) && <button onClick={()=>setShowDeleteConfirm(true)} className="bg-red-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><Trash2 size={20}/></button>}<button onClick={()=>setSelectedBook(null)} className="bg-black/20 text-white w-10 h-10 rounded-xl flex items-center justify-center"><X size={20}/></button></div>
            </div>
            <div className="p-8 bg-white max-h-[90dvh] overflow-y-auto no-scrollbar">
               <h2 className="text-2xl font-black mb-1">{selectedBook.title}</h2>
               <div className="text-slate-400 font-bold text-xs mb-8 uppercase tracking-widest">by {selectedBook.author}</div>
               
               <div className="bg-slate-50 p-6 rounded-[3rem] border border-slate-100 flex items-center gap-4 shadow-sm mb-8">
                  <div className="p-3 rounded-2xl bg-white text-blue-600 shadow-sm"><Phone size={20}/></div>
                  <div><div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Holder Contact</div><div className="font-black text-sm">{(isAdminAuth || !selectedBook.isPrivate || selectedBook.ownerId === user.uid) ? selectedBook.contact : <span className="italic text-slate-400 font-bold">Hidden</span>}</div></div>
               </div>

               {selectedBook.handoverStatus === 'confirming_receipt' && selectedBook.pendingRequesterId === user.uid && (
                 <div className="mb-8 p-6 bg-blue-600 rounded-[2.5rem] shadow-xl text-center text-white animate-in zoom-in-95">
                    <h3 className="text-lg font-black uppercase">Confirm Transfer?</h3>
                    <button onClick={handleConfirmReceipt} className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black uppercase text-xs shadow-lg mt-4">I have the Book</button>
                 </div>
               )}

               {user.uid !== selectedBook.ownerId && !selectedBook.waitlist?.some(r => r.uid === user.uid) && selectedBook.handoverStatus === 'available' && (
                 <form onSubmit={handleRequestBorrow} className="space-y-4 mb-8 bg-blue-50 p-6 rounded-[2.5rem] border border-blue-100">
                    <p className="text-[10px] font-black uppercase text-blue-600">Request Borrow</p>
                    <textarea required placeholder="Message..." className="w-full p-4 bg-white border rounded-2xl text-sm outline-none" value={borrowMsg} onChange={e => setBorrowMsg(e.target.value)} />
                    <input required type="tel" maxLength={10} placeholder="Confirm Mobile" className="w-full p-4 bg-white border rounded-2xl text-sm outline-none" value={borrowMobile} onChange={e => handleNumericInput(e.target.value, setBorrowMobile, 10)} />
                    <button disabled={isPublishing || borrowMobile.length !== 10} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg">Send Request</button>
                 </form>
               )}

               {(user.uid === selectedBook.ownerId || isAdminAuth) && selectedBook.waitlist?.length > 0 && (
                 <div className="mt-8 space-y-4 border-2 p-6 rounded-[2.5rem] shadow-sm bg-blue-50/20 border-blue-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-4">Requests ({selectedBook.waitlist.length})</p>
                    {selectedBook.waitlist.map((req, i) => (
                      <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mb-4">
                         <div className="flex justify-between items-start mb-3">
                            <div><div className="text-sm font-black">@{req.name}</div><div className="text-[8px] font-bold text-slate-400 uppercase">Cl: {req.studentClass} | {req.contact}</div></div>
                            <button onClick={() => handleApproveFromWaitlist(req)} className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase shadow-lg">Approve</button>
                         </div>
                         <p className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-2xl italic border">"{req.message}"</p>
                         <div className="mt-4 pt-4 border-t border-slate-50">
                           {req.ownerReply ? <div className="bg-emerald-50 p-3 rounded-2xl text-[10px] font-bold text-emerald-800">Reply: {req.ownerReply}</div> : 
                           <div className="flex gap-2"><input placeholder="Reply..." className="flex-1 bg-slate-100 border-none text-[11px] font-bold px-4 py-2.5 rounded-xl outline-none" value={replyInput.reqUid === req.uid ? replyInput.text : ''} onChange={(e) => setReplyInput({ reqUid: req.uid, text: e.target.value })} /><button onClick={() => handleOwnerReply(req.uid)} className="bg-slate-900 text-white p-2.5 rounded-xl"><Send size={14}/></button></div>}
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {isAddingBook && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
           <form onSubmit={handleAddBook} className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl max-h-[90dvh] overflow-y-auto">
              <h2 className="text-2xl font-black mb-8">List Book</h2>
              <div className="space-y-5">
                 <div onClick={() => !isLoading && fileInputRef.current.click()} className="aspect-video bg-slate-50 border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden">{bookImageUrl ? <img src={bookImageUrl} className="w-full h-full object-cover"/> : <Camera className="text-slate-300"/>}<input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload}/></div>
                 <input required placeholder="Title" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={newBookTitle} onChange={e => setNewBookTitle(e.target.value)} />
                 <input placeholder="Author" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={newBookAuthor} onChange={e => setNewBookAuthor(e.target.value)} />
                 <div className="grid grid-cols-2 gap-3">
                    <select className="w-full p-4 bg-slate-50 rounded-2xl font-black text-[10px] outline-none" value={newBookCategory} onChange={e => setNewBookCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl font-black text-[10px] outline-none" value={newBookClass} onChange={e => setNewBookClass(e.target.value)}>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                 </div>
                 <textarea placeholder="Note..." className="w-full h-32 p-5 bg-slate-50 rounded-3xl font-bold text-sm outline-none resize-none" value={newBookRemark} onChange={e => setNewBookRemark(e.target.value)} />
                 <div className="flex gap-4"><button type="button" onClick={()=>setIsAddingBook(false)} className="flex-1 py-5 font-black uppercase text-xs text-slate-400">Cancel</button><button disabled={isPublishing} className="flex-[2] py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl">Publish</button></div>
              </div>
           </form>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 text-center">
           <div className="bg-white w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl">
              <Trash2 size={48} className="mx-auto mb-6 text-red-600" />
              <h2 className="text-3xl font-black mb-6">Delete?</h2>
              <div className="flex gap-4"><button onClick={()=>setShowDeleteConfirm(false)} className="flex-1 py-4 font-black uppercase text-xs text-slate-400">Cancel</button><button onClick={handleDeleteBook} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl">Delete</button></div>
           </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 text-center">
           <div className="bg-white w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl">
              <LogOut size={48} className="mx-auto mb-6 text-red-600" />
              <h2 className="text-3xl font-black mb-6">Logout?</h2>
              <div className="flex gap-4"><button onClick={()=>setShowLogoutConfirm(false)} className="flex-1 py-4 font-black uppercase text-xs text-slate-400">Stay</button><button onClick={handleLogout} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl">Logout</button></div>
           </div>
        </div>
      )}

      {showCommunityBoard && (
        <div className="fixed inset-0 bg-black/60 flex justify-center sm:items-center items-end p-0 sm:p-4">
           <div className="bg-white w-full max-w-2xl sm:rounded-[3rem] rounded-t-[3rem] h-[90vh] sm:h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom">
              <div className="p-6 border-b flex justify-between items-center"><h2 className="text-xl font-black">Community</h2><button onClick={()=>setShowCommunityBoard(false)}><X/></button></div>
              <div className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/30">
                 {suggestions.map(s => <div key={s.id} className="p-6 rounded-[2.5rem] border bg-white shadow-sm"><span className="text-[9px] font-black uppercase text-blue-600">{s.type}</span><p className="mt-2 text-sm font-bold">"{s.message}"</p><div className="mt-4 text-[10px] font-black text-slate-400 uppercase">@{s.userName}</div></div>)}
              </div>
              <div className="p-6 border-t bg-white"><button onClick={()=>setIsAddingSuggestion(true)} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase shadow-xl">Post Message</button></div>
           </div>
        </div>
      )}

      {isAddingSuggestion && (
        <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95">
              <h2 className="text-2xl font-black mb-6">New Post</h2>
              <div className="flex gap-2 mb-6"><button onClick={()=>setSuggestType('demand')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase ${suggestType==='demand'?'bg-blue-100 text-blue-600':'bg-slate-100 text-slate-400'}`}>Demand</button><button onClick={()=>setSuggestType('feedback')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase ${suggestType==='feedback'?'bg-rose-100 text-rose-600':'bg-slate-100 text-slate-400'}`}>Suggestion</button></div>
              <textarea placeholder="Write here..." className="w-full h-40 p-5 bg-slate-50 rounded-2xl font-bold border-2 mb-6" value={suggestMsg} onChange={e=>setSuggestMsg(e.target.value)} />
              <div className="flex gap-4"><button onClick={()=>setIsAddingSuggestion(false)} className="flex-1 py-4 font-black uppercase text-xs text-slate-400">Cancel</button><button onClick={handleAddSuggestion} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl">Post</button></div>
           </div>
        </div>
      )}

      {showAdminBroadcast && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[210] flex items-center justify-center p-4 text-left">
          <form onSubmit={handleBroadcast} className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in-95 text-left text-left">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-left text-left"><Volume2 className="text-red-600"/> Broadcast Message</h2>
            <textarea required placeholder="Write announcement for all students..." className="w-full h-44 p-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-bold text-sm focus:border-red-600 outline-none transition-all mb-6 shadow-inner resize-none text-left" value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} />
            <div className="flex gap-4 text-left"><button type="button" onClick={() => setShowAdminBroadcast(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] text-center">Cancel</button><button type="submit" className="flex-1 bg-red-600 text-white py-5 rounded-3xl font-black uppercase text-xs active:scale-95 shadow-xl text-center">Send Notification</button></div>
          </form>
        </div>
      )}

      {isReportingIssue && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[130] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 text-left text-left">
             <div className="flex justify-between items-center mb-8 text-left text-left text-left text-left"><div className="flex items-center gap-4 text-left text-left"><div className="bg-blue-600 p-4 rounded-3xl text-white shadow-xl shadow-blue-100 text-left text-left"><Headset size={28} /></div><div className="text-left text-left text-left"><h2 className="text-2xl font-black text-left text-left">Admin Support</h2><p className="text-[9px] font-black text-blue-600 uppercase">Secure Helpdesk</p></div></div><button onClick={() => setIsReportingIssue(false)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors text-center text-center text-center"><X size={20}/></button></div>
             <form onSubmit={handleSendSupport} className="space-y-6 text-left text-left text-left"><textarea required placeholder="Message for Admin..." className="w-full h-48 p-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-bold text-sm outline-none focus:border-blue-600 transition-all shadow-inner resize-none text-left text-left text-left" value={reportText} onChange={e => setReportText(e.target.value)} /><button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 text-center">Submit</button></form>
          </div>
        </div>
      )}

      {showNotifyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4 text-left">
           <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in slide-in-from-bottom duration-500 text-left text-left">
              <div className="flex justify-between items-center mb-8 text-left text-left">
                 <div className="flex items-center gap-3 text-left text-left"><div className="bg-rose-100 p-3 rounded-2xl text-rose-600 text-left text-left"><Bell size={24}/></div><h2 className="text-2xl font-black tracking-tight text-left text-left">Notices</h2></div>
                 <button onClick={() => setShowNotifyModal(false)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors text-center text-center"><X size={20}/></button>
              </div>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar text-left text-left">
                 {notifications.map(n => (
                   <div key={n.id} className="p-6 bg-slate-50 border rounded-[2rem] shadow-sm hover:bg-white transition-all text-left text-left">
                      <p className="text-sm font-bold text-slate-700 italic text-left text-left">"{n.message}"</p>
                      <div className="mt-4 flex justify-between items-center text-left text-left"><span className="text-[8px] font-black uppercase text-blue-600 text-left text-left">{n.sender}</span><span className="text-[8px] font-black uppercase text-slate-300 text-left text-left">{safeDate(n.createdAt?.toDate?.()?.toISOString())}</span></div>
                   </div>
                 ))}
                 {notifications.length === 0 && <div className="text-center py-20 opacity-20 text-center"><Bell size={64} className="mx-auto mb-4"/><div className="font-black uppercase text-[10px] text-center">No news today</div></div>}
              </div>
           </div>
        </div>
      )}

      {isUpdatingProgress && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-center">
          <form onSubmit={handleUpdateProgress} className="bg-white w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl animate-in zoom-in-95 text-center">
            <h2 className="text-2xl font-black mb-6 tracking-tight text-center">Reading Status</h2>
            <input required type="number" placeholder="Enter Page" className="w-full p-6 bg-slate-50 rounded-3xl font-black text-center text-3xl outline-none focus:border-blue-600 border-2 border-slate-100 mb-8" value={newPagesRead} onChange={e => setNewPagesRead(e.target.value)} />
            <div className="flex gap-4"><button type="button" onClick={() => setIsUpdatingProgress(false)} className="flex-1 py-4 font-black text-slate-400 text-xs">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl">Update</button></div>
          </form>
        </div>
      )}

      {/* HIDDEN ADMIN LOGIN */}
      <button onDoubleClick={() => setIsAdminModeModal(true)} className="fixed bottom-0 left-0 w-16 h-16 opacity-0 z-[100]"></button>
      {isAdminModeModal && (
        <div className="fixed inset-0 bg-black/95 z-[150] flex items-center justify-center p-6 backdrop-blur-xl">
           <div className="bg-white w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl text-center">
               <h2 className="text-3xl font-black mb-2 tracking-tight">Admin Key</h2>
               <form onSubmit={handleAdminVerify} className="space-y-5"><input type="password" placeholder="Key" className="w-full p-6 bg-slate-100 rounded-3xl font-black text-center text-2xl outline-none focus:border-red-600 border-2 border-transparent transition-all shadow-inner" value={adminPassAttempt} onChange={e => setAdminPassAttempt(e.target.value)} /><button type="submit" className="w-full bg-red-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl active:scale-95 transition-all text-center">Unlock Root Access</button></form>
               <button onClick={()=>setIsAdminModeModal(false)} className="mt-8 text-[10px] font-black uppercase text-slate-300 text-center">Cancel</button>
            </div>
        </div>
      )}

    </div>
  );
}