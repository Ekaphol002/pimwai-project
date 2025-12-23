"use client";
import React from 'react';
import { Star, ChevronRight, Zap, Target, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';

const secToTime = (totalSec: number) => {
    if (!totalSec) return "0:00";
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

interface LessonData {
    id: string;
    title: string;
    level: string | number;
    completedCount: number;
    totalSubLessons: number;
    avgSpeed: number;
    avgAcc: number;
    time: number;
    stars: number;
}

interface Props {
    data?: LessonData[];
}

export default function LessonList({ data = [] }: Props) {
    
    // console.log("DATA ที่ได้รับ:", data);

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center text-gray-400">
                <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-lg font-bold">ไม่พบข้อมูลบทเรียน</p>
            </div>
        );
    }

    const normalize = (val: any) => String(val || '').toLowerCase().trim();

    const beginnerData = data.filter(l => { const lvl = normalize(l.level); return lvl === 'beginner' || lvl === '1'; });
    const intermediateData = data.filter(l => { const lvl = normalize(l.level); return lvl === 'intermediate' || lvl === '2'; });
    const advancedData = data.filter(l => { const lvl = normalize(l.level); return lvl === 'advanced' || lvl === '3'; });
    
    const otherData = data.filter(l => !beginnerData.includes(l) && !intermediateData.includes(l) && !advancedData.includes(l));

    const ALL_SECTIONS = [
        { title: "ระดับเริ่มต้น (Beginner)", data: beginnerData, color: "bg-[#5cb5db]" },
        { title: "ระดับกลาง (Intermediate)", data: intermediateData, color: "bg-orange-400" },
        { title: "ระดับสูง (Advanced)", data: advancedData, color: "bg-red-500" },
        { title: "อื่นๆ (Uncategorized)", data: otherData, color: "bg-gray-500" },
    ];

    return (
        <div className="space-y-8">
            {ALL_SECTIONS.map((section, idx) => {
                if (section.data.length === 0) return null;

                let totalWPM = 0, totalAcc = 0, totalSeconds = 0, countStarted = 0;

                section.data.forEach(lesson => {
                    if (lesson.avgSpeed > 0 || lesson.avgAcc > 0 || lesson.time > 0) {
                        totalWPM += lesson.avgSpeed;
                        totalAcc += lesson.avgAcc;
                        totalSeconds += lesson.time;
                        countStarted++;
                    }
                });

                const avgCatWPM = countStarted > 0 ? Math.round(totalWPM / countStarted) : 0;
                const avgCatAcc = countStarted > 0 ? Math.round(totalAcc / countStarted) : 0;
                const totalCatTime = secToTime(totalSeconds);

                return (
                    <div key={idx} className={`${section.color} rounded-3xl p-6 shadow-sm border border-gray-200`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                            <h3 className="text-xl font-bold text-white border-l-4 border-white pl-3">
                                {section.title}
                            </h3>
                            {countStarted > 0 && (
                                <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-xs sm:text-sm">
                                    <div className="flex items-center gap-1"><Zap size={14} className="text-yellow-300" /><span className="font-bold">AVG {avgCatWPM}</span></div>
                                    <div className="w-[1px] h-3 bg-white/40"></div>
                                    <div className="flex items-center gap-1"><Target size={14} className="text-red-300" /><span className="font-bold">AVG {avgCatAcc}%</span></div>
                                    <div className="w-[1px] h-3 bg-white/40"></div>
                                    <div className="flex items-center gap-1"><Clock size={14} className="text-blue-200" /><span>{totalCatTime}</span></div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            {section.data.map((lesson) => {
                                const completedSubLessons = lesson.completedCount;
                                // ⚠️ ถ้าข้อมูลมาผิด ให้ default เป็น 10 ด่าน (จะได้เห็น 10 ช่อง)
                                const totalSubLessons = lesson.totalSubLessons > 0 ? lesson.totalSubLessons : 10; 
                                
                                const progressPercent = totalSubLessons > 0 ? (completedSubLessons / totalSubLessons) * 100 : 0;
                                const starsEarned = lesson.stars;
                                // ✅ คำนวณดาวเต็ม: (จำนวนด่าน x 3 ดาวต่อด่าน)
                                const maxStars = totalSubLessons * 3;

                                const formattedTime = secToTime(lesson.time);
                                const isCompleted = progressPercent === 100;
                                const isStarted = completedSubLessons > 0;

                                return (
                                    // ✅ 3. แก้ Link ให้ไปหน้า /lessons
                                    <Link key={lesson.id} href="/lessons" className="block">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group cursor-pointer border border-transparent hover:border-blue-200">
                                            
                                            <div className="flex-1 sm:flex-none sm:w-1/2 mr-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-bold text-gray-700 truncate">{lesson.title}</h4>
                                                    {isCompleted && (
                                                        <span className="text-[10px] bg-[#b4db9b] text-green-600 px-2 py-0.5 rounded-full font-bold shrink-0">Completed</span>
                                                    )}
                                                </div>

                                                {/* ✅ 1. แก้หลอด Progress (แบ่งเส้นตามจำนวนด่านจริง หรือ 10 ช่อง) */}
                                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden relative">
                                                    <div className="absolute inset-0 pointer-events-none z-10">
                                                        {/* วนลูปสร้างเส้นแบ่งตามจำนวนด่าน (ถ้ามี 10 ด่าน ก็แบ่ง 10 ช่อง) */}
                                                        {Array.from({ length: totalSubLessons - 1 }).map((_, i) => (
                                                            <div 
                                                                key={i} 
                                                                className="absolute top-0 bottom-0 w-[1px] bg-white/80" 
                                                                style={{ left: `${((i + 1) / totalSubLessons) * 100}%` }} 
                                                            />
                                                        ))}
                                                    </div>
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 relative z-0 ${isCompleted ? 'bg-[#71b16b]' : 'bg-[#5cb5db]'}`}
                                                        style={{ width: `${progressPercent}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                                    <span>ด่านที่ {completedSubLessons}/{totalSubLessons}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 sm:gap-5 text-sm">
                                                {isStarted ? (
                                                    <>
                                                        <div className="text-center hidden sm:block">
                                                            <div className="font-bold text-gray-700">{lesson.avgSpeed}</div>
                                                            <div className="text-[10px] text-gray-400">WPM</div>
                                                        </div>
                                                        <div className="text-center hidden sm:block">
                                                            <div className="font-bold text-gray-700">{lesson.avgAcc}%</div>
                                                            <div className="text-[10px] text-gray-400">Acc</div>
                                                        </div>
                                                        <div className="text-center hidden sm:block">
                                                            <div className="font-bold text-gray-700">{formattedTime}</div>
                                                            <div className="text-[10px] text-gray-400">Time</div>
                                                        </div>
                                                        
                                                        {/* ✅ 2. แก้ดาวเต็มให้ถูกต้อง (ตามจำนวนด่าน * 3) */}
                                                        <div className="flex items-center gap-1 text-yellow-400 px-2 py-1 rounded-lg">
                                                            <Star fill="currentColor" size={14} />
                                                            <span className="font-bold text-gray-600 text-[16px]">
                                                                {starsEarned}<span className="text-gray-400 text-xs">/{maxStars}</span>
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400 text-xs font-medium px-2">ยังไม่เริ่ม</span>
                                                )}
                                                <div className="p-2 bg-white rounded-full shadow-sm text-gray-400 group-hover:text-[#5cb5db]">
                                                    <ChevronRight size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}