/**
 * 📚 BookShare Pro - Ultimate Optimized Stable Build (v2.4)
 * Changes:
 * - Fixed all ReferenceErrors (bookImageUrl, handleNumericInput, etc.)
 * - Integrated Class Filter & Class-based Book Listing.
 * - Owner-to-Borrower Reply System (Coordination Hub).
 * - Admin God-Mode (ID: admin, Pass: admin9893@).
 * - Mobile Registry for duplicate prevention and MPIN security.
 * - Global Notification System (Bell Icon).
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
  UserPlus, KeyRound, Heart, Loader2, AlertTriangle, Sparkles, Quote, Bell, Volume2, Reply, Filter, CheckCircle2
} from 'lucide-react';

// --- FIREBASE CONFIGURATION ---
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
const appId = 'book-share-v2-stable-final'; // Unique App ID for V2

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

const getShortId = (uid) => uid ? uid.slice(-4).toUpperCase() : "0000";

const safeFormatDate = (dateStr) => {
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

export default function App() {
  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [appMode, setAppMode] = useState(null); // 'sharing' or 'donation'
  const [currentTab, setCurrentTab] = useState('explore'); // 'explore', 'activity', 'inbox' (admin)

  // Data State
  const [books, setBooks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Auth & UI States
  const [authView, setAuthView] = useState('login'); 
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showMpin, setShowMpin] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');

  // Modals
  const [selectedBook, setSelectedBook] = useState(null);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [showCommunityBoard, setShowCommunityBoard] = useState(false);
  const [isAddingSuggestion, setIsAddingSuggestion] = useState(false);
  const [isRequestingBorrow, setIsRequestingBorrow] = useState(false);
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showAdminBroadcast, setShowAdminBroadcast] = useState(false);

  // Input States
  const [tempName, setTempName] = useState(''); 
  const [tempClass, setTempClass] = useState('10th');
  const [tempMobile, setTempMobile] = useState('');
  const [tempMpin, setTempMpin] = useState('');
  const [tempIsPrivate, setTempIsPrivate] = useState(false);
  const [loginMobile, setLoginMobile] = useState('');
  const [loginMpin, setLoginMpin] = useState('');
  const [adminId, setAdminId] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookCategory, setNewBookCategory] = useState('Maths');
  const [newBookClass, setNewBookClass] = useState('10th');
  const [newBookRemark, setNewBookRemark] = useState(''); 
  const [bookImageUrl, setBookImageUrl] = useState('');
  const [borrowMsg, setBorrowMsg] = useState('');
  const [borrowMobile, setBorrowMobile] = useState(''); 
  const [replyInput, setReplyInput] = useState({ reqUid: '', text: '' });
  const [newPagesRead, setNewPagesRead] = useState('');
  const [reportText, setReportText] = useState('');
  const [suggestType, setSuggestType] = useState('demand'); 
  const [suggestMsg, setSuggestMsg] = useState('');

  const fileInputRef = useRef(null);

  // --- CORE FUNCTIONS ---

  const handleNumericInput = (val, setter, limit) => {
    setter(val.replace(/\D/g, '').slice(0, limit));
  };

  // 1. Auth Init
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

  // 2. Real-time Subscriptions
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

  // 3. Filtered Books Logic (Highly Optimized)
  const filteredBooksList = useMemo(() => {
    let list = books;
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
    return [...list].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [books, appMode, currentTab, selectedCategory, selectedClassFilter, searchTerm, user]);

  // --- ACTIONS ---

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfile(null); setAppMode(null); setIsAdminAuth(false);
      setCurrentTab('explore'); setShowLogoutConfirm(false); setIsAuthModalOpen(true);
    } catch (e) { console.error(e); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (tempMobile.length !== 10 || tempMpin.length !== 4) return;
    try {
      setIsLoading(true);
      const regRef = doc(db, 'artifacts', appId, 'public', 'data', 'mobile_registry', tempMobile);
      const checkSnap = await getDoc(regRef);
      if (checkSnap.exists()) { setAuthError('Mobile registered. Login.'); setIsLoading(false); return; }
      const pData = { name: tempName.trim(), studentClass: tempClass, mobile: tempMobile, mpin: tempMpin, isPrivate: tempIsPrivate, shortId: getShortId(user.uid) };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), pData);
      await setDoc(regRef, { uid: user.uid, mpin: tempMpin });
      setProfile(pData); setIsAuthModalOpen(false);
    } catch (err) { setAuthError('Error.'); } finally { setIsLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      setIsLoading(true);
      const snap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'mobile_registry', loginMobile));
      if (!snap.exists()) { setAuthError('Number not found.'); return; }
      const data = snap.data();
      if (data.mpin !== loginMpin) { setAuthError('Wrong PIN!'); return; }
      const pSnap = await getDoc(doc(db, 'artifacts', appId, 'users', data.uid, 'profile', 'data'));
      if (pSnap.exists()) { setProfile(pSnap.data()); setIsAuthModalOpen(false); }
    } catch (err) { setAuthError('Login Failed'); } finally { setIsLoading(false); }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminId.toLowerCase() === 'admin' && adminKey === 'admin9893@') {
      setIsAdminAuth(true);
      setProfile({ name: "School Admin", studentClass: "Staff", mobile: "9999999999", isPrivate: false, shortId: "ROOT" });
      setIsAuthModalOpen(false);
    } else setAuthError('Invalid Access Key');
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
      setIsAddingBook(false); setNewBookTitle(''); setNewBookAuthor(''); setBookImageUrl(''); setNewBookRemark('');
    } catch (err) { alert("Error adding book"); } finally { setIsPublishing(false); }
  };

  const handleRequestBorrow = async (e) => {
    e.preventDefault();
    if (!selectedBook || borrowMobile.length !== 10) return;
    try {
      setIsPublishing(true);
      const reqObj = { uid: user.uid, name: profile.name, studentClass: profile.studentClass, contact: borrowMobile, message: borrowMsg, ownerReply: "", timestamp: new Date().toISOString() };
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { waitlist: arrayUnion(reqObj) });
      setIsReportingIssue(false); setSelectedBook(null); alert("Request Sent!");
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

  const handleBroadcast = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), { message: broadcastMsg, createdAt: serverTimestamp(), sender: "School Admin" });
      setBroadcastMsg(''); setShowAdminBroadcast(false); alert("Broadcasted!");
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

  const handleExportCSV = () => {
    if (books.length === 0) return;
    const headers = ["Title", "Author", "Category", "For Class", "Holder", "Contact"];
    const rows = books.map(b => [`"${b.title}"`, `"${b.author}"`, `"${b.category}"`, `"${b.bookClass}"`, `"${b.currentOwner}"`, `'${b.contact}`]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "Library_Report.csv";
    link.click();
  };

  const handleDeleteBook = async () => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id)); setSelectedBook(null); setShowDeleteConfirm(false); } catch (e) { console.error(e); }
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
      const updatedHistory = [...(selectedBook.history || [])];
      updatedHistory.push({ owner: selectedBook.pendingOwner, startDate: today, action: 'Transferred' });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { 
        currentOwner: selectedBook.pendingOwner, ownerClass: selectedBook.pendingOwnerClass, ownerId: selectedBook.pendingRequesterId, contact: selectedBook.pendingContact, isPrivate: selectedBook.isPrivate, history: updatedHistory, since: today, handoverStatus: 'available', pendingRequesterId: null, pendingOwner: null,
        "readingProgress.started": false, "readingProgress.pagesRead": 0, "readingProgress.lastUpdated": today
      });
      setSelectedBook(null);
    } catch (e) { console.error(e); }
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id), { "readingProgress.started": true, "readingProgress.pagesRead": Number(newPagesRead), "readingProgress.lastUpdated": new Date().toISOString() });
      setIsUpdatingProgress(false); setSelectedBook(null);
    } catch (e) { console.error(e); }
  };

  const handleSendSupport = async (e) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'support'), { message: reportText, senderName: profile.name, senderClass: profile.studentClass, senderMobile: profile.mobile, senderUid: user.uid, createdAt: serverTimestamp() });
      setReportText(''); setIsReportingIssue(false); alert("Sent!");
    } catch (e) { console.error(e); }
  };

  // --- UI RENDER ---

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
            {authError && <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black border border-rose-100 animate-bounce uppercase tracking-widest text-center">{authError}</div>}
            {authView === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block tracking-widest">Mobile Number</label><input required type="tel" maxLength={10} className="w-full px-6 py-5 bg-slate-50 rounded-[2rem] font-bold border-2 border-slate-100 focus:border-blue-600 outline-none" value={loginMobile} onChange={e => handleNumericInput(e.target.value, setLoginMobile, 10)} /></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block tracking-widest">4-Digit PIN</label><div className="relative text-left"><Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input required type={showMpin ? "text" : "password"} maxLength={4} placeholder="••••" className="w-full pl-14 pr-16 py-5 bg-slate-50 rounded-[2rem] font-black text-2xl border-2 border-slate-100 focus:border-blue-600 outline-none tracking-[0.5em]" value={loginMpin} onChange={e => handleNumericInput(e.target.value, setLoginMpin, 4)} /><button type="button" onClick={() => setShowMpin(!showMpin)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 p-2">{showMpin ? <EyeOff size={20}/> : <Eye size={20}/>}</button></div></div>
                <button type="submit" disabled={isLoading} className="w-full py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl mt-6 bg-blue-600 text-white active:scale-95 transition-all">{isLoading ? <Loader2 className="animate-spin mx-auto"/> : "Unlock Dashboard"}</button>
              </form>
            )}
            {authView === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Name" className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] font-bold border-2 border-slate-100 outline-none" value={tempName} onChange={e => setTempName(e.target.value)} />
                  <select className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] font-bold border-2 border-slate-100 outline-none" value={tempClass} onChange={e => setTempClass(e.target.value)}>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <input required type="tel" maxLength={10} placeholder="Mobile" className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] font-bold border-2 border-slate-100 focus:border-blue-600 outline-none" value={tempMobile} onChange={e => handleNumericInput(e.target.value, setTempMobile, 10)} />
                <input required type="password" maxLength={4} placeholder="Set 4-PIN" className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] font-black text-xl text-center tracking-[0.3em] border-2 border-slate-100 focus:border-blue-600 outline-none" value={tempMpin} onChange={e => handleNumericInput(e.target.value, setTempMpin, 4)} />
                <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100 flex items-center justify-between shadow-sm">
                   <div className="flex items-center gap-2"><ShieldCheck className="text-blue-600" size={18} /><span className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-left">Hide Number?</span></div>
                   <button type="button" onClick={() => setTempIsPrivate(!tempIsPrivate)} className={`w-12 h-6 rounded-full relative transition-colors ${tempIsPrivate ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${tempIsPrivate ? 'right-1' : 'left-1'}`} /></button>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl mt-6 bg-slate-900 text-white transition-all shadow-slate-200">Register Profile</button>
              </form>
            )}
            {authView === 'admin' && (
              <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block tracking-widest">Admin ID</label><input required placeholder="admin" className="w-full px-6 py-5 bg-slate-50 rounded-[2rem] font-bold border-2 border-slate-100 focus:border-red-600 outline-none transition-all" value={adminId} onChange={e => setAdminId(e.target.value)} /></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block tracking-widest">Secret Key</label><input required type="password" placeholder="••••" className="w-full px-6 py-5 bg-slate-50 rounded-[2rem] font-bold border-2 border-slate-100 focus:border-red-600 outline-none transition-all" value={adminKey} onChange={e => setAdminKey(e.target.value)} /></div>
                <button type="submit" className="w-full py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl mt-6 bg-red-600 text-white shadow-red-100">Unlock root access</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {!appMode ? (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
          <div className="mb-12 flex flex-col items-center relative text-center">
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="bg-blue-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-200 animate-in slide-in-from-top duration-700"><BookOpen className="text-white w-12 h-12" /></div>
              <button onClick={() => setShowNotifyModal(true)} className="absolute -top-3 -right-3 bg-rose-500 text-white w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-xl animate-bounce">
                <Bell size={18} fill="currentColor" />
              </button>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-3">BookShare</h1>
            <div className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">@{profile?.name} {isAdminAuth && "(ROOT)"}</div>
            <button onClick={() => setShowLogoutConfirm(true)} className="text-red-400 hover:text-red-500 font-black uppercase text-[10px] flex items-center gap-2 mt-4 transition-colors"><LogOut size={14} /> Logout</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
            <button onClick={() => {setAppMode('sharing'); setCurrentTab('explore');}} className="group bg-white p-8 rounded-[3rem] shadow-xl border flex flex-col items-center transition-all hover:border-blue-200 hover:-translate-y-2"><Users size={40} className="mb-4 text-blue-600 group-hover:scale-110 transition-transform" /><h2 className="text-2xl font-black">Sharing Hub</h2></button>
            <button onClick={() => {setAppMode('donation'); setCurrentTab('explore');}} className="group bg-white p-8 rounded-[3rem] shadow-xl border flex flex-col items-center transition-all hover:border-rose-200 hover:-translate-y-2"><Heart size={40} className="mb-4 text-rose-600 group-hover:scale-110 transition-transform" /><h2 className="text-2xl font-black">Donation Hub</h2></button>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <button onClick={() => setShowCommunityBoard(true)} className="flex items-center gap-3 bg-blue-50/50 px-6 py-3 rounded-full hover:bg-blue-100 border border-blue-100 transition-all shadow-sm"><Megaphone size={18} className="text-blue-600 group-hover:rotate-12 transition-transform"/><span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Community Board</span></button>
            <button onClick={() => setIsReportingIssue(true)} className="flex items-center gap-3 bg-white px-6 py-3 rounded-full border-2 hover:bg-slate-50 transition-all active:scale-95 group shadow-sm"><Headset size={18} className="text-slate-500 group-hover:text-blue-600 transition-colors"/><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Admin Support</span></button>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <header className={`bg-white sticky top-0 z-40 p-4 border-b flex justify-between items-center ${isAdminAuth ? 'border-red-100 border-b-2' : ''}`}>
            <div className="flex items-center gap-4 text-left"><button onClick={() => setAppMode(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronLeft size={24}/></button><div><h1 className="text-lg font-black uppercase tracking-tight">{appMode} Hub</h1><div className="text-[9px] font-black uppercase text-slate-400">{currentTab === 'explore' ? 'Student Library' : 'My Activity'}</div></div></div>
            <div className="flex items-center gap-2 text-left">
              <button onClick={() => setShowNotifyModal(true)} className="p-3 bg-rose-50 rounded-2xl text-rose-600 hover:bg-rose-100 transition-colors shadow-sm"><Bell size={20}/></button>
              <button onClick={() => setIsAddingBook(true)} className={`${appMode === 'sharing' ? 'bg-blue-600' : 'bg-rose-600'} text-white h-12 px-5 rounded-2xl flex items-center gap-2 shadow-xl active:scale-90 transition-all text-center`}><Plus size={20}/><span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Add Book</span></button>
            </div>
          </header>
          
          {currentTab === 'explore' && (
            <div className="max-w-5xl mx-auto p-4 space-y-4 animate-in slide-in-from-top duration-300 text-center">
              <div className="relative text-center"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input placeholder="Search titles..." className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl font-bold focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none text-left" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
              
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {['All', ...CATEGORIES].map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase border whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500'}`}>{cat}</button>)}
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 border-t pt-4">
                <div className="flex items-center gap-2 px-3 text-slate-400"><Filter size={14}/> <span className="text-[9px] font-black uppercase tracking-tighter">Class:</span></div>
                {['All', ...CLASSES].map(cl => <button key={cl} onClick={() => setSelectedClassFilter(cl)} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase border whitespace-nowrap transition-all ${selectedClassFilter === cl ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100'}`}>{cl}</button>)}
              </div>
            </div>
          )}

          <main className="max-w-5xl mx-auto p-4 pb-24 text-center">
            {currentTab === 'inbox' && isAdminAuth ? (
              <div className="space-y-6 animate-in slide-in-from-bottom duration-500 text-center">
                <div className="flex flex-col gap-4 text-left">
                  <div className="flex justify-between items-center bg-red-50 p-6 rounded-[2.5rem] border border-red-100 shadow-sm"><div><h2 className="text-xl font-black text-red-900 text-left">Admin Control</h2><p className="text-[9px] font-bold text-red-600 uppercase tracking-widest text-left">Broadcast & Records</p></div><button onClick={handleExportCSV} className="bg-red-600 text-white p-4 rounded-2xl shadow-xl active:scale-95 transition-all text-center"><Download size={20}/></button></div>
                  <button onClick={() => setShowAdminBroadcast(true)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl active:scale-95 text-center"><Volume2 size={20}/> Broadcast Announcement</button>
                </div>
                {supportMessages.map(msg => <div key={msg.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm text-left text-left text-left text-left"><div className="text-sm font-black">@{msg.senderName} (Class {msg.senderClass}) | Mob: {msg.senderMobile}</div><p className="mt-4 text-slate-700 bg-slate-50 p-5 rounded-[2rem] italic">"{msg.message}"</p></div>)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
                {optimizedFilteredBooks.map(book => (
                  <div key={book.id} onClick={() => setSelectedBook(book)} className="bg-white rounded-[2.5rem] overflow-hidden border shadow-sm cursor-pointer relative group transition-all hover:shadow-xl hover:-translate-y-1">
                    <div className="aspect-[4/5] bg-slate-100 overflow-hidden relative text-center">
                      {book.imageUrl ? <img src={book.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-[10px]">NO COVER</div>}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-black shadow-sm text-slate-900 uppercase">CL: {book.bookClass}</div>
                    </div>
                    <div className="p-4 text-left text-left text-left text-left"><h3 className="font-black text-sm truncate">{book.title}</h3><div className="text-[9px] text-slate-400 font-bold mt-2 uppercase text-left">{book.ownerClass} Holder • {calculateDaysDiff(book.since)}d held</div></div>
                  </div>
                ))}
              </div>
            )}
          </main>

          <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t p-4 flex justify-around shadow-2xl z-40">
            <button onClick={() => setCurrentTab('explore')} className={`flex flex-col items-center gap-1 active:scale-90 transition-all ${currentTab === 'explore' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}><LayoutGrid/><span className="text-[8px] font-black uppercase">Library</span></button>
            {isAdminAuth ? <button onClick={() => setCurrentTab('inbox')} className={`flex flex-col items-center gap-1 active:scale-90 transition-all ${currentTab === 'inbox' ? 'text-red-600 scale-110' : 'text-slate-300'}`}><Inbox/><span className="text-[8px] font-black uppercase tracking-widest text-center">Admin</span></button> : <button onClick={() => setCurrentTab('activity')} className={`flex flex-col items-center gap-1 active:scale-90 transition-all ${currentTab === 'activity' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}><Bookmark/><span className="text-[8px] font-black uppercase text-center text-center">Activity</span></button>}
          </nav>
        </div>
      )}

      {/* MODAL: BOOK DETAILS */}
      {selectedBook && !showDeleteConfirm && !isUpdatingProgress && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className={`bg-white w-full max-w-lg rounded-t-[3.5rem] sm:rounded-[3.5rem] overflow-hidden animate-in slide-in-from-bottom duration-500 my-auto shadow-2xl ${isAdminAuth ? 'border-4 border-red-100' : ''} text-left text-left text-left`}>
            <div className="h-64 relative bg-slate-200">
              {selectedBook.imageUrl ? <img src={selectedBook.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black uppercase text-xs text-center text-center">No Cover</div>}
              <div className="absolute top-6 right-6 flex gap-2">{(isAdminAuth || (selectedBook.ownerId === user.uid && selectedBook.history?.length === 1)) && <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all text-center"><Trash2 size={20} /></button>}<button onClick={() => setSelectedBook(null)} className="bg-black/20 backdrop-blur-md text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg text-center"><X size={20} /></button></div>
            </div>
            <div className="p-8 bg-white max-h-[90dvh] overflow-y-auto no-scrollbar text-left text-left text-left text-left">
              <h2 className="text-2xl font-black mb-1">{selectedBook.title}</h2>
              <div className="text-slate-400 font-bold text-xs mb-8 uppercase tracking-widest text-left flex items-center gap-2"><div className="w-4 h-0.5 bg-slate-200"></div> by {selectedBook.author}</div>
              
              <div className="bg-slate-50 p-6 rounded-[3rem] border border-slate-100 flex items-center gap-4 shadow-sm text-left mb-8 relative text-left">
                 <div className={`p-3 rounded-2xl ${isAdminAuth ? 'bg-red-100 text-red-600' : 'bg-white text-blue-600 shadow-sm'}`}><Phone size={20}/></div>
                 <div className="text-left text-sm font-black tracking-widest text-slate-800">
                    {(isAdminAuth || !selectedBook.isPrivate || selectedBook.ownerId === user.uid) ? (
                      <>{selectedBook.contact}{selectedBook.isPrivate && <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[8px] uppercase font-black ml-2 animate-pulse text-left">God Mode</span>}</>
                    ) : (
                      <span className="italic flex items-center gap-2 text-slate-400 font-bold text-left"><EyeOff size={14}/> Hidden Number</span>
                    )}
                 </div>
              </div>

              {/* BORROW FORM UI */}
              {user.uid !== selectedBook.ownerId && !selectedBook.waitlist?.some(r => r.uid === user.uid) && (
                 <form onSubmit={handleRequestBorrow} className="space-y-4 mb-8 bg-blue-50 p-6 rounded-[2.5rem] border border-blue-100 text-left text-left text-left">
                    <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-2 text-left">Interested? Send Request</p>
                    <textarea required placeholder="Message for owner..." className="w-full p-4 bg-white border rounded-2xl text-sm outline-none focus:ring-2 ring-blue-200 resize-none text-left" value={borrowMsg} onChange={e => setBorrowMsg(e.target.value)} />
                    <input required type="tel" maxLength={10} placeholder="Confirm your mobile" className="w-full p-4 bg-white border rounded-2xl text-sm outline-none focus:ring-2 ring-blue-200 text-left" value={borrowMobile} onChange={e => handleNumericInput(e.target.value, setBorrowMobile, 10)} />
                    <button type="submit" disabled={isPublishing || borrowMobile.length !== 10} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 text-center">
                       {isPublishing ? <Loader2 className="animate-spin" size={16}/> : <><Send size={16}/> Send Borrow Request</>}
                    </button>
                 </form>
              )}

              {/* REPLY LOGIC FOR BORROWER */}
              {selectedBook.waitlist?.filter(r => r.uid === user.uid).map((myReq, idx) => (
                <div key={idx} className="mb-8 space-y-4">
                  {myReq.ownerReply && (
                    <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] shadow-sm text-left animate-in slide-in-from-right">
                      <div className="flex items-center gap-2 mb-2"><Reply size={16} className="text-emerald-600"/><p className="text-[10px] font-black uppercase text-emerald-600">Owner's Reply</p></div>
                      <p className="text-sm font-black text-emerald-900">"{myReq.ownerReply}"</p>
                    </div>
                  )}
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 text-left shadow-sm"><div className="text-[8px] font-black uppercase text-slate-400 mb-1">Book Class</div><div className="font-black text-sm flex items-center gap-2 text-left"><GraduationCap size={16} className="text-blue-600" /> {selectedBook.bookClass}</div></div>
                <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 text-left shadow-sm text-left"><div className="text-[8px] font-black uppercase text-slate-400 mb-1">Since</div><div className="font-black text-sm flex items-center gap-2 text-left"><Clock size={16} className="text-emerald-600" /> {calculateDaysDiff(selectedBook.since)} Days</div></div>
              </div>

              {/* OWNER REQUEST HUB */}
              {(user.uid === selectedBook.ownerId || isAdminAuth) && selectedBook.waitlist?.length > 0 && (
                <div className={`mt-8 space-y-4 border-2 p-6 rounded-[2.5rem] shadow-sm text-left ${isAdminAuth ? 'bg-red-50/20 border-red-100' : 'bg-blue-50/20 border-blue-100'}`}>
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-4 flex items-center gap-2 text-left"><Users size={16}/> Requests ({selectedBook.waitlist.length})</p>
                   {selectedBook.waitlist.map((req, i) => (
                     <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mb-4">
                        <div className="flex justify-between items-start mb-3 text-left">
                           <div className="text-left text-left"><div className="text-sm font-black">@{req.name} (Cl: {req.studentClass})</div><div className="text-[8px] font-bold text-slate-400 uppercase mt-1">Mobile: {req.contact}</div></div>
                           <button onClick={() => handleApproveFromWaitlist(req)} className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase shadow-lg transition-all active:scale-95 text-center text-center">Approve</button>
                        </div>
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-2xl italic border">"{req.message}"</p>
                        <div className="mt-4 pt-4 border-t border-slate-50">
                          {req.ownerReply ? (
                            <div className="bg-emerald-50 p-3 rounded-2xl flex items-center gap-2">
                               <CheckCircle2 size={14} className="text-emerald-600"/>
                               <p className="text-[10px] font-bold text-emerald-800">Reply: {req.ownerReply}</p>
                               <button onClick={() => setReplyInput({ reqUid: req.uid, text: req.ownerReply })} className="text-[8px] font-black uppercase text-blue-600 ml-auto">Edit</button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                               <input placeholder="Coordination reply..." className="flex-1 bg-slate-100 border-none text-[11px] font-bold px-4 py-2.5 rounded-xl outline-none" value={replyInput.reqUid === req.uid ? replyInput.text : ''} onChange={(e) => setReplyInput({ reqUid: req.uid, text: e.target.value })} />
                               <button onClick={() => handleOwnerReply(req.uid)} className="bg-slate-900 text-white p-2.5 rounded-xl active:scale-90 transition-all"><Send size={14}/></button>
                            </div>
                          )}
                        </div>
                     </div>
                   ))}
                </div>
              )}
              {selectedBook.handoverStatus === 'confirming_receipt' && selectedBook.pendingRequesterId === user.uid && <button onClick={handleConfirmReceipt} className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase mt-8 shadow-xl animate-bounce text-center text-center">Confirm Receipt</button>}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD BOOK (Integrated Class Selection) */}
      {isAddingBook && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
          <form onSubmit={handleAddBook} className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl max-h-[90dvh] overflow-y-auto no-scrollbar animate-in duration-300 text-left">
            <div className="flex justify-between items-center mb-8 text-left text-left"><h2 className="text-2xl font-black tracking-tight text-left">List a Book</h2><button type="button" onClick={() => setIsAddingBook(false)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all text-center"><X size={20}/></button></div>
            <div className="space-y-5 text-left">
              <div onClick={() => !isLoading && fileInputRef.current.click()} className="aspect-video bg-slate-50 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-blue-200 transition-all relative">
                {(isLoading || isPublishing) && <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 font-black uppercase text-[10px] animate-pulse text-center">Processing...</div>}
                {bookImageUrl ? <img src={bookImageUrl} className="w-full h-full object-cover" /> : <><Camera size={48} className="text-slate-200 mb-2 group-hover:text-blue-300 transition-colors text-center" /><div className="text-[10px] font-black uppercase tracking-widest text-center">Add Photo</div></>}<input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
              </div>
              <input required placeholder="Book Title" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-600 transition-all shadow-sm shadow-inner" value={newBookTitle} onChange={e => setNewBookTitle(e.target.value)} />
              
              <div className="grid grid-cols-2 gap-3">
                 <div><label className="text-[8px] font-black uppercase text-slate-400 ml-2">Category</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase text-[10px] outline-none shadow-sm shadow-inner" value={newBookCategory} onChange={e => setNewBookCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                 <div><label className="text-[8px] font-black uppercase text-slate-400 ml-2">For Class</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase text-[10px] outline-none shadow-sm shadow-inner" value={newBookClass} onChange={e => setNewBookClass(e.target.value)}>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>

              <textarea placeholder="Advice or note..." className="w-full h-32 p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-sm outline-none focus:border-blue-600 resize-none transition-all shadow-sm shadow-inner" value={newBookRemark} onChange={e => setNewBookRemark(e.target.value)} />
              <button type="submit" disabled={isLoading || isPublishing} className={`w-full py-5 rounded-[2rem] font-black uppercase text-xs text-white shadow-2xl active:scale-95 transition-all text-center ${appMode === 'sharing' ? 'bg-blue-600 shadow-blue-100' : 'bg-rose-600 shadow-rose-100'} disabled:opacity-50`}>{isPublishing ? "Publishing..." : "Publish Listing"}</button>
            </div>
          </form>
        </div>
      )}

      {/* REUSABLE MODALS: Support, Logout, Notifications, Delete, Board, Broadcast */}
      {isReportingIssue && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[130] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 text-left">
             <div className="flex justify-between items-center mb-8 text-left"><div className="flex items-center gap-4 text-left"><div className="bg-blue-600 p-4 rounded-3xl text-white shadow-xl shadow-blue-100 text-left"><Headset size={28} /></div><div className="text-left text-left"><h2 className="text-2xl font-black">Admin Support</h2><p className="text-[9px] font-black text-blue-600 uppercase">Secure Helpdesk</p></div></div><button onClick={() => setIsReportingIssue(false)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors text-center"><X size={20}/></button></div>
             <form onSubmit={handleSendSupport} className="space-y-6 text-left"><textarea required placeholder="Message for Admin..." className="w-full h-48 p-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-bold text-sm outline-none focus:border-blue-600 transition-all shadow-inner resize-none text-left" value={reportText} onChange={e => setReportText(e.target.value)} /><button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 text-center">Submit</button></form>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 text-center text-left">
          <div className="bg-white w-full max-sm:w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl animate-in zoom-in-95 text-left text-center">
            <div className="bg-red-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-red-600 shadow-xl text-center"><LogOut size={48} /></div>
            <h2 className="text-3xl font-black mb-3 text-center text-center tracking-tight text-center">Logout?</h2>
            <div className="flex gap-4 mt-8 text-center">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 font-black text-slate-400 text-xs text-center uppercase tracking-widest text-center">Stay</button>
              <button onClick={handleLogout} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all text-left text-center text-center">Logout</button>
            </div>
          </div>
        </div>
      )}

      {showAdminBroadcast && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[210] flex items-center justify-center p-4">
          <form onSubmit={handleBroadcast} className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in-95 text-left text-left">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-left"><Volume2 className="text-red-600"/> Broadcast Message</h2>
            <textarea required placeholder="Notice for students..." className="w-full h-44 p-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-bold text-sm focus:border-red-600 outline-none transition-all mb-6 shadow-inner resize-none text-left" value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} />
            <div className="flex gap-4 text-left"><button type="button" onClick={() => setShowAdminBroadcast(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] text-center">Cancel</button><button type="submit" className="flex-1 bg-red-600 text-white py-5 rounded-3xl font-black uppercase text-xs active:scale-95 shadow-xl text-center">Send Notification</button></div>
          </form>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-center text-left text-left">
          <div className="bg-white w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl animate-in zoom-in-95 text-left text-center text-center">
            <div className="bg-red-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-red-600 shadow-xl text-center"><Trash2 size={48} /></div>
            <h2 className="text-3xl font-black mb-3 text-center tracking-tight text-center">Delete?</h2>
            <div className="flex gap-4 mt-8 text-center">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 font-black text-slate-400 text-xs text-center uppercase tracking-widest text-center">Keep</button>
              <button onClick={handleDeleteBook} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 shadow-red-100 transition-all text-center">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showCommunityBoard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex justify-center sm:items-center items-end p-0 sm:p-4 text-left text-left">
          <div className="bg-white w-full max-w-2xl sm:rounded-[3rem] rounded-t-[3rem] h-[90vh] sm:h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500 shadow-2xl text-left">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center text-left shrink-0">
              <div className="flex items-center gap-3 text-left"><div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100"><Megaphone size={24} /></div><div className="text-left"><h2 className="text-xl font-black text-left tracking-tight">Community Board</h2><div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Public Student Chat</div></div></div>
              <button onClick={() => setShowCommunityBoard(false)} className="bg-slate-100 p-2.5 rounded-xl hover:bg-slate-200 transition-colors text-center"><X size={20} /></button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/30 text-left">
              {suggestions.map(s => (
                <div key={s.id} className={`p-6 rounded-[2.5rem] border transition-all hover:scale-[1.02] ${s.type === 'demand' ? 'bg-white border-blue-100 shadow-sm' : 'bg-rose-50/50 border-rose-100 shadow-sm'} text-left relative group`}>
                  <div className="flex items-center justify-between mb-4 text-left"><span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${s.type === 'demand' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>{s.type}</span><span className="text-[9px] font-bold text-slate-300 text-left">{safeFormatDate(s.createdAt?.toDate?.()?.toISOString())}</span></div>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed italic text-left">"{s.message}"</p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-left"><div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">{s.userName?.[0]}</div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">@{s.userName} (Class {s.userClass})</div></div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-slate-100 bg-white text-left text-center"><button onClick={() => setIsAddingSuggestion(true)} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs shadow-2xl active:scale-95 transition-all text-center">New Public Message</button></div>
          </div>
        </div>
      )}

    </div>
  );
}