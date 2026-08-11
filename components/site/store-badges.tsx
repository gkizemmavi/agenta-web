import { STORE_LINKS } from "@/lib/store-links";

export function StoreBadges({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "md" | "lg";
}) {
  const h = size === "lg" ? "h-14" : "h-12";

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <a
        href={STORE_LINKS.appStore}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="App Store'dan indir"
        className={`${h} inline-flex items-center gap-3 rounded-xl bg-white px-4 text-[#0f0f12] transition hover:bg-zinc-100`}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
          <path
            fill="currentColor"
            d="M16.365 1.43c0 1.14-.433 2.2-1.207 3.01-.822.86-2.167 1.52-3.316 1.43-.14-1.1.433-2.25 1.207-3.1.822-.9 2.25-1.55 3.316-1.34zM20.7 17.4c-.55 1.27-.82 1.84-1.53 2.96-1 1.55-2.4 3.48-4.15 3.5-1.55.02-1.95-1.01-4.06-1-2.1.01-2.55 1.02-4.1 1.04-1.74.03-3.07-1.77-4.07-3.31C.7 17.4-.7 12.3 1.55 8.9c1.12-1.7 2.9-2.77 4.55-2.77 1.7 0 2.77 1.04 4.18 1.04 1.36 0 2.19-1.05 4.15-1.05 1.48 0 3.05.8 4.17 2.19-3.66 2-3.07 7.24.1 9.09z"
          />
        </svg>
        <span className="pr-1 text-left leading-tight">
          <span className="block text-[10px] font-medium opacity-70">
            Download on the
          </span>
          <span className="block text-sm font-bold tracking-wide">
            App Store
          </span>
        </span>
      </a>
      <a
        href={STORE_LINKS.playStore}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Google Play'den indir"
        className={`${h} inline-flex items-center gap-3 rounded-xl bg-white px-4 text-[#0f0f12] transition hover:bg-zinc-100`}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
          <path
            fill="#EA4335"
            d="M3.6 2.2c-.35.2-.6.58-.6 1.05v17.5c0 .47.25.85.6 1.05l9.55-9.8L3.6 2.2z"
          />
          <path
            fill="#FBBC04"
            d="M16.55 11.05 13.15 7.7 3.6 2.2l9.55 9.8 3.4-.95z"
          />
          <path
            fill="#4285F4"
            d="M16.55 12.95 13.15 16.3 3.6 21.8l9.55-9.8 3.4.95z"
          />
          <path
            fill="#34A853"
            d="M20.1 10.55c-.55-.3-3.55-2-3.55-2l-3.4 2.45 3.4 2.45s3-.1.7 3.55 2c.7-.4 1.15-1.15 1.15-2s-.45-1.6-1.15-2z"
          />
        </svg>
        <span className="pr-1 text-left leading-tight">
          <span className="block text-[10px] font-medium opacity-70">
            GET IT ON
          </span>
          <span className="block text-sm font-bold tracking-wide">
            Google Play
          </span>
        </span>
      </a>
    </div>
  );
}
