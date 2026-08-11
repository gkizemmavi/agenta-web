"use client";

import { useState } from "react";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { getBlob, getDownloadURL, ref as storageRef } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase";
import type { AgentApplicationDocument } from "@/lib/types";

async function resolveUrl(doc: AgentApplicationDocument): Promise<string> {
  if (doc.path) {
    try {
      return await getDownloadURL(storageRef(getFirebaseStorage(), doc.path));
    } catch {
      /* fall through to stored url */
    }
  }
  return doc.url;
}

async function downloadFile(doc: AgentApplicationDocument): Promise<void> {
  const storage = getFirebaseStorage();
  const fileName = (doc.title || doc.key || "belge").replace(
    /[^\w.\-ğüşıöçĞÜŞİÖÇ ]+/gi,
    "_",
  );

  if (doc.path) {
    try {
      const blob = await getBlob(storageRef(storage, doc.path));
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      return;
    } catch {
      /* fall through */
    }
  }

  const url = await resolveUrl(doc);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.target = "_blank";
  a.rel = "noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function AgentApplicationDocuments({
  documents,
}: {
  documents: AgentApplicationDocument[];
}) {
  const [busyKey, setBusyKey] = useState<string | null>(null);

  if (!documents.length) {
    return <span className="text-xs text-slate-400">Belge yok</span>;
  }

  async function openDoc(doc: AgentApplicationDocument, download: boolean) {
    const key = `${doc.key}:${download ? "dl" : "open"}`;
    setBusyKey(key);
    try {
      if (download) {
        await downloadFile(doc);
      } else {
        const url = await resolveUrl(doc);
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Belge açılamadı");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <ul className="space-y-2">
      {documents.map((doc) => {
        const openBusy = busyKey === `${doc.key}:open`;
        const dlBusy = busyKey === `${doc.key}:dl`;
        return (
          <li
            key={`${doc.key}-${doc.path ?? doc.url}`}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2"
          >
            <div className="flex items-start gap-2">
              <FileText
                size={14}
                className="mt-0.5 shrink-0 text-slate-500"
              />
              <div className="min-w-0 flex-1">
                {doc.category ? (
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--brand)]">
                    {doc.category}
                  </div>
                ) : null}
                <div className="truncate text-xs font-medium text-slate-800">
                  {doc.title || doc.key}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={busyKey != null}
                    onClick={() => openDoc(doc, false)}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 disabled:opacity-50"
                  >
                    {openBusy ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ExternalLink size={12} />
                    )}
                    Aç
                  </button>
                  <button
                    type="button"
                    disabled={busyKey != null}
                    onClick={() => openDoc(doc, true)}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 disabled:opacity-50"
                  >
                    {dlBusy ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Download size={12} />
                    )}
                    İndir
                  </button>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
