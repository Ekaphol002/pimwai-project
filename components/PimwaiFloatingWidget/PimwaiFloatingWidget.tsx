"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    X,
    Sparkles,
    Trophy,
    Gamepad2
} from 'lucide-react';

export default function PimwaiFloatingWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [activeTab, setActiveTab] = useState<'ranks' | 'farm'>('ranks');

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
                        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-150 max-h-[88vh] flex flex-col overflow-hidden"
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
                                        สรุปข้อมูลแรงค์ใหม่ 4-7 และวิธีเล่นโหมดฟาร์มเวล
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

                        {/* Modal Tab Navigation */}
                        <div className="flex items-center gap-2 px-5 pt-3 border-b border-gray-100 bg-gray-50/70">
                            <button
                                type="button"
                                onClick={() => setActiveTab('ranks')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition-all cursor-pointer border-b-2 ${activeTab === 'ranks'
                                    ? 'bg-white text-[#5cb5db] border-[#5cb5db] shadow-xs'
                                    : 'text-gray-500 hover:text-gray-800 border-transparent hover:bg-gray-100/60'
                                    }`}
                            >
                                <Trophy size={16} />
                                <span>เพิ่มแรงค์ใหม่ 4, 5, 6, 7</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('farm')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition-all cursor-pointer border-b-2 ${activeTab === 'farm'
                                    ? 'bg-white text-emerald-600 border-emerald-500 shadow-xs'
                                    : 'text-gray-500 hover:text-gray-800 border-transparent hover:bg-gray-100/60'
                                    }`}
                            >
                                <Gamepad2 size={16} />
                                <span>วิธีเล่นโหมดพิมพ์ด่วน</span>
                            </button>
                        </div>

                        {/* Modal Content Area (Scrollable Text-focused) */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-gray-700 max-h-[calc(88vh-130px)]">

                            {/* ============================================================ */}
                            {/* TAB 1: 🏆 เพิ่มแรงค์ใหม่ 4, 5, 6, 7 (NEW RANKS) */}
                            {/* ============================================================ */}
                            {activeTab === 'ranks' && (
                                <div className="space-y-3.5 animate-in fade-in duration-150">
                                    <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3.5 text-xs text-sky-900 leading-relaxed">
                                        <div className="font-bold flex items-center gap-1.5 text-sky-800 mb-1">
                                            <Sparkles size={14} className="text-sky-600" />
                                            <span>ระบบแรงค์ใหม่สูงสุดถึง Rank 7</span>
                                        </div>
                                        เพิ่ม 4 ระดับแรงค์ใหม่สำหรับผู้เล่นขั้นสูง ยิ่งแรงค์สูง ยิ่งได้ตัวคูณ EXP พื้นฐานและเพดานตัวคูณคอมโบสูงขึ้น
                                    </div>

                                    {/* List of New Ranks (Rank 4, 5, 6, 7) */}
                                    <div className="space-y-3">

                                        {/* Rank 4 */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3.5 hover:bg-slate-100/70 transition-colors">
                                            <div className="w-14 h-14 relative shrink-0 bg-white rounded-xl p-1 shadow-xs border border-slate-200 flex items-center justify-center">
                                                <Image
                                                    src="/Rank4.png"
                                                    alt="Rank 4"
                                                    width={50}
                                                    height={50}
                                                    className="object-contain"
                                                />
                                            </div>
                                            <div className="flex-1 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-slate-800 text-sm">
                                                        Rank 4: Obsidian Titan
                                                    </span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
                                                        ผู้พิทักษ์ศิลาเงิน
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mt-1 leading-normal">
                                                    • <strong>EXP สะสม:</strong> 24,000 - 54,000 XP (5,000 XP ต่อดาว)<br />
                                                    • <strong>สิทธิประโยชน์:</strong> ตัวคูณพื้นฐาน x2.00 | เพดานตัวคูณสูงสุด x6.0
                                                </p>
                                            </div>
                                        </div>

                                        {/* Rank 5 */}
                                        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3.5 hover:bg-emerald-50 transition-colors">
                                            <div className="w-14 h-14 relative shrink-0 bg-white rounded-xl p-1 shadow-xs border border-emerald-200 flex items-center justify-center">
                                                <Image
                                                    src="/Rank5.png"
                                                    alt="Rank 5"
                                                    width={50}
                                                    height={50}
                                                    className="object-contain"
                                                />
                                            </div>
                                            <div className="flex-1 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-emerald-900 text-sm">
                                                        Rank 5: Venom Sorcerer
                                                    </span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                                                        จอมเวทโอสถพิษ
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mt-1 leading-normal">
                                                    • <strong>EXP สะสม:</strong> 54,000 - 114,000 XP (10,000 XP ต่อดาว)<br />
                                                    • <strong>สิทธิประโยชน์:</strong> ตัวคูณพื้นฐาน x2.50 | เพดานตัวคูณสูงสุด x8.0
                                                </p>
                                            </div>
                                        </div>

                                        {/* Rank 6 */}
                                        <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-3.5 flex items-center gap-3.5 hover:bg-rose-50 transition-colors">
                                            <div className="w-14 h-14 relative shrink-0 bg-white rounded-xl p-1 shadow-xs border border-rose-200 flex items-center justify-center">
                                                <Image
                                                    src="/Rank6.png"
                                                    alt="Rank 6"
                                                    width={50}
                                                    height={50}
                                                    className="object-contain"
                                                />
                                            </div>
                                            <div className="flex-1 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-rose-900 text-sm">
                                                        Rank 6: Crimson Overlord
                                                    </span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full">
                                                        จอมทัพเพลิงทับทิม
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mt-1 leading-normal">
                                                    • <strong>EXP สะสม:</strong> 114,000 - 234,000 XP (20,000 XP ต่อดาว)<br />
                                                    • <strong>สิทธิประโยชน์:</strong> ตัวคูณพื้นฐาน x3.00 | เพดานตัวคูณสูงสุด x10.0
                                                </p>
                                            </div>
                                        </div>

                                        {/* Rank 7 */}
                                        <div className="bg-purple-50/70 border-2 border-purple-200 rounded-2xl p-3.5 flex items-center gap-3.5 hover:bg-purple-50 transition-colors">
                                            <div className="w-14 h-14 relative shrink-0 bg-white rounded-xl p-1 shadow-xs border border-purple-200 flex items-center justify-center">
                                                <Image
                                                    src="/Rank7.png"
                                                    alt="Rank 7"
                                                    width={50}
                                                    height={50}
                                                    className="object-contain"
                                                />
                                            </div>
                                            <div className="flex-1 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-purple-950 text-sm">
                                                        Rank 7: Cosmic Astra
                                                    </span>
                                                    <span className="text-[10px] font-black px-2 py-0.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full shadow-xs">
                                                        👑 TOP 10 เท่านั้น
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mt-1 leading-normal">
                                                    • <strong>เงื่อนไข:</strong> EXP 234,000+ และต้องติด <strong>TOP 10 เซิร์ฟเวอร์</strong><br />
                                                    • <strong>สิทธิประโยชน์:</strong> ตัวคูณพื้นฐาน x4.00 | เพดานตัวคูณสูงสุด x12.0
                                                </p>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Star explanation */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-600">
                                        <p className="leading-relaxed">
                                            ⭐ <strong>ระบบดาว:</strong> ทุก 1 ดาวที่เพิ่มขึ้น จะบวกตัวคูณพื้นฐานเพิ่มขึ้น <strong>+0.05x</strong> ต่อดาว
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ============================================================ */}
                            {/* TAB 2: 🌾 วิธีเล่นโหมดฟาร์มเวล (FARM MODE GUIDE) */}
                            {/* ============================================================ */}
                            {activeTab === 'farm' && (
                                <div className="space-y-3.5 text-xs animate-in fade-in duration-150">

                                    {/* 1. เลือกโหมด */}
                                    <div className="bg-slate-50 border border-gray-200 rounded-2xl p-3.5">
                                        <h4 className="font-black text-gray-800 text-sm mb-1.5 flex items-center gap-1.5">
                                            <span>🎮 1. รูปแบบโหมดฟาร์มที่เลือกเล่นได้</span>
                                        </h4>
                                        <ul className="space-y-1 text-gray-600 pl-4 list-disc">
                                            <li><strong>Zen Mode:</strong> พิมพ์อิสระเรื่อยๆ ไม่จำกัดเวลา พิมพ์เพลินรับ EXP ตามจำนวนคำ</li>
                                            <li><strong>Words Mode:</strong> เลือกพิมพ์ 10, 25, 50, หรือ 100 คำ จบรอบไวพร้อมรับแต้มโบนัส</li>
                                            <li><strong>Time Mode:</strong> จับเวลา 15, 30, 60, หรือ 120 วินาที ท้าทายความเร็ว WPM</li>
                                        </ul>
                                    </div>

                                    {/* 2. ระบบสะสมคอมโบและตัวคูณ */}
                                    <div className="bg-slate-50 border border-gray-200 rounded-2xl p-3.5">
                                        <h4 className="font-black text-gray-800 text-sm mb-1.5 flex items-center gap-1.5">
                                            <span>⚡ 2. การสะสมคอมโบ & ตัวคูณ EXP</span>
                                        </h4>
                                        <ul className="space-y-1 text-gray-600 pl-4 list-disc">
                                            <li><strong>พิมพ์ถูกต่อเนื่อง:</strong> ทุกตัวอักษรและทุกคำที่พิมพ์ถูก จะช่วยสะสมคอมโบเร่งตัวคูณ EXP ให้พุ่งสูงขึ้น</li>
                                            <li><strong>กด Spacebar จบคำ:</strong> จะได้รับโบนัสประจำคำ ยิ่งตัวคูณสูง แต้มคำยิ่งเพิ่มขึ้น</li>
                                            <li><strong>คำทองคำ (Golden Words):</strong> สุ่มปรากฏคำสีทอง พิมพ์จบรับโบนัสทันที <strong>+30 EXP</strong></li>
                                            <li><strong>Fever Mode:</strong> เมื่อทำครบ 50 คอมโบติดกัน เข้าสู่โหมดฟีเวอร์ <strong>รับ EXP x2 ทันที</strong></li>
                                        </ul>
                                    </div>

                                    {/* 3. บัฟติดตัวจากบทเรียน */}
                                    <div className="bg-slate-50 border border-gray-200 rounded-2xl p-3.5">
                                        <h4 className="font-black text-gray-800 text-sm mb-1.5 flex items-center gap-1.5">
                                            <span>🛡️ 3. บัฟติดตัวที่ได้จากการผ่านบทเรียน</span>
                                        </h4>
                                        <ul className="space-y-1 text-gray-600 pl-4 list-disc">
                                            <li><strong>ผ่านบทเรียนระดับเริ่มต้น:</strong> ได้รับเกราะกันพลาด 2 ครั้ง ป้องกันคอมโบหลุด</li>
                                            <li><strong>ผ่านบทเรียนระดับกลาง:</strong> เพิ่มโอกาสสุ่มพบคำทองคำโบนัส 15%</li>
                                            <li><strong>ผ่านบทเรียนระดับสูง:</strong> ได้รับตัวคูณถาวร +0.5x และปลดล็อกโหมด Fever x2</li>
                                        </ul>
                                    </div>

                                    {/* 4. สตรีคและเควส */}
                                    <div className="bg-slate-50 border border-gray-200 rounded-2xl p-3.5">
                                        <h4 className="font-black text-gray-800 text-sm mb-1.5 flex items-center gap-1.5">
                                            <span>🔥 4. การซิงค์เควสรายวันและสตรีคไฟ</span>
                                        </h4>
                                        <p className="text-gray-600 leading-relaxed">
                                            ทุกการพิมพ์ในโหมดฟาร์มจะนำไปคำนวณและซิงค์เข้ากับ <strong>เควสรายวัน</strong> และช่วยรักษาระดับ <strong>สตรีคไฟประจำวัน</strong> ให้อัตโนมัติ ไม่ต้องกลัวสตรีคหลุด
                                        </p>
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
