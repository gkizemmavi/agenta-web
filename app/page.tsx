import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 500px at 10% -10%, rgba(250,131,2,0.14), transparent 55%), radial-gradient(900px 400px at 100% 0%, rgba(250,131,2,0.08), transparent 50%)",
        }}
      />
      <div className="relative">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 pb-20 pt-16">
          <div className="mb-10 flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="Agenta"
              width={72}
              height={72}
              className="rounded-2xl shadow-lg shadow-orange-500/20"
              priority
            />
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                Agenta
              </h1>
              <p className="mt-1 text-[var(--site-muted)]">
                Yönetim paneli ve yasal sayfalar
              </p>
            </div>
          </div>

          <p className="max-w-xl text-lg leading-relaxed text-zinc-300">
            Üst menüdeki Login ile admin hesabınıza giriş yaparak içerik
            onayları, başvurular, kullanıcılar ve ilanları yönetebilirsiniz.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/privacy-policy.html"
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[var(--brand)]/40 hover:bg-white/[0.05]"
            >
              <h2 className="text-lg font-bold">Gizlilik Politikası</h2>
              <p className="mt-2 text-sm text-[var(--site-muted)]">
                Kişisel verilerin nasıl toplandığı ve korunduğu.
              </p>
            </Link>
            <Link
              href="/terms-of-use.html"
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[var(--brand)]/40 hover:bg-white/[0.05]"
            >
              <h2 className="text-lg font-bold">Kullanım Koşulları</h2>
              <p className="mt-2 text-sm text-[var(--site-muted)]">
                Hizmet kullanımı, hesaplar, ilanlar ve sorumluluklar.
              </p>
            </Link>
          </div>
        </main>
        <footer className="border-t border-white/10 py-8 text-center text-sm text-[var(--site-muted)]">
          © {new Date().getFullYear()} Agenta
        </footer>
      </div>
    </div>
  );
}
