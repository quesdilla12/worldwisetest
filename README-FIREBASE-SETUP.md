# Firebase Authentication Setup Guide for WordWise AI

This guide will help you properly configure Firebase Authentication for the WordWise AI application.

## Prerequisites

1. A Google account
2. Access to the [Firebase Console](https://console.firebase.google.com/)

## Step-by-Step Setup

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select your existing "wordwise-87bc8" project
3. Enable Google Analytics (optional)
4. Wait for the project to be created

### 2. Enable Authentication

1. In the Firebase Console, go to **Authentication** from the left sidebar
2. Click **Get started** if this is your first time
3. Go to the **Sign-in method** tab

### 3. Enable Sign-in Providers

#### Enable Email/Password Authentication:
1. Click on **Email/Password** in the providers list
2. Toggle **Enable** to ON
3. Optionally enable **Email link (passwordless sign-in)**
4. Click **Save**

#### Enable Google Authentication:
1. Click on **Google** in the providers list
2. Toggle **Enable** to ON
3. Enter your project support email (your email address)
4. Click **Save**

### 4. Configure Authorized Domains

1. Still in **Authentication > Sign-in method**
2. Scroll down to **Authorized domains**
3. Make sure these domains are added:
   - `localhost` (for development)
   - `wordwise-87bc8.firebaseapp.com` (your Firebase hosting domain)
   - Any custom domain you plan to use

**To add a domain:**
1. Click **Add domain**
2. Enter the domain (e.g., `localhost`)
3. Click **Add**

### 5. Firestore Database Setup

1. Go to **Firestore Database** from the left sidebar
2. Click **Create database**
3. Choose **Start in test mode** (we already have security rules configured)
4. Select a location (preferably close to your users)
5. Click **Done**

### 6. Verify Configuration

Your Firebase config in `src/firebase/config.ts` should match your project:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyCvEdA5Q4ZHxhLfFCDCn3jD__FdwGfJS2w",
  authDomain: "wordwise-87bc8.firebaseapp.com",
  projectId: "wordwise-87bc8",
  storageBucket: "wordwise-87bc8.firebasestorage.app",
  messagingSenderId: "678763837086",
  appId: "1:678763837086:web:60718f40088eec86f02d8f",
  measurementId: "G-1LQQYSXZEV"
};
```

## Common Issues and Solutions

### Issue 1: "This domain is not authorized"
**Solution:** Add your domain to Authorized domains in Firebase Console > Authentication > Sign-in method

### Issue 2: "Operation not allowed"
**Solution:** Enable the sign-in method in Firebase Console > Authentication > Sign-in method

### Issue 3: Google sign-in popup blocked
**Solution:** 
- Allow popups in your browser
- Try signing in again
- Check browser console for specific errors

### Issue 4: "Firebase auth is not initialized"
**Solution:** Check that Firebase is properly imported and initialized in `src/firebase/config.ts`

## Testing Authentication

1. Start your development server: `npm run dev`
2. Open your browser's Developer Tools (F12)
3. Go to the Console tab
4. Try signing in - you should see detailed logs like:
   - 🔐 Starting Google sign-in...
   - ✅ Google sign-in successful: user@example.com
   - 🔐 User signed in: user@example.com

## Debug Information

If authentication still doesn't work, check the browser console for detailed error messages. The app now provides specific error messages for common authentication issues.

### Browser Console Commands for Debugging

Open browser console and run:

```javascript
// Check if Firebase is initialized
console.log('Auth:', window.firebase?.auth);
console.log('Firestore:', window.firebase?.firestore);

// Check current auth state
console.log('Current user:', firebase.auth().currentUser);
```

## Security Rules

The Firestore security rules are already configured in `firestore.rules`:

- Users can only read/write their own user document
- Users can only read/write documents they created
- Anonymous access is not allowed

## Next Steps

1. Complete the Firebase setup steps above
2. Test authentication in your local development environment
3. Deploy to Firebase Hosting if needed: `npm run build && firebase deploy`

## Support

If you continue to have issues:

1. Check the browser console for specific error messages
2. Verify all Firebase configuration steps
3. Ensure your Firebase project has the Authentication and Firestore services enabled
4. Check that your domain is in the authorized domains list

The authentication system now provides detailed logging and user-friendly error messages to help diagnose issues. 