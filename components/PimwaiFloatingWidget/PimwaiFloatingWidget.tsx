"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { X, Loader2 } from 'lucide-react';

type SuggestionCategory = 'feature' | 'mode' | 'theme' | 'bug' | 'other';

const CATEGORIES: { id: SuggestionCategory; label: string }[] = [
    { id: 'feature', label: 'ฟีเจอร์ใหม่' },
    { id: 'mode', label: 'โหมดพิมพ์ใหม่' },
    { id: 'theme', label: 'ธีมและเสียง' },
    { id: 'bug', label: 'แจ้งปัญหา' },
    { id: 'other', label: 'อื่นๆ' },
];

export default function PimwaiFloatingWidget() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    const [category, setCategory] = useState<SuggestionCategory>('feature');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isTypingInFarm, setIsTypingInFarm] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    // ฟังก์ชันคำนวณวันปัจจุบัน (YYYY-MM-DD) ตามเวลาท้องถิ่น
    const getTodayDateKey = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // เปิดรับ Event และเช็คสถานะการปิดซ่อนรายวัน (ถ้ากดปิดในวันนี้แล้ว จะซ่อนไว้ตลอดวันนั้น และจะขึ้นใหม่ในวันถัดไป)
    useEffect(() => {
        try {
            const today = getTodayDateKey();
            const dismissedDate = localStorage.getItem('pimwai_suggestion_widget_dismissed_date');
            if (dismissedDate === today) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
        } catch (e) { }

        const handleOpenEvent = () => {
            setIsOpen(true);
        };

        const handleTypingState = (e: any) => {
            setIsTypingInFarm(Boolean(e.detail?.isTyping));
        };

        window.addEventListener('open-pimwai-news', handleOpenEvent);
        window.addEventListener('pimwai-typing-state', handleTypingState);
        return () => {
            window.removeEventListener('open-pimwai-news', handleOpenEvent);
            window.removeEventListener('pimwai-typing-state', handleTypingState);
        };
    }, []);

    // โฟกัสช่องพิมพ์เมื่อเปิด Modal
    useEffect(() => {
        if (isOpen && !isSubmitted) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, isSubmitted]);

    // เมื่อกดปุ่มกากบาทปิด: ซ่อนไว้ตลอดทั้งวันนี้ พรุ่งนี้จะกลับมาแสดงใหม่
    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsVisible(false);
        try {
            const today = getTodayDateKey();
            localStorage.setItem('pimwai_suggestion_widget_dismissed_date', today);
        } catch (e) { }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setIsSubmitting(true);
        setErrorMessage('');

        const selectedCat = CATEGORIES.find(c => c.id === category);
        const categoryLabel = selectedCat ? selectedCat.label : 'ฟีเจอร์ใหม่';

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `[${categoryLabel}] ${title.trim()}`,
                    content: content.trim(),
                    category: category === 'bug' ? 'bug' : 'suggestion'
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setIsSubmitted(true);
                setTitle('');
                setContent('');
            } else {
                setErrorMessage(data?.error || 'เกิดข้อผิดพลาดในการส่ง กรุณาลองใหม่อีกครั้ง');
            }
        } catch (err) {
            console.error('Error submitting feedback:', err);
            setErrorMessage('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* ปุ่มลอยมุมขวาล่าง แบบเรียบง่าย มีโลโก้และจุดแดงแจ้งเตือน (ซ่อนตัวอัตโนมัติขณะพิมพ์ในหน้าฟาร์ม) */}
            {isVisible && (
                <div
                    className={`fixed bottom-6 right-6 z-40 group select-none transition-all duration-300 ease-in-out ${isTypingInFarm
                        ? 'opacity-0 pointer-events-none translate-y-6 scale-95'
                        : 'opacity-100 pointer-events-auto translate-y-0 scale-100'
                        }`}
                >
                    <div className="relative flex items-center">
                        <button
                            type="button"
                            onClick={() => setIsOpen(true)}
                            className="flex items-center gap-2 pl-3 pr-4 py-2 bg-white/95 hover:bg-white text-gray-700 hover:text-black rounded-full shadow-md hover:shadow-lg border border-gray-200/90 hover:border-gray-300 transition-all text-xs sm:text-sm font-medium cursor-pointer"
                        >
                            {/* โลโก้ */}
                            <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                                <Image
                                    src="/logo.png"
                                    alt="PIMWAI Logo"
                                    width={20}
                                    height={20}
                                    className="object-contain"
                                    onError={(e) => {
                                        e.currentTarget.srcset = "/logopimwai.png";
                                    }}
                                />
                            </div>

                            <span>เสนอสิ่งที่อยากให้ทำเพิ่ม</span>
                        </button>

                        {/* จุดสีแดงแจ้งเตือน */}
                        <span className="absolute -top-1 -left-1 flex h-3 w-3 pointer-events-none">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 shadow-xs" />
                        </span>

                        {/* ปุ่มปิดซ่อน */}
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-400 hover:bg-gray-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm cursor-pointer"
                            title="ปิดซ่อน"
                            aria-label="ปิดซ่อน"
                        >
                            <X size={10} />
                        </button>
                    </div>
                </div>
            )}

            {/* หน้าต่างสำหรับพิมพ์ส่งข้อเสนอแนะ แบบเรียบง่าย คลีนตา */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div
                        className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-gray-100 relative animate-in zoom-in-95 duration-150 overflow-hidden text-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header เรียบง่าย มีโลโก้ */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                                    <Image
                                        src="/logo.png"
                                        alt="PIMWAI Logo"
                                        width={32}
                                        height={32}
                                        className="object-contain"
                                        onError={(e) => {
                                            e.currentTarget.srcset = "/logopimwai.png";
                                        }}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-800">
                                        เสนอสิ่งที่อยากให้ทำเพิ่ม
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        มีฟีเจอร์หรือสิ่งใดที่อยากให้พัฒนาเพิ่มเติม ส่งมาบอกเราได้เลย
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                                aria-label="ปิดหน้าต่าง"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="p-6">
                            {isSubmitted ? (
                                <div className="py-6 text-center space-y-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center mx-auto text-lg font-bold">
                                        ✓
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-gray-800">
                                            ส่งข้อเสนอแนะเรียบร้อยแล้ว
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                                            ขอบคุณสำหรับความคิดเห็น ทีมงานจะนำไปพิจารณาพัฒนาต่อไป
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-center gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsSubmitted(false)}
                                            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-medium transition cursor-pointer"
                                        >
                                            เสนอเพิ่มอีกเรื่อง
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition cursor-pointer"
                                        >
                                            ปิดหน้าต่าง
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* หมวดหมู่แบบปุ่มเรียบง่าย */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-2">
                                            หมวดหมู่
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {CATEGORIES.map((cat) => {
                                                const isSelected = category === cat.id;
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        onClick={() => setCategory(cat.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${isSelected
                                                            ? 'bg-gray-900 border-gray-900 text-white'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        {cat.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* ช่องกรอกหัวข้อ */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                            หัวข้อ
                                        </label>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            placeholder="เช่น อยากให้มีโหมดพิมพ์แข่ง 1v1 กับเพื่อน"
                                            maxLength={120}
                                            required
                                            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-gray-400 outline-none text-xs sm:text-sm bg-white transition"
                                        />
                                    </div>

                                    {/* ช่องกรอกรายละเอียด */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                            รายละเอียด
                                        </label>
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            rows={4}
                                            placeholder="อธิบายรายละเอียดเพิ่มเติม..."
                                            required
                                            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-gray-400 outline-none text-xs sm:text-sm bg-white transition resize-none leading-relaxed"
                                        />
                                    </div>

                                    {/* ข้อมูลผู้ส่งแบบเรียบง่าย */}
                                    <div className="flex items-center justify-between text-xs text-gray-400 pt-0.5">
                                        <span>
                                            ผู้ส่ง: {(session?.user as any)?.username || session?.user?.name || 'ผู้เล่นทั่วไป'}
                                        </span>
                                    </div>

                                    {errorMessage && (
                                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                                            {errorMessage}
                                        </div>
                                    )}

                                    {/* ปุ่มกดส่ง */}
                                    <div className="pt-2 flex items-center justify-end gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !title.trim() || !content.trim()}
                                            className="px-5 py-2 rounded-xl text-xs font-medium text-white bg-gray-900 hover:bg-black transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                                        >
                                            {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                                            <span>{isSubmitting ? 'กำลังส่ง...' : 'ส่งข้อเสนอแนะ'}</span>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
