import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/tours", destination: "/", permanent: true },
      { source: "/tours/:path*", destination: "/", permanent: true },
      { source: "/events", destination: "/", permanent: true },
      { source: "/events/:path*", destination: "/", permanent: true },
      { source: "/request", destination: "/", permanent: true },
      { source: "/request/:path*", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
