"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    ShieldAlert, MessageSquare, AlertTriangle, UserX, CheckCircle2,
    RotateCcw, Lock, Unlock, Loader2, Check,
    Users, Flame, BookOpen, Zap, Trophy, Clock,
    Activity, Database, RefreshCw, Crown, Keyboard,
    Search, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { isAdmin } from '@/lib/adminAuth';
import { RANK_TIERS } from '@/lib/rankUtils';

type AdminTab = 'overview' | 'users' | 'reports' | 'feedbacks' | 'database';
type TrendMetric = 'activeUsers' | 'newUsers' | 'farmMinutes' | 'testsCount';

function formatDurationShort(totalSec: number): string {
    if (!totalSec || totalSec <= 0) return '0 นาที';
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) return `${hours.toLocaleString()} ชม. ${minutes} น.`;
    if (minutes > 0) return `${minutes} น. ${seconds > 0 ? `${seconds} วิ` : ''}`.trim();
    return `${seconds} วิ`;
}

function formatRelativeTime(dateInput?: string | null): string {
    if (!dateInput) return 'ยังไม่เคยเล่น';
    const diffMs = Date.now() - new Date(dateInput).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'เมื่อสักครู่';
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} ชม. ที่แล้ว`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay} วันที่แล้ว`;
    return new Date(dateInput).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

function getAvatarSrc(image?: string | null, name?: string | null): string {
    if (image && !image.includes('default-avatar.png')) return image;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=5cb5db&color=fff&bold=true`;
}

export default function AdminDashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [trendMetric, setTrendMetric] = useState<TrendMetric>('activeUsers');
    const [userSearch, setUserSearch] = useState('');
    const [reportFilter, setReportFilter] = useState<'pending' | 'all'>('pending');
    const [feedbackFilter, setFeedbackFilter] = useState<'pending' | 'all'>('pending');

    const [stats, setStats] = useState<any>(null);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [cleanupLoading, setCleanupLoading] = useState(false);
    const [cleanupResult, setCleanupResult] = useState<any>(null);

    const userIsAdmin = isAdmin(session?.user?.email);

    const fetchAdminData = async (silent = false) => {
        if (silent) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const [reportRes, feedbackRes, statsRes] = await Promise.all([
                fetch('/api/report', { cache: 'no-store' }),
                fetch('/api/feedback', { cache: 'no-store' }),
                fetch('/api/admin/stats', { cache: 'no-store' })
            ]);

            const [reportData, feedbackData, statsData] = await Promise.all([
                reportRes.json(),
                feedbackRes.json(),
                statsRes.json()
            ]);

            if (reportData.success) setReports(reportData.reports || []);
            if (feedbackData.success) setFeedbacks(feedbackData.feedbacks || []);
            if (statsData.success) {
                setStats(statsData.stats || null);
                setLastUpdatedAt(statsData.generatedAt || new Date().toISOString());
            } else {
                toast.error(statsData.error || 'โหลดสถิติไม่สำเร็จ');
            }
        } catch (error) {
            console.error('Fetch admin error:', error);
            toast.error('ไม่สามารถโหลดข้อมูล Admin ได้');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (status === 'unauthenticated' || (status === 'authenticated' && !userIsAdmin)) {
            router.push('/');
        } else if (status === 'authenticated' && userIsAdmin) {
            fetchAdminData();
        }
    }, [status, userIsAdmin]);

    const handleAdminAction = async (payload: Record<string, any>, successFallback: string) => {
        if (payload.targetUserId) setActionLoadingId(payload.targetUserId);
        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || successFallback);
                fetchAdminData(true);
            } else {
                toast.error(data.error || 'เกิดข้อผิดพลาด');
            }
        } catch {
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleResetAndLockAvatar = (userId: string, userName: string) => {
        if (!confirm(`ต้องการรีเซ็ตรูปโปรไฟล์ของ "${userName}" และระงับสิทธิ์การเปลี่ยนรูปถาวรใช่หรือไม่?`)) return;
        handleAdminAction({ action: 'reset_and_lock_avatar', targetUserId: userId }, 'รีเซ็ตและล็อกรูปโปรไฟล์แล้ว');
    };

    const handleUnlockAvatar = (userId: string) => {
        handleAdminAction({ action: 'unlock_avatar', targetUserId: userId }, 'ปลดล็อกรูปโปรไฟล์แล้ว');
    };

    const handleForceRename = (userId: string, currentName: string) => {
        const newName = prompt(`กรอกชื่อใหม่สำหรับผู้ใช้ "${currentName}":`, `User_${userId.slice(-4)}`);
        if (!newName) return;
        handleAdminAction({ action: 'force_rename', targetUserId: userId, newName }, 'เปลี่ยนชื่อผู้ใช้เรียบร้อย');
    };

    const handleRunCleanup = async () => {
        if (!confirm('ยืนยันทำความสะอาดฐานข้อมูล? ระบบจะเคลียร์ข้อมูลเก่าเกิน 30 วันและรวม FarmSession ให้เป็น 1 แถว/วัน (Streak และเวลาย้อนหลังอยู่ครบ 100%)')) return;
        setCleanupLoading(true);
        try {
            const res = await fetch('/api/admin/maintenance/cleanup', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setCleanupResult(data.summary);
                toast.success('ทำความสะอาดฐานข้อมูลสำเร็จ');
                fetchAdminData(true);
            } else {
                toast.error(data.error || 'เกิดข้อผิดพลาด');
            }
        } catch (e: any) {
            toast.error('ไม่สามารถเชื่อมต่อ API ได้: ' + e.message);
        } finally {
            setCleanupLoading(false);
        }
    };

    const pendingReportsCount = useMemo(() => reports.filter(r => r.status === 'pending').length, [reports]);
    const pendingFeedbacksCount = useMemo(() => feedbacks.filter(f => f.status === 'pending').length, [feedbacks]);

    const filteredReports = useMemo(
        () => (reportFilter === 'pending' ? reports.filter(r => r.status === 'pending') : reports),
        [reports, reportFilter]
    );

    const filteredFeedbacks = useMemo(
        () => (feedbackFilter === 'pending' ? feedbacks.filter(f => f.status === 'pending') : feedbacks),
        [feedbacks, feedbackFilter]
    );

    const searchLower = userSearch.trim().toLowerCase();
    const filteredTopUsers = useMemo(() => {
        const list = stats?.topExpUsers || [];
        if (!searchLower) return list;
        return list.filter((u: any) =>
            (u.username || u.name || '').toLowerCase().includes(searchLower) ||
            (u.email || '').toLowerCase().includes(searchLower)
        );
    }, [stats?.topExpUsers, searchLower]);

    const filteredNewUsers = useMemo(() => {
        const list = stats?.recentNewUsers || [];
        if (!searchLower) return list;
        return list.filter((u: any) =>
            (u.name || '').toLowerCase().includes(searchLower) ||
            (u.email || '').toLowerCase().includes(searchLower)
        );
    }, [stats?.recentNewUsers, searchLower]);

    if (isLoading || !userIsAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-gray-400 bg-[#f8fafc]">
                <Loader2 size={36} className="animate-spin mb-3 text-[#5cb5db]" />
                <p className="text-xs font-semibold tracking-wide text-gray-500">กำลังโหลดข้อมูลระบบ...</p>
            </div>
        );
    }

    const todayActive = stats?.today?.activeUsers || 0;
    const yesterdayActive = stats?.today?.activeUsersYesterday || 0;
    const activeDiff = todayActive - yesterdayActive;

    const dailyTrend: any[] = stats?.dailyTrend || [];
    const trendMax = Math.max(1, ...dailyTrend.map(d => Number(d[trendMetric]) || 0));

    const trendMeta: Record<TrendMetric, { label: string; unit: string; color: string }> = {
        activeUsers: { label: 'คนเข้าเล่น', unit: 'คน', color: 'bg-[#5cb5db]' },
        newUsers: { label: 'สมัครใหม่', unit: 'คน', color: 'bg-emerald-500' },
        farmMinutes: { label: 'ฟาร์ม (นาที)', unit: 'นาที', color: 'bg-amber-500' },
        testsCount: { label: 'สอบ Speed', unit: 'ครั้ง', color: 'bg-gray-800' }
    };

    const dbTables = stats?.databaseTables || {};
    const totalDbRows = Object.values(dbTables).reduce((acc: number, v: any) => acc + (Number(v) || 0), 0);

    const navItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
        { id: 'overview', label: 'ภาพรวม', icon: <Activity size={16} /> },
        { id: 'users', label: 'ผู้ใช้ & แรงค์', icon: <Crown size={16} /> },
        { id: 'reports', label: 'รายงานผู้ใช้', icon: <AlertTriangle size={16} />, badge: pendingReportsCount, badgeColor: 'bg-red-500 text-white' },
        { id: 'feedbacks', label: 'ข้อเสนอแนะ', icon: <MessageSquare size={16} />, badge: pendingFeedbacksCount, badgeColor: 'bg-[#5cb5db] text-white' },
        { id: 'database', label: 'ฐานข้อมูล', icon: <Database size={16} /> }
    ];

    const pageTitles: Record<AdminTab, { title: string; desc: string }> = {
        overview: { title: 'ภาพรวมระบบ', desc: 'สถิติการใช้งานประจำวัน แนวโน้ม 7 วัน และกิจกรรมล่าสุด' },
        users: { title: 'ผู้ใช้ & อันดับแรงค์', desc: 'สัดส่วนแรงค์ Top 10 EXP, สถิติความเร็วสูงสุด และสมาชิกใหม่' },
        reports: { title: 'รายงานผู้ใช้', desc: 'ตรวจสอบรายงานความไม่เหมาะสมและจัดการบัญชี' },
        feedbacks: { title: 'ข้อเสนอแนะจากผู้ใช้', desc: 'อ่านคำแนะนำ แจ้งบั๊ก และอัปเดตสถานะการตรวจ' },
        database: { title: 'จัดการฐานข้อมูล', desc: 'ตรวจสอบจำนวนแถวข้อมูลสดและทำความสะอาดข้อมูลเก่า' }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
            <Toaster position="top-center" />

            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">

                {/* Left Sidebar (Desktop) + Top Nav (Mobile) */}
                <aside className="lg:w-56 shrink-0">
                    <div className="bg-white border border-gray-200 rounded-2xl p-3 lg:sticky lg:top-20">
                        <div className="px-2.5 py-2 mb-2 border-b border-gray-100 flex items-center gap-2">
                            <ShieldAlert size={18} className="text-red-500 shrink-0" />
                            <div className="min-w-0">
                                <div className="text-sm font-black text-gray-900 leading-tight">Admin Panel</div>
                                <div className="text-[11px] text-gray-400 truncate">{session?.user?.email}</div>
                            </div>
                        </div>

                        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
                            {navItems.map(item => {
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setActiveTab(item.id)}
                                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${isActive
                                            ? 'bg-gray-900 text-white'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </span>
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${isActive ? 'bg-white text-gray-900' : item.badgeColor}`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0 flex flex-col gap-5">
                    {/* Top Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                                {pageTitles[activeTab].title}
                            </h1>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {pageTitles[activeTab].desc}
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5 self-start sm:self-auto">
                            {lastUpdatedAt && (
                                <span className="text-[11px] text-gray-400 font-medium tabular-nums">
                                    อัปเดต {new Date(lastUpdatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => fetchAdminData(true)}
                                disabled={isRefreshing}
                                className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                            >
                                <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                                <span>รีเฟรช</span>
                            </button>
                        </div>
                    </div>

                    {/* ==================== TAB: OVERVIEW ==================== */}
                    {activeTab === 'overview' && (
                        <div className="flex flex-col gap-5">
                            {/* Row 1: 4 Clean Today KPIs */}
                            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
                                {/* KPI 1: Active Today */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between gap-2">
                                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                                        <span>คนเข้าเล่นวันนี้</span>
                                        <Users size={15} className="text-gray-400" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl sm:text-3xl font-black text-gray-900 tabular-nums">
                                            {todayActive.toLocaleString()}
                                        </span>
                                        <span className={`inline-flex items-center text-[11px] font-bold tabular-nums ${activeDiff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {activeDiff >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                                            {activeDiff >= 0 ? `+${activeDiff}` : activeDiff}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-gray-400 font-medium">
                                        สมัครใหม่วันนี้ <strong className="text-gray-700">+{stats?.today?.newUsers || 0}</strong> • เมื่อวาน {yesterdayActive}
                                    </div>
                                </div>

                                {/* KPI 2: Farm Today */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between gap-2">
                                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                                        <span>เวลาฟาร์มวันนี้</span>
                                        <Keyboard size={15} className="text-gray-400" />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-gray-900 tabular-nums">
                                        {formatDurationShort(stats?.today?.farmTimeSeconds || 0)}
                                    </div>
                                    <div className="text-[11px] text-gray-400 font-medium truncate">
                                        {stats?.today?.farmActiveUsers || 0} คน • {(stats?.today?.farmWords || 0).toLocaleString()} คำ • <strong className="text-emerald-600">+{(stats?.today?.farmExp || 0).toLocaleString()} EXP</strong>
                                    </div>
                                </div>

                                {/* KPI 3: Lessons & Speed Tests Today */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between gap-2">
                                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                                        <span>บทเรียน / สอบวันนี้</span>
                                        <BookOpen size={15} className="text-gray-400" />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-gray-900 tabular-nums">
                                        {(stats?.today?.lessonsPlayed || 0)} <span className="text-base font-semibold text-gray-300">/</span> {(stats?.today?.testsPlayed || 0)}
                                    </div>
                                    <div className="text-[11px] text-gray-400 font-medium truncate">
                                        {stats?.today?.testsPlayed > 0
                                            ? `สอบเฉลี่ย ${stats?.today?.avgSpeedWpm || 0} WPM (${stats?.today?.avgSpeedAccuracy || 0}%)`
                                            : 'จำนวนด่านที่ผ่าน / รอบสอบ'}
                                    </div>
                                </div>

                                {/* KPI 4: Top Speed Today */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between gap-2">
                                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                                        <span>Top Speed วันนี้</span>
                                        <Trophy size={15} className="text-amber-500" />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-gray-900 tabular-nums">
                                        {stats?.today?.topSpeed ? `${stats.today.topSpeed.wpm} WPM` : '—'}
                                    </div>
                                    <div className="text-[11px] text-gray-400 font-medium truncate">
                                        {stats?.today?.topSpeed
                                            ? `${stats.today.topSpeed.userName} (${stats.today.topSpeed.accuracy}% • ${stats.today.topSpeed.duration}น.)`
                                            : 'ยังไม่มีการสอบวันนี้'}
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: 7-Day Trend Chart + Retention & All-Time Summary */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                {/* 7-Day Bar Chart */}
                                <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <h2 className="text-sm font-black text-gray-900">แนวโน้ม 7 วันล่าสุด</h2>
                                            <p className="text-[11px] text-gray-400">หน่วย: {trendMeta[trendMetric].unit} (ตามเวลาไทย)</p>
                                        </div>
                                        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl self-start">
                                            {(Object.keys(trendMeta) as TrendMetric[]).map(key => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setTrendMetric(key)}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${trendMetric === key
                                                        ? 'bg-white text-gray-900 shadow-xs'
                                                        : 'text-gray-500 hover:text-gray-800'
                                                        }`}
                                                >
                                                    {trendMeta[key].label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-2.5 items-end h-44 pt-4">
                                        {dailyTrend.map((day, idx) => {
                                            const val = Number(day[trendMetric]) || 0;
                                            const heightPct = Math.max(5, Math.round((val / trendMax) * 100));
                                            const isToday = idx === dailyTrend.length - 1;
                                            return (
                                                <div key={day.date} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                                                    <span className={`text-[11px] font-bold tabular-nums ${isToday ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-700'}`}>
                                                        {val.toLocaleString()}
                                                    </span>
                                                    <div className="w-full max-w-[40px] bg-gray-100 rounded-lg h-28 flex items-end overflow-hidden">
                                                        <div
                                                            className={`w-full rounded-lg transition-all duration-300 ${trendMeta[trendMetric].color} ${isToday ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                                                            style={{ height: `${heightPct}%` }}
                                                            title={`${day.date}: ${val.toLocaleString()} ${trendMeta[trendMetric].unit}`}
                                                        />
                                                    </div>
                                                    <span className={`text-[11px] tabular-nums ${isToday ? 'font-black text-[#5cb5db]' : 'font-medium text-gray-400'}`}>
                                                        {isToday ? 'วันนี้' : day.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right Summary Card: Retention + All-Time */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between gap-4">
                                    <div>
                                        <h2 className="text-sm font-black text-gray-900 mb-3">การกลับมาใช้งาน & ยอดสะสม</h2>
                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            <div className="border border-gray-200 rounded-xl py-2.5 px-2 text-center">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase">DAU</div>
                                                <div className="text-lg font-black text-gray-900 tabular-nums">{(stats?.retention?.dau || 0).toLocaleString()}</div>
                                            </div>
                                            <div className="border border-gray-200 rounded-xl py-2.5 px-2 text-center">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase">WAU</div>
                                                <div className="text-lg font-black text-gray-900 tabular-nums">{(stats?.retention?.wau || 0).toLocaleString()}</div>
                                            </div>
                                            <div className="border border-gray-200 rounded-xl py-2.5 px-2 text-center">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase">MAU</div>
                                                <div className="text-lg font-black text-gray-900 tabular-nums">{(stats?.retention?.mau || 0).toLocaleString()}</div>
                                            </div>
                                        </div>

                                        <div className="divide-y divide-gray-100 text-xs">
                                            <div className="py-2 flex justify-between">
                                                <span className="text-gray-500">Stickiness (DAU/MAU)</span>
                                                <span className="font-bold text-[#5cb5db] tabular-nums">{stats?.retention?.stickiness || 0}%</span>
                                            </div>
                                            <div className="py-2 flex justify-between">
                                                <span className="text-gray-500">ผู้ใช้ทั้งหมดในระบบ</span>
                                                <span className="font-bold text-gray-900 tabular-nums">{(stats?.overall?.totalUsers || 0).toLocaleString()} คน</span>
                                            </div>
                                            <div className="py-2 flex justify-between">
                                                <span className="text-gray-500">สมัครใหม่ (7 วัน / 30 วัน)</span>
                                                <span className="font-bold text-emerald-600 tabular-nums">+{stats?.retention?.newUsers7d || 0} / +{stats?.retention?.newUsers30d || 0}</span>
                                            </div>
                                            <div className="py-2 flex justify-between">
                                                <span className="text-gray-500">เวลาฟาร์มสะสมทั้งหมด</span>
                                                <span className="font-bold text-gray-900 tabular-nums">{Math.round((stats?.overall?.totalFarmTimeSeconds || 0) / 3600).toLocaleString()} ชม.</span>
                                            </div>
                                            <div className="py-2 flex justify-between">
                                                <span className="text-gray-500">บทเรียน / สอบ Speed ทั้งหมด</span>
                                                <span className="font-bold text-gray-900 tabular-nums">
                                                    {(stats?.overall?.totalLessonsCompleted || 0).toLocaleString()} / {(stats?.overall?.totalTestsCompleted || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="py-2 flex justify-between">
                                                <span className="text-gray-500">EXP รวมทั้งระบบ</span>
                                                <span className="font-bold text-gray-900 tabular-nums">{((stats?.overall?.totalExpSystem || 0) / 1_000_000).toFixed(2)}M</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Row 3: Recent Active Users & Recent Speed Tests */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Recent Active Users */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <h2 className="text-sm font-black text-gray-900">เข้าเล่นล่าสุด</h2>
                                        <span className="text-[11px] text-gray-400">12 คนล่าสุด</span>
                                    </div>
                                    <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto pr-1">
                                        {(stats?.recentActiveUsers || []).map((u: any) => (
                                            <div key={u.id} className="py-2.5 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <img
                                                        src={getAvatarSrc(u.image, u.username || u.name)}
                                                        alt=""
                                                        className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-bold text-gray-900 truncate">{u.username || u.name || 'User'}</span>
                                                            <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">R{u.rank}</span>
                                                        </div>
                                                        <div className="text-[11px] text-gray-400 tabular-nums truncate">
                                                            {(u.currentExp || 0).toLocaleString()} EXP • {formatDurationShort(u.farmTimeSeconds || 0)} • {u.activeDays || 0} วัน
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-[11px] font-semibold text-gray-500 shrink-0 tabular-nums">
                                                    {formatRelativeTime(u.lastPlayedAt)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent Speed Tests */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <h2 className="text-sm font-black text-gray-900">สอบ Speed Test ล่าสุด</h2>
                                        <span className="text-[11px] text-gray-400">10 รายการล่าสุด</span>
                                    </div>
                                    <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto pr-1">
                                        {(stats?.recentSpeedTests || []).length === 0 ? (
                                            <p className="text-center py-8 text-xs text-gray-400">ยังไม่มีข้อมูลการทดสอบ</p>
                                        ) : (
                                            (stats?.recentSpeedTests || []).map((t: any) => (
                                                <div key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <img
                                                            src={getAvatarSrc(t.userImage, t.userName)}
                                                            alt=""
                                                            className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-bold text-gray-900 truncate">{t.userName}</div>
                                                            <div className="text-[11px] text-gray-400">{t.duration} นาที • {formatRelativeTime(t.createdAt)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0 tabular-nums">
                                                        <span className="text-xs font-black text-gray-900">{t.wpm} WPM</span>
                                                        <span className={`text-[11px] font-bold ${t.accuracy >= 95 ? 'text-emerald-600' : t.accuracy >= 85 ? 'text-amber-600' : 'text-red-500'}`}>
                                                            {t.accuracy}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==================== TAB: USERS & RANKS ==================== */}
                    {activeTab === 'users' && (
                        <div className="flex flex-col gap-5">
                            {/* Search Bar */}
                            <div className="relative max-w-sm">
                                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    placeholder="ค้นหาชื่อหรืออีเมลในตาราง..."
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#5cb5db]"
                                />
                            </div>

                            {/* Rank Distribution + Top 5 Speed */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                                    <h2 className="text-sm font-black text-gray-900 mb-4">สัดส่วนผู้ใช้แต่ละแรงค์</h2>
                                    <div className="space-y-3">
                                        {(stats?.rankDistribution || []).map((item: any) => {
                                            const tier = RANK_TIERS.find(t => t.rank === item.rank);
                                            return (
                                                <div key={item.rank} className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-semibold text-gray-700">
                                                            R{item.rank} {tier?.thaiName || tier?.name}
                                                        </span>
                                                        <span className="tabular-nums font-bold text-gray-900">
                                                            {item.count.toLocaleString()} <span className="text-gray-400 font-normal">({item.percent}%)</span>
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full bg-gradient-to-r ${tier?.badgeBg || 'from-sky-400 to-blue-500'}`}
                                                            style={{ width: `${Math.max(item.count > 0 ? 2 : 0, item.percent)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                                    <h2 className="text-sm font-black text-gray-900 mb-4">Top 5 ความเร็วสูงสุดตลอดกาล</h2>
                                    <div className="divide-y divide-gray-100">
                                        {(stats?.topSpeedAllTime || []).map((t: any, idx: number) => (
                                            <div key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-400 text-white' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                        {idx + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-bold text-gray-900 truncate">{t.userName}</div>
                                                        <div className="text-[11px] text-gray-400">
                                                            {t.duration} นาที • {new Date(t.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right tabular-nums shrink-0">
                                                    <div className="text-xs font-black text-gray-900">{t.wpm} WPM</div>
                                                    <div className="text-[11px] font-semibold text-emerald-600">{t.accuracy}%</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Top 10 EXP Leaderboard */}
                            <div className="bg-white border border-gray-200 rounded-2xl p-5">
                                <h2 className="text-sm font-black text-gray-900 mb-3">Top 10 EXP Leaderboard</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-[11px] text-gray-400 font-bold">
                                                <th className="py-2 pr-3">#</th>
                                                <th className="py-2 pr-3">ผู้ใช้</th>
                                                <th className="py-2 pr-3">แรงค์</th>
                                                <th className="py-2 pr-3 text-right">EXP สะสม</th>
                                                <th className="py-2 pr-3 text-right">เวลาฟาร์ม</th>
                                                <th className="py-2 pr-3 text-right">วันเข้าเล่น</th>
                                                <th className="py-2 text-right">เล่นล่าสุด</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 tabular-nums">
                                            {filteredTopUsers.map((u: any, idx: number) => (
                                                <tr key={u.id} className="hover:bg-gray-50/70">
                                                    <td className="py-2.5 pr-3 font-bold text-gray-400">{idx + 1}</td>
                                                    <td className="py-2.5 pr-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <img src={getAvatarSrc(u.image, u.username || u.name)} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-200 shrink-0" />
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-gray-900 truncate max-w-[160px]">{u.username || u.name || 'User'}</div>
                                                                <div className="text-[10px] text-gray-400 truncate max-w-[180px]">{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 pr-3 font-bold text-gray-700">R{u.rank}</td>
                                                    <td className="py-2.5 pr-3 text-right font-black text-gray-900">{(u.currentExp || 0).toLocaleString()}</td>
                                                    <td className="py-2.5 pr-3 text-right text-gray-600">{formatDurationShort(u.farmTimeSeconds || 0)}</td>
                                                    <td className="py-2.5 pr-3 text-right font-bold text-emerald-600">{u.activeDays || 0} วัน</td>
                                                    <td className="py-2.5 text-right text-gray-500">{formatRelativeTime(u.lastPlayedAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 10 Newest Signups */}
                            <div className="bg-white border border-gray-200 rounded-2xl p-5">
                                <h2 className="text-sm font-black text-gray-900 mb-3">สมาชิกสมัครใหม่ล่าสุด</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-[11px] text-gray-400 font-bold">
                                                <th className="py-2 pr-3">ผู้ใช้</th>
                                                <th className="py-2 pr-3">ช่องทาง</th>
                                                <th className="py-2 pr-3 text-right">EXP</th>
                                                <th className="py-2 pr-3 text-right">สถานะ</th>
                                                <th className="py-2 text-right">เวลาที่สมัคร</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 tabular-nums">
                                            {filteredNewUsers.map((u: any) => (
                                                <tr key={u.id} className="hover:bg-gray-50/70">
                                                    <td className="py-2.5 pr-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <img src={getAvatarSrc(u.image, u.name)} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-200 shrink-0" />
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-gray-900 truncate max-w-[160px]">{u.name}</div>
                                                                <div className="text-[10px] text-gray-400 truncate max-w-[200px]">{u.email || '-'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 pr-3">
                                                        <span className="px-2 py-0.5 border border-gray-200 rounded-md text-[11px] font-semibold text-gray-600">{u.provider}</span>
                                                    </td>
                                                    <td className="py-2.5 pr-3 text-right font-bold text-gray-900">{(u.currentExp || 0).toLocaleString()}</td>
                                                    <td className="py-2.5 pr-3 text-right">
                                                        {u.lastPlayedAt
                                                            ? <span className="text-emerald-600 font-bold">เริ่มเล่นแล้ว</span>
                                                            : <span className="text-gray-400">ยังไม่เริ่ม</span>}
                                                    </td>
                                                    <td className="py-2.5 text-right text-gray-500">
                                                        {new Date(u.createdAt).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==================== TAB: REPORTS ==================== */}
                    {activeTab === 'reports' && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl self-start">
                                <button
                                    type="button"
                                    onClick={() => setReportFilter('pending')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${reportFilter === 'pending' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
                                >
                                    รอจัดการ ({pendingReportsCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReportFilter('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${reportFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
                                >
                                    ทั้งหมด ({reports.length})
                                </button>
                            </div>

                            {filteredReports.length === 0 ? (
                                <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-400">
                                    <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500" />
                                    <p className="text-sm font-bold text-gray-700">ไม่มีรายงานในหมวดนี้</p>
                                </div>
                            ) : (
                                filteredReports.map((report) => {
                                    const target = report.reportedUser;
                                    const isPending = report.status === 'pending';
                                    return (
                                        <div key={report.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-5">
                                            <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                                <img
                                                    src={getAvatarSrc(target?.image, target?.username || target?.name)}
                                                    alt=""
                                                    className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0"
                                                />
                                                <div className="flex-1 min-w-0 space-y-1.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-black text-gray-900 text-sm">{target?.username || target?.name || 'User'}</span>
                                                        <span className="text-xs text-gray-400">{target?.email || ''}</span>
                                                        {target?.isAvatarLocked && (
                                                            <span className="px-2 py-0.5 bg-red-600 text-white rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                                                <Lock size={10} /> ล็อกรูป
                                                            </span>
                                                        )}
                                                        {!isPending && (
                                                            <span className="px-2 py-0.5 border border-emerald-300 text-emerald-600 rounded-full text-[10px] font-bold">
                                                                จัดการแล้ว
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 text-xs flex-wrap">
                                                        <span className="font-bold text-red-600">
                                                            {report.reason === 'inappropriate_avatar' ? 'รูปโปรไฟล์ไม่เหมาะสม' :
                                                                report.reason === 'inappropriate_name' ? 'ชื่อผู้ใช้ไม่เหมาะสม' :
                                                                    report.reason === 'cheating' ? 'สงสัยว่าโกงคะแนน' : 'อื่นๆ'}
                                                        </span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="text-gray-500">โดย {report.reporter?.username || report.reporter?.name || 'User'}</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="text-gray-400">{new Date(report.createdAt).toLocaleString('th-TH')}</span>
                                                    </div>

                                                    {report.details && (
                                                        <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                                            &ldquo;{report.details}&rdquo;
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap md:flex-col justify-center gap-2 shrink-0 md:w-48">
                                                <button
                                                    type="button"
                                                    disabled={actionLoadingId === target?.id}
                                                    onClick={() => handleResetAndLockAvatar(target?.id, target?.username || 'User')}
                                                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <UserX size={13} /> ลบรูป & ล็อก
                                                </button>
                                                {target?.isAvatarLocked && (
                                                    <button
                                                        type="button"
                                                        disabled={actionLoadingId === target?.id}
                                                        onClick={() => handleUnlockAvatar(target?.id)}
                                                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                                    >
                                                        <Unlock size={13} /> ปลดล็อกรูป
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    disabled={actionLoadingId === target?.id}
                                                    onClick={() => handleForceRename(target?.id, target?.username || 'User')}
                                                    className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <RotateCcw size={13} /> บังคับเปลี่ยนชื่อ
                                                </button>
                                                {isPending && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAdminAction({ action: 'update_report_status', reportId: report.id, status: 'resolved' }, 'อัปเดตสถานะเรียบร้อย')}
                                                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                                    >
                                                        <Check size={13} /> จัดการแล้ว
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* ==================== TAB: FEEDBACKS ==================== */}
                    {activeTab === 'feedbacks' && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl self-start">
                                <button
                                    type="button"
                                    onClick={() => setFeedbackFilter('pending')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${feedbackFilter === 'pending' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
                                >
                                    ยังไม่อ่าน ({pendingFeedbacksCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFeedbackFilter('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${feedbackFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
                                >
                                    ทั้งหมด ({feedbacks.length})
                                </button>
                            </div>

                            {filteredFeedbacks.length === 0 ? (
                                <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-400">
                                    <MessageSquare size={36} className="mx-auto mb-2 text-[#5cb5db]" />
                                    <p className="text-sm font-bold text-gray-700">ไม่มีข้อเสนอแนะในหมวดนี้</p>
                                </div>
                            ) : (
                                filteredFeedbacks.map((item) => {
                                    const isPending = item.status === 'pending';
                                    return (
                                        <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-4">
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="px-2.5 py-0.5 border border-gray-200 rounded-lg text-[11px] font-bold text-gray-700">
                                                        {item.category === 'suggestion' ? 'เสนอแนะ' :
                                                            item.category === 'bug' ? 'แจ้งบั๊ก' :
                                                                item.category === 'content' ? 'บทเรียน' : 'อื่นๆ'}
                                                    </span>
                                                    <h3 className="font-black text-gray-900 text-sm">{item.title}</h3>
                                                </div>

                                                <p className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-3.5 rounded-xl border border-gray-200 whitespace-pre-wrap">
                                                    {item.content}
                                                </p>

                                                {item.imageUrl && (
                                                    <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                                                        <img src={item.imageUrl} alt="Attachment" className="max-h-48 rounded-xl border border-gray-200 object-cover" />
                                                    </a>
                                                )}

                                                <div className="text-[11px] text-gray-400 flex items-center gap-2 flex-wrap">
                                                    <span>ผู้ส่ง: <strong className="text-gray-700">{item.user?.username || item.user?.name || 'บุคคลทั่วไป'}</strong> ({item.user?.email || '-'})</span>
                                                    <span>•</span>
                                                    <span>{new Date(item.createdAt).toLocaleString('th-TH')}</span>
                                                </div>
                                            </div>

                                            <div className="flex md:flex-col justify-end items-center shrink-0">
                                                {isPending ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAdminAction({ action: 'update_feedback_status', feedbackId: item.id, status: 'reviewed' }, 'ทำเครื่องหมายว่าอ่านแล้ว')}
                                                        className="px-3.5 py-2 bg-[#5cb5db] hover:bg-[#4a9ec2] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <Check size={14} /> อ่านแล้ว
                                                    </button>
                                                ) : (
                                                    <span className="text-xs font-bold text-emerald-600 border border-emerald-300 px-3 py-1.5 rounded-xl">
                                                        ✓ อ่านแล้ว
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* ==================== TAB: DATABASE ==================== */}
                    {activeTab === 'database' && (
                        <div className="flex flex-col gap-5">
                            {/* Live Table Counts */}
                            <div className="bg-white border border-gray-200 rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-black text-gray-900">จำนวนแถวข้อมูลปัจจุบัน</h2>
                                    <span className="text-xs font-bold text-gray-500 tabular-nums">รวม {totalDbRows.toLocaleString()} แถว</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                                    {[
                                        { label: 'User', count: dbTables.users },
                                        { label: 'FarmSession', count: dbTables.farmSessions },
                                        { label: 'LessonProgress', count: dbTables.lessonProgress },
                                        { label: 'SpeedTestResult', count: dbTables.speedTestResults },
                                        { label: 'Feedback', count: dbTables.feedbacks },
                                        { label: 'Report', count: dbTables.reports },
                                        { label: 'CodeSnippet', count: dbTables.codeSnippets }
                                    ].map(tbl => (
                                        <div key={tbl.label} className="border border-gray-200 rounded-xl p-3 text-center">
                                            <div className="text-[11px] font-semibold text-gray-400 truncate">{tbl.label}</div>
                                            <div className="text-lg font-black text-gray-900 mt-0.5 tabular-nums">{(tbl.count || 0).toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cleanup Control */}
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
                                <div>
                                    <h2 className="text-sm font-black text-gray-900">ทำความสะอาดข้อมูลเก่าเกิน 30 วัน</h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        ยุบแถว FarmSession เก่าให้เหลือ 1 แถว/วัน และลบประวัติ SpeedTestResult เก่า (เก็บ Best Score, EXP, เวลาสะสม และ Streak ถาวรใน activeDates ครบ 100%)
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                    <div className="border border-gray-200 rounded-xl p-3.5">
                                        <div className="font-bold text-gray-900 flex items-center gap-1.5 mb-1">
                                            <Flame size={14} className="text-orange-500" /> Streak ถาวร
                                        </div>
                                        <p className="text-gray-500 leading-relaxed">วันที่เข้าเล่นถูกเก็บถาวรใน User.activeDates ไม่สูญหายแม้ลบประวัติเก่า</p>
                                    </div>
                                    <div className="border border-gray-200 rounded-xl p-3.5">
                                        <div className="font-bold text-gray-900 flex items-center gap-1.5 mb-1">
                                            <Clock size={14} className="text-[#5cb5db]" /> เวลาฟาร์มตรงเป๊ะ
                                        </div>
                                        <p className="text-gray-500 leading-relaxed">รวมเวลาฟาร์มรายวันไว้ครบทุกนาทีและวินาที</p>
                                    </div>
                                    <div className="border border-gray-200 rounded-xl p-3.5">
                                        <div className="font-bold text-gray-900 flex items-center gap-1.5 mb-1">
                                            <Zap size={14} className="text-amber-500" /> Leaderboard ปลอดภัย
                                        </div>
                                        <p className="text-gray-500 leading-relaxed">EXP, แรงค์ และสถิติสูงสุดของทุกคนไม่เปลี่ยนแปลง</p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleRunCleanup}
                                    disabled={cleanupLoading}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer"
                                >
                                    {cleanupLoading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                                    <span>{cleanupLoading ? 'กำลังทำความสะอาด...' : 'ทำความสะอาดฐานข้อมูลทันที'}</span>
                                </button>

                                {cleanupResult && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 space-y-1.5">
                                        <div className="font-bold text-emerald-600 flex items-center gap-1.5">
                                            <CheckCircle2 size={15} /> ทำความสะอาดเรียบร้อย
                                        </div>
                                        <div>• SpeedTestResult เก่าที่จัดการ: <strong>{(cleanupResult.speedTestsDeleted || cleanupResult.speedMistakesCleared || 0).toLocaleString()}</strong> รายการ</div>
                                        <div>• วันกิจกรรมที่รวม FarmSession: <strong>{(cleanupResult.farmSessionsConsolidatedDays || 0).toLocaleString()}</strong> วัน</div>
                                        <div>• แถว FarmSession ซ้ำที่ลบออก: <strong>{(cleanupResult.farmSessionsDeletedRows || 0).toLocaleString()}</strong> แถว</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
