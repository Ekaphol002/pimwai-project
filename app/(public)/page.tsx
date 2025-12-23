"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MousePointer2, Star, Presentation } from 'lucide-react';

// --- Components: Typewriter Effect ---
const Typewriter = ({ text, delay = 100, infinite = true }: { text: string; delay?: number; infinite?: boolean }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (currentIndex < text.length) {
      timeout = setTimeout(() => {
        setCurrentText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);
    }
    return () => clearTimeout(timeout);
  }, [currentIndex, delay, text, infinite]);

  return (
    <span className="inline-block">
      {currentText}
      <span className="animate-cursor-blink ml-1 border-r-4 border-white h-[1em] inline-block align-middle"></span>
    </span>
  );
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  // ดักจับการเลื่อนหน้าจอ เพื่อเปลี่ยนสี Navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans overflow-x-hidden">

      {/* ================= Sticky Navbar ================= */}
      <nav
        className={`fixed top-0 left-0 w-full px-6 md:px-10 py-3 z-50 flex justify-between items-center transition-all duration-300 ${scrolled
            ? 'bg-[#0c648b]/90 backdrop-blur-md shadow-md' // เพิ่ม backdrop-blur ให้สวยขึ้น
            : 'bg-transparent'
          }`}
      >
        {/* Logo (กดแล้วกลับไปหน้าแรกเหมือนกัน) */}
        <a href="#" className="flex items-center gap-2 group">
          <div className="text-3xl font-black text-white logo-font tracking-wide drop-shadow-md group-hover:scale-105 transition-transform">
            PIMWAI
          </div>
        </a>

        {/* Menu Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8 mr-10">

          {/* 1. หน้าแรก (เลื่อนไปบนสุด) */}
          <a href="#" className="font-medium text-white hover:text-blue-200 transition-colors">
            หน้าแรก
          </a>

          {/* 2. ฟีเจอร์ (เลื่อนไปหา id="features") */}
          <a href="#features" className="font-medium text-white hover:text-blue-200 transition-colors">
            ฟีเจอร์
          </a>

          {/* 3. ปุ่มเรียนรู้ (เลื่อนไปหา id="presentation") */}
          <a
            href="#presentation" className="font-medium text-white hover:text-blue-200 transition-colors">
            <span>เรียนรู้</span>
          </a>
        </div>
      </nav>

      {/* ================= Hero Section (Blue Background) ================= */}
      <section className="relative min-h-screen bg-gradient-to-b from-[#0c648b] via-[#2d8ab5] to-[#5cb5db] pt-32 pb-20 px-4 flex flex-col items-center justify-center text-center overflow-hidden">

        {/* Background Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-4 h-4 bg-white/20 rounded-full animate-float-slow"></div>
          <div className="absolute top-40 right-20 w-8 h-8 bg-white/10 rounded-full animate-float-slow delay-700"></div>
          <div className="absolute bottom-20 left-1/4 w-6 h-6 bg-white/10 rounded-full animate-float-slow delay-1000"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">

          {/* ข้อความต้อนรับ */}
          <div className="mb-10 h-32 flex flex-col items-center justify-center">
            <h2 className="text-xl md:text-2xl text-blue-100 font-medium mb-4 uppercase tracking-widest opacity-90">
              The Ultimate Typing Platform
            </h2>
            <h1 className="text-5xl md:text-7xl font-black text-white  drop-shadow-lg leading-tight">
              <Typewriter text="สวัสดี PIMWAI ยินดีต้อนรับ" delay={100} />
            </h1>
          </div>

          {/* ปุ่ม Action */}
          <div className="flex flex-col sm:flex-row gap-6 mb-20 w-full max-w-md mx-auto">
            <Link href="/login" className="flex-1">
              <button className="w-full py-4 rounded-2xl bg-[#facc15] text-yellow-900 text-xl font-black shadow-[0_4px_0_rgb(202,138,4)] active:shadow-none active:translate-y-[4px] transition-all hover:bg-[#fde047] flex items-center justify-center gap-2">
                <MousePointer2 className="fill-yellow-900" size={24} />
                เข้าสู่ระบบ
              </button>
            </Link>

            <Link href="/register" className="flex-1">
              <button className="w-full py-4 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/30 text-white text-xl font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                สร้างบัญชี
              </button>
            </Link>
          </div>

          {/* --- Feature Highlights Container (White Box) --- */}
          <div className="relative w-full max-w-6xl mt-20 flex flex-col items-center" id="features">

            <div className="perspective-1000 group w-full flex justify-center">
              {/* Central Feature Card */}
              <div className="relative w-full bg-white backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-2xl flex flex-col transform rotateX(5deg) transition-transform duration-500 hover:rotateX(0deg) hover:scale-[1.02] overflow-hidden">

                {/* Window Header Bar (แถบหัวหน้าต่าง) */}
                <div className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="text-gray-400 text-sm font-bold tracking-wider font-mono">PIMWAI_APP</div>
                  <div className="w-10"></div>
                </div>

                {/* 🆕 ส่วนหัวข้อ (ย้ายเข้ามาข้างในกล่องแล้ว) */}
                <div className="px-8 pt-6 pb-2 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">
                    <Star size={14} className="fill-blue-600" />
                    <span>Features Highlights</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-2">
                    ฟีเจอร์ที่ช่วยให้คุณพิมพ์เก่งขึ้น
                  </h2>
                  <p className="text-gray-500 max-w-2xl mx-auto">
                    ครบเครื่องเรื่องงานพิมพ์ ด้วยฟังก์ชันที่ออกแบบมาเพื่อพัฒนาทักษะของคุณโดยเฉพาะ
                  </p>
                </div>

                {/* Features Grid (รูปภาพ 3 รูป) */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">

                  {/* Feature 1: Lessons */}
                  <div className="flex flex-col items-center text-center group/item">
                    <div className="w-full aspect-[4/3] bg-blue-50 rounded-2xl mb-6 overflow-hidden relative shadow-inner border border-blue-100 group-hover/item:shadow-lg transition-all">
                      {/* ✅ Image for Lessons */}
                      <img src="/lesson.png" alt="Lesson Preview" className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">บทเรียนที่ครอบคลุม</h3>
                    <p className="text-gray-500 text-sm leading-relaxed px-4">
                      เริ่มต้นจากศูนย์สู่มือโปร ด้วยบทเรียนที่ออกแบบมาให้เรียนรู้ง่ายและสนุก
                    </p>
                  </div>

                  {/* Feature 2: Tests */}
                  <div className="flex flex-col items-center text-center group/item">
                    <div className="w-full aspect-[4/3] bg-yellow-50 rounded-2xl mb-6 overflow-hidden relative shadow-inner border border-yellow-100 group-hover/item:shadow-lg transition-all">
                      {/* ✅ Image for Tests */}
                      <img src="/tests.png" alt="Test Preview" className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">ทดสอบความเร็ว</h3>
                    <p className="text-gray-500 text-sm leading-relaxed px-4">
                      วัดระดับความเร็วและความแม่นยำของคุณได้ทุกที่ทุกเวลา พร้อมผลลัพธ์ทันที
                    </p>
                  </div>

                  {/* Feature 3: Progress */}
                  <div className="flex flex-col items-center text-center group/item">
                    <div className="w-full aspect-[4/3] bg-green-50 rounded-2xl mb-6 overflow-hidden relative shadow-inner border border-green-100 group-hover/item:shadow-lg transition-all">
                      {/* ✅ Image for Progress */}
                      <img src="/progress.png" alt="Progress Preview" className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">ติดตามพัฒนาการ</h3>
                    <p className="text-gray-500 text-sm leading-relaxed px-4">
                      ดูสถิติย้อนหลังและกราฟวิเคราะห์เพื่อดูความก้าวหน้าของคุณในทุกๆ วัน
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Website Presentation Section ================= */}
      <section id="presentation" className="py-24 bg-[#f8fafc] px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">

          {/* Left: Text Description */}
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#5cb5db] text-xs font-bold uppercase tracking-wider">
              <Presentation size={16} /> Website Presentation
            </div>

            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
              เรียนรู้การพิมพ์ <br />
              <span className="text-transparent p-2 ml-35 bg-clip-text bg-gradient-to-r from-[#5cb5db] to-[#2291c3]">
                ในรูปแบบใหม่
              </span>
            </h2>

            <p className="text-lg text-gray-500 leading-relaxed">
              พบกับประสบการณ์การฝึกพิมพ์ที่ไม่เหมือนใคร ด้วยอินเตอร์เฟสที่ทันสมัย บทเรียนที่เข้าใจง่าย และระบบวิเคราะห์ผลแบบเรียลไทม์ที่จะช่วยให้คุณพิมพ์ได้เร็วขึ้นภายใน 1 สัปดาห์
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {[
                "บทเรียนไล่ระดับ (Beginner - Expert)",
                "เกมฝึกพิมพ์ที่สนุกและท้าทาย",
                "ระบบเก็บสถิติและกราฟพัฒนาการ",
                "จัดอันดับแข่งขัน (Leaderboard)"
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center text-green-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Presentation Image Container (Browser Style) */}
          <div className="flex-1 w-full">
            {/* ✨ เพิ่มกรอบ Browser Window ให้ดูเหมือนเปิดเว็บอยู่ */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white group hover:-translate-y-2 transition-transform duration-500 ease-out">

              {/* Browser Toolbar (Header) */}
              <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                {/* Traffic Lights */}
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                {/* Fake URL Bar */}
                <div className="flex-1 bg-white border border-gray-200 rounded-md h-6 mx-4 shadow-sm"></div>
              </div>

              {/* Image / GIF Area */}
              <div className="relative aspect-video w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  src="/Demo.gif"   // ✅ ไฟล์ GIF แสดงตัวอย่างเว็บ
                  alt="PIMWAI Website Demo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Decorative blob (พื้นหลัง) */}
            <div className="absolute -z-10 top-1/2 right-0 w-72 h-72 bg-blue-200 rounded-full blur-[100px] opacity-50 translate-x-1/4"></div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 text-center text-gray-400 text-sm">
        © 2024 PIMWAI. All rights reserved.
      </footer>
    </div>
  );
}