import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAof6Gpi1kmMFKrZavseSxpOlFJ9j3EftA",
  authDomain: "dhikrappreactnative.firebaseapp.com",
  projectId: "dhikrappreactnative",
  storageBucket: "dhikrappreactnative.firebasestorage.app",
  messagingSenderId: "59294415347",
  appId: "1:59294415347:web:8affa9ef5be62145073a86"
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

export default app;
