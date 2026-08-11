import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agenta — Araç, emlak ve ikinci el pazarı",
  description:
    "Agenta ile ilan ver, açık artırmaya katıl, ajanlarla çalış. App Store ve Google Play'den indir.",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
