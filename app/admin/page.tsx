"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  FileVideo,
  Store,
  Users,
  ArrowRight,
} from "lucide-react";
import { fetchDashboardStats } from "@/lib/firestore";

type Stats = Awaited<ReturnType<typeof fetchDashboardStats>>;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "İstatistikler yüklenemedi"),
      );
  }, []);

  const cards = [
    {
      label: "Bekleyen içerik",
      value: stats?.contentsPending ?? "—",
      href: "/admin/contents?status=pending",
      icon: FileVideo,
      tone: "text-amber-600 bg-amber-50",
    },
    {
      label: "Bekleyen başvuru",
      value: stats?.applicationsPending ?? "—",
      href: "/admin/applications?status=pending",
      icon: ClipboardList,
      tone: "text-sky-600 bg-sky-50",
    },
    {
      label: "Kullanıcılar",
      value: stats?.users ?? "—",
      href: "/admin/users",
      icon: Users,
      tone: "text-violet-600 bg-violet-50",
    },
    {
      label: "İlanlar",
      value: stats?.listings ?? "—",
      href: "/admin/listings",
      icon: Store,
      tone: "text-emerald-600 bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Özet istatistikler. Hızlı işlemler sol menüde.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[var(--brand)]/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className={`rounded-xl p-2.5 ${card.tone}`}>
                  <Icon size={20} />
                </div>
                <ArrowRight
                  size={16}
                  className="text-slate-300 transition group-hover:text-[var(--brand)]"
                />
              </div>
              <div className="mt-4 text-3xl font-extrabold tracking-tight">
                {card.value}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-500">
                {card.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold">Onaylı içerik</h2>
        <p className="mt-3 text-3xl font-extrabold">
          {stats?.contentsApproved ?? "—"}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Mobil uygulamada yayınlanan içerik sayısı (örneklem limiti içinde).
          Sol menüden hızlı işlemlere geçebilirsiniz.
        </p>
      </div>
    </div>
  );
}
