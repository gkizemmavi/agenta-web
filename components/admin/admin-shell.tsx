"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  FileClock,
  FilePlus2,
  UserRound,
  Wrench,
  BadgeCheck,
  Building2,
  UsersRound,
  Store,
  Menu,
  X,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import clsx from "clsx";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  match?: {
    pathname: string;
    type?: string;
    status?: string;
  };
};

const nav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/admin/contents?status=pending",
    label: "Onay işlemleri",
    icon: FileClock,
    match: { pathname: "/admin/contents", status: "pending" },
  },
  {
    href: "/admin/contents?status=approved",
    label: "İçerik paylaş / yayınlanan",
    icon: FilePlus2,
    match: { pathname: "/admin/contents", status: "approved" },
  },
  {
    href: "/admin/applications?status=pending&type=individual",
    label: "Ajan başvuruları",
    icon: UserRound,
    match: { pathname: "/admin/applications", type: "individual" },
  },
  {
    href: "/admin/applications?status=pending&type=expert",
    label: "Exper başvuruları",
    icon: BadgeCheck,
    match: { pathname: "/admin/applications", type: "expert" },
  },
  {
    href: "/admin/applications?status=pending&type=master",
    label: "Usta başvuruları",
    icon: Wrench,
    match: { pathname: "/admin/applications", type: "master" },
  },
  {
    href: "/admin/applications?status=pending&type=service",
    label: "Servis başvuruları",
    icon: Building2,
    match: { pathname: "/admin/applications", type: "service" },
  },
  {
    href: "/admin/listings?status=pending",
    label: "Bekleyen ilanlar",
    icon: Store,
    match: { pathname: "/admin/listings", status: "pending" },
  },
  {
    href: "/admin/users",
    label: "Kullanıcı ve ilan yönetimi",
    icon: UsersRound,
    match: { pathname: "/admin/users" },
  },
];

function isNavActive(
  item: NavItem,
  pathname: string,
  searchParams: URLSearchParams,
) {
  if (item.href === "/admin") return pathname === "/admin";

  const match = item.match;
  if (!match) return pathname.startsWith(item.href);

  if (match.pathname === "/admin/users") {
    return pathname === "/admin/users" || pathname.startsWith("/admin/users/");
  }

  if (pathname !== match.pathname) return false;

  if (match.type) {
    return searchParams.get("type") === match.type;
  }

  if (match.status) {
    return (
      searchParams.get("status") === match.status && !searchParams.get("type")
    );
  }

  return true;
}

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav className="space-y-1 p-3 pb-28">
      {nav.map((item) => {
        const active = isNavActive(item, pathname, searchParams);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={clsx(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <Icon size={18} className="shrink-0" />
            <span className="leading-snug">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [loading, user, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Admin paneli yükleniyor…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <div className="flex min-h-screen">
        <aside
          className={clsx(
            "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-5">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Agenta"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <div>
                <div className="text-sm font-extrabold tracking-wide">Agenta</div>
                <div className="text-[11px] font-medium text-slate-500">
                  Admin Panel
                </div>
              </div>
            </Link>
            <button
              type="button"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Suspense fallback={<div className="p-4 text-sm text-slate-400">…</div>}>
              <AdminNav onNavigate={() => setOpen(false)} />
            </Suspense>
          </div>
          <div className="shrink-0 border-t border-slate-100 p-4">
            <div className="mb-3 truncate text-xs text-slate-500">
              {user.email}
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => logout().then(() => router.push("/"))}
            >
              <LogOut size={16} />
              Çıkış Yap
            </Button>
          </div>
        </aside>

        {open ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Menüyü kapat"
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="text-sm font-semibold text-slate-700">
              Yönetim Merkezi
            </div>
            <div className="ml-auto">
              <Link
                href="/"
                className="text-sm font-medium text-slate-500 hover:text-[var(--brand)]"
              >
                Siteye dön
              </Link>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
