import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 blocks cross-origin dev assets by default. Allow loading
  // the dev server from 127.0.0.1 in addition to localhost so router
  // navigation, HMR, and fonts work regardless of which the user types.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
