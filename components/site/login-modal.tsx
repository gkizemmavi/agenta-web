"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function LoginModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { login, error, clearError, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    clearError();
    try {
      await login(email, password);
      onClose();
      router.push("/admin");
    } catch {
      /* error shown via context */
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Admin Girişi">
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">
          Yönetim paneline erişmek için admin e-posta ve şifrenizi girin.
        </p>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            E-posta
          </span>
          <div className="relative">
            <Mail
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none ring-[var(--brand)] focus:bg-white focus:ring-2"
              placeholder="admin@agenta.app"
              autoComplete="username"
            />
          </div>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Admin şifresi
          </span>
          <div className="relative">
            <Lock
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none ring-[var(--brand)] focus:bg-white focus:ring-2"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
        </label>
        {error ? (
          <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        <Button
          type="submit"
          className="w-full"
          disabled={submitting || loading}
        >
          {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
          Giriş Yap
        </Button>
      </form>
    </Modal>
  );
}
