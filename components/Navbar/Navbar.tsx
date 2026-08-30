"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
import { FaCaretDown, FaUserCog, FaSignOutAlt } from 'react-icons/fa';
import { Flame, MessageSquarePlus, Menu, X, Loader2, Send } from 'lucide-react';
import { calculateCurrentStreak } from '@/lib/streakUtils';
import toast, { Toaster } from 'react-hot-toast';

export default function Navbar() {
  const { data: session, status } = useSession();

  // State สำหรับเปิด/ปิด Dropdown & Mobile Menu
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [streak, setStreak] = useState(0);

  // Feedback Modal State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('suggestion');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (session?.user) {
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

  // ถ้า URL มีคำว่า "typing-test" ให้ซ่อน Navbar
  if (pathname?.includes('/typing-test')) {
    return null;
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTitle.trim() || !feedbackContent.trim()) {
      toast.error('กรุณากรอกหัวข้อและเนื้อหาข้อเสนอแนะ');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: feedbackCategory,
          title: feedbackTitle,
          content: feedbackContent
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'ส่งข้อเสนอแนะสำเร็จ ขอบคุณครับ!');
        setFeedbackTitle('');
        setFeedbackContent('');
        setIsFeedbackModalOpen(false);
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการส่งข้อเสนอแนะ');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <nav className="w-full mx-auto h-24 md:h-28 relative z-50">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c648b] via-[#6fb2e6] to-[#5cb5db] border-bottom-1"></div>
        <div className="absolute inset-0 bg-[url('/pimwai_bg.png')] bg-cover bg-center opacity-10"></div>

        {/* Cloud Animations */}
        <div className="absolute inset-0 z-5 cloud-mask-base animate-cloud-1"><div className="w-full h-full bg-white opacity-40"></div></div>
        <div className="absolute inset-0 z-5 cloud-mask-base animate-cloud-2"><div className="w-full h-full bg-white opacity-30"></div></div>
        <div className="absolute inset-0 z-5 cloud-mask-base animate-cloud-3"><div className="w-full h-full bg-white opacity-30"></div></div>

        <div className="w-full max-w-7xl mx-auto flex items-center justify-between h-full text-white px-4 sm:px-6 relative z-10">

          {/* Logo */}
          <div className="shrink-0">
            <Link href="/lessons" className="flex flex-col">
              <span className="logo-font text-2xl sm:text-3xl font-bold tracking-wide leading-none">PIMWAI</span>
              <span className="logo-font text-base sm:text-lg font-bold text-white/80 leading-none mt-0.5">.com</span>
            </Link>
          </div>

          {/* Desktop Menu Bar */}
          <div className="hidden lg:flex items-center gap-4 bg-[#182834]/20 rounded-2xl px-6 py-1.5 backdrop-blur-xs">
            <Link href="/lessons" className={`menu-link-base text-sm ${pathname === '/lessons' ? 'menu-link-active' : 'menu-link-inactive'}`}>บทเรียน</Link>
            <Link href="/tests" className={`menu-link-base text-sm ${pathname === '/tests' ? 'menu-link-active' : 'menu-link-inactive'}`}>ทดสอบ</Link>
            <Link href="/rankings" className={`menu-link-base text-sm ${pathname === '/rankings' ? 'menu-link-active' : 'menu-link-inactive'}`}>อันดับ</Link>
            <Link href="/progress" className={`menu-link-base text-sm ${pathname === '/progress' ? 'menu-link-active' : 'menu-link-inactive'}`}>สรุปผลรวม</Link>

            <div className="text-xl text-white/40">|</div>

            {/* User Profile (Dropdown) */}
            <div className="flex items-center gap-3 h-full py-1">
              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                {status === "loading" ? (
                  <span className="text-sm opacity-50">...</span>
                ) : session ? (
                  <div>
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg transition-all duration-200 cursor-pointer
                        ${isDropdownOpen
                          ? 'bg-white text-[#5cb5db] shadow-sm'
                          : 'text-white hover:bg-white/10'
                        }
                      `}
                    >
                      <span className="font-medium max-w-[110px] truncate text-sm">
                        {session.user?.name || "User"}
                      </span>
                      <FaCaretDown className={`text-xs transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Dropdown Menu */}
                    <div
                      className={`absolute right-0 top-full w-56 bg-white rounded-b-xl rounded-tl-xl py-2 text-gray-700 overflow-hiddenorigin-top-right transition-all duration-200 z-50
                        ${isDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}
                      `}
                      style={{ marginTop: '-2px' }}
                    >
                      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Signed in as</p>
                        <p className="text-xs font-bold text-gray-800 truncate mt-0.5">{session.user?.email}</p>
                      </div>

                      <Link
                        href="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-[#5cb5db] transition-colors"
                      >
                        <FaUserCog className="text-base opacity-70" />
                        <span>ตั้งค่าบัญชี</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsFeedbackModalOpen(true);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-[#5cb5db] transition-colors"
                      >
                        <MessageSquarePlus className="text-base opacity-70" size={16} />
                        <span>ส่งข้อเสนอแนะ</span>
                      </button>

                      <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
                      >
                        <FaSignOutAlt className="text-base opacity-70" />
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link href="/login" className="flex items-center h-full px-2 hover:underline hover:text-yellow-300 transition font-medium text-sm">
                    เข้าสู่ระบบ
                  </Link>
                )}
              </div>

              {/* Streak Counter */}
              {session && (
                <div className="flex items-center text-white font-bold text-sm ml-1" title="Current Day Streak">
                  <Flame className="w-4 h-4 text-orange-300" fill="currentColor" />
                  <span className="ml-0.5">{streak} วัน</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Right Controls: Streak & Hamburger Menu Button */}
          <div className="flex lg:hidden items-center gap-3">
            {session && (
              <div className="flex items-center bg-[#182834]/30 text-whs bite font-bold text-xg-white/20 px-2.5 py-2 rounded-full">
                <Flame className="w-3.5 h-3.5 text-orange-300 mr-1" fill="currentColor" />
                <span>{streak} วัน</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white bg-[#182834]/30 hover:bg-white/30 rounded-xl transition cursor-pointer"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Slide-Out Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-[#182834]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl py-4 px-6 flex flex-col gap-3 z-50 text-white animate-in slide-in-from-top-4 duration-200">
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

            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsFeedbackModalOpen(true);
              }}
              className="py-2 px-3 rounded-xl font-bold text-sm text-left text-yellow-300 hover:bg-white/10 flex items-center gap-2"
            >
              <MessageSquarePlus size={16} />
              <span>ส่งข้อเสนอแนะ</span>
            </button>

            <div className="border-t border-white/10 pt-3 mt-1 flex flex-col gap-2">
              {session ? (
                <>
                  <div className="text-xs text-white/60 font-medium px-3 truncate">
                    เข้าสู่ระบบ: {session.user?.name || session.user?.email}
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2 px-3 rounded-xl font-bold text-sm text-white/90 hover:bg-white/10 flex items-center gap-2"
                  >
                    <FaUserCog size={15} />
                    <span>ตั้งค่าบัญชี</span>
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
      </nav>

      {/* Global Feedback Modal Accessible Everywhere */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-gray-100 flex flex-col gap-5 text-gray-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 text-[#5cb5db] rounded-2xl">
                  <MessageSquarePlus size={30} />
                </div>
                <div>
                  <h3 className="text-lg font-black logo-font text-gray-800">ส่งข้อเสนอแนะ</h3>
                  <p className="text-xs text-gray-400">อยากให้มีฟีเจอร์อะไร หรือพบปัญหา แจ้งให้ทีมงานทราบได้เลย</p>
                </div>
              </div>
              <button
                onClick={() => setIsFeedbackModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">ประเภท</label>
                  <select
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value)}
                    className="px-3.5 py-2.5 rounded-2xl border border-gray-200 focus:border-[#5cb5db] outline-none text-xs sm:text-sm bg-gray-50 font-medium"
                  >
                    <option value="suggestion">เสนอแนะฟีเจอร์ใหม่</option>
                    <option value="bug">แจ้งบั๊ก / ปัญหา</option>
                    <option value="content">เนื้อหาบทเรียน</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">หัวข้อ</label>
                  <input
                    type="text"
                    value={feedbackTitle}
                    onChange={(e) => setFeedbackTitle(e.target.value)}
                    placeholder="เช่น อยากให้มีโหมดพิมพ์แข่งกับเพื่อน"
                    maxLength={100}
                    className="px-4 py-2.5 rounded-2xl border border-gray-200 focus:border-[#5cb5db] outline-none text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">รายละเอียดเพิ่มเติม</label>
                <textarea
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  rows={4}
                  placeholder="พิมพ์ความคิดเห็นของคุณที่นี่..."
                  className="px-4 py-2.5 rounded-2xl border border-gray-200 focus:border-[#5cb5db] outline-none text-xs sm:text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback || !feedbackTitle || !feedbackContent}
                  className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#5cb5db] hover:bg-[#4a9ec2] transition shadow-sm cursor-pointer flex items-center gap-2 disabled:bg-gray-200 disabled:text-gray-400"
                >
                  {isSubmittingFeedback ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
                  <span>ส่งความคิดเห็น</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}