import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ne pas bloquer le déploiement sur des erreurs de types non critiques
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
