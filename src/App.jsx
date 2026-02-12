// --- 1. IMPORTS (औज़ार और कंपोनेंट्स) ---
import React, { useState, useEffect } from 'react';
import * as fb from './services/firebaseService';
import * as XLSX from 'xlsx';
import { AlertTriangle } from 'lucide-react';

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
  // --- 2. STATES (ऐप की याददाश्त) ---
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
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

  // --- 3. LISTENERS (लाइव डेटा अपडेट) ---
  useEffect(() => {
    const unsubAuth = fb.subscribeToAuth((u) => {
      if (u) { setUser(u); fb.subscribeToUserProfile(u.uid, setProfile); } 
      else { setUser(null); setProfile(null); setIsAdmin(false); }
    });
    fb.subscribeToBooks(setBooks);
    fb.subscribeToCommunity(setCommunityPosts);
    fb.subscribeToReports(setReports);
    fb.subscribeToAllUsers(setAllUsers);
  }, []);

  // --- 4. CALCULATIONS (हिसाब-किताब) ---
  const userStats = {
    shared: books.filter(b => b.ownerId === user?.uid && b.history?.length <= 1).length,
    borrowed: books.filter(b => b.ownerId === user?.uid && b.history?.length > 1).length
  };

  // --- 5. HANDLERS (बटन दबाने पर होने वाले काम) ---
  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const s1 = XLSX.utils.json_to_sheet(books.map(b => ({ Title: b.title, Owner: b.currentOwner, Contact: b.contact })));
    const s2 = XLSX.utils.json_to_sheet(allUsers.map(u => ({ Name: u.name, Mobile: u.mobile, Class: u.studentClass })));
    XLSX.utils.book_append_sheet(wb, s1, "Books");
    XLSX.utils.book_append_sheet(wb, s2, "Students");
    XLSX.writeFile(wb, "School_Report.xlsx");
    setToast({ type: 'success', message: 'Excel Downloaded!' });
  };

  const handleReply = async (book, uid, txt) => {
    const status = txt.includes('Approved') ? 'approved' : 'rejected';
    const updated = book.waitlist.map(r => r.uid === uid ? { ...r, status, rejectionDate: status === 'rejected' ? new Date().toISOString() : null } : r);
    await fb.updateBook(book.id, { waitlist: updated });
  };

  // --- 6. UI RENDER (जो स्क्रीन पर दिखता है) ---
  if (!user) return <Auth />;
  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <Navbar profile={profile} onOpenProfile={() => setShowProfile(true)} onOpenAdmin={() => setShowAdminLogin(true)} onOpenCommunity={() => setShowCommunity(true)} onLogout={fb.logoutUser} />
      
      <main className="flex-1 overflow-y-auto pb-32 pt-20 px-4">
        {!appMode && !searchTerm ? (
          <LandingPage onSetMode={setAppMode} onSearch={setSearchTerm} />
        ) : (
          <BookGrid books={books} appMode={appMode} searchTerm={searchTerm} onSelectBook={setSelectedBook} />
        )}
      </main>

      {/* मोडल्स और बटन्स */}
      {selectedBook && <BookDetails book={selectedBook} user={user} profile={profile} isAdmin={isAdmin} onClose={() => setSelectedBook(null)} onReply={handleReply} onDelete={() => {fb.deleteBook(selectedBook.id); setSelectedBook(null);}} onReport={(b, r) => fb.addReport({bookId: b.id, reason: r, reporter: profile.name})} onHandover={(b, uid) => fb.updateBook(b.id, {waitlist: b.waitlist.map(r => r.uid === uid ? {...r, status: 'handed_over'} : r)})} onReceive={(b, req) => fb.updateBook(b.id, {ownerId: req.uid, currentOwner: req.name, contact: req.mobile, waitlist: [], history: [...b.history, {action: 'Transferred', owner: req.name, date: new Date().toLocaleDateString()}]})} onBorrow={(b, msg) => fb.updateBook(b.id, {waitlist: [...(b.waitlist || []), {uid: user.uid, name: profile.name, mobile: profile.mobile, message: msg, status: 'pending'}]})} />}
      {showCommunity && <Community posts={communityPosts} profile={profile} isAdmin={isAdmin} onClose={() => setShowCommunity(false)} onPost={(t) => fb.postToCommunity(profile, t)} onDeletePost={fb.deleteCommunityPost} />}
      {showProfile && <ProfileSettings profile={profile} stats={userStats} onClose={() => setShowProfile(false)} onLogout={fb.logoutUser} onUpdate={(p) => fb.updateProfile(user.uid, p)} />}
      {showAdminLogin && <AdminLogin onClose={() => setShowAdminLogin(false)} onLogin={setIsAdmin} />}
      {showReports && <AdminReports reports={reports} onClose={() => setShowReports(false)} onExport={handleExport} onResolve={fb.deleteReport} onDeleteBook={(bid, rid) => {fb.deleteBook(bid); fb.deleteReport(rid);}} />}
      
      {isAdmin && <button onClick={() => setShowReports(true)} className="fixed bottom-28 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-2xl z-50 animate-bounce"><AlertTriangle size={24}/></button>}
      {appMode && <button onClick={() => setIsAddingBook(true)} className="fixed bottom-8 right-6 bg-slate-900 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-3xl font-bold">+</button>}
      {isAddingBook && <AddBook mode={appMode} onClose={() => setIsAddingBook(false)} onPublish={(d) => fb.addBook(d, user, profile, appMode)} />}
    </div>
  );
}