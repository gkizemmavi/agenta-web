import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { StoreBadges } from "@/components/site/store-badges";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)]">
      <SiteHeader />

      {/* Hero — one composition: brand, headline, line, CTAs, full-bleed image */}
      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <Image
          src="/images/hero.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center animate-hero-ken"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(15,15,18,0.55) 0%, rgba(15,15,18,0.35) 40%, rgba(15,15,18,0.88) 100%), radial-gradient(900px 420px at 15% 10%, rgba(250,131,2,0.28), transparent 60%)",
          }}
        />
        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:pb-20">
          <div className="max-w-2xl animate-fade-up">
            <p className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
              Agenta
            </p>
            <h1 className="mt-4 text-2xl font-bold leading-snug text-white sm:text-3xl">
              Araç, emlak ve ikinci el için canlı pazar
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-zinc-300 sm:text-lg">
              İlan ver, açık artırmaya katıl, ajanlarla çalış — hepsi tek
              uygulamada.
            </p>
            <StoreBadges className="mt-8" size="lg" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="relative overflow-hidden border-t border-white/10">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
          <div className="animate-fade-up order-2 lg:order-1">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Her kategori, tek akış
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[var(--site-muted)]">
              Vasıta, emlak, ikinci el, yedek parça ve hizmet ilanlarını aynı
              yerden keşfet. Konum, fotoğraf ve video ile ilanlarını dakikalar
              içinde yayınla.
            </p>
          </div>
          <div className="relative order-1 aspect-[4/3] overflow-hidden rounded-2xl lg:order-2">
            <Image
              src="/images/categories.png"
              alt="Agenta kategori görselleri"
              fill
              className="object-contain object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Auction */}
      <section className="relative border-t border-white/10 bg-[#121216]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image
              src="/images/feature-auction.jpg"
              alt="Açık artırma deneyimi"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Canlı açık artırma
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[var(--site-muted)]">
              Teklif ver, yükselt, kazan. Satış sürecini uygulama içinde takip
              et; kredi ve üyelik ile ilan haklarını yönet.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="relative border-t border-white/10">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
          <div className="order-2 lg:order-1">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              İçerikle görünür ol
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[var(--site-muted)]">
              Kısa video ve fotoğraflarla ilanlarını öne çıkar. Takip et, mesaj
              at, güvenilir satıcılarla bağlantı kur.
            </p>
          </div>
          <div className="relative order-1 aspect-[4/3] overflow-hidden rounded-2xl lg:order-2">
            <Image
              src="/images/feature-content.jpg"
              alt="İçerik paylaşımı"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Agents + estate strip */}
      <section className="relative border-t border-white/10 bg-[#121216]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image
              src="/images/estate.jpg"
              alt="Emlak ve ajan ağı"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ajan, exper, usta, servis
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[var(--site-muted)]">
              Güvenilir profesyonellere başvur veya kendi ağında yer al. Ekspertiz
              ve servis süreçlerini Agenta üzerinden yönet.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        id="indir"
        className="relative overflow-hidden border-t border-white/10"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(800px 360px at 50% 0%, rgba(250,131,2,0.18), transparent 65%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 py-24 text-center">
          <p className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Agenta
          </p>
          <p className="mx-auto mt-4 max-w-md text-lg text-[var(--site-muted)]">
            Hemen indir, ilk ilanını yayınla veya açık artırmaya katıl.
          </p>
          <StoreBadges className="mt-10 justify-center" size="lg" />
        </div>
      </section>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-[var(--site-muted)] sm:flex-row">
          <span>© {new Date().getFullYear()} Agenta</span>
          <div className="flex gap-5">
            <Link href="/privacy-policy.html" className="hover:text-white">
              Gizlilik
            </Link>
            <Link href="/terms-of-use.html" className="hover:text-white">
              Koşullar
            </Link>
            <a href="#indir" className="hover:text-white">
              İndir
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
