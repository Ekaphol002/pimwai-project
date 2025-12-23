"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// ✅ 1. เพิ่ม import useSession
import { useSession } from "next-auth/react";

export default function StickyNavbar() {
  const [showSticky, setShowSticky] = useState(false);
  const pathname = usePathname();
  
  // ✅ 2. ดึงข้อมูล Session
  const { data: session, status } = useSession();

  // เช็คว่าตอนนี้อยู่หน้า /tests หรือไม่
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
    <div 
      className={`
        fixed top-0 left-0 w-full h-13 bg-gradient-to-t from-[#2291c3] to-[#5cb5db] z-50
        flex items-center justify-between pl-8 pr-60 transition-transform duration-500 ease-in-out
        ${showSticky ? 'translate-y-0' : '-translate-y-full'}
      `}
    >
      <div className="flex items-center gap-6">
        {/* 1. ชื่อเว็บ */}
        <Link href="/" className="text-white font-bold text-xl logo-font tracking-wide">
          PIMWAI
          <span className="text-sm">.com</span>
        </Link>
      </div>

      {/* --- ส่วนขวา: เมนู --- */}
      <div className="flex items-center gap-6 bg-[#182834]/25 rounded-lg px-10 py-1">
            <Link 
              href="/lessons" 
              className={`menu-link-base ${pathname === '/lessons' ? 'menu-link-active' : 'menu-link-inactive'}`}
            >บทเรียน</Link>

            <Link 
              href="/tests" 
              className={`menu-link-base ${pathname === '/tests' ? 'menu-link-active' : 'menu-link-inactive'}`}
            >ทดสอบ</Link>

            <Link 
              href="/rankings" 
              className={`menu-link-base ${pathname === '/rankings' ? 'menu-link-active' : 'menu-link-inactive'}`}
            >อันดับ</Link>

            <Link 
              href="/progress" 
              className={`menu-link-base ${pathname === '/progress' ? 'menu-link-active' : 'menu-link-inactive'}`}
            >สรุปผลรวม</Link>

            <div className="text-2xl text-white/50">|</div>

            {/* ✅ 3. ส่วนแสดงชื่อผู้ใช้ (แก้ตรงนี้) */}
            <div className="flex items-center gap-3 text-white font-medium">
              {status === "loading" ? (
                <span>...</span>
              ) : session ? (
                <>
                  <span>{session.user?.name || "User"}</span>
                </>
              ) : (
                <span>Guest</span>
              )}
            </div>
      </div>

    </div>
  );
}