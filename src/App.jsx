import React, { useState, useEffect } from 'react';
import * as fb from './services/firebaseService';
import { CLASSES, CATEGORIES } from './config/constants';
import useNotifications from './hooks/useNotifications';
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

  useEffect(() => {
    let unsubProfile = null;
    const unsubAuth = fb.subscribeToAuth((u) => {
      if (u) {
        setUser(u);
        unsubProfile = fb.subscribeToUserProfile(u.uid, (p) => {
          if (p) { setProfile(p); }
          setIsDataLoaded(true);
        });
      } else {
        setUser(null); setProfile(null); setIsAdmin(false); setIsDataLoaded(true);
      }
    });
    const unsubBooks = fb.subscribeToBooks(setBooks);
    const unsubComm = fb.subscribeToCommunity(setCommunityPosts);
    const unsubReports = fb.subscribeToReports(setReports);
    const unsubUsers = fb.subscribeToAllUsers(setAllUsers);
    return () => { unsubAuth(); unsubBooks(); unsubComm(); unsubReports(); unsubUsers(); };
  }, []);

  // --- 🗑️ STANDALONE DELETE (Correct Placement) ---
  const handleDeleteBook = async (bookId) => {
    if (window.confirm("Delete this book permanently?")) {
      try {
        await fb.deleteBook(bookId);
        setSelectedBook(null);
        setToast({ type: 'success', message: 'Book deleted!' });
      } catch (e) { setToast({ type: 'error', message: 'Delete failed.' }); }
    }
  };

  // --- 📝 REPLY & UPDATE HANDLER ---
  const handleReply = async (book, uid, txt, extraData) => {
    if (txt === 'UPDATE') {
      await fb.updateBook(book.id, { 
        title: extraData.title, 
        subject: extraData.subject,
        author: extraData.author 
      });
      setToast({ type: 'success', message: 'Updated!' });
      return;
    }
    const status = txt.includes('Approved') ? 'approved' : 'rejected';
    const updated = book.waitlist.map(r => r.uid === uid ? { ...r, status, rejectionDate: status === 'rejected' ? new Date().toISOString() : null } : r);
    await fb.updateBook(book.id, { waitlist: updated });
  };

  const handleBorrowRequest = async (book, msg) => {
    await fb.requestBook(book.id, { uid: user.uid, name: profile.name, mobile: profile.mobile, message: msg });
    setToast({ type: 'success', message: 'Request Sent!' });
  };

  if (!isDataLoaded) return <LoadingScreen />;
  if (!user) return <Auth />;

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <Navbar profile={profile} onOpenProfile={() => setShowProfile(true)} onOpenAdmin={() => setShowAdminLogin(true)} notifications={notifications} totalRequests={totalCount} onOpenCommunity={() => setShowCommunity(true)} onLogout={() => fb.logoutUser()} />
      <div className="flex-1 overflow-y-auto pb-32 pt-20 px-4">
        {!appMode && !searchTerm ? (
           <LandingPage profile={profile} onSetMode={setAppMode} onSearch={setSearchTerm} setShowCommunity={setShowCommunity} setShowProfile={setShowProfile} />
        ) : (
           <BookGrid books={books} appMode={appMode} searchTerm={searchTerm} categories={CATEGORIES} onSelectBook={setSelectedBook} />
        )}
      </div>
      {selectedBook && (
        <BookDetails book={selectedBook} user={user} profile={profile} isAdmin={isAdmin} onClose={() => setSelectedBook(null)} onBorrow={handleBorrowRequest} onReply={handleReply} onDelete={() => handleDeleteBook(selectedBook.id)} />
      )}
      {isAddingBook && <AddBook mode={appMode} user={user} profile={profile} onClose={() => setIsAddingBook(false)} onPublish={async (d) => { await fb.addBook(d, user, profile, appMode); setIsAddingBook(false); }} />}
      {showCommunity && <Community posts={communityPosts} profile={profile} onClose={() => setShowCommunity(false)} onPost={async (t) => await fb.postToCommunity(profile, t)} />}
      {appMode && !isAddingBook && !selectedBook && (
        <button onClick={() => setIsAddingBook(true)} className="fixed bottom-8 right-6 bg-slate-900 text-white w-16 h-16 rounded-full shadow-2xl z-40 flex items-center justify-center">+</button>
      )}
    </div>
  );
}