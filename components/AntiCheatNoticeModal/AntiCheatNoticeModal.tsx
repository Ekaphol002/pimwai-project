"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, ShieldAlert, CheckCircle2, ChevronRight, X } from "lucide-react";

interface NoticeData {
    title: string;
    message: string;
    details?: string;
    adjustedExp?: number;
    currentExp?: number;
    rankName?: string;
}

export default function AntiCheatNoticeModal() {
    const { data: session } = useSession();
    const [notice, setNotice] = useState<NoticeData | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isAcknowledging, setIsAcknowledging] = useState(false);

    useEffect(() => {
        // 🌟 รองรับการเปิดดูตัวอย่างทันทีผ่าน URL เช่น http://localhost:3000/?preview_notice=1
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get("preview_notice") === "1" || urlParams.get("preview_notice") === "true") {
                setNotice({
                    title: "แจ้งเตือนการปรับสมดุลคะแนน EXP ในระบบ",
                    message: "ระบบตรวจพบการส่งข้อมูลบันทึกคะแนน EXP ในโหมดพิมพ์ด่วน (Farm Mode) ด้วยความถี่ที่ผิดปกติผ่านโปรแกรมอัตโนมัติ/สคริปต์",
                    details: "• ผลคะแนนจากการฝึกบทเรียนทั้ง 231 ด่านที่คุณเล่นด้วยตนเองได้รับการเก็บรักษาไว้อย่างถูกต้องสมบูรณ์ (672 ดาว)\n• ระบบได้ทำการลบเฉพาะผลคะแนนที่เกิดจากการยิงสแปม และปรับ EXP สุทธิให้ตรงกับผลงานจริงของคุณ\n• บัญชีของคุณยังสามารถใช้งานและร่วมสนุกได้ตามปกติ",
                    adjustedExp: 1133208,
                    currentExp: 59116,
                    rankName: "Venom Sorcerer (Rank 5)"
                });
                setIsOpen(true);
            }
        }

        // ฟัง event สำหรับเปิดดูตัวอย่าง (Preview Mode สำหรับแอดมิน/ผู้พัฒนา)
        const handlePreviewEvent = (e: any) => {
            if (e.detail) {
                setNotice(e.detail);
                setIsOpen(true);
            }
        };
        window.addEventListener("pimwai-preview-notice", handlePreviewEvent);

        // ดึงข้อมูลผู้ใช้เพื่อเช็ค notice
        if (session?.user) {
            fetch("/api/user/profile")
                .then((res) => res.json())
                .then((data) => {
                    if (data.success && data.antiCheatNotice) {
                        try {
                            const parsed = JSON.parse(data.antiCheatNotice);
                            setNotice(parsed);
                            setIsOpen(true);
                        } catch (e) {
                            // กรณีเป็น plain text
                            setNotice({
                                title: "ตรวจพบกิจกรรมผิดปกติในบัญชีของคุณ",
                                message: data.antiCheatNotice,
                            });
                            setIsOpen(true);
                        }
                    }
                })
                .catch((err) => console.error("Notice check error:", err));
        }

        return () => {
            window.removeEventListener("pimwai-preview-notice", handlePreviewEvent);
        };
    }, [session]);

    const handleAcknowledge = async () => {
        setIsAcknowledging(true);
        try {
            await fetch("/api/user/dismiss-notice", {
                method: "POST",
            });
        } catch (e) {
            console.error(e);
        } finally {
            setIsAcknowledging(false);
            setIsOpen(false);
        }
    };

    if (!isOpen || !notice) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 select-none">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-amber-200/80 overflow-hidden relative animate-in zoom-in-95 duration-200">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white relative overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                            <ShieldAlert size={28} className="text-white drop-shadow-sm" />
                        </div>
                        <div>
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/25 text-[11px] font-black uppercase tracking-wider mb-1">
                                ระบบตรวจจับความปลอดภัย
                            </span>
                            <h3 className="text-lg sm:text-xl font-black tracking-tight drop-shadow-sm leading-snug">
                                {notice.title || "แจ้งเตือนการปรับสมดุลคะแนน EXP"}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 sm:p-7 space-y-4 text-gray-700">
                    <div className="bg-amber-50 border border-amber-200/70 rounded-2xl p-4 flex items-start gap-3">
                        <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
                            {notice.message}
                        </div>
                    </div>

                    {notice.details && (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs sm:text-sm space-y-2 text-slate-600">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                <CheckCircle2 size={16} className="text-emerald-500" />
                                รายละเอียดการตรวจสอบ:
                            </div>
                            <p className="leading-relaxed pl-5 whitespace-pre-line text-slate-600">
                                {notice.details}
                            </p>
                        </div>
                    )}

                    {/* Stats Comparison Box */}
                    {notice.adjustedExp !== undefined && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-3 text-center">
                                <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">
                                    EXP เดิมที่ถูกปั๊ม
                                </span>
                                <span className="text-lg sm:text-xl font-black text-rose-600 logo-font line-through opacity-70">
                                    {(notice.adjustedExp || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 text-center">
                                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                                    EXP สุทธิที่ถูกต้อง
                                </span>
                                <span className="text-lg sm:text-xl font-black text-emerald-600 logo-font">
                                    {(notice.currentExp || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}

                    <p className="text-[11px] text-gray-400 text-center pt-2">
                        * ป๊อปอัปนี้จะแสดงเพียงครั้งเดียวเพื่อแจ้งให้คุณทราบเท่านั้น ขอให้สนุกกับการฝึกพิมพ์อย่างเป็นธรรมครับ
                    </p>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0 bg-white flex justify-end">
                    <button
                        type="button"
                        onClick={handleAcknowledge}
                        disabled={isAcknowledging}
                        className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-95 text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                    >
                        {isAcknowledging ? "กำลังยืนยัน..." : "รับทราบและเข้าใจแล้ว"}
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
