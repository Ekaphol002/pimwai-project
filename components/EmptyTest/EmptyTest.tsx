"use client";

import React from 'react';
import Link from 'next/link';
import { Timer, Play, Keyboard, Zap, Clock } from 'lucide-react';

export default function EmptyStats() {
  
  // ข้อมูลการ์ด พร้อมเพิ่มสีและไอคอนประจำการ์ด
  const timeOptions = [
    { 
        time: 1, 
        label: '1:00 Test', 
        desc: 'เริ่มต้นง่ายๆ เหมาะสำหรับวอร์มนิ้ว',
        headerColor: 'bg-teal-500',
        icon: <Zap className="text-white" size={24} />,
        accentColor: 'teal'
    },
    { 
        time: 3, 
        label: '3:00 Test', 
        desc: 'มาตรฐานการทดสอบ วัดผลได้แม่นยำ',
        headerColor: 'bg-[#5cb5db]', // สีหลักของแอป
        icon: <Keyboard className="text-white" size={24} />,
        accentColor: 'blue'
    },
    { 
        time: 5, 
        label: '5:00 Test', 
        desc: 'ทดสอบความอึดและสมาธิระยะยาว',
        headerColor: 'bg-indigo-500',
        icon: <Clock className="text-white" size={24} />,
        accentColor: 'indigo'
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      
      {/* --- ส่วนหัวข้อเชิญชวน (Hero Section) --- */}
      <div className="mb-12 text-center flex flex-col items-center">
          {/* ไอคอนตกแต่ง */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative p-4 rounded-2xl">
                <Timer size={68} className="text-[#5cb5db]" />
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4 tracking-tight">
              พร้อมทดสอบความเร็วของคุณหรือยัง?
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed max-w-2xl">
              ยังไม่มีสถิติในระบบ... มาเริ่มการทดสอบแรกเพื่อวัดระดับ WPM และความแม่นยำของคุณกันเถอะ ใช้เวลาเพียงไม่กี่นาที!
          </p>
      </div>

      {/* --- ส่วนการ์ดเลือกเวลา (Cards Grid) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {timeOptions.map((opt) => (
              <div 
                key={opt.time} 
                className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden flex flex-col"
              >
                  
                  {/* Colored Header Bar with Icon */}
                  <div className={`${opt.headerColor} p-4 flex items-center justify-center relative overflow-hidden`}>
                      {/* Decorative circle behind icon */}
                      <div className="absolute bg-white/20 w-16 h-16 rounded-full -top-4 -right-4"></div>
                      <div className="relative z-10 p-2 rounded-xl backdrop-blur-sm">
                          {opt.icon}
                      </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex flex-col flex-grow text-center items-center">
                      <h4 className="text-3xl font-black text-gray-800 mb-2 logo-font">
                        {opt.label}
                      </h4>
                      <p className="text-gray-500 text-sm mb-6 flex-grow">
                        {opt.desc}
                      </p>
                      
                      {/* ปุ่มกดเริ่ม */}
                      <Link href={`/typing-test/${opt.time}-minute`} className="w-full mt-auto">
                        <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-2 px-4 rounded-xl text-base flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow-md active:scale-95">
                            เริ่มทดสอบ <Play size={18} fill="currentColor" />
                        </button>
                      </Link>
                  </div>
              </div>
          ))}
      </div>

      {/* Footer Encouragement */}
      <p className="text-center text-gray-400 text-sm mt-12">
        Tip: สำหรับการประเมินผลที่แม่นยำที่สุด แนะนำให้เริ่มจากแบบทดสอบ 3 นาที
      </p>

    </div>
  );
}