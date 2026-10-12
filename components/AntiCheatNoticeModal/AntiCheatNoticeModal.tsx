"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Upload, CheckCircle2, Send, X, ArrowLeft, ShieldCheck, FileText } from "lucide-react";

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

    // Form State
    const [appealMessage, setAppealMessage] = useState("");
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
    const [appealSuccess, setAppealSuccess] = useState(false);

    useEffect(() => {
        // รองรับการเปิดพรีวิวดูตัวอย่าง เช่น http://localhost:3000/?preview_notice=1
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get("preview_notice") === "1" || urlParams.get("preview_notice") === "true") {
                setNotice({
                    title: "ตรวจสอบคะแนน EXP และยื่นหลักฐาน",
                    message: "ระบบพบว่าคะแนน EXP ในโหมดพิมพ์ด่วน (Zen Mode) มีอัตราการเพิ่มขึ้นสูงกว่าเกณฑ์ปกติ ซึ่งอาจเกิดจากบั๊กตัวคูณคะแนนสะสม",
                    details: "- คะแนนจากบทเรียน 231 ด่าน (672 ดาว) บันทึกไว้อย่างถูกต้องสมบูรณ์ 100%\n- ระบบได้ปรับสมดุลคะแนน EXP ชั่วคราวให้อยู่ในเกณฑ์มาตรฐาน\n- หากคุณฝึกพิมพ์ด้วยตนเองจริง สามารถแนบภาพแคปหน้าจอเพื่อยืนยันให้ทีมงานตรวจสอบคืนคะแนนได้ครับ",
                    adjustedExp: 1133208,
                    currentExp: 59116,
                    rankName: "Venom Sorcerer (Rank 5)"
                });
                setIsOpen(true);
            }
        }

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
                            setNotice({
                                title: "ตรวจสอบคะแนน EXP และยื่นหลักฐาน",
                                message: data.antiCheatNotice,
                            });
                            setIsOpen(true);
                        }
                    }
                })
                .catch((err) => console.error("Notice check error:", err));
        }
    }, [session]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("ขนาดรูปภาพต้องไม่เกิน 5MB");
            return;
        }

        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
    };

    const handleSubmitAppeal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!appealMessage.trim() && !imagePreview) {
            alert("กรุณาระบุรายละเอียดหรือแนบรูปภาพหลักฐาน");
            return;
        }

        setIsSubmittingAppeal(true);
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: "other",
                    title: `[ยื่นหลักฐานการพิมพ์] จาก ${session?.user?.name || session?.user?.email || "ผู้เล่น"}`,
                    content: appealMessage.trim() || "ผู้เล่นได้แนบรูปภาพหลักฐานยืนยันการฝึกพิมพ์ด้วยตนเอง",
                    imageUrl: imagePreview || null,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setAppealSuccess(true);
                await fetch("/api/user/dismiss-notice", { method: "POST" });
                setTimeout(() => {
                    setIsOpen(false);
                }, 2500);
            } else {
                alert(data.error || "เกิดข้อผิดพลาดในการส่งหลักฐาน กรุณาลองใหม่อีกครั้ง");
            }
        } catch (err) {
            console.error("Appeal submit error:", err);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsSubmittingAppeal(false);
        }
    };

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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-blue-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
                {/* Header: โทนขาว-ฟ้า สุภาพ เป็นทางการ */}
                <div className="p-5 sm:p-6 pb-4 border-b border-gray-100 flex items-start gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-xl text-[#5cb5db] flex items-center justify-center shrink-0">
                        <ShieldCheck size={35} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900">
                            ยื่นหลักฐานและตรวจสอบคะแนน EXP
                        </h3>
                        <p className="text-xs text-[#5cb5db] font-medium mt-0.5">
                            PIMWAI Verification Center
                        </p>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 space-y-4 text-sm text-gray-600 overflow-y-auto flex-1">
                    {appealSuccess ? (
                        <div className="py-8 text-center space-y-3">
                            <CheckCircle2 size={56} className="text-emerald-500 mx-auto animate-bounce" />
                            <h4 className="text-base font-bold text-gray-900">ส่งหลักฐานเรียบร้อยแล้ว</h4>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                                ทีมงานได้รับภาพหลักฐานและข้อความของคุณแล้ว และจะตรวจสอบข้อมูลให้อย่างเป็นธรรม ขอบคุณสำหรับความตั้งใจในการฝึกพิมพ์ครับ
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitAppeal} className="space-y-4">
                            {/* ชี้แจงและขอโทษ */}
                            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 text-xs text-gray-700 leading-relaxed space-y-1.5">
                                <span className="font-bold text-blue-900 block text-sm">เรียน ผู้ใช้งาน PIMWAI:</span>
                                <p>
                                    ทางทีมงานต้อง<span className="font-bold text-gray-900 underline">กราบขออภัยเป็นอย่างสูง</span>สำหรับข้อความแจ้งเตือนก่อนหน้านี้ที่อาจทำให้คุณเสียความรู้สึกครับ
                                </p>
                                <p>
                                    เนื่องจากคะแนน EXP ในโหมดพิมพ์ด่วน (Zen Mode) พุ่งสูงขึ้นเร็วผิดปกติจากเกณฑ์ทั่วไป ระบบจึงมีการปรับสมดุลคะแนนไว้ชั่วคราว <strong className="text-[#5cb5db]">หากคุณมีภาพบันทึกหน้าจอหรือหลักฐานการฝึกพิมพ์ด้วยตนเอง สามารถแนบรูปส่งมาได้เลยครับ หากตรวจสอบแล้วว่าเป็นการเล่นด้วยตนเองจริง ทางทีมงานยินดีคืนคะแนน EXP ทั้งหมดให้ทันทีครับ</strong>
                                </p>
                                <p className="text-gray-500 pt-0.5 text-[11px]">
                                    *(คะแนนและดาวจากบทเรียนทั้ง 231 ด่านที่คุณเล่นไว้อย่างตั้งใจ ยังคงบันทึกอยู่อย่างปลอดภัยครบถ้วน 100%)
                                </p>
                            </div>

                            {/* ข้อความและภาพประกอบ */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                    <FileText size={14} className="text-gray-400" />
                                    <span>ข้อความชี้แจง / รายละเอียดเพิ่มเติม (ไม่บังคับ)</span>
                                </label>
                                <textarea
                                    value={appealMessage}
                                    onChange={(e) => setAppealMessage(e.target.value)}
                                    rows={2}
                                    placeholder="ระบุข้อความ เช่น วิธีการเล่น หรือรายละเอียดที่ต้องการให้ทีมงานทราบ..."
                                    className="w-full text-xs sm:text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5cb5db]/40 resize-none bg-gray-50/50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                    แนบรูปภาพหลักฐาน (ภาพแคปหน้าจอคะแนน หรือสถิติที่บันทึกไว้)
                                </label>

                                {imagePreview ? (
                                    <div className="relative border border-gray-200 rounded-xl p-2 bg-gray-50">
                                        <img
                                            src={imagePreview}
                                            alt="Evidence Preview"
                                            className="max-h-48 w-full object-contain rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md transition cursor-pointer"
                                            title="ลบรูป"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="border-2 border-dashed border-gray-300 hover:border-[#5cb5db] rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-gray-50/60 hover:bg-blue-50/30 transition group">
                                        <Upload size={26} className="text-gray-400 group-hover:text-[#5cb5db] mb-1.5 transition" />
                                        <span className="text-xs font-bold text-gray-700 group-hover:text-[#5cb5db]">
                                            คลิกเพื่ออัปโหลดรูปภาพหลักฐาน
                                        </span>
                                        <span className="text-[10px] text-gray-400 mt-0.5">
                                            รองรับไฟล์รูปภาพ JPG, PNG, WEBP (ไม่เกิน 5MB)
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={handleAcknowledge}
                                    disabled={isAcknowledging || isSubmittingAppeal}
                                    className="w-1/3 py-2.5 px-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-xs transition cursor-pointer disabled:opacity-50"
                                >
                                    {isAcknowledging ? "กำลังปิด..." : "ปิดหน้านี้"}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingAppeal || (!appealMessage.trim() && !imagePreview)}
                                    className="w-2/3 py-2.5 px-4 rounded-xl bg-[#5cb5db] hover:bg-[#4a9ec2] text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                                >
                                    <Send size={14} />
                                    <span>{isSubmittingAppeal ? "กำลังส่งหลักฐาน..." : "ส่งหลักฐานให้ทีมงาน"}</span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
