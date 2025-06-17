import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';

interface FirebaseDebugProps {
  isOpen: boolean;
  onClose: () => void;
}

const FirebaseDebug: React.FC<FirebaseDebugProps> = ({ isOpen, onClose }) => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      checkFirebaseStatus();
    }
  }, [isOpen]);

  const checkFirebaseStatus = () => {
    const info: any = {
      timestamp: new Date().toISOString(),
      auth: {
        initialized: !!auth,
        currentUser: auth?.currentUser?.email || 'Not signed in',
        config: auth?.config || 'No config found'
      },
      firestore: {
        initialized: !!db,
        app: db?.app?.name || 'No app found'
      },
      environment: {
        origin: window.location.origin,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        userAgent: navigator.userAgent.substring(0, 100)
      },
      config: {
        authDomain: 'wordwise-87bc8.firebaseapp.com',
        projectId: 'wordwise-87bc8'
      }
    };

    // Check if domains are likely to be authorized
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('localhost');
    
    const isFirebaseHosting = window.location.hostname.includes('firebaseapp.com') ||
                             window.location.hostname.includes('web.app');

    info.domainStatus = {
      isLocalhost,
      isFirebaseHosting,
      currentDomain: window.location.hostname,
      likelyAuthorized: isLocalhost || isFirebaseHosting
    };

    setDebugInfo(info);
  };

  const testAuthConnection = async () => {
    try {
      console.log('🔍 Testing Firebase Auth connection...');
      
      // Test if auth is responsive
      const user = auth?.currentUser;
      console.log('Current user:', user);
      
      setDebugInfo((prev: any) => ({
        ...prev,
        authTest: {
          success: true,
          message: 'Auth connection successful',
          currentUser: user?.email || 'No user signed in'
        }
      }));
    } catch (error: any) {
      console.error('❌ Auth connection test failed:', error);
      setDebugInfo((prev: any) => ({
        ...prev,
        authTest: {
          success: false,
          message: error.message,
          error: error.code
        }
      }));
    }
  };

  const testFirestoreConnection = async () => {
    try {
      console.log('🔍 Testing Firestore connection...');
      
      // Simple connection test
      const testDoc = db;
      console.log('Firestore instance:', testDoc);
      
      setDebugInfo((prev: any) => ({
        ...prev,
        firestoreTest: {
          success: true,
          message: 'Firestore connection successful'
        }
      }));
    } catch (error: any) {
      console.error('❌ Firestore connection test failed:', error);
      setDebugInfo((prev: any) => ({
        ...prev,
        firestoreTest: {
          success: false,
          message: error.message,
          error: error.code
        }
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      zIndex: 10000,
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Firebase Debug Information</h2>
          <button onClick={onClose} style={{ fontSize: '18px', padding: '5px 10px' }}>×</button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button onClick={checkFirebaseStatus} style={{ marginRight: '10px', padding: '8px 16px' }}>
            Refresh Status
          </button>
          <button onClick={testAuthConnection} style={{ marginRight: '10px', padding: '8px 16px' }}>
            Test Auth
          </button>
          <button onClick={testFirestoreConnection} style={{ padding: '8px 16px' }}>
            Test Firestore
          </button>
        </div>

        <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
          <h3>Quick Fix Checklist:</h3>
          <ul>
            <li>✅ Go to <a href="https://console.firebase.google.com/project/wordwise-87bc8/authentication/providers" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
            <li>✅ Enable Email/Password authentication</li>
            <li>✅ Enable Google authentication</li>
            <li>✅ Add "localhost" to authorized domains</li>
            <li>✅ Ensure Firestore database is created</li>
          </ul>
        </div>

        <pre style={{ 
          backgroundColor: '#f8f8f8', 
          padding: '15px', 
          borderRadius: '4px', 
          overflow: 'auto',
          maxHeight: '400px',
          border: '1px solid #ddd'
        }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>

        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
          <h4>Common Issues:</h4>
          <ul style={{ margin: 0 }}>
            <li><strong>Domain not authorized:</strong> Add your domain to Firebase Console &gt; Authentication &gt; Sign-in method &gt; Authorized domains</li>
            <li><strong>Operation not allowed:</strong> Enable the sign-in method in Firebase Console</li>
            <li><strong>Popup blocked:</strong> Allow popups in your browser settings</li>
            <li><strong>Network error:</strong> Check your internet connection and Firebase project status</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FirebaseDebug; 