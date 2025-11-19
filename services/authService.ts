// services/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInAnonymously,
  User,
} from 'firebase/auth';
import { auth } from '@/config/firebase';

export type AuthUser = User | null;

export const signUp = async (email: string, password: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
};

export const signIn = async (email: string, password: string) => {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
};

export const signInGuest = async () => {
  const cred = await signInAnonymously(auth);
  return cred.user;
};

export const signOut = async () => {
  await firebaseSignOut(auth);
};

export const subscribeAuth = (cb: (user: AuthUser) => void) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => cb(user));
  return unsubscribe;
};
