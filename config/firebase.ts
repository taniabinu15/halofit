// config/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDj0miFNoYnXjv9TYrNDeyuffutf8nO-sI",
  authDomain: "halofit-f6a5b.firebaseapp.com",
  projectId: "halofit-f6a5b",
  storageBucket: "halofit-f6a5b.firebasestorage.app",
  messagingSenderId: "1017798743439",
  appId: "1:1017798743439:web:820d4b3251a5b2e2b8a7fa",
  measurementId: "G-GHWPRQ2H6J"
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth with AsyncStorage persistence for React Native
let auth;
try {
  // Try to initialize with persistence
  auth = initializeAuth(app, {
    persistence: AsyncStorage as any // Using any to bypass type issues with web SDK
  });
} catch (error) {
  // If already initialized, get existing instance
  auth = getAuth(app);
}

export { auth };

export default app;
