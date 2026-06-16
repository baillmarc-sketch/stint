import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Demo imagery is hotlinked from deterministic sources. Optimization is
    // disabled so the optimizer never has to fetch/transcode dozens of remote
    // images at request time — keeps the demo fast and bulletproof. Swap to
    // Supabase Storage + optimization before a real launch.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "randomuser.me" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
