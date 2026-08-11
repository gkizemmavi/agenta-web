import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * Firebase web config is public (shipped to the browser).
 * Env vars override defaults so local/.env.local still works.
 * Defaults keep Cloudflare/CI builds from failing with auth/invalid-api-key
 * when secrets are not injected at build time.
 */
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyCXyW9C51srKdyNfgx4K0_x89r0XTa4VS4",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "agenta-c1d6b.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "agenta-c1d6b",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "agenta-c1d6b.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "330861771071",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:330861771071:web:a504e26273fa1a37a0bb8a",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-R0D84J88GN",
};

function createFirebaseApp() {
  if (getApps().length) return getApp();
  return initializeApp(firebaseConfig);
}

export const app = createFirebaseApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
