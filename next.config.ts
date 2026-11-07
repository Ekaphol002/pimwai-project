// next.config.ts

import type { NextConfig } from "next";

// เปลี่ยนตรงนี้เป็น any
const nextConfig: any = {
  // 1. ปิด error TypeScript ตอน build
  typescript: {
    ignoreBuildErrors: true,
  },
  

  // 2. 301 Permanent Redirect จากโดเมนเก่า pimwai.vercel.app มาที่ https://pimwai.com
  // เพื่อโอนคะแนน SEO (Link Equity) ทั้งหมดมารวมที่โดเมนหลัก และรองรับ Change of Address ใน Google Search Console
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'pimwai.vercel.app',
          },
        ],
        destination: 'https://pimwai.com/:path*',
        permanent: true,
      },
    ];
  },

  // config อื่นๆ (ถ้ามี)
  async headers() {
    return [
      {
        source: '/_next/static/media/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },
};

export default nextConfig;