/**
 * 📚 BookShare Pro - Smart Deletion & Privacy Version
 * Features:
 * - Smart Deletion: Owners can delete ONLY before the first transfer.
 * - Admin Override: Admin can delete any book anytime.
 * - School Profile: Name, Class, and Mobile (Mandatory).
 * - Contact Privacy: Hide number from everyone except Admin.
 * - Progress & Deadlines: 3-day reminders & 30-day limits.
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
  Eye
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
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Data States
  const [notifications, setNotifications] = useState([]);
  const [adminMsg, setAdminMsg] = useState('');

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

  const [requesterContact, setRequesterContact] = useState('');
  const [isPrivateContact, setIsPrivateContact] = useState(false);
  const [socialHandle, setSocialHandle] = useState('');
  const [suggestType, setSuggestType] = useState('demand'); 
  const [suggestMsg, setSuggestMsg] = useState('');
  const [newPagesRead, setNewPagesRead] = useState('');

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
        if (docSnap.exists()) { 
          const pData = docSnap.data();
          setProfile(pData); 
          setRequesterContact(pData.mobile || '');
        } 
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
    return () => { unsubBooks(); unsubNotify(); unsubSuggest(); };
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
    if (!tempName.trim() || !tempMobile.trim() || !user) return;
    try {
      const profileData = { 
        name: tempName.trim(), 
        studentClass: tempClass,
        mobile: tempMobile.trim(),
        isPrivate: tempIsPrivate,
        shortId: getShortId(user.uid) 
      };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), profileData);
      setProfile(profileData); 
      setRequesterContact(profileData.mobile);
      setIsSettingName(false);
    } catch (err) { console.error("Profile set error:", err); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5000000) {
      alert("Image is too big! Please select smaller than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setBookImageUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBookTitle || !profile || !user) return;
    try {
      const today = new Date().toISOString();
      const displayName = `${profile.name}#${profile.shortId}`;
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'books'), {
        type: appMode,
        title: newBookTitle,
        author: newBookAuthor,
        category: newBookCategory,
        remark: newBookRemark, 
        imageUrl: bookImageUrl,
        currentOwner: displayName, 
        ownerClass: profile.studentClass,
        ownerId: user.uid,
        contact: profile.mobile, 
        isPrivate: profile.isPrivate,
        since: today,
        transferPending: false,
        handoverStatus: 'available',
        waitlist: [],
        readingProgress: { started: false, pagesRead: 0, lastUpdated: today },
        history: [{ owner: displayName, startDate: today, endDate: null, action: appMode === 'donation' ? 'Donated' : 'Listed' }],
        createdAt: serverTimestamp()
      });
      setIsAddingBook(false); setNewBookTitle(''); setBookImageUrl('');
    } catch (err) { console.error("Listing error:", err); }
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    if (!selectedBook || !user) return;
    try {
      const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id);
      await updateDoc(bookRef, {
        "readingProgress.started": true,
        "readingProgress.pagesRead": Number(newPagesRead),
        "readingProgress.lastUpdated": new Date().toISOString()
      });
      setIsUpdatingProgress(false); setNewPagesRead(''); setSelectedBook(null);
    } catch (err) { console.error("Progress error:", err); }
  };

  const handleRequestWaitlist = async (e) => {
    e.preventDefault();
    if (!selectedBook || !profile || !user) return;
    try {
      const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id);
      const requestData = { 
        uid: user.uid, 
        name: `${profile.name}#${profile.shortId}`, 
        studentClass: profile.studentClass,
        contact: profile.mobile, 
        isPrivate: profile.isPrivate,
        timestamp: new Date().toISOString() 
      };
      await updateDoc(bookRef, { waitlist: arrayUnion(requestData), transferPending: true });
      setIsRequestingTransfer(false); setSelectedBook(null);
    } catch (err) { console.error("Waitlist error:", err); }
  };

  const handleApproveFromWaitlist = async (reqUser) => {
    if (!selectedBook || !user) return;
    try {
      const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id);
      await updateDoc(bookRef, { 
        handoverStatus: 'confirming_receipt', 
        pendingRequesterId: reqUser.uid, 
        pendingOwner: reqUser.name, 
        pendingOwnerClass: reqUser.studentClass,
        pendingContact: reqUser.contact, 
        isPrivate: reqUser.isPrivate,
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
        currentOwner: selectedBook.pendingOwner, 
        ownerClass: selectedBook.pendingOwnerClass,
        ownerId: selectedBook.pendingRequesterId, 
        contact: selectedBook.pendingContact, 
        isPrivate: selectedBook.isPrivate, 
        history: updatedHistory, 
        since: today, 
        handoverStatus: 'available', 
        transferPending: (selectedBook.waitlist?.length > 1), 
        pendingRequesterId: null, pendingOwner: null, pendingOwnerClass: null, pendingContact: null,
        "readingProgress.started": false, "readingProgress.pagesRead": 0, "readingProgress.lastUpdated": today
      });
      setSelectedBook(null);
    } catch (err) { console.error("Receipt error:", err); }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook || !user) return;
    
    // Logic: original owner can delete only if history.length is 1 (no transfers yet)
    const isOriginalOwner = selectedBook.ownerId === user.uid && selectedBook.history.length === 1;
    
    if (isOriginalOwner || isAdminAuth) {
      try { 
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id)); 
        setSelectedBook(null); 
        setShowDeleteConfirm(false); 
      } catch (err) { console.error("Delete error:", err); }
    } else {
      alert("Aap ye book delete nahi kar sakte. Ek baar transfer hone ke baad sirf Admin hi delete kar sakta hai.");
    }
  };

  const handleAdminVerify = (e) => {
    e.preventDefault();
    if (adminPassAttempt === 'admin123') setIsAdminAuth(true);
    else setAdminPassAttempt('');
  };

  const sendNotification = async (e) => {
    e.preventDefault();
    if (!adminMsg || !user) return;
    try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), { message: adminMsg, createdAt: serverTimestamp() }); setAdminMsg(''); setIsAdminMode(false); } catch (err) { console.error("Notify error:", err); }
  };

  // --- UI RENDER ---

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="text-center animate-pulse">
        <div className="w-16 h-16 bg-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center"><BookOpen className="text-white" size={32} /></div>
        <div className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Initialising Library...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      
      {/* STUDENT PROFILE SETUP */}
      {isSettingName && (
        <div className="fixed inset-0 bg-white z-[200] flex items-center justify-center p-6 overflow-y-auto">
          <div className="max-w-sm w-full text-center py-10">
            <div className="bg-blue-600 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-100"><UserCheck className="text-white w-10 h-10" /></div>
            <h2 className="text-3xl font-black mb-2 tracking-tight">Student Login</h2>
            <div className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-8 leading-relaxed italic">Identity verified by Admin</div>
            <form onSubmit={handleSetProfile} className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Full Name</label>
                <input required maxLength={15} placeholder="Rahul Sharma" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-slate-100 focus:border-blue-600 transition-all" value={tempName} onChange={e => setTempName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Class</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-slate-100 focus:border-blue-600 transition-all" value={tempClass} onChange={e => setTempClass(e.target.value)}>
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Short ID</label>
                  <div className="w-full p-4 bg-slate-100 rounded-2xl font-black text-blue-600 flex items-center justify-center">#{getShortId(user.uid)}</div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Mobile (Visible to Admin)</label>
                <input required type="tel" placeholder="10 Digit Number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-slate-100 focus:border-blue-600" value={tempMobile} onChange={e => setTempMobile(e.target.value)} />
              </div>
              <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2"><ShieldCheck className="text-blue-600" size={18} /><span className="text-[10px] font-black uppercase text-slate-500">Hide my number?</span></div>
                   <button type="button" onClick={() => setTempIsPrivate(!tempIsPrivate)} className={`w-12 h-6 rounded-full relative transition-colors ${tempIsPrivate ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${tempIsPrivate ? 'right-1' : 'left-1'}`} /></button>
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase text-xs shadow-2xl active:scale-95 transition-all mt-6">Confirm Profile</button>
            </form>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      {!appMode ? (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-12">
            <div className="relative mx-auto w-24 h-24 mb-6"><div className="absolute bg-blue-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-200"><BookOpen className="text-white w-12 h-12" /></div></div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-3">BookShare</h1>
            <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">@{profile?.name}<span className="text-blue-600 ml-1">#{profile?.shortId}</span></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
            <button onClick={() => {setAppMode('sharing'); setCurrentTab('explore');}} className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center hover:border-blue-200 transition-all"><div className="bg-blue-50 p-6 rounded-[2rem] text-blue-600 mb-6 shadow-lg shadow-blue-50"><Users size={40} /></div><h2 className="text-2xl font-black mb-2">Sharing Hub</h2><div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Borrow & Return</div></button>
            <button onClick={() => {setAppMode('donation'); setCurrentTab('explore');}} className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center hover:border-rose-200 transition-all"><div className="bg-rose-50 p-6 rounded-[2rem] text-rose-600 mb-6 shadow-lg shadow-rose-50"><Heart size={40} /></div><h2 className="text-2xl font-black mb-2">Donation Hub</h2><div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Give Forever</div></button>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <div className="bg-white sticky top-0 z-40 border-b border-slate-100">
            <header className="max-w-5xl mx-auto p-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button onClick={() => setAppMode(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronLeft size={24} /></button>
                <div>
                   <h1 className="text-lg font-black tracking-tight">{appMode === 'sharing' ? 'Sharing' : 'Donation'}</h1>
                   <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{currentTab === 'explore' ? 'Exploring All' : 'My Activity'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowNewsPanel(true)} className="relative p-3 bg-slate-50 rounded-2xl text-slate-600"><Bell size={20} />{notifications.length > 0 && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}</button>
                <button onClick={() => setIsAddingBook(true)} className={`${appMode === 'sharing' ? 'bg-blue-600' : 'bg-rose-600'} text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl`}><Plus size={24} /></button>
              </div>
            </header>
          </div>

          <main className="max-w-5xl mx-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredBooks.map(book => {
                const daysHeld = calculateDaysDiff(book.since);
                return (
                  <div key={book.id} onClick={() => setSelectedBook(book)} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 cursor-pointer hover:shadow-xl transition-all relative">
                    <div className="aspect-[4/5] bg-slate-100 relative">
                      {book.imageUrl ? <img src={book.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen size={40} className="text-slate-300" /></div>}
                      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-200"><div className="h-full bg-emerald-500" style={{ width: `${Math.min((book.readingProgress?.pagesRead || 0) / 2, 100)}%` }}></div></div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-black text-sm line-clamp-1">{book.title}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-[8px] font-black uppercase text-slate-500">Class {book.ownerClass}</div>
                        <div className={`text-[8px] font-black uppercase ${daysHeld > 27 ? 'text-red-600' : 'text-slate-400'}`}>Day {daysHeld}/30</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-slate-100 z-40 px-6 py-4">
            <div className="max-w-md mx-auto flex justify-around">
               <button onClick={() => setCurrentTab('explore')} className={`flex flex-col items-center gap-1 ${currentTab === 'explore' ? 'text-slate-900' : 'text-slate-300'}`}><LayoutGrid size={24} /><span className="text-[8px] font-black uppercase">Explore</span></button>
               <button onClick={() => setShowCommunityBoard(true)} className="flex flex-col items-center gap-1 text-slate-300"><MessageSquare size={24} /><span className="text-[8px] font-black uppercase">Board</span></button>
               <button onClick={() => setCurrentTab('activity')} className={`flex flex-col items-center gap-1 ${currentTab === 'activity' ? 'text-slate-900' : 'text-slate-300'}`}><Bookmark size={24} /><span className="text-[8px] font-black uppercase">Activity</span></button>
            </div>
          </div>
        </div>
      )}

      {/* BOOK DETAILS OVERLAY */}
      {selectedBook && !isRequestingTransfer && !isUpdatingProgress && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden animate-in slide-in-from-bottom duration-500 my-auto shadow-2xl">
            <div className="h-64 relative bg-slate-200">
              {selectedBook.imageUrl ? <img src={selectedBook.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen size={80} className="text-slate-300" /></div>}
              <div className="absolute top-6 right-6 flex gap-2">
                 {/* Delete Logic: Owner can delete before transfer OR Admin can always delete */}
                 {( (selectedBook.ownerId === user.uid && selectedBook.history.length === 1) || isAdminAuth ) && (
                    <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><Trash2 size={20} /></button>
                 )}
                 <button onClick={() => setSelectedBook(null)} className="bg-black/20 backdrop-blur-md text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><X size={20} /></button>
              </div>
            </div>
            
            <div className="p-8 bg-white max-h-[60vh] overflow-y-auto no-scrollbar">
              <h2 className="text-2xl font-black mb-1">{selectedBook.title}</h2>
              <div className="text-slate-400 font-bold text-xs mb-8 uppercase">— {selectedBook.author}</div>

              {/* Delete Help Note for Owners */}
              {selectedBook.ownerId === user.uid && selectedBook.history.length > 1 && !isAdminAuth && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
                   <Lock className="text-amber-600" size={16} />
                   <p className="text-[9px] font-black text-amber-900 uppercase">Book transfer ho chuki hai. Delete ke liye Admin ko message karein.</p>
                </div>
              )}

              {/* Contact with Privacy */}
              <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white p-2 rounded-xl text-blue-600"><Phone size={18} /></div>
                  <div>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Contact Information</div>
                    <div className="font-black text-sm flex items-center gap-2">
                      {(isAdminAuth || !selectedBook.isPrivate || selectedBook.ownerId === user.uid) ? (
                        <>
                          {selectedBook.contact}
                          {selectedBook.isPrivate && <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[8px] uppercase">Private</span>}
                        </>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1 italic"><EyeOff size={14} /> Contact Hidden</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-slate-50 p-4 rounded-3xl flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl text-blue-600"><GraduationCap size={18} /></div>
                    <div><div className="text-[8px] font-black text-slate-400 uppercase">Class</div><div className="font-black text-sm">{selectedBook.ownerClass}</div></div>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-3xl flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl text-emerald-600"><Clock size={18} /></div>
                    <div><div className="text-[8px] font-black text-slate-400 uppercase">Days</div><div className="font-black text-sm">{calculateDaysDiff(selectedBook.since)}</div></div>
                 </div>
              </div>

              {selectedBook.ownerId === user.uid && selectedBook.waitlist?.length > 0 && selectedBook.handoverStatus === 'available' && (
                <div className="p-6 border border-slate-100 rounded-3xl mb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-4"><Users size={12} className="inline mr-1" /> Approve Student Transfer:</p>
                  <div className="space-y-3">
                    {selectedBook.waitlist.map((req, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <div><div className="text-xs font-black">@{req.name}</div><div className="text-[8px] font-bold text-slate-400">Class: {req.studentClass}</div></div>
                        <button onClick={() => handleApproveFromWaitlist(req)} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">Approve</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedBook.handoverStatus === 'confirming_receipt' && selectedBook.pendingRequesterId === user.uid && (
                <button onClick={handleConfirmReceipt} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl mb-4">Confirm Receipt</button>
              )}

              {!selectedBook.waitlist?.some(r => r.uid === user.uid) && user.uid !== selectedBook.ownerId && selectedBook.handoverStatus === 'available' && (
                <button onClick={() => setIsRequestingTransfer(true)} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-2xl">Join Waitlist</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl text-center">
            <div className="bg-red-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-red-600 shadow-xl"><Trash2 size={48} /></div>
            <h2 className="text-3xl font-black mb-3">Delete Listing?</h2>
            <div className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-10 leading-relaxed px-4">
              Kya aap is book ko library se permanent hatana chahte hain?
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 font-black text-slate-400 text-xs uppercase tracking-widest">Keep It</button>
              <button onClick={handleDeleteBook} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-red-100">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE PROGRESS MODAL */}
      {isUpdatingProgress && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <form onSubmit={handleUpdateProgress} className="bg-white w-full max-w-sm p-8 rounded-[3rem] shadow-2xl">
            <h2 className="text-2xl font-black mb-2">Update Progress</h2>
            <input required type="number" placeholder="Current Page" className="w-full p-5 bg-slate-50 rounded-2xl font-black text-center text-xl outline-none border-2 border-slate-100 focus:border-blue-600 mb-6" value={newPagesRead} onChange={e => setNewPagesRead(e.target.value)} />
            <div className="flex gap-3"><button type="button" onClick={() => setIsUpdatingProgress(false)} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-xl">Save</button></div>
          </form>
        </div>
      )}

      {/* ADD BOOK OVERLAY */}
      {isAddingBook && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
          <form onSubmit={handleAddBook} className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black">List a Book</h2><button type="button" onClick={() => setIsAddingBook(false)} className="bg-slate-100 p-2.5 rounded-xl"><X size={20} /></button></div>
            <div className="space-y-5">
              <div onClick={() => fileInputRef.current.click()} className="aspect-video bg-slate-50 border-4 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                {bookImageUrl ? <img src={bookImageUrl} className="w-full h-full object-cover" /> : <><Camera size={40} className="text-slate-200 mb-2" /><div className="text-[10px] font-black uppercase text-slate-400">Add Book Photo</div></>}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageChange} />
              </div>
              <input required placeholder="Book Title" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" value={newBookTitle} onChange={e => setNewBookTitle(e.target.value)} />
              <input placeholder="Author Name" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" value={newBookAuthor} onChange={e => setNewBookAuthor(e.target.value)} />
              <select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black uppercase text-[10px]" value={newBookCategory} onChange={e => setNewBookCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <textarea placeholder="Student Note..." className="w-full h-24 p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none resize-none" value={newBookRemark} onChange={e => setNewBookRemark(e.target.value)} />
              <button type="submit" className={`w-full py-5 rounded-3xl font-black uppercase text-xs text-white shadow-2xl ${appMode === 'sharing' ? 'bg-blue-600' : 'bg-rose-600'}`}>Publish Now</button>
            </div>
          </form>
        </div>
      )}

      {/* REQUEST FORM */}
      {isRequestingTransfer && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleRequestWaitlist} className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl text-center">
            <h2 className="text-2xl font-black mb-6">Request Access</h2>
            <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] mb-6">
               <div className="text-[10px] font-black uppercase text-blue-600 mb-1">Authenticated Identity</div>
               <div className="text-sm font-bold text-slate-700">@{profile.name} (Class {profile.studentClass})</div>
            </div>
            <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl">Confirm Join Waitlist</button>
            <button type="button" onClick={() => setIsRequestingTransfer(false)} className="w-full py-4 text-slate-400 text-[10px] font-black uppercase">Cancel</button>
          </form>
        </div>
      )}

      {/* ADMIN PANEL */}
      <button onDoubleClick={() => setIsAdminMode(true)} className="fixed bottom-0 left-0 w-16 h-16 opacity-0 z-[100]"></button>
      {isAdminMode && (
        <div className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center p-6 backdrop-blur-xl">
          {!isAdminAuth ? (
            <div className="bg-white w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl text-center">
               <h2 className="text-3xl font-black mb-6">Admin Key</h2>
               <form onSubmit={handleAdminVerify} className="space-y-5">
                 <input type="password" placeholder="Key" className="w-full p-5 bg-slate-100 rounded-2xl font-black text-center text-2xl outline-none" value={adminPassAttempt} onChange={e => setAdminPassAttempt(e.target.value)} />
                 <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px]">Unlock</button>
               </form>
            </div>
          ) : (
            <div className="bg-white w-full max-w-md p-10 rounded-[3.5rem] shadow-2xl">
              <h2 className="text-3xl font-black mb-8 text-red-600">Admin Hub</h2>
              <div className="text-[10px] font-black text-slate-400 uppercase mb-4 italic">Note: Admin can now delete any book regardless of transfer history.</div>
              <textarea placeholder="Global Message..." className="w-full h-40 p-6 bg-slate-50 border-2 rounded-[2rem] mb-6 font-bold" value={adminMsg} onChange={e => setAdminMsg(e.target.value)} />
              <button onClick={sendNotification} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs">Send Announcement</button>
              <button onClick={() => {setIsAdminMode(false); setIsAdminAuth(false);}} className="w-full py-4 text-slate-400 text-[10px] font-black mt-2">Exit Admin</button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}