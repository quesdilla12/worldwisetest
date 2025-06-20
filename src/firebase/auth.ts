import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  userType: 'student' | 'professional' | 'creator';
  niche: string;
  writingGoals: string[];
  preferences: {
    analysisLevel: 'basic' | 'detailed' | 'comprehensive';
    focusAreas: ('grammar' | 'spelling' | 'style' | 'clarity')[];
    targetAudience: 'academic' | 'professional' | 'casual' | 'creative';
  };
  createdAt: Date;
  updatedAt: Date;
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
// Add required scopes
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Helper function to get user-friendly error messages
const getAuthErrorMessage = (error: any): string => {
  const errorCode = error.code;
  
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for authentication.';
    default:
      return error.message || 'An error occurred during authentication.';
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    console.log('🔐 Starting Google sign-in...');
    
    // Check if auth is initialized
    if (!auth) {
      throw new Error('Firebase auth is not initialized');
    }
    
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    
    console.log('✅ Google sign-in successful:', firebaseUser.email);
    
    // Create or update user in Firestore
    const user = await createOrUpdateUser(firebaseUser);
    return user;
  } catch (error: any) {
    console.error('❌ Google sign-in error:', error);
    
    // Re-throw with user-friendly message
    const userMessage = getAuthErrorMessage(error);
    throw new Error(userMessage);
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<User | null> => {
  try {
    console.log('🔐 Starting email sign-in for:', email);
    
    if (!auth) {
      throw new Error('Firebase auth is not initialized');
    }
    
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Email sign-in successful');
    
    const user = await createOrUpdateUser(result.user);
    return user;
  } catch (error: any) {
    console.error('❌ Email sign-in error:', error);
    
    const userMessage = getAuthErrorMessage(error);
    throw new Error(userMessage);
  }
};

// Sign up with email and password
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  name: string,
  userType: 'student' | 'professional' | 'creator',
  niche: string
): Promise<User | null> => {
  try {
    console.log('🔐 Starting email sign-up for:', email);
    
    if (!auth) {
      throw new Error('Firebase auth is not initialized');
    }
    
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = result.user;
    
    console.log('✅ Email sign-up successful');
    
    // Create user document in Firestore (filter out undefined values)
    const userData: any = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: name,
      userType,
      niche,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Only add photoURL if it exists
    if (firebaseUser.photoURL) {
      userData.photoURL = firebaseUser.photoURL;
    }
    
    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    return userData;
  } catch (error: any) {
    console.error('❌ Email sign-up error:', error);
    
    const userMessage = getAuthErrorMessage(error);
    throw new Error(userMessage);
  }
};

// Create or update user in Firestore
const createOrUpdateUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      // User exists, return existing data
      const userData = userSnap.data() as User;
      return {
        ...userData,
        updatedAt: new Date()
      };
    } else {
      // New user, create default profile (filter out undefined values)
      const userData: any = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'User',
        userType: 'student', // Default
        niche: 'General writing', // Default
        writingGoals: ['Improve grammar', 'Enhance clarity', 'Write more confidently'],
        preferences: {
          analysisLevel: 'detailed',
          focusAreas: ['grammar', 'spelling', 'style', 'clarity'],
          targetAudience: 'academic'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Only add photoURL if it exists
      if (firebaseUser.photoURL) {
        userData.photoURL = firebaseUser.photoURL;
      }
      
      await setDoc(userRef, userData);
      return userData;
    }
  } catch (error: any) {
    console.error('❌ Error creating/updating user:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    console.log('🔐 Signing out...');
    await signOut(auth);
    console.log('✅ Sign-out successful');
  } catch (error: any) {
    console.error('❌ Sign-out error:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      if (firebaseUser) {
        console.log('🔐 User signed in:', firebaseUser.email);
        const user = await createOrUpdateUser(firebaseUser);
        callback(user);
      } else {
        console.log('🔐 User signed out');
        callback(null);
      }
    } catch (error) {
      console.error('❌ Auth state change error:', error);
      callback(null);
    }
  });
};

// Update user profile
export const updateUserProfile = async (
  userId: string, 
  updates: Partial<User>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Filter out undefined values
    const cleanUpdates: any = { updatedAt: new Date() };
    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key];
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    });
    
    await setDoc(userRef, cleanUpdates, { merge: true });
    console.log('✅ User profile updated successfully');
  } catch (error: any) {
    console.error('❌ Error updating user profile:', error);
    throw new Error('Failed to update profile. Please try again.');
  }
}; 