/**
 * 📚 BookShare Pro - v9.2 (Final Master)
 * Includes: Smart Security (Name+Mobile Check), Notifications, Edit Mode, Badges, Modules
 */

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, updateDoc, 
  doc, getDoc, setDoc, deleteDoc, serverTimestamp, query, orderBy, arrayUnion 
} from 'firebase/firestore'; 
import { ChevronLeft, Search, BookOpen } from 'lucide-react';

// --- MODULE IMPORTS ---
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
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

// ✅ UPDATED LISTS (Added "Everyone")
const CLASSES = ["Everyone", "6th", "7th", "8th", "9th", "10th", "11th", "12th", "College", "Other"];
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

  // 2. Back Button Logic
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

  // ✅ NOTIFICATION LOGIC (For Bell Icon)
  const myBooksWithRequests = useMemo(() => {
    if (!user) return [];
    // Check books owned by this user ID OR matched by Name+Mobile (Smart check for legacy books)
    return books.filter(b => 
      (b.ownerId === user.uid || (profile && b.currentOwner === profile.name && b.contact === profile.mobile)) 
      && b.waitlist && b.waitlist.some(r => r.status === 'pending')
    );
  }, [books, user, profile]);

  // --- ACTIONS ---

  const exportReport = () => {
    if (!isAdminAuth) return;
    if (books.length === 0) return setToast({type: 'error', message: 'No data'});
    let csvContent = "Book Title,Category,Class,Language,Owner Name,Owner Mobile,Status,Requests Count,Date Added\n";
    books.forEach(b => {
      const clean = (t) => t ? `"${t.toString().replace(/"/g, '""')}"` : "-"; 
      const row = [clean(b.title), clean(b.category), clean(b.bookClass), clean(b.language), clean(b.currentOwner), clean(b.contact), b.waitlist?.length > 0 ? "Requested" : "Available", b.waitlist?.length || 0, b.history?.[0]?.date || "-"];
      csvContent += row.join(",") + "\n";
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.setAttribute("download", `BookShare_Report.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
    setToast({ type: 'success', message: 'Report Downloaded!' });
  };

  const handlePublishBook = async (bookData) => {
    if (!profile) return setToast({ type: 'error', message: 'Login required!' });
    setToast({ type: 'success', message: 'Publishing...' });
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'books'), {
        ...bookData, type: appMode || 'Sharing', ownerId: user.uid, currentOwner: profile.name, contact: profile.mobile,
        handoverStatus: 'available', createdAt: serverTimestamp(), waitlist: [],
        history: [{ owner: profile.name, date: new Date().toLocaleDateString(), action: 'Listed' }]
      });
      setIsAddingBook(false); setToast({ type: 'success', message: 'Published!' });
    } catch (e) { setToast({ type: 'error', message: `Failed: ${e.message}` }); }
  };

  // ✅ UPDATE BOOK (EDIT)
  const handleUpdateBook = async (bookId, updatedData) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', bookId), updatedData);
      setToast({ type: 'success', message: 'Book Updated!' });
    } catch (e) { setToast({ type: 'error', message: 'Update Failed' }); }
  };

  // ✅ SMART SELF-REQUEST BLOCKER
  const handleBorrow = async (book, message) => {
    if(!profile) return setToast({type:'error', message:'Login First'});
    
    // 🛡️ Security: Check ID match OR Name+Mobile match
    const isOwnerByUID = user.uid === book.ownerId;
    const isOwnerByProfile = profile.name === book.currentOwner && profile.mobile === book.contact;

    if (isOwnerByUID || isOwnerByProfile) { 
      setToast({ type: 'error', message: "You cannot borrow your own book! 🚫" }); 
      return; 
    }

    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', book.id), {
        waitlist: arrayUnion({ uid: user.uid, name: profile.name, mobile: profile.mobile, message, date: new Date().toLocaleDateString(), status: 'pending', ownerReply: '' })
      });
      setToast({ type: 'success', message: 'Request Sent!' });
    } catch (e) { setToast({ type: 'error', message: 'Failed' }); }
  };

  const handleReply = async (book, reqUid, text) => {
    try {
      const status = text.toLowerCase().includes('yes') || text.toLowerCase().includes('approve') ? 'approved' : 'replied';
      const updatedList = book.waitlist.map(r => r.uid === reqUid ? { ...r, ownerReply: text, status: status } : r);
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', book.id), { waitlist: updatedList });
      setToast({ type: 'success', message: 'Sent!' });
    } catch (e) { setToast({ type: 'error', message: 'Failed' }); }
  };

  const handleHandover = async (book, requesterUid) => {
     try {
        const updatedList = book.waitlist.map(r => r.uid === requesterUid ? { ...r, status: 'handed_over' } : r);
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', book.id), { waitlist: updatedList });
        setToast({ type: 'success', message: 'Marked as Handed Over' });
     } catch (e) { setToast({ type: 'error', message: 'Update Failed' }); }
  };

  const handleReceive = async (book, request) => {
      try {
        const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', book.id);
        await updateDoc(bookRef, {
          ownerId: request.uid, currentOwner: request.name, contact: request.mobile, waitlist: [],
          history: arrayUnion({ owner: request.name, date: new Date().toLocaleDateString(), action: `Received from ${book.currentOwner}` })
        });
        setSelectedBook(null); setToast({ type: 'success', message: 'Book Received!' });
      } catch (e) { setToast({ type: 'error', message: 'Transfer Failed' }); }
  };

  const filteredBooks = useMemo(() => {
    let list = books.filter(b => b.type.toLowerCase() === (appMode || '').toLowerCase());
    if (searchTerm) list = list.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return list;
  }, [books, appMode, searchTerm]);

  // --- RENDER ---
  if (!isDataLoaded) return <LoadingScreen />;

  if (!profile && !isAdminAuth) {
    return (
      <div className="fixed inset-0 bg-slate-50 overflow-hidden">
        <Auth 
          onLogin={async(m,p)=>{
            const s = await getDoc(doc(db,'artifacts',appId,'public','data','mobile_registry',m));
            if(s.exists() && s.data().mpin === p){
              const pData = await getDoc(doc(db,'artifacts',appId,'users',s.data().uid,'profile','data'));
              setProfile(pData.data());
            } else { setToast({type:'error', message:'Invalid Credentials'}); }
          }} 
          onRegister={async(d)=>{
             const regRef = doc(db, 'artifacts', appId, 'public', 'data', 'mobile_registry', d.mobile);
             const regSnap = await getDoc(regRef);
             if (regSnap.exists()) { setToast({type:'error', message:'Exists!'}); return; }
             await setDoc(doc(db,'artifacts',appId,'users',user.uid,'profile','data'), d);
             await setDoc(regRef, {uid:user.uid, mpin:d.mpin});
             setProfile(d); setToast({type:'success', message:'Created!'});
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
      
      {isAddingBook && <AddBook onPublish={handlePublishBook} onClose={()=>setIsAddingBook(false)} categories={CATEGORIES} classes={CLASSES} />}
      
      {showCommunity && <Community posts={communityPosts} onClose={()=>setShowCommunity(false)} onPost={async(t)=>{await addDoc(collection(db,'artifacts',appId,'public', 'data', 'community'),{name:profile.name, text:t, createdAt: serverTimestamp(), date: new Date().toLocaleDateString()});}} />}
      
      {selectedBook && (
        <BookDetails 
          book={selectedBook} 
          user={user} 
          profile={profile}
          isAdmin={isAdminAuth} 
          onClose={()=>setSelectedBook(null)} 
          onBorrow={handleBorrow} 
          onReply={handleReply} 
          onHandover={handleHandover} 
          onReceive={handleReceive}
          onUpdate={handleUpdateBook} // ✅ Pass Edit Function
          onDelete={async()=>{await deleteDoc(doc(db,'artifacts',appId,'public','data','books',selectedBook.id)); setSelectedBook(null); setToast({type:'success', message:'Deleted'});}} 
          onComplain={async(id,r)=>{await addDoc(collection(db,'artifacts',appId,'public','data','complaints'),{bookId:id, reporter:profile.name, reason:r, createdAt:serverTimestamp()}); setToast({type:'success', message:'Reported'});}} 
        />
      )}

      {!appMode ? (
        <LandingPage 
          profile={profile} 
          setAppMode={setAppMode} 
          setShowProfile={setShowProfile} 
          setShowCommunity={setShowCommunity} 
          isAdminAuth={isAdminAuth} 
          exportReport={exportReport}
          myBooksWithRequests={myBooksWithRequests} // ✅ Pass Notifications
          onOpenRequest={setSelectedBook}          
        />
      ) : (
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
                <div className="grid grid-cols-2 gap-4">
                  {filteredBooks.map(b => (
                     <div key={b.id} onClick={()=>setSelectedBook(b)} className="bg-white rounded-[2rem] overflow-hidden border shadow-sm active:scale-95 transition-all relative">
                        {/* ✅ RED BADGE (Pending Requests) */}
                        {b.waitlist && b.waitlist.filter(r=>r.status==='pending').length > 0 && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-white shadow-sm z-10 animate-pulse">
                            +{b.waitlist.filter(r=>r.status==='pending').length}
                          </div>
                        )}
                        <div className="aspect-[2/3] bg-slate-100">{b.imageUrl && <img src={b.imageUrl} className="w-full h-full object-cover"/>}</div>
                        <div className="p-3"><h3 className="font-black text-[10px] uppercase truncate">{b.title}</h3></div>
                     </div>
                  ))}
                </div>
            ) : (
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
                            <div key={b.id} onClick={()=>setSelectedBook(b)} className="min-w-[130px] w-[130px] snap-start flex-shrink-0 active:scale-95 transition-all relative">
                              {/* ✅ RED BADGE (Pending Requests) */}
                              {b.waitlist && b.waitlist.filter(r=>r.status==='pending').length > 0 && (
                                <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-white shadow-sm z-10 animate-pulse">
                                  +{b.waitlist.filter(r=>r.status==='pending').length}
                                </div>
                              )}
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

          <Navbar appMode={appMode} setAppMode={setAppMode} onAddClick={()=>{if(!appMode)setAppMode('Sharing');setIsAddingBook(true)}} onLogoutClick={()=>setShowLogoutConfirm(true)} />
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-xs p-8 rounded-[2.5rem] shadow-2xl text-center scale-100 animate-in zoom-in-95">
             <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase">Log Out?</h2>
             <div className="flex flex-col gap-3">
               <button onClick={async()=>{await signOut(auth);localStorage.clear();window.location.reload();}} className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black uppercase">Yes, Sign Out</button>
               <button onClick={()=>setShowLogoutConfirm(false)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase">Cancel</button>
             </div>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}