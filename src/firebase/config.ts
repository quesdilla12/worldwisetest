import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCvEdA5Q4ZHxhLfFCDCn3jD__FdwGfJS2w",
  authDomain: "wordwise-87bc8.firebaseapp.com",
  projectId: "wordwise-87bc8",
  storageBucket: "wordwise-87bc8.firebasestorage.app",
  messagingSenderId: "678763837086",
  appId: "1:678763837086:web:60718f40088eec86f02d8f",
  measurementId: "G-1LQQYSXZEV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure auth persistence to save sessions locally
setPersistence(auth, browserLocalPersistence).then(() => {
  console.log('✅ Firebase Auth persistence set to local storage');
}).catch((error) => {
  console.error('❌ Error setting auth persistence:', error);
});

// Initialize Analytics only if supported (prevents localhost issues)
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((error) => {
    console.log('Analytics not supported:', error);
  });
}

export default app; 