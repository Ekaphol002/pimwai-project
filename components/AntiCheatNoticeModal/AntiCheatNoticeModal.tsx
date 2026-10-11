"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AlertCircle } from "lucide-react";

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
        // ดึงข้อมูลผู้ใช้เพื่อเช็ค notice (จะขึ้นเฉพาะผู้ใช้ที่ระบบบันทึก antiCheatNotice ไว้ในฐานข้อมูล)
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
                            setNotice({
                                title: "แจ้งเตือนการปรับคะแนน EXP",
                                message: data.antiCheatNotice,
                            });
                            setIsOpen(true);
                        }
                    }
                })
                .catch((err) => console.error("Notice check error:", err));
        }
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
            <div className="bg-white rounded-2xl max-w-md w-full border border-red-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header: ขาว แดง เรียบง่าย */}
                <div className="p-6 pb-4 border-b border-gray-100 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl text-red-600 flex items-center justify-center shrink-0">
                        <AlertCircle size={32} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900">
                            {notice.title || "แจ้งเตือนการปรับคะแนน EXP"}
                        </h3>
                        <p className="text-xs text-red-600 font-medium mt-0.5">
                            ระบบตรวจพบความผิดปกติในการรับ EXP
                        </p>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-4 text-sm text-gray-600">
                    <p className="leading-relaxed text-gray-700">
                        {notice.message}
                    </p>

                    {notice.details && (
                        <div className="bg-gray-50 rounded-xl p-3.5 text-xs text-gray-600 space-y-1.5 border border-gray-100">
                            <span className="font-semibold text-gray-800 block">
                                รายละเอียดการตรวจสอบ:
                            </span>
                            <p className="whitespace-pre-line leading-relaxed text-gray-600">
                                {notice.details}
                            </p>
                        </div>
                    )}

                    {/* Stats Comparison Box (เรียบง่าย ขาว-แดง) */}
                    {notice.adjustedExp !== undefined && (
                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                            <div className="bg-red-50/60 border border-red-100 rounded-xl p-3 text-center">
                                <span className="text-[11px] font-medium text-gray-500 block mb-0.5">
                                    EXP เดิมที่ถูกปั๊ม
                                </span>
                                <span className="text-base font-bold text-red-600 line-through">
                                    {(notice.adjustedExp || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                                <span className="text-[11px] font-medium text-gray-500 block mb-0.5">
                                    EXP สุทธิที่ปรับใหม่
                                </span>
                                <span className="text-base font-bold text-gray-900">
                                    {(notice.currentExp || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* คำเตือนเรื่องการแบนถาวร */}
                    <div className="bg-red-50 border border-red-200/80 rounded-xl p-3 text-xs text-red-700 font-medium leading-relaxed">
                        <span className="font-bold text-red-800">คำเตือน:</span> หากตรวจพบการใช้บอท สคริปต์ หรือโปรแกรมโกงใดๆ อีกในครั้งถัดไป ระบบจะทำการระงับและ<span className="font-bold underline text-red-900">แบนบัญชีของคุณถาวรทันที</span>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                    <button
                        type="button"
                        onClick={handleAcknowledge}
                        disabled={isAcknowledging}
                        className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {isAcknowledging ? "กำลังดำเนินการ..." : "รับทราบ"}
                    </button>
                </div>
            </div>
        </div>
    );
}
