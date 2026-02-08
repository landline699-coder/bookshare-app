/**
 * 📚 BookShare Pro - v8.7 (Updated Categories & Debugging)
 * Features: New Categories, Error Reporting, Excel Export, Netflix UI, Strict Login
 */

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, updateDoc, 
  doc, getDoc, setDoc, deleteDoc, serverTimestamp, query, orderBy, arrayUnion 
} from 'firebase/firestore'; 
import { 
  Plus, BookOpen, Search, Users, ChevronLeft, LayoutGrid, LogOut, Heart, UserCircle, Sparkles, ArrowRight, FileSpreadsheet 
} from 'lucide-react';

// --- COMPONENTS ---
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

// ✅ UPDATED CATEGORIES LIST
const CLASSES = ["6th", "7th", "8th", "9th", "10th", "11th", "12th", "College", "Other"];
const CATEGORIES = ["Maths", "Biology", "Science", "Commerce", "Arts", "Hindi", "English", "Novel", "Notes", "Computer", "Self Help & Development", "Other"];

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdminAuth, setIsAdminAuth] = useState(localStorage.getItem(`${appId}_isAdmin`) === 'true');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
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
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Auth Listener
  useEffect(() => {
    signInAnonymously(auth).catch(() => setToast({type:'error', message:'Connection Error'}));
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const snap = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data'));
        if (snap.exists()) setProfile(snap.data());
      }
      setIsDataLoaded(true);
    });

    onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'books'), orderBy('createdAt', 'desc')), (s) => setBooks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'community'), orderBy('createdAt', 'desc')), (s) => setCommunityPosts(s.docs.map(d => d.data())));

    return () => unsubAuth();
  }, [isAdminAuth]);

  // 2. Mobile Back Logic
  useEffect(() => {
    const handleBack = (e) => {
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
    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  }, [isAddingBook, selectedBook, showCommunity, showProfile, showLogoutConfirm, appMode]);

  // --- ACTIONS ---

  // EXCEL REPORT EXPORT (Admin Only)
  const exportReport = () => {
    if (!isAdminAuth) return;
    if (books.length === 0) return setToast({type: 'error', message: 'No data to export'});

    let csvContent = "Book Title,Category,Class,Language,Owner Name,Owner Mobile,Status,Requests Count,Date Added\n";

    books.forEach(b => {
      const clean = (t) => t ? `"${t.toString().replace(/"/g, '""')}"` : "-"; 
      const row = [
        clean(b.title),
        clean(b.category),
        clean(b.bookClass),
        clean(b.language || "English"), // Added Language to Export
        clean(b.currentOwner),
        clean(b.contact),
        b.waitlist?.length > 0 ? "Requested" : "Available",
        b.waitlist?.length || 0,
        b.history?.[0]?.date || "-"
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `BookShare_Report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ type: 'success', message: 'Report Downloaded!' });
  };

  // ✅ IMPROVED PUBLISH FUNCTION (With Error Debugging)
  const handlePublishBook = async (bookData) => {
    if (!profile) return setToast({ type: 'error', message: 'Login required to publish!' });
    
    setToast({ type: 'success', message: 'Publishing...' }); // Feedback

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'books'), {
        ...bookData, // Contains title, category, class, AND language now
        type: appMode || 'Sharing', 
        ownerId: user.uid, 
        currentOwner: profile.name, 
        contact: profile.mobile,
        handoverStatus: 'available', 
        createdAt: serverTimestamp(), 
        waitlist: [],
        history: [{ owner: profile.name, date: new Date().toLocaleDateString(), action: 'Listed' }]
      });
      setIsAddingBook(false); 
      setToast({ type: 'success', message: 'Book Published Successfully! 🎉' });
    } catch (e) { 
      console.error("Publish Error:", e);
      setToast({ type: 'error', message: `Failed: ${e.message}` }); // Show real error
    }
  };

  const handleBorrow = async (book, message) => {
    if(!profile) return setToast({type:'error', message:'Login First'});
    if (user.uid === book.ownerId) { setToast({ type: 'error', message: "You cannot borrow your own book! 🚫" }); return; }
    try {
      const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', book.id);
      await updateDoc(bookRef, {
        waitlist: arrayUnion({ uid: user.uid, name: profile.name, mobile: profile.mobile, message, date: new Date().toLocaleDateString(), status: 'pending', ownerReply: '' })
      });
      setToast({ type: 'success', message: 'Request Sent!' });
    } catch (e) { setToast({ type: 'error', message: 'Request Failed' }); }
  };

  const handleReply = async (book, reqUid, text) => {
    try {
      const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', book.id);
      const updatedList = book.waitlist.map(r => r.uid === reqUid ? { ...r, ownerReply: text, status: 'replied' } : r);
      await updateDoc(bookRef, { waitlist: updatedList });
      setToast({ type: 'success', message: 'Reply Sent!' });
    } catch (e) { setToast({ type: 'error', message: 'Failed to Send' }); }
  };

  const filteredBooks = useMemo(() => {
    let list = books.filter(b => b.type.toLowerCase() === (appMode || '').toLowerCase());
    if (searchTerm) list = list.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return list;
  }, [books, appMode, searchTerm]);

  // --- RENDER ---
  if (!isDataLoaded) return <LoadingScreen />;

  // 🔒 STRICT LOGIN (No Guest Access)
  if (!profile && !isAdminAuth) {
    return (
      <div className="fixed inset-0 bg-slate-50 overflow-hidden">
        <Auth 
          onLogin={async(m,p)=>{
            const s = await getDoc(doc(db,'artifacts',appId,'public','data','mobile_registry',m));
            if(s.exists() && s.data().mpin === p){
              const pData = await getDoc(doc(db,'artifacts',appId,'users',s.data().uid,'profile','data'));
              setProfile(pData.data());
            } else { setToast({type:'error', message:'Invalid Mobile or PIN'}); }
          }} 
          onRegister={async(d)=>{
            const regRef = doc(db, 'artifacts', appId, 'public', 'data', 'mobile_registry', d.mobile);
            const regSnap = await getDoc(regRef);
            if (regSnap.exists()) { setToast({type:'error', message:'Number already exists!'}); return; }
            await setDoc(doc(db,'artifacts',appId,'users',user.uid,'profile','data'), d);
            await setDoc(regRef, {uid:user.uid, mpin:d.mpin});
            setProfile(d); setToast({type:'success', message:'Account Created!'});
          }} 
          onAdminLogin={(id,k)=>{if(id==='admin' && k==='admin9893@'){setIsAdminAuth(true); setProfile({name:'Admin'}); localStorage.setItem(`${appId}_isAdmin`,'true');}}} 
        />
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 font-sans flex flex-col overflow-hidden select-none">
      
      {showProfile && <ProfileSettings profile={profile} isAdmin={isAdminAuth} onClose={()=>setShowProfile(false)} onUpdate={async(d)=>{await updateDoc(doc(db,'artifacts',appId,'users',user.uid,'profile','data'),d); setProfile(d); setToast({type:'success', message:'Updated!'});}} />}
      
      {/* Pass updated CATEGORIES to AddBook */}
      {isAddingBook && <AddBook onPublish={handlePublishBook} onClose={()=>setIsAddingBook(false)} categories={CATEGORIES} classes={CLASSES} />}
      
      {showCommunity && <Community posts={communityPosts} onClose={()=>setShowCommunity(false)} onPost={async(t)=>{await addDoc(collection(db,'artifacts',appId,'public', 'data', 'community'),{name:profile.name, text:t, createdAt: serverTimestamp(), date: new Date().toLocaleDateString()});}} />}
      
      {selectedBook && (
        <BookDetails 
          book={selectedBook} user={user} isAdmin={isAdminAuth} 
          onClose={()=>setSelectedBook(null)} onBorrow={handleBorrow} onReply={handleReply} 
          onDelete={async()=>{await deleteDoc(doc(db,'artifacts',appId,'public','data','books',selectedBook.id)); setSelectedBook(null); setToast({type:'success', message:'Deleted'});}} 
          onComplain={async(id,r)=>{await addDoc(collection(db,'artifacts',appId,'public','data','complaints'),{bookId:id, reporter:profile.name, reason:r, createdAt:serverTimestamp()}); setToast({type:'success', message:'Reported'});}} 
        />
      )}

      {!appMode ? (
        /* 🏠 DASHBOARD (Landing) */
        <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
          
          {/* Header with Admin Download Button */}
          <div className="p-6 flex justify-between items-center">
             <div className="bg-white p-4 rounded-[1.5rem] shadow-md border border-slate-100"><BookOpen className="text-indigo-600" size={32}/></div>
             
             <div className="flex gap-3">
               {/* 📊 EXCEL EXPORT BUTTON (Admin Only) */}
               {isAdminAuth && (
                 <button onClick={exportReport} className="bg-green-100 text-green-700 p-3 rounded-full shadow-sm border border-green-200 active:scale-95 transition-all flex items-center justify-center" title="Download Report">
                   <FileSpreadsheet size={24} /> 
                 </button>
               )}
               
               <button onClick={()=>setShowProfile(true)} className="flex items-center gap-3 bg-white pl-4 pr-2 py-2 rounded-full shadow-sm border border-slate-100 active:scale-95 transition-all">
                 <div className="text-right"><p className="text-xs font-black text-slate-800 leading-tight">{profile?.name.split(' ')[0]}</p><p className="text-[10px] font-bold text-slate-400">{profile?.studentClass || 'Student'}</p></div>
                 <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">{profile?.name[0]}</div>
               </button>
             </div>
          </div>

          <div className="px-6 mt-6 mb-10 text-center">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">Book<span className="text-indigo-600">Share</span></h1>
            <p className="text-slate-500 font-bold text-sm mx-auto w-4/5">Share knowledge, help others, and build your library together.</p>
          </div>
          <div className="px-6 grid grid-cols-2 gap-4 mb-8">
            <button onClick={()=>setAppMode('Sharing')} className="h-64 bg-white rounded-[3rem] flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(79,70,229,0.1)] border border-slate-100 group active:scale-95 transition-all relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"/>
               <div className="bg-indigo-100 w-20 h-20 rounded-[2rem] flex items-center justify-center text-indigo-600 relative z-10 mb-4 shadow-inner"><Users size={36}/></div>
               <div className="relative z-10 text-center"><h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Sharing</h2><p className="text-[10px] font-black text-indigo-400 mt-1 uppercase tracking-widest">Borrow & Read</p></div>
            </button>
            <button onClick={()=>setAppMode('Donation')} className="h-64 bg-white rounded-[3rem] flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(244,63,94,0.1)] border border-slate-100 group active:scale-95 transition-all relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"/>
               <div className="bg-rose-100 w-20 h-20 rounded-[2rem] flex items-center justify-center text-rose-600 relative z-10 mb-4 shadow-inner"><Heart size={36}/></div>
               <div className="relative z-10 text-center"><h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Donation</h2><p className="text-[10px] font-black text-rose-400 mt-1 uppercase tracking-widest">Give & Help</p></div>
            </button>
          </div>
          <div className="px-6 pb-20">
            <button onClick={()=>setShowCommunity(true)} className="w-full bg-slate-900 rounded-[2.5rem] p-8 flex items-center justify-between shadow-2xl shadow-slate-400 active:scale-95 transition-all relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 opacity-90"/>
               <div className="relative z-10 flex items-center gap-5">
                 <div className="bg-white/10 p-4 rounded-2xl text-indigo-300 backdrop-blur border border-white/5 group-hover:rotate-12 transition-transform"><Sparkles size={28}/></div>
                 <div className="text-left"><h3 className="text-white font-black text-xl tracking-tight">Community</h3><p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Join the discussion</p></div>
               </div>
               <div className="relative z-10 bg-white text-slate-900 p-3 rounded-full shadow-lg group-hover:translate-x-2 transition-transform"><ArrowRight size={20}/></div>
            </button>
          </div>
        </div>
      ) : (
        /* 📱 INNER APP (Sharing/Donation) */
        <div className="flex-1 flex flex-col h-full bg-slate-50">
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md p-4 border-b flex justify-between items-center shadow-sm">
            <button onClick={()=>setAppMode(null)} className="p-2 bg-slate-100 rounded-2xl active:scale-90"><ChevronLeft/></button>
            <h1 className="font-black uppercase text-xs text-slate-400 tracking-widest">{appMode} Mode</h1>
            <div className="w-10"/>
          </header>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              <input className="w-full p-4 pl-12 bg-white rounded-2xl font-bold shadow-sm outline-none ring-2 ring-transparent focus:ring-indigo-100 transition-all" placeholder="Search title..." onChange={e=>setSearchTerm(e.target.value)}/>
            </div>

            {searchTerm ? (
                /* Grid for Search Results */
                <div className="grid grid-cols-2 gap-4">
                  {filteredBooks.map(b => (
                     <div key={b.id} onClick={()=>setSelectedBook(b)} className="bg-white rounded-[2rem] overflow-hidden border shadow-sm active:scale-95 transition-all">
                        <div className="aspect-[2/3] bg-slate-100">{b.imageUrl && <img src={b.imageUrl} className="w-full h-full object-cover"/>}</div>
                        <div className="p-3"><h3 className="font-black text-[10px] uppercase truncate">{b.title}</h3></div>
                     </div>
                  ))}
                </div>
            ) : (
                /* 📺 NETFLIX STYLE ROWS WITH BADGES */
                <div className="space-y-8">
                  {CATEGORIES.map(cat => {
                    const catBooks = filteredBooks.filter(b => b.category === cat);
                    if (catBooks.length === 0) return null;
                    return (
                      <div key={cat} className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-end px-2 mb-3">
                          <h3 className="font-black text-lg text-slate-800 tracking-tight">{cat}</h3>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">{catBooks.length}</span>
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

          {/* Navigation Bar */}
          <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t p-4 pb-6 flex justify-around items-center z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <button onClick={() => setAppMode(null)} className={`flex flex-col items-center gap-1 active:scale-90 transition-all ${!appMode ? 'text-indigo-600' : 'text-slate-300'}`}>
                <div className={`p-2 rounded-2xl ${!appMode ? 'bg-indigo-50' : ''}`}><LayoutGrid size={24}/></div>
                <span className="text-[9px] font-black uppercase">Home</span>
            </button>
            <button onClick={()=>{if(!appMode)setAppMode('Sharing');setIsAddingBook(true)}} className="bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 -mt-10 border-[6px] border-slate-50 active:scale-90 transition-all"><Plus size={30}/></button>
            <button onClick={() => setShowLogoutConfirm(true)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-rose-500 active:scale-90 transition-all group">
                <div className="p-2 rounded-2xl group-hover:bg-rose-50 group-active:bg-rose-100 transition-colors"><LogOut size={22}/></div>
                <span className="text-[10px] font-bold uppercase tracking-[2px] antialiased">Logout</span>
            </button>
          </nav>
        </div>
      )}

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