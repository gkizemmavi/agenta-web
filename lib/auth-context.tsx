"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

type AuthState = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

async function checkIsAdmin(user: User): Promise<boolean> {
  const envEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (user.email && envEmails.includes(user.email.toLowerCase())) {
    return true;
  }

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return false;
  return Boolean(snap.data()?.isAdmin);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (next) => {
      setLoading(true);
      try {
        if (!next) {
          setUser(null);
          setIsAdmin(false);
          return;
        }
        const admin = await checkIsAdmin(next);
        if (!admin) {
          await firebaseSignOut(auth);
          setUser(null);
          setIsAdmin(false);
          setError("Bu hesap admin yetkisine sahip değil.");
          return;
        }
        setUser(next);
        setIsAdmin(true);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const admin = await checkIsAdmin(cred.user);
      if (!admin) {
        await firebaseSignOut(auth);
        throw new Error(
          "Bu hesap admin değil. Firestore users/{uid} üzerinde isAdmin: true ayarlayın.",
        );
      }
      setUser(cred.user);
      setIsAdmin(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Giriş başarısız. Bilgileri kontrol edin.";
      setError(message);
      setUser(null);
      setIsAdmin(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setIsAdmin(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      user,
      isAdmin,
      loading,
      error,
      login,
      logout,
      clearError,
    }),
    [user, isAdmin, loading, error, login, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
