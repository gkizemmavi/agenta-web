import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/**
 * Firebase web config is public (shipped to the browser).
 * Env vars override defaults so local/.env.local still works.
 *
 * IMPORTANT: Never initialize Auth/Firestore at module load time — that
 * crashes Cloudflare Workers SSR (no browser IndexedDB / window).
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

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let storageInstance: FirebaseStorage | undefined;

function assertBrowser() {
  if (typeof window === "undefined") {
    throw new Error("Firebase is only available in the browser");
  }
}

export function getFirebaseApp(): FirebaseApp {
  assertBrowser();
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  assertBrowser();
  if (!authInstance) authInstance = getAuth(getFirebaseApp());
  return authInstance;
}

export function getFirestoreDb(): Firestore {
  assertBrowser();
  if (!dbInstance) dbInstance = getFirestore(getFirebaseApp());
  return dbInstance;
}

export function getFirebaseStorage(): FirebaseStorage {
  assertBrowser();
  if (!storageInstance) storageInstance = getStorage(getFirebaseApp());
  return storageInstance;
}

/** Lazy proxy — safe to import on the server; only touches Firebase in the browser. */
export const db = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    const real = getFirestoreDb();
    const value = Reflect.get(real as object, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export const storage = new Proxy({} as FirebaseStorage, {
  get(_target, prop, receiver) {
    const real = getFirebaseStorage();
    const value = Reflect.get(real as object, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
