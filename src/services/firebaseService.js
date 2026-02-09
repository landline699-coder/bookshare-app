import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  setDoc, 
  getDoc,
  arrayUnion 
} from "firebase/firestore";

// ✅ YOUR REAL CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyDjTgnoTmFLWe7rjAxFL9uFqjwIRXmyQ1Y",
  authDomain: "book-77f0c.firebaseapp.com",
  projectId: "book-77f0c",
  storageBucket: "book-77f0c.firebasestorage.app",
  messagingSenderId: "452301945236",
  appId: "1:452301945236:web:c7d9ae9f7132da76a63781"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Collections
const booksCol = collection(db, 'artifacts', 'school-bookshare-production-v1', 'public', 'data', 'books');
const commCol = collection(db, 'artifacts', 'school-bookshare-production-v1', 'public', 'data', 'community');
const usersCol = collection(db, 'users');
const reportsCol = collection(db, 'reports'); // 🚩 Reports Collection

// --- 1. AUTH ---
export const registerUser = async (mobile, password, profileData) => {
  const email = `${mobile}@bookshare.com`; 
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await setDoc(doc(usersCol, user.uid), {
    uid: user.uid,
    mobile: mobile,
    name: profileData.name,
    studentClass: profileData.studentClass || '10th',
    role: 'student',
    isContactPrivate: false,
    createdAt: serverTimestamp()
  });
  return user;
};

export const loginUser = (mobile, password) => {
  const email = `${mobile}@bookshare.com`;
  return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = () => signOut(auth);
export const resetPassword = (mobile) => sendPasswordResetEmail(auth, `${mobile}@bookshare.com`);
export const subscribeToAuth = (cb) => onAuthStateChanged(auth, cb);
export const subscribeToUserProfile = (uid, cb) => onSnapshot(doc(usersCol, uid), (doc) => cb(doc.exists() ? doc.data() : null));

// --- 2. BOOKS ---
export const addBook = (bookData, user, profile, mode) => {
  return addDoc(booksCol, {
    ...bookData,
    type: mode,
    ownerId: user.uid,
    currentOwner: profile.name,
    contact: profile.mobile,
    ownerPrivacy: profile.isContactPrivate || false, 
    classLevel: profile.studentClass || '10th', 
    handoverStatus: 'available',
    createdAt: serverTimestamp(),
    waitlist: [],
    history: [{ owner: profile.name, date: new Date().toLocaleDateString(), action: 'Listed' }]
  });
};

export const updateBook = (id, data) => updateDoc(doc(booksCol, id), data);
export const deleteBook = (id) => deleteDoc(doc(booksCol, id));

export const requestBook = (bookId, data) => {
  return updateDoc(doc(booksCol, bookId), {
    waitlist: arrayUnion({ ...data, status: 'pending', requestDate: new Date().toISOString() })
  });
};

export const subscribeToBooks = (cb) => {
  const q = query(booksCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

// --- 3. COMMUNITY ---
export const postToCommunity = (profile, text) => {
  return addDoc(commCol, {
    author: profile.name,
    class: profile.studentClass,
    text: text,
    likes: 0,
    timestamp: serverTimestamp()
  });
};
export const subscribeToCommunity = (cb) => {
  const q = query(commCol, orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

// --- 4. REPORTS ---
export const addReport = (data) => addDoc(reportsCol, { ...data, status: 'open', timestamp: serverTimestamp() });
export const deleteReport = (id) => deleteDoc(doc(reportsCol, id));
export const subscribeToReports = (cb) => {
  const q = query(reportsCol, orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

// --- 5. UPDATES & ADMIN DATA ---
export const updateProfile = (uid, data) => updateDoc(doc(usersCol, uid), data);

/// ... (बाकी कोड के नीचे) ...

// 🔥 NEW: Admin Excel Export ke liye sabhi users laane ka function
export const subscribeToAllUsers = (callback) => {
  const q = query(usersCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(list);
  });
};
export const deleteCommunityPost = (postId) => {
  const postRef = doc(db, 'artifacts', 'school-bookshare-production-v1', 'public', 'data', 'community', postId);
  return deleteDoc(postRef);
};