"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
import { FaCaretDown, FaUserCog, FaSignOutAlt } from 'react-icons/fa';
import { Flame } from 'lucide-react';
import { calculateCurrentStreak } from '@/lib/streakUtils';

export default function Navbar() {
  const { data: session, status } = useSession();

  // State สำหรับเปิด/ปิด Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (session?.user) {
      // เรียก API เพื่อดึงข้อมูล Activity Dates มาคำนวณ Streak
      fetch('/api/progress')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.activityDates) {
            setStreak(calculateCurrentStreak(data.activityDates));
          }
        })
        .catch(err => console.error("Failed to load streak:", err));
    }
  }, [session]);

  const pathname = usePathname();

  // ✅ 3. เขียนดักไว้ตรงนี้เลย! 
  // ถ้า URL มีคำว่า "typing-test" ให้ซ่อน Navbar ไปเลย (return null)
  if (pathname?.includes('/typing-test')) {
    return null;
  }

  return (
    <nav className="w-full mx-auto h-28 relative z-50">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c648b] via-[#6fb2e6] to-[#5cb5db] border-bottom-1"></div>
      <div className="absolute inset-0 bg-[url('/pimwai_bg.png')] bg-cover bg-center opacity-10"></div>

      {/* Cloud Animations */}
      <div className="absolute inset-0 z-5 cloud-mask-base animate-cloud-1"><div className="w-full h-full bg-white opacity-40"></div></div>
      <div className="absolute inset-0 z-5 cloud-mask-base animate-cloud-2"><div className="w-full h-full bg-white opacity-30"></div></div>
      <div className="absolute inset-0 z-5 cloud-mask-base animate-cloud-3"><div className="w-full h-full bg-white opacity-30"></div></div>

      <div className="w-full mx-auto flex items-center h-full text-white px-6 justify-center relative z-10" >

        {/* Logo */}
        <div>
          <Link href="/lessons">
            <div className="logo-font text-3xl font-bold pr-35">PIMWAI</div>
            <div className="logo-font text-2xl font-bold pr-35">.com</div>
          </Link>
        </div>

        {/* Menu Bar */}
        <div>
          <div className="flex items-center gap-4 bg-[#182834]/20 rounded-lg px-8 py-1">

            <Link href="/lessons" className={`menu-link-base ${pathname === '/lessons' ? 'menu-link-active' : 'menu-link-inactive'}`}>บทเรียน</Link>
            <Link href="/tests" className={`menu-link-base ${pathname === '/tests' ? 'menu-link-active' : 'menu-link-inactive'}`}>ทดสอบ</Link>
            <Link href="/rankings" className={`menu-link-base ${pathname === '/rankings' ? 'menu-link-active' : 'menu-link-inactive'}`}>อันดับ</Link>
            <Link href="/progress" className={`menu-link-base ${pathname === '/progress' ? 'menu-link-active' : 'menu-link-inactive'}`}>สรุปผลรวม</Link>

            <div className="text-2xl text-white/50">|</div>

            {/* ✅ ส่วน User Profile (Hover Dropdown) */}
            <div className="flex items-center gap-4 h-full py-1">

              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => setIsDropdownOpen(true)} // เมาส์เข้า -> เปิด
                onMouseLeave={() => setIsDropdownOpen(false)} // เมาส์ออก -> ปิด
              >
                {status === "loading" ? (
                  <span className="text-sm opacity-50">...</span>
                ) : session ? (
                  // --- ล็อกอินแล้ว ---
                  <div>
                    {/* ปุ่ม (เปลี่ยนสีพื้นหลังตามสถานะ) */}
                    <div
                      className={`flex items-center gap-3 px-4 py-1.5 rounded-t-lg transition-all duration-200 cursor-pointer
                        ${isDropdownOpen
                          ? 'bg-white text-[#5cb5db] shadow-sm'  // ✅ ตอนเปิด: พื้นขาว ตัวอักษรฟ้า
                          : 'text-white hover:bg-white/10'       // ⬜ ตอนปิด: พื้นใส ตัวอักษรขาว
                        }
                      `}
                    >

                      {/* ชื่อ */}
                      <span className="font-medium max-w-[100px] truncate">
                        {session.user?.name || "User"}
                      </span>

                      {/* ลูกศรชี้ลง */}
                      <FaCaretDown className={`text-xs transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* --- ตัว Dropdown Menu --- */}
                    {/* เพิ่ม pt-0 เพื่อให้เมนูติดกับปุ่มเลย */}
                    <div
                      className={`absolute right-0 top-full w-56 bg-white rounded-b-xl rounded-tl-xl shadow-xl py-2 text-gray-700 overflow-hidden border border-gray-100 origin-top-right transition-all duration-200
                        ${isDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}
                      `}
                      style={{ marginTop: '-5px' }} // ดึงขึ้นมานิดนึงให้ทับเส้นขอบกันเนียนๆ
                    >

                      {/* Header เล็กๆ */}
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Signed in as</p>
                        <p className="text-sm font-bold text-gray-800 truncate">{session.user?.email}</p>
                      </div>

                      <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <FaSignOutAlt className="text-lg opacity-70" /> ออกจากระบบ
                      </button>
                    </div>
                  </div>
                ) : (
                  // --- ยังไม่ล็อกอิน ---
                  <Link href="/login" className="flex items-center h-full px-2 hover:underline hover:text-yellow-300 transition font-medium">
                    เข้าสู่ระบบ
                  </Link>
                )}
              </div>

              {/* Streak Counter (Moved to Right) */}
              {session && (
                <div className="hidden md:flex items-center text-white font-bold" title="Current Day Streak">
                  <Flame className="w-5 h-5" fill="white" />
                  <span className="text-lg">{streak} วัน</span>
                </div>
              )}
            </div>

          </div>
        </div>

      </div >
    </nav >
  );
}