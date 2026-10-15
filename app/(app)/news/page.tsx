"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Calendar,
    ChevronRight,
    Search,
    Sparkles,
    X
} from 'lucide-react';

interface BlogPost {
    id: string;
    title: string;
    subtitle: string;
    category: 'major' | 'feature' | 'curriculum' | 'guide';
    categoryLabel: string;
    categoryColor: string;
    date: string;
    readTime: string;
    author: string;
    summary: string;
    content: {
        intro: string;
        sections: {
            title: string;
            description: string;
            points?: string[];
        }[];
        conclusion?: string;
    };
}

const BLOG_POSTS: BlogPost[] = [
    {
        id: 'pimwai-remaster',
        title: 'อัปเดตใหญ่: รีมาสเตอร์ 210 ด่านคำศัพท์จริง และเปิดตัวระบบแรงค์ระดับตำนาน Rank 4-7',
        subtitle: 'การอัปเกรดเนื้อหาครั้งใหญ่ของ PIMWAI พร้อมบทเรียนใหม่ 21 บทเรียน และตราสัญลักษณ์แรงค์ใหม่',
        category: 'major',
        categoryLabel: 'อัปเดตใหญ่',
        categoryColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
        date: '15 ตุลาคม 2026',
        readTime: '3 นาที',
        author: 'ทีมงาน PIMWAI',
        summary: 'ปรับปรุงบทเรียนพิมพ์สัมผัสภาษาไทยใหม่ทั้งหมด 21 บท 210 ด่าน จากเดิมที่เป็นคำสุ่มผสมที่ไม่มีความหมาย มาเป็นคำศัพท์จริงในชีวิตประจำวันและประโยคที่มีความหมาย 100% พร้อมปลดล็อกแรงค์ระดับสูง 4-7',
        content: {
            intro: 'พวกเราทีมงาน PIMWAI มีความยินดีเป็นอย่างยิ่งที่จะประกาศอัปเดตใหม่ล่าสุด การอัปเดตครั้งนี้มุ่งเน้นที่การยกระดับประสบการณ์การฝึกพิมพ์ให้สนุก นำไปใช้งานจริงได้ทันที และสร้างแรงบันดาลใจในการฝึกซ้อมอย่างต่อเนื่อง',
            sections: [
                {
                    title: '1. รีมาสเตอร์บทเรียนพิมพ์สัมผัส 21 บท 210 ด่าน',
                    description: 'แก้ปัญหาคำสุ่มผสมที่อ่านไม่รู้เรื่อง โดยรื้อและเขียนบทเรียนใหม่ทั้งหมด 100% ให้เป็นคำศัพท์จริงที่พบบ่อยในชีวิตประจำวัน การเรียน และการทำงาน',
                    points: [
                        'ระดับเริ่มต้น (Beginner 70 ด่าน): แป้นเหย้า แถวบน แถวล่าง และการประสานสองมือด้วยคำศัพท์ 2-3 พยางค์',
                        'ระดับกลาง (Intermediate 70 ด่าน): สระผสม วรรณยุกต์ซับซ้อน และคำศัพท์เฉพาะทางในชีวิตประจำวัน',
                        'ระดับสูง (Advanced 70 ด่าน): บทความ สุภาษิต คำพังเพย และวรรณคดีไทย เพื่อสร้างสปีดความเร็วระดับมืออาชีพ'
                    ]
                },
                {
                    title: '2. ปลดล็อกระบบแรงค์ระดับตำนาน (Rank 4 ถึง 7)',
                    description: 'เพื่อตอบรับผู้เล่นระดับสูงที่เก็บเวลทะลุขีดจำกัด เราได้เปิดตัวแรงค์ใหม่พร้อมตราสัญลักษณ์สุดพิเศษ',
                    points: [
                        'Rank 4: Diamond Typer (ปลดล็อกที่ 1,500 EXP)',
                        'Rank 5: Master of Keys (ปลดล็อกที่ 3,000 EXP)',
                        'Rank 6: Grandmaster (ปลดล็อกที่ 6,000 EXP)',
                        'Rank 7: Typing Legend (ปลดล็อกที่ 10,000 EXP สูงสุดในประวัติศาสตร์)'
                    ]
                },
                {
                    title: '3. บัฟพิเศษติดตัวเมื่อผ่านแต่ละระดับ',
                    description: 'เพิ่มแรงจูงใจในการเรียนบทเรียน ผู้ที่ผ่านแต่ละระดับจะได้รับบัฟพิเศษนำไปใช้ในโหมดฟาร์มทันที เช่น เกราะกันพลาด 2 ครั้ง, เพิ่มโอกาสสุ่มพบคำทองคำ +15%, และปลดล็อกโหมด Fever x2'
                }
            ],
            conclusion: 'พวกเราขอขอบคุณผู้ใช้งานทุกคนที่ร่วมฝึกพิมพ์และให้ข้อเสนอแนะเสมอมา ขอให้ทุกคนสนุกกับการฝึกพิมพ์ใน PIMWAI ครับ!'
        }
    },
    {
        id: 'farm-mode-english-5k',
        title: 'เปิดตัวโหมดพิมพ์ด่วน (Farm Mode) & คลังคำภาษาอังกฤษ 5,000 คำ',
        subtitle: 'ฝึกพิมพ์ไร้ขีดจำกัด สะสม EXP คำนวณ WPM แท้จริง พร้อมปฏิทินบันทึกสถิติย้อนหลังรายวัน',
        category: 'feature',
        categoryLabel: 'โหมดใหม่',
        categoryColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        date: '15 ตุลาคม 2026',
        readTime: '3 นาที',
        author: 'ทีมงาน PIMWAI',
        summary: 'โหมดใหม่สำหรับผู้ที่ต้องการซ้อมพิมพ์คำต่อเนื่องอย่างอิสระ มีทั้งภาษาไทยและอังกฤษ 5,000 คำ พร้อมลูกเล่นคำทองคำ โหมดฟีเวอร์ และปฏิทินคลิกดูสถิติรายวัน',
        content: {
            intro: 'โหมดพิมพ์ด่วน (Farm Mode) ถูกออกแบบมาสำหรับผู้เล่นที่ต้องการฝึกฝนความเร็วและความแม่นยำอย่างต่อเนื่อง โดยผสมผสานความเรียบง่ายเข้ากับระบบเก็บเลเวล RPG ของ PIMWAI',
            sections: [
                {
                    title: '1. คลังคำภาษาอังกฤษ 5,000 คำความถี่สูง',
                    description: 'นำเข้าชุดคำศัพท์ภาษาอังกฤษความถี่สูง 5,000 คำมาตรฐานสากล หมดปัญหาคำซ้ำจำเจ ให้คุณฝึกพิมพ์ภาษาอังกฤษได้หลากหลายและตรงตามการใช้งานจริง'
                },
                {
                    title: '2. สูตรคำนวณ WPM และเวลาแท้จริง',
                    description: 'ตัวจับเวลาจะเดินเฉพาะในขณะที่คุณกำลังพิมพ์เท่านั้น หากหยุดพิมพ์เวลาจะหยุดชั่วคราว และความเร็ว WPM คำนวณตามมาตรฐานสากล (5 คีย์เคาะ = 1 คำ)'
                },
                {
                    title: '3. คำทองคำ (Golden Words) & Fever Mode',
                    description: 'สุ่มคำสีทองในระหว่างพิมพ์ เมื่อพิมพ์ถูกครบจะได้รับโบนัสทันที +30 EXP และหากทำคอมโบถูกต้องต่อเนื่องครบ 50 คำ จะเข้าสู่ Fever Mode รับ EXP x2 ทันที'
                },
                {
                    title: '4. ปฏิทินบันทึกประวัติการพิมพ์ย้อนหลัง (Farm Activity Calendar)',
                    description: 'บันทึกประวัติ WPM, ACC และเวลาที่คุณพิมพ์ในแต่ละวัน สามารถคลิกที่วงกลมวันที่เพื่อเปิดดูสรุปสถิติประจำวันย้อนหลังได้ทุกวัน'
                }
            ],
            conclusion: 'ลองเข้าเล่นโหมดพิมพ์ด่วนได้แล้ววันนี้ที่เมนู "โหมดพิมพ์ด่วน" ในแถบนำทางหลัก!'
        }
    },
    {
        id: 'community-feedback-widget',
        title: 'เปิดตัวระบบรับฟังไอเดีย: เสนอสิ่งที่อยากให้ทำหรือพัฒนาเพิ่ม',
        subtitle: 'อยากให้ PIMWAI มีอะไรเพิ่ม หรือพัฒนาตรงไหน บอกเราได้เลยทุกเรื่อง!',
        category: 'feature',
        categoryLabel: 'ฟังก์ชันใหม่',
        categoryColor: 'bg-sky-50 text-sky-600 border-sky-200',
        date: '14 ตุลาคม 2026',
        readTime: '2 นาที',
        author: 'ทีมงาน PIMWAI',
        summary: 'เพิ่มปุ่มลอยมุมขวาล่าง ให้ผู้เล่นทุกคนสามารถส่งฟีเจอร์ โหมดเกม หรือไอเดียที่อยากเห็นเข้ามาให้ทีมงานพิจารณาพัฒนาต่อได้โดยตรง',
        content: {
            intro: 'เพราะเราเชื่อว่าแพลตฟอร์มที่ดีที่สุดเกิดจากการรับฟังผู้ใช้งานจริง ทีมงานจึงได้เปิดตัวฟังก์ชันรับข้อเสนอแนะโดยตรง เพื่อให้ผู้เล่นได้มีส่วนร่วมในการออกแบบ PIMWAI',
            sections: [
                {
                    title: '1. ส่งไอเดียอะไรได้บ้าง?',
                    description: 'ไม่ว่าจะเป็นโหมดพิมพ์ใหม่ เช่น ดวลพิมพ์ 1v1 กับเพื่อน, สกินแป้นพิมพ์, เสียงคีย์บอร์ดแบบ Thock หรือการแจ้งบั๊ก สามารถพิมพ์ส่งเข้ามาได้ทันที'
                },
                {
                    title: '2. ช่องทางส่งที่สะดวกสบาย',
                    description: 'สามารถคลิกที่ปุ่มลอย "เสนอสิ่งที่อยากให้ทำเพิ่ม" ที่มุมขวาล่างของหน้าจอได้จากทุกหน้า'
                },
                {
                    title: '3. ทีมงานอ่านและคัดเลือกพัฒนาจริง',
                    description: 'ข้อเสนอแนะทั้งหมดจะถูกส่งเข้าสู่ระบบหลังบ้านของทีมงาน เพื่อนำมาจัดลำดับความสำคัญในแผนการพัฒนาครั้งถัดไป'
                }
            ],
            conclusion: 'มีไอเดียอะไรเจ๋งๆ อย่าลืมกดปุ่มมุมขวาล่างแล้วเล่าให้เราฟังนะครับ!'
        }
    },
    {
        id: 'typing-technique-guide',
        title: 'คู่มือเทคนิค: วิธีจัดสรีระและตำแหน่งแป้นเหย้าเพื่อก้าวสู่ 60+ WPM',
        subtitle: 'พื้นฐานสำคัญที่จะช่วยให้คุณพิมพ์ได้เร็วขึ้นโดยไม่เมื่อยนิ้วและไม่จำเป็นต้องมองแป้น',
        category: 'guide',
        categoryLabel: 'เทคนิค & ทริค',
        categoryColor: 'bg-amber-50 text-amber-700 border-amber-200',
        date: '10 ตุลาคม 2026',
        readTime: '4 นาที',
        author: 'ทีมงาน PIMWAI',
        summary: 'รวมหลักการวางนิ้วบนแป้นเหย้า ฟ ห ก ด ่ า ส ว เทคนิคการจัดระดับความสูงของโต๊ะ และการเคาะจังหวะสม่ำเสมอเพื่อความเร็วที่ยั่งยืน',
        content: {
            intro: 'หลายคนคิดว่าการพิมพ์เร็วต้องใช้ความพยายามเคาะให้เร็วที่สุด แต่ในความเป็นจริง ความเร็วที่แท้จริงเกิดจาก "ความแม่นยำ" และ "การจัดตำแหน่งนิ้วที่ถูกต้อง"',
            sections: [
                {
                    title: '1. จุดสัมผัสแป้นเหย้า (Home Row Keys)',
                    description: 'นิ้วชี้ซ้ายวางที่ปุ่ม ด (มีขีดนูน) และนิ้วชี้ขวาวางที่ปุ่ม ่ (มีขีดนูน) ทุกครั้งที่ขยับไปกดแป้นอื่น ให้ดึงนิ้วกลับมาพักที่แป้นเหย้าเสมอ'
                },
                {
                    title: '2. ท่องกฎเหล็ก: อย่ามองแป้นพิมพ์เด็ดขาด',
                    description: 'การมองแป้นจะทำให้สมองสร้างภาพจำช้าลง ให้มองที่หน้าจอเท่านั้น และปล่อยให้กล้ามเนื้อนิ้ว (Muscle Memory) เรียนรู้ตำแหน่งเอง หากพิมพ์ผิดให้สังเกตว่าผิดเพราะนิ้วไหนเอื้อมเกิน'
                },
                {
                    title: '3. ความแม่นยำมาก่อนความเร็ว (Accuracy over Speed)',
                    description: 'อย่ารีบเคาะเร็วเกินไป ให้รักษาความแม่นยำให้อยู่ที่ 96% - 98% เสมอ เมื่อความแม่นยำคงที่ ความเร็ว WPM จะพุ่งขึ้นเองตามธรรมชาติ'
                }
            ],
            conclusion: 'ฝึกฝนวันละ 15-20 นาทีอย่างสม่ำเสมอในบทเรียน PIMWAI แล้วคุณจะเห็นพัฒนาการที่ก้าวกระโดดแน่นอนครับ'
        }
    }
];

export default function NewsBlogPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activePost, setActivePost] = useState<BlogPost | null>(null);

    // กรองบทความตามหมวดหมู่และคำค้นหา
    const filteredPosts = BLOG_POSTS.filter((post) => {
        const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
        const matchesSearch =
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.summary.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const featuredPost = BLOG_POSTS[0];

    return (
        <div className="min-h-screen bg-[#f4f7fb] flex flex-col font-sans relative overflow-x-hidden py-6 sm:py-8 pb-12">
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 flex flex-col">

                {/* 🌟 กล่องสีฟ้าหลัก (#5cb5db) สไตล์เดียวกับหน้าอันดับ (Leaderboard) และหน้าทดสอบ */}
                <div className="bg-[#5cb5db] rounded-[2.5rem] p-5 sm:p-8 flex flex-col relative shadow-xl overflow-hidden min-h-[850px] space-y-6">

                    {/* Top Header Row: Title & Subtitle on Left, Search Bar on Right */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-20">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <h1 className="text-white text-3xl sm:text-4xl font-black tracking-wide drop-shadow-sm logo-font">
                                    ข่าวสาร & อัปเดต
                                </h1>
                            </div>
                            <p className="text-white/90 text-xs sm:text-sm font-medium mt-1">
                                บันทึกการอัปเดตฟีเจอร์ใหม่ บทเรียน และเทคนิคการฝึกพิมพ์ดีด PIMWAI
                            </p>
                        </div>

                        {/* Search Bar ในกล่องแคปซูลสีขาว */}
                        <div className="relative w-full sm:w-64 shrink-0">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ค้นหาข่าวสาร..."
                                className="w-full pl-9 pr-4 py-2 rounded-full text-xs font-medium bg-white text-gray-800 placeholder-gray-400 shadow-sm outline-none focus:ring-2 focus:ring-white/50"
                            />
                        </div>
                    </div>

                    {/* Category Filter Pills (แคปซูลสีขาวเป๊ะตามแบบหน้าอันดับ) */}
                    <div className="bg-white p-1 rounded-lg flex items-center shadow-sm w-fit max-w-full overflow-x-auto no-scrollbar">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer whitespace-nowrap ${selectedCategory === 'all'
                                ? 'bg-[#5cb5db] text-white shadow-xs'
                                : 'text-[#5cb5db] hover:bg-gray-50'
                                }`}
                        >
                            ทั้งหมด ({BLOG_POSTS.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('major')}
                            className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer whitespace-nowrap ${selectedCategory === 'major'
                                ? 'bg-[#5cb5db] text-white shadow-xs'
                                : 'text-[#5cb5db] hover:bg-gray-50'
                                }`}
                        >
                            อัปเดตใหญ่
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('feature')}
                            className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer whitespace-nowrap ${selectedCategory === 'feature'
                                ? 'bg-[#5cb5db] text-white shadow-xs'
                                : 'text-[#5cb5db] hover:bg-gray-50'
                                }`}
                        >
                            โหมดและฟีเจอร์ใหม่
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('guide')}
                            className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer whitespace-nowrap ${selectedCategory === 'guide'
                                ? 'bg-[#5cb5db] text-white shadow-xs'
                                : 'text-[#5cb5db] hover:bg-gray-50'
                                }`}
                        >
                            คู่มือ & เทคนิค
                        </button>
                    </div>

                    {/* Featured Spotlight Card (แสดงเมื่อเลือกหมวดหมู่ทั้งหมดและไม่ได้พิมพ์ค้นหา) */}
                    {selectedCategory === 'all' && !searchQuery && featuredPost && (
                        <div
                            onClick={() => setActivePost(featuredPost)}
                            className="bg-white rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group text-gray-800"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-bold">
                                        {featuredPost.categoryLabel}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1.5 ml-auto">
                                        <Calendar size={13} />
                                        <span>{featuredPost.date}</span>
                                    </span>
                                </div>

                                <h2 className="text-xl sm:text-2xl font-black text-gray-800 group-hover:text-[#5cb5db] transition-colors leading-snug">
                                    {featuredPost.title}
                                </h2>

                                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed line-clamp-2">
                                    {featuredPost.summary}
                                </p>

                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                    <span className="text-gray-400">
                                        โดย {featuredPost.author} • อ่าน {featuredPost.readTime}
                                    </span>
                                    <span className="font-bold text-[#5cb5db] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                        <span>อ่านบทความฉบับเต็ม</span>
                                        <ChevronRight size={15} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Posts Grid (กล่องบทความสีขาวบนพื้นสีฟ้า) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredPosts.map((post) => (
                            <div
                                key={post.id}
                                onClick={() => setActivePost(post)}
                                className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-150 flex flex-col justify-between cursor-pointer group text-gray-800"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <span className={`px-2.5 py-0.5 rounded-lg font-bold border ${post.categoryColor}`}>
                                            {post.categoryLabel}
                                        </span>
                                        <span className="text-gray-400 flex items-center gap-1 text-[11px]">
                                            <Calendar size={12} />
                                            <span>{post.date}</span>
                                        </span>
                                    </div>

                                    <h3 className="text-base sm:text-lg font-bold text-gray-800 group-hover:text-[#5cb5db] transition-colors leading-snug">
                                        {post.title}
                                    </h3>

                                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                                        {post.summary}
                                    </p>
                                </div>

                                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                                    <span className="text-gray-400 text-[11px]">
                                        อ่าน {post.readTime}
                                    </span>
                                    <span className="font-bold text-gray-700 group-hover:text-[#5cb5db] flex items-center gap-1">
                                        <span>อ่านต่อ</span>
                                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredPosts.length === 0 && (
                        <div className="bg-white rounded-3xl p-12 text-center text-gray-400 shadow-sm">
                            <Search size={36} className="mx-auto mb-3 opacity-40 text-[#5cb5db]" />
                            <p className="font-bold text-gray-700 text-sm">ไม่พบข่าวสารที่ตรงกับคำค้นหา</p>
                            <p className="text-xs text-gray-400 mt-1">ลองค้นหาด้วยคำอื่น หรือเลือกดูหมวดหมู่ทั้งหมด</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal: Full Article Reader */}
            {activePost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div
                        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden text-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 pb-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${activePost.categoryColor}`}>
                                        {activePost.categoryLabel}
                                    </span>
                                </div>
                                <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
                                    <Calendar size={12} />
                                    <span>เผยแพร่เมื่อ {activePost.date} • โดย {activePost.author}</span>
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setActivePost(null)}
                                className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                                aria-label="ปิด"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body (Scrollable Article) */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs sm:text-sm leading-relaxed text-gray-700 no-scrollbar">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-snug">
                                    {activePost.title}
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                                    {activePost.subtitle}
                                </p>
                            </div>

                            {/* Lead paragraph */}
                            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 text-sky-950 leading-relaxed font-medium">
                                {activePost.content.intro}
                            </div>

                            {/* Main sections */}
                            <div className="space-y-6">
                                {activePost.content.sections.map((sec, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <h4 className="text-sm sm:text-base font-bold text-gray-900">
                                            {sec.title}
                                        </h4>
                                        <p className="text-gray-600 leading-relaxed">
                                            {sec.description}
                                        </p>
                                        {sec.points && (
                                            <ul className="list-disc pl-5 space-y-1.5 text-gray-600 mt-2">
                                                {sec.points.map((pt, pIdx) => (
                                                    <li key={pIdx}>{pt}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {activePost.content.conclusion && (
                                <div className="pt-4 border-t border-gray-100 text-gray-500 italic">
                                    {activePost.content.conclusion}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
                            <span className="text-gray-400 text-[11px]">
                                PIMWAI Official Changelog
                            </span>
                            <button
                                type="button"
                                onClick={() => setActivePost(null)}
                                className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-medium transition cursor-pointer"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
