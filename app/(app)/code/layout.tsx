import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Code Typing Arena - โหมดฝึกพิมพ์โค้ด (Private Dev Mode) | PIMWAI',
    description: 'โหมดฝึกพิมพ์โค้ดส่วนตัว ทดสอบความเร็วการพิมพ์ Syntax, Brackets และ Indentation',
    robots: {
        index: false,
        follow: false,
    },
};

export default function CodeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
