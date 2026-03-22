// ─────────────────────────────────────────────────────────────────────────────
// Firebase configuration
// ─────────────────────────────────────────────────────────────────────────────
// 1. Go to Firebase Console → Project Settings → Your apps → Web app
// 2. Copy the firebaseConfig object and paste it below.
// 3. This config is SAFE to be public — your Firestore Security Rules are
//    what protect the data, not keeping this secret.
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getFirestore }  from 'firebase/firestore';
import { getAuth }       from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCRQWQUmd7S3jn70pjqDNxaFh5eJnVYf_c",
  authDomain: "syrolibrary.firebaseapp.com",
  projectId: "syrolibrary",
  storageBucket: "syrolibrary.firebasestorage.app",
  messagingSenderId: "336627862247",
  appId: "1:336627862247:web:f2684274afa3ed6389b042",
  measurementId: "G-13P4DVTJS2"
};

const app = initializeApp(firebaseConfig);

export const db   = getFirestore(app);
export const auth = getAuth(app);
