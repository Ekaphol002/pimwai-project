"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
    Code2,
    Lock,
    Play,
    RotateCcw,
    Plus,
    Trash2,
    Volume2,
    VolumeX,
    Sparkles,
    CheckCircle2,
    Clock,
    Zap,
    Target,
    AlertCircle,
    Copy,
    ArrowLeft,
    Settings2,
    FileCode,
    Terminal,
    ChevronDown,
    X,
    Save
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { isAdmin } from '@/lib/adminAuth';
import { soundManager } from '@/lib/soundEffects';

interface CodeSnippet {
    id: string;
    title: string;
    language: string;
    code: string;
    isCustom?: boolean;
}

const PRESET_SNIPPETS: CodeSnippet[] = [
    {
        id: 'react-hook',
        title: 'React useDebounce Hook',
        language: 'typescript',
        code: `import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}`
    },
    {
        id: 'nextjs-api',
        title: 'Next.js App Router API Route',
        language: 'typescript',
        code: `import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Authenticated' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}`
    },
    {
        id: 'python-algo',
        title: 'Python Quicksort Algorithm',
        language: 'python',
        code: `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

print(quicksort([3, 6, 8, 10, 1, 2, 1]))`
    },
    {
        id: 'css-styles',
        title: 'Modern CSS Glassmorphism',
        language: 'css',
        code: `.glass-container {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 1rem;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  transition: all 0.3s ease;
}`
    }
];

const LOCAL_STORAGE_KEY = 'pimwai_custom_code_snippets_v1';

export default function CodeTypingPage() {
    const { data: session, status } = useSession();
    const userIsAdmin = isAdmin(session?.user?.email);

    // State for Snippets
    const [snippets, setSnippets] = useState<CodeSnippet[]>(PRESET_SNIPPETS);
    const [selectedSnippetId, setSelectedSnippetId] = useState<string>(PRESET_SNIPPETS[0].id);
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

    // Form state for creating custom snippet
    const [customTitle, setCustomTitle] = useState('');
    const [customLanguage, setCustomLanguage] = useState('typescript');
    const [customCode, setCustomCode] = useState('');

    // Typing Engine State
    const [typed, setTyped] = useState('');
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [totalKeystrokes, setTotalKeystrokes] = useState(0);
    const [errorCount, setErrorCount] = useState(0);
    const [isSoundOn, setIsSoundOn] = useState(true);
    const [autoIndent, setAutoIndent] = useState(true);

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const activeCharRef = useRef<HTMLSpanElement | null>(null);

    // Load custom snippets from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setSnippets([...PRESET_SNIPPETS, ...parsed]);
                }
            }
        } catch (e) {
            console.error('Failed to load custom snippets', e);
        }
    }, []);

    const currentSnippet = snippets.find(s => s.id === selectedSnippetId) || snippets[0];
    const targetCode = currentSnippet?.code || '';

    // Reset when changing snippet
    const resetPractice = useCallback((newSnippetId?: string) => {
        if (newSnippetId) setSelectedSnippetId(newSnippetId);
        setTyped('');
        setStartTime(null);
        setElapsedSeconds(0);
        setIsFinished(false);
        setTotalKeystrokes(0);
        setErrorCount(0);
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    // Timer effect
    useEffect(() => {
        if (startTime && !isFinished) {
            timerRef.current = setInterval(() => {
                setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        } else if (isFinished && timerRef.current) {
            clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [startTime, isFinished]);

    // Keep active character visible in view
    useEffect(() => {
        if (activeCharRef.current) {
            activeCharRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }, [typed]);

    // Calculate metrics
    const charactersTyped = typed.length;
    const minutes = Math.max(elapsedSeconds / 60, 0.016); // at least 1s to avoid divide by zero
    const cpm = startTime ? Math.round(charactersTyped / minutes) : 0;
    const wpm = Math.round(cpm / 5);
    const accuracy = totalKeystrokes > 0
        ? Math.max(0, Math.round(((charactersTyped - errorCount) / totalKeystrokes) * 100))
        : 100;

    // Handle typing events
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (isFinished) return;

        // Start timer on first keystroke
        if (!startTime && e.key.length === 1) {
            setStartTime(Date.now());
        }

        // Handle Backspace
        if (e.key === 'Backspace') {
            e.preventDefault();
            if (typed.length > 0) {
                if (isSoundOn) soundManager.playKeySound(undefined, e as any);
                setTyped(prev => prev.slice(0, -1));
            }
            return;
        }

        // Ignore modifier keys
        if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta' || e.key === 'CapsLock' || e.key === 'Escape') {
            return;
        }

        e.preventDefault();
        setTotalKeystrokes(prev => prev + 1);

        if (isSoundOn) soundManager.playKeySound(undefined, e as any);

        const currentIndex = typed.length;
        if (currentIndex >= targetCode.length) return;

        const expectedChar = targetCode[currentIndex];

        // Handle Enter key
        if (e.key === 'Enter') {
            if (expectedChar === '\n') {
                let nextTyped = typed + '\n';

                // Auto-indent feature: automatically append leading spaces/tabs of the next line
                if (autoIndent) {
                    const remaining = targetCode.slice(nextTyped.length);
                    const match = remaining.match(/^[ \t]+/);
                    if (match && match[0]) {
                        nextTyped += match[0];
                    }
                }

                setTyped(nextTyped);
                if (nextTyped.length >= targetCode.length) {
                    setIsFinished(true);
                    toast.success('🎉 พิมพ์โค้ดเสร็จสมบูรณ์!');
                }
            } else {
                setErrorCount(prev => prev + 1);
            }
            return;
        }

        // Handle Tab key
        if (e.key === 'Tab') {
            if (expectedChar === '\t' || (expectedChar === ' ' && targetCode.slice(currentIndex, currentIndex + 2) === '  ')) {
                // Determine indent size
                const indentChunk = expectedChar === '\t' ? '\t' : (targetCode.slice(currentIndex, currentIndex + 4) === '    ' ? '    ' : '  ');
                const nextTyped = typed + indentChunk;
                setTyped(nextTyped);
                if (nextTyped.length >= targetCode.length) {
                    setIsFinished(true);
                    toast.success('🎉 พิมพ์โค้ดเสร็จสมบูรณ์!');
                }
            } else {
                setErrorCount(prev => prev + 1);
            }
            return;
        }

        // Standard character key
        if (e.key.length === 1) {
            if (e.key === expectedChar) {
                const nextTyped = typed + e.key;
                setTyped(nextTyped);
                if (nextTyped.length >= targetCode.length) {
                    setIsFinished(true);
                    toast.success('🎉 พิมพ์โค้ดเสร็จสมบูรณ์!');
                }
            } else {
                setErrorCount(prev => prev + 1);
            }
        }
    };

    // Save Custom Snippet
    const handleSaveCustomSnippet = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customTitle.trim() || !customCode.trim()) {
            toast.error('กรุณาระบุชื่อและใส่โค้ดให้ครบถ้วน');
            return;
        }

        const newSnippet: CodeSnippet = {
            id: `custom-${Date.now()}`,
            title: customTitle.trim(),
            language: customLanguage,
            code: customCode.replace(/\r\n/g, '\n'),
            isCustom: true
        };

        const existingCustom = snippets.filter(s => s.isCustom);
        const updatedCustom = [newSnippet, ...existingCustom];

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCustom));
        setSnippets([...PRESET_SNIPPETS, ...updatedCustom]);
        setSelectedSnippetId(newSnippet.id);
        resetPractice(newSnippet.id);

        setCustomTitle('');
        setCustomCode('');
        setIsCustomModalOpen(false);
        toast.success('บันทึกโค้ดของคุณเรียบร้อยแล้ว!');
    };

    // Delete Custom Snippet
    const handleDeleteSnippet = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedCustom = snippets.filter(s => s.isCustom && s.id !== id);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCustom));
        setSnippets([...PRESET_SNIPPETS, ...updatedCustom]);

        if (selectedSnippetId === id) {
            resetPractice(PRESET_SNIPPETS[0].id);
        }
        toast.success('ลบโค้ดเรียบร้อย');
    };

    // Authorization Guard
    if (status === 'loading') {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#0c648b] border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-600 font-medium">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</p>
                </div>
            </div>
        );
    }

    if (!session || !userIsAdmin) {
        return (
            <div className="min-h-[75vh] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">โหมดเฉพาะผู้ดูแลระบบ (Private Dev Mode)</h2>
                    <p className="text-sm text-gray-500 leading-relaxed mb-6">
                        โหมดฝึกพิมพ์โค้ดนี้ถูกตั้งค่าไว้เฉพาะสำหรับบัญชีของคุณคนเดียว หากต้องการเข้าใช้งาน กรุณาเข้าสู่ระบบด้วยบัญชี Admin ของคุณ
                    </p>
                    <div className="flex flex-col gap-3">
                        {!session ? (
                            <Link
                                href="/login"
                                className="w-full py-3 bg-[#0c648b] text-white rounded-xl font-bold text-sm hover:bg-[#094e6d] transition shadow-md"
                            >
                                เข้าสู่ระบบด้วย Google
                            </Link>
                        ) : (
                            <p className="text-xs text-red-500 font-medium bg-red-50 py-2 rounded-lg">
                                บัญชีปัจจุบัน ({session.user?.email}) ไม่มีสิทธิ์เข้าถึงโหมดนี้
                            </p>
                        )}
                        <Link
                            href="/"
                            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
                        >
                            กลับสู่หน้าแรก
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] py-6 px-3 sm:px-6 font-sans">
            <Toaster position="top-center" />

            <div className="max-w-6xl mx-auto space-y-6">

                {/* Top Navigation & Status */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-[#161b22] p-4 rounded-2xl border border-[#30363d] shadow-lg">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/farm"
                            className="p-2 text-gray-400 hover:text-white hover:bg-[#21262d] rounded-xl transition"
                            title="กลับหน้าฝึกพิมพ์"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30">
                                <Code2 size={20} />
                            </div>
                            <div>
                                <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                    Code Typing Arena
                                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono font-bold uppercase">
                                        Private Dev Mode
                                    </span>
                                </h1>
                                <p className="text-xs text-gray-400">ฝึกพิมพ์โค้ดจริง ฝึกความแม่นยำเครื่องหมายและ Indent</p>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar Actions */}
                    <div className="flex items-center gap-2">
                        {/* Sound Toggle */}
                        <button
                            type="button"
                            onClick={() => setIsSoundOn(!isSoundOn)}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${isSoundOn
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                                }`}
                            title={isSoundOn ? 'เปิดเสียงแป้นพิมพ์' : 'ปิดเสียง'}
                        >
                            {isSoundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        </button>

                        {/* Auto-indent Toggle */}
                        <button
                            type="button"
                            onClick={() => setAutoIndent(!autoIndent)}
                            className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${autoIndent
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : 'bg-gray-800 text-gray-400 border-gray-700'
                                }`}
                            title="เมื่อกด Enter จะเติมช่องว่างเยื้องให้อัตโนมัติ"
                        >
                            <Settings2 size={14} />
                            <span>Auto-Indent: {autoIndent ? 'ON' : 'OFF'}</span>
                        </button>

                        {/* Custom Code Button */}
                        <button
                            type="button"
                            onClick={() => setIsCustomModalOpen(true)}
                            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:from-blue-500 hover:to-indigo-500 transition shadow-md shadow-blue-900/30"
                        >
                            <Plus size={15} />
                            <span>ใส่โค้ดของคุณ</span>
                        </button>

                        {/* Reset Practice */}
                        <button
                            type="button"
                            onClick={() => resetPractice()}
                            className="p-2.5 bg-[#21262d] text-gray-300 hover:text-white hover:bg-[#30363d] rounded-xl border border-[#30363d] transition"
                            title="เริ่มพิมพ์ใหม่ (Reset)"
                        >
                            <RotateCcw size={16} />
                        </button>
                    </div>
                </div>

                {/* Snippet Selection Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-800">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0 px-2 flex items-center gap-1">
                        <Terminal size={14} />
                        Snippets:
                    </span>
                    {snippets.map(s => {
                        const isSelected = s.id === selectedSnippetId;
                        return (
                            <div
                                key={s.id}
                                onClick={() => resetPractice(s.id)}
                                className={`group shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium cursor-pointer transition border ${isSelected
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm'
                                    : 'bg-[#161b22] text-gray-400 border-[#30363d] hover:bg-[#21262d] hover:text-gray-200'
                                    }`}
                            >
                                <FileCode size={13} className={isSelected ? 'text-blue-400' : 'text-gray-500'} />
                                <span>{s.title}</span>
                                {s.isCustom && (
                                    <button
                                        type="button"
                                        onClick={(e) => handleDeleteSnippet(s.id, e)}
                                        className="text-gray-500 hover:text-red-400 transition ml-1"
                                        title="ลบโค้ดนี้"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Real-time Dashboard Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-[#161b22] p-3.5 rounded-2xl border border-[#30363d] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                            <Zap size={20} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase">WPM</p>
                            <p className="text-xl font-bold font-mono text-white">{wpm}</p>
                        </div>
                    </div>

                    <div className="bg-[#161b22] p-3.5 rounded-2xl border border-[#30363d] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                            <Terminal size={20} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase">CPM (Chars/min)</p>
                            <p className="text-xl font-bold font-mono text-white">{cpm}</p>
                        </div>
                    </div>

                    <div className="bg-[#161b22] p-3.5 rounded-2xl border border-[#30363d] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                            <Target size={20} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase">Accuracy</p>
                            <p className="text-xl font-bold font-mono text-white">{accuracy}%</p>
                        </div>
                    </div>

                    <div className="bg-[#161b22] p-3.5 rounded-2xl border border-[#30363d] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase">Time</p>
                            <p className="text-xl font-bold font-mono text-white">
                                {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                            </p>
                        </div>
                    </div>

                    <div className="bg-[#161b22] p-3.5 rounded-2xl border border-[#30363d] flex items-center gap-3 col-span-2 sm:col-span-1">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase">Errors</p>
                            <p className="text-xl font-bold font-mono text-white">{errorCount}</p>
                        </div>
                    </div>
                </div>

                {/* Code Editor Typing Arena */}
                <div
                    onClick={() => inputRef.current?.focus()}
                    className="relative bg-[#0d1117] rounded-2xl border border-[#30363d] shadow-2xl overflow-hidden cursor-text group"
                >
                    {/* Fake Editor Top Window Controls */}
                    <div className="bg-[#161b22] px-4 py-2.5 border-b border-[#30363d] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                            <span className="text-xs font-mono text-gray-400 ml-2">
                                {currentSnippet.title} ({currentSnippet.language})
                            </span>
                        </div>
                        <div className="text-xs font-mono text-gray-500">
                            Progress: {typed.length} / {targetCode.length} ({Math.round((typed.length / Math.max(1, targetCode.length)) * 100)}%)
                        </div>
                    </div>

                    {/* Hidden Textarea for Keyboard Input */}
                    <textarea
                        ref={inputRef}
                        value=""
                        onChange={() => { }}
                        onKeyDown={handleKeyDown}
                        className="opacity-0 absolute -top-9999px left-0 w-1 h-1 pointer-events-none"
                        autoFocus
                    />

                    {/* Code Display Area with Line Numbers */}
                    <div className="p-4 sm:p-6 overflow-x-auto font-mono text-sm leading-relaxed max-h-[550px] overflow-y-auto">
                        <div className="flex">
                            {/* Line Numbers */}
                            <div className="select-none text-gray-600 pr-4 text-right border-r border-[#30363d] mr-4 shrink-0 font-mono">
                                {targetCode.split('\n').map((_, index) => (
                                    <div key={index} className="leading-6">
                                        {index + 1}
                                    </div>
                                ))}
                            </div>

                            {/* Code Characters */}
                            <pre className="flex-1 whitespace-pre font-mono leading-6">
                                {targetCode.split('').map((char, index) => {
                                    const isTyped = index < typed.length;
                                    const isCurrent = index === typed.length;
                                    const isCorrect = isTyped && typed[index] === char;
                                    const isError = isTyped && typed[index] !== char;

                                    let className = 'text-[#7d8590]'; // Upcoming
                                    if (isCorrect) className = 'text-[#7ee787] bg-emerald-950/20'; // Correct (bright green)
                                    if (isError) className = 'text-[#ff7b72] bg-red-950/40 underline decoration-red-500'; // Error (red)

                                    if (isCurrent) {
                                        return (
                                            <span
                                                key={index}
                                                ref={activeCharRef}
                                                className="relative inline-block text-white bg-blue-600/40 border-b-2 border-blue-400 font-bold"
                                            >
                                                {char === '\n' ? '↵\n' : char}
                                            </span>
                                        );
                                    }

                                    return (
                                        <span key={index} className={className}>
                                            {char === '\n' ? '\n' : char}
                                        </span>
                                    );
                                })}
                            </pre>
                        </div>
                    </div>

                    {/* Focus Helper Prompt */}
                    <div className="bg-[#161b22]/70 px-4 py-2 border-t border-[#30363d] text-center text-xs text-gray-400 flex items-center justify-between">
                        <span>💡 กดเพื่อพิมพ์ได้ทันที (คลิกในกล่องโค้ดหากไม่ตอบสนอง)</span>
                        <span className="hidden sm:inline">กด <kbd className="px-1.5 py-0.5 bg-[#21262d] rounded border border-[#30363d] text-gray-300">Backspace</kbd> เพื่อลบคำผิด</span>
                    </div>
                </div>

            </div>

            {/* Completion Result Modal */}
            {isFinished && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#161b22] border border-[#30363d] rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                            <CheckCircle2 size={36} />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-1">พิมพ์โค้ดสำเร็จ! 🚀</h2>
                        <p className="text-sm text-gray-400 mb-6 font-mono">{currentSnippet.title}</p>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-[#0d1117] p-3 rounded-2xl border border-[#30363d]">
                                <p className="text-xs text-gray-400 font-bold uppercase">Speed (WPM)</p>
                                <p className="text-3xl font-bold font-mono text-amber-400 mt-1">{wpm}</p>
                            </div>
                            <div className="bg-[#0d1117] p-3 rounded-2xl border border-[#30363d]">
                                <p className="text-xs text-gray-400 font-bold uppercase">Accuracy</p>
                                <p className="text-3xl font-bold font-mono text-emerald-400 mt-1">{accuracy}%</p>
                            </div>
                            <div className="bg-[#0d1117] p-3 rounded-2xl border border-[#30363d]">
                                <p className="text-xs text-gray-400 font-bold uppercase">CPM</p>
                                <p className="text-2xl font-bold font-mono text-blue-400 mt-1">{cpm}</p>
                            </div>
                            <div className="bg-[#0d1117] p-3 rounded-2xl border border-[#30363d]">
                                <p className="text-xs text-gray-400 font-bold uppercase">Time Elapsed</p>
                                <p className="text-2xl font-bold font-mono text-purple-400 mt-1">
                                    {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => resetPractice()}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30"
                            >
                                <RotateCcw size={16} />
                                <span>พิมพ์อีกรอบ</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsFinished(false);
                                    setIsCustomModalOpen(true);
                                }}
                                className="flex-1 py-3 bg-[#21262d] hover:bg-[#30363d] text-gray-200 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 border border-[#30363d]"
                            >
                                <Plus size={16} />
                                <span>ใส่โค้ดใหม่</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Code Input Modal */}
            {isCustomModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#161b22] border border-[#30363d] rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative">
                        <button
                            type="button"
                            onClick={() => setIsCustomModalOpen(false)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                                <Code2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">ใส่โค้ดของคุณเพื่อฝึกพิมพ์</h3>
                                <p className="text-xs text-gray-400">วางโค้ดที่ต้องการซ้อมพิมพ์ ระบบจะบันทึกไว้ในเบราว์เซอร์ของคุณ</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveCustomSnippet} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">
                                        ชื่อโค้ด / หัวข้อ
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="เช่น Custom Login Hook, SQL Query..."
                                        value={customTitle}
                                        onChange={(e) => setCustomTitle(e.target.value)}
                                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">
                                        ภาษา (Language)
                                    </label>
                                    <select
                                        value={customLanguage}
                                        onChange={(e) => setCustomLanguage(e.target.value)}
                                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="typescript">TypeScript</option>
                                        <option value="javascript">JavaScript</option>
                                        <option value="python">Python</option>
                                        <option value="html">HTML</option>
                                        <option value="css">CSS</option>
                                        <option value="sql">SQL</option>
                                        <option value="cpp">C++</option>
                                        <option value="go">Go</option>
                                        <option value="rust">Rust</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">
                                    วางโค้ดที่นี่ (Paste Code)
                                </label>
                                <textarea
                                    rows={10}
                                    placeholder={`// วางโค้ดที่คุณต้องการฝึกพิมพ์ได้เลย...\nconst greet = () => {\n  console.log("Hello World");\n};`}
                                    value={customCode}
                                    onChange={(e) => setCustomCode(e.target.value)}
                                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 text-xs sm:text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCustomModalOpen(false)}
                                    className="px-4 py-2.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded-xl text-xs font-bold transition"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-900/30"
                                >
                                    <Save size={14} />
                                    <span>บันทึกและเริ่มพิมพ์</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
