import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight, Keyboard, Timer, Zap, BookOpen } from 'lucide-react';
import { BLOG_POSTS, getBlogPostBySlug } from '@/lib/newsPosts';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    return BLOG_POSTS.map((post) => ({
        slug: post.id,
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = getBlogPostBySlug(slug);

    if (!post) {
        return {
            title: 'ไม่พบบทความ | PIMWAI (พิมพ์ไว)',
        };
    }

    const url = `https://pimwai.com/news/${post.id}`;

    return {
        title: post.title,
        description: post.summary,
        keywords: post.keywords || [
            'ฝึกพิมพ์ดีด',
            'ฝึกพิมพ์สัมผัส 10 นิ้ว',
            'ทดสอบความเร็วพิมพ์ดีด WPM',
            'PIMWAI',
            'พิมพ์ไว',
        ],
        alternates: {
            canonical: url,
        },
        openGraph: {
            title: `${post.title} | PIMWAI (พิมพ์ไว)`,
            description: post.summary,
            url,
            siteName: 'PIMWAI (พิมพ์ไว)',
            images: [
                {
                    url: post.coverImage || '/Bannerlink.png',
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
            type: 'article',
            publishedTime: post.isoDate,
            authors: [post.author],
            locale: 'th_TH',
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.summary,
            images: [post.coverImage || '/Bannerlink.png'],
        },
    };
}

export default async function NewsArticlePage({ params }: PageProps) {
    const { slug } = await params;
    const post = getBlogPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const relatedPosts = BLOG_POSTS.filter((p) => p.id !== post.id).slice(0, 3);

    const articleJsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: 'หน้าแรก',
                        item: 'https://pimwai.com',
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: 'ข่าวสาร & เทคนิคฝึกพิมพ์สัมผัส',
                        item: 'https://pimwai.com/news',
                    },
                    {
                        '@type': 'ListItem',
                        position: 3,
                        name: post.title,
                        item: `https://pimwai.com/news/${post.id}`,
                    },
                ],
            },
            {
                '@type': 'Article',
                headline: post.title,
                description: post.summary,
                image: [`https://pimwai.com${post.coverImage || '/Bannerlink.png'}`],
                datePublished: post.isoDate,
                dateModified: post.isoDate,
                author: {
                    '@type': 'Organization',
                    name: post.author,
                    url: 'https://pimwai.com',
                },
                publisher: {
                    '@type': 'Organization',
                    name: 'PIMWAI (พิมพ์ไว)',
                    logo: {
                        '@type': 'ImageObject',
                        url: 'https://pimwai.com/icon.png',
                    },
                },
                mainEntityOfPage: {
                    '@type': 'WebPage',
                    '@id': `https://pimwai.com/news/${post.id}`,
                },
            },
        ],
    };

    return (
        <div className="min-h-screen bg-[#f4f7fb] flex flex-col font-sans relative overflow-x-hidden py-6 sm:py-8 pb-14">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
            />

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 flex flex-col">
                <div className="bg-[#5cb5db] rounded-[2.5rem] p-5 sm:p-8 flex flex-col relative shadow-xl overflow-hidden space-y-6">
                    {/* Top Navigation Bar */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <Link
                            href="/news"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-[#0c648b] font-bold text-xs sm:text-sm shadow-xs transition"
                        >
                            <ChevronLeft size={16} />
                            <span>กลับหน้ารวมข่าวสาร & บทความ</span>
                        </Link>

                        <span className="text-white/90 text-xs font-medium">
                            เวลาอ่านประมาณ {post.readTime}
                        </span>
                    </div>

                    {/* Article Container Card */}
                    <article className="bg-white rounded-3xl shadow-md overflow-hidden text-gray-800">
                        {post.coverImage && (
                            <div className="w-full h-56 sm:h-80 bg-slate-100 overflow-hidden border-b border-gray-100">
                                <img
                                    src={post.coverImage}
                                    alt={post.title}
                                    className="w-full h-full object-cover object-top"
                                />
                            </div>
                        )}

                        <div className="p-6 sm:p-10 space-y-7 text-xs sm:text-sm leading-relaxed text-gray-700">
                            {/* Category & Date */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${post.categoryColor}`}>
                                    {post.categoryLabel}
                                </span>
                                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                    <Calendar size={14} />
                                    <span>เผยแพร่เมื่อ {post.date} • โดย {post.author}</span>
                                </span>
                            </div>

                            {/* H1 Title & Subtitle */}
                            <div>
                                <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug">
                                    {post.title}
                                </h1>
                                <p className="text-xs sm:text-base text-gray-500 font-medium mt-2">
                                    {post.subtitle}
                                </p>
                            </div>

                            {/* Lead Paragraph */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/70 border border-sky-100 text-sky-950 leading-relaxed font-medium text-xs sm:text-sm">
                                {post.content.intro}
                            </div>

                            {/* Main Content Sections */}
                            <div className="space-y-8">
                                {post.content.sections.map((sec, idx) => (
                                    <section key={idx} className="space-y-3">
                                        <h2 className="text-base sm:text-lg font-bold text-gray-900">
                                            {sec.title}
                                        </h2>
                                        <p className="text-gray-600 leading-relaxed">
                                            {sec.description}
                                        </p>
                                        {sec.image && (
                                            <div className="rounded-2xl overflow-hidden border border-gray-200/90 my-4 bg-gray-50 max-w-3xl mx-auto">
                                                <img
                                                    src={sec.image}
                                                    alt={sec.title}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="w-full h-auto object-contain block"
                                                />
                                                {sec.imageCaption && (
                                                    <div className="p-2.5 text-center text-[11px] text-gray-500 font-medium bg-gray-50 border-t border-gray-100">
                                                        {sec.imageCaption}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {sec.points && (
                                            <ul className="list-disc pl-5 space-y-1.5 text-gray-600 mt-2">
                                                {sec.points.map((pt, pIdx) => (
                                                    <li key={pIdx}>{pt}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </section>
                                ))}
                            </div>

                            {post.content.conclusion && (
                                <div className="pt-4 border-t border-gray-100 text-gray-500 italic">
                                    {post.content.conclusion}
                                </div>
                            )}
                        </div>
                    </article>

                    {/* Related Articles Section (Internal Linking for SEO) */}
                    {relatedPosts.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <h2 className="text-white font-black text-lg sm:text-xl px-1">
                                บทความและเทคนิคอื่นที่น่าสนใจ
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {relatedPosts.map((rel) => (
                                    <Link
                                        key={rel.id}
                                        href={`/news/${rel.id}`}
                                        className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between group text-gray-800"
                                    >
                                        <div className="space-y-2">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${rel.categoryColor}`}>
                                                {rel.categoryLabel}
                                            </span>
                                            <h3 className="text-sm font-bold text-gray-800 group-hover:text-[#5cb5db] transition-colors line-clamp-2 leading-snug">
                                                {rel.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 line-clamp-2">
                                                {rel.summary}
                                            </p>
                                        </div>
                                        <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#5cb5db] font-bold">
                                            <span>อ่านบทความ</span>
                                            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
