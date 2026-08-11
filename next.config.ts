import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/privacy-policy",
        destination: "/privacy-policy.html",
        permanent: false,
      },
      {
        source: "/terms-of-use",
        destination: "/terms-of-use.html",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
