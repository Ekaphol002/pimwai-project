"use client";

import React, { useState, useEffect } from 'react';
import { Zap, Target, Clock, Star, Sparkles, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import StickyNavbar from '@/components/StickyNavbar/StickyNavbar';
import StatCard from '@/components/ProgressStatCard/ProgressStatCard';
import LessonList from '@/components/ProgressList/ProgressList';
import ActivityGraph from '@/components/ActivityGraph/ActivityGraph';
import RecentActivityWidget from '@/components/RecentActivityWidget/RecentActivityWidget';

export default function ProgressPage() {
    const [stats, setStats] = useState({
        totalStars: 0,
        avgSpeed: 0,
        avgAccuracy: 0,
        timeSpent: "--",
        farmTimeSpent: "--"
    });
    const [activityDates, setActivityDates] = useState<string[]>([]);
    const [dailyStats, setDailyStats] = useState<Record<string, { wpm: number; accuracy: number; duration: number }>>({});
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [courseProgress, setCourseProgress] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/progress');
                const data = await res.json();
                if (data.success) {
                    setStats(data.stats);
                    setActivityDates(data.activityDates);
                    if (data.dailyStats) setDailyStats(data.dailyStats);
                    setRecentActivity(data.recentActivity);
                    setCourseProgress(data.courseProgress);
                }
            } catch (error) {
                console.error("Failed to load progress:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const renderStat = (value: any) => {
        if (!value || value === 0 || value === "0") return "--";
        return value;
    };

    // โครงหน้า Skeleton ตรงตามองค์ประกอบของหน้าสรุปผลรวมทุกจุด
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
                <StickyNavbar />

                <main className="flex-grow w-full max-w-6xl mx-auto px-6 pt-8 pb-10">
                    {/* Header */}
                    <div className="mb-8 pb-6 border-b-1 border-gray-400">
                        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
                            ผลการฝึกฝนของคุณ
                        </h1>
                        <p className="text-gray-500 mt-1">ดูพัฒนาการและสถิติทั้งหมดได้ที่นี่</p>
                    </div>

                    {/* 1. Stats Grid (5 การ์ดพร้อมไอคอนและชื่อหัวข้อจริง) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
                        {[
                            { icon: <Star className="text-yellow-500 fill-yellow-500" size={40} />, label: "ดาวทั้งหมด" },
                            { icon: <Zap className="text-blue-600 fill-blue-600" size={40} />, label: "ความเร็วเฉลี่ย" },
                            { icon: <Target className="text-green-600 fill-green-100" size={40} />, label: "ความแม่นยำเฉลี่ย" },
                            { icon: <Clock className="text-purple-600" size={40} />, label: "เวลาฝึกบทเรียน" },
                            { icon: <Sparkles className="text-amber-500 fill-amber-500" size={40} />, label: "เวลาโหมดฟาร์ม" },
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0">
                                    {item.icon}
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{item.label}</p>
                                    <div className="h-7 w-20 bg-gray-200 rounded-lg mt-1 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 2. Main 2-Column Layout: ซ้าย (LessonList) + ขวา (ActivityGraph & RecentActivity) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* ซ้าย: กล่องสีฟ้า Lesson Progress */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-[#5cb5db] rounded-3xl p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white border-l-4 border-white pl-3">
                                        ระดับเริ่มต้น (Beginner)
                                    </h3>
                                    <div className="h-7 w-44 bg-white/25 rounded-lg animate-pulse" />
                                </div>
                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="bg-white rounded-2xl p-4 shadow-xs flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <div className="h-5 w-48 bg-gray-200 rounded-md animate-pulse" />
                                                <div className="h-5 w-24 bg-gray-100 rounded-md animate-pulse" />
                                            </div>
                                            <div className="w-full h-2.5 bg-gray-200 rounded-full animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ขวา: สถิติต่อเนื่อง + ปฏิทิน + ประวัติล่าสุด */}
                        <div className="space-y-6">
                            {/* กล่องสถิติต่อเนื่อง */}
                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 font-bold text-base">สถิติต่อเนื่อง</span>
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-500">
                                        <Flame size={18} fill="currentColor" />
                                        <div className="h-5 w-6 bg-orange-200 rounded animate-pulse" />
                                        <span className="text-xs font-bold mt-0.5">วัน</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center px-1">
                                    {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                                        <div key={d} className="flex flex-col items-center gap-1.5">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                                            <div className="h-2.5 w-4 bg-gray-200 rounded animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* กล่องปฏิทิน */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <ChevronLeft size={20} className="text-gray-300" />
                                    <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse" />
                                    <ChevronRight size={20} className="text-gray-300" />
                                </div>
                                <div className="grid grid-cols-7 gap-y-2 mt-2">
                                    {Array.from({ length: 35 }).map((_, idx) => (
                                        <div key={idx} className="h-9 flex items-center justify-center">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* กล่องประวัติล่าสุด */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">ประวัติล่าสุด</h3>
                                <div className="space-y-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                                                <div className="space-y-1.5">
                                                    <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                                                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                                                </div>
                                            </div>
                                            <div className="h-5 w-14 bg-gray-100 rounded-full animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
            <StickyNavbar />

            <main className="flex-grow w-full max-w-6xl mx-auto px-6 pt-8 pb-10 animate-fadeInDown">

                {/* Header */}
                <div className="mb-8 pb-6 border-b-1 border-gray-400">
                    <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight ">
                        ผลการฝึกฝนของคุณ
                    </h1>
                    <p className="text-gray-500 mt-1">ดูพัฒนาการและสถิติทั้งหมดได้ที่นี่</p>
                </div>

                {/* 1. Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
                    <StatCard
                        icon={<Star className="text-yellow-500 fill-yellow-500" size={40} />}
                        label="ดาวทั้งหมด"
                        value={renderStat(stats.totalStars)}
                        subValue="Stars"
                        color=""
                    />
                    <StatCard
                        icon={<Zap className="text-blue-600 fill-blue-600" size={40} />}
                        label="ความเร็วเฉลี่ย"
                        value={renderStat(stats.avgSpeed)}
                        subValue="WPM"
                        color=""
                    />
                    <StatCard
                        icon={<Target className="text-green-600 fill-green-100" size={40} />}
                        label="ความแม่นยำเฉลี่ย"
                        value={renderStat(stats.avgAccuracy)}
                        subValue="%"
                        color=""
                    />
                    <StatCard
                        icon={<Clock className="text-purple-600" size={40} />}
                        label="เวลาฝึกบทเรียน"
                        value={stats.timeSpent}
                        subValue=""
                        color=""
                    />
                    <StatCard
                        icon={<Sparkles className="text-amber-500 fill-amber-500" size={40} />}
                        label="เวลาโหมดฟาร์ม"
                        value={stats.farmTimeSpent || "0m"}
                        subValue="Farm"
                        color=""
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* 2. Left: Lesson Progress (โหลดแบบ lazy) */}
                    <div className="lg:col-span-2">
                        <LessonList data={courseProgress} />
                    </div>

                    {/* 3. Right: Sidebar (โหลดแบบ lazy) */}
                    <div className="space-y-6">
                        <ActivityGraph completedDates={activityDates} dailyStats={dailyStats} />
                        <RecentActivityWidget activities={recentActivity} />
                    </div>
                </div>

            </main>
        </div>
    );
}