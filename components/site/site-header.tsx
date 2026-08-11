"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LoginModal } from "./login-modal";

export function SiteHeader() {
  const { user, isAdmin, logout, loading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0f0f12]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <Image
              src="/logo.png"
              alt="Agenta"
              width={36}
              height={36}
              className="rounded-[10px] object-cover bg-amber-500"
            />
            <span className="text-lg font-extrabold tracking-wide">Agenta</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <a
              href="#indir"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white sm:inline-flex"
            >
              İndir
            </a>
            <Link
              href="/privacy-policy.html"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white md:inline-flex"
            >
              Gizlilik
            </Link>
            <Link
              href="/terms-of-use.html"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white md:inline-flex"
            >
              Koşullar
            </Link>

            {!loading && isAdmin && user ? (
              <>
                {!isAdminRoute ? (
                  <Button
                    variant="secondary"
                    className="!bg-white/10 !text-white !ring-white/15 hover:!bg-white/15"
                    onClick={() => router.push("/admin")}
                  >
                    <LayoutDashboard size={16} />
                    <span className="hidden sm:inline">Panel</span>
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  className="!text-zinc-200 hover:!bg-white/10"
                  onClick={() => logout()}
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Çıkış</span>
                </Button>
              </>
            ) : (
              <Button onClick={() => setLoginOpen(true)}>
                <LogIn size={16} />
                Giriş Yap
              </Button>
            )}
          </nav>
        </div>
      </header>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
