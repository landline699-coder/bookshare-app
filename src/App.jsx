/**
 * 📚 BookShare Pro - v6.4 (Fixed handleReply Error)
 * Features: Chat System, Admin, Mobile Optimize, Horizontal Scroll
 */

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, updateDoc, 
  doc, getDoc, setDoc, deleteDoc, serverTimestamp, query, orderBy, arrayUnion 
} from 'firebase/firestore'; 
import { 
  Plus, BookOpen, Search, Users, ChevronLeft, LayoutGrid, LogOut, Heart, UserCircle 
} from 'lucide-react';

// --- PACKAGES ---
import Auth from './components/Auth';
import BookDetails from './components/BookDetails';
import AddBook from './components/AddBook';
import Community from './components/Community';
import ProfileSettings from './components/ProfileSettings';
import { LoadingScreen, EmptyState, Toast } from './components/Feedback';

// --- CONFIG ---
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
const CATEGORIES = ["Maths", "Biology", "Science", "Commerce", "Arts", "Hindi", "English", "Novel", "Notes", "Other"];

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdminAuth, setIsAdminAuth] = useState(localStorage.getItem(`${appId}_isAdmin`) === 'true');
  const [appMode, setAppMode] = useState(null); 
  const [books, setBooks] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [toast, setToast] = useState(null);
  
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Mobile Back Logic
  useEffect(() => {
    const handleBackButton = (e) => {
      if (isAddingBook || selectedBook || showCommunity || showProfile || showLogoutConfirm) {
        e.preventDefault();
        setIsAddingBook(false); setSelectedBook(null); setShowCommunity(false); setShowProfile(false); setShowLogoutConfirm(false);
        window.history.pushState(null, null, window.location.pathname);
      } else if (appMode) {
        e.preventDefault(); setAppMode(null);
        window.history.pushState(null, null, window.location.pathname);
      }
    };
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [isAddingBook, selectedBook, showCommunity, showProfile, showLogoutConfirm, appMode]);

  // 2. Data Listeners
  useEffect(() => {
    signInAnonymously(auth).catch(() => setToast({type:'error', message:'Offline'}));
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const snap = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data'));
        if (snap.exists()) setProfile(snap.data());
        else if (!isAdminAuth) setIsAuthOpen(true);
      }
      setIsDataLoaded(true);
    });

    onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'books'), orderBy('createdAt', 'desc')), (s) => setBooks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'community'), orderBy('createdAt', 'desc')), (s) => setCommunityPosts(s.docs.map(d => d.data())));

    return () => unsubAuth();
  }, [isAdminAuth]);

  // 3. ACTIONS
  const handlePublishBook = async (bookData) => {
    if (!profile) return setToast({ type: 'error', message: 'Profile Missing!' });
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'books'), {
        ...bookData,
        type: appMode || 'Sharing', ownerId: user.uid, currentOwner: profile.name, contact: profile.mobile,
        handoverStatus: 'available', createdAt: serverTimestamp(), waitlist: [],
        history: [{ owner: profile.name, date: new Date().toLocaleDateString(), action: 'Listed' }]
      });
      setIsAddingBook(false); setToast({ type: 'success', message: 'Book Published!' });
    } catch (e) { setToast({ type: 'error', message: 'Publish Error' }); }
  };

  const handlePostCommunity = async (text) => {
    if(!profile) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'community'), {
      name: profile.name, text, createdAt: serverTimestamp(), date: new Date().toLocaleDateString()
    });
  };

  // src/App.jsx के अंदर handleBorrow फंक्शन को इससे बदलें:

  // ✅ 4. BORROW FUNCTION (Security Check Added)
  const handleBorrow = async (book, message) => {
    // 1. Check Login
    if(!profile) return setToast({type:'error', message:'Please Login First'});
    
    // 🛡️ 2. SECURITY CHECK: Owner Check (Ye naya code hai)
    if (user.uid === book.ownerId) {
      setToast({ type: 'error', message: "You cannot borrow your own book! 🚫" });
      return; // Yahan se function wapis laut jayega
    }

    try {
      const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', book.id);
      await updateDoc(bookRef, {
        waitlist: arrayUnion({
          uid: user.uid,
          name: profile.name,
          mobile: profile.mobile,
          message: message || "I want to borrow this.",
          date: new Date().toLocaleDateString(),
          status: 'pending',
          ownerReply: ''
        })
      });
      setToast({ type: 'success', message: 'Request & Message Sent!' });
    } catch (e) {
      setToast({ type: 'error', message: 'Request Failed' });
    }
  };
  // ✅ 5. REPLY FUNCTION (Jo Error de raha tha)
  const handleReply = async (book, requesterUid, replyText) => {
    try {
      const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', book.id);
      // Waitlist array ko update karna padega
      const updatedWaitlist = book.waitlist.map(req => {
        if (req.uid === requesterUid) {
          return { ...req, ownerReply: replyText, status: 'replied' };
        }
        return req;
      });
      
      await updateDoc(bookRef, { waitlist: updatedWaitlist });
      setToast({ type: 'success', message: 'Reply Sent!' });
    } catch (e) {
      setToast({ type: 'error', message: 'Reply Failed' });
    }
  };

  const handleComplain = async (bookId, reason) => {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'complaints'), {
      bookId, reporter: profile.name, reason, createdAt: serverTimestamp()
    });
    setToast({type:'success', message:'Report Sent'});
  };

  // Filter Logic
  const filteredBooks = useMemo(() => {
    let list = books.filter(b => b.type === (appMode === 'Sharing' ? 'sharing' : appMode === 'Donation' ? 'donation' : b.type));
    if(appMode) list = books.filter(b => b.type.toLowerCase() === appMode.toLowerCase());
    if (searchTerm) list = list.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return list;
  }, [books, appMode, searchTerm]);

  if (!isDataLoaded) return <LoadingScreen />;

  return (
    <div className="fixed inset-0 bg-slate-50 font-sans flex flex-col overflow-hidden select-none">
      
      {isAuthOpen && <Auth onLogin={async(m,p)=>{const s=await getDoc(doc(db,'artifacts',appId,'public','data','mobile_registry',m));if(s.exists()&&s.data().mpin===p){const p=await getDoc(doc(db,'artifacts',appId,'users',s.data().uid,'profile','data'));setProfile(p.data());setIsAuthOpen(false);}else{setToast({type:'error',message:'Wrong PIN'});}}} onRegister={async(d)=>{await setDoc(doc(db,'artifacts',appId,'users',user.uid,'profile','data'),d);await setDoc(doc(db,'artifacts',appId,'public','data','mobile_registry',d.mobile),{uid:user.uid,mpin:d.mpin});setProfile(d);setIsAuthOpen(false);}} onAdminLogin={(id,k)=>{if(id==='admin'&&k==='admin9893@'){setIsAdminAuth(true);setIsAuthOpen(false);setProfile({name:'Admin'});localStorage.setItem(`${appId}_isAdmin`,'true');}}} />}
      {showProfile && <ProfileSettings profile={profile} onClose={()=>setShowProfile(false)} onUpdate={async(d)=>{await updateDoc(doc(db,'artifacts',appId,'users',user.uid,'profile','data'),d);setProfile(d);setShowProfile(false);}} />}
      {isAddingBook && <AddBook onPublish={handlePublishBook} onClose={()=>setIsAddingBook(false)} categories={CATEGORIES} classes={CLASSES} />}
      {showCommunity && <Community posts={communityPosts} onClose={()=>setShowCommunity(false)} onPost={handlePostCommunity} />}

      {/* ✅ BOOK DETAILS CONNECTED PROPERLY */}
      {selectedBook && (
        <BookDetails 
          book={selectedBook} 
          user={user} 
          isAdmin={isAdminAuth} 
          onClose={()=>setSelectedBook(null)} 
          onBorrow={handleBorrow}   // Connected
          onReply={handleReply}     // Connected (Ab Error nahi aayega)
          onComplain={handleComplain}
          // App.jsx ke andar:
onDelete={async () => {
  try {
    // Ye path bilkul sahi hona chahiye
    const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', selectedBook.id);
    await deleteDoc(bookRef);
    setSelectedBook(null); // Details close karein
    setToast({ type: 'success', message: 'Book deleted successfully' });
  } catch (e) {
    console.error("Delete Error:", e);
    setToast({ type: 'error', message: 'Delete failed' });
  }
}} 
        />
      )}

      {/* UI Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        {!appMode ? (
          <div className="min-h-full flex flex-col items-center justify-center p-8 space-y-8 animate-in fade-in">
             <div className="bg-indigo-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200"><BookOpen className="text-white" size={40}/></div>
             <h1 className="text-5xl font-black text-slate-900 tracking-tighter">BookShare</h1>
             <div className="w-full max-w-xs space-y-4">
               <button onClick={()=>setAppMode('Sharing')} className="w-full bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center gap-5 active:scale-95 transition-all"><div className="bg-indigo-50 p-3 rounded-2xl"><Users className="text-indigo-600" size={24}/></div><span className="font-black uppercase text-lg text-slate-700">Sharing</span></button>
               <button onClick={()=>setAppMode('Donation')} className="w-full bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center gap-5 active:scale-95 transition-all"><div className="bg-rose-50 p-3 rounded-2xl"><Heart className="text-rose-600" size={24}/></div><span className="font-black uppercase text-lg text-slate-700">Donation</span></button>
             </div>
             <div className="flex gap-4 w-full max-w-xs">
               <button onClick={()=>setShowCommunity(true)} className="flex-1 bg-slate-100 py-4 rounded-3xl font-black text-[10px] uppercase text-slate-500 active:scale-95 transition-all">Community</button>
               <button onClick={()=>setShowProfile(true)} className="px-6 bg-slate-100 rounded-3xl text-slate-500 active:scale-95 transition-all"><UserCircle/></button>
             </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right duration-300">
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md p-4 border-b flex justify-between items-center shadow-sm">
              <button onClick={()=>setAppMode(null)} className="p-2 bg-slate-100 rounded-2xl active:scale-90"><ChevronLeft/></button>
              <h1 className="font-black uppercase text-xs text-slate-400 tracking-widest">{appMode} Mode</h1>
              <div className="w-10"/>
            </header>

            <div className="p-4 space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                <input className="w-full p-4 pl-12 bg-white rounded-2xl font-bold shadow-sm outline-none ring-2 ring-transparent focus:ring-indigo-100 transition-all" placeholder="Search title..." onChange={e=>setSearchTerm(e.target.value)}/>
              </div>

              {/* Horizontal Scroll Logic (Netflix Style) */}
              {searchTerm ? (
                <div className="grid grid-cols-2 gap-4">
                  {filteredBooks.map(b => (
                     <div key={b.id} onClick={()=>setSelectedBook(b)} className="bg-white rounded-[2rem] overflow-hidden border shadow-sm active:scale-95 transition-all">
                        <div className="aspect-[2/3] bg-slate-100">{b.imageUrl && <img src={b.imageUrl} className="w-full h-full object-cover"/>}</div>
                        <div className="p-3"><h3 className="font-black text-[10px] uppercase truncate">{b.title}</h3></div>
                     </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-8 pb-10">
                  {CATEGORIES.map(cat => {
                    const catBooks = filteredBooks.filter(b => b.category === cat);
                    if (catBooks.length === 0) return null;
                    return (
                      <div key={cat} className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-end px-2 mb-3">
                          <h3 className="font-black text-lg text-slate-800 tracking-tight">{cat}</h3>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{catBooks.length}</span>
                        </div>
                        <div className="flex overflow-x-auto gap-4 px-2 pb-4 snap-x hide-scrollbar">
                          {catBooks.map(b => (
                            <div key={b.id} onClick={()=>setSelectedBook(b)} className="min-w-[130px] w-[130px] snap-start flex-shrink-0 active:scale-95 transition-all">
                              <div className="aspect-[2/3] bg-white rounded-2xl overflow-hidden shadow-md border border-slate-100 mb-2 relative">
                                {b.imageUrl ? <img src={b.imageUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-300"><BookOpen/></div>}
                              </div>
                              <h4 className="font-bold text-[11px] leading-tight truncate text-slate-700">{b.title}</h4>
                              <p className="text-[9px] font-bold text-indigo-500 uppercase">{b.bookClass}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {filteredBooks.length === 0 && <EmptyState message="No books found."/>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t p-4 pb-6 flex justify-around items-center z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <button onClick={()=>setAppMode(null)} className={`flex flex-col items-center gap-1 active:scale-90 transition-all ${!appMode?'text-indigo-600':'text-slate-300'}`}><LayoutGrid size={24}/><span className="text-[9px] font-black uppercase">Home</span></button>
        <button onClick={()=>{if(!appMode)setAppMode('Sharing');setIsAddingBook(true)}} className="bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 -mt-10 border-[6px] border-slate-50 active:scale-90 transition-all"><Plus size={30}/></button>
        <button onClick={()=>setShowLogoutConfirm(true)} className="flex flex-col items-center gap-1 text-slate-300 active:scale-90 transition-all active:text-rose-500"><LogOut size={24}/><span className="text-[9px] font-black uppercase">Exit</span></button>
      </nav>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-xs p-8 rounded-[2.5rem] shadow-2xl text-center scale-100 animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase">Log Out?</h2>
            <div className="flex flex-col gap-3">
              <button onClick={async()=>{await signOut(auth);localStorage.clear();window.location.reload();}} className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black uppercase shadow-lg shadow-rose-200 active:scale-95 transition-all">Yes, Sign Out</button>
              <button onClick={()=>setShowLogoutConfirm(false)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase active:scale-95 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}