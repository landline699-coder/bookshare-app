import React, { useState, useEffect } from 'react';
import * as fb from './services/firebaseService';
import { CLASSES, CATEGORIES } from './config/constants';
import useNotifications from './hooks/useNotifications';
import { AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx'; // 👈 Excel Library

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
  const [allUsers, setAllUsers] = useState([]); // 👈 Store all students
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
        if (unsubProfile) unsubProfile();
        unsubProfile = fb.subscribeToUserProfile(u.uid, (p) => {
          if (p) {
            setProfile(p);
            localStorage.setItem('userProfile', JSON.stringify(p));
          } else {
            fb.logoutUser();
            setUser(null);
            setProfile(null);
          }
          setIsDataLoaded(true);
        });
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        if(unsubProfile) unsubProfile();
        setIsDataLoaded(true);
      }
    });

    const unsubBooks = fb.subscribeToBooks(setBooks);
    const unsubComm = fb.subscribeToCommunity(setCommunityPosts);
    const unsubReports = fb.subscribeToReports(setReports);
    const unsubUsers = fb.subscribeToAllUsers(setAllUsers); // 👈 Listen to Users

    return () => { 
      unsubAuth(); if(unsubProfile) unsubProfile(); 
      unsubBooks(); unsubComm(); unsubReports(); unsubUsers();
    };
  }, []);

  // --- EXCEL EXPORT FUNCTION ---
  const handleExportData = () => {
    // 1. Books Sheet
    const booksData = books.map(b => ({
      Title: b.title,
      Subject: b.subject,
      Class: b.classLevel,
      OwnerName: b.currentOwner,
      OwnerContact: b.contact,
      Status: b.handoverStatus,
      UploadDate: b.createdAt ? new Date(b.createdAt.seconds * 1000).toLocaleDateString() : '-'
    }));

    // 2. Students Sheet (Directory)
    const usersData = allUsers.map(u => ({
      Name: u.name,
      Mobile: u.mobile,
      Class: u.studentClass,
      Privacy: u.isContactPrivate ? 'Hidden' : 'Public',
      Joined: u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : '-'
    }));

    // 3. Reports Sheet
    const reportsData = reports.map(r => ({
      Reason: r.reason,
      Book: r.bookTitle,
      Reporter: r.reporterName,
      ReporterClass: r.reporterClass
    }));

    const wb = XLSX.utils.book_new();
    const s1 = XLSX.utils.json_to_sheet(booksData);
    const s2 = XLSX.utils.json_to_sheet(usersData);
    const s3 = XLSX.utils.json_to_sheet(reportsData);

    XLSX.utils.book_append_sheet(wb, s1, "All Books");
    XLSX.utils.book_append_sheet(wb, s2, "Student Directory"); // 👈 Directory Added
    XLSX.utils.book_append_sheet(wb, s3, "Reports");

    XLSX.writeFile(wb, "School_BookShare_Admin_Data.xlsx");
    setToast({ type: 'success', message: 'Excel Downloaded! 📥' });
  };

  // --- HANDLERS ---
  const handleLogout = async () => { await fb.logoutUser(); setAppMode(null); setToast({ type: 'success', message: 'Logged out' }); };
  
  const handlePublishBook = async (data) => {
    setIsSyncing(true);
    try { await fb.addBook(data, user, profile, appMode); setIsAddingBook(false); setToast({ type: 'success', message: 'Book Published!' }); } 
    catch (e) { setToast({ type: 'error', message: 'Failed to publish.' }); } finally { setIsSyncing(false); }
  };

  const handleHandover = async (book, rUid) => {
     try {
        const updated = book.waitlist.map(r => r.uid === rUid ? { ...r, status: 'handed_over' } : r);
        await fb.updateBook(book.id, { waitlist: updated });
        setToast({ type: 'success', message: 'Marked Handed Over' });
     } catch (e) { setToast({ type: 'error', message: 'Error' }); }
  };

  const handleReceive = async (book, req) => {
      try {
        await fb.updateBook(book.id, {
          ownerId: req.uid, currentOwner: req.name, contact: req.mobile,        
          ownerPrivacy: profile?.isContactPrivate || false,
          handoverStatus: 'available', waitlist: [],                   
          history: [...(book.history || []), { owner: req.name, date: new Date().toLocaleDateString(), action: `Received` }]
        });
        setSelectedBook(null); setToast({ type: 'success', message: 'Book Received!' });
      } catch (e) { setToast({ type: 'error', message: 'Error' }); }
  };

  const handleBorrowRequest = async (book, msg) => {
    if (user.uid === book.ownerId) return setToast({ type: 'error', message: "Your book!" });
    await fb.requestBook(book.id, { uid: user.uid, name: profile.name, mobile: profile.mobile, message: msg });
    setToast({ type: 'success', message: 'Request Sent!' });
  };

  const handleReply = async (book, uid, txt) => {
    const status = txt.includes('Approved') ? 'approved' : 'rejected';
    const updated = book.waitlist.map(r => r.uid === uid ? {...r, status} : r);
    await fb.updateBook(book.id, { waitlist: updated });
  };

  const handleDeleteBook = async () => {
    await fb.deleteBook(selectedBook.id); setSelectedBook(null); setToast({ type: 'success', message: 'Deleted.' });
  };

  const handleReportBook = async (book, reason) => {
    await fb.addReport({ bookId: book.id, bookTitle: book.title, bookOwner: book.currentOwner, reporterUid: user.uid, reporterName: profile.name, reporterClass: profile.studentClass, reason });
    setToast({ type: 'success', message: 'Reported to Admin.' });
  };

  const handleDeleteFromReport = async (bId, rId) => {
    await fb.deleteBook(bId); await fb.deleteReport(rId);
    setToast({ type: 'success', message: 'Book Deleted & Resolved.' });
  };

  if (!isDataLoaded) return <LoadingScreen />;
  if (!user) return <Auth />;
  if (user && !profile) return <GlobalLoader message="Syncing..." />;

  return (
    <div className="fixed inset-0 bg-slate-50 font-sans flex flex-col overflow-hidden">
      <Toast toast={toast} onClose={() => setToast(null)} />
      {isSyncing && <GlobalLoader message="Processing..." />}

      <Navbar 
        profile={profile} onOpenProfile={() => setShowProfile(true)} onOpenAdmin={() => setShowAdminLogin(true)}
        notifications={notifications} totalRequests={totalCount} onOpenCommunity={() => setShowCommunity(true)} onLogout={handleLogout}
      />

      <div className="flex-1 overflow-y-auto pb-32 pt-20 px-4 hide-scrollbar">
        {!appMode && !searchTerm ? (
           <LandingPage profile={profile} onSetMode={setAppMode} onSearch={setSearchTerm} setShowCommunity={setShowCommunity} setShowProfile={setShowProfile} />
        ) : (
           <>
             <div className="flex items-center gap-2 mb-6 animate-in slide-in-from-left-5">
                <button onClick={() => { setAppMode(null); setSearchTerm(''); }} className="bg-white p-3 rounded-full shadow-sm hover:bg-slate-100"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{searchTerm ? `Search: "${searchTerm}"` : `${appMode} Books`}</h2>
             </div>
             <BookGrid books={books} appMode={appMode} searchTerm={searchTerm} categories={CATEGORIES} onSelectBook={setSelectedBook} />
           </>
        )}
      </div>

      {showAdminLogin && <AdminLogin onClose={() => setShowAdminLogin(false)} onLogin={(s) => { setIsAdmin(s); setToast({ type: 'success', message: 'Admin Mode!' }); }} />}

      {showReports && (
        <AdminReports 
          reports={reports} onClose={() => setShowReports(false)}
          onResolve={async (id) => { await fb.deleteReport(id); setToast({type:'success', message:'Ignored'}); }}
          onDeleteBook={handleDeleteFromReport}
          onExport={handleExportData} // 👈 Excel function passed
        />
      )}

      {isAddingBook && <AddBook mode={appMode} user={user} profile={profile} classes={CLASSES} categories={CATEGORIES} onClose={() => setIsAddingBook(false)} onPublish={handlePublishBook} />}
      {selectedBook && <BookDetails book={selectedBook} user={user} profile={profile} classes={CLASSES} isAdmin={isAdmin} onClose={() => setSelectedBook(null)} onBorrow={handleBorrowRequest} onReply={handleReply} onHandover={handleHandover} onReceive={handleReceive} onDelete={handleDeleteBook} onReport={handleReportBook} />}
      {showCommunity && <Community posts={communityPosts} profile={profile} onClose={() => setShowCommunity(false)} onPost={async (t) => await fb.postToCommunity(profile, t)} />}
      
      {showProfile && (
        <ProfileSettings 
          profile={profile} onClose={() => setShowProfile(false)} onLogout={handleLogout}
          onUpdate={async (p) => { await fb.updateProfile(user.uid, p); setProfile(p); setShowProfile(false); setToast({type:'success', message:'Saved!'}); }}
        />
      )}

      {appMode && !isAddingBook && !selectedBook && (
        <button onClick={() => setIsAddingBook(true)} className="fixed bottom-8 right-6 bg-slate-900 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></button>
      )}

      {isAdmin && (<button 
    onClick={() => setShowReports(true)}
    className="fixed bottom-28 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-2xl z-50 hover:scale-110 active:scale-95 transition-all flex items-center gap-2 border-4 border-white"
    title="Admin Control Panel"
  >
    {/* Excel Icon जैसा दिखने वाला SVG */}
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>
    
    <span className="font-black text-xs uppercase tracking-wider">Admin Data</span>

    {/* अगर कोई रिपोर्ट है तो लाल डॉट दिखेगा */}
    {reports.length > 0 && (
      <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
        {reports.length}
      </span>
    )}
  </button>
      )}
    </div>
  );
}