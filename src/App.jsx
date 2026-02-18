// --- 1. IMPORTS ---
import React, { useState, useEffect } from 'react';
import * as fb from './services/firebaseService';
import { CLASSES, CATEGORIES } from './config/constants';
import useNotifications from './hooks/useNotifications';
import useBorrowSystem from './hooks/useBorrowSystem'; // 👈 आपका नया लॉजिक मॉड्यूल
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
  const [lastSeenComm, setLastSeenComm] = useState(Number(localStorage.getItem('lastSeenComm')) || 0);

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

  // --- 3. MODULAR LOGIC (Using Hooks) ---
  const { notifications, totalCount } = useNotifications(books, user, profile);
  // बुक अप्रूवल का सारा "दिमाग" अब यहाँ है 👇
  const { handleReply, handleHandover, handleReceive, isProcessing } = useBorrowSystem(setToast);

  const hasNewComm = communityPosts.length > 0 && (communityPosts[0].createdAt?.seconds || 0) > lastSeenComm;

  // --- 4. LIVE LISTENERS (Firebase Sync) ---
  useEffect(() => {
    let unsubProfile = null;
    const unsubAuth = fb.subscribeToAuth((u) => {
      if (u) {
        setUser(u);
        unsubProfile = fb.subscribeToUserProfile(u.uid, (p) => {
          if (p) { setProfile(p); } 
          else { fb.logoutUser(); }
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

    return () => { unsubAuth(); if(unsubProfile) unsubProfile(); unsubBooks(); unsubComm(); unsubReports(); unsubUsers(); };
  }, []);

  // --- 5. SIMPLE HANDLERS ---
  const handleOpenCommunity = () => {
    const now = Math.floor(Date.now() / 1000);
    setLastSeenComm(now);
    localStorage.setItem('lastSeenComm', now);
    setShowCommunity(true);
  };

  const handleReportPost = async (post, reason) => {
    await fb.addReport({ type: 'community_post', postId: post.id, postContent: post.text, postAuthor: post.author, reporterName: profile.name, reason });
    setToast({ type: 'success', message: 'Reported!' });
  };

  if (!isDataLoaded) return <LoadingScreen />;
  if (!user) return <Auth />;

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden">
      <Toast toast={toast} onClose={() => setToast(null)} />
      {isSyncing && <GlobalLoader message="Processing..." />}

      <Navbar profile={profile} onOpenProfile={() => setShowProfile(true)} onOpenAdmin={() => setShowAdminLogin(true)} notifications={notifications} totalRequests={totalCount} hasNewComm={hasNewComm} onOpenCommunity={handleOpenCommunity} onLogout={fb.logoutUser} />

      <main className="flex-1 overflow-y-auto pb-32 pt-20 px-4">
        {!appMode && !searchTerm ? (
          <LandingPage profile={profile} onSetMode={setAppMode} onSearch={setSearchTerm} setShowCommunity={setShowCommunity} setShowProfile={setShowProfile} />
        ) : (
          <BookGrid books={books} appMode={appMode} searchTerm={searchTerm} categories={CATEGORIES} onSelectBook={setSelectedBook} />
        )}
      </main>

      {/* 📖 BOOK DETAILS MODAL */}
      {selectedBook && (
        <BookDetails 
          book={selectedBook} user={user} profile={profile} isAdmin={isAdmin} onClose={() => setSelectedBook(null)}
          // ये फंक्शन्स अब hook से आ रहे हैं 👇
          onReply={handleReply} 
          onHandover={handleHandover} 
          onReceive={handleReceive} 
          isProcessing={isProcessing}
          onDelete={() => fb.deleteBook(selectedBook.id)}
          onBorrow={async (b, m) => { 
            await fb.requestBook(b.id, { uid: user.uid, name: profile.name, mobile: profile.mobile, message: m, status: 'pending', date: new Date().toISOString() }); 
            setToast({type:'success', message:'Request Sent! 🚀'}); 
          }}
        />
      )}

      {/* OTHER POPUPS (Modular & Clean) */}
      {isAddingBook && <AddBook mode={appMode} user={user} profile={profile} classes={CLASSES} categories={CATEGORIES} onClose={() => setIsAddingBook(false)} onPublish={async (d) => { setIsSyncing(true); await fb.addBook(d, user, profile, appMode); setIsAddingBook(false); setIsSyncing(false); }} />}
      {showCommunity && <Community posts={communityPosts} profile={profile} onClose={() => setShowCommunity(false)} onPost={(t) => fb.postToCommunity(profile, t)} isAdmin={isAdmin} onDeletePost={fb.deleteCommunityPost} onReportPost={handleReportPost}/>}
      {showProfile && <ProfileSettings profile={profile} stats={{shared: 0, borrowed: 0}} onClose={() => setShowProfile(false)} onLogout={fb.logoutUser} onUpdate={async (p) => { await fb.updateProfile(user.uid, p); setProfile(p); }} />}
      {showAdminLogin && <AdminLogin onClose={() => setShowAdminLogin(false)} onLogin={setIsAdmin} />}
      {showReports && <AdminReports reports={reports} onClose={() => setShowReports(false)} onResolve={fb.deleteReport} onDeleteBook={fb.deleteBook} />}

      {/* FLOATING ACTION BUTTON */}
      {appMode && !isAddingBook && !selectedBook && (
        <button onClick={() => setIsAddingBook(true)} className="fixed bottom-8 right-6 bg-slate-900 text-white w-16 h-16 rounded-full shadow-2xl z-40 flex items-center justify-center transition-transform hover:scale-110"><Plus size={32} /></button>
      )}
    </div>
  );
}