// --- 1. IMPORTS ---
import React, { useState, useEffect } from 'react';
import * as fb from './services/firebaseService';
import { CLASSES, CATEGORIES } from './config/constants';
import useNotifications from './hooks/useNotifications';
import { AlertTriangle, Plus } from 'lucide-react';
import * as XLSX from 'xlsx'; 

// Components
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import BookDetails from './components/BookDetails';
import AddBook from './components/AddBook';
import Community from './components/Community';
import ProfileSettings from './components/ProfileSettings';
import BookGrid from './components/BookGrid';
import AdminLogin from './components/AdminLogin';
import AdminReports from './components/AdminReports';
import { GlobalLoader, LoadingScreen, Toast } from './components/Feedback';

export default function App() {
  // --- 2. STATES ---
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [books, setBooks] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [reports, setReports] = useState([]); 
  const [allUsers, setAllUsers] = useState([]); 
  const [appMode, setAppMode] = useState(null);
  
  const [selectedBook, setSelectedBook] = useState(null);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  const { notifications, totalCount } = useNotifications(books, user, profile);

  // --- 3. LIVE LISTENERS ---
  useEffect(() => {
    let unsubProfile = null;
    const unsubAuth = fb.subscribeToAuth((u) => {
      if (u) {
        setUser(u);
        if (unsubProfile) unsubProfile();
        unsubProfile = fb.subscribeToUserProfile(u.uid, (p) => {
          if (p) {
            setProfile(p);
            localStorage.setItem('userProfile', JSON.stringify(p));
          } else {
            fb.logoutUser(); setUser(null); setProfile(null);
          }
          setIsDataLoaded(true);
        });
      } else {
        setUser(null); setProfile(null); setIsAdmin(false);
        if(unsubProfile) unsubProfile();
        setIsDataLoaded(true);
      }
    });

    const unsubBooks = fb.subscribeToBooks(setBooks);
    const unsubComm = fb.subscribeToCommunity(setCommunityPosts);
    const unsubReports = fb.subscribeToReports(setReports);
    const unsubUsers = fb.subscribeToAllUsers(setAllUsers);

    return () => { 
      unsubAuth(); if(unsubProfile) unsubProfile(); 
      unsubBooks(); unsubComm(); unsubReports(); unsubUsers();
    };
  }, []);

  // --- 4. CALCULATIONS (Profile Stats) ---
  const userStats = {
    shared: books.filter(b => b.ownerId === user?.uid && (b.history || []).length <= 1).length,
    borrowed: books.filter(b => b.ownerId === user?.uid && (b.history || []).length > 1).length
  };

  // --- 5. HANDLERS (All Key Features) ---
  
  // 📥 Excel Feature (Books + Students Directory)
  const handleExportData = () => {
    const booksData = books.map(b => ({
      Title: b.title, Author: b.author || '-', Subject: b.subject, Class: b.classLevel, Owner: b.currentOwner, Status: b.handoverStatus
    }));
    const usersData = allUsers.map(u => ({
      Name: u.name, Mobile: u.mobile, Class: u.studentClass, Joined: u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : '-'
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(booksData), "All Books");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usersData), "Student Directory");
    XLSX.writeFile(wb, "School_BookShare_Admin_Data.xlsx");
    setToast({ type: 'success', message: 'Excel Downloaded! 📥' });
  };

  // 📝 Update Feature (Title/Subject/Author)
  const handleReply = async (book, uid, txt, extraData) => {
    if (txt === 'UPDATE') {
      await fb.updateBook(book.id, { 
        title: extraData.title, 
        subject: extraData.subject,
        author: extraData.author 
      });
      setToast({ type: 'success', message: 'Details Updated!' });
      return;
    }
    const status = txt.includes('Approved') ? 'approved' : 'rejected';
    const updated = book.waitlist.map(r => r.uid === uid ? { ...r, status, rejectionDate: status === 'rejected' ? new Date().toISOString() : null } : r);
    await fb.updateBook(book.id, { waitlist: updated });
  };

  // 🗑️ Delete Feature
  const handleDeleteBook = async (bookId) => {
    if (window.confirm("Delete this book?")) {
      await fb.deleteBook(bookId); setSelectedBook(null); setToast({ type: 'success', message: 'Deleted!' });
    }
  };

  // 🤝 Handover & Receive Flow
  const handleHandover = async (book, rUid) => {
    const updated = book.waitlist.map(r => r.uid === rUid ? { ...r, status: 'handed_over' } : r);
    await fb.updateBook(book.id, { waitlist: updated });
    setToast({ type: 'success', message: 'Handover Marked' });
  };

  const handleReceive = async (book, req) => {
    await fb.updateBook(book.id, {
      ownerId: req.uid, currentOwner: req.name, contact: req.mobile,        
      handoverStatus: 'available', waitlist: [],                   
      history: [...(book.history || []), { owner: req.name, date: new Date().toLocaleDateString(), action: `Received` }]
    });
    setSelectedBook(null); setToast({ type: 'success', message: 'Book Received!' });
  };

  // --- 6. RENDER ---
  if (!isDataLoaded) return <LoadingScreen />;
  if (!user) return <Auth />;
  if (user && !profile) return <GlobalLoader message="Syncing Profile..." />;

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden">
      <Toast toast={toast} onClose={() => setToast(null)} />
      {isSyncing && <GlobalLoader message="Processing..." />}

      <Navbar 
        profile={profile} onOpenProfile={() => setShowProfile(true)} onOpenAdmin={() => setShowAdminLogin(true)}
        notifications={notifications} totalRequests={totalCount} onOpenCommunity={() => setShowCommunity(true)} onLogout={fb.logoutUser}
      />

      <main className="flex-1 overflow-y-auto pb-32 pt-20 px-4">
        {!appMode && !searchTerm ? (
           <LandingPage profile={profile} onSetMode={setAppMode} onSearch={setSearchTerm} setShowCommunity={setShowCommunity} setShowProfile={setShowProfile} />
        ) : (
           <>
             <button onClick={() => { setAppMode(null); setSearchTerm(''); }} className="mb-4 text-indigo-600 font-bold flex items-center gap-1">← Back</button>
             <BookGrid books={books} appMode={appMode} searchTerm={searchTerm} categories={CATEGORIES} onSelectBook={setSelectedBook} />
           </>
        )}
      </main>

      {/* POPUPS & MODALS */}
      {selectedBook && (
        <BookDetails 
          book={selectedBook} user={user} profile={profile} classes={CLASSES} isAdmin={isAdmin} 
          onClose={() => setSelectedBook(null)} onReply={handleReply} onHandover={handleHandover} 
          onReceive={handleReceive} onDelete={() => handleDeleteBook(selectedBook.id)}
          onBorrow={async (b, m) => { await fb.requestBook(b.id, { uid: user.uid, name: profile.name, mobile: profile.mobile, message: m }); setToast({type:'success', message:'Sent'}); }}
          onReport={(b, r) => fb.addReport({bookId: b.id, bookTitle: b.title, reason: r, reporterName: profile.name})}
        />
      )}

      {isAddingBook && <AddBook mode={appMode} user={user} profile={profile} classes={CLASSES} categories={CATEGORIES} onClose={() => setIsAddingBook(false)} onPublish={async (d) => { setIsSyncing(true); await fb.addBook(d, user, profile, appMode); setIsAddingBook(false); setIsSyncing(false); setToast({type:'success', message:'Published!'}); }} />}
      {showCommunity && <Community posts={communityPosts} profile={profile} onClose={() => setShowCommunity(false)} onPost={(t) => fb.postToCommunity(profile, t)} isAdmin={isAdmin} onDeletePost={fb.deleteCommunityPost}/>}
      {showProfile && <ProfileSettings profile={profile} stats={userStats} onClose={() => setShowProfile(false)} onLogout={fb.logoutUser} onUpdate={async (p) => { await fb.updateProfile(user.uid, p); setProfile(p); setShowProfile(false); }} />}
      {showAdminLogin && <AdminLogin onClose={() => setShowAdminLogin(false)} onLogin={setIsAdmin} />}
      {showReports && <AdminReports reports={reports} onClose={() => setShowReports(false)} onResolve={fb.deleteReport} onExport={handleExportData} onDeleteBook={async (bid, rid) => { await fb.deleteBook(bid); await fb.deleteReport(rid); }} />}

      {/* FLOATING BUTTONS */}
      {appMode && !isAddingBook && !selectedBook && (
        <button onClick={() => setIsAddingBook(true)} className="fixed bottom-8 right-6 bg-slate-900 text-white w-16 h-16 rounded-full shadow-2xl z-40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"><Plus size={32} /></button>
      )}

      {isAdmin && (
        <button onClick={() => setShowReports(true)} className="fixed bottom-28 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-2xl z-50 flex items-center gap-2 border-4 border-white">
          <AlertTriangle size={24}/>
          <span className="font-black text-xs uppercase">Admin Data</span>
          {reports.length > 0 && <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-bounce">{reports.length}</span>}
        </button>
      )}
    </div>
  );
}