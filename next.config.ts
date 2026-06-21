import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Redirige cualquier acceso por el dominio de Vercel (incluidos
      // los previews del proyecto) al dominio canonical pointix.com.ar.
      // Esto cubre bookmarks viejos, links compartidos antes de tener
      // dominio propio, y SEO (canonical bien definido).
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "pointix-turnero.*\\.vercel\\.app",
          },
        ],
        destination: "https://pointix.com.ar/:path*",
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
