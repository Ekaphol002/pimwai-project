"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ShieldAlert, MessageSquare, AlertTriangle, UserX, CheckCircle,
    RotateCcw, Lock, Unlock, Loader2, ArrowLeft, Trash2, Check, X,
    Calendar, User as UserIcon, Mail, Flag
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { isAdmin } from '@/lib/adminAuth';

export default function AdminDashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'reports' | 'feedbacks'>('reports');
    const [reports, setReports] = useState<any[]>([]);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const userIsAdmin = isAdmin(session?.user?.email);

    const fetchAdminData = async () => {
        setIsLoading(true);
        try {
            const [reportRes, feedbackRes] = await Promise.all([
                fetch('/api/report'),
                fetch('/api/feedback')
            ]);

            const reportData = await reportRes.json();
            const feedbackData = await feedbackRes.json();

            if (reportData.success) setReports(reportData.reports || []);
            if (feedbackData.success) setFeedbacks(feedbackData.feedbacks || []);
        } catch (error) {
            console.error('Fetch admin error:', error);
            toast.error('ไม่สามารถโหลดข้อมูล Admin ได้');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'unauthenticated' || (status === 'authenticated' && !userIsAdmin)) {
            router.push('/');
        } else if (status === 'authenticated' && userIsAdmin) {
            fetchAdminData();
        }
    }, [status, userIsAdmin]);

    // 1. รีเซ็ตรูปโปรไฟล์ + ล็อกไม่ให้เปลี่ยนอีก
    const handleResetAndLockAvatar = async (userId: string, userName: string) => {
        if (!confirm(`ต้องการรีเซ็ตรูปโปรไฟล์ของ "${userName}" และระงับสิทธิ์การอัปโหลดรูปถาวรใช่หรือไม่?`)) return;

        setActionLoadingId(userId);
        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset_and_lock_avatar', targetUserId: userId })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                fetchAdminData();
            } else {
                toast.error(data.error || 'เกิดข้อผิดพลาด');
            }
        } catch (e) {
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setActionLoadingId(null);
        }
    };

    // 2. ปลดล็อกรูปโปรไฟล์
    const handleUnlockAvatar = async (userId: string) => {
        setActionLoadingId(userId);
        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'unlock_avatar', targetUserId: userId })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                fetchAdminData();
            } else {
                toast.error(data.error || 'เกิดข้อผิดพลาด');
            }
        } catch (e) {
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setActionLoadingId(null);
        }
    };

    // 3. รีเซ็ตชื่อผู้ใช้ที่ไม่เหมาะสม
    const handleForceRename = async (userId: string, currentName: string) => {
        const newName = prompt(`กรอกชื่อใหม่สำหรับผู้ใช้ "${currentName}":`, `User_${userId.slice(-4)}`);
        if (!newName) return;

        setActionLoadingId(userId);
        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'force_rename', targetUserId: userId, newName })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                fetchAdminData();
            } else {
                toast.error(data.error || 'เกิดข้อผิดพลาด');
            }
        } catch (e) {
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setActionLoadingId(null);
        }
    };

    // 4. จัดการสถานะ Report
    const handleUpdateReportStatus = async (reportId: string, status: string) => {
        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_report_status', reportId, status })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('อัปเดตสถานะเรียบร้อย');
                fetchAdminData();
            }
        } catch (e) {
            toast.error('เกิดข้อผิดพลาด');
        }
    };

    // 5. จัดการสถานะ Feedback
    const handleUpdateFeedbackStatus = async (feedbackId: string, status: string) => {
        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_feedback_status', feedbackId, status })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('อัปเดตสถานะเรียบร้อย');
                fetchAdminData();
            }
        } catch (e) {
            toast.error('เกิดข้อผิดพลาด');
        }
    };

    if (isLoading || !userIsAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-gray-400 bg-[#f4f7fb]">
                <Loader2 size={48} className="animate-spin mb-3 text-[#5cb5db]" />
                <p className="text-sm font-semibold logo-font">Checking Admin Access...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f7fb] py-10 px-4 sm:px-6 lg:px-8 flex justify-center">
            <Toaster position="top-center" />

            <div className="w-full max-w-5xl flex flex-col gap-6">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/settings"
                            className="p-2.5 text-gray-600 transition cursor-pointer"
                        >
                            <ArrowLeft size={25} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <ShieldAlert size={26} className="text-red-500" />
                                <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight logo-font">
                                    Admin Moderation Panel
                                </h1>
                            </div>
                            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                                ผู้ดูแลระบบ: <span className="font-bold text-gray-700">{session?.user?.email}</span>
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={fetchAdminData}
                        className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
                    >
                        <RotateCcw size={14} />
                        <span>รีเฟรชข้อมูล</span>
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-3 border-b border-gray-200 pb-2">
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'reports'
                            ? 'bg-red-500 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
                            }`}
                    >
                        <AlertTriangle size={16} />
                        <span>รายงานผู้ใช้ (Reports)</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('feedbacks')}
                        className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'feedbacks'
                            ? 'bg-[#5cb5db] text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
                            }`}
                    >
                        <MessageSquare size={16} />
                        <span>ข้อเสนอแนะ (Feedbacks)</span>
                    </button>
                </div>

                {/* --- TAB 1: รายงานผู้ใช้ (Reports) --- */}
                {activeTab === 'reports' && (
                    <div className="flex flex-col gap-4">
                        {reports.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-200/80">
                                <CheckCircle size={48} className="mx-auto mb-3 text-green-400 opacity-60" />
                                <p className="font-bold text-gray-600">ไม่มีรายงานที่ต้องตรวจสอบในขณะนี้</p>
                            </div>
                        ) : (
                            reports.map((report) => {
                                const target = report.reportedUser;
                                const isPending = report.status === 'pending';

                                return (
                                    <div
                                        key={report.id}
                                        className={`bg-white rounded-3xl p-6 sm:p-7 shadow-sm border transition-all flex flex-col md:flex-row justify-between gap-6 ${isPending ? 'border-red-200 ring-2 ring-red-100' : 'border-gray-200/80 opacity-75'
                                            }`}
                                    >
                                        <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
                                            {/* Reported User Avatar */}
                                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-200 shrink-0">
                                                <img
                                                    src={target?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(target?.username || target?.name || 'User')}&background=eceff1`}
                                                    className="w-full h-full object-cover"
                                                    alt="Reported Avatar"
                                                />
                                            </div>

                                            {/* Report Details */}
                                            <div className="flex flex-col gap-1.5 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-black text-gray-800 text-base sm:text-lg logo-font">
                                                        {target?.username || target?.name || 'User'}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-medium">({target?.email || 'No email'})</span>
                                                    {target?.isAvatarLocked && (
                                                        <span className="px-2.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-bold flex items-center gap-1">
                                                            <Lock size={10} />
                                                            <span>Avatar ถูกล็อก</span>
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                                                        {report.reason === 'inappropriate_avatar' ? '⚠️ รูปโปรไฟล์ไม่เหมาะสม' :
                                                            report.reason === 'inappropriate_name' ? '⚠️ ชื่อผู้ใช้ไม่เหมาะสม' :
                                                                report.reason === 'cheating' ? '⚠️ สงสัยว่าโกงคะแนน' : '⚠️ อื่นๆ'}
                                                    </span>
                                                    <span className="text-gray-400">
                                                        รายงานโดย: <span className="font-semibold text-gray-600">{report.reporter?.username || report.reporter?.name || 'User'}</span>
                                                    </span>
                                                </div>

                                                {report.details && (
                                                    <p className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 mt-1">
                                                        "{report.details}"
                                                    </p>
                                                )}

                                                <span className="text-[11px] text-gray-400 mt-1">
                                                    เมื่อ {new Date(report.createdAt).toLocaleString('th-TH')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Admin Action Buttons */}
                                        <div className="flex flex-col sm:flex-row md:flex-col justify-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                            {/* Action 1: Reset & Lock Avatar */}
                                            <button
                                                type="button"
                                                disabled={actionLoadingId === target?.id}
                                                onClick={() => handleResetAndLockAvatar(target?.id, target?.username || 'User')}
                                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                            >
                                                <UserX size={14} />
                                                <span>ลบรูป & ระงับเปลี่ยนรูป</span>
                                            </button>

                                            {/* Action 2: Unlock Avatar (if locked) */}
                                            {target?.isAvatarLocked && (
                                                <button
                                                    type="button"
                                                    disabled={actionLoadingId === target?.id}
                                                    onClick={() => handleUnlockAvatar(target?.id)}
                                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <Unlock size={14} />
                                                    <span>ปลดล็อกรูป</span>
                                                </button>
                                            )}

                                            {/* Action 3: Force Rename */}
                                            <button
                                                type="button"
                                                disabled={actionLoadingId === target?.id}
                                                onClick={() => handleForceRename(target?.id, target?.username || 'User')}
                                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                            >
                                                <RotateCcw size={14} />
                                                <span>บังคับเปลี่ยนชื่อใหม่</span>
                                            </button>

                                            {/* Mark Resolved */}
                                            {isPending && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                                                    className="px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                                                >
                                                    <Check size={14} />
                                                    <span>จัดการแล้ว (Resolve)</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* --- TAB 2: ข้อเสนอแนะ (Feedbacks) --- */}
                {activeTab === 'feedbacks' && (
                    <div className="flex flex-col gap-4">
                        {feedbacks.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-200/80">
                                <MessageSquare size={48} className="mx-auto mb-3 text-blue-400 opacity-60" />
                                <p className="font-bold text-gray-600">ยังไม่มีข้อเสนอแนะจากผู้ใช้</p>
                            </div>
                        ) : (
                            feedbacks.map((item) => {
                                const isPending = item.status === 'pending';

                                return (
                                    <div
                                        key={item.id}
                                        className={`bg-white rounded-3xl p-6 sm:p-7 shadow-sm border transition-all flex flex-col md:flex-row justify-between gap-6 ${isPending ? 'border-blue-200 ring-2 ring-blue-50' : 'border-gray-200/80 opacity-75'
                                            }`}
                                    >
                                        <div className="flex flex-col gap-2 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`px-3 py-1 rounded-xl text-xs font-bold ${item.category === 'suggestion' ? 'bg-blue-50 text-[#5cb5db]' :
                                                    item.category === 'bug' ? 'bg-red-50 text-red-600' :
                                                        item.category === 'content' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {item.category === 'suggestion' ? '💡 เสนอแนะฟีเจอร์' :
                                                        item.category === 'bug' ? '🐞 แจ้งบั๊ก' :
                                                            item.category === 'content' ? '📖 บทเรียน' : '💬 อื่นๆ'}
                                                </span>

                                                <h3 className="font-black text-gray-800 text-base sm:text-lg">
                                                    {item.title}
                                                </h3>
                                            </div>

                                            <p className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100 whitespace-pre-wrap">
                                                {item.content}
                                            </p>

                                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                                <span>ผู้ส่ง: <strong className="text-gray-600">{item.user?.username || item.user?.name || 'บุคคลทั่วไป'}</strong> ({item.user?.email || '-'})</span>
                                                <span>•</span>
                                                <span>{new Date(item.createdAt).toLocaleString('th-TH')}</span>
                                            </div>
                                        </div>

                                        {/* Status Toggle */}
                                        <div className="flex md:flex-col justify-end items-center gap-2 shrink-0">
                                            {isPending ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateFeedbackStatus(item.id, 'reviewed')}
                                                    className="px-4 py-2 bg-[#5cb5db] hover:bg-[#4a9ec2] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                                                >
                                                    <Check size={14} />
                                                    <span>ทำเครื่องหมายว่าอ่านแล้ว</span>
                                                </button>
                                            ) : (
                                                <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200/80">
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

            </div>
        </div>
    );
}
