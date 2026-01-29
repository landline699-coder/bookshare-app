/**
 * 📚 BookShare - Identity Verified Version
 * Features:
 * - Unique User Discriminators: Names are appended with a 4-char ID (e.g., Name#1234).
 * - User Profile System: Linked to UID to prevent impersonation.
 * - Admin Notification System: Secure broadcast for live app management.
 * - Remark/Note Feature: Owners can add a description/message when listing.
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
  serverTimestamp 
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
  Lock
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

// --- UTILITY HELPERS ---
const safeFormatDate = (dateStr) => {
  if (!dateStr) return 'Recently';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString('en-IN');
};

const calculateDaysHeld = (startDateStr) => {
  if (!startDateStr) return 0;
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return 0;
  const diffTime = Math.abs(new Date() - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
};

const getShortId = (uid) => {
  if (!uid) return "0000";
  return uid.slice(-4).toUpperCase();
};

export default function App() {
  // App State
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); 
  const [appMode, setAppMode] = useState(null); 
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
  const [tempName, setTempName] = useState(''); 
  const [requesterContact, setRequesterContact] = useState('');
  const [isPrivateContact, setIsPrivateContact] = useState(false);
  const [socialHandle, setSocialHandle] = useState('');
  const [suggestType, setSuggestType] = useState('demand'); 
  const [suggestMsg, setSuggestMsg] = useState('');

  const fileInputRef = useRef(null);

  // 1. Authentication & Profile Fetch
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) { console.error("Auth failure:", error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, async (u) => { 
      if (u) {
        setUser(u);
        const profileRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data');
        const docSnap = await getDoc(profileRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          setIsSettingName(true); 
        }
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
      setSuggestions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    const notifyRef = collection(db, 'artifacts', appId, 'public', 'data', 'notifications');
    const unsubNotify = onSnapshot(notifyRef, (snap) => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    return () => { unsubBooks(); unsubNotify(); unsubSuggest(); };
  }, [user, profile]);

  // 3. Search and Category Filter
  useEffect(() => {
    let result = books.filter(b => b.type === appMode);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(b => 
        b.title?.toLowerCase().includes(term) || b.author?.toLowerCase().includes(term)
      );
    }
    if (selectedCategory !== 'All') result = result.filter(b => b.category === selectedCategory);
    result.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    setFilteredBooks(result);
  }, [searchTerm, selectedCategory, books, appMode]);

  // --- HANDLERS ---

  const handleSetProfile = async (e) => {
    e.preventDefault();
    if (!tempName.trim() || !user) return;
    try {
      const profileData = { 
        name: tempName.trim(),
        shortId: getShortId(user.uid) 
      };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), profileData);
      setProfile(profileData);
      setIsSettingName(false);
    } catch (err) { console.error("Profile set error:", err); }
  };

  const resetForm = () => {
    setNewBookTitle(''); setNewBookAuthor(''); setBookImageUrl('');
    setNewBookRemark(''); 
    setRequesterContact(''); setSocialHandle('');
    setIsAddingBook(false); setIsRequestingTransfer(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 800000) {
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
        type: appMode,
        title: newBookTitle,
        author: newBookAuthor,
        category: newBookCategory,
        remark: newBookRemark, 
        imageUrl: bookImageUrl,
        currentOwner: displayName, 
        ownerId: user.uid,
        contact: isPrivateContact ? "Private" : requesterContact,
        socialHandle: isPrivateContact ? socialHandle : "",
        isPrivate: isPrivateContact,
        since: today,
        transferPending: false,
        history: [{ 
          owner: displayName, 
          startDate: today, 
          endDate: null,
          daysHeld: null, 
          action: appMode === 'donation' ? 'Donated' : 'Listed' 
        }],
        createdAt: serverTimestamp()
      });
      resetForm();
    } catch (err) { console.error("Listing error:", err); }
  };

  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    if (!selectedBook || !profile || !user) return;
    try {
      const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id);
      const displayName = `${profile.name}#${profile.shortId}`;
      await updateDoc(bookRef, {
        transferPending: true,
        pendingOwner: displayName, 
        pendingContact: isPrivateContact ? "Private" : requesterContact,
        pendingSocial: isPrivateContact ? socialHandle : "",
        pendingRequesterId: user.uid
      });
      resetForm();
      setSelectedBook(null);
    } catch (err) { console.error("Request error:", err); }
  };

  const handleAddSuggestion = async (e) => {
    e.preventDefault();
    if (!suggestMsg || !profile) return;
    try {
      const displayName = `${profile.name}#${profile.shortId}`;
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), {
        type: suggestType,
        message: suggestMsg,
        userName: displayName, 
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setSuggestMsg('');
      setIsAddingSuggestion(false);
    } catch (err) { console.error("Post error:", err); }
  };

  const handleApproveTransfer = async () => {
    if (!selectedBook || !user) return;
    try {
      const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id);
      const today = new Date().toISOString();
      const updatedHistory = [...(selectedBook.history || [])];
      const lastEntry = updatedHistory[updatedHistory.length - 1];
      if (lastEntry) {
        lastEntry.endDate = today;
        lastEntry.daysHeld = calculateDaysHeld(lastEntry.startDate);
      }
      updatedHistory.push({
        owner: selectedBook.pendingOwner,
        startDate: today,
        endDate: null,
        daysHeld: null,
        action: 'Transferred'
      });
      await updateDoc(bookRef, {
        currentOwner: selectedBook.pendingOwner,
        contact: selectedBook.pendingContact,
        socialHandle: selectedBook.pendingSocial || "",
        isPrivate: selectedBook.pendingContact === "Private",
        ownerId: selectedBook.pendingRequesterId,
        history: updatedHistory,
        since: today,
        transferPending: false,
        pendingOwner: null, pendingContact: null, pendingSocial: null, pendingRequesterId: null
      });
      setSelectedBook(null);
    } catch (err) { console.error("Approval error:", err); }
  };

  const sendNotification = async (e) => {
    e.preventDefault();
    if (!adminMsg || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), {
        message: adminMsg,
        createdAt: serverTimestamp()
      });
      setAdminMsg(''); setIsAdminMode(false); setIsAdminAuth(false);
    } catch (err) { console.error("Notify error:", err); }
  };

  const handleAdminVerify = (e) => {
    e.preventDefault();
    if (adminPassAttempt === 'admin123') { // Simple password for live admin broadcast
      setIsAdminAuth(true);
    } else {
      setAdminPassAttempt('');
    }
  };

  // --- UI RENDER ---

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="animate-spin text-blue-600 w-10 h-10 mx-auto mb-4" />
        <p className="text-slate-500 font-bold tracking-tight">Syncing with BookShare...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-10">
      
      {/* INITIAL NAME SETUP MODAL */}
      {isSettingName && (
        <div className="fixed inset-0 bg-white z-[200] flex items-center justify-center p-6">
          <div className="max-w-sm w-full text-center">
            <div className="bg-blue-600 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-200">
              <UserCheck className="text-white w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black mb-2">Identify Yourself</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-8 leading-relaxed italic">
              Your name will be paired with ID: <span className="text-blue-600">#{getShortId(user.uid)}</span>
            </p>
            <form onSubmit={handleSetProfile} className="space-y-4">
              <input 
                required 
                maxLength={15}
                placeholder="Enter Your Name" 
                className="w-full p-5 bg-slate-100 rounded-3xl font-black text-center outline-none border-4 border-transparent focus:border-blue-100 transition-all"
                value={tempName}
                onChange={e => setTempName(e.target.value)}
              />
              <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all">
                Confirm Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 1. LANDING SCREEN */}
      {!appMode ? (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-10 animate-in fade-in zoom-in duration-700">
            <div className="bg-blue-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-200 mb-6">
              <BookOpen className="text-white w-12 h-12" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">BookShare</h1>
            <div className="flex items-center justify-center gap-1">
               <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Logged in as @{profile?.name}</p>
               <span className="text-blue-600 font-black text-[10px]">#{profile?.shortId}</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 w-full max-w-2xl animate-in slide-in-from-bottom-10 duration-700 delay-200">
            <button 
              onClick={() => setAppMode('sharing')}
              className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center group hover:scale-105 transition-all"
            >
              <div className="bg-blue-50 p-6 rounded-[2rem] text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users size={48} />
              </div>
              <h2 className="text-xl font-black mb-2">Borrowing</h2>
              <p className="text-xs text-slate-400 font-bold leading-relaxed px-4">Borrow books from others and return them later.</p>
            </button>

            <button 
              onClick={() => setAppMode('donation')}
              className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center group hover:scale-105 transition-all"
            >
              <div className="bg-rose-50 p-6 rounded-[2rem] text-rose-600 mb-6 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <Heart size={48} />
              </div>
              <h2 className="text-xl font-black mb-2">Donating</h2>
              <p className="text-xs text-slate-400 font-bold leading-relaxed px-4">Give away books to those who need them forever.</p>
            </button>
          </div>
          
          <button onClick={() => setShowCommunityBoard(true)} className="mt-12 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-2">
            <MessageSquare size={14} /> Open Community Board
          </button>
        </div>
      ) : (
        /* 2. MAIN DASHBOARD */
        <div className="animate-in fade-in duration-500">
          <div className="bg-white sticky top-0 z-40 shadow-sm">
            <header className="max-w-5xl mx-auto p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button onClick={() => {setAppMode(null); setSelectedCategory('All');}} className="p-2 hover:bg-slate-50 rounded-xl">
                  <ChevronLeft size={20} className="text-slate-400" />
                </button>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-xl shadow-lg ${appMode === 'sharing' ? 'bg-blue-600' : 'bg-rose-600'}`}>
                    {appMode === 'sharing' ? <Users className="text-white w-4 h-4" /> : <Heart className="text-white w-4 h-4" />}
                  </div>
                  <h1 className="text-sm font-black uppercase tracking-tight">
                    {appMode === 'sharing' ? 'Sharing Hub' : 'Donation Hub'}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowCommunityBoard(true)} className="p-2.5 bg-slate-50 rounded-2xl text-slate-600"><MessageSquare size={20} /></button>
                <button onClick={() => setShowNewsPanel(true)} className="relative p-2.5 bg-slate-50 rounded-2xl text-slate-600">
                  <Bell size={20} />
                  {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>}
                </button>
                <button onClick={() => setIsAddingBook(true)} className={`${appMode === 'sharing' ? 'bg-blue-600' : 'bg-rose-600'} text-white px-5 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 shadow-xl`}>
                  <Plus size={18} /> <span className="hidden sm:inline">Add Book</span>
                </button>
              </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 pb-4">
              <div className="relative mb-3">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  placeholder="Search books or authors..." 
                  className="w-full pl-12 pr-4 py-4 bg-slate-100 rounded-3xl outline-none font-bold text-sm border-2 border-transparent focus:border-slate-200"
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {['All', ...CATEGORIES].map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase border whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <main className="max-w-5xl mx-auto p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBooks.map(book => (
              <div key={book.id} onClick={() => setSelectedBook(book)} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="aspect-[3/4] bg-slate-100 relative">
                  {book.imageUrl ? <img src={book.imageUrl} className="w-full h-full object-cover" alt={book.title} /> : <div className="w-full h-full flex items-center justify-center"><BookOpen size={40} className="text-slate-200" /></div>}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[8px] font-black uppercase shadow-sm">{book.category}</div>
                  {book.transferPending && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center font-black text-[10px] uppercase text-slate-900">Waitlist Active</div>}
                </div>
                <div className="p-4">
                  <h3 className="font-black text-sm line-clamp-1">{book.title}</h3>
                  <p className="text-[10px] text-slate-400 font-bold mb-3 truncate">{book.author}</p>
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-50 overflow-hidden">
                    <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[8px] font-black uppercase ${appMode === 'sharing' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>{book.currentOwner?.[0] || 'U'}</div>
                    <p className="text-[10px] font-bold text-slate-500 truncate">
                      @{book.currentOwner.split('#')[0]}<span className="text-slate-300">#{book.currentOwner.split('#')[1]}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </main>
        </div>
      )}

      {/* --- OVERLAYS & MODALS --- */}

      {/* Community Board */}
      {showCommunityBoard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex justify-center sm:items-center items-end p-0 sm:p-4">
          <div className="bg-white w-full max-w-2xl sm:rounded-[3rem] rounded-t-[3rem] h-[90vh] sm:h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><MessageCircle size={24} /></div>
                <div><h2 className="text-xl font-black">Community</h2><p className="text-[9px] font-black uppercase text-slate-400">Demands & Feedback</p></div>
              </div>
              <button onClick={() => setShowCommunityBoard(false)} className="bg-slate-100 p-2 rounded-xl"><X size={20} /></button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar">
              {suggestions.map(s => (
                <div key={s.id} className={`p-6 rounded-[2.5rem] border ${s.type === 'demand' ? 'bg-white border-blue-50' : 'bg-rose-50/30 border-rose-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${s.type === 'demand' ? 'text-blue-600' : 'text-rose-600'}`}>{s.type}</span>
                    <span className="text-[9px] font-bold text-slate-400">{safeFormatDate(s.createdAt?.toDate?.()?.toISOString())}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{s.message}</p>
                  <p className="mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Verified @{s.userName.split('#')[0]}<span className="text-slate-200">#{s.userName.split('#')[1]}</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => setIsAddingSuggestion(true)} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Post a Message</button>
            </div>
          </div>
        </div>
      )}

      {/* Post to Board Form */}
      {isAddingSuggestion && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleAddSuggestion} className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">New Post</h2>
              <button type="button" onClick={() => setIsAddingSuggestion(false)} className="bg-slate-100 p-2 rounded-xl"><X /></button>
            </div>
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Posting as</p>
                <h3 className="text-sm font-black">@{profile.name}<span className="text-blue-600">#{profile.shortId}</span></h3>
              </div>
              <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                <button type="button" onClick={() => setSuggestType('demand')} className={`flex-grow py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${suggestType === 'demand' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Request Book</button>
                <button type="button" onClick={() => setSuggestType('feedback')} className={`flex-grow py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${suggestType === 'feedback' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-400'}`}>Suggestion</button>
              </div>
              <textarea required placeholder="Write your message..." className="w-full h-32 p-4 bg-slate-50 rounded-xl font-bold resize-none outline-none focus:ring-2 focus:ring-slate-200" value={suggestMsg} onChange={e => setSuggestMsg(e.target.value)} />
              <button type="submit" className={`w-full py-5 rounded-2xl font-black uppercase text-xs text-white shadow-lg ${suggestType === 'demand' ? 'bg-blue-600' : 'bg-rose-600'}`}>Publish Post</button>
            </div>
          </form>
        </div>
      )}

      {/* Book Details Overlay */}
      {selectedBook && !isRequestingTransfer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden animate-in slide-in-from-bottom my-auto">
            <div className="h-64 relative bg-slate-100">
              {selectedBook.imageUrl ? <img src={selectedBook.imageUrl} className="w-full h-full object-cover" alt={selectedBook.title} /> : <div className="w-full h-full flex items-center justify-center"><BookOpen size={64} className="text-slate-200" /></div>}
              <button onClick={() => setSelectedBook(null)} className="absolute top-5 right-5 bg-black/20 backdrop-blur-md text-white p-2 rounded-xl"><X /></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar">
              <span className={`text-[10px] font-black uppercase mb-2 block tracking-widest ${appMode === 'sharing' ? 'text-blue-600' : 'text-rose-600'}`}>{selectedBook.category}</span>
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-2xl font-black leading-tight flex-1">{selectedBook.title}</h2>
              </div>
              <p className="text-slate-400 font-bold text-sm mb-6 uppercase tracking-wider">{selectedBook.author}</p>
              
              {/* Note Display Section */}
              {selectedBook.remark && (
                <div className="mb-6 bg-slate-50 p-5 rounded-[2rem] border border-slate-100 relative overflow-hidden">
                  <Quote className="absolute -right-2 -top-2 w-12 h-12 text-slate-100 -rotate-12" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <MessageSquare size={12} /> Owner's Note
                  </p>
                  <p className="text-sm font-bold text-slate-700 italic leading-relaxed">"{selectedBook.remark}"</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Owner</p>
                  <p className="font-black text-sm">@{selectedBook.currentOwner.split('#')[0]}<span className="text-blue-600">#{selectedBook.currentOwner.split('#')[1]}</span></p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Contact</p>
                  <p className={`font-black text-sm truncate ${appMode === 'sharing' ? 'text-blue-600' : 'text-rose-600'}`}>
                    {selectedBook.isPrivate ? <span className="flex items-center gap-1"><Instagram size={14} /> {selectedBook.socialHandle}</span> : <span className="flex items-center gap-1"><Phone size={14} /> {selectedBook.contact}</span>}
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6"><History size={16} /><h3 className="text-xs font-black uppercase tracking-widest">Ownership Timeline</h3></div>
                <div className="space-y-4">
                  {selectedBook.history?.slice().reverse().map((entry, idx) => (
                    <div key={idx} className={`relative pl-8 pb-4 border-l-2 border-dashed ${idx !== (selectedBook.history?.length - 1) ? 'border-slate-100' : 'border-transparent'} ml-2`}>
                      <div className={`absolute -left-2 top-0 w-4 h-4 rounded-full border-2 border-white ${idx === 0 ? 'bg-emerald-500 scale-125' : 'bg-slate-300'}`} />
                      <div className="bg-white p-4 rounded-2xl border border-slate-100">
                        <p className="font-black text-sm">@{entry.owner.split('#')[0]}<span className="text-slate-300">#{entry.owner.split('#')[1]}</span></p>
                        <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-400 mt-2">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {safeFormatDate(entry.startDate)}</span>
                          {!entry.daysHeld && idx === 0 && <span className="text-emerald-500 font-black">Current Holder</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedBook.transferPending && user.uid === selectedBook.ownerId ? (
                <div className="p-5 rounded-3xl bg-amber-50 border border-amber-100 sticky bottom-0">
                  <p className="text-xs font-bold mb-3 text-amber-800"><AlertCircle size={14} className="inline mr-1" /> Transfer to verified @{selectedBook.pendingOwner}?</p>
                  <button onClick={handleApproveTransfer} className="w-full py-4 rounded-2xl font-black text-xs bg-amber-600 text-white shadow-lg">Confirm Transfer</button>
                </div>
              ) : (
                <div className="sticky bottom-0 bg-white pt-2">
                  <button onClick={() => setIsRequestingTransfer(true)} disabled={selectedBook.transferPending} className={`w-full py-5 rounded-2xl font-black uppercase text-xs text-white shadow-xl ${appMode === 'sharing' ? 'bg-blue-600' : 'bg-rose-600'} disabled:bg-slate-200`}>
                    {selectedBook.transferPending ? 'Request Pending' : (appMode === 'sharing' ? 'Request to Borrow' : 'Claim this Book')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Book / Request Form */}
      {(isAddingBook || isRequestingTransfer) && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <form onSubmit={isAddingBook ? handleAddBook : handleRequestTransfer} className="bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">{isAddingBook ? 'List New Book' : 'Final Step'}</h2>
              <button type="button" onClick={resetForm} className="bg-slate-100 p-2 rounded-xl"><X /></button>
            </div>
            <div className="space-y-4">
              <div className="text-center p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated Identity</p>
                <h3 className="text-sm font-black">@{profile.name}<span className="text-blue-600">#{profile.shortId}</span></h3>
              </div>
              {isAddingBook && (
                <>
                  <div onClick={() => fileInputRef.current.click()} className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden">
                    {bookImageUrl ? <img src={bookImageUrl} className="w-full h-full object-cover" alt="Preview" /> : <div className="text-center text-slate-400"><Camera size={32} className="mx-auto mb-2" /><p className="text-[10px] font-black uppercase tracking-widest">Add Photo</p></div>}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                  </div>
                  <input required placeholder="Book Title" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none" value={newBookTitle} onChange={e => setNewBookTitle(e.target.value)} />
                  <input placeholder="Author Name" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none" value={newBookAuthor} onChange={e => setNewBookAuthor(e.target.value)} />
                  <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold" value={newBookCategory} onChange={e => setNewBookCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  
                  <textarea 
                    placeholder="Owner's Note / Remark (e.g., Condition of the book, return expectations, etc.)" 
                    className="w-full h-24 p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none resize-none focus:ring-2 focus:ring-slate-200"
                    value={newBookRemark}
                    onChange={e => setNewBookRemark(e.target.value)}
                  />
                </>
              )}
              <div className={`p-5 border rounded-2xl space-y-4 bg-slate-50/50`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><ShieldCheck size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Privacy Settings</span></div>
                  <button type="button" onClick={() => setIsPrivateContact(!isPrivateContact)} className={`w-10 h-5 rounded-full relative transition-colors ${isPrivateContact ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isPrivateContact ? 'right-0.5' : 'left-0.5'}`} /></button>
                </div>
                {isPrivateContact ? <input placeholder="Insta / Telegram Handle" className="w-full p-4 bg-white border border-slate-100 rounded-xl text-sm font-bold outline-none shadow-sm" value={socialHandle} onChange={e => setSocialHandle(e.target.value)} /> : <input placeholder="Phone Number" className="w-full p-4 bg-white border border-slate-100 rounded-xl text-sm font-bold outline-none shadow-sm" value={requesterContact} onChange={e => setRequesterContact(e.target.value)} />}
              </div>
              <button type="submit" className={`w-full py-5 rounded-2xl font-black uppercase text-xs text-white shadow-xl ${appMode === 'sharing' ? 'bg-blue-600 shadow-blue-100' : 'bg-rose-600 shadow-rose-100'}`}>Publish Now</button>
            </div>
          </form>
        </div>
      )}

      {/* Broadcast Sidebar */}
      {showNewsPanel && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[80] flex justify-end">
          <div className="bg-white w-full max-w-xs h-full p-6 animate-in slide-in-from-right shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-10 shrink-0"><h2 className="text-xl font-black flex items-center gap-3"><Bell className="text-blue-600" /> Alerts</h2><button onClick={() => setShowNewsPanel(false)} className="bg-slate-50 p-2 rounded-xl"><X size={20} /></button></div>
            <div className="space-y-4 overflow-y-auto no-scrollbar flex-grow">
              {notifications.map(n => (
                <div key={n.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 relative"><div className="absolute top-0 left-0 w-1 h-full bg-blue-500" /><p className="text-sm font-bold text-slate-700">{n.message}</p><p className="text-[8px] font-black text-slate-300 uppercase mt-3">{safeFormatDate(n.createdAt?.toDate?.()?.toISOString())}</p></div>
              ))}
              {notifications.length === 0 && <p className="text-center py-10 text-slate-300 font-bold uppercase text-[10px]">No notifications</p>}
            </div>
          </div>
        </div>
      )}

      {/* Hidden Admin Trigger */}
      <button onDoubleClick={() => setIsAdminMode(true)} className="fixed bottom-0 left-0 w-12 h-12 opacity-0 z-50 cursor-default"></button>
      
      {/* Admin Auth Modal */}
      {isAdminMode && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
          {!isAdminAuth ? (
            <div className="bg-white w-full max-w-sm p-8 rounded-[3rem] shadow-2xl text-center">
               <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-600">
                 <Lock size={32} />
               </div>
               <h2 className="text-2xl font-black mb-2">Admin Access</h2>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">Authorized Personnel Only</p>
               <form onSubmit={handleAdminVerify} className="space-y-4">
                 <input 
                   type="password"
                   placeholder="Enter Password" 
                   className="w-full p-4 bg-slate-100 rounded-2xl font-black text-center outline-none border-2 border-transparent focus:border-red-100"
                   value={adminPassAttempt}
                   onChange={e => setAdminPassAttempt(e.target.value)}
                 />
                 <div className="flex gap-2">
                    <button type="button" onClick={() => setIsAdminMode(false)} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Cancel</button>
                    <button type="submit" className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px]">Login</button>
                 </div>
               </form>
            </div>
          ) : (
            <div className="bg-white w-full max-w-md p-8 rounded-[3rem] shadow-2xl">
              <h2 className="text-2xl font-black mb-6 text-red-600">Broadcast Notice</h2>
              <textarea 
                placeholder="Type message for all users..."
                className="w-full h-40 p-5 bg-slate-50 border rounded-2xl mb-6 font-bold text-sm outline-none resize-none focus:ring-2 focus:ring-red-100" 
                value={adminMsg} 
                onChange={e => setAdminMsg(e.target.value)} 
              />
              <div className="flex gap-3">
                <button onClick={() => {setIsAdminMode(false); setIsAdminAuth(false);}} className="flex-grow py-4 font-black text-slate-400 text-[10px]">Close</button>
                <button onClick={sendNotification} className="flex-grow bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px]">Post Alert</button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}