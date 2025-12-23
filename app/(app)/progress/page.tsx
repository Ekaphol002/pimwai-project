"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, Zap, Target, Clock, Star, Loader2 } from 'lucide-react';
import StickyNavbar from '@/components/StickyNavbar/StickyNavbar';
import Navbar from '@/components/Navbar/Navbar';

import StatCard from '@/components/ProgressStatCard/ProgressStatCard';
import LessonList from '@/components/ProgressList/ProgressList';
import ActivityGraph from '@/components/ActivityGraph/ActivityGraph';
import RecentActivityWidget from '@/components/RecentActivityWidget/RecentActivityWidget';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProgressPage() {
    const { status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalStars: 0,
        avgSpeed: 0,
        avgAccuracy: 0,
        timeSpent: "--",
    });
    const [activityDates, setActivityDates] = useState<string[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    // 1. ✅ เพิ่ม State สำหรับเก็บรายการบทเรียน
    const [courseProgress, setCourseProgress] = useState<any[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // ✅ Fetch ข้อมูลจริง
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/progress');
                const data = await res.json();

                if (data.success) {
                    setStats(data.stats);
                    setActivityDates(data.activityDates);
                    setRecentActivity(data.recentActivity);

                    // 2. ✅ บันทึกข้อมูลบทเรียนลง State
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

    if (status === "loading" || (status === "authenticated" && isLoading)) {
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

                {/* 1. Stats Grid */}
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

                    {/* 2. Left: Lesson Progress */}
                    <div className="lg:col-span-2">
                        {/* 3. ✅ ส่งข้อมูลเข้าไปใน Component */}
                        <LessonList data={courseProgress} />
                    </div>

                    {/* 3. Right: Sidebar */}
                    <div className="space-y-6">
                        <ActivityGraph completedDates={activityDates} />
                        <RecentActivityWidget activities={recentActivity} />
                    </div>
                </div>

            </main>
        </div>
    );
}