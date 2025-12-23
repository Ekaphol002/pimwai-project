// next.config.ts

import type { NextConfig } from "next";

// เปลี่ยนตรงนี้เป็น any
const nextConfig: any = {
  // 1. ปิด error TypeScript ตอน build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 2. ปิด error ESLint ตอน build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // config อื่นๆ (ถ้ามี)
};

export default nextConfig;