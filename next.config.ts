import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ 1. ยอมให้ผ่านแม้จะมี Error Typescript
  typescript: {
    ignoreBuildErrors: true,
  },
  // ✅ 2. ยอมให้ผ่านแม้จะมี Error Eslint
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
