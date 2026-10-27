"use client";
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  if (
    pathname?.includes('typing-test') ||
    pathname?.includes('/tests/typing') ||
    pathname === '/farm' ||
    pathname?.startsWith('/farm') ||
    pathname === '/code' ||
    pathname?.startsWith('/code')
  ) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-gray-100 py-8 text-center text-gray-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400 gap-2">
        {/* ส่วนลิขสิทธิ์ */}
        <div className="font-medium">
          © {currentYear} PIMWAI Project. All rights reserved.
        </div>

        {/* ส่วนเครดิต */}
        <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
          <span>Created with</span>
          <span>by</span>
          <span className="font-bold text-gray-500">Ekkaphol</span>
          <span>email</span>
          <span className="font-bold text-gray-500">ekapholekaphol368@gmail.com</span>
        </div>
      </div>
    </footer>
  );
}
