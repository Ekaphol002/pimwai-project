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
        canonical: 'https://pimwai.vercel.app/news',
    },
    openGraph: {
        title: 'ข่าวสารอัปเดต & เทคนิคการฝึกพิมพ์สัมผัสให้เร็วขึ้น | PIMWAI',
        description: 'ติดตามข่าวสารการอัปเดตฟีเจอร์ใหม่ บทเรียนพิมพ์สัมผัส และเทคนิคการฝึกพิมพ์ดีดล่าสุดจาก PIMWAI',
        url: 'https://pimwai.vercel.app/news',
        siteName: 'PIMWAI (พิมพ์ไว)',
        images: [
            {
                url: '/Bannerlink.png',
                width: 1200,
                height: 630,
                alt: 'PIMWAI ข่าวสาร & บันทึกการอัปเดต',
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
    return <>{children}</>;
}
