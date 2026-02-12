// --- 1. IMPORTS (बाहर से आने वाले औज़ार) ---
import React, { useState, useEffect } from 'react';
import * as fb from './services/firebaseService'; // डेटाबेस इंजन
import * as XLSX from 'xlsx'; // एक्सेल बनाने के लिए
import { AlertTriangle, Plus } from 'lucide-react'; // आइकन्स

// ये आपके ऐप की अलग-अलग स्क्रीन्स (Components) हैं
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
import { LoadingScreen, Toast } from './components/Feedback';

export default function App() {
  // --- 2. STATES (ऐप की याददाश्त - यहाँ डेटा स्टोर होता है) ---
  const [user, setUser] = useState(null); // लॉगिन यूज़र
  const [profile, setProfile] = useState(null); // यूज़र की प्रोफाइल (नाम, क्लास)
  const [isAdmin, setIsAdmin] = useState(false); // क्या एडमिन है?
  const [books, setBooks] = useState([]); // सभी किताबों की लिस्ट
  const [communityPosts, setCommunityPosts] = useState([]); // चैट्स
  const [reports, setReports] = useState([]); // शिकायतें
  const [allUsers, setAllUsers] = useState([]); // एक्सेल के लिए सभी स्टूडेंट्स
  
  // UI कंट्रोल करने वाले स्टेट्स
  const [appMode, setAppMode] = useState(null); // 'Donate' या 'Borrow' मोड
  const [selectedBook, setSelectedBook] = useState(null); // जो किताब खुली है
  const [isAddingBook, setIsAddingBook] = useState(false); // क्या 'Add Book' खुला है?
  const [showCommunity, setShowCommunity] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // सर्च बॉक्स का टेक्स्ट
  const [toast, setToast] = useState(null); // मैसेज अलर्ट (Success/Error)

  // --- 3. LISTENERS (डेटाबेस पर लाइव नज़र रखना) ---
  useEffect(() => {
    // लॉगिन चेक करने के लिए
    const unsubAuth = fb.subscribeToAuth((u) => {
      if (u) {
        setUser(u);
        fb.subscribeToUserProfile(u.uid, setProfile);
      } else {
        setUser(null); setProfile(null); setIsAdmin(false);
      }
    });

    // डेटाबेस से लाइव डेटा खींचने के लिए
    fb.subscribeToBooks(setBooks);
    fb.subscribeToCommunity(setCommunityPosts);
    fb.subscribeToReports(setReports);
    fb.subscribeToAllUsers(setAllUsers);

    return () => unsubAuth(); // ऐप बंद होने पर साफ़ सफाई
  }, []);

  // --- 4. CALCULATIONS (प्रोफाइल के लिए हिसाब-किताब) ---
  const userStats = {
    shared: books.filter(b => b.ownerId === user?.uid && b.history?.length <= 1).length,
    borrowed: books.filter(b => b.ownerId === user?.uid && b.history?.length > 1).length
  };

  // --- 5. HANDLERS (बटन दबाने पर होने वाले काम) ---
  
  // एक्सेल फाइल डाउनलोड करना
  const handleExportData = () => {
    const wb = XLSX.utils.book_new();
    const s1 = XLSX.utils.json_to_sheet(books.map(b => ({ Title: b.title, Owner: b.currentOwner, Contact: b.contact })));
    const s2 = XLSX.utils.json_to_sheet(allUsers.map(u => ({ Name: u.name, Mobile: u.mobile, Class: u.studentClass })));
    XLSX.utils.book_append_sheet(wb, s1, "Books");
    XLSX.utils.book_append_sheet(wb, s2, "Students");
    XLSX.writeFile(wb, "School_Report.xlsx");
    setToast({ type: 'success', message: 'Excel Downloaded!' });
  };

  // रिक्वेस्ट का जवाब देना (Approve/Reject)
  const handleReply = async (book, uid, txt) => {
    const status = txt.includes('Approved') ? 'approved' : 'rejected';
    const updated = book.waitlist.map(r => 
      r.uid === uid ? { ...r, status, rejectionDate: status === 'rejected' ? new Date().toISOString() : null } : r
    );
    await fb.updateBook(book.id, { waitlist: updated });
  };

  // --- 6. RENDER (स्क्रीन पर दिखने वाला डिज़ाइन) ---
  if (!user) return <Auth />; // अगर लॉगिन नहीं है तो लॉगिन स्क्रीन दिखाओ
  if (user && !profile) return <LoadingScreen />; // डेटा लोड होने तक लोडिंग दिखाओ

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden">
      {/* अलर्ट मैसेज */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ऊपर का नेविगेशन बार */}
      <Navbar 
        profile={profile} 
        onOpenProfile={() => setShowProfile(true)} 
        onOpenAdmin={() => setShowAdminLogin(true)} 
        onOpenCommunity={() => setShowCommunity(true)} 
        onLogout={fb.logoutUser} 
      />

      {/* मुख्य कंटेंट एरिया */}
      <main className="flex-1 overflow-y-auto pb-32 pt-20 px-4">
        {!appMode && !searchTerm ? (
          <LandingPage onSetMode={setAppMode} onSearch={setSearchTerm} />
        ) : (
          <div>
             <button onClick={() => {setAppMode(null); setSearchTerm('');}} className="mb-4 text-indigo-600 font-bold">← Back</button>
             <BookGrid books={books} appMode={appMode} searchTerm={searchTerm} onSelectBook={setSelectedBook} />
          </div>
        )}
      </main>

      {/* --- 7. MODALS (पॉपअप स्क्रीन्स) --- */}

      {/* बुक डिटेल्स पॉपअप */}
      {selectedBook && (
        <BookDetails 
          book={selectedBook} user={user} profile={profile} isAdmin={isAdmin} 
          onClose={() => setSelectedBook(null)} 
          onReply={handleReply} 
          onDelete={() => {fb.deleteBook(selectedBook.id); setSelectedBook(null);}} 
          onReport={(b, r) => fb.addReport({bookId: b.id, reason: r, reporter: profile.name})} 
          onHandover={(b, uid) => fb.updateBook(b.id, {waitlist: b.waitlist.map(r => r.uid === uid ? {...r, status: 'handed_over'} : r)})} 
          onReceive={(b, req) => fb.updateBook(b.id, {ownerId: req.uid, currentOwner: req.name, contact: req.mobile, waitlist: [], history: [...b.history, {action: 'Transferred', owner: req.name, date: new Date().toLocaleDateString()}]})} 
          onBorrow={(b, msg) => fb.updateBook(b.id, {waitlist: [...(b.waitlist || []), {uid: user.uid, name: profile.name, mobile: profile.mobile, message: msg, status: 'pending'}]})} 
        />
      )}

      {/* कम्युनिटी चैट पॉपअप */}
      {showCommunity && (
        <Community 
          posts={communityPosts} profile={profile} isAdmin={isAdmin} 
          onClose={() => setShowCommunity(false)} 
          onPost={(t) => fb.postToCommunity(profile, t)} 
          onDeletePost={fb.deleteCommunityPost} 
        />
      )}

      {/* प्रोफाइल सेटिंग्स पॉपअप */}
      {showProfile && (
        <ProfileSettings 
          profile={profile} stats={userStats} 
          onClose={() => setShowProfile(false)} 
          onLogout={fb.logoutUser} 
          onUpdate={(p) => fb.updateProfile(user.uid, p)} 
        />
      )}

      {/* एडमिन लॉगिन और रिपोर्ट्स */}
      {showAdminLogin && <AdminLogin onClose={() => setShowAdminLogin(false)} onLogin={setIsAdmin} />}
      {showReports && (
        <AdminReports 
          reports={reports} onClose={() => setShowReports(false)} 
          onExport={handleExportData} 
          onResolve={fb.deleteReport} 
          onDeleteBook={(bid, rid) => {fb.deleteBook(bid); fb.deleteReport(rid);}} 
        />
      )}
      
      {/* एडमिन कंट्रोल बटन (Floating) */}
      {isAdmin && (
        <button onClick={() => setShowReports(true)} className="fixed bottom-28 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-2xl z-50 animate-bounce">
          <AlertTriangle size={24}/>
        </button>
      )}

      {/* नई बुक जोड़ने का बटन (Floating) */}
      {appMode && (
        <button onClick={() => setIsAddingBook(true)} className="fixed bottom-8 right-6 bg-slate-900 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-3xl font-bold z-40">
          <Plus size={32} />
        </button>
      )}

      {/* बुक जोड़ने की स्क्रीन */}
      {isAddingBook && (
        <AddBook 
          mode={appMode} 
          onClose={() => setIsAddingBook(false)} 
          onPublish={(d) => fb.addBook(d, user, profile, appMode)} 
        />
      )}
    </div>
  );
}