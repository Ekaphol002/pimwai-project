import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ข่าวสาร & บันทึกการอัปเดตระบบ PIMWAI',
    description: 'ติดตามข่าวสารการอัปเดตฟีเจอร์ใหม่ บทเรียนพิมพ์สัมผัส และเทคนิคการฝึกพิมพ์ดีดล่าสุดจาก PIMWAI',
    keywords: [
        'ข่าวสาร PIMWAI',
        'อัปเดตพิมพ์ดีด',
        'บันทึกการอัปเดต PIMWAI',
        'ฟีเจอร์ใหม่พิมพ์ดีด',
        'เทคนิคพิมพ์สัมผัส',
        'Pimwai Changelog'
    ],
    alternates: {
        canonical: 'https://pimwai.vercel.app/news',
    },
    openGraph: {
        title: 'ข่าวสาร & บันทึกการอัปเดตระบบ PIMWAI',
        description: 'ติดตามข่าวสารการอัปเดตฟีเจอร์ใหม่ บทเรียนพิมพ์สัมผัส และเทคนิคการฝึกพิมพ์ดีดล่าสุดจาก PIMWAI',
        url: 'https://pimwai.vercel.app/news',
        siteName: 'PIMWAI',
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
