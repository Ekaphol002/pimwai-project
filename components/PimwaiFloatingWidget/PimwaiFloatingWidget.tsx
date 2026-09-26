"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    X,
    Sparkles,
    Trophy,
    Gamepad2,
    BookOpen
} from 'lucide-react';

export default function PimwaiFloatingWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [activeTab, setActiveTab] = useState<'curriculum' | 'ranks' | 'farm'>('curriculum');

    // ตรวจสอบสถานะการปิดซ่อน และเปิดรับ Event จากส่วนอื่นๆ ของเว็บ (เช่น เมนู Navbar)
    useEffect(() => {
        try {
            const isDismissed = sessionStorage.getItem('pimwai_news_widget_dismissed');
            if (isDismissed === 'true') {
                setIsVisible(false);
            }
        } catch (e) { }

        const handleOpenEvent = () => {
            setIsOpen(true);
        };

        window.addEventListener('open-pimwai-news', handleOpenEvent);
        return () => {
            window.removeEventListener('open-pimwai-news', handleOpenEvent);
        };
    }, []);

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsVisible(false);
        try {
            sessionStorage.setItem('pimwai_news_widget_dismissed', 'true');
        } catch (e) { }
    };

    return (
        <>
            {/* 🌟 Floating Pill Capsule Button (มุมขวาล่าง) - แสดงเฉพาะเมื่อยังไม่ถูกกดปิด */}
            {isVisible && (
                <div className="fixed bottom-6 right-6 z-40 group select-none animate-in fade-in duration-300">
                    <div className="relative flex items-center">

                        {/* ปุ่มแคปซูลหลัก ข่าวสาร & คู่มือ */}
                        <button
                            type="button"
                            onClick={() => setIsOpen(true)}
                            className="flex items-center gap-2 pl-3 pr-3.5 py-2 bg-white/95 hover:bg-white text-gray-700 rounded-full shadow-lg shadow-gray-400/15 hover:shadow-xl hover:shadow-[#5cb5db]/20 border border-gray-200/90 hover:border-[#5cb5db]/50 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
                            title="คลิกเพื่อดู ข่าวสาร & คู่มือ"
                        >
                            {/* Logo Image */}
                            <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                                <Image
                                    src="/logo.png"
                                    alt="PIMWAI Logo"
                                    width={20}
                                    height={20}
                                    className="object-contain drop-shadow-2xs"
                                    onError={(e) => {
                                        e.currentTarget.srcset = "/logopimwai.png";
                                    }}
                                />
                            </div>

                            {/* Text */}
                            <span className="text-xs sm:text-sm font-bold text-gray-700 tracking-tight leading-none whitespace-nowrap">
                                ข่าวสาร & คู่มือ
                            </span>
                        </button>

                        {/* ✕ ปุ่มกาปิดออก (กดแล้วปุ่มจะหายไปทันที) */}
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md z-10 cursor-pointer"
                            title="ปิดซ่อนปุ่มนี้"
                            aria-label="ปิดซ่อน"
                        >
                            <X size={11} />
                        </button>

                        {/* 🔴 จุดสีแดงแจ้งเตือน */}
                        <span className="absolute -top-1 -left-1 flex h-3.5 w-3.5 pointer-events-none">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 shadow-xs" />
                        </span>

                    </div>
                </div>
            )}

            {/* 📖 Popup Modal: ข่าวสาร อัปเดตแรงค์ 4-7 & คู่มือโหมดฟาร์ม (เปิดได้ตลอดเวลาแม้ปุ่มลอยจะปิดไปแล้ว) */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none">
                    <div
                        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-150 max-h-[88vh] flex flex-col overflow-hidden"
                    >
                        {/* Modal Header */}
                        <div className="p-5 pb-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-sky-50/40">
                            <div className="flex items-center gap-3">
                                <div className="relative w-11 h-11 rounded-2xl p-1.5 flex items-center justify-center">
                                    <Image
                                        src="/logo.png"
                                        alt="PIMWAI Logo"
                                        width={38}
                                        height={38}
                                        className="object-contain drop-shadow-xs"
                                        onError={(e) => {
                                            e.currentTarget.srcset = "/logopimwai.png";
                                        }}
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base sm:text-lg font-black text-gray-800 logo-font">
                                            ข่าวสาร & คู่มือระบบใหม่
                                        </h3>
                                        <span className="px-2 py-0.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-black rounded-full shadow-xs">
                                            อัปเดตใหม่
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                                        สรุปข้อมูลบทเรียนใหม่ 210 ด่าน, ระบบแรงค์ 4-7 และคู่มือพิมพ์ด่วน
                                    </p>
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                                aria-label="ปิดหน้าต่าง"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Tab Navigation - ซ่อน scrollbar และแบ่งสัดส่วนเต็มแถวพอดี */}
                        <div className="grid grid-cols-3 gap-1 px-5 pt-3 border-b border-gray-100 bg-gray-50/70">
                            <button
                                type="button"
                                onClick={() => setActiveTab('curriculum')}
                                className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition-all cursor-pointer border-b-2 text-center ${activeTab === 'curriculum'
                                    ? 'bg-white text-indigo-600 border-indigo-600 shadow-xs'
                                    : 'text-gray-500 hover:text-gray-800 border-transparent hover:bg-gray-100/60'
                                    }`}
                            >
                                <BookOpen size={15} className="shrink-0" />
                                <span className="truncate">บทเรียนใหม่ 210 ด่าน</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('ranks')}
                                className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition-all cursor-pointer border-b-2 text-center ${activeTab === 'ranks'
                                    ? 'bg-white text-[#5cb5db] border-[#5cb5db] shadow-xs'
                                    : 'text-gray-500 hover:text-gray-800 border-transparent hover:bg-gray-100/60'
                                    }`}
                            >
                                <Trophy size={15} className="shrink-0" />
                                <span className="truncate">แรงค์ใหม่ 4 - 7</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('farm')}
                                className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition-all cursor-pointer border-b-2 text-center ${activeTab === 'farm'
                                    ? 'bg-white text-emerald-600 border-emerald-500 shadow-xs'
                                    : 'text-gray-500 hover:text-gray-800 border-transparent hover:bg-gray-100/60'
                                    }`}
                            >
                                <Gamepad2 size={15} className="shrink-0" />
                                <span className="truncate">วิธีเล่นโหมดพิมพ์ด่วน</span>
                            </button>
                        </div>

                        {/* Modal Content Area (Scrollable Text-focused) */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-gray-700 max-h-[calc(88vh-130px)] no-scrollbar">

                            {/* ============================================================ */}
                            {/* TAB 0: 📚 อัปเดตใหญ่บทเรียนพิมพ์สัมผัส 21 บท 210 ด่าน */}
                            {/* ============================================================ */}
                            {activeTab === 'curriculum' && (
                                <div className="space-y-4 animate-in fade-in duration-150 text-xs sm:text-sm leading-relaxed">
                                    {/* หัวข้อนำเสนอ คลีน โมเดิร์น ไม่เอากล่องทึบ */}
                                    <div className="pb-1 border-b border-gray-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600">
                                                <Sparkles size={14} />
                                            </span>
                                            <h4 className="text-base font-black text-gray-800 tracking-tight">
                                                ปรับปรุงเนื้อหาบทเรียนใหม่ครบทุกระดับ (Total Remaster)
                                            </h4>
                                        </div>
                                        <p className="text-gray-600 text-xs sm:text-sm leading-normal pl-8">
                                            อัปเดตบทเรียนพิมพ์สัมผัสภาษาไทยใหม่ทั้งหมด 21 บทเรียน รวม 210 ด่านย่อย เปลี่ยนจากคำสุ่มผสมที่ไม่มีความหมาย มาเป็น <strong>คำศัพท์จริงและประโยคที่มีความหมายต่อเนื่อง 100%</strong> เพื่อให้พิมพ์สนุก จำแป้นได้คล่องมือ และนำไปใช้งานจริงได้ทันที
                                        </p>
                                    </div>

                                    {/* รายละเอียด 3 ระดับ แบบเรียบหรู คลีน ไม่ใส่กล่อง */}
                                    <div className="space-y-3 pl-2">
                                        <div className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center mt-0.5">
                                                1
                                            </span>
                                            <div>
                                                <span className="font-bold text-gray-800 text-sm">ระดับเริ่มต้น (Beginner 70 ด่าน)</span>
                                                <p className="text-gray-500 text-xs mt-0.5">
                                                    เน้นแป้นเหย้าและแถวบน ฝึกสเต็ปสองมือประสาน เคาะคำศัพท์จริงใกล้ตัวโดยไม่มองแป้น
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center mt-0.5">
                                                2
                                            </span>
                                            <div>
                                                <span className="font-bold text-gray-800 text-sm">ระดับกลาง (Intermediate 70 ด่าน)</span>
                                                <p className="text-gray-500 text-xs mt-0.5">
                                                    ก้าวนิ้วลงแถวล่างและสลับนิ้วก้อยอย่างแม่นยำ พร้อมฝึกพิมพ์วลีและการเชื่อมคำเร็ว
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center mt-0.5">
                                                3
                                            </span>
                                            <div>
                                                <span className="font-bold text-gray-800 text-sm">ระดับสูง (Advanced 70 ด่าน)</span>
                                                <p className="text-gray-500 text-xs mt-0.5">
                                                    คำไทยใช้บ่อย เครื่องหมายวรรคตอน สปีดคอมโบ และบทความยาวฝึกพิมพ์ความเร็วสูง
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* หมายเหตุเรื่องความก้าวหน้าเดิม (แบบข้อความเน้น ไม่เป็นกล่องหนา) */}
                                    <div className="pt-2 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-600">
                                        <span className="text-emerald-600 font-bold">✓ สถิติเดิมคงอยู่ครบ:</span>
                                        <span>ด่านที่เคยผ่านแล้วยังคงผ่านตามเดิม ดาวและคะแนนไม่หาย สามารถเข้าเล่นเพื่อสัมผัสเนื้อหาชุดใหม่ได้เลย</span>
                                    </div>
                                </div>
                            )}

                            {/* ============================================================ */}
                            {/* TAB 1: 🏆 เพิ่มแรงค์ใหม่ 4, 5, 6, 7 (NEW RANKS) */}
                            {/* ============================================================ */}
                            {activeTab === 'ranks' && (
                                <div className="space-y-4 animate-in fade-in duration-150 text-xs sm:text-sm">
                                    {/* Header Text ไม่เอากล่องทึบ */}
                                    <div className="pb-1 border-b border-gray-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-sky-50 text-[#5cb5db]">
                                                <Trophy size={14} />
                                            </span>
                                            <h4 className="text-base font-black text-gray-800 tracking-tight">
                                                ระบบแรงค์ใหม่สูงสุดถึง Rank 7
                                            </h4>
                                        </div>
                                        <p className="text-gray-600 text-xs sm:text-sm leading-normal pl-8">
                                            ปลดล็อก 4 ขั้นแรงค์ระดับตำนานสำหรับผู้เล่นสายแข่งขัน ยิ่งระดับสูงขึ้น ยิ่งได้รับ <strong>ตัวคูณ EXP พื้นฐาน</strong> และ <strong>เพดานตัวคูณคอมโบ</strong> สูงขึ้นแบบก้าวกระโดด
                                        </p>
                                    </div>

                                    {/* รายการแรงค์ 4-7 แบบคลีน สบายตา ไม่มีกรอบกล่องหนา */}
                                    <div className="space-y-3.5 divide-y divide-gray-100">

                                        {/* Rank 4 */}
                                        <div className="pt-2 first:pt-0 flex items-center gap-3.5">
                                            <div className="w-12 h-12 relative shrink-0 flex items-center justify-center">
                                                <Image
                                                    src="/Rank4.png"
                                                    alt="Rank 4"
                                                    width={46}
                                                    height={46}
                                                    className="object-contain drop-shadow-xs"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 text-xs">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-slate-800 text-sm">
                                                        Rank 4: Obsidian Titan
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-slate-500">
                                                        (ผู้พิทักษ์ศิลาเงิน)
                                                    </span>
                                                </div>
                                                <p className="text-gray-500 mt-0.5 leading-relaxed">
                                                    EXP 24k - 54k (5,000 XP/ดาว) • <span className="text-slate-700 font-semibold">ตัวคูณพื้นฐาน x2.00 | เพดานคอมโบ x6.0</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Rank 5 */}
                                        <div className="pt-3 flex items-center gap-3.5">
                                            <div className="w-12 h-12 relative shrink-0 flex items-center justify-center">
                                                <Image
                                                    src="/Rank5.png"
                                                    alt="Rank 5"
                                                    width={46}
                                                    height={46}
                                                    className="object-contain drop-shadow-xs"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 text-xs">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-emerald-900 text-sm">
                                                        Rank 5: Venom Sorcerer
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-emerald-600">
                                                        (จอมเวทโอสถพิษ)
                                                    </span>
                                                </div>
                                                <p className="text-gray-500 mt-0.5 leading-relaxed">
                                                    EXP 54k - 114k (10,000 XP/ดาว) • <span className="text-emerald-700 font-semibold">ตัวคูณพื้นฐาน x2.50 | เพดานคอมโบ x8.0</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Rank 6 */}
                                        <div className="pt-3 flex items-center gap-3.5">
                                            <div className="w-12 h-12 relative shrink-0 flex items-center justify-center">
                                                <Image
                                                    src="/Rank6.png"
                                                    alt="Rank 6"
                                                    width={46}
                                                    height={46}
                                                    className="object-contain drop-shadow-xs"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 text-xs">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-rose-900 text-sm">
                                                        Rank 6: Crimson Overlord
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-rose-600">
                                                        (จอมทัพเพลิงทับทิม)
                                                    </span>
                                                </div>
                                                <p className="text-gray-500 mt-0.5 leading-relaxed">
                                                    EXP 114k - 234k (20,000 XP/ดาว) • <span className="text-rose-700 font-semibold">ตัวคูณพื้นฐาน x3.00 | เพดานคอมโบ x10.0</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Rank 7 */}
                                        <div className="pt-3 flex items-center gap-3.5">
                                            <div className="w-12 h-12 relative shrink-0 flex items-center justify-center">
                                                <Image
                                                    src="/Rank7.png"
                                                    alt="Rank 7"
                                                    width={46}
                                                    height={46}
                                                    className="object-contain drop-shadow-xs"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 text-xs">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-purple-950 text-sm">
                                                        Rank 7: Cosmic Astra
                                                    </span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                                        👑 TOP 10 เท่านั้น
                                                    </span>
                                                </div>
                                                <p className="text-gray-500 mt-0.5 leading-relaxed">
                                                    EXP 234,000+ และติด TOP 10 • <span className="text-purple-700 font-bold">ตัวคูณพื้นฐาน x4.00 | เพดานคอมโบ x12.0</span>
                                                </p>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Star explanation */}
                                    <div className="pt-2 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                                        <span className="text-amber-500 font-bold">⭐ ระบบดาว:</span>
                                        <span>ทุก 1 ดาวที่เพิ่มขึ้น จะบวกตัวคูณพื้นฐานเพิ่มขึ้น <strong>+0.05x</strong> ต่อดาว</span>
                                    </div>
                                </div>
                            )}

                            {/* ============================================================ */}
                            {/* TAB 2: 🌾 วิธีเล่นโหมดฟาร์มเวล (FARM MODE GUIDE) */}
                            {/* ============================================================ */}
                            {activeTab === 'farm' && (
                                <div className="space-y-4 animate-in fade-in duration-150 text-xs sm:text-sm">
                                    {/* Header */}
                                    <div className="pb-1 border-b border-gray-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600">
                                                <Gamepad2 size={14} />
                                            </span>
                                            <h4 className="text-base font-black text-gray-800 tracking-tight">
                                                คู่มือและเคล็ดลับการเล่นโหมดพิมพ์ด่วน (Farm)
                                            </h4>
                                        </div>
                                        <p className="text-gray-600 text-xs sm:text-sm leading-normal pl-8">
                                            โหมดฝึกซ้อมอิสระที่เน้นความสนุก ความลื่นไหล และรับ EXP มหาศาลตามความเร็วและความแม่นยำ
                                        </p>
                                    </div>

                                    {/* รายละเอียด 4 หัวข้อ แบบคลีน ลิสต์เรียบหรู ไม่เอากล่องทึบ */}
                                    <div className="space-y-3.5 pl-2">
                                        <div>
                                            <h5 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                1. รูปแบบโหมดที่เลือกเล่นได้
                                            </h5>
                                            <p className="text-gray-500 text-xs mt-1 pl-3.5 leading-relaxed">
                                                • <strong>Zen Mode:</strong> พิมพ์อิสระเรื่อยๆ ไม่จำกัดเวลา รับ EXP ตามจำนวนคำที่เคาะ<br />
                                                • <strong>Words Mode:</strong> เลือกพิมพ์ 10, 25, 50, หรือ 100 คำ จบรอบไวพร้อมรับโบนัสจบเซ็ต<br />
                                                • <strong>Time Mode:</strong> ท้าทายความเร็ว 15, 30, 60, หรือ 120 วินาที วัด WPM สูงสุด
                                            </p>
                                        </div>

                                        <div>
                                            <h5 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                2. การสะสมคอมโบ & ตัวคูณ EXP
                                            </h5>
                                            <p className="text-gray-500 text-xs mt-1 pl-3.5 leading-relaxed">
                                                • พิมพ์ถูกต้องต่อเนื่องเพื่อเร่งตัวคูณคอมโบให้สูงขึ้น ยิ่งคอมโบเยอะแต้มยิ่งพุ่ง<br />
                                                • <strong>คำทองคำ (Golden Words):</strong> สุ่มคำสีทอง พิมพ์จบรับโบนัสทันที <strong>+30 EXP</strong><br />
                                                • <strong>Fever Mode:</strong> ครบ 50 คอมโบติดกัน เข้าสู่โหมดฟีเวอร์ <strong>รับ EXP x2 ทันที</strong>
                                            </p>
                                        </div>

                                        <div>
                                            <h5 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                3. บัฟพิเศษที่ได้จากบทเรียน
                                            </h5>
                                            <p className="text-gray-500 text-xs mt-1 pl-3.5 leading-relaxed">
                                                • <strong>ผ่านระดับเริ่มต้น:</strong> รับเกราะกันพลาด 2 ครั้ง ป้องกันคอมโบหลุด<br />
                                                • <strong>ผ่านระดับกลาง:</strong> เพิ่มโอกาสสุ่มพบคำทองคำโบนัส 15%<br />
                                                • <strong>ผ่านระดับสูง:</strong> ได้รับตัวคูณถาวร +0.5x และปลดล็อกโหมด Fever x2
                                            </p>
                                        </div>

                                        <div>
                                            <h5 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                4. ซิงค์เควสและสตรีคประจำวัน
                                            </h5>
                                            <p className="text-gray-500 text-xs mt-1 pl-3.5 leading-relaxed">
                                                ทุกนาทีและทุกรอบที่เล่นในโหมดฟาร์มจะถูกนับรวมเข้า <strong>เควสประจำวัน</strong> และช่วยรักษาระดับ <strong>สตรีคไฟประจำวัน</strong> ให้อัตโนมัติ
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-6 py-2 bg-[#5cb5db] hover:bg-[#4ba3c9] text-white font-bold text-xs rounded-2xl shadow-xs transition cursor-pointer"
                            >
                                เข้าใจแล้ว ปิดหน้าต่าง
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
