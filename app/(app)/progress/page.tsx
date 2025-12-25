"use client";

import React, { useState, useEffect } from 'react';
import { Zap, Target, Clock, Star, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic'; // ✅ 1. Import dynamic
import StickyNavbar from '@/components/StickyNavbar/StickyNavbar';

// ✅ 2. เปลี่ยนการ import Component ใหญ่ๆ ให้เป็น dynamic import
// พร้อมสร้าง "โครง (Skeleton)" ระหว่างที่รอมันโหลด

const StatCard = dynamic(() => import('@/components/ProgressStatCard/ProgressStatCard'), {
    loading: () => <div className="h-24 bg-white rounded-2xl shadow-sm animate-pulse" />,
    ssr: false // ส่วนนี้ไม่จำเป็นต้องทำ SEO บน Server
});

const LessonList = dynamic(() => import('@/components/ProgressList/ProgressList'), {
    loading: () => <div className="h-96 bg-white rounded-2xl shadow-sm animate-pulse" />,
    ssr: false
});

const ActivityGraph = dynamic(() => import('@/components/ActivityGraph/ActivityGraph'), {
    loading: () => <div className="h-72 bg-white rounded-2xl shadow-sm animate-pulse" />,
    ssr: false
});

const RecentActivityWidget = dynamic(() => import('@/components/RecentActivityWidget/RecentActivityWidget'), {
    loading: () => <div className="h-72 bg-white rounded-2xl shadow-sm animate-pulse" />,
    ssr: false
});

export default function ProgressPage() {
    const [stats, setStats] = useState({
        totalStars: 0,
        avgSpeed: 0,
        avgAccuracy: 0,
        timeSpent: "--",
    });
    const [activityDates, setActivityDates] = useState<string[]>([]);
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

    // หน้า Loading หลัก (หมุนติ้วๆ กลางจอ)
    if (isLoading) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center text-gray-400">
                <Loader2 size={64} className="animate-spin mb-4 text-[#5cb5db]" />
                <p className="text-xl font-bold">กำลังโหลดข้อมูล...</p>
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

                {/* 1. Stats Grid (โหลดแบบ lazy) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
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
                        label="เวลาที่ใช้ฝึก"
                        value={stats.timeSpent}
                        subValue=""
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
                        <ActivityGraph completedDates={activityDates} />
                        <RecentActivityWidget activities={recentActivity} />
                    </div>
                </div>

            </main>
        </div>
    );
}