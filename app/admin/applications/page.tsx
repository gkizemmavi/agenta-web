"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Check, Trash2, X } from "lucide-react";
import {
  deleteAgentApplication,
  fetchAgentApplicationsPage,
  PAGE_SIZE,
  setAgentApplicationStatus,
  type PageCursor,
} from "@/lib/firestore";
import { useFirestorePagination } from "@/lib/use-firestore-pagination";
import {
  agentTypeLabel,
  type AgentAppStatus,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaginationBar } from "@/components/ui/pagination-bar";

const filters: { key: AgentAppStatus | "all"; label: string }[] = [
  { key: "pending", label: "Bekleyen" },
  { key: "approved", label: "Onaylı" },
  { key: "rejected", label: "Reddedilen" },
  { key: "all", label: "Tümü" },
];

const typeLabels: Record<string, string> = {
  individual: "Ajan",
  expert: "Exper",
  master: "Usta",
  service: "Servis",
};

export default function AdminApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Yükleniyor…
        </div>
      }
    >
      <AdminApplicationsInner />
    </Suspense>
  );
}

function AdminApplicationsInner() {
  const searchParams = useSearchParams();
  const initial =
    (searchParams.get("status") as AgentAppStatus | "all") || "pending";
  const typeFilter = searchParams.get("type") || "all";
  const [status, setStatus] = useState<AgentAppStatus | "all">(
    ["pending", "approved", "rejected", "all"].includes(initial)
      ? initial
      : "pending",
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (["pending", "approved", "rejected", "all"].includes(initial)) {
      setStatus(initial);
    }
  }, [initial]);

  const fetcher = useCallback(
    (cursor: PageCursor) =>
      fetchAgentApplicationsPage({
        status,
        typeKey: typeFilter,
        pageSize: PAGE_SIZE,
        cursor,
      }),
    [status, typeFilter],
  );

  const {
    items,
    page,
    hasMore,
    loading,
    error,
    pageSize,
    onPrev,
    onNext,
    reload,
  } = useFirestorePagination(fetcher, [status, typeFilter]);

  async function moderate(id: string, next: AgentAppStatus) {
    setBusyId(id);
    try {
      await setAgentApplicationStatus(id, next);
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "İşlem başarısız");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Başvuruyu silmek istediğinize emin misiniz?")) return;
    setBusyId(id);
    try {
      await deleteAgentApplication(id);
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Silinemedi");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {typeFilter !== "all" && typeLabels[typeFilter]
              ? `${typeLabels[typeFilter]} başvuruları`
              : "Başvurular"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sayfa başı {pageSize} başvuru.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatus(f.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                status === f.key
                  ? "bg-[var(--brand)] text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Kullanıcı</th>
                <th className="px-4 py-3 font-semibold">Tür</th>
                <th className="px-4 py-3 font-semibold">Konum</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3 font-semibold">Tarih</th>
                <th className="px-4 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Yükleniyor…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Başvuru bulunamadı.
                  </td>
                </tr>
              ) : (
                items.map((app) => (
                  <tr key={app.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">
                        {app.userName || "Kullanıcı"}
                      </div>
                      <div className="text-xs text-slate-500">{app.userEmail}</div>
                      <div className="text-xs text-slate-500">{app.userPhone}</div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        TC: {app.nationalId || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {agentTypeLabel(app.type)}
                      </div>
                      <div className="text-xs text-slate-400">{app.type}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        {app.province}
                        {app.district ? ` / ${app.district}` : ""}
                      </div>
                      <div className="mt-1 max-w-[220px] text-xs text-slate-500">
                        {app.address}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={app.status}>{app.status}</Badge>
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {app.submittedAt
                        ? format(app.submittedAt, "dd.MM.yyyy HH:mm")
                        : app.submittedAtIso || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {app.status !== "approved" ? (
                          <Button
                            variant="success"
                            disabled={busyId === app.id}
                            onClick={() => moderate(app.id, "approved")}
                          >
                            <Check size={16} /> Onayla
                          </Button>
                        ) : null}
                        {app.status !== "rejected" ? (
                          <Button
                            variant="danger"
                            disabled={busyId === app.id}
                            onClick={() => moderate(app.id, "rejected")}
                          >
                            <X size={16} /> Reddet
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          disabled={busyId === app.id}
                          onClick={() => remove(app.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationBar
        page={page}
        hasMore={hasMore}
        loading={loading}
        onPrev={onPrev}
        onNext={onNext}
        pageSize={pageSize}
        itemCount={items.length}
      />
    </div>
  );
}
