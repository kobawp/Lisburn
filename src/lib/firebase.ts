import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

import { isSideloadedApp } from '../utils/env';

const config = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(config);

export const auth = getAuth(app);

// Use named database if specified in config, otherwise default
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    if (isSideloadedApp()) {
      alert("Google Sign-In is not supported in this sideloaded app due to native WKWebView constraints. Please use the Web App at lisburn.ai.studio (Add to Home Screen) to sync your data.");
      return null;
    }

    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.log('Google Sign-In popup closed by user.');
      return null;
    }
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/operation-not-supported-in-this-environment') {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectErr) {
        console.warn('Redirect sign-in fallback error:', redirectErr);
        return null;
      }
    }
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

export async function signInAnon() {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/admin-restricted-operation' || error?.code === 'auth/operation-not-allowed') {
      console.warn('Anonymous sign-in is disabled in Firebase console. Operating in local mode.');
      return null;
    }
    console.warn('Error signing in anonymously:', error);
    return null;
  }
}

export async function logOut() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
}

export { onAuthStateChanged, collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, onSnapshot };
export type { User };
