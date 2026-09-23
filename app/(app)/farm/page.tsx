"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
    Clock,
    Type,
    Hash,
    AtSign,
    Volume2,
    VolumeX,
    RotateCcw,
    RefreshCw,
    Flame,
    Zap,
    Sparkles,
    Star,
    Infinity as InfinityIcon,
    CheckCircle2,
    Shield,
    ShieldAlert,
    Award,
    ChevronRight,
    Info,
    X,
    Lock,
    Check
} from 'lucide-react';
import ExpBar from '@/components/ExpBar/ExpBar';
import { calculateRankInfo, getRankMultiplierConfig } from '@/lib/rankUtils';
import { soundManager } from '@/lib/soundEffects';
import { thaiKeyDisplayMap, thaiShiftKeyDisplayMap } from '@/lib/keyMaps';
import toast, { Toaster } from 'react-hot-toast';
import { MONKEYTYPE_THAI_WORDS } from '@/lib/thaiWords';

// คลังคำภาษาไทยมาตรฐาน Monkeytype (1,000 คำความถี่สูง ตรงตาม Monkeytype Official)
const BASE_THAI_WORDS = MONKEYTYPE_THAI_WORDS;

const PUNCTUATIONS = [",", ".", "-", "_", "?", "!", "(", ")", "\"", "/"];
const NUMBERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const UPPER_VOWELS = 'ิีึืั็';
const LOWER_VOWELS = 'ฺุู';
const TONES = '่้๊๋์';
const ALL_COMBINING_MARKS = UPPER_VOWELS + LOWER_VOWELS + TONES;

// ตรวจวรรณยุกต์ก่อนสระ ำ ตามลำดับการพิมพ์และ Unicode มาตรฐาน: พยัญชนะ -> วรรณยุกต์ -> สระ ำ (เช่น น้ำ = น + ้ + ำ)
export function toTypingOrder(text: string): string {
    return text.replace(/(\u0E33)([\u0E48-\u0E4B])/g, '$2$1');
}

// ลำดับการแสดงผลมาตรฐาน OpenType: วรรณยุกต์ ก่อน สระอำ
export function toStandardDisplayOrder(text: string): string {
    return text.replace(/(\u0E33)([\u0E48-\u0E4B])/g, '$2$1');
}

// ฟังก์ชันสุ่มชุดคำ (รองรับบัฟ Golden Rush: เพิ่มโอกาสเจอคำสีทองเป็น 15%)
function generateWordList(
    count: number,
    withPunct: boolean,
    withNum: boolean,
    hasIntermediatePerk: boolean = false
): { word: string; isGolden: boolean }[] {
    const list: { word: string; isGolden: boolean }[] = [];
    const goldenChance = hasIntermediatePerk ? 0.15 : 0.08;

    for (let i = 0; i < count; i++) {
        let base = BASE_THAI_WORDS[Math.floor(Math.random() * BASE_THAI_WORDS.length)];

        if (withNum && Math.random() < 0.25) {
            const num = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
            base = Math.random() < 0.5 ? `${base}${num}` : `${num}${base}`;
        }
        if (withPunct && Math.random() < 0.2) {
            const p = PUNCTUATIONS[Math.floor(Math.random() * PUNCTUATIONS.length)];
            base = `${base}${p}`;
        }

        // จัดลำดับการพิมพ์ภาษาไทยให้ถูกต้อง: ตรวจ ำ ก่อนวรรณยุกต์
        base = toTypingOrder(base);

        const isGolden = Math.random() < goldenChance;
        list.push({ word: base, isGolden });
    }
    return list;
}

export default function FarmPage() {
    const { data: session } = useSession();

    // Settings
    const [mode, setMode] = useState<'time' | 'words' | 'zen'>('zen');
    const [timeLimit, setTimeLimit] = useState<number>(30);
    const [wordLimit, setWordLimit] = useState<number>(50);
    const [includePunctuation, setIncludePunctuation] = useState<boolean>(false);
    const [includeNumbers, setIncludeNumbers] = useState<boolean>(false);
    const [isSoundOn, setIsSoundOn] = useState<boolean>(true);

    // Database & User EXP State
    const [userTotalExp, setUserTotalExp] = useState<number>(0);
    const [isUserLoaded, setIsUserLoaded] = useState<boolean>(false);

    // 🎖️ Lesson Perks System
    const [realLessonPerks, setRealLessonPerks] = useState<{
        beginner: boolean;
        intermediate: boolean;
        advanced: boolean;
    }>({
        beginner: false,
        intermediate: false,
        advanced: false
    });

    const [lessonPerks, setLessonPerks] = useState<{
        beginner: boolean;
        intermediate: boolean;
        advanced: boolean;
    }>({
        beginner: false,
        intermediate: false,
        advanced: false
    });

    // 🛡️ Perk State: Double Shield (Beginner)
    const [shieldsLeft, setShieldsLeft] = useState<number>(0);

    // 🔥 Perk State: Fever Mode (Advanced)
    const [isFeverActive, setIsFeverActive] = useState<boolean>(false);
    const [feverTimeLeft, setFeverTimeLeft] = useState<number>(0);

    // Modal State
    const [isPerkModalOpen, setIsPerkModalOpen] = useState<boolean>(false);

    // Floating Notification Toasts
    const [bountyToast, setBountyToast] = useState<{ id: number; text: string; amount: number; isGolden?: boolean } | null>(null);
    const [shieldToast, setShieldToast] = useState<{ id: number; text: string } | null>(null);

    // 🎈 Floating Word Badges (Bounty & Shield Protection บนหัวคำโดยตรง)
    const [wordFloatingBadges, setWordFloatingBadges] = useState<{
        id: number;
        wordIdx: number;
        type: 'bounty' | 'golden_bounty' | 'shield';
        text: string;
        amount?: number;
    }[]>([]);

    // Words & Typing State
    const [wordList, setWordList] = useState<{ word: string; isGolden: boolean }[]>([]);
    const [activeWordIdx, setActiveWordIdx] = useState<number>(0);
    const [inputBuffer, setInputBuffer] = useState<string>("");
    const [completedWordsStatus, setCompletedWordsStatus] = useState<('correct' | 'incorrect')[]>([]);
    const [typedWordsHistory, setTypedWordsHistory] = useState<string[]>([]);
    const [caretCoords, setCaretCoords] = useState<{ left: number; top: number; height: number }>({
        left: 0,
        top: 0,
        height: 0
    });
    const [isTyping, setIsTyping] = useState<boolean>(false);

    // Live Metrics
    const [combo, setCombo] = useState<number>(0);
    const [maxCombo, setMaxCombo] = useState<number>(0);
    const [multiplier, setMultiplier] = useState<number>(1.0);
    const [roundExpEarned, setRoundExpEarned] = useState<number>(0);
    const [sessionExpEarned, setSessionExpEarned] = useState<number>(0);
    const [currentWpm, setCurrentWpm] = useState<number>(0);
    const [accuracy, setAccuracy] = useState<number>(100);

    // Counters for Stats
    const [correctKeystrokes, setCorrectKeystrokes] = useState<number>(0);
    const [totalKeystrokes, setTotalKeystrokes] = useState<number>(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(30);
    const [isFinished, setIsFinished] = useState<boolean>(false);
    const [endTime, setEndTime] = useState<number | null>(null);

    const typingContainerRef = useRef<HTMLDivElement>(null);
    const wordElementsRef = useRef<(HTMLSpanElement | null)[]>([]);
    const typedPartRef = useRef<HTMLSpanElement>(null);
    const pendingSyncExpRef = useRef<number>(0);
    const lastSyncTimeRef = useRef<number>(Date.now());
    const maxExpCharIdxRef = useRef<number>(0);
    const currentRoundStartingWordsRef = useRef<{ word: string; isGolden: boolean }[]>([]);

    // 🔒 Anti-Exploit Tracking Refs
    // 1. ตรวจจับการกด Backspace ในคำปัจจุบัน (ถ้ากด จะหมดสิทธิ์รับ Flawless Bounty ทันที)
    const wordHasBackspaceRef = useRef<boolean>(false);
    // 2. ป้องกันการปั๊ม EXP: แต่ละ index ของคำจะได้รางวัล Flawless เพียง 1 ครั้งเท่านั้น
    const rewardedWordIndicesRef = useRef<Set<number>>(new Set());

    // Sync Live Refs เพื่อป้องกัน Stale Closures ใน Event Listeners
    const shieldsLeftRef = useRef<number>(0);
    const lessonPerksRef = useRef(lessonPerks);
    const isFeverActiveRef = useRef<boolean>(false);
    const comboRef = useRef<number>(0);
    const userTotalExpRef = useRef<number>(userTotalExp);

    useEffect(() => { shieldsLeftRef.current = shieldsLeft; }, [shieldsLeft]);
    useEffect(() => { lessonPerksRef.current = lessonPerks; }, [lessonPerks]);
    useEffect(() => { isFeverActiveRef.current = isFeverActive; }, [isFeverActive]);
    useEffect(() => { comboRef.current = combo; }, [combo]);
    useEffect(() => { userTotalExpRef.current = userTotalExp; }, [userTotalExp]);

    // Helper Functions สำหรับแจ้งเตือน Toast
    const triggerBountyToast = useCallback((text: string, amount: number, isGolden: boolean = false) => {
        const id = Date.now();
        setBountyToast({ id, text, amount, isGolden });
        setTimeout(() => {
            setBountyToast(prev => prev?.id === id ? null : prev);
        }, 1800);
    }, []);

    const triggerShieldToast = useCallback((text: string) => {
        const id = Date.now();
        setShieldToast({ id, text });
        setTimeout(() => {
            setShieldToast(prev => prev?.id === id ? null : prev);
        }, 1800);
    }, []);

    // 🎈 ทริกเกอร์ให้ป๊อปอัปเด้งลอยขึ้นบนหัวคำนั้นโดยตรง (โบนัสเคาะถูก / โบนัสคำทอง / เกราะป้องกัน)
    const triggerWordFloater = useCallback((wordIdx: number, type: 'bounty' | 'golden_bounty' | 'shield', text: string, amount?: number) => {
        const id = Date.now() + Math.random();
        setWordFloatingBadges(prev => [...prev.slice(-5), { id, wordIdx, type, text, amount }]);
        setTimeout(() => {
            setWordFloatingBadges(prev => prev.filter(item => item.id !== id));
        }, 1450);
    }, []);

    // ตรวจจับการเลื่อนเมาส์: ให้เคอร์เซอร์กลับมากระพริบเมื่อเลื่อนเมาส์
    useEffect(() => {
        const handleMouseMove = () => {
            setIsTyping(false);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // คำนวณตำแหน่งเคอร์เซอร์ระดับคอนเทนเนอร์ ให้เลื่อนสมูททั้งตอนพิมพ์ กด space ข้ามคำ และขึ้น/ลงบรรทัดใหม่
    const updateCaretPosition = useCallback(() => {
        const currentWordEl = wordElementsRef.current[activeWordIdx];
        if (!currentWordEl) return;

        let typedWidth = 0;
        if (typedPartRef.current) {
            typedWidth = typedPartRef.current.offsetWidth;
        }

        const isGolden = wordList[activeWordIdx]?.isGolden;
        const left = currentWordEl.offsetLeft + typedWidth + (isGolden ? 6 : 0);
        const top = currentWordEl.offsetTop + 4;
        const height = Math.max(26, currentWordEl.offsetHeight - 8);

        setCaretCoords({ left, top, height });
    }, [activeWordIdx, wordList]);

    useEffect(() => {
        updateCaretPosition();
    }, [inputBuffer, activeWordIdx, updateCaretPosition]);

    useEffect(() => {
        const handleResize = () => updateCaretPosition();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [updateCaretPosition]);

    // 1. Fetch User Profile เมื่อเปิดหน้าเว็บ (รวม Lesson Perks และ Guest Mode)
    useEffect(() => {
        fetch('/api/user/profile')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.user) {
                    let exp = data.user.currentExp || 0;

                    // 🌟 ถ้าเคยเล่นในฐานะ Guest มาก่อนแล้วเพิ่งล็อกอินเข้ามา
                    try {
                        const savedGuestExp = localStorage.getItem('pimwai_guest_exp');
                        if (savedGuestExp) {
                            const parsedGuestExp = parseInt(savedGuestExp, 10);
                            if (!isNaN(parsedGuestExp) && parsedGuestExp > exp) {
                                const diffExp = parsedGuestExp - exp;
                                exp = parsedGuestExp;
                                // ซิงค์แต้มจาก Guest เข้าระบบบัญชีผู้ใช้
                                fetch('/api/farm/save', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ expEarned: diffExp })
                                });
                            }
                            localStorage.removeItem('pimwai_guest_exp');
                        }
                    } catch (e) { }

                    setUserTotalExp(exp);
                    userTotalExpRef.current = exp;
                    const perks = data.lessonPerks || data.user.lessonPerks || {
                        beginner: false,
                        intermediate: false,
                        advanced: false
                    };
                    setRealLessonPerks(perks);
                    setLessonPerks(perks);
                    lessonPerksRef.current = perks;
                    if (perks.beginner) {
                        setShieldsLeft(2);
                        shieldsLeftRef.current = 2;
                    }
                    // อัปเดตตัวคูณเริ่มต้นตามโปรไฟล์จริง
                    const rInfo = calculateRankInfo(exp);
                    const rCfg = getRankMultiplierConfig(rInfo.rank, rInfo.stars);
                    const baseMul = rCfg.totalBaseMultiplier + (perks.advanced ? 0.5 : 0);
                    setMultiplier(baseMul);
                    setIsUserLoaded(true);
                } else {
                    // 🌟 Guest Mode (ผู้เล่นไม่ได้ล็อกอิน): โหลด EXP ที่เคยบันทึกไว้ใน localStorage
                    try {
                        const savedGuestExp = localStorage.getItem('pimwai_guest_exp');
                        const guestExp = savedGuestExp ? parseInt(savedGuestExp, 10) || 0 : 0;
                        setUserTotalExp(guestExp);
                        userTotalExpRef.current = guestExp;
                        const rInfo = calculateRankInfo(guestExp);
                        const rCfg = getRankMultiplierConfig(rInfo.rank, rInfo.stars);
                        setMultiplier(rCfg.totalBaseMultiplier);
                    } catch (e) {
                        setUserTotalExp(0);
                        userTotalExpRef.current = 0;
                    }
                    setIsUserLoaded(true);
                }
            })
            .catch(() => {
                // 🌟 Guest Mode Fallback
                try {
                    const savedGuestExp = localStorage.getItem('pimwai_guest_exp');
                    const guestExp = savedGuestExp ? parseInt(savedGuestExp, 10) || 0 : 0;
                    setUserTotalExp(guestExp);
                    userTotalExpRef.current = guestExp;
                    const rInfo = calculateRankInfo(guestExp);
                    const rCfg = getRankMultiplierConfig(rInfo.rank, rInfo.stars);
                    setMultiplier(rCfg.totalBaseMultiplier);
                } catch (e) {
                    setUserTotalExp(0);
                    userTotalExpRef.current = 0;
                }
                setIsUserLoaded(true);
            });
    }, [session?.user?.email]);

    // 2. เริ่มต้นหรือเริ่มรอบคำต่อไป (คำต่อไป / Next Words)
    const nextNewWords = useCallback(() => {
        const count = mode === 'words' ? wordLimit : 100;
        const newWords = generateWordList(count, includePunctuation, includeNumbers, lessonPerksRef.current.intermediate);
        currentRoundStartingWordsRef.current = newWords;
        setWordList(newWords);
        setActiveWordIdx(0);
        setInputBuffer("");
        maxExpCharIdxRef.current = 0;
        setCompletedWordsStatus([]);
        setTypedWordsHistory([]);
        setCombo(0);

        // รีเซ็ตการป้องกันบั๊ก & ฟาร์ม EXP
        wordHasBackspaceRef.current = false;
        rewardedWordIndicesRef.current.clear();
        setWordFloatingBadges([]);

        // รีเซ็ตเกราะและ Fever
        setShieldsLeft(lessonPerksRef.current.beginner ? 2 : 0);
        setIsFeverActive(false);
        setFeverTimeLeft(0);

        // คำนวณ Base Multiplier จาก Rank ปัจจุบัน
        const rInfo = calculateRankInfo(userTotalExpRef.current);
        const rCfg = getRankMultiplierConfig(rInfo.rank, rInfo.stars);
        const baseMul = rCfg.totalBaseMultiplier + (lessonPerksRef.current.advanced ? 0.5 : 0);
        const initialMul = Number((baseMul + (newWords[0]?.isGolden ? 1.0 : 0)).toFixed(2));
        setMultiplier(initialMul);

        setCurrentWpm(0);
        setAccuracy(100);
        setCorrectKeystrokes(0);
        setTotalKeystrokes(0);
        setRoundExpEarned(0);
        setStartTime(null);
        setTimeLeft(timeLimit);
        setIsFinished(false);
        setEndTime(null);
    }, [mode, wordLimit, timeLimit, includePunctuation, includeNumbers]);

    // เล่นซ้ำคำเดิม (คำเดิม / Repeat Same Words)
    const repeatSameWords = useCallback(() => {
        const wordsToRepeat = currentRoundStartingWordsRef.current.length > 0
            ? currentRoundStartingWordsRef.current
            : wordList;
        setWordList([...wordsToRepeat]);
        setActiveWordIdx(0);
        setInputBuffer("");
        maxExpCharIdxRef.current = 0;
        setCompletedWordsStatus([]);
        setTypedWordsHistory([]);
        setCombo(0);

        wordHasBackspaceRef.current = false;
        rewardedWordIndicesRef.current.clear();
        setWordFloatingBadges([]);

        setShieldsLeft(lessonPerksRef.current.beginner ? 2 : 0);
        setIsFeverActive(false);
        setFeverTimeLeft(0);

        const rInfo = calculateRankInfo(userTotalExpRef.current);
        const rCfg = getRankMultiplierConfig(rInfo.rank, rInfo.stars);
        const baseMul = rCfg.totalBaseMultiplier + (lessonPerksRef.current.advanced ? 0.5 : 0);
        const initialMul = Number((baseMul + (wordsToRepeat[0]?.isGolden ? 1.0 : 0)).toFixed(2));
        setMultiplier(initialMul);

        setCurrentWpm(0);
        setAccuracy(100);
        setCorrectKeystrokes(0);
        setTotalKeystrokes(0);
        setRoundExpEarned(0);
        setStartTime(null);
        setTimeLeft(timeLimit);
        setIsFinished(false);
        setEndTime(null);
    }, [timeLimit, wordList]);

    const resetGame = nextNewWords;

    useEffect(() => {
        resetGame();
    }, [resetGame]);

    // 3. Auto Scroll ข้อความตามคำที่กำลังพิมพ์ (แสดง 3 บรรทัด และเมื่อถึงบรรทัดที่ 3 ให้ดันบรรทัดที่ 1 ขึ้นไป)
    useEffect(() => {
        const currentEl = wordElementsRef.current[activeWordIdx];
        const container = typingContainerRef.current;
        if (currentEl && container) {
            const firstWordEl = wordElementsRef.current[0];
            const baseTop = firstWordEl ? firstWordEl.offsetTop : container.offsetTop;
            const relativeTop = currentEl.offsetTop - baseTop;

            // บรรทัดที่ 1: ~0px, บรรทัดที่ 2: ~55-65px, บรรทัดที่ 3: ~115-130px
            if (relativeTop > 90) {
                const scrollY = relativeTop - 58;
                container.scrollTo({ top: scrollY, behavior: 'smooth' });
            } else {
                container.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    }, [activeWordIdx]);

    // 4. Time Mode Timer
    useEffect(() => {
        if (mode !== 'time' || !startTime || isFinished) return;

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, timeLimit - elapsed);
            setTimeLeft(remaining);

            if (remaining === 0) {
                setEndTime(Date.now());
                setIsFinished(true);
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [mode, startTime, timeLimit, isFinished]);

    // 5. Fever Mode Timer (บัฟ Advanced: 5 วินาที EXP x2)
    useEffect(() => {
        if (!isFeverActive) return;

        const interval = setInterval(() => {
            setFeverTimeLeft(prev => {
                if (prev <= 1) {
                    setIsFeverActive(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isFeverActive]);

    // 6. ซิงค์ EXP สะสมขึ้นฐานข้อมูลอัตโนมัติ (Background Sync ทุกๆ 50+ EXP หรือเมื่อจบเกม)
    const syncExpToDatabase = useCallback(async (expToSync: number) => {
        if (expToSync <= 0) return;

        const timeSpentSeconds = Math.max(1, Math.round((Date.now() - (lastSyncTimeRef.current || Date.now())) / 1000));
        lastSyncTimeRef.current = Date.now();

        // 🌟 บันทึกลง LocalStorage เสมอ (สำหรับ Guest และเป็น Local Backup ของผู้ใช้)
        try {
            localStorage.setItem('pimwai_guest_exp', String(userTotalExpRef.current));
        } catch (e) { }

        // ถ้าล็อกอินอยู่ ให้ส่งไปบันทึกลง Database ของเซิร์ฟเวอร์
        if (session?.user) {
            try {
                await fetch('/api/farm/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        expEarned: expToSync,
                        wpm: currentWpm,
                        accuracy: accuracy,
                        wordsCount: activeWordIdx,
                        timeSpentSeconds: timeSpentSeconds
                    })
                });
            } catch (e) {
                console.error("Sync farm exp error:", e);
            }
        }
    }, [session, currentWpm, accuracy, activeWordIdx]);

    // 7. Keyboard Event Handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore Special Navigation Keys
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key === 'Tab') {
                e.preventDefault();
                resetGame();
                return;
            }

            if (isFinished) return;

            // เมื่อเริ่มพิมพ์ ให้หยุดการกระพริบของเคอร์เซอร์ทันที
            setIsTyping(true);

            const targetWordObj = wordList[activeWordIdx];
            if (!targetWordObj) return;

            const targetWord = targetWordObj.word;

            // Start Timer on First Keypress
            if (!startTime) {
                setStartTime(Date.now());
            }

            // คำนวณ Base Multiplier & Cap ตาม Rank ปัจจุบัน
            const rInfo = calculateRankInfo(userTotalExpRef.current);
            const rCfg = getRankMultiplierConfig(rInfo.rank, rInfo.stars);
            const baseRankMul = rCfg.totalBaseMultiplier + (lessonPerksRef.current.advanced ? 0.5 : 0);
            const maxCap = rCfg.maxMultiplierCap + (lessonPerksRef.current.advanced ? 10.0 : 0);

            // A. กด SPACEBAR (ข้ามไปยังคำถัดไป ถ้าพิมพ์ตัวแรกไปแล้ว)
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                // 1. จะกดเว้นวรรคไม่ได้ ถ้ายังไม่ได้พิมพ์ตัวแรกของคำนั้น (กันสแปม Spacebar)
                if (inputBuffer.length === 0) return;

                if (isSoundOn) soundManager.playKeySound();

                const isWordFullyCorrect = inputBuffer === targetWord;

                // บันทึกคำที่พิมพ์ไว้ในประวัติ
                const updatedHistory = [...typedWordsHistory];
                updatedHistory[activeWordIdx] = inputBuffer;
                setTypedWordsHistory(updatedHistory);

                const updatedStatus = [...completedWordsStatus];
                updatedStatus[activeWordIdx] = isWordFullyCorrect ? 'correct' : 'incorrect';
                setCompletedWordsStatus(updatedStatus);

                if (!isWordFullyCorrect) {
                    // ถ้าพิมพ์ไม่ครบ หรือมีตัวผิดตอนกดเว้นวรรคข้าม
                    if (shieldsLeftRef.current > 0) {
                        // 🛡️ Double Shield ทำงาน! ไม่เสียคอมโบ
                        const nextShields = Math.max(0, shieldsLeftRef.current - 1);
                        setShieldsLeft(nextShields);
                        shieldsLeftRef.current = nextShields;
                        triggerWordFloater(activeWordIdx, 'shield', '-1 ป้องกัน');
                    } else {
                        setCombo(0);
                        const nextWordIsGolden = wordList[activeWordIdx + 1]?.isGolden;
                        setMultiplier(Number((baseRankMul + (nextWordIsGolden ? 1.0 : 0)).toFixed(2)));
                    }
                } else {
                    // ✨ คำถูกต้องสมบูรณ์ 100%! ตรวจสอบเงื่อนไขรับ Flawless Bounty
                    // กฎป้องกันโกง:
                    // 1. ต้องไม่มีการกด Backspace ในคำนี้เลย (wordHasBackspaceRef === false)
                    // 2. index ของคำนี้ต้องไม่เคยได้รับรางวัลมาก่อน (rewardedWordIndicesRef.has === false)
                    if (!wordHasBackspaceRef.current && !rewardedWordIndicesRef.current.has(activeWordIdx)) {
                        rewardedWordIndicesRef.current.add(activeWordIdx);

                        let bountyExp = 0;
                        let isGoldenBounty = false;

                        if (targetWordObj.isGolden && lessonPerksRef.current.intermediate) {
                            // Intermediate Perk: Golden Word Bounty +15 EXP
                            const wordLen = targetWord.length;
                            bountyExp = 15 + Math.min(15, Math.max(0, (wordLen - 4) * 2));
                            isGoldenBounty = true;
                        } else if (lessonPerksRef.current.beginner) {
                            // Beginner Perk: Flawless Word Bounty ได้โบนัสจบคำสมดุลตามความยาวคำ
                            const wordLen = targetWord.length;
                            if (wordLen <= 3) {
                                bountyExp = 2;
                            } else if (wordLen <= 6) {
                                bountyExp = 4;
                            } else if (wordLen <= 9) {
                                bountyExp = 7;
                            } else {
                                bountyExp = Math.min(12, 8 + Math.floor((wordLen - 9) * 1));
                            }
                        }

                        if (bountyExp > 0) {
                            if (isFeverActiveRef.current) {
                                bountyExp *= 2; // บัฟ Fever Mode คูณสองให้ด้วย!
                            }
                            setRoundExpEarned(prev => prev + bountyExp);
                            setSessionExpEarned(prev => prev + bountyExp);
                            setUserTotalExp(prev => {
                                const nextTotal = prev + bountyExp;
                                userTotalExpRef.current = nextTotal;
                                if (!session?.user) {
                                    try {
                                        localStorage.setItem('pimwai_guest_exp', String(nextTotal));
                                    } catch (e) { }
                                }
                                return nextTotal;
                            });
                            pendingSyncExpRef.current += bountyExp;

                            // 🎈 แสดงข้อความลอยบนหัวคำโดยตรง (+EXP)
                            triggerWordFloater(
                                activeWordIdx,
                                isGoldenBounty ? 'golden_bounty' : 'bounty',
                                `+${bountyExp} EXP`,
                                bountyExp
                            );

                            if (pendingSyncExpRef.current >= 50) {
                                syncExpToDatabase(pendingSyncExpRef.current);
                                pendingSyncExpRef.current = 0;
                            }
                        }
                    }
                }

                // สุ่มเติมคำเพิ่มเรื่อยๆ ถ้าเป็นโหมด Zen
                if (mode === 'zen' && activeWordIdx + 15 >= wordList.length) {
                    const extraWords = generateWordList(50, includePunctuation, includeNumbers, lessonPerksRef.current.intermediate);
                    setWordList(prev => [...prev, ...extraWords]);
                }

                // ตรวจสอบจบในโหมด Words
                if (mode === 'words' && activeWordIdx + 1 >= wordLimit) {
                    setEndTime(Date.now());
                    setIsFinished(true);
                    setIsTyping(false);
                    syncExpToDatabase(pendingSyncExpRef.current);
                    pendingSyncExpRef.current = 0;
                    return;
                }

                // อัปเดต Multiplier สำหรับคำถัดไป (ถ้าคำถัดไปเป็นสีทองจะได้รับโบนัสทันที)
                const nextWordObj = wordList[activeWordIdx + 1];
                if (nextWordObj && isWordFullyCorrect) {
                    const comboBoost = Math.floor(comboRef.current / 10) * 0.2;
                    const goldenBoost = nextWordObj.isGolden ? 1.0 : 0;
                    const nextMul = Math.min(maxCap, Number((baseRankMul + comboBoost + goldenBoost).toFixed(2)));
                    setMultiplier(nextMul);
                }

                // เคลียร์สถานะ Backspace สำหรับคำใหม่
                wordHasBackspaceRef.current = false;

                // เคอร์เซอร์เลื่อนไปอยู่หน้าคำถัดไป
                setActiveWordIdx(prev => prev + 1);
                setInputBuffer("");
                maxExpCharIdxRef.current = 0;
                return;
            }

            // B. กด BACKSPACE (ลบตัวอักษร / ลบย้อนกลับไปคำก่อนหน้าได้)
            if (e.key === 'Backspace') {
                e.preventDefault();
                if (isSoundOn) soundManager.playKeySound();

                // 🔒 เมื่อกด Backspace จะถือว่าคำนี้ไม่ใช่ Flawless ทันที (ป้องกันการลบมาแก้คำ)
                wordHasBackspaceRef.current = true;

                if (inputBuffer.length > 0) {
                    setInputBuffer(prev => prev.slice(0, -1));
                } else if (activeWordIdx > 0) {
                    // ย้อนกลับไปแก้ไขคำก่อนหน้าได้
                    const prevIdx = activeWordIdx - 1;
                    const prevTyped = typedWordsHistory[prevIdx] ?? "";
                    setActiveWordIdx(prevIdx);
                    setInputBuffer(prevTyped);
                    maxExpCharIdxRef.current = prevTyped.length;
                }
                return;
            }

            // C. พิมพ์ตัวอักษรปกติ (ตรวจทีละตัวทันทีที่กด)
            let typedChar = e.key;
            // ตรวจสอบว่าคีย์บอร์ดอยู่ใน layout อังกฤษแล้วกดปุ่มไทยหรือไม่
            if (e.code && (e.key.length === 1 || e.key === 'Dead')) {
                const isShift = e.shiftKey;
                const mappedThai = isShift ? thaiShiftKeyDisplayMap[e.code] : thaiKeyDisplayMap[e.code];
                if (mappedThai && !/[a-zA-Z]/.test(e.key)) {
                    typedChar = mappedThai;
                }
            }

            if (typedChar.length === 1) {
                e.preventDefault();
                if (isSoundOn) soundManager.playKeySound();

                setTotalKeystrokes(prev => prev + 1);

                const nextCharIdx = inputBuffer.length;
                const isCharCorrect = targetWord[nextCharIdx] === typedChar;

                if (isCharCorrect) {
                    setCorrectKeystrokes(prev => prev + 1);

                    // เพิ่มคอมโบทีละตัวอักษรที่พิมพ์ถูก
                    const newCombo = combo + 1;
                    setCombo(newCombo);
                    setMaxCombo(prev => Math.max(prev, newCombo));

                    // 🔥 Advanced Perk: Fever Mode ทริกเกอร์ทุกๆ 50 คอมโบ (50, 100, 150...)
                    if (lessonPerksRef.current.advanced && newCombo > 0 && newCombo % 50 === 0) {
                        setIsFeverActive(true);
                        setFeverTimeLeft(5);
                        toast('เข้าสู่โหมด Fever Mode! (5 วินาที)', {
                            id: 'fever-mode-toast',
                            icon: <Zap size={18} className="fill-purple-600 text-purple-600 shrink-0" />,
                            duration: 3000
                        });
                    }

                    // Multiplier Curve: Base Rank Multiplier + ทุก 10 คอมโบ +0.2x + คำสีทอง +1.0x
                    const comboBoost = Math.floor(newCombo / 10) * 0.2;
                    const goldenBoost = targetWordObj.isGolden ? 1.0 : 0;
                    const targetMul = baseRankMul + comboBoost + goldenBoost;
                    const newMul = Math.min(maxCap, Number(targetMul.toFixed(2)));
                    setMultiplier(newMul);

                    // เพิ่ม EXP ทันทีทีละตัวอักษร! (1 ตัว = 1 EXP * Multiplier)
                    // ป้องกันการปั๊ม EXP จากการกด Backspace ลบแล้วพิมพ์ใหม่:
                    // จะได้ EXP ก็ต่อเมื่อพิมพ์ถึงตำแหน่งตัวอักษรใหม่ที่ไม่เคยได้ EXP มาก่อนในคำนี้เท่านั้น
                    if (nextCharIdx >= maxExpCharIdxRef.current) {
                        maxExpCharIdxRef.current = nextCharIdx + 1;
                        let charExpGain = Math.max(1, Math.round(1 * newMul));

                        // ถ้าอยู่ใน Fever Mode: รับ EXP x2!
                        if (isFeverActiveRef.current) {
                            charExpGain *= 2;
                        }

                        setRoundExpEarned(prev => prev + charExpGain);
                        setSessionExpEarned(prev => prev + charExpGain);
                        setUserTotalExp(prev => {
                            const nextTotal = prev + charExpGain;
                            userTotalExpRef.current = nextTotal;
                            if (!session?.user) {
                                try {
                                    localStorage.setItem('pimwai_guest_exp', String(nextTotal));
                                } catch (e) { }
                            }
                            return nextTotal;
                        });
                        pendingSyncExpRef.current += charExpGain;

                        // Sync ไป Server ทุกๆ 50 EXP
                        if (pendingSyncExpRef.current >= 50) {
                            syncExpToDatabase(pendingSyncExpRef.current);
                            pendingSyncExpRef.current = 0;
                        }
                    }
                } else {
                    // กดผิดตัวอักษร! ตรวจสอบเกราะป้องกัน (Beginner Perk)
                    if (shieldsLeftRef.current > 0) {
                        const nextShields = Math.max(0, shieldsLeftRef.current - 1);
                        setShieldsLeft(nextShields);
                        shieldsLeftRef.current = nextShields;
                        triggerWordFloater(activeWordIdx, 'shield', '-1 ป้องกัน');
                    } else {
                        // ไม่มีเกราะ: ลดคอมโบลงครึ่งหนึ่ง
                        setCombo(prev => Math.floor(prev / 2));
                        const resetMul = Number((baseRankMul + (targetWordObj.isGolden ? 1.0 : 0)).toFixed(2));
                        setMultiplier(resetMul);
                    }
                }

                const newInput = inputBuffer + typedChar;
                setInputBuffer(newInput);

                // ตรวจสอบจบในโหมด Words ทันทีที่พิมพ์ตัวสุดท้ายของคำสุดท้ายครบถูกต้อง
                if (mode === 'words' && activeWordIdx === wordLimit - 1 && newInput === targetWord) {
                    const updatedHistory = [...typedWordsHistory];
                    updatedHistory[activeWordIdx] = newInput;
                    setTypedWordsHistory(updatedHistory);

                    const updatedStatus = [...completedWordsStatus];
                    updatedStatus[activeWordIdx] = 'correct';
                    setCompletedWordsStatus(updatedStatus);

                    if (!wordHasBackspaceRef.current && !rewardedWordIndicesRef.current.has(activeWordIdx)) {
                        rewardedWordIndicesRef.current.add(activeWordIdx);
                        let bountyExp = 0;
                        let isGoldenBounty = false;
                        if (targetWordObj.isGolden && lessonPerksRef.current.intermediate) {
                            bountyExp = 30;
                            isGoldenBounty = true;
                        } else if (lessonPerksRef.current.beginner) {
                            bountyExp = 5;
                        }
                        if (bountyExp > 0) {
                            if (isFeverActiveRef.current) bountyExp *= 2;
                            setRoundExpEarned(prev => prev + bountyExp);
                            setSessionExpEarned(prev => prev + bountyExp);
                            setUserTotalExp(prev => prev + bountyExp);
                            pendingSyncExpRef.current += bountyExp;
                            triggerWordFloater(activeWordIdx, isGoldenBounty ? 'golden_bounty' : 'bounty', `+${bountyExp} EXP`, bountyExp);
                        }
                    }

                    setEndTime(Date.now());
                    setIsFinished(true);
                    setIsTyping(false);
                    syncExpToDatabase(pendingSyncExpRef.current);
                    pendingSyncExpRef.current = 0;
                    return;
                }

                // คำนวณ WPM & Accuracy แบบสด
                if (startTime) {
                    const elapsedMin = Math.max(0.05, (Date.now() - startTime) / 60000);
                    const grossWpm = Math.round((correctKeystrokes / 5) / elapsedMin);
                    setCurrentWpm(grossWpm);

                    const currentAcc = Math.round(((correctKeystrokes + (isCharCorrect ? 1 : 0)) / (totalKeystrokes + 1)) * 100);
                    setAccuracy(Math.min(100, Math.max(0, currentAcc)));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        wordList,
        activeWordIdx,
        inputBuffer,
        typedWordsHistory,
        completedWordsStatus,
        isFinished,
        startTime,
        combo,
        correctKeystrokes,
        totalKeystrokes,
        isSoundOn,
        mode,
        wordLimit,
        includePunctuation,
        includeNumbers,
        resetGame,
        syncExpToDatabase,
        triggerBountyToast,
        triggerShieldToast,
        triggerWordFloater
    ]);

    // คำนวณข้อมูล Rank และดาวจาก EXP สะสมจริง (พร้อมเงื่อนไข Top 10)
    const {
        rank,
        rankName,
        stars,
        currentBarExp,
        maxBarExp,
        badgeBg,
        isTop10Eligible
    } = calculateRankInfo(userTotalExp);

    // 📊 คำนวณสถิติเมื่อจบเกมสำหรับแสดงผลหน้า Result สไตล์ Monkeytype (แสดงข้อมูลตรงตามโหมดจริง)
    const finalElapsedSec = mode === 'time'
        ? timeLimit
        : (startTime && endTime
            ? Math.max(1, Math.round((endTime - startTime) / 1000))
            : (startTime
                ? Math.max(1, Math.round((Date.now() - startTime) / 1000))
                : (mode === 'words' ? 1 : timeLimit)
            )
        );
    const finalElapsedMin = Math.max(0.016, finalElapsedSec / 60);
    const finalWpm = Math.max(0, Math.round((correctKeystrokes / 5) / finalElapsedMin));
    const finalRawWpm = Math.max(0, Math.round((totalKeystrokes / 5) / finalElapsedMin));
    const finalAcc = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 0;
    const incorrectCount = Math.max(0, totalKeystrokes - correctKeystrokes);
    const isFocusMode = isTyping && !isFinished;

    // 🎈 เรนเดอร์ข้อความลอยกลางบนหัวคำ (Top-Center Floating Text เพียวๆ ไม่มีเงา เลื่อนสมูท)
    const renderWordFloaters = (wordIdx: number) => {
        const floaters = wordFloatingBadges.filter(b => b.wordIdx === wordIdx);
        if (floaters.length === 0) return null;

        return (
            <span className="pointer-events-none select-none" aria-hidden="true">
                {floaters.map(floater => (
                    <span
                        key={floater.id}
                        className={`absolute left-1/2 bottom-full -mb-1 z-40 text-xs sm:text-sm font-black tracking-tight whitespace-nowrap pointer-events-none select-none ${floater.type === 'golden_bounty'
                            ? 'text-amber-500'
                            : floater.type === 'bounty'
                                ? 'text-emerald-500'
                                : 'text-blue-500'
                            }`}
                        style={{
                            animation: 'wordFloatUp 1.35s forwards',
                            willChange: 'transform, opacity'
                        }}
                    >
                        {floater.text}
                    </span>
                ))}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-[#f4f7fb] flex flex-col font-sans relative overflow-x-hidden selection:bg-[#5cb5db]/30 selection:text-[#0c648b]">
            <Toaster position="top-center" reverseOrder={false} />

            <main className={`flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 flex flex-col items-center justify-center transition-all ${isFocusMode ? 'cursor-none' : ''}`}>

                {/* 🌟 Top Quick Config Bar (ซ่อนอัตโนมัติเมื่อเริ่มพิมพ์ จนกว่าจะขยับเมาส์) */}
                <div className={`bg-white px-6 py-3 rounded-3xl shadow-lg shadow-blue-500/5 flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-6 text-xs sm:text-sm font-bold text-gray-500 transition-all duration-300 ease-in-out ${isFocusMode
                    ? 'opacity-0 pointer-events-none -translate-y-4'
                    : 'opacity-100 translate-y-0'
                    }`}>

                    {/* Sub-Group: Punctuation & Numbers */}
                    <div className="flex items-center gap-2 pr-3 sm:border-r border-gray-200">
                        <button
                            onClick={() => setIncludePunctuation(!includePunctuation)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${includePunctuation ? 'bg-[#5cb5db] text-white shadow-xs' : 'hover:text-[#5cb5db]'
                                }`}
                        >
                            <AtSign size={14} />
                            <span>สัญลักษณ์</span>
                        </button>

                        <button
                            onClick={() => setIncludeNumbers(!includeNumbers)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${includeNumbers ? 'bg-[#5cb5db] text-white shadow-xs' : 'hover:text-[#5cb5db]'
                                }`}
                        >
                            <Hash size={14} />
                            <span>ตัวเลข</span>
                        </button>
                    </div>

                    {/* Sub-Group: Main Mode */}
                    <div className="flex items-center gap-2 pr-3 sm:border-r border-gray-200">
                        <button
                            onClick={() => setMode('time')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${mode === 'time' ? 'bg-[#5cb5db] text-white shadow-xs' : 'hover:text-[#5cb5db]'
                                }`}
                        >
                            <Clock size={15} />
                            <span>เวลา</span>
                        </button>

                        <button
                            onClick={() => setMode('words')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${mode === 'words' ? 'bg-[#5cb5db] text-white shadow-xs' : 'hover:text-[#5cb5db]'
                                }`}
                        >
                            <Type size={15} />
                            <span>คำ</span>
                        </button>

                        <button
                            onClick={() => setMode('zen')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${mode === 'zen' ? 'bg-[#5cb5db] text-white shadow-xs' : 'hover:text-[#5cb5db]'
                                }`}
                        >
                            <InfinityIcon size={15} />
                            <span>พิมพ์ชิลล์ (Zen)</span>
                        </button>
                    </div>

                    {/* Sub-Group: Values (Time / Words) */}
                    {mode === 'time' && (
                        <div className="flex items-center gap-1">
                            {[15, 30, 60, 120].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTimeLimit(t)}
                                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${timeLimit === t ? 'text-[#5cb5db] font-black underline underline-offset-4' : 'hover:text-gray-800'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    )}

                    {mode === 'words' && (
                        <div className="flex items-center gap-1">
                            {[10, 25, 50, 100].map((w) => (
                                <button
                                    key={w}
                                    onClick={() => setWordLimit(w)}
                                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${wordLimit === w ? 'text-[#5cb5db] font-black underline underline-offset-4' : 'hover:text-gray-800'
                                        }`}
                                >
                                    {w}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Sound Toggle */}
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsSoundOn(!isSoundOn)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#5cb5db] transition-colors cursor-pointer"
                            title={isSoundOn ? "ปิดเสียงแป้นพิมพ์" : "เปิดเสียงแป้นพิมพ์"}
                        >
                            {isSoundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        </button>
                    </div>

                </div>

                {/* ⌨️ Main Typing Stream Box */}
                <div className="w-full max-w-6xl bg-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-blue-500/5 relative min-h-[420px] flex flex-col justify-between overflow-hidden">

                    {/* CSS Keyframes สำหรับ Pop-up ข้อความลอยกลางบนหัวคำ (Hold at Top-Center then Smooth Float Up) */}
                    <style dangerouslySetInnerHTML={{
                        __html: `
                            @keyframes wordFloatUp {
                                0% {
                                    opacity: 0;
                                    transform: translate3d(-50%, 2px, 0);
                                    animation-timing-function: ease-out;
                                }
                                12% {
                                    opacity: 1;
                                    transform: translate3d(-50%, 0, 0);
                                    animation-timing-function: linear;
                                }
                                45% {
                                    opacity: 1;
                                    transform: translate3d(-50%, 0, 0);
                                    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
                                }
                                100% {
                                    opacity: 0;
                                    transform: translate3d(-50%, -24px, 0);
                                }
                            }
                        `
                    }} />

                    {/* Floating Shield Toast */}
                    {shieldToast && (
                        <div
                            key={shieldToast.id}
                            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 rounded-2xl shadow-xl border bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white border-cyan-300 font-black shadow-cyan-500/30 animate-pulse"
                        >
                            <Shield size={18} className="fill-white text-white" />
                            <span className="text-xs sm:text-sm tracking-wide">{shieldToast.text}</span>
                        </div>
                    )}

                    {isFinished ? (
                        /* 🏆 Monkeytype-Style Result Screen (PIMWAI Font & Large Balanced Layout) */
                        <div className="flex-1 flex flex-col justify-between py-4 sm:py-6 animate-in fade-in zoom-in-95 duration-200">
                            {/* Main Content Area: Left (WPM & ACC vertically stacked, large font) + Right (Structured Stats Grid) */}
                            <div className="flex flex-col md:flex-row items-stretch gap-8 lg:gap-14 py-2 sm:py-4">
                                {/* Left: WPM & ACC (Vertical Stack in Pimwai font, bold & large) */}
                                <div className="flex flex-row md:flex-col justify-around md:justify-center gap-8 sm:gap-10 shrink-0 md:w-56 lg:w-64 select-none border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-800 pb-6 md:pb-0 md:pr-8">
                                    <div>
                                        <div className="text-sm sm:text-base font-bold text-gray-400 dark:text-gray-500 tracking-wider lowercase mb-1 logo-font">wpm</div>
                                        <div className="text-6xl sm:text-7xl lg:text-8xl font-black text-[#5cb5db] tracking-tight leading-none logo-font">
                                            {finalWpm}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm sm:text-base font-bold text-gray-400 dark:text-gray-500 tracking-wider lowercase mb-1 logo-font">acc</div>
                                        <div className="text-6xl sm:text-7xl lg:text-8xl font-black text-gray-800 dark:text-gray-100 tracking-tight leading-none logo-font">
                                            {finalAcc}%
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Detailed Stats Grid (Pimwai font, larger & prominent) */}
                                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-y-8 gap-x-8 sm:gap-x-12 items-center text-left py-2">
                                    <div>
                                        <div className="text-sm sm:text-base font-bold text-gray-400 dark:text-gray-500 tracking-wider lowercase mb-1 logo-font">test type</div>
                                        <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-800 dark:text-gray-100 leading-tight logo-font">
                                            {mode} {mode === 'time' ? timeLimit : wordLimit}
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-medium mt-1">
                                            {includePunctuation ? 'thai punct' : includeNumbers ? 'thai num' : 'thai basic'}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm sm:text-base font-bold text-gray-400 dark:text-gray-500 tracking-wider lowercase mb-1 logo-font">other</div>
                                        <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-600 dark:text-emerald-400 leading-tight logo-font">
                                            +{roundExpEarned} exp
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-medium mt-1">
                                            max {maxCombo} combo
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm sm:text-base font-bold text-gray-400 dark:text-gray-500 tracking-wider lowercase mb-1 logo-font">raw</div>
                                        <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-800 dark:text-gray-100 leading-tight logo-font">
                                            {finalRawWpm}
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-medium mt-1">
                                            wpm
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm sm:text-base font-bold text-gray-400 dark:text-gray-500 tracking-wider lowercase mb-1 logo-font">characters</div>
                                        <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-800 dark:text-gray-100 tracking-tight leading-tight logo-font">
                                            {correctKeystrokes}/{incorrectCount}/0/0
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-medium mt-1">
                                            cor / err / ext / mis
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm sm:text-base font-bold text-gray-400 dark:text-gray-500 tracking-wider lowercase mb-1 logo-font">consistency</div>
                                        <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-800 dark:text-gray-100 leading-tight logo-font">
                                            {finalAcc}%
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-medium mt-1">
                                            accuracy rate
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm sm:text-base font-bold text-gray-400 dark:text-gray-500 tracking-wider lowercase mb-1 logo-font">time</div>
                                        <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-800 dark:text-gray-100 leading-tight logo-font">
                                            {finalElapsedSec}s
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-medium mt-1">
                                            duration
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Controls: Large Icon-only buttons (ChevronRight on left & RefreshCw on right) */}
                            <div className="flex flex-col items-center justify-center gap-4 pt-8 border-t border-gray-100 dark:border-slate-800 mt-4">
                                <div className="flex items-center justify-center gap-10 sm:gap-14">
                                    {/* 1. ปุ่มต่อไป (คำต่อไป) */}
                                    <button
                                        type="button"
                                        onClick={nextNewWords}
                                        className="text-gray-400 hover:text-gray-800 dark:text-gray-500 dark:hover:text-gray-100 transition-all duration-150 hover:scale-115 active:scale-90 cursor-pointer p-3 rounded-2xl select-none"
                                        title="คำต่อไป (Tab)"
                                    >
                                        <ChevronRight size={34} strokeWidth={2.8} />
                                    </button>

                                    {/* 2. ปุ่มเริ่มใหม่ (คำเดิม) */}
                                    <button
                                        type="button"
                                        onClick={repeatSameWords}
                                        className="text-gray-400 hover:text-gray-800 dark:text-gray-500 dark:hover:text-gray-100 transition-all duration-150 hover:scale-115 active:scale-90 cursor-pointer p-3 rounded-2xl select-none"
                                        title="เริ่มใหม่ (คำเดิม)"
                                    >
                                        <RefreshCw size={28} strokeWidth={2.8} />
                                    </button>
                                </div>

                                {/* 🌟 แนะนำการสร้างบัญชีสำหรับผู้เล่นที่เป็น Guest (ไม่บังคับ แต่ช่วยให้เซฟแรงค์ถาวร) */}
                                {!session?.user && (
                                    <div className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex items-center gap-3 text-xs text-blue-900 shadow-xs">
                                        <Sparkles size={16} className="text-amber-500 shrink-0 fill-amber-400" />
                                        <span>คุณกำลังเล่นในโหมดทดลองพิมพ์</span>
                                        <Link
                                            href="/login"
                                            className="font-bold underline text-blue-600 hover:text-blue-800 hover:scale-105 transition-all"
                                        >
                                            เข้าสู่ระบบเพื่อบันทึก EXP และติดอันดับ Leaderboard
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* 👑 Integrated Rank, Star & EXP Progress Header (แสดง Skeleton ตอนโหลดเพื่อป้องกันการกระพริบเป็น Rank 1) */}
                            {!isUserLoaded ? (
                                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 mb-4 border-b border-gray-100/90 animate-pulse">
                                    {/* Skeleton Left: Rank Image & Info */}
                                    <div className="flex items-center gap-3.5 shrink-0">
                                        <div className="w-14 h-12 bg-gray-200/70 rounded-2xl"></div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-5 bg-gray-200/80 rounded-full"></div>
                                                <div className="w-16 h-4 bg-gray-200/60 rounded-full"></div>
                                            </div>
                                            <div className="w-20 h-3 bg-gray-200/60 rounded-full"></div>
                                        </div>
                                    </div>

                                    {/* Skeleton Middle: Combo & Speed Badges */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="w-24 h-8 bg-gray-200/70 rounded-xl"></div>
                                        <div className="w-24 h-8 bg-gray-200/70 rounded-xl"></div>
                                        <div className="w-16 h-8 bg-gray-200/70 rounded-xl"></div>
                                    </div>

                                    {/* Skeleton Right: EXP Progress Bar */}
                                    <div className="w-full sm:w-72 flex flex-col justify-center px-1 shrink-0 gap-2">
                                        <div className="flex justify-between items-center">
                                            <div className="w-20 h-3 bg-gray-200/70 rounded"></div>
                                            <div className="w-24 h-3 bg-gray-200/70 rounded"></div>
                                        </div>
                                        <div className="w-full h-3.5 bg-gray-200/70 rounded-full"></div>
                                        <div className="w-32 h-4 bg-gray-200/50 rounded self-center mt-0.5"></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 mb-4 border-b border-gray-100/90 animate-in fade-in duration-300">

                                    {/* 1. Left: Rank Image + Badge + Stars + Base Multiplier */}
                                    <div className="flex items-center gap-3.5 shrink-0">
                                        <div className="relative group shrink-0 flex items-center justify-center">
                                            <div className="absolute inset-0 rounded-full"></div>
                                            <Image
                                                src={`/Rank${rank}.png`}
                                                width={75}
                                                height={50}
                                                alt={rankName}
                                                className="relative object-contain drop-shadow-sm h-12 w-auto"
                                                onError={(e) => { e.currentTarget.srcset = "/Rank1.png" }}
                                            />
                                        </div>

                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-0.5 bg-gradient-to-r ${badgeBg} text-white font-black text-[11px] rounded-full tracking-wider uppercase shadow-xs`}>
                                                    {rankName}
                                                </span>
                                                <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 font-bold text-[10px] rounded-full">
                                                    Base x{(getRankMultiplierConfig(rank, stars).totalBaseMultiplier + (lessonPerks.advanced ? 0.5 : 0)).toFixed(2)}
                                                </span>
                                            </div>
                                            {/* 🌟 แสดงดาว (เฉพาะ Rank 1 - 6) หรือ ป้าย TOP 10 สำหรับ Rank 7 (ไม่มีดาว) */}
                                            {rank === 7 ? (
                                                <div className="flex items-center mt-1">
                                                    <span className="text-[9px] font-black px-2.5 py-0.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white rounded-full uppercase tracking-wider shadow-xs">
                                                        TOP 10
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex gap-1 mt-1.5 items-center">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star
                                                            key={s}
                                                            size={13}
                                                            className={`${s <= stars ? "fill-yellow-400 text-yellow-400 drop-shadow-xs" : "fill-gray-200 text-gray-200"}`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Middle: Combo + EXP Multiplier (with Fever State) + Shield + Speed */}
                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap shrink-0 justify-center">
                                        {/* Combo Badge */}
                                        <div className={`text-white px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0 ${isFeverActive
                                            ? 'bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 shadow-rose-500/30 animate-pulse ring-2 ring-amber-300'
                                            : 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-500/20'
                                            }`}>
                                            <Flame size={15} className="fill-white" />
                                            <span className="font-black text-xs logo-font">{combo} COMBO</span>
                                        </div>

                                        {/* EXP Multiplier Badge */}
                                        {isFeverActive ? (
                                            <div className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 border border-amber-300 text-white px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-md shadow-rose-500/30 animate-pulse ring-1 ring-yellow-300 shrink-0">
                                                <Flame size={14} className="fill-white text-white" />
                                                <span className="font-black text-xs logo-font">FEVER x{multiplier.toFixed(2)} ({feverTimeLeft}s)</span>
                                            </div>
                                        ) : (
                                            <div className="bg-cyan-500 border border-cyan-400 text-white px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-xs shrink-0">
                                                <Zap size={13} className="fill-white text-white" />
                                                <span className="font-black text-xs logo-font">EXP x{multiplier.toFixed(2)}</span>
                                            </div>
                                        )}

                                        {/* Double Shield Status (ถ้ามี Perk Beginner) */}
                                        {lessonPerks.beginner && (
                                            <div
                                                className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-black shadow-xs transition-all shrink-0 ${shieldsLeft > 0
                                                    ? 'bg-emerald-500 text-white border border-emerald-400'
                                                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                                                    }`}
                                                title="เกราะป้องกันคอมโบจากการกดพลาด"
                                            >
                                                <Shield size={13} className={shieldsLeft > 0 ? "fill-white" : "text-gray-400"} />
                                                <span className="logo-font">{shieldsLeft}/2 เกราะ</span>
                                            </div>
                                        )}

                                        {/* Live Speed */}
                                        <div className="bg-gray-500 text-white px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs shrink-0">
                                            <span className="text-xs font-black logo-font">{currentWpm} WPM</span>
                                        </div>

                                        {/* Time Countdown (ถ้าเป็นโหมดเวลา) */}
                                        {mode === 'time' && (
                                            <div className="bg-[#5cb5db] text-white px-2.5 py-1.5 rounded-xl text-xs font-black logo-font">
                                                {timeLeft}s
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. Right: EXP Bar + EXP สะสมรอบนี้ (ใหญ่ชัดเจน) */}
                                    <div className="w-full sm:w-72 flex flex-col justify-center px-1 shrink-0">
                                        <div className="flex justify-between items-center text-xs font-bold text-gray-400 mb-1.5">
                                            <span>RANK PROGRESS</span>
                                            {rank === 7 ? (
                                                <span className="text-purple-600 font-mono font-bold text-xs">{userTotalExp.toLocaleString()} XP</span>
                                            ) : isTop10Eligible ? (
                                                <span className="text-rose-600 font-mono font-bold text-xs flex items-center gap-1.5">
                                                    <span>{userTotalExp.toLocaleString()} XP</span>
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 font-mono font-bold text-xs">
                                                    <span className="text-gray-700 font-bold">{Math.floor(currentBarExp).toLocaleString()}</span> / {maxBarExp.toLocaleString()} XP
                                                </span>
                                            )}
                                        </div>

                                        <ExpBar
                                            currentExp={(rank === 7 || isTop10Eligible) ? 100 : currentBarExp}
                                            maxExp={(rank === 7 || isTop10Eligible) ? 100 : maxBarExp}
                                            barColor={`bg-gradient-to-r ${badgeBg}`}
                                            showText={false}
                                        />

                                        {/* แสดง EXP สะสมรอบนี้ (ขนาดใหญ่ชัดเจนตามสั่ง) */}
                                        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold mt-2 px-1">
                                            <span className="text-gray-500 font-semibold">EXP สะสมรอบนี้:</span>
                                            <span className="text-emerald-600 font-black text-sm sm:text-base flex items-center gap-1 logo-font">
                                                <Sparkles size={15} className="text-yellow-500 fill-yellow-500 shrink-0" />
                                                +{sessionExpEarned.toLocaleString()} EXP
                                            </span>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* Words Stream Box with Smooth Scrolling (3 Full Visible Lines) */}
                            <div
                                ref={typingContainerRef}
                                className="flex-1 overflow-hidden h-[215px] max-h-[215px] relative flex flex-wrap items-baseline gap-x-4 gap-y-3.5 text-2xl sm:text-3xl font-medium leading-normal select-none my-auto pt-7 pb-2 antialiased"
                            >
                                {/* 🎯 Container-Level Ultra-Smooth Floating Caret (เลื่อนช้า สมูท นุ่มนวล ไม่มีเงา) */}
                                {!isFinished && caretCoords.height > 0 && (
                                    <div
                                        className={`absolute left-0 top-0 w-[2.5px] bg-[#5cb5db] rounded-full pointer-events-none z-30 ${isTyping ? 'opacity-100' : 'animate-pulse'
                                            }`}
                                        style={{
                                            height: `${caretCoords.height}px`,
                                            transform: `translate3d(${caretCoords.left}px, ${caretCoords.top}px, 0)`,
                                            transition: 'transform 160ms cubic-bezier(0.22, 1, 0.36, 1), height 120ms ease-out',
                                            willChange: 'transform',
                                        }}
                                    />
                                )}

                                {wordList.map((wObj, idx) => {
                                    const isCompleted = idx < activeWordIdx;
                                    const isActive = idx === activeWordIdx;

                                    // Helper เรนเดอร์ตัวอักษรและวรรณยุกต์ภาษาไทย
                                    // ใช้วิธี Cluster Base Display เพื่อให้วรรณยุกต์และสระทุกตัวมีพื้นที่แสดงผล 100% ไม่ถูกตัดหรือหาย
                                    const renderThaiWordWithColors = (
                                        word: string,
                                        currentTypedLen: number,
                                        isWordActive: boolean,
                                        currentBuffer: string,
                                        isGoldenWord: boolean
                                    ) => {
                                        const isGolden = isGoldenWord;
                                        const characters = word.split('');
                                        const clusters: {
                                            base: { char: string; index: number };
                                            marks: { char: string; index: number }[];
                                            fullClusterText: string;
                                        }[] = [];

                                        let currentCluster: {
                                            base: { char: string; index: number };
                                            marks: { char: string; index: number }[];
                                            fullClusterText: string;
                                        } | null = null;
                                        let currentClusterChars: string[] = [];

                                        characters.forEach((char, cIdx) => {
                                            // \u0E31 = ั, \u0E33-\u0E3A = ำ ิ ี ึ ื ุ ู ฺ, \u0E47-\u0E4E = ็ ่ ้ ๊ ๋ ์ ํ ๎
                                            const isMark = /[\u0E31\u0E33-\u0E3A\u0E47-\u0E4E]/.test(char);

                                            if (isMark && currentCluster) {
                                                currentClusterChars.push(char);
                                                currentCluster.marks.push({ char, index: cIdx });
                                                currentCluster.fullClusterText = currentClusterChars.join('');
                                            } else {
                                                if (currentCluster) {
                                                    clusters.push(currentCluster);
                                                }
                                                currentClusterChars = [char];
                                                currentCluster = {
                                                    base: { char, index: cIdx },
                                                    marks: [],
                                                    fullClusterText: char
                                                };
                                            }
                                        });
                                        if (currentCluster) {
                                            clusters.push(currentCluster);
                                        }

                                        const getColor = (index: number, char: string) => {
                                            const isTyped = index < currentTypedLen;
                                            const isCharCorrect = isTyped && currentBuffer[index] === char;
                                            if (isTyped) {
                                                return isCharCorrect ? (isGolden ? 'text-amber-500' : 'text-gray-800') : 'text-red-500';
                                            }
                                            return isGolden ? 'text-amber-300' : 'text-gray-300';
                                        };

                                        return clusters.map((cluster, clIdx) => {
                                            // รวมทุกตัวอักษรใน cluster ตามลำดับ: [พยัญชนะต้น, สระ/วรรณยุกต์1, สระ/วรรณยุกต์2]
                                            const allItems = [cluster.base, ...cluster.marks];
                                            const allColors = allItems.map(item => getColor(item.index, item.char));
                                            // แปลงเป็นลำดับการแสดงผลมาตรฐานของ Unicode/OpenType ให้วรรณยุกต์อยู่ตำแหน่งถูกต้อง
                                            const displayClusterText = toStandardDisplayOrder(cluster.fullClusterText);

                                            // กรณี 1: ทุกตัวอักษรใน cluster มีสีเดียวกันทั้งหมด
                                            // (เช่น ยังไม่ได้พิมพ์ทั้งคู่ = สีเทา, พิมพ์ถูกทั้งหมด = สีดำ, พิมพ์ผิดทั้งหมด = สีแดง)
                                            // เรนเดอร์เป็น <span> ชั้นเดียวเดี่ยวๆ ไม่มีการซ้อนทับ ความหนาและสีจึงเท่ากับตัวอักษรอื่นเป๊ะ 100%
                                            const allSameColor = allColors.every(c => c === allColors[0]);
                                            if (allSameColor) {
                                                return (
                                                    <span key={clIdx} className={allColors[0]}>
                                                        {displayClusterText}
                                                    </span>
                                                );
                                            }

                                            // กรณี 2: สีระหว่างพยัญชนะกับสระ/วรรณยุกต์ต่างกัน
                                            // เราต้องแยกเลเยอร์ แต่จำกัดจำนวนเลเยอร์ให้น้อยที่สุดและไม่มีการซ้อนสีซ้ำซ้อน
                                            const numMarks = cluster.marks.length;

                                            if (numMarks === 1) {
                                                // พยัญชนะ 1 ตัว + สระหรือวรรณยุกต์ 1 ตัว (เช่น ลั, ต้, ดู, ยำ, ทำ)
                                                const isAm = cluster.marks[0].char === 'ำ';

                                                if (isAm) {
                                                    // สำหรับสระ ำ: ถ้าใช้พยัญชนะเดี่ยวๆ (เช่น "ท") มาทับ จะมี kerning กว้างไม่เท่ากับ "ท" ในคำว่า "ทำ"
                                                    // ทำให้ขอบแดงของตัวล่างแลบออกมาได้
                                                    // วิธีแก้ 100%: ใช้รูปคำ "ทำ" ทั้งคำทับ แล้ว clip เอาเฉพาะพยัญชนะต้น พิกเซลจะทับกันเนียนสนิท 100%
                                                    return (
                                                        <span key={clIdx} className="relative inline-block align-baseline select-none">
                                                            {/* เลเยอร์ล่าง: รูปคำ "ทำ" ทั้งก้อน เป็นสีของสระ ำ (allColors[1]) */}
                                                            <span className={allColors[1]}>
                                                                {displayClusterText}
                                                            </span>
                                                            {/* เลเยอร์บน: รูปคำ "ทำ" ทั้งก้อน ตัดขอบเอาเฉพาะพยัญชนะต้น ทับพอดีเป๊ะทุกพิกเซล */}
                                                            <span
                                                                className={`absolute left-0 top-0 pointer-events-none select-none ${allColors[0]}`}
                                                                style={{ clipPath: 'polygon(0 35%, 54% 35%, 54% 100%, 0 100%)' }}
                                                            >
                                                                {displayClusterText}
                                                            </span>
                                                        </span>
                                                    );
                                                }

                                                return (
                                                    <span key={clIdx} className="relative inline-block align-baseline select-none">
                                                        {/* เลเยอร์ล่าง: ข้อความทั้ง cluster เป็นสีของวรรณยุกต์/สระ */}
                                                        <span className={allColors[1]}>
                                                            {displayClusterText}
                                                        </span>
                                                        {/* เลเยอร์บน: พยัญชนะต้น ทับด้วยสีของพยัญชนะต้น */}
                                                        <span className={`absolute left-0 top-0 pointer-events-none select-none ${allColors[0]}`}>
                                                            {cluster.base.char}
                                                        </span>
                                                    </span>
                                                );
                                            }

                                            if (numMarks === 2) {
                                                // พยัญชนะ 1 ตัว + วรรณยุกต์ 1 ตัว + สระ ำ 1 ตัว (เช่น น้ำ) หรือ พยัญชนะ + สระ + วรรณยุกต์ (เช่น สิ่, ตั้ง)
                                                // allColors[0] = พยัญชนะ (เช่น น)
                                                // allColors[1] = เครื่องหมายแรก (เช่น ้ ในคำว่า น้ำ หรือ ิ ในคำว่า สิ่)
                                                // allColors[2] = เครื่องหมายสอง (เช่น ำ ในคำว่า น้ำ หรือ ่ ในคำว่า สิ่)
                                                const color0 = allColors[0];
                                                const color1 = allColors[1];
                                                const color2 = allColors[2];

                                                const isAmAndTone = cluster.marks.some(m => m.char === 'ำ') && cluster.marks.some(m => /[\u0E48-\u0E4B]/.test(m.char));

                                                const subCluster0 = cluster.base.char;
                                                const subCluster1 = isAmAndTone ? displayClusterText : cluster.fullClusterText.slice(0, 2);
                                                const subCluster2 = displayClusterText;

                                                const needLayer1 = color1 !== color2;
                                                const baseColorUnderneath = needLayer1 ? color1 : color2;
                                                // สำหรับกรณีสระ ำ กับวรรณยุกต์: เลเยอร์กลางจะครอบคลุมเฉพาะวรรณยุกต์ด้านบนสุด (ไม่คลุมพยัญชนะ)
                                                // ดังนั้นเลเยอร์บนสุดจึงต้องแสดงพยัญชนะต้นเสมอถ้าสีต่างกับเลเยอร์ล่าง (color0 !== color2)
                                                const needLayer0 = isAmAndTone ? (color0 !== color2) : (color0 !== baseColorUnderneath);

                                                return (
                                                    <span key={clIdx} className="relative inline-block align-baseline select-none">
                                                        {/* เลเยอร์ 1 (ล่างสุด): รูปคำทั้งก้อน แสดงด้วยสีของเครื่องหมายท้ายสุด (color2 = สระำ หรือ วรรณยุกต์) */}
                                                        <span className={color2}>
                                                            {subCluster2}
                                                        </span>

                                                        {/* เลเยอร์ 2 (กลาง): สำหรับสระำ+วรรณยุกต์ จะตัดเอาเฉพาะวรรณยุกต์ด้านบนสุด (top ~18.5%) เท่านั้น 
                                                    จุดตัดอยู่ที่รอยต่อช่องว่างระหว่างไม้โทกับวงกลมอย่างสมบูรณ์แบบ ทำให้วงกลม (นิคหิต) และสระอาด้านล่างเป็นสีเทา 100% ไม่ติดขอบดำแน่นอน */}
                                                        {needLayer1 && (
                                                            <span
                                                                className={`absolute left-0 top-0 pointer-events-none select-none ${color1}`}
                                                                style={isAmAndTone ? { clipPath: 'inset(0 35% 81.5% 0)' } : undefined}
                                                            >
                                                                {subCluster1}
                                                            </span>
                                                        )}

                                                        {/* เลเยอร์ 3 (บนสุด): subCluster0 ทับด้วยสีของพยัญชนะต้น (color0) */}
                                                        {needLayer0 && (
                                                            <span
                                                                className={`absolute left-0 top-0 pointer-events-none select-none ${color0}`}
                                                                style={isAmAndTone ? { clipPath: 'polygon(0 35%, 54% 35%, 54% 100%, 0 100%)' } : undefined}
                                                            >
                                                                {isAmAndTone ? displayClusterText : subCluster0}
                                                            </span>
                                                        )}
                                                    </span>
                                                );
                                            }

                                            return (
                                                <span key={clIdx} className={allColors[0]}>
                                                    {displayClusterText}
                                                </span>
                                            );
                                        });
                                    };

                                    if (isCompleted) {
                                        const typedWord = typedWordsHistory[idx] ?? wObj.word;
                                        const targetWord = wObj.word;
                                        const isWordFullyCorrect = typedWord === targetWord;

                                        if (isWordFullyCorrect) {
                                            return (
                                                <span
                                                    key={idx}
                                                    ref={el => { wordElementsRef.current[idx] = el; }}
                                                    className={`relative inline-block align-baseline whitespace-nowrap ${wObj.isGolden ? 'text-amber-500 bg-amber-50/80 px-1.5 py-0.5 rounded-lg border border-dashed border-amber-300' : 'text-gray-800'}`}
                                                >
                                                    {toStandardDisplayOrder(targetWord)}
                                                    {renderWordFloaters(idx)}
                                                </span>
                                            );
                                        }

                                        const typedLen = typedWord.length;
                                        const targetLen = targetWord.length;
                                        const hasOverflow = typedLen > targetLen;
                                        const overflowChars = hasOverflow ? typedWord.slice(targetLen) : "";

                                        return (
                                            <span
                                                key={idx}
                                                ref={el => { wordElementsRef.current[idx] = el; }}
                                                className={`relative inline-block align-baseline whitespace-nowrap underline decoration-red-500 underline-offset-4 decoration-2 ${wObj.isGolden ? 'bg-amber-50/80 px-1.5 py-0.5 rounded-lg border border-dashed border-amber-300' : ''}`}
                                            >
                                                <span className="inline">
                                                    {renderThaiWordWithColors(targetWord, typedLen, false, typedWord, wObj.isGolden)}
                                                    {hasOverflow && (
                                                        <span className="text-red-900/70">
                                                            {overflowChars}
                                                        </span>
                                                    )}
                                                </span>
                                                {renderWordFloaters(idx)}
                                            </span>
                                        );
                                    }

                                    if (isActive) {
                                        const targetWord = wObj.word;
                                        const typedLen = inputBuffer.length;
                                        const targetLen = targetWord.length;
                                        const hasOverflow = typedLen > targetLen;
                                        const overflowChars = hasOverflow ? inputBuffer.slice(targetLen) : "";

                                        return (
                                            <span
                                                key={idx}
                                                ref={el => { wordElementsRef.current[idx] = el; }}
                                                className={`relative inline-block align-baseline whitespace-nowrap ${wObj.isGolden ? 'bg-amber-50/80 px-1.5 py-0.5 rounded-lg border border-dashed border-amber-300' : ''}`}
                                            >
                                                <span className="inline">
                                                    {renderThaiWordWithColors(targetWord, typedLen, true, inputBuffer, wObj.isGolden)}

                                                    {/* ตัวอักษรที่พิมพ์เกิน */}
                                                    {hasOverflow && (
                                                        <span className="text-red-900/70">
                                                            {overflowChars}
                                                        </span>
                                                    )}
                                                </span>

                                                {renderWordFloaters(idx)}

                                                {/* Reference span สำหรับวัดความกว้างที่พิมพ์แล้วไปอัปเดตตำแหน่ง Floating Caret */}
                                                <span
                                                    ref={typedPartRef}
                                                    aria-hidden="true"
                                                    className="absolute left-0 top-0 opacity-0 pointer-events-none select-none inline whitespace-nowrap"
                                                >
                                                    {toStandardDisplayOrder(targetWord.slice(0, Math.min(typedLen, targetLen)))}
                                                    {overflowChars}
                                                </span>
                                            </span>
                                        );
                                    }

                                    return (
                                        <span
                                            key={idx}
                                            ref={el => { wordElementsRef.current[idx] = el; }}
                                            className={`relative inline-block align-baseline whitespace-nowrap ${wObj.isGolden
                                                ? "text-amber-300 bg-amber-50/80 px-1.5 py-0.5 rounded-lg border border-dashed border-amber-300"
                                                : "text-gray-300"
                                                }`}
                                        >
                                            {toStandardDisplayOrder(wObj.word)}
                                            {renderWordFloaters(idx)}
                                        </span>
                                    );
                                })}
                            </div>

                            {/* Bottom Controls inside Box */}
                            <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
                                {/* Action Buttons: ปุ่มถัดไป (>) และ ปุ่มเริ่มใหม่ (🔄) */}
                                <div className="flex items-center gap-4 sm:gap-6">
                                    {/* 1. ปุ่มถัดไป (คำต่อไป) */}
                                    <button
                                        type="button"
                                        onClick={nextNewWords}
                                        className="text-gray-400 hover:text-gray-800 dark:text-gray-500 dark:hover:text-gray-100 transition-all duration-150 hover:scale-115 active:scale-90 cursor-pointer p-1.5 select-none"
                                        title="คำต่อไป (Tab)"
                                    >
                                        <ChevronRight size={24} strokeWidth={2.8} />
                                    </button>

                                    {/* 2. ปุ่มเริ่มใหม่ (คำเดิม) */}
                                    <button
                                        type="button"
                                        onClick={repeatSameWords}
                                        className="text-gray-400 hover:text-gray-800 dark:text-gray-500 dark:hover:text-gray-100 transition-all duration-150 hover:scale-115 active:scale-90 cursor-pointer p-1.5 select-none"
                                        title="เริ่มใหม่ (คำเดิม)"
                                    >
                                        <RefreshCw size={20} strokeWidth={2.8} />
                                    </button>
                                </div>

                                {/* Right Area: EXP รอบนี้ (ตัวใหญ่ๆ นับใหม่เมื่อกดรี) + Accuracy */}
                                <div className="flex items-center gap-4 sm:gap-6 select-none">
                                    {/* 🌟 EXP ได้เท่าไหร่รอบนี้ */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs sm:text-sm font-bold text-gray-400">EXP รอบนี้:</span>
                                        <span className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 logo-font">
                                            <Sparkles size={16} className="text-yellow-500 fill-yellow-500 shrink-0" />
                                            +{roundExpEarned.toLocaleString()} EXP
                                        </span>
                                    </div>

                                    <div className="w-[1px] h-4 bg-gray-200 dark:bg-slate-700 hidden sm:block"></div>

                                    {/* Accuracy */}
                                    <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-gray-400">
                                        <span>Accuracy:</span>
                                        <strong className="text-base sm:text-xl font-black text-gray-800 dark:text-gray-100 logo-font">{accuracy}%</strong>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                </div>

                {/* 🎖️ Lesson Perks Ribbon (ซ่อนอัตโนมัติเมื่อเริ่มพิมพ์ จนกว่าจะขยับเมาส์) */}
                <div className={`w-full max-w-6xl mt-4 bg-white rounded-3xl p-4 sm:px-6 sm:py-3.5 shadow-lg shadow-blue-500/5 flex flex-wrap items-center justify-between gap-3 text-xs transition-all duration-300 ease-in-out ${isFocusMode
                    ? 'opacity-0 pointer-events-none translate-y-4'
                    : 'opacity-100 translate-y-0'
                    }`}>
                    <div className="flex items-center gap-2 font-bold text-gray-700">
                        <span>บัฟติดตัวจากบทเรียน:</span>
                        <button
                            type="button"
                            onClick={() => setIsPerkModalOpen(true)}
                            className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#5cb5db] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                            title="คลิกเพื่ออ่านรายละเอียดบัฟทั้งหมด"
                        >
                            <Info size={13} className="text-white" />
                            <span>ดูคำอธิบายบัฟ</span>
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* 1. Beginner Perk */}
                        <button
                            type="button"
                            onClick={() => setIsPerkModalOpen(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer hover:scale-[1.02] shadow-xs ${lessonPerks.beginner
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 shadow-emerald-600/20'
                                : 'bg-gray-100/90 text-gray-400 border border-gray-200/60'
                                }`}
                            title="คลิกเพื่อดูรายละเอียด: เกราะกันพลาด 2 ครั้ง + จบคำถูกต้อง 100% รับ +5 EXP"
                        >
                            <Shield size={14} className={lessonPerks.beginner ? "fill-white text-white" : "text-gray-400"} />
                            <span className="font-bold">เกราะกันพลาด</span>
                        </button>

                        {/* 2. Intermediate Perk */}
                        <button
                            type="button"
                            onClick={() => setIsPerkModalOpen(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer hover:scale-[1.02] shadow-xs ${lessonPerks.intermediate
                                ? 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-400 shadow-amber-500/20'
                                : 'bg-gray-100/90 text-gray-400 border border-gray-200/60'
                                }`}
                            title="คลิกเพื่อดูรายละเอียด: โอกาสเจอคำทองคำ 15% + จบคำทองคำรับ +30 EXP"
                        >
                            <Sparkles size={14} className={lessonPerks.intermediate ? "fill-white text-white" : "text-gray-400"} />
                            <span className="font-bold">คำทองคำ 15%</span>
                        </button>

                        {/* 3. Advanced Perk */}
                        <button
                            type="button"
                            onClick={() => setIsPerkModalOpen(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer hover:scale-[1.02] shadow-xs ${lessonPerks.advanced
                                ? 'bg-purple-600 hover:bg-purple-700 text-white border border-purple-500 shadow-purple-600/20'
                                : 'bg-gray-100/90 text-gray-400 border border-gray-200/60'
                                }`}
                            title="คลิกเพื่อดูรายละเอียด: ตัวคูณ +0.5x ถาวร + ทะลุ Max Cap + ทุก 50 คอมโบเข้า Fever x2 EXP"
                        >
                            <Zap size={14} className={lessonPerks.advanced ? "fill-white text-white" : "text-gray-400"} />
                            <span className="font-bold">ตัวคูณ +0.5x</span>
                        </button>
                    </div>

                    {/* Quick Link to Lessons */}
                    {(!lessonPerks.beginner || !lessonPerks.intermediate || !lessonPerks.advanced) && (
                        <Link
                            href="/lessons"
                            className="text-[11px] font-bold text-[#5cb5db] hover:text-[#429ec5] flex items-center gap-0.5 hover:underline transition-all"
                        >
                            <span>เล่นบทเรียนเพื่อปลดล็อกบัฟ</span>
                            <ChevronRight size={13} />
                        </Link>
                    )}
                </div>

                {/* 📖 ป๊อปอัปคำอธิบายบัฟถาวรจากบทเรียน (Lesson Perks Explanation Modal) */}
                {isPerkModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
                        <div
                            className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {/* Close button */}
                            <button
                                type="button"
                                onClick={() => setIsPerkModalOpen(false)}
                                className="absolute top-5 right-5 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                                aria-label="ปิด"
                            >
                                <X size={20} />
                            </button>

                            {/* Modal Header */}
                            <div className="flex items-start sm:items-center justify-between gap-3 mb-4 pr-7">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base sm:text-lg font-black text-gray-800">
                                            บัฟถาวรติดตัวจากบทเรียน (Lesson Perks)
                                        </h3>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium">
                                        เล่นบทเรียนให้จบครบแต่ละระดับ เพื่อรับบัฟช่วยเหลือติดตัวในโหมดฟาร์มเวลถาวร!
                                    </p>
                                </div>
                            </div>

                            {/* 3 Perk Cards List */}
                            <div className="flex flex-col gap-3 my-4">

                                {/* 1. Beginner */}
                                <div className={`p-4 rounded-2xl border transition-all ${lessonPerks.beginner
                                    ? 'bg-emerald-50/60 border-emerald-200/90'
                                    : 'bg-gray-50/80 border-gray-200'
                                    }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-xl ${lessonPerks.beginner ? 'text-emerald-600' : 'text-gray-500'}`}>
                                                <Shield size={25} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-sm text-gray-800">1. บทเรียนระดับต้น (Beginner)</h4>
                                                <span className="text-[11px] text-gray-500 font-medium">เกราะกันพลาด & โบนัสพิมพ์เป๊ะ</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${lessonPerks.beginner
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                {lessonPerks.beginner ? <><Check size={12} /> ปลดล็อกแล้ว</> : <><Lock size={12} /> ยังไม่ปลดล็อก</>}
                                            </span>
                                        </div>
                                    </div>
                                    <ul className="text-xs space-y-1.5 text-gray-600 font-medium pl-5 list-disc">
                                        <li>
                                            <strong className="text-gray-800">🛡️ เกราะกันพลาด 2 ครั้งต่อรอบ (Double Shield):</strong> หากพิมพ์ผิดหรือสะกดวรรณยุกต์พลาด เกราะจะดูดซับความเสียหายไว้ <span className="text-emerald-700 font-bold">คอมโบไม่หลุด และตัวคูณไม่ลด</span>
                                        </li>
                                        <li>
                                            <strong className="text-gray-800">✨ โบนัสพิมพ์เป๊ะคำยาว (Flawless Bounty):</strong> เคาะ Spacebar จบคำถูกต้อง 100% โดย<span className="underline decoration-emerald-500 underline-offset-2">ไม่กดปุ่ม Backspace เลย</span> รับโบนัสสมดุลตามความยาวคำ: คำสั้น <span className="text-emerald-700 font-black">+2 EXP</span>, คำปานกลาง <span className="text-emerald-700 font-black">+4 EXP</span>, คำยาว <span className="text-emerald-700 font-black">+7 ถึง 12 EXP</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* 2. Intermediate */}
                                <div className={`p-4 rounded-2xl border transition-all ${lessonPerks.intermediate
                                    ? 'bg-amber-50/60 border-amber-200/90'
                                    : 'bg-gray-50/80 border-gray-200'
                                    }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-xl ${lessonPerks.intermediate ? 'text-amber-500' : 'text-gray-500'}`}>
                                                <Sparkles size={25} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-sm text-gray-800">2. บทเรียนระดับกลาง (Intermediate)</h4>
                                                <span className="text-[11px] text-gray-500 font-medium">เพิ่มคำทองคำ & ล่าสมบัติก้อนโต</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${lessonPerks.intermediate
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                {lessonPerks.intermediate ? <><Check size={12} /> ปลดล็อกแล้ว</> : <><Lock size={12} /> ยังไม่ปลดล็อก</>}
                                            </span>
                                        </div>
                                    </div>
                                    <ul className="text-xs space-y-1.5 text-gray-600 font-medium pl-5 list-disc">
                                        <li>
                                            <strong className="text-gray-800">🌟 โอกาสพบคำทองคำพุ่งสูง (Golden Rush):</strong> โอกาสสุ่มเจอคำสีทองเพิ่มจาก 8% ขึ้นเป็น <span className="text-amber-700 font-black">15%</span> (คำสีทองให้โบนัสตัวคูณ +1.0x อยู่แล้ว)
                                        </li>
                                        <li>
                                            <strong className="text-gray-800">💰 ล่าสมบัติคำทองคำ (Golden Bounty):</strong> เมื่อพิมพ์คำสีทองถูกต้องครบ 100% แบบ Flawless (ไม่กด Backspace) รับโบนัสสมดุล <span className="text-amber-700 font-black">+15 EXP</span> ทันที
                                        </li>
                                    </ul>
                                </div>

                                {/* 3. Advanced */}
                                <div className={`p-4 rounded-2xl border transition-all ${lessonPerks.advanced
                                    ? 'bg-purple-50/60 border-purple-200/90'
                                    : 'bg-gray-50/80 border-gray-200'
                                    }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-xl ${lessonPerks.advanced ? 'text-purple-600' : 'text-gray-500'}`}>
                                                <Zap size={25} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-sm text-gray-800">3. บทเรียนระดับสูง (Advanced - บัฟโกงที่สุด!)</h4>
                                                <span className="text-[11px] text-gray-500 font-medium">ตัวคูณถาวร + ทะลุขีดจำกัด + Fever Mode x2</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${lessonPerks.advanced
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                {lessonPerks.advanced ? <><Check size={12} /> ปลดล็อกแล้ว</> : <><Lock size={12} /> ยังไม่ปลดล็อก</>}
                                            </span>
                                        </div>
                                    </div>
                                    <ul className="text-xs space-y-1.5 text-gray-600 font-medium pl-5 list-disc">
                                        <li>
                                            <strong className="text-gray-800">⚡ ตัวคูณเพิ่มถาวรตลอดชีพ:</strong> บวกค่า Multiplier พื้นฐานเพิ่มอีก <span className="text-purple-700 font-black">+0.5x</span> ตลอดเวลา
                                        </li>
                                        <li>
                                            <strong className="text-gray-800">🚀 ทะลุขีดจำกัดเพดานคอมโบ (Cap Breaker):</strong> ขยายเพดานตัวคูณคอมโบสูงสุดขึ้นไปอีก +10.0x
                                        </li>
                                        <li>
                                            <strong className="text-gray-800">🔥 โหมดฟีเวอร์ไฟลุก (Fever Mode):</strong> ทุกๆ 50 คอมโบ (50, 100, 150...) เข้าสู่สถานะ Fever 5 วินาที <span className="text-rose-600 font-black">รับ EXP x2 ทุกตัวอักษร!</span>
                                        </li>
                                    </ul>
                                </div>

                            </div>

                            {/* Modal Footer Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsPerkModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                    เข้าใจแล้ว ปิดหน้าต่าง
                                </button>
                                <Link
                                    href="/lessons"
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5cb5db] to-[#3aa5d2] hover:from-[#4ea9d0] hover:to-[#2e9bc9] text-white text-xs font-black shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-cyan-500/30"
                                >
                                    <span>ไปหน้าบทเรียนเพื่อปลดล็อกบัฟ</span>
                                    <ChevronRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
