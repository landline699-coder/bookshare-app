/**
 * 📚 BookShare Pro - Community Board Version
 * Features:
 * - Community Board: Public messaging for book demands and suggestions.
 * - Private Admin Messaging: Secure support inbox for complaints.
 * - School Identity: Mandatory Name, Class, and Mobile.
 * - Smart Deletion: Owner deletes before transfer, Admin anytime.
 * - Progress Tracking: 3-day reminders & 30-day return limit.
 */

import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  doc, 
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { 
  Book, 
  Plus, 
  BookOpen,
  Camera,
  Loader2,
  X,
  AlertCircle,
  Search,
  ShieldCheck,
  Bell,
  Heart,
  Users,
  ChevronLeft,
  MessageSquare,
  Lightbulb,
  MessageCircle,
  Phone,
  Instagram,
  History,
  Calendar,
  Clock,
  UserCheck,
  Hash,
  Quote,
  Lock,
  Trash2,
  LayoutGrid,
  Bookmark,
  ChevronRight,
  CheckCircle2,
  Timer,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  EyeOff,
  Eye,
  Send,
  Info,
  LifeBuoy,
  Inbox,
  Megaphone
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
const appId = 'book-exchange-2025-v1'; 

const CATEGORIES = ["Maths", "Biology", "Commerce", "Arts", "Science", "Competition related", "Other"];
const CLASSES = ["6th", "7th", "8th", "9th", "10th", "11th", "12th", "College", "Other"];

// --- UTILITY HELPERS ---
const safeFormatDate = (dateStr) => {
  if (!dateStr) return 'Recently';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString('en-IN');
};

const getShortId = (uid) => {
  if (!uid) return "0000";
  return uid.slice(-4).toUpperCase();
};

const calculateDaysDiff = (dateStr) => {
  if (!dateStr) return 0;
  const start = new Date(dateStr);
  const diffTime = Math.abs(new Date() - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function App() {
  // App State
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); 
  const [appMode, setAppMode] = useState(null); 
  const [currentTab, setCurrentTab] = useState('explore'); 
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  
  // UI Controls
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [showCommunityBoard, setShowCommunityBoard] = useState(false);
  const [isAddingSuggestion, setIsAddingSuggestion] = useState(false);
  const [isRequestingTransfer, setIsRequestingTransfer] = useState(false);
  const [showNewsPanel, setShowNewsPanel] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isSettingName, setIsSettingName] = useState(false);
  const [adminPassAttempt, setAdminPassAttempt] = useState('');
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Data States
  const [notifications, setNotifications] = useState([]);
  const [adminMsg, setAdminMsg] = useState('');
  const [supportMessages, setSupportMessages] = useState([]);

  // Form States
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookCategory, setNewBookCategory] = useState('Maths');
  const [newBookRemark, setNewBookRemark] = useState(''); 
  const [bookImageUrl, setBookImageUrl] = useState('');
  
  // Profile Setup States
  const [tempName, setTempName] = useState(''); 
  const [tempClass, setTempClass] = useState('10th');
  const [tempMobile, setTempMobile] = useState('');
  const [tempIsPrivate, setTempIsPrivate] = useState(false);

  // Borrow/Board States
  const [borrowMsg, setBorrowMsg] = useState('');
  const [borrowMobile, setBorrowMobile] = useState(''); 
  const [newPagesRead, setNewPagesRead] = useState('');
  const [reportText, setReportText] = useState('');
  const [suggestType, setSuggestType] = useState('demand'); 
  const [suggestMsg, setSuggestMsg] = useState('');

  const fileInputRef = useRef(null);

  // 1. Authentication & Profile Fetch
  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (error) { console.error("Auth failure:", error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, async (u) => { 
      if (u) {
        setUser(u);
        const profileRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data');
        const docSnap = await getDoc(profileRef);
        if (docSnap.exists()) { setProfile(docSnap.data()); } 
        else { setIsSettingName(true); }
      } 
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Data Listeners
  useEffect(() => {
    if (!user || !profile) return;
    const booksRef = collection(db, 'artifacts', appId, 'public', 'data', 'books');
    const unsubBooks = onSnapshot(booksRef, (snap) => {
      setBooks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const suggestRef = collection(db, 'artifacts', appId, 'public', 'data', 'suggestions');
    const unsubSuggest = onSnapshot(suggestRef, (snap) => {
      setSuggestions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    const notifyRef = collection(db, 'artifacts', appId, 'public', 'data', 'notifications');
    const unsubNotify = onSnapshot(notifyRef, (snap) => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    const supportRef = collection(db, 'artifacts', appId, 'public', 'data', 'support');
    const unsubSupport = onSnapshot(supportRef, (snap) => {
      setSupportMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    return () => { unsubBooks(); unsubNotify(); unsubSuggest(); unsubSupport(); };
  }, [user, profile]);

  // 3. Search and Category Filter
  useEffect(() => {
    let result = books;
    if (appMode) result = result.filter(b => b.type === appMode);
    if (currentTab === 'activity') {
      result = result.filter(b => b.ownerId === user.uid || (b.waitlist && b.waitlist.some(r => r.uid === user.uid)) || b.pendingRequesterId === user.uid);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(b => b.title?.toLowerCase().includes(term) || b.author?.toLowerCase().includes(term));
    }
    if (selectedCategory !== 'All') result = result.filter(b => b.category === selectedCategory);
    result.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    setFilteredBooks(result);
  }, [searchTerm, selectedCategory, books, appMode, currentTab, user]);

  // --- HANDLERS ---

  const handleSetProfile = async (e) => {
    e.preventDefault();
    if (!tempName.trim() || tempMobile.length !== 10 || !user) return;
    try {
      const profileData = { 
        name: tempName.trim(), studentClass: tempClass,
        mobile: tempMobile.trim(), isPrivate: tempIsPrivate,
        shortId: getShortId(user.uid) 
      };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), profileData);
      setProfile(profileData); setIsSettingName(false);
    } catch (err) { console.error("Profile set error:", err); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 5000000) {
      const reader = new FileReader();
      reader.onloadend = () => setBookImageUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBookTitle || !profile || !user) return;
    try {
      const today = new Date().toISOString();
      const displayName = `${profile.name}#${profile.shortId}`;
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'books'), {
        type: appMode, title: newBookTitle, author: newBookAuthor, category: newBookCategory,
        remark: newBookRemark, imageUrl: bookImageUrl, currentOwner: displayName, 
        ownerClass: profile.studentClass, ownerId: user.uid, contact: profile.mobile, 
        isPrivate: profile.isPrivate, since: today, transferPending: false, handoverStatus: 'available',
        waitlist: [], readingProgress: { started: false, pagesRead: 0, lastUpdated: today },
        history: [{ owner: displayName, startDate: today, endDate: null, action: appMode === 'donation' ? 'Donated' : 'Listed' }],
        createdAt: serverTimestamp()
      });
      setIsAddingBook(false); setNewBookTitle(''); setNewBookAuthor(''); setBookImageUrl(''); setNewBookRemark('');
    } catch (err) { console.error("Listing error:", err); }
  };

  const handleRequestWaitlist = async (e) => {
    e.preventDefault();
    if (!selectedBook || !profile || !user || borrowMobile.length !== 10) return;
    try {
      const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id);
      const requestData = { 
        uid: user.uid, name: `${profile.name}#${profile.shortId}`, 
        studentClass: profile.studentClass, contact: borrowMobile, 
        isPrivate: profile.isPrivate, message: borrowMsg, timestamp: new Date().toISOString() 
      };
      await updateDoc(bookRef, { waitlist: arrayUnion(requestData), transferPending: true });
      setIsRequestingTransfer(false); setBorrowMsg(''); setBorrowMobile(''); setSelectedBook(null);
    } catch (err) { console.error("Waitlist error:", err); }
  };

  const handleApproveFromWaitlist = async (reqUser) => {
    if (!selectedBook || !user) return;
    try {
      const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id);
      await updateDoc(bookRef, { 
        handoverStatus: 'confirming_receipt', pendingRequesterId: reqUser.uid, 
        pendingOwner: reqUser.name, pendingOwnerClass: reqUser.studentClass,
        pendingContact: reqUser.contact, isPrivate: reqUser.isPrivate,
        waitlist: arrayRemove(reqUser) 
      });
      setSelectedBook(null);
    } catch (err) { console.error("Approval error:", err); }
  };

  const handleConfirmReceipt = async () => {
    if (!selectedBook || !user) return;
    try {
      const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id);
      const today = new Date().toISOString();
      const updatedHistory = [...(selectedBook.history || [])];
      if (updatedHistory.length > 0) { updatedHistory[updatedHistory.length - 1].endDate = today; }
      updatedHistory.push({ owner: selectedBook.pendingOwner, startDate: today, endDate: null, action: 'Transferred' });
      await updateDoc(bookRef, { 
        currentOwner: selectedBook.pendingOwner, ownerClass: selectedBook.pendingOwnerClass,
        ownerId: selectedBook.pendingRequesterId, contact: selectedBook.pendingContact, 
        isPrivate: selectedBook.isPrivate, history: updatedHistory, since: today, 
        handoverStatus: 'available', transferPending: (selectedBook.waitlist?.length > 1), 
        pendingRequesterId: null, pendingOwner: null, pendingOwnerClass: null, pendingContact: null,
        "readingProgress.started": false, "readingProgress.pagesRead": 0, "readingProgress.lastUpdated": today
      });
      setSelectedBook(null);
    } catch (err) { console.error("Receipt error:", err); }
  };

  const handleAddSuggestion = async (e) => {
    e.preventDefault();
    if (!suggestMsg.trim() || !profile) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), {
        type: suggestType,
        message: suggestMsg,
        userName: `${profile.name}#${profile.shortId}`,
        userClass: profile.studentClass,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setSuggestMsg('');
      setIsAddingSuggestion(false);
    } catch (err) { console.error("Post error:", err); }
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!reportText.trim() || !profile || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'support'), {
        message: reportText, senderName: `${profile.name}#${profile.shortId}`,
        senderClass: profile.studentClass, senderMobile: profile.mobile,
        senderUid: user.uid, createdAt: serverTimestamp()
      });
      setReportText(''); setIsReportingIssue(false);
      alert("Message Admin ko bhej diya gaya hai.");
    } catch (err) { console.error("Report error:", err); }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook || !user) return;
    const isOriginalOwner = selectedBook.ownerId === user.uid && selectedBook.history.length === 1;
    if (isOriginalOwner || isAdminAuth) {
      try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id)); setSelectedBook(null); setShowDeleteConfirm(false); } catch (err) { console.error("Delete error:", err); }
    } else { alert("Only Admin can delete books after transfer."); }
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    if (!selectedBook || !user) return;
    try {
      const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id);
      await updateDoc(bookRef, { "readingProgress.started": true, "readingProgress.pagesRead": Number(newPagesRead), "readingProgress.lastUpdated": new Date().toISOString() });
      setIsUpdatingProgress(false); setNewPagesRead(''); setSelectedBook(null);
    } catch (err) { console.error("Progress error:", err); }
  };

  const handleAdminVerify = (e) => {
    e.preventDefault();
    if (adminPassAttempt === 'admin123') setIsAdminAuth(true);
    else setAdminPassAttempt('');
  };

  const handleNumericInput = (value, setter) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 10);
    setter(numericValue);
  };

  // --- UI RENDER ---

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-white"><div className="text-center animate-pulse"><div className="w-16 h-16 bg-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center"><BookOpen className="text-white" size={32} /></div><div className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Initialising...</div></div></div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      
      {/* IDENTITY SETUP */}
      {isSettingName && (
        <div className="fixed inset-0 bg-white z-[200] flex items-center justify-center p-6 overflow-y-auto">
          <div className="max-w-sm w-full text-center py-10">
            <div className="bg-blue-600 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-100"><UserCheck className="text-white w-10 h-10" /></div>
            <h2 className="text-3xl font-black mb-2 tracking-tight">Set Identity</h2>
            <form onSubmit={handleSetProfile} className="space-y-4 text-left">
              <div><label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Student Name</label><input required placeholder="Rahul Sharma" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-slate-100 focus:border-blue-600 outline-none" value={tempName} onChange={e => setTempName(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Class</label><select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-slate-100 focus:border-blue-600" value={tempClass} onChange={e => setTempClass(e.target.value)}>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Short ID</label><div className="w-full p-4 bg-slate-100 rounded-2xl font-black text-blue-600 flex items-center justify-center">#{getShortId(user.uid)}</div></div>
              </div>
              <div><label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Mobile Number</label><input required type="tel" maxLength={10} placeholder="10 Digit Number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-slate-100 focus:border-blue-600" value={tempMobile} onChange={e => handleNumericInput(e.target.value, setTempMobile)} /></div>
              <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100 flex items-center justify-between">
                 <div className="flex items-center gap-2"><ShieldCheck className="text-blue-600" size={18} /><span className="text-[10px] font-black uppercase text-slate-500">Privacy Mode</span></div>
                 <button type="button" onClick={() => setTempIsPrivate(!tempIsPrivate)} className={`w-12 h-6 rounded-full relative transition-colors ${tempIsPrivate ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${tempIsPrivate ? 'right-1' : 'left-1'}`} /></button>
              </div>
              <button type="submit" disabled={tempMobile.length !== 10} className={`w-full py-5 rounded-3xl font-black uppercase text-xs shadow-2xl mt-6 transition-all ${tempMobile.length === 10 ? 'bg-slate-900 text-white active:scale-95' : 'bg-slate-200 text-slate-400'}`}>Start Reading</button>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {!appMode ? (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-12"><div className="relative mx-auto w-24 h-24 mb-6"><div className="absolute bg-blue-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-200"><BookOpen className="text-white w-12 h-12" /></div></div><h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-3">BookShare</h1><div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">@{profile?.name}<span className="text-blue-600 ml-1">#{profile?.shortId}</span></div></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
            <button onClick={() => {setAppMode('sharing'); setCurrentTab('explore');}} className="group bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center hover:border-blue-200 hover:-translate-y-2 transition-all"><div className="bg-blue-50 p-6 rounded-[2rem] text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg"><Users size={40} /></div><h2 className="text-2xl font-black mb-2">Sharing Hub</h2><div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Borrow & Exchange</div></button>
            <button onClick={() => {setAppMode('donation'); setCurrentTab('explore');}} className="group bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center hover:border-rose-200 hover:-translate-y-2 transition-all"><div className="bg-rose-50 p-6 rounded-[2rem] text-rose-600 mb-6 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-lg"><Heart size={40} /></div><h2 className="text-2xl font-black mb-2">Donation Hub</h2><div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Donate Forever</div></button>
          </div>
          
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <button onClick={() => setShowCommunityBoard(true)} className="flex items-center gap-3 bg-blue-50 px-6 py-3 rounded-full hover:bg-blue-100 transition-all active:scale-95 border border-blue-100 shadow-sm">
              <Megaphone size={18} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Community Board</span>
            </button>
            <button onClick={() => setIsReportingIssue(true)} className="flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-full hover:bg-slate-100 transition-all border border-slate-100 shadow-sm">
              <LifeBuoy size={18} className="text-slate-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Private Support</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <div className="bg-white sticky top-0 z-40 border-b border-slate-100">
            <header className="max-w-5xl mx-auto p-4 flex justify-between items-center">
              <div className="flex items-center gap-4"><button onClick={() => setAppMode(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronLeft size={24} /></button><div><h1 className="text-lg font-black tracking-tight">{appMode === 'sharing' ? 'Sharing' : 'Donation'} Hub</h1><div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{currentTab === 'explore' ? 'Student Library' : 'My Activity'}</div></div></div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowCommunityBoard(true)} className="p-3 bg-slate-50 rounded-2xl text-slate-600 hover:bg-slate-100 transition-colors"><Megaphone size={20} /></button>
                <button onClick={() => setIsAddingBook(true)} className={`${appMode === 'sharing' ? 'bg-blue-600' : 'bg-rose-600'} text-white h-12 px-5 rounded-2xl flex items-center gap-3 shadow-xl transition-all active:scale-90`}><Plus size={20} /><span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Add Book</span></button>
              </div>
            </header>
          </div>

          <main className="max-w-5xl mx-auto p-4 pb-20">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredBooks.map(book => {
                const daysHeld = calculateDaysDiff(book.since);
                return (
                  <div key={book.id} onClick={() => setSelectedBook(book)} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 cursor-pointer hover:shadow-xl transition-all relative group">
                    <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
                       {book.imageUrl ? <img src={book.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><BookOpen size={40} /></div>}
                       {book.waitlist?.length > 0 && <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase shadow-lg flex items-center gap-1"><Users size={10}/> Waiting: {book.waitlist.length}</div>}
                    </div>
                    <div className="p-4"><h3 className="font-black text-sm line-clamp-1">{book.title}</h3><div className="flex justify-between items-center mt-2"><div className="text-[8px] font-black uppercase text-slate-500">Class {book.ownerClass}</div><div className={`text-[8px] font-black uppercase ${daysHeld > 27 ? 'text-red-600' : 'text-slate-400'}`}>{daysHeld}/30d</div></div></div>
                  </div>
                );
              })}
            </div>
          </main>

          {/* BOTTOM NAV */}
          <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-100 z-40 px-6 py-4">
            <div className="max-w-md mx-auto flex justify-around">
               <button onClick={() => setCurrentTab('explore')} className={`flex flex-col items-center gap-1 transition-all ${currentTab === 'explore' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}><LayoutGrid size={24} fill={currentTab === 'explore' ? 'currentColor' : 'none'} /><span className="text-[8px] font-black uppercase">Library</span></button>
               <button onClick={() => setCurrentTab('activity')} className={`flex flex-col items-center gap-1 transition-all ${currentTab === 'activity' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}><Bookmark size={24} fill={currentTab === 'activity' ? 'currentColor' : 'none'} /><span className="text-[8px] font-black uppercase">Activity</span></button>
            </div>
          </div>
        </div>
      )}

      {/* COMMUNITY BOARD OVERLAY */}
      {showCommunityBoard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex justify-center sm:items-center items-end p-0 sm:p-4">
          <div className="bg-white w-full max-w-2xl sm:rounded-[3rem] rounded-t-[3rem] h-[90vh] sm:h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100"><Megaphone size={24} /></div>
                <div><h2 className="text-xl font-black">Community Board</h2><div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Public Demands & Chat</div></div>
              </div>
              <button onClick={() => setShowCommunityBoard(false)} className="bg-slate-100 p-2.5 rounded-xl"><X size={20} /></button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/30">
              {suggestions.map(s => (
                <div key={s.id} className={`p-6 rounded-[2.5rem] border transition-all hover:scale-[1.02] ${s.type === 'demand' ? 'bg-white border-blue-100 shadow-sm' : 'bg-rose-50/50 border-rose-100 shadow-sm'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${s.type === 'demand' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>{s.type}</span>
                    <span className="text-[9px] font-bold text-slate-400">{safeFormatDate(s.createdAt?.toDate?.()?.toISOString())}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed">{s.message}</p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                     <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center text-[10px] font-black uppercase">{s.userName?.[0]}</div>
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">@{s.userName} (Class {s.userClass})</div>
                  </div>
                </div>
              ))}
              {suggestions.length === 0 && <div className="text-center py-20 opacity-20"><Megaphone size={64} className="mx-auto mb-4" /><div className="font-black uppercase text-xs">No public messages yet</div></div>}
            </div>
            <div className="p-6 border-t border-slate-100 bg-white">
              <button onClick={() => setIsAddingSuggestion(true)} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs shadow-2xl active:scale-95 transition-all">Post Public Message</button>
            </div>
          </div>
        </div>
      )}

      {/* POST PUBLIC MESSAGE MODAL */}
      {isAddingSuggestion && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[130] flex items-center justify-center p-4">
          <form onSubmit={handleAddSuggestion} className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black">New Post</h2><button type="button" onClick={() => setIsAddingSuggestion(false)} className="bg-slate-100 p-2.5 rounded-xl"><X size={20}/></button></div>
            <div className="space-y-6">
              <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
                <button type="button" onClick={() => setSuggestType('demand')} className={`flex-grow py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${suggestType === 'demand' ? 'bg-white shadow-xl text-blue-600' : 'text-slate-400'}`}>Book Demand</button>
                <button type="button" onClick={() => setSuggestType('feedback')} className={`flex-grow py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${suggestType === 'feedback' ? 'bg-white shadow-xl text-rose-600' : 'text-slate-400'}`}>Suggestion</button>
              </div>
              <textarea required placeholder="Write your message to all students..." className="w-full h-40 p-5 bg-slate-50 border-2 rounded-3xl font-bold text-sm outline-none focus:border-blue-600 resize-none transition-all shadow-sm" value={suggestMsg} onChange={e => setSuggestMsg(e.target.value)} />
              <button type="submit" className={`w-full py-5 rounded-[2rem] font-black uppercase text-xs text-white shadow-2xl active:scale-95 transition-all ${suggestType === 'demand' ? 'bg-blue-600 shadow-blue-200' : 'bg-rose-600 shadow-rose-200'}`}>Publish Post</button>
            </div>
          </form>
        </div>
      )}

      {/* PRIVATE SUPPORT MODAL */}
      {isReportingIssue && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 text-left">
          <form onSubmit={handleSendReport} className="bg-white w-full max-w-md rounded-[3.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black">Help & Support</h2><button type="button" onClick={() => setIsReportingIssue(false)} className="p-2 bg-slate-100 rounded-xl"><X size={20}/></button></div>
             <p className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest leading-relaxed">Admin ko private message bhejien:</p>
             <textarea required placeholder="Problem or complaint details..." className="w-full h-48 p-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] mb-6 font-bold text-sm outline-none focus:border-blue-600 resize-none transition-all" value={reportText} onChange={e => setReportText(e.target.value)} />
             <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"><Send size={18} /> Send to Admin</button>
          </form>
        </div>
      )}

      {/* BOOK DETAILS MODAL (Logic Restored) */}
      {selectedBook && !isRequestingTransfer && !isUpdatingProgress && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-t-[3.5rem] sm:rounded-[3.5rem] overflow-hidden animate-in slide-in-from-bottom duration-500 my-auto shadow-2xl">
            <div className="h-64 relative bg-slate-200">
              {selectedBook.imageUrl ? <img src={selectedBook.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><BookOpen size={80} /></div>}
              <div className="absolute top-6 right-6 flex gap-2">
                 {((selectedBook.ownerId === user.uid && selectedBook.history.length === 1) || isAdminAuth) && <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><Trash2 size={20} /></button>}
                 <button onClick={() => setSelectedBook(null)} className="bg-black/20 backdrop-blur-md text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><X size={20} /></button>
              </div>
              <div className="absolute bottom-4 left-6 bg-white/90 backdrop-blur px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">{selectedBook.category}</div>
            </div>
            
            <div className="p-8 bg-white max-h-[60vh] overflow-y-auto no-scrollbar text-left">
              <h2 className="text-2xl font-black mb-1 leading-tight">{selectedBook.title}</h2>
              <div className="text-slate-400 font-bold text-xs mb-8 uppercase tracking-widest flex items-center gap-2"><div className="w-4 h-0.5 bg-slate-200"></div> {selectedBook.author}</div>

              {selectedBook.remark && (
                <div className="mb-8 bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100 relative overflow-hidden group">
                  <Quote className="absolute -right-2 -top-2 w-12 h-12 text-blue-100 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                  <p className="text-[9px] font-black text-blue-400 uppercase mb-3 tracking-widest flex items-center gap-2"><MessageSquare size={14} /> Student Note</p>
                  <p className="text-sm font-bold text-slate-700 italic leading-relaxed">"{selectedBook.remark}"</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                    <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Holder Class</div>
                    <div className="font-black text-sm flex items-center gap-2"><GraduationCap size={16} className="text-blue-600" /> {selectedBook.ownerClass}</div>
                 </div>
                 <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                    <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Time Elapsed</div>
                    <div className="font-black text-sm flex items-center gap-2"><Clock size={16} className="text-emerald-600" /> {calculateDaysDiff(selectedBook.since)} Days</div>
                 </div>
              </div>

              {user.uid === selectedBook.ownerId && selectedBook.waitlist?.length > 0 && selectedBook.handoverStatus === 'available' && (
                <div className="mb-8 border-2 border-blue-100 rounded-[2.5rem] p-6 bg-blue-50/20 shadow-sm text-left">
                   <p className="text-[10px] font-black text-blue-600 uppercase mb-4 flex items-center gap-2"><Users size={16} /> Borrow Requests ({selectedBook.waitlist.length})</p>
                   <div className="space-y-4">
                     {selectedBook.waitlist.map((req, i) => (
                       <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                             <div><div className="text-sm font-black">@{req.name}</div><div className="text-[8px] font-bold text-slate-400 uppercase mt-1">Class: {req.studentClass} | {req.contact}</div></div>
                             <button onClick={() => handleApproveFromWaitlist(req)} className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase active:scale-95 transition-all">Approve</button>
                          </div>
                          {req.message && <div className="bg-slate-50 p-3 rounded-2xl text-[10px] text-slate-600 italic border border-slate-100 mt-2">"{req.message}"</div>}
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {selectedBook.handoverStatus === 'confirming_receipt' && selectedBook.pendingRequesterId === user.uid && (
                <button onClick={handleConfirmReceipt} className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs shadow-xl mb-4 animate-bounce">Confirm Receipt</button>
              )}

              {selectedBook.ownerId === user.uid && (
                <button onClick={() => setIsUpdatingProgress(true)} className="w-full py-4 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs mb-4 active:scale-95 transition-all">Update Page Number</button>
              )}

              {user.uid !== selectedBook.ownerId && !selectedBook.waitlist?.some(r => r.uid === user.uid) && (selectedBook.handoverStatus === 'available' || !selectedBook.handoverStatus) && (
                <button onClick={() => { setBorrowMobile(profile?.mobile || ''); setIsRequestingTransfer(true); }} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"><Send size={18} /> Request to Borrow</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BORROW REQUEST MODAL */}
      {isRequestingTransfer && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleRequestWaitlist} className="bg-white w-full max-w-md rounded-[3.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-left">
            <h2 className="text-3xl font-black mb-6 tracking-tight">Borrow Book</h2>
            <div className="space-y-4">
              <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block ml-2">Message for Owner</label>
                <textarea placeholder="Why do you need this book?" className="w-full h-32 p-5 bg-white rounded-3xl font-bold border border-slate-200 outline-none focus:border-blue-600 resize-none mb-4" value={borrowMsg} onChange={e => setBorrowMsg(e.target.value)} />
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-2">Confirm Mobile</label>
                <input required type="tel" maxLength={10} className="w-full p-4 bg-white rounded-2xl font-bold border border-slate-200 outline-none focus:border-blue-600" value={borrowMobile} onChange={e => handleNumericInput(e.target.value, setBorrowMobile)} />
              </div>
              <div className="flex gap-4"><button type="button" onClick={() => setIsRequestingTransfer(false)} className="flex-1 py-5 font-black uppercase text-xs text-slate-400">Cancel</button><button type="submit" disabled={borrowMobile.length !== 10} className={`flex-[2] py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl transition-all ${borrowMobile.length === 10 ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-slate-100 text-slate-300'}`}>Send Request</button></div>
            </div>
          </form>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-center">
          <div className="bg-white w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl animate-in zoom-in-95">
            <div className="bg-red-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-red-600 shadow-xl"><Trash2 size={48} /></div>
            <h2 className="text-3xl font-black mb-3">Delete Book?</h2>
            <div className="flex gap-4 mt-8"><button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 font-black text-slate-400 text-xs">Keep</button><button onClick={handleDeleteBook} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-red-100">Delete</button></div>
          </div>
        </div>
      )}

      {/* PROGRESS MODAL */}
      {isUpdatingProgress && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-center">
          <form onSubmit={handleUpdateProgress} className="bg-white w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black mb-6 tracking-tight">Reading Status</h2>
            <input required type="number" placeholder="Enter Page" className="w-full p-6 bg-slate-50 rounded-3xl font-black text-center text-3xl outline-none focus:border-blue-600 border-2 border-slate-100 mb-8" value={newPagesRead} onChange={e => setNewPagesRead(e.target.value)} />
            <div className="flex gap-4"><button type="button" onClick={() => setIsUpdatingProgress(false)} className="flex-1 py-4 font-black text-slate-400 text-xs">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-100">Update</button></div>
          </form>
        </div>
      )}

      {/* ADD BOOK MODAL */}
      {isAddingBook && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
          <form onSubmit={handleAddBook} className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black tracking-tight">List a Book</h2><button type="button" onClick={() => setIsAddingBook(false)} className="bg-slate-100 p-2.5 rounded-xl hover:bg-slate-200 transition-colors"><X size={20} /></button></div>
            <div className="space-y-5">
              <div onClick={() => fileInputRef.current.click()} className="aspect-video bg-slate-50 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-blue-200 transition-all">{bookImageUrl ? <img src={bookImageUrl} className="w-full h-full object-cover" /> : <><Camera size={48} className="text-slate-200 mb-2 group-hover:text-blue-300 transition-colors" /><div className="text-[10px] font-black uppercase text-slate-400">Add Book Photo</div></>}<input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageChange} /></div>
              <input required placeholder="Book Title" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-600 transition-all shadow-sm" value={newBookTitle} onChange={e => setNewBookTitle(e.target.value)} />
              <input placeholder="Author Name" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-600 transition-all shadow-sm" value={newBookAuthor} onChange={e => setNewBookAuthor(e.target.value)} />
              <select className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase text-[10px] outline-none shadow-sm" value={newBookCategory} onChange={e => setNewBookCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <textarea placeholder="Owner's Note (e.g. Needs repair, great for exam preparation)" className="w-full h-32 p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold outline-none focus:border-blue-600 resize-none transition-all shadow-sm" value={newBookRemark} onChange={e => setNewBookRemark(e.target.value)} />
              <button type="submit" className={`w-full py-5 rounded-[2rem] font-black uppercase text-xs text-white shadow-2xl active:scale-95 transition-all ${appMode === 'sharing' ? 'bg-blue-600 shadow-blue-100' : 'bg-rose-600 shadow-rose-100'}`}>Publish Listing</button>
            </div>
          </form>
        </div>
      )}

      {/* ADMIN HUB */}
      <button onDoubleClick={() => setIsAdminMode(true)} className="fixed bottom-0 left-0 w-16 h-16 opacity-0 z-[100]"></button>
      {isAdminMode && (
        <div className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center p-6 backdrop-blur-xl">
          {!isAdminAuth ? (
            <div className="bg-white w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl text-center animate-in zoom-in-95"><h2 className="text-3xl font-black mb-6">Admin Key</h2><form onSubmit={handleAdminVerify} className="space-y-5"><input type="password" placeholder="Key" className="w-full p-6 bg-slate-100 rounded-3xl font-black text-center text-2xl outline-none" value={adminPassAttempt} onChange={e => setAdminPassAttempt(e.target.value)} /><button type="submit" className="w-full bg-red-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl">Unlock</button></form></div>
          ) : (
            <div className="bg-white w-full max-w-2xl p-10 rounded-[3.5rem] shadow-2xl overflow-y-auto max-h-[90vh]">
              <h2 className="text-3xl font-black mb-8 text-red-600 flex items-center gap-4"><Inbox /> Admin Control</h2>
              
              <div className="mb-8 p-6 bg-red-50 rounded-3xl border border-red-100">
                <h3 className="font-black text-red-800 uppercase text-xs mb-4">Support Inbox</h3>
                <div className="space-y-4">
                  {supportMessages.map(msg => (
                    <div key={msg.id} className="p-5 bg-white border border-red-100 rounded-2xl shadow-sm">
                        <div className="text-xs font-black text-slate-800">@{msg.senderName} (Class {msg.senderClass})</div>
                        <div className="text-[10px] text-red-500 font-bold mb-2 tracking-widest">{msg.senderMobile}</div>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{msg.message}"</p>
                    </div>
                  ))}
                  {supportMessages.length === 0 && <p className="text-center text-slate-400 text-[10px] font-black uppercase">No reports yet</p>}
                </div>
              </div>

              <button onClick={() => {setIsAdminMode(false); setIsAdminAuth(false);}} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs shadow-2xl active:scale-95 transition-all">Exit Admin Mode</button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}