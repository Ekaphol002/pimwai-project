"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
import { Menu, X } from 'lucide-react';
import { FaUserCog, FaSignOutAlt } from 'react-icons/fa';

export default function StickyNavbar() {
  const [showSticky, setShowSticky] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const { data: session, status } = useSession();

  // เช็คว่าตอนนี้อยู่หน้า /rankings หรือไม่
  const isTestPage = pathname?.startsWith('/rankings');

  useEffect(() => {
    if (isTestPage) {
      setShowSticky(true);
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 120) {
        setShowSticky(true);
      } else {
        setShowSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isTestPage]);

  return (
    <>
      <div
        className={`
          fixed top-0 left-0 w-full h-14 bg-gradient-to-t from-[#2291c3] to-[#5cb5db] z-50
          flex items-center justify-between px-4 sm:px-8 transition-transform duration-500 ease-in-out shadow-md
          ${showSticky ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        <div className="flex items-center gap-4">
          {/* 1. ชื่อเว็บ */}
          <Link href="/" className="text-white font-bold text-lg sm:text-xl logo-font tracking-wide">
            PIMWAI
            <span className="text-xs sm:text-sm">.com</span>
          </Link>
        </div>

        {/* --- ส่วนขวา: เมนู Desktop --- */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6 bg-[#182834]/25 rounded-xl px-6 lg:px-8 py-1.5 backdrop-blur-xs">
          <Link
            href="/lessons"
            className={`menu-link-base text-xs sm:text-sm ${pathname === '/lessons' ? 'menu-link-active' : 'menu-link-inactive'}`}
          >บทเรียน</Link>

          <Link
            href="/tests"
            className={`menu-link-base text-xs sm:text-sm ${pathname === '/tests' ? 'menu-link-active' : 'menu-link-inactive'}`}
          >ทดสอบ</Link>

          <Link
            href="/rankings"
            className={`menu-link-base text-xs sm:text-sm ${pathname === '/rankings' ? 'menu-link-active' : 'menu-link-inactive'}`}
          >อันดับ</Link>

          <Link
            href="/progress"
            className={`menu-link-base text-xs sm:text-sm ${pathname === '/progress' ? 'menu-link-active' : 'menu-link-inactive'}`}
          >สรุปผลรวม</Link>

          <div className="text-lg text-white/40">|</div>

          {/* ส่วนแสดงชื่อผู้ใช้ */}
          <div className="flex items-center gap-2 text-white font-medium text-xs sm:text-sm">
            {status === "loading" ? (
              <span>...</span>
            ) : session ? (
              <span className="max-w-[120px] truncate">{session.user?.name || "User"}</span>
            ) : (
              <Link href="/login" className="hover:underline text-yellow-300">เข้าสู่ระบบ</Link>
            )}
          </div>
        </div>

        {/* --- Mobile Hamburger Button --- */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-white bg-[#182834]/30 hover:bg-white/30 rounded-xl transition cursor-pointer"
            aria-label="Toggle Sticky Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Out Drawer for StickyNavbar */}
      {showSticky && isMobileMenuOpen && (
        <div className="md:hidden fixed top-14 left-0 w-full bg-[#182834]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl py-4 px-6 flex flex-col gap-2.5 z-50 text-white animate-in slide-in-from-top-2 duration-200">
          <Link
            href="/lessons"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`py-2 px-3 rounded-xl font-bold text-sm ${pathname === '/lessons' ? 'bg-[#5cb5db] text-white' : 'text-white/80 hover:bg-white/10'}`}
          >
            บทเรียน
          </Link>
          <Link
            href="/tests"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`py-2 px-3 rounded-xl font-bold text-sm ${pathname === '/tests' ? 'bg-[#5cb5db] text-white' : 'text-white/80 hover:bg-white/10'}`}
          >
            ทดสอบ
          </Link>
          <Link
            href="/rankings"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`py-2 px-3 rounded-xl font-bold text-sm ${pathname === '/rankings' ? 'bg-[#5cb5db] text-white' : 'text-white/80 hover:bg-white/10'}`}
          >
            อันดับ
          </Link>
          <Link
            href="/progress"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`py-2 px-3 rounded-xl font-bold text-sm ${pathname === '/progress' ? 'bg-[#5cb5db] text-white' : 'text-white/80 hover:bg-white/10'}`}
          >
            สรุปผลรวม
          </Link>

          <div className="border-t border-white/10 pt-2.5 mt-1 flex flex-col gap-2">
            {session ? (
              <>
                <Link
                  href="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-xl font-bold text-sm text-white/90 hover:bg-white/10 flex items-center gap-2"
                >
                  <FaUserCog size={15} />
                  <span>ตั้งค่าบัญชี ({session.user?.name || "User"})</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="py-2 px-3 rounded-xl font-bold text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-2 text-left"
                >
                  <FaSignOutAlt size={15} />
                  <span>ออกจากระบบ</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 px-4 rounded-xl font-bold text-sm bg-[#5cb5db] text-white text-center shadow-md"
              >
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}