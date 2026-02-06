/**
 * 📚 BookShare Pro - Build v5.1 (Fixed State Error)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, updateDoc, 
  doc, getDoc, setDoc, deleteDoc, serverTimestamp, arrayUnion 
} from 'firebase/firestore';
import { 
  Plus, BookOpen, Search, Users, ChevronLeft, LayoutGrid, Bookmark, LogOut, Heart, Shield, UserCircle
} from 'lucide-react';

// --- 📦 IMPORT PACKAGES ---
import Auth from './components/Auth';
import BookDetails from './components/BookDetails';
import AddBook from './components/AddBook';
import Community from './components/Community';
import AdminDashboard from './components/AdminDashboard';
import ProfileSettings from './components/ProfileSettings';
import { LoadingScreen, EmptyState, Toast } from './components/Feedback';

// --- FIREBASE CONFIG ---
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

const CLASSES = ["6th", "7th", "8th", "9th", "10th", "11th", "12th", "College"];
const CATEGORIES = ["Maths", "Biology", "Commerce", "Arts", "Science", "Hindi", "Novel", "Self Help", "English", "Other"];

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdminAuth, setIsAdminAuth] = useState(localStorage.getItem(`${appId}_isAdmin`) === 'true');
  const [appMode, setAppMode] = useState(null); 
  const [books, setBooks] = useState([]);
  
  const [toast, setToast] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ✅ FIXED: Missing state added here
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // --- 🔥 AUTH & DATA LOGIC ---
  useEffect(() => {
    signInAnonymously(auth).catch(() => setToast({type:'error', message:'Offline'}));

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const snap = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data'));
        if (snap.exists()) { setProfile(snap.data()); }
        else if (!isAdminAuth) setIsAuthOpen(true);
      }
      setIsDataLoaded(true);
    });

    const unsubBooks = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'books'), (s) => 
      setBooks(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => { unsubAuth(); unsubBooks(); };
  }, [isAdminAuth]);

  const handlePublishBook = async (bookData) => {
    try {
      const today = new Date().toLocaleDateString();
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'books'), {
        ...bookData,
        type: appMode,
        ownerId: user.uid,
        currentOwner: profile.name,
        contact: profile.mobile,
        handoverStatus: 'available',
        history: [{ owner: profile.name, date: today, action: 'Listed' }],
        waitlist: [],
        createdAt: serverTimestamp()
      });
      setIsAddingBook(false);
      setToast({ type: 'success', message: 'Book Added!' });
    } catch (e) {
      setToast({ type: 'error', message: 'Add Failed' });
    }
  };

  const filteredBooks = useMemo(() => {
    let list = books.filter(b => b.type === appMode);
    if (searchTerm) {
      list = list.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return list;
  }, [books, appMode, searchTerm]);

  if (!isDataLoaded) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 overflow-x-hidden">
      
      {/* 📦 PACKAGES */}
      {isAuthOpen && (
        <Auth 
          onLogin={async (m, p) => {
             const snap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'mobile_registry', m));
             if (snap.exists() && snap.data().mpin === p) {
               const pSnap = await getDoc(doc(db, 'artifacts', appId, 'users', snap.data().uid, 'profile', 'data'));
               setProfile(pSnap.data()); setIsAuthOpen(false);
               setToast({type:'success', message:'Welcome Back!'});
             } else setToast({type:'error', message:'Wrong Details'});
          }} 
          onRegister={async (d) => {
             await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), d);
             await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'mobile_registry', d.mobile), { uid: user.uid, mpin: d.mpin });
             setProfile(d); setIsAuthOpen(false);
             setToast({type:'success', message:'Profile Created!'});
          }} 
          onAdminLogin={(id,k)=>{ if(id==='admin'&&k==='admin9893@'){setIsAdminAuth(true);setIsAuthOpen(false);setProfile({name:'Admin'});} }} 
        />
      )}

      {showProfile && <ProfileSettings profile={profile} classes={CLASSES} onClose={()=>setShowProfile(false)} onUpdate={async (d)=>{await updateDoc(doc(db,'artifacts',appId,'users',user.uid,'profile','data'),d); setProfile(d); setShowProfile(false); setToast({type:'success', message:'Updated!'});}} />}
      {isAddingBook && <AddBook onPublish={handlePublishBook} onClose={()=>setIsAddingBook(false)} categories={CATEGORIES} classes={CLASSES} />}
      {showCommunity && <Community posts={[]} onClose={()=>setShowCommunity(false)} onPost={()=>{}} />}
      {selectedBook && <BookDetails book={selectedBook} user={user} isAdmin={isAdminAuth} onClose={()=>setSelectedBook(null)} onDelete={async()=>{await deleteDoc(doc(db,'artifacts',appId,'public',1,'data','books',selectedBook.id));setSelectedBook(null);}} />}

      {/* 📱 UI LAYOUT */}
      {!appMode ? (
        <div className="h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
           <div className="mb-12">
              <div className="bg-indigo-600 w-20 h-20 rounded-[2.2rem] flex items-center justify-center shadow-2xl mx-auto mb-6"><BookOpen className="text-white" size={32} /></div>
              <h1 className="text-5xl font-black text-slate-900 leading-none tracking-tighter">BookShare</h1>
              <div className="flex gap-2 justify-center mt-6">
                <button onClick={()=>setShowCommunity(true)} className="bg-indigo-50 text-indigo-600 px-5 py-2 rounded-full text-[10px] font-black uppercase border border-indigo-100 active:scale-95 transition-all">Community</button>
                <button onClick={()=>setShowProfile(true)} className="p-2.5 bg-white text-slate-500 rounded-full border shadow-sm active:scale-95 transition-all"><UserCircle size={22}/></button>
              </div>
           </div>
           <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
             <button onClick={()=>setAppMode('sharing')} className="bg-white p-7 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center gap-6 active:scale-95 transition-all"><div className="p-3 bg-indigo-50 rounded-2xl"><Users className="text-indigo-600" size={28}/></div><h2 className="text-xl font-black uppercase text-slate-800">Sharing</h2></button>
             <button onClick={()=>setAppMode('donation')} className="bg-white p-7 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center gap-6 active:scale-95 transition-all"><div className="p-3 bg-rose-50 rounded-2xl"><Heart className="text-rose-600" size={28}/></div><h2 className="text-xl font-black uppercase text-slate-800">Donation</h2></button>
           </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right duration-300">
          <header className="p-4 bg-white/80 backdrop-blur-md border-b flex justify-between items-center sticky top-0 z-50">
             <button onClick={()=>setAppMode(null)} className="p-2 bg-slate-100 rounded-xl active:scale-90 transition-all"><ChevronLeft/></button>
             <h1 className="text-sm font-black uppercase tracking-widest text-slate-400">{appMode} Mode</h1>
             <button onClick={()=>setIsAddingBook(true)} className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg active:scale-90 transition-all"><Plus size={24}/></button>
          </header>

          <main className="p-4 grid grid-cols-2 gap-4">
             <div className="col-span-2 mb-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    className="w-full p-4 pl-12 bg-white border-none rounded-2xl font-bold shadow-sm outline-none ring-2 ring-transparent focus:ring-indigo-100 transition-all" 
                    placeholder="Search your book..." 
                    onChange={e=>setSearchTerm(e.target.value)}
                  />
                </div>
             </div>

             {filteredBooks.length === 0 ? <EmptyState /> : filteredBooks.map(b => (
              <div key={b.id} onClick={()=>setSelectedBook(b)} className="bg-white rounded-[2.2rem] overflow-hidden border border-slate-100 shadow-sm active:scale-95 transition-all flex flex-col h-full">
                <div className="aspect-[3/4] bg-slate-50 relative overflow-hidden">
                  {b.imageUrl ? (
                    <img src={b.imageUrl} className="w-full h-full object-cover" alt={b.title} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200"><BookOpen size={40}/></div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <h3 className="font-black text-[11px] uppercase leading-tight text-slate-800 mb-1 line-clamp-2">{b.title}</h3>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-[8px] font-black text-indigo-500 uppercase">{b.bookClass}</span>
                    <span className="text-[8px] font-bold text-slate-300 uppercase">{b.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </main>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* 🧭 NAVIGATION */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t p-4 flex justify-around shadow-2xl z-40">
        <button onClick={()=>{setAppMode(null)}} className={`flex flex-col items-center gap-1 ${!appMode ?'text-indigo-600':'text-slate-300'}`}><LayoutGrid size={24}/><span className="text-[8px] font-black uppercase">Home</span></button>
        <button onClick={()=>setToast({type:'success', message:'Coming Soon!'})} className="flex flex-col items-center gap-1 text-slate-300"><Bookmark size={24}/><span className="text-[8px] font-black uppercase">Saved</span></button>
        <button onClick={()=>setShowLogoutConfirm(true)} className="flex flex-col items-center gap-1 text-slate-300"><LogOut size={24}/><span className="text-[8px] font-black uppercase">Exit</span></button>
      </nav>

      {/* LOGOUT CONFIRM UI */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-6 text-center">
           <div className="bg-white w-full max-w-sm p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95">
              <h2 className="text-2xl font-black mb-8 uppercase text-slate-900 tracking-tighter text-left">Logout Profile?</h2>
              <div className="flex gap-4">
                <button onClick={()=>setShowLogoutConfirm(false)} className="flex-1 py-4 font-black uppercase text-xs text-slate-400">Cancel</button>
                <button onClick={async ()=>{await signOut(auth); localStorage.clear(); window.location.reload();}} className="flex-1 bg-rose-500 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg shadow-rose-200">Sign Out</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}