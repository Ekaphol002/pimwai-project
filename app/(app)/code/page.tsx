"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
    Code2,
    Lock,
    Volume2,
    VolumeX,
    Sparkles,
    CheckCircle2,
    Clock,
    Zap,
    Target,
    AlertCircle,
    ArrowLeft,
    FileCode,
    Terminal,
    X,
    Save,
    ChevronRight,
    RefreshCw,
    Plus,
    Trash2,
    Cloud,
    SunMedium
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { soundManager } from '@/lib/soundEffects';
import { toDateKey } from '@/lib/streakUtils';

interface CodeSnippet {
    id: string;
    title: string;
    language: string;
    code: string;
    isCustom?: boolean;
}

interface CodeWordToken {
    globalIdx: number;
    word: string;
    lineNum: number;
    isLastInLine: boolean;
}

interface CodeLine {
    lineNum: number;
    indentation: string;
    isEmpty: boolean;
    words: CodeWordToken[];
}

type ContrastLevel = 'light' | 'medium' | 'high' | 'solid';

const CONTRAST_CONFIG: Record<ContrastLevel, { label: string; textClass: string; desc: string }> = {
    light: { label: 'อ่อน', textClass: 'text-gray-300 dark:text-gray-600', desc: '30%' },
    medium: { label: 'ปานกลาง', textClass: 'text-gray-400 dark:text-gray-500', desc: '50%' },
    high: { label: 'คมชัด', textClass: 'text-gray-500 dark:text-gray-400', desc: '70%' },
    solid: { label: 'เข้มชัดเจน', textClass: 'text-gray-700 dark:text-gray-200', desc: '90%' },
};

const PRESET_SNIPPETS: CodeSnippet[] = [
    {
        id: 'react-hook',
        title: 'React useDebounce',
        language: 'TypeScript',
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
        title: 'Next.js API Route',
        language: 'TypeScript',
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
        title: 'Python Quicksort',
        language: 'Python',
        code: `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)`
    },
    {
        id: 'sql-query',
        title: 'SQL Leaderboard Query',
        language: 'SQL',
        code: `SELECT u.id, u.name, u.xp,
       RANK() OVER (ORDER BY u.xp DESC) as rank_pos
FROM "User" u
WHERE u."showInLeaderboard" = true
ORDER BY u.xp DESC
LIMIT 50;`
    }
];

const getCodeStorageKey = (email?: string | null) =>
    email ? `pimwai_custom_code_${email}` : 'pimwai_custom_code_guest';
const LOCAL_STORAGE_CONTRAST_KEY = 'pimwai_code_contrast';

// สร้าง Storage Key สำหรับจำเวลาพิมพ์โค้ดของวันนี้ (ตัดรอบเที่ยงคืนเวลาไทย)
const getTodayTimeStorageKey = (email?: string | null) => {
    const todayStr = toDateKey(new Date());
    return email
        ? `pimwai_code_today_time_${email}_${todayStr}`
        : `pimwai_code_today_time_guest_${todayStr}`;
};

// แปลงเวลาเป็นข้อความภาษาไทยตามสูตร Farm Mode (เช่น "1 ชม. 25 นาที" หรือ "45 นาที 10 วิ" หรือ "15 วิ")
const formatFarmTimeDetailed = (totalSec: number) => {
    if (!totalSec || totalSec <= 0) return "0 วิ";
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (hours > 0) {
        return `${hours} ชม. ${minutes > 0 ? `${minutes} นาที` : ''} ${seconds > 0 ? `${seconds} วิ` : ''}`.trim();
    }
    if (minutes > 0) {
        return `${minutes} นาที ${seconds > 0 ? `${seconds} วิ` : ''}`.trim();
    }
    return `${seconds} วิ`;
};

// แปลงโค้ดเป็นบรรทัดและคำ โดยเก็บการเยื้อง (Indentation) และลำดับของแต่ละคำ
function parseCodeIntoLines(codeText: string): { lines: CodeLine[]; allTokens: CodeWordToken[] } {
    const rawLines = codeText.replace(/\r\n/g, '\n').split('\n');
    const lines: CodeLine[] = [];
    const allTokens: CodeWordToken[] = [];
    let globalCounter = 0;

    rawLines.forEach((rawLine, lIdx) => {
        const lineNum = lIdx + 1;
        const indentMatch = rawLine.match(/^[ \t]+/);
        const indentation = indentMatch ? indentMatch[0] : '';
        const trimmed = rawLine.slice(indentation.length);

        if (trimmed.length === 0) {
            lines.push({
                lineNum,
                indentation,
                isEmpty: true,
                words: []
            });
            return;
        }

        const rawWords = trimmed.split(/ +/).filter(w => w.length > 0);
        const wordsOnLine: CodeWordToken[] = rawWords.map((w, wIdx) => {
            const token: CodeWordToken = {
                globalIdx: globalCounter++,
                word: w,
                lineNum,
                isLastInLine: wIdx === rawWords.length - 1
            };
            allTokens.push(token);
            return token;
        });

        lines.push({
            lineNum,
            indentation,
            isEmpty: false,
            words: wordsOnLine
        });
    });

    return { lines, allTokens };
}

export default function CodeTypingPage() {
    const { data: session } = useSession();

    // Snippets state
    const [snippets, setSnippets] = useState<CodeSnippet[]>(PRESET_SNIPPETS);
    const [selectedSnippetId, setSelectedSnippetId] = useState<string>(PRESET_SNIPPETS[0].id);
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [isSavingToServer, setIsSavingToServer] = useState(false);

    // Contrast Level for Target Follow Text (ความเข้มตัวพิมพ์ตาม)
    const [contrastLevel, setContrastLevel] = useState<ContrastLevel>('medium');

    // Form state for creating custom snippet
    const [customTitle, setCustomTitle] = useState('');
    const [customLanguage, setCustomLanguage] = useState('TypeScript');
    const [customCode, setCustomCode] = useState('');

    // Load saved contrast level
    useEffect(() => {
        try {
            const savedContrast = localStorage.getItem(LOCAL_STORAGE_CONTRAST_KEY);
            if (savedContrast && savedContrast in CONTRAST_CONFIG) {
                setContrastLevel(savedContrast as ContrastLevel);
            }
        } catch {
            // ignore
        }
    }, []);

    const handleContrastChange = (level: ContrastLevel) => {
        setContrastLevel(level);
        try {
            localStorage.setItem(LOCAL_STORAGE_CONTRAST_KEY, level);
        } catch {
            // ignore
        }
    };

    // Load snippets from database (Account) & localStorage
    useEffect(() => {
        let isMounted = true;

        async function fetchSnippets() {
            try {
                // 1. Initial fast load from account-specific localStorage
                const storageKey = getCodeStorageKey(session?.user?.email);
                let localCustom: CodeSnippet[] = [];
                let saved = localStorage.getItem(storageKey);
                if (!saved && !session?.user?.email) {
                    saved = localStorage.getItem('pimwai_custom_code_snippets');
                }
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        localCustom = parsed;
                    }
                }

                // 2. If logged in, fetch saved snippets from PostgreSQL database account
                if (session?.user?.email) {
                    const res = await fetch('/api/code/snippets');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && Array.isArray(data.snippets)) {
                            const serverSnippets: CodeSnippet[] = data.snippets;
                            const serverIds = new Set(serverSnippets.map(s => s.id));
                            const combined = [...serverSnippets];

                            // Include any local snippets not yet synced to server
                            for (const loc of localCustom) {
                                if (!serverIds.has(loc.id) && !serverSnippets.some(s => s.title === loc.title && s.code === loc.code)) {
                                    combined.push(loc);
                                }
                            }

                            if (isMounted) {
                                setSnippets([...PRESET_SNIPPETS, ...combined]);
                                localStorage.setItem(storageKey, JSON.stringify(combined));
                                return;
                            }
                        }
                    }
                }

                if (isMounted) {
                    setSnippets([...PRESET_SNIPPETS, ...localCustom]);
                }
            } catch (e) {
                console.error('Failed to load code snippets', e);
            }
        }

        fetchSnippets();
        return () => { isMounted = false; };
    }, [session?.user?.email]);

    const currentSnippet = useMemo(() => {
        return snippets.find(s => s.id === selectedSnippetId) || snippets[0];
    }, [snippets, selectedSnippetId]);

    // ⚡ Performance Optimization for Low-End PCs: Memoize parsing so it runs ONLY when snippet changes, NOT on every keystroke!
    const { lines, allTokens } = useMemo(() => {
        return parseCodeIntoLines(currentSnippet.code);
    }, [currentSnippet.code]);

    // Farm Mode Typing Engine States
    const [activeWordIdx, setActiveWordIdx] = useState<number>(0);
    const [inputBuffer, setInputBuffer] = useState<string>('');
    const [typedWordsHistory, setTypedWordsHistory] = useState<{ [tokenIdx: number]: string }>({});
    const [completedWordsStatus, setCompletedWordsStatus] = useState<{ [tokenIdx: number]: 'correct' | 'incorrect' }>({});

    // Live Metrics
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [todayCodeTimeSeconds, setTodayCodeTimeSeconds] = useState<number>(0);
    const [isFinished, setIsFinished] = useState(false);
    const [totalKeystrokes, setTotalKeystrokes] = useState(0);
    const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
    const [errorCount, setErrorCount] = useState(0);
    const [isSoundOn, setIsSoundOn] = useState(true);

    // ⏱️ Refs สำหรับจับเวลาตามสูตร Farm Mode เป๊ะๆ (Active Typing Detection)
    const lastTypingTimeRef = useRef<number>(0);
    const lastTimerTickTimeRef = useRef<number>(0);
    const activeTypingAccumulatedMsRef = useRef<number>(0);

    // Smooth Floating Caret Coords
    const [caretCoords, setCaretCoords] = useState<{ left: number; top: number; height: number }>({ left: 0, top: 0, height: 0 });

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const textContainerRef = useRef<HTMLDivElement>(null);
    const wordElementsRef = useRef<{ [idx: number]: HTMLSpanElement | null }>({});
    const typedPartRef = useRef<HTMLSpanElement>(null);

    // ⏱️ โหลดเวลาวันนี้ที่บันทึกไว้ (ออกเข้าใหม่ก็ยังเก็บ ไม่หาย)
    useEffect(() => {
        try {
            const key = getTodayTimeStorageKey(session?.user?.email);
            const saved = localStorage.getItem(key);
            if (saved) {
                const parsed = parseInt(saved, 10);
                if (!isNaN(parsed) && parsed > 0) {
                    setTodayCodeTimeSeconds(parsed);
                    return;
                }
            }
            setTodayCodeTimeSeconds(0);
        } catch {
            setTodayCodeTimeSeconds(0);
        }
    }, [session?.user?.email]);

    // ⚡ Fast & Lightweight Caret Position Calculation using offsetLeft/offsetTop (Zero expensive getBoundingClientRect reflows!)
    const updateCaretPosition = useCallback(() => {
        const currentWordEl = wordElementsRef.current[activeWordIdx];
        if (!currentWordEl || !textContainerRef.current) return;

        let typedWidth = 0;
        if (typedPartRef.current) {
            typedWidth = typedPartRef.current.offsetWidth;
        }

        const caretHeight = 22;
        const left = currentWordEl.offsetLeft + typedWidth;
        const top = currentWordEl.offsetTop + Math.max(0, (currentWordEl.offsetHeight - caretHeight) / 2);

        setCaretCoords({ left, top, height: caretHeight });
    }, [activeWordIdx, inputBuffer]);

    // Update Caret position on keystroke (lightweight)
    useEffect(() => {
        updateCaretPosition();
    }, [activeWordIdx, inputBuffer, updateCaretPosition]);

    // ⚡ Performance Fix: Only scroll when activeWordIdx changes (NEVER on every keystroke in inputBuffer!)
    useEffect(() => {
        const currentWordEl = wordElementsRef.current[activeWordIdx];
        if (currentWordEl && textContainerRef.current) {
            const wordTop = currentWordEl.offsetTop;
            const containerScrollTop = textContainerRef.current.scrollTop;
            const containerHeight = textContainerRef.current.clientHeight;

            // Scroll only when exiting visible boundary to eliminate animation lag
            if (wordTop < containerScrollTop + 30 || wordTop > containerScrollTop + containerHeight - 70) {
                textContainerRef.current.scrollTo({
                    top: Math.max(0, wordTop - 50),
                    behavior: 'smooth'
                });
            }
        }
    }, [activeWordIdx]);

    useEffect(() => {
        window.addEventListener('resize', updateCaretPosition);
        return () => window.removeEventListener('resize', updateCaretPosition);
    }, [updateCaretPosition]);

    // Reset practice
    const resetPractice = useCallback((newSnippetId?: string) => {
        if (newSnippetId) setSelectedSnippetId(newSnippetId);
        setActiveWordIdx(0);
        setInputBuffer('');
        setTypedWordsHistory({});
        setCompletedWordsStatus({});
        setStartTime(null);
        setElapsedSeconds(0);
        setIsFinished(false);
        setTotalKeystrokes(0);
        setCorrectKeystrokes(0);
        setErrorCount(0);
        lastTypingTimeRef.current = 0;
        lastTimerTickTimeRef.current = 0;
        activeTypingAccumulatedMsRef.current = 0;
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    // ⏱️ นับเวลาเล่นเฉพาะขณะกำลังพิมพ์อยู่จริง (สูตร Farm Mode เป๊ะ: ตรวจจับทุก 200ms และหยุดทันทีเมื่อหยุดพิมพ์เกิน 1.2 วินาที)
    useEffect(() => {
        if (!startTime || isFinished) return;

        lastTimerTickTimeRef.current = Date.now();

        const interval = setInterval(() => {
            const now = Date.now();
            const lastTick = lastTimerTickTimeRef.current || now;
            const deltaMs = Math.min(1000, Math.max(0, now - lastTick));
            lastTimerTickTimeRef.current = now;

            // ตรวจจับว่ากำลังพิมพ์อยู่จริง: มีการกดปุ่มพิมพ์ภายใน 1.2 วินาทีที่ผ่านมา
            const timeSinceLastKeypress = now - (lastTypingTimeRef.current || 0);
            const isActivelyTyping = timeSinceLastKeypress < 1200;

            if (isActivelyTyping) {
                activeTypingAccumulatedMsRef.current += deltaMs;

                // สะสมเวลาพิมพ์จริงครบทุกๆ 1,000 มิลลิวินาที (1 วินาทีเต็ม)
                while (activeTypingAccumulatedMsRef.current >= 1000) {
                    activeTypingAccumulatedMsRef.current -= 1000;
                    setElapsedSeconds(prev => prev + 1);
                    setTodayCodeTimeSeconds(prev => {
                        const nextSec = prev + 1;
                        try {
                            const key = getTodayTimeStorageKey(session?.user?.email);
                            localStorage.setItem(key, String(nextSec));
                        } catch {
                            // ignore
                        }
                        return nextSec;
                    });
                }
            } else {
                // ถ้าหยุดพิมพ์เกิน 1.2 วินาที ให้ตัดเศษ ms ทิ้ง เพื่อหยุดเวลาทันทีอย่างสมบูรณ์
                activeTypingAccumulatedMsRef.current = 0;
            }
        }, 200);

        return () => clearInterval(interval);
    }, [startTime, isFinished, session?.user?.email]);

    // Calculate metrics
    const wpm = useMemo(() => {
        if (!elapsedSeconds || elapsedSeconds === 0) return 0;
        const minutes = elapsedSeconds / 60;
        const words = correctKeystrokes / 5;
        return Math.round(words / minutes);
    }, [elapsedSeconds, correctKeystrokes]);

    const cpm = useMemo(() => {
        if (!elapsedSeconds || elapsedSeconds === 0) return 0;
        const minutes = elapsedSeconds / 60;
        return Math.round(correctKeystrokes / minutes);
    }, [elapsedSeconds, correctKeystrokes]);

    const accuracy = useMemo(() => {
        if (totalKeystrokes === 0) return 100;
        return Math.round((correctKeystrokes / totalKeystrokes) * 100);
    }, [totalKeystrokes, correctKeystrokes]);

    const currentToken = allTokens[activeWordIdx];

    // Handle typing events strictly following Farm Mode principle
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (isFinished || !currentToken) return;

        const now = Date.now();
        lastTypingTimeRef.current = now;

        // Start timer on first printable key
        if (!startTime && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            setStartTime(now);
        }

        const isSpace = e.key === ' ' || e.code === 'Space';
        const isEnter = e.key === 'Enter';

        // 1. กด SPACEBAR หรือ ENTER เมื่อจบคำ
        if (isSpace || (isEnter && currentToken.isLastInLine)) {
            e.preventDefault();

            // ไม่ให้กดข้ามถ้ายังไม่ได้เริ่มพิมพ์ในคำนั้น (เหมือนโหมดฟาร์ม)
            if (inputBuffer.length === 0) return;

            if (isSoundOn) soundManager.playKeySound();

            const isWordCorrect = inputBuffer === currentToken.word;

            setTypedWordsHistory(prev => ({ ...prev, [activeWordIdx]: inputBuffer }));
            setCompletedWordsStatus(prev => ({
                ...prev,
                [activeWordIdx]: isWordCorrect ? 'correct' : 'incorrect'
            }));

            setTotalKeystrokes(prev => prev + 1);

            if (isWordCorrect) {
                setCorrectKeystrokes(prev => prev + 1);
            } else {
                setErrorCount(prev => prev + 1);
            }

            // ถ้าเป็นคำสุดท้าย
            if (activeWordIdx + 1 >= allTokens.length) {
                setIsFinished(true);
                toast.success('🎉 พิมพ์โค้ดเสร็จสมบูรณ์!');
                return;
            }

            setActiveWordIdx(prev => prev + 1);
            setInputBuffer('');
            return;
        }

        // 2. กด BACKSPACE (ลบทีละตัว / ถอยกลับคำก่อนหน้าได้)
        if (e.key === 'Backspace') {
            e.preventDefault();
            if (isSoundOn) soundManager.playKeySound();

            if (inputBuffer.length > 0) {
                setInputBuffer(prev => prev.slice(0, -1));
            } else if (activeWordIdx > 0) {
                const prevIdx = activeWordIdx - 1;
                const prevTyped = typedWordsHistory[prevIdx] || '';
                setActiveWordIdx(prevIdx);
                setInputBuffer(prevTyped);
            }
            return;
        }

        // ละเว้นปุ่มควบคุม
        if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            return;
        }

        // 3. พิมพ์ตัวอักษรปกติ (ตรวจจับทีละตัวทันทีที่กด เหมือนโหมดฟาร์ม)
        if (e.key.length === 1) {
            e.preventDefault();
            if (isSoundOn) soundManager.playKeySound(undefined, e as any);

            setTotalKeystrokes(prev => prev + 1);

            const nextCharIdx = inputBuffer.length;
            const targetChar = currentToken.word[nextCharIdx];
            const isCharCorrect = e.key === targetChar;

            if (isCharCorrect) {
                setCorrectKeystrokes(prev => prev + 1);
            } else {
                setErrorCount(prev => prev + 1);
            }

            setInputBuffer(prev => prev + e.key);
        }
    };

    // 💾 บันทึกโค้ดลงในรหัสบัญชี (Database Account) + สำรองใน localStorage
    const handleSaveCustomSnippet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customTitle.trim() || !customCode.trim()) {
            toast.error('กรุณาระบุชื่อและใส่โค้ดให้ครบถ้วน');
            return;
        }

        const cleanTitle = customTitle.trim();
        const cleanLanguage = customLanguage;
        const cleanCode = customCode.replace(/\r\n/g, '\n');

        const tempId = `custom-${Date.now()}`;
        const newSnippet: CodeSnippet = {
            id: tempId,
            title: cleanTitle,
            language: cleanLanguage,
            code: cleanCode,
            isCustom: true
        };

        // แสดงผลทันทีในเครื่อง (Optimistic update)
        const existingCustom = snippets.filter(s => s.isCustom);
        const updatedCustom = [newSnippet, ...existingCustom];
        setSnippets([...PRESET_SNIPPETS, ...updatedCustom]);
        setSelectedSnippetId(newSnippet.id);
        resetPractice(newSnippet.id);

        setCustomTitle('');
        setCustomCode('');
        setIsCustomModalOpen(false);

        // เซฟลง localStorage ตามบัญชี
        const storageKey = getCodeStorageKey(session?.user?.email);
        try {
            localStorage.setItem(storageKey, JSON.stringify(updatedCustom));
        } catch {
            // ignore
        }

        // ☁️ เซฟลงในรหัสบัญชีผู้ใช้ใน Database
        if (session?.user?.email) {
            setIsSavingToServer(true);
            try {
                const res = await fetch('/api/code/snippets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: cleanTitle,
                        language: cleanLanguage,
                        code: cleanCode
                    })
                });
                const data = await res.json();
                if (data.success && data.snippet) {
                    const serverSnippet = data.snippet;
                    const finalCustom = [serverSnippet, ...existingCustom.filter(s => s.id !== tempId)];
                    setSnippets([...PRESET_SNIPPETS, ...finalCustom]);
                    setSelectedSnippetId(serverSnippet.id);
                    localStorage.setItem(storageKey, JSON.stringify(finalCustom));
                    toast.success('บันทึกโค้ดลงในบัญชีเรียบร้อย!');
                    return;
                }
            } catch (err) {
                console.error('Error saving snippet to server:', err);
            } finally {
                setIsSavingToServer(false);
            }
        }

        toast.success('บันทึกโค้ดของคุณเรียบร้อยแล้ว!');
    };

    // ลบ Custom Snippet ออกจากบัญชีและเครื่อง
    const handleDeleteSnippet = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const storageKey = getCodeStorageKey(session?.user?.email);
        const updatedCustom = snippets.filter(s => s.isCustom && s.id !== id);
        try {
            localStorage.setItem(storageKey, JSON.stringify(updatedCustom));
        } catch {
            // ignore
        }
        setSnippets([...PRESET_SNIPPETS, ...updatedCustom]);

        if (selectedSnippetId === id) {
            resetPractice(PRESET_SNIPPETS[0].id);
        }

        if (session?.user?.email && !id.startsWith('custom-')) {
            try {
                await fetch(`/api/code/snippets?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
            } catch (err) {
                console.error('Error deleting from server:', err);
            }
        }

        toast.success('ลบโค้ดเรียบร้อย');
    };



    const untypedClass = CONTRAST_CONFIG[contrastLevel].textClass;

    return (
        <div className="min-h-screen bg-[#f4f7fb] pt-6 pb-20 px-4 sm:px-6 flex flex-col items-center font-sans">
            <Toaster position="top-center" />

            <div className="w-full max-w-5xl flex flex-col gap-5">

                {/* 🌟 Top Control Pill - Pure White Card with Soft Shadow (สไตล์ Farm Mode) */}
                <div className="bg-white px-5 sm:px-6 py-3 rounded-3xl shadow-lg shadow-blue-500/5 border border-blue-50/60 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">

                    {/* Left: Snippets Selector */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Terminal size={15} className="text-[#5cb5db] mr-1 shrink-0" />
                        {snippets.map(s => {
                            const isSelected = s.id === selectedSnippetId;
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => resetPractice(s.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer text-xs sm:text-sm ${isSelected
                                        ? 'bg-[#5cb5db] text-white shadow-xs font-bold'
                                        : 'hover:text-[#5cb5db] hover:bg-gray-50'
                                        }`}
                                >
                                    <span>{s.title}</span>
                                    {s.isCustom && (
                                        <>
                                            <span title="บันทึกในบัญชีแล้ว">
                                                <Cloud size={11} className={isSelected ? 'text-white/80' : 'text-blue-400'} />
                                            </span>
                                            <span
                                                title="ลบโค้ด"
                                                onClick={(e) => handleDeleteSnippet(s.id, e)}
                                                className="hover:text-red-300 ml-0.5 cursor-pointer inline-flex items-center"
                                            >
                                                <Trash2 size={12} />
                                            </span>
                                        </>
                                    )}
                                </button>
                            );
                        })}

                        {/* Button: Add Custom Code */}
                        <button
                            type="button"
                            onClick={() => setIsCustomModalOpen(true)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition cursor-pointer font-bold text-xs sm:text-sm ml-1"
                        >
                            <Plus size={15} />
                            <span>ใส่โค้ดของคุณ</span>
                        </button>
                    </div>

                    {/* Right: Contrast Level Selector (ความเข้มตัวพิมพ์ตาม) & Sound */}
                    <div className="flex items-center gap-3">
                        {/* Contrast Selector */}
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-xl border border-gray-100 text-xs">
                            <SunMedium size={14} className="text-amber-500 shrink-0 ml-1" />
                            <span className="text-gray-400 font-medium hidden sm:inline mr-1">ความเข้ม:</span>
                            {(Object.keys(CONTRAST_CONFIG) as ContrastLevel[]).map(lvl => (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => handleContrastChange(lvl)}
                                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${contrastLevel === lvl
                                        ? 'bg-white text-gray-800 shadow-xs border border-gray-200'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    title={`ความเข้มตัวพิมพ์ตาม ${CONTRAST_CONFIG[lvl].desc}`}
                                >
                                    {CONTRAST_CONFIG[lvl].label}
                                </button>
                            ))}
                        </div>

                        {/* Sound Toggle */}
                        <button
                            type="button"
                            onClick={() => setIsSoundOn(!isSoundOn)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#5cb5db] transition-colors cursor-pointer"
                            title={isSoundOn ? "ปิดเสียงแป้นพิมพ์" : "เปิดเสียงแป้นพิมพ์"}
                        >
                            {isSoundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        </button>
                    </div>

                </div>

                {/* ⌨️ Main Typing Stream Box (กล่องสีขาวใหญ่ เหมือนโหมดฟาร์มเป๊ะ) */}
                <div
                    onClick={() => inputRef.current?.focus()}
                    className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-blue-500/5 relative min-h-[460px] flex flex-col justify-between overflow-hidden border border-blue-50 cursor-text"
                >
                    {/* Hidden Textarea for Input */}
                    <textarea
                        ref={inputRef}
                        value=""
                        onChange={() => { }}
                        onKeyDown={handleKeyDown}
                        className="opacity-0 absolute -top-9999px left-0 w-1 h-1 pointer-events-none"
                        autoFocus
                    />

                    {isFinished ? (
                        /* Results Screen inside Card */
                        <div className="py-6 flex flex-col justify-between flex-1">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center p-3.5 bg-emerald-50 text-emerald-500 rounded-3xl mb-4 border border-emerald-100">
                                    <CheckCircle2 size={44} />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight mb-2">
                                    ยอดเยี่ยม! คุณพิมพ์โค้ดชุดนี้ผ่านแล้ว
                                </h2>
                                <p className="text-sm text-gray-400">
                                    สถิติความเร็วและความแม่นยำในการพิมพ์โค้ด (Code Typing Practice)
                                </p>
                            </div>

                            {/* Stats Grid inside Result */}
                            <div className="my-8 flex flex-col items-center">
                                <div className="mb-6 flex flex-col items-center">
                                    <div className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-1">ความเร็วเฉลี่ย</div>
                                    <div className="text-6xl sm:text-7xl font-black text-[#5cb5db] tracking-tight leading-none logo-font">
                                        {wpm}
                                    </div>
                                    <div className="text-xs font-bold text-[#5cb5db]/70 tracking-widest uppercase mt-1">wpm</div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 text-center w-full max-w-2xl pt-6 border-t border-gray-100">
                                    <div>
                                        <div className="text-sm sm:text-base font-bold text-gray-400 tracking-wider lowercase mb-1 logo-font">acc</div>
                                        <div className="text-2xl sm:text-3xl font-black text-emerald-600 leading-tight logo-font">
                                            {accuracy}%
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
                                            ความแม่นยำ
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm sm:text-base font-bold text-gray-400 tracking-wider lowercase mb-1 logo-font">cpm</div>
                                        <div className="text-2xl sm:text-3xl font-black text-purple-600 leading-tight logo-font">
                                            {cpm}
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
                                            ตัวอักษรต่อนาที
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm sm:text-base font-bold text-gray-400 tracking-wider lowercase mb-1 logo-font">errors</div>
                                        <div className="text-2xl sm:text-3xl font-black text-red-500 leading-tight logo-font">
                                            {errorCount}
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
                                            ครั้งที่พิมพ์ผิด
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm sm:text-base font-bold text-gray-400 tracking-wider lowercase mb-1 logo-font">time</div>
                                        <div className="text-2xl sm:text-3xl font-black text-gray-800 leading-tight logo-font">
                                            {elapsedSeconds}s
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
                                            ระยะเวลาที่ใช้
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Controls */}
                            <div className="flex flex-col items-center justify-center gap-4 pt-6 border-t border-gray-100">
                                <div className="flex items-center justify-center gap-10">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const nextIdx = (snippets.findIndex(s => s.id === selectedSnippetId) + 1) % snippets.length;
                                            resetPractice(snippets[nextIdx].id);
                                        }}
                                        className="text-gray-400 hover:text-[#5cb5db] transition-all duration-150 hover:scale-115 active:scale-90 cursor-pointer p-3 rounded-2xl select-none"
                                        title="โค้ดถัดไป"
                                    >
                                        <ChevronRight size={34} strokeWidth={2.8} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => resetPractice()}
                                        className="text-gray-400 hover:text-gray-800 transition-all duration-150 hover:scale-115 active:scale-90 cursor-pointer p-3 rounded-2xl select-none"
                                        title="พิมพ์ซ้ำ (โค้ดเดิม)"
                                    >
                                        <RefreshCw size={28} strokeWidth={2.8} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Top Stats Header inside card */}
                            <div className="flex items-center justify-between gap-4 pb-4 mb-3 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1 bg-gradient-to-r from-[#0c648b] to-[#5cb5db] text-white font-black text-xs rounded-full uppercase tracking-wider shadow-xs">
                                        {currentSnippet.title}
                                    </div>
                                    <span className="px-2.5 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 font-bold text-[11px] rounded-full">
                                        {currentSnippet.language}
                                    </span>
                                </div>

                                {/* Right Area: เวลาวันนี้ (วางไว้ข้างซ้ายปุ่มรีเซ็ต ตามรูป) + Quick Reset Button */}
                                <div className="flex items-center gap-2.5 sm:gap-3.5 select-none">
                                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-400" title="เวลาพิมพ์โค้ดของวันนี้ทั้งหมด">
                                        <span>เวลาวันนี้:</span>
                                        <strong className="text-sm sm:text-base font-black text-gray-800 logo-font">
                                            {formatFarmTimeDetailed(todayCodeTimeSeconds)}
                                        </strong>
                                    </div>

                                    <div className="w-[1px] h-4 bg-gray-200 hidden sm:block"></div>

                                    <button
                                        type="button"
                                        onClick={() => resetPractice()}
                                        className="text-gray-400 hover:text-gray-700 hover:scale-110 active:scale-95 transition cursor-pointer p-1.5"
                                        title="เริ่มใหม่ (Restart)"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* ⌨️ Code Text Stream Area (Farm Mode Ultra-Smooth Engine) */}
                            <div
                                ref={textContainerRef}
                                className="relative flex-1 overflow-x-auto overflow-y-auto max-h-[380px] font-mono text-lg sm:text-xl leading-relaxed py-4 pr-2 antialiased select-none"
                            >
                                {/* 🎯 Farm Mode Container-Level Floating Caret (เลื่อนสมูท นุ่มนวล ไม่ดันตัวหนังสือ 100%) */}
                                {!isFinished && caretCoords.height > 0 && (
                                    <div
                                        className="absolute left-0 top-0 w-[2.5px] bg-[#5cb5db] rounded-full pointer-events-none z-30 animate-pulse"
                                        style={{
                                            height: `${caretCoords.height}px`,
                                            transform: `translate3d(${caretCoords.left}px, ${caretCoords.top}px, 0)`,
                                            transition: 'transform 80ms ease-out',
                                            willChange: 'transform',
                                        }}
                                    />
                                )}

                                {/* Reference span สำหรับวัดความกว้างของตัวที่พิมพ์ในคำ เพื่อวางตำแหน่ง Caret ให้เป๊ะ */}
                                <span
                                    ref={typedPartRef}
                                    aria-hidden="true"
                                    className="opacity-0 pointer-events-none absolute left-0 top-0 select-none font-mono text-lg sm:text-xl whitespace-pre"
                                >
                                    {currentToken ? currentToken.word.slice(0, Math.min(inputBuffer.length, currentToken.word.length)) : ''}
                                    {currentToken && inputBuffer.length > currentToken.word.length ? inputBuffer.slice(currentToken.word.length) : ''}
                                </span>

                                {lines.map((line) => {
                                    return (
                                        <div key={line.lineNum} className="flex items-baseline leading-8 min-h-[32px]">
                                            {/* Line Number */}
                                            <div className="select-none text-gray-300 pr-4 text-right border-r border-gray-100 mr-4 shrink-0 font-mono text-sm w-8">
                                                {line.lineNum}
                                            </div>

                                            {/* Code Line Content with Static Monospace Spaces */}
                                            <div className="flex-1 whitespace-pre flex flex-wrap items-baseline font-mono">
                                                {/* Line Indentation */}
                                                {line.indentation && (
                                                    <span className="select-none text-transparent font-mono">
                                                        {line.indentation}
                                                    </span>
                                                )}

                                                {/* Words on this line */}
                                                {line.words.map((wToken) => {
                                                    const isCompleted = wToken.globalIdx < activeWordIdx;
                                                    const isActive = wToken.globalIdx === activeWordIdx;
                                                    const targetWord = wToken.word;
                                                    const targetChars = targetWord.split('');

                                                    return (
                                                        <React.Fragment key={wToken.globalIdx}>
                                                            <span
                                                                ref={el => { wordElementsRef.current[wToken.globalIdx] = el; }}
                                                                className="relative inline-flex items-baseline font-mono"
                                                            >
                                                                {/* 🔒 ทุกตัวอักษรมีโครงสร้าง DOM เท่ากัน 100% ป้องกันตัวอักษรขยับหรือกระตุก */}
                                                                {targetChars.map((char, cIdx) => {
                                                                    let colorClass = untypedClass;

                                                                    if (isCompleted) {
                                                                        const userTyped = typedWordsHistory[wToken.globalIdx] || '';
                                                                        const isCorrect = cIdx < userTyped.length && userTyped[cIdx] === char;
                                                                        colorClass = isCorrect ? 'text-gray-800' : 'text-red-500';
                                                                    } else if (isActive) {
                                                                        const isTyped = cIdx < inputBuffer.length;
                                                                        if (isTyped) {
                                                                            const isCorrect = inputBuffer[cIdx] === char;
                                                                            colorClass = isCorrect ? 'text-gray-800' : 'text-red-500';
                                                                        }
                                                                    }

                                                                    return (
                                                                        <span key={cIdx} className={colorClass}>
                                                                            {char}
                                                                        </span>
                                                                    );
                                                                })}

                                                                {/* ตัวอักษรที่พิมพ์เกินคำเป้าหมาย (Overflow Characters) */}
                                                                {isActive && inputBuffer.length > targetWord.length && (
                                                                    <span className="text-red-500">
                                                                        {inputBuffer.slice(targetWord.length)}
                                                                    </span>
                                                                )}
                                                                {isCompleted && (typedWordsHistory[wToken.globalIdx]?.length || 0) > targetWord.length && (
                                                                    <span className="text-red-500">
                                                                        {typedWordsHistory[wToken.globalIdx].slice(targetWord.length)}
                                                                    </span>
                                                                )}
                                                            </span>

                                                            {/* Fixed Monospace Space between words */}
                                                            {!wToken.isLastInLine && (
                                                                <span className={`select-none font-mono ${untypedClass}`}> </span>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Bottom Helper Bar */}
                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#5cb5db] animate-ping" />
                                    <span>เคาะ <kbd className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-bold border border-gray-200">Spacebar</kbd> เพื่อจบคำ หรือ <kbd className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-bold border border-gray-200">Enter</kbd> เมื่อจบบรรทัด</span>
                                </div>
                                <div className="flex items-center gap-3 font-mono">
                                    <span>คำ: {activeWordIdx} / {allTokens.length}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

            </div>

            {/* 📝 Modal: ใส่โค้ดของคุณ (Custom Snippet Modal) */}
            {isCustomModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-blue-50">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-50 text-[#5cb5db] rounded-2xl">
                                    <FileCode size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-base">ใส่โค้ดที่คุณต้องการฝึก</h3>
                                    <p className="text-xs text-gray-400">บันทึกเชื่อมกับรหัสบัญชีของคุณ ใช้ได้ทุกเครื่องรวมถึงคอมวิทยาลัย</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCustomModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCustomSnippet} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    ชื่อชุดโค้ด
                                </label>
                                <input
                                    type="text"
                                    value={customTitle}
                                    onChange={(e) => setCustomTitle(e.target.value)}
                                    placeholder="เช่น My Algorithm, Auth Middleware..."
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#5cb5db] focus:bg-white transition"
                                    maxLength={40}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    ภาษา (Language)
                                </label>
                                <select
                                    value={customLanguage}
                                    onChange={(e) => setCustomLanguage(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#5cb5db] focus:bg-white transition cursor-pointer"
                                >
                                    <option value="TypeScript">TypeScript</option>
                                    <option value="JavaScript">JavaScript</option>
                                    <option value="Python">Python</option>
                                    <option value="HTML/CSS">HTML / CSS</option>
                                    <option value="SQL">SQL</option>
                                    <option value="C++">C++</option>
                                    <option value="Java">Java</option>
                                    <option value="Go">Go</option>
                                    <option value="PHP">PHP</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    โค้ด (วางโค้ดที่ต้องการฝึกพิมพ์ที่นี่)
                                </label>
                                <textarea
                                    value={customCode}
                                    onChange={(e) => setCustomCode(e.target.value)}
                                    rows={8}
                                    placeholder="// Paste your code here..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-mono text-xs sm:text-sm focus:outline-none focus:border-[#5cb5db] focus:bg-white transition"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCustomModalOpen(false)}
                                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 font-bold cursor-pointer"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingToServer}
                                    className="px-5 py-2.5 bg-[#5cb5db] hover:bg-[#4ba3c7] text-white text-sm font-bold rounded-2xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <Save size={16} />
                                    <span>{isSavingToServer ? 'กำลังบันทึกลงบัญชี...' : 'บันทึกลงบัญชี'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
