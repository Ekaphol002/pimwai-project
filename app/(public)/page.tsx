"use client";

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MousePointer2, Star, Presentation, GraduationCap, Gamepad2, LineChart, Trophy } from 'lucide-react';
import ParticleField from '@/components/ParticleField/ParticleField';

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

        {/* Interactive Particle Background */}
        <div className="absolute top-0 left-0 w-full h-full" style={{ minHeight: '100%' }}>
          <ParticleField
            particleCount={800}
            particleColor="rgba(255, 255, 255, 0.5)"
            repulsionRadius={150}
            repulsionForce={10}
          />
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

            <Link href="/login" className="flex-1">
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
                      <Image
                        src="/lesson.PNG"
                        alt="Lesson Preview"
                        fill
                        className="object-cover"
                      />
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
                      <Image
                        src="/tests.PNG"
                        alt="Test Preview"
                        fill
                        className="object-cover"
                      />
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
                      <Image
                        src="/progress.PNG"
                        alt="Progress Preview"
                        fill
                        className="object-cover"
                      />
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
      <section id="presentation" className="py-32 bg-white px-6 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[120px] -z-10 -translate-x-1/4 pointer-events-none"></div>

        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">ทำไมต้องเลือกฝึกพิมพ์กับ PIMWAI?</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">แพลตฟอร์มฝึกพิมพ์ที่ดีที่สุดสำหรับคนไทย</p>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Left: Presentation Visual (Bubble System) */}
          <div className="flex-1 w-full relative perspective-1000 order-2 lg:order-1">
            {/* Central Image Container */}
            <div className="relative z-10 w-[90%] md:w-[85%] mx-auto">
              <div className="relative rounded-xl overflow-hidden bg-white">
                <div className="relative aspect-[16/10]">
                  <img
                    src="/Demo.gif"
                    alt="Platform Demo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

            </div>

            {/* Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full -z-10"></div>
          </div>

          {/* Right: Text Description */}
          <div className="flex-1 space-y-6 text-left order-1 lg:order-2 self-center">
            <h2 className="text-4xl lg:text-5xl font-semibold text-[#5cb5db] leading-[1.1]">
              PIMWAI <br />
              <span className="text-gray-900">ระบบฝึกพิมพ์ดีด</span> <br />
              <span className="text-4xl lg:text-5xl font-semibold text-[#5cb5db] leading-[1.1]">แบบออนไลน์</span>
            </h2>

            <p className="text-lg text-gray-500 leading-relaxed max-w-lg">
              มีการพัฒนา และอัปเดตระบบตลอดอายุการใช้งาน พร้อมฟีเจอร์ใหม่ๆ ที่จะช่วยให้การฝึกพิมพ์ของคุณเป็นเรื่องง่าย และสนุกกว่าที่เคย
            </p>
          </div>

        </div>
      </section>

      {/* ================= Rank System Section ================= */}
      <section id="ranking" className="py-10 bg-white px-6 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[800px] rounded-full -z-10 translate-x-1/4 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-5 lg:gap-5">

          {/* Left: Text Description */}
          <div className="flex-1 space-y-6 text-left self-center ml-12">
            <h2 className="text-4xl lg:text-5xl font-semibold leading-[1.1]">
              ระบบแรงค์ <br />
              <span className="text-gray-900">ไต่อันดับ ท้าทายตัวเอง</span>
            </h2>

            <p className="text-lg text-gray-500 leading-relaxed max-w-lg">
              พิสูจน์ความสามารถของคุณด้วยระบบแรงค์สุดเข้มข้น ตั้งแต่ Bronze จนถึง Grandmaster ยิ่งฝึกมาก ยิ่งเก่งเร็ว และแน่นอน... ยิ่งได้โชว์แรงค์สวยๆ ให้เพื่อนอิจฉา!
            </p>

            <div className="flex flex-wrap gap-3">
              {['Bronze', 'Gold', 'Diamond'].map((rank) => (
                <span key={rank} className="px-4 py-1.5 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-600">
                  {rank}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Rank Visual */}
          <div className="flex-1 w-full relative perspective-1000">
            {/* Central Image Container */}
            <div className="relative z-10 w-[90%] md:w-[85%] mx-auto">
              <div className="relative rounded-xl overflow-hidden bg-white">
                <div className="relative aspect-[16/10]">
                  <img
                    src="/rank.PNG"
                    alt="Rank System Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-yellow-500/5 blur-3xl rounded-full -z-10"></div>
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