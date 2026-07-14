import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler is disabled: with it on, Suspense-wrapped pages could get
  // stuck on their fallback/loading state (Next 16.1.2 + React 19). Leave off
  // until that interaction is resolved upstream.
  reactCompiler: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      // Locally-stored uploads served by the backend (disk-storage mode).
      // Local dev: backend runs on http://localhost:5000.
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
      },
      // 👉 On your VPS, add your backend domain here too, e.g.:
      // { protocol: "https", hostname: "api.yourdomain.com" },
    ],
  },
};

export default nextConfig;
