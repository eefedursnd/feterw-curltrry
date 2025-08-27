import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  server: {
    port: 80,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'r2.haze.bio',
      },
      {
        protocol: 'https',
        hostname: 's3.haze.bio',
      },
      {
        protocol: 'https',
        hostname: 'cdn.haze.bio',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      }
    ],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
