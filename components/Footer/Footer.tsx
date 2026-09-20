"use client";
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear(); 

  if (pathname?.includes('typing-test') || pathname?.includes('/tests/typing') || pathname === '/farm' || pathname?.startsWith('/farm')) {
    return null; 
  }

  return (
    // ✅ bg-transparent: ให้สีกลืนไปกับพื้นหลังของหน้าเว็บ
    // ✅ border-t: เส้นขอบบางๆ ด้านบนกั้นไว้นิดเดียวให้ดูเป็นสัดส่วน
    <footer className="bg-white border-t border-gray-100 py-8 text-center text-gray-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400 gap-2">
        
        {/* ส่วนลิขสิทธิ์ */}
        <div className="font-medium">
          © {currentYear} PIMWAI Project. All rights reserved.
        </div>

        {/* ✅ ส่วนเครดิตคุณ (ปรับข้อความตรง Created by... ได้เลย) */}
        <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
          <span>Created with</span>
          <span>by</span>
          <span className="font-bold text-gray-500">Ekkaphol</span> {/* 👈 ใส่ชื่อคุณตรงนี้ */}
          <span>email</span>
          <span className="font-bold text-gray-500">ekapholekaphol368@gmail.com</span> 
        </div>

      </div>
    </footer>
  );
}