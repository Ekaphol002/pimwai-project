import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ข่าวสารอัปเดต & เทคนิคการฝึกพิมพ์สัมผัสให้เร็วขึ้น',
    description: 'ติดตามข่าวสารการอัปเดตฟีเจอร์ใหม่ บทเรียนพิมพ์สัมผัส 10 นิ้ว และเทคนิคการฝึกพิมพ์ดีดให้เร็วและแม่นยำขึ้นจากทีมพัฒนา PIMWAI',
    keywords: [
        'ข่าวสาร PIMWAI',
        'อัปเดตพิมพ์ดีด',
        'บันทึกการอัปเดต PIMWAI',
        'เทคนิคพิมพ์สัมผัส',
        'วิธีพิมพ์ดีดให้เร็ว',
        'Pimwai Changelog'
    ],
    alternates: {
        canonical: 'https://pimwai.com/news',
    },
    openGraph: {
        title: 'ข่าวสารอัปเดต & เทคนิคการฝึกพิมพ์สัมผัสให้เร็วขึ้น | PIMWAI (พิมพ์ไว)',
        description: 'ติดตามข่าวสารการอัปเดตฟีเจอร์ใหม่ บทเรียนพิมพ์สัมผัส และเทคนิคการฝึกพิมพ์ดีดล่าสุดจาก PIMWAI',
        url: 'https://pimwai.com/news',
        siteName: 'PIMWAI (พิมพ์ไว)',
        images: [
            {
                url: '/Bannerlink.png',
                width: 1200,
                height: 630,
                alt: 'PIMWAI (พิมพ์ไว) ข่าวสาร & บันทึกการอัปเดต',
            }
        ],
        type: 'website',
        locale: 'th_TH',
    }
};

export default function NewsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": "https://pimwai.com" },
            { "@type": "ListItem", "position": 2, "name": "ข่าวสาร & เทคนิคฝึกพิมพ์สัมผัส", "item": "https://pimwai.com/news" }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            {children}
        </>
    );
}
