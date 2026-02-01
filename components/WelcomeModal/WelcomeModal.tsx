"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, ChevronRight, BookOpen, Timer, Trophy, BarChart3 } from "lucide-react";
import AppIcon from "@/app/icon.png";

interface WelcomeModalProps {
    userName?: string;
    firstLessonUrl: string;
}

const menuItems = [
    {
        icon: BookOpen,
        name: "บทเรียน",
        desc: "เริ่มฝึกพิมพ์จากพื้นฐาน ไปจนถึงขั้นสูง",
        color: "#5cb5db"
    },
    {
        icon: Timer,
        name: "ทดสอบ",
        desc: "ทดสอบความเร็วและความแม่นยำ",
        color: "#5cb5db"
    },
    {
        icon: Trophy,
        name: "อันดับ",
        desc: "ดูอันดับเทียบกับผู้เล่นคนอื่น",
        color: "#5cb5db"
    },
    {
        icon: BarChart3,
        name: "สรุปผลรวม",
        desc: "ติดตามพัฒนาการของคุณ",
        color: "#5cb5db"
    }
];

export default function WelcomeModal({ userName, firstLessonUrl }: WelcomeModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleStart = () => {
        router.push(firstLessonUrl);
    };

    const handleSkip = () => {
        setIsVisible(false);
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] transition-opacity duration-400 ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={handleSkip}
            />

            {/* Modal */}
            <div
                className={`fixed top-1/2 left-1/2 z-[1000] w-[90%] max-w-2xl
          bg-white rounded-3xl p-8 text-gray-900
          shadow-2xl border border-gray-200
          transition-all duration-500
          ${isVisible
                        ? "opacity-100 -translate-x-1/2 -translate-y-1/2 scale-100"
                        : "opacity-0 -translate-x-1/2 -translate-y-[40%] scale-95 pointer-events-none"
                    }`}
            >
                {/* Close Button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Image
                        src={AppIcon}
                        alt="PimWai Logo"
                        width={48}
                        height={48}
                        className="drop-shadow-lg"
                        priority
                    />
                    <div>
                        {userName && (
                            <p className="text-[#5cb5db] text-sm font-medium">
                                สวัสดี, {userName}
                            </p>
                        )}
                        <h1 className="text-xl font-bold">
                            ยินดีต้อนรับสู่ <span className="text-[#5cb5db]">PIMWAI</span>
                        </h1>
                    </div>
                </div>

                {/* Menu Guide */}
                <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-3">มาดูกันว่ามีอะไรบ้าง</p>
                    <div className="grid grid-cols-2 gap-3">
                        {menuItems.map((item) => (
                            <div
                                key={item.name}
                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                            >
                                <div
                                    className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                                    style={{ color: item.color }}
                                >
                                    <item.icon size={22} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Start Button */}
                <button
                    onClick={handleStart}
                    className="w-full py-3 px-6 bg-[#5cb5db] hover:bg-[#4da5cb] text-white font-bold rounded-2xl shadow-lg shadow-[#5cb5db]/25 hover:shadow-xl hover:shadow-[#5cb5db]/30 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                >
                    เริ่มบทแรกเลย
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Skip Link */}
                <button
                    onClick={handleSkip}
                    className="w-full mt-3 text-gray-400 text-sm hover:text-gray-600 hover:underline transition-all"
                >
                    ดูบทเรียนทั้งหมดก่อน
                </button>
            </div>
        </>
    );
}
