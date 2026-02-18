import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, setDoc, arrayUnion } from "firebase/firestore";

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
const reportsCol = collection(db, 'reports');

// --- AUTH FUNCTIONS ---
export const registerUser = async (mobile, password, profileData) => {
  const email = `${mobile}@bookshare.com`; 
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(usersCol, userCredential.user.uid), {
    uid: userCredential.user.uid, mobile, name: profileData.name, 
    studentClass: profileData.studentClass || '10th', role: 'student', createdAt: serverTimestamp()
  });
};
export const loginUser = (mobile, password) => signInWithEmailAndPassword(auth, `${mobile}@bookshare.com`, password);
export const logoutUser = () => signOut(auth);
export const subscribeToAuth = (cb) => onAuthStateChanged(auth, cb);
export const subscribeToUserProfile = (uid, cb) => onSnapshot(doc(usersCol, uid), (doc) => cb(doc.exists() ? doc.data() : null));

// --- BOOKS LOGIC ---
export const addBook = (data, user, profile, mode) => addDoc(booksCol, {
  ...data, type: mode, ownerId: user.uid, currentOwner: profile.name, contact: profile.mobile,
  handoverStatus: 'available', createdAt: serverTimestamp(), waitlist: [],
  history: [{ owner: profile.name, date: new Date().toLocaleDateString(), action: 'Listed' }]
});

// ✅ RESTORED: Request Book logic with arrayUnion
export const requestBook = async (bookId, requestData) => {
  const bookRef = doc(booksCol, bookId);
  return await updateDoc(bookRef, {
    waitlist: arrayUnion(requestData)
  });
};

export const updateBook = (id, data) => updateDoc(doc(booksCol, id), data);
export const deleteBook = (id) => deleteDoc(doc(booksCol, id));
export const subscribeToBooks = (cb) => onSnapshot(query(booksCol, orderBy('createdAt', 'desc')), (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

// --- COMMUNITY & ADMIN ---
export const postToCommunity = (profile, text) => addDoc(commCol, { author: profile.name, class: profile.studentClass, text, timestamp: serverTimestamp() });
export const subscribeToCommunity = (cb) => onSnapshot(query(commCol, orderBy('timestamp', 'desc')), (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
export const deleteCommunityPost = (id) => deleteDoc(doc(commCol, id));
export const addReport = (data) => addDoc(reportsCol, { ...data, timestamp: serverTimestamp() });
export const subscribeToReports = (cb) => onSnapshot(query(reportsCol, orderBy('timestamp', 'desc')), (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
export const deleteReport = (id) => deleteDoc(doc(reportsCol, id));
export const subscribeToAllUsers = (cb) => onSnapshot(usersCol, (snap) => cb(snap.docs.map(d => d.data())));
export const updateProfile = (uid, data) => updateDoc(doc(usersCol, uid), data);