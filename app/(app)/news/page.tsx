"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Calendar,
    ChevronRight,
    Search,
} from 'lucide-react';
import { BLOG_POSTS } from '@/lib/newsPosts';

export default function NewsBlogPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // ทำเครื่องหมายว่าอ่านข่าวสารล่าสุดแล้ว (ลบจุดแดงแจ้งเตือนบน Navbar ทันทีเมื่อเข้าหน้านี้)
    React.useEffect(() => {
        try {
            localStorage.setItem('pimwai_last_read_news_id', 'youtube-bgm-and-pimwai-domain');
            window.dispatchEvent(new Event('pimwai-news-read'));
        } catch (e) {}
    }, []);

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
                                    ข่าวสาร & เทคนิคพิมพ์ไว
                                </h1>
                            </div>
                            <p className="text-white/90 text-xs sm:text-sm font-medium mt-1">
                                คู่มือฝึกพิมพ์สัมผัส 10 นิ้ว เกณฑ์สอบพิมพ์ดีดราชการ และอัปเดตฟีเจอร์ใหม่จาก PIMWAI
                            </p>
                        </div>

                        {/* Search Bar ในกล่องแคปซูลสีขาว */}
                        <div className="relative w-full sm:w-64 shrink-0">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ค้นหาบทความ..."
                                className="w-full pl-9 pr-4 py-2 rounded-full text-xs font-medium bg-white text-gray-800 placeholder-gray-400 shadow-sm outline-none focus:ring-2 focus:ring-white/50"
                            />
                        </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="bg-white p-1.5 rounded-full flex items-center shadow-sm w-fit max-w-full overflow-x-auto no-scrollbar">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer whitespace-nowrap ${selectedCategory === 'all'
                                ? 'bg-[#5cb5db] text-white shadow-xs'
                                : 'text-[#5cb5db] hover:bg-gray-50'
                                }`}
                        >
                            ทั้งหมด ({BLOG_POSTS.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('guide')}
                            className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer whitespace-nowrap ${selectedCategory === 'guide'
                                ? 'bg-[#5cb5db] text-white shadow-xs'
                                : 'text-[#5cb5db] hover:bg-gray-50'
                                }`}
                        >
                            คู่มือ & เทคนิคสอบพิมพ์
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('major')}
                            className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer whitespace-nowrap ${selectedCategory === 'major'
                                ? 'bg-[#5cb5db] text-white shadow-xs'
                                : 'text-[#5cb5db] hover:bg-gray-50'
                                }`}
                        >
                            อัปเดตใหญ่
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('feature')}
                            className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer whitespace-nowrap ${selectedCategory === 'feature'
                                ? 'bg-[#5cb5db] text-white shadow-xs'
                                : 'text-[#5cb5db] hover:bg-gray-50'
                                }`}
                        >
                            โหมดและฟีเจอร์ใหม่
                        </button>
                    </div>

                    {/* Featured Spotlight Card */}
                    {selectedCategory === 'all' && !searchQuery && featuredPost && (
                        <Link
                            href={`/news/${featuredPost.id}`}
                            className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-200 cursor-pointer group text-gray-800 block"
                        >
                            {featuredPost.coverImage && (
                                <div className="w-full h-52 sm:h-64 bg-slate-100 overflow-hidden border-b border-gray-100">
                                    <img
                                        src={featuredPost.coverImage}
                                        alt={featuredPost.title}
                                        loading="eager"
                                        decoding="async"
                                        className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-300"
                                    />
                                </div>
                            )}
                            <div className="p-6 sm:p-8 space-y-3">
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
                        </Link>
                    )}

                    {/* Posts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredPosts.map((post) => (
                            <Link
                                key={post.id}
                                href={`/news/${post.id}`}
                                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-150 flex flex-col justify-between cursor-pointer group text-gray-800"
                            >
                                <div>
                                    {post.coverImage && (
                                        <div className="w-full h-44 bg-slate-100 overflow-hidden border-b border-gray-100">
                                            <img
                                                src={post.coverImage}
                                                alt={post.title}
                                                loading="lazy"
                                                decoding="async"
                                                className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-300"
                                            />
                                        </div>
                                    )}
                                    <div className="p-6 pb-0 space-y-3">
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
                                </div>

                                <div className="px-6 pb-6 pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                                    <span className="text-gray-400 text-[11px]">
                                        อ่าน {post.readTime}
                                    </span>
                                    <span className="font-bold text-gray-700 group-hover:text-[#5cb5db] flex items-center gap-1">
                                        <span>อ่านต่อ</span>
                                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                    </span>
                                </div>
                            </Link>
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
        </div>
    );
}
