"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    coverImage: string;
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
            image?: string;
            imageCaption?: string;
            points?: string[];
        }[];
        conclusion?: string;
    };
}

const BLOG_POSTS: BlogPost[] = [
    {
        id: 'youtube-bgm-and-pimwai-domain',
        title: 'อัปเดตใหญ่: เปิดตัวระบบใส่ลิงก์เพลงจาก YouTube, ก้าวสู่โดเมน pimwai.com อย่างเป็นทางการ และอัปเกรดความเร็วทั้งเว็บ',
        subtitle: 'เปิดเพลงโปรดจาก YouTube คลอระหว่างฝึกพิมพ์ได้ไม่จำกัด พร้อมตั้งค่าเสียงคีย์บอร์ดและเพลงในปุ่มเดียว',
        coverImage: '/youtube-playlist-added.jpg',
        category: 'major',
        categoryLabel: 'อัปเดตใหญ่',
        categoryColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
        date: '5 พฤศจิกายน 2026',
        readTime: '3 นาที',
        author: 'ทีมงาน PIMWAI',
        summary: 'เปิดตัวระบบวางลิงก์เพลงจาก YouTube เพื่อเปิดเป็นเพลงพื้นหลังระหว่างฝึกพิมพ์ รวมปุ่มตั้งค่าเสียงคีย์บอร์ดและเพลงไว้ในปุ่มเดียว ก้าวสู่โดเมนหลัก pimwai.com อย่างเป็นทางการ พร้อมปรับปรุงความเร็วการโหลดทุกหน้าและตารางอันดับ Streak',
        content: {
            intro: 'อัปเดตใหม่ล่าสุดจากทีมงาน PIMWAI (พิมพ์ไว) ที่รวมทุกฟีเจอร์ตามคำเรียกร้องของผู้เล่น ทั้งการนำลิงก์เพลงที่ชอบจาก YouTube มาเปิดฟังเป็นเพลงพื้นหลังในเว็บได้โดยตรง การปรับโฉมหน้าต่างตั้งค่าเสียงใหม่ให้คลีนและใช้งานง่ายในปุ่มเดียว ตลอดจนการย้ายเข้าสู่โดเมนเนมหลัก pimwai.com อย่างเป็นทางการ!',
            sections: [
                {
                    title: '1. ก้าวสู่โดเมนหลัก https://pimwai.com อย่างเป็นทางการ',
                    description: 'PIMWAI (พิมพ์ไว) ได้เปิดใช้งานโดเมนเนมหลัก pimwai.com เต็มรูปแบบแล้ว เพื่อยกระดับความน่าเชื่อถือและประสิทธิภาพ SEO บน Google ให้ค้นหาเจอง่ายขึ้น โดยข้อมูลบัญชีผู้ใช้ ค่า EXP ระดับแรงค์ และสถิติการฝึกพิมพ์ทั้งหมดซิงค์ต่อเนื่องปลอดภัย 100%',
                    image: '/pimwai-domain-com.jpg',
                    imageCaption: 'เข้าใช้งานผ่านโดเมนหลัก https://pimwai.com ได้อย่างรวดเร็วและปลอดภัย'
                },
                {
                    title: '2. คัดลอกลิงก์เพลงที่ชอบจาก YouTube มาใส่ได้ทันที',
                    description: 'อยากฟังเพลงไหนระหว่างฝึกพิมพ์ก็ทำได้ง่ายๆ เพียงเปิดเพลงหรือคลิปที่ชื่นชอบบน YouTube แล้วคัดลอกลิงก์ URL จากแถบที่อยู่ด้านบนของเบราว์เซอร์ (รองรับทั้งลิงก์ youtube.com/watch?v=... และ youtu.be/...)',
                    image: '/youtube-copy-link.jpg',
                    imageCaption: 'คัดลอกลิงก์เพลงจากแถบ URL ของ YouTube เพื่อนำมาใส่ในเว็บ'
                },
                {
                    title: '3. วางลิงก์ในหน้าต่าง "ตั้งค่าเสียงและเพลง" โฉมใหม่',
                    description: 'ในหน้าพิมพ์ด่วน (Farm Mode), หน้าพิมพ์โค้ด และหน้าบทเรียน สามารถกดปุ่มตั้งค่าเสียงเพื่อเปิดหน้าต่างป๊อปอัปโฉมใหม่ แล้ววางลิงก์ YouTube ลงในช่องพร้อมกดปุ่ม + ระบบจะดึงชื่อเพลงจาก YouTube มาแสดงและเริ่มเล่นเป็นเพลงพื้นหลังให้ทันที',
                    image: '/youtube-paste-link.jpg',
                    imageCaption: 'วางลิงก์ YouTube ลงในช่องแล้วกดปุ่ม + เพื่อเพิ่มเข้าสู่รายการเพลง'
                },
                {
                    title: '4. จัดการรายการเพลงโปรด ติ๊กเลือกเพลง และสุ่มเพลงใหม่เมื่อรีเฟรช',
                    description: 'เพลงจาก YouTube ที่เพิ่มเข้ามาจะถูกบันทึกไว้ในเครื่องพร้อมติ๊กเข้าในรายการเล่นให้อัตโนมัติโดยไม่ล้างเพลงเดิม สามารถเพิ่มกี่เพลงก็ได้ เลื่อนดูรายการเพลงได้ลื่นไหล และทุกครั้งที่กดรีเฟรชหน้าเว็บ ระบบจะสุ่มเพลงใหม่จากรายการที่คุณติ๊กเลือกไว้ให้ทันทีโดยไม่สะดุด',
                    image: '/youtube-playlist-added.jpg',
                    imageCaption: 'รายการเพลง YouTube ที่เพิ่มเข้ามาพร้อมกล่องติ๊กเลือกเพลงที่จะให้เล่นวนลูป'
                },
                {
                    title: '5. เลือกเสียงแป้นพิมพ์ (Keyboard Sound) และปรับระดับเสียงในที่เดียว',
                    description: 'ปรับเปลี่ยนเสียงคีย์บอร์ด (Keyboard 1–4 หรือปิดเสียง) ได้สะดวกรวดเร็วผ่านเมนู Dropdown ดีไซน์ใหม่ที่สะอาดตา พร้อมแถบปรับระดับความดังเสียงปุ่มกดและเสียงเพลงพื้นหลังแยกกันอย่างอิสระ',
                    image: '/audio-keyboard-dropdown.jpg',
                    imageCaption: 'เมนู Dropdown เลือกเสียงแป้นพิมพ์และปรับความดังได้ครบจบในหน้าต่างเดียว'
                },
                {
                    title: '6. อัปเกรดความเร็วการเปลี่ยนหน้า แก้ไขตารางอันดับ Streak และรองรับธีมมืดของเบราว์เซอร์',
                    description: 'ปรับปรุงประสิทธิภาพการดึงข้อมูลและการเปลี่ยนหน้าเมนูให้รวดเร็วทันใจ พร้อมปรับปรุงส่วนสำคัญทั่วทั้งเว็บไซต์:',
                    points: [
                        'แก้ไขตารางอันดับ (Leaderboard) หมวด Streak ให้แสดงจำนวนวันที่เข้าเล่นทั้งหมดอย่างถูกต้องและโหลดไวในพริบตา',
                        'ปรับปรุง Skeleton Loading ตอนโหลดหน้าบทเรียน หน้าทดสอบ และหน้าความคืบหน้า ให้ตรงกับเลย์เอาต์จริง 100%',
                        'แก้ไขปัญหาสีตัวอักษรเพี้ยนสำหรับผู้ใช้ที่เปิดโหมดมืด (Dark Mode) ของเบราว์เซอร์ ให้มองเห็นตัวอักษรชัดเจนเหมือนโหมดสว่างทุกประการ'
                    ]
                }
            ],
            conclusion: 'ลองกดปุ่มตั้งค่าเสียงในหน้าพิมพ์ด่วนแล้วนำลิงก์เพลงโปรดจาก YouTube มาเปิดฟังระหว่างซ้อมพิมพ์กันได้เลยครับ!'
        }
    },
    {
        id: 'article-mode-and-delete-account',
        title: 'อัปเดตใหม่: เปิดตัว "โหมดบทความ" ในหน้าฟาร์ม และฟังก์ชัน "ลบบัญชีถาวร" ตามคำขอ',
        subtitle: 'ยกระดับการฝึกพิมพ์ด้วยคลังวรรณกรรมและข้อคิดกว่า 100 เรื่อง พร้อมระบบจัดการข้อมูลส่วนตัวที่ปลอดภัยยิ่งขึ้น',
        coverImage: '/farm-article-mode.jpg',
        category: 'major',
        categoryLabel: 'อัปเดตใหญ่',
        categoryColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
        date: '24 ตุลาคม 2026',
        readTime: '3 นาที',
        author: 'ทีมงาน PIMWAI',
        summary: 'เปิดตัวโหมดพิมพ์บทความใน Farm Mode พร้อมคลังเนื้อหากว่า 100 เรื่อง ระบบเลื่อนขึ้นอัตโนมัติ 3 บรรทัดแบบ Smooth Scroll และเพิ่มปุ่มลบบัญชีถาวร (Danger Zone) พร้อมยืนยันความปลอดภัย 2 ชั้นในหน้าตั้งค่า',
        content: {
            intro: 'เพื่อตอบรับข้อเสนอแนะและเสียงเรียกร้องจากผู้ใช้งานทุกท่าน ทีมงาน PIMWAI ได้ปล่อยอัปเดตครั้งสำคัญที่เพิ่มมิติการฝึกพิมพ์ให้ลึกซึ้งยิ่งขึ้นด้วยโหมดบทความ และเพิ่มความโปร่งใสด้านข้อมูลส่วนตัวด้วยระบบลบบัญชีผู้ใช้งานถาวร',
            sections: [
                {
                    title: '1. เปิดตัว "โหมดบทความ" ในหน้าพิมพ์ด่วน (Farm Mode)',
                    description: 'สำหรับผู้ที่ต้องการฝึกพิมพ์ประโยคยาว เรื่องเล่า นิทาน และบทความวรรณกรรม แทนที่จะเป็นเพียงคำสั้นๆ โดยระบบจะจัดลำดับการพิมพ์ภาษาไทยอย่างถูกต้อง แสดงผลแบบ 3 บรรทัดพร้อมระบบ Smooth Scroll เลื่อนขึ้นอัตโนมัติอย่างลื่นไหล สบายตา ไม่กระตุก เมื่อพิมพ์จบบรรทัดที่ 2 จะเลื่อนบรรทัดที่ 2 ขึ้นไปแทนบรรทัดที่ 1 ทันที พร้อมเลือกความยาว สั้น, ปานกลาง, หรือยาว ได้อย่างอิสระ',
                    image: '/farm-article-mode.jpg',
                    imageCaption: 'ภาพตัวอย่างหน้าจอโหมดบทความบน Farm Mode พร้อมตัวเลือกความยาวและแถบนับคำ'
                },
                {
                    title: '2. คัดสรรคลังบทความคุณภาพสูงกว่า 100 เรื่อง',
                    description: 'หมดปัญหาเนื้อหาซ้ำซาก ด้วยการรวบรวมบทความภาษาไทยและภาษาอังกฤษกว่า 100 เรื่อง แบ่งออกเป็น 6 หมวดหมู่ชัดเจน: นิทานอีสปและนิทานพื้นบ้านสอนใจ, ข้อคิดและจิตวิทยาแห่งความสำเร็จ, เทคโนโลยี วิทยาการคอมพิวเตอร์ และ AI, ปรัชญาและการใช้ชีวิต, ประวัติศาสตร์และวรรณคดีไทย, ตลอดจนบทความภาษาอังกฤษระดับโลก',
                    points: [
                        'นิทานอีสปและเรื่องเล่าสอนใจ 25 เรื่อง (เช่น กระต่ายกับเต่า, ชายตัดฟืนกับขวานทองคำ, กากับเหยือกน้ำ, ลากับเงา)',
                        'ข้อคิดและจิตวิทยา 20 เรื่อง (เช่น พลังแห่งความสม่ำเสมอ, กฎ 1% Atomic Habits, Growth Mindset)',
                        'เทคโนโลยีและคอมพิวเตอร์ 18 เรื่อง (เช่น แป้น QWERTY, กำเนิด AI, กล้องเจมส์เว็บบ์, ปรัชญา Clean Code)',
                        'ปรัชญาและวิถีชีวิต 17 เรื่อง (เช่น ศิลปะคินสึงิ, ปลาว่ายทวนน้ำ, บทเรียนจากเกลียวคลื่น)',
                        'ประวัติศาสตร์และวรรณคดี 10 เรื่อง (เช่น นิราศภูเขาทอง, กาลิเลโอ, มหาพีระมิด, กำเนิดอักษรไทย)',
                        'บทความภาษาอังกฤษ 20 เรื่อง (เช่น The Bamboo Tree Story, Steve Jobs, The Lion and the Mouse)'
                    ]
                },
                {
                    title: '3. เพิ่มโซนอันตราย (Danger Zone): ลบบัญชีผู้ใช้ถาวร',
                    description: 'ตามคำเรียกร้องของผู้ใช้งานที่ต้องการเริ่มต้นใหม่หรือลบข้อมูลส่วนบุคคล เราได้เพิ่มเมนู "ลบบัญชีถาวร" ในหน้าตั้งค่า (Settings) ซึ่งจะลบข้อมูลบัญชี สถิติฟาร์ม บันทึกบทเรียน ผลทดสอบความเร็ว และโค้ดส่วนตัวออกจากฐานข้อมูลอย่างสมบูรณ์แบบถาวร',
                    image: '/delete-account-zone.jpg',
                    imageCaption: 'แถบโซนอันตราย (Danger Zone) ในหน้าตั้งค่าสำหรับลบบัญชีถาวร'
                },
                {
                    title: '4. ระบบยืนยันความปลอดภัย 2 ชั้น (Double Confirmation)',
                    description: 'เพื่อป้องกันไม่ให้ผู้ใช้เผลอกดลบบัญชีโดยไม่ได้ตั้งใจ ระบบจะมีหน้าต่าง Modal แจ้งเตือนข้อความเตือนความเสี่ยงเป็นสีแดง และบังคับให้ผู้ใช้ต้องพิมพ์คำว่า "ลบบัญชีถาวร" ลงในช่องยืนยันก่อน ปุ่มกดยืนยันจึงจะยอมทำงาน',
                    image: '/delete-account-modal.jpg',
                    imageCaption: 'หน้าต่างป๊อปอัปยืนยันการลบบัญชีถาวรที่ต้องพิมพ์ข้อความยืนยันก่อนลบ'
                },
                {
                    title: '5. ทิศทางในอนาคต: แผนการย้ายสู่โดเมนเนม .com เพื่อผลลัพธ์ SEO ที่ดียิ่งขึ้น',
                    description: 'เป้าหมายก้าวต่อไปของ PIMWAI ทางทีมงานมีแผนเตรียมเปลี่ยนชื่อโดเมนจาก .vercel.app ไปเป็น .com เต็มรูปแบบ เพื่อเสริมประสิทธิภาพด้าน SEO (Search Engine Optimization) ช่วยให้ผู้คนค้นหาและเข้าถึงเว็บไซต์ของเราผ่านการค้นหาบน Google ได้ง่ายและมากขึ้น แต่ในระหว่างนี้ เรา "ขอเก็บตัวซุ่มพัฒนาเงียบๆ ก่อน" เพื่อมุ่งมั่นขัดเกลาระบบ ฟังก์ชัน และประสบการณ์การพิมพ์ให้สมบูรณ์และเสถียรที่สุด ก่อนเปิดตัวอย่างเต็มภาคภูมิ!',
                    points: [
                        'วางรากฐานโครงสร้าง SEO คุณภาพสูง เพื่อให้การค้นหาคำว่าฝึกพิมพ์ดีดไทยและแบบฝึกหัดพิมพ์ดีดติดอันดับต้นๆ บน Google',
                        'วางระบบเปลี่ยนผ่านอย่างราบรื่น ข้อมูลบัญชี เลเวล ค่า EXP และสถิติทั้งหมดของผู้ใช้จะคงอยู่อย่างปลอดภัย 100%',
                        'ปัจจุบันขอเก็บตัวโฟกัสการพัฒนาเนื้อหาและฟีเจอร์ภายในให้แข็งแกร่งที่สุดก่อนก้าวสู่โดเมน .com อย่างเป็นทางการ'
                    ]
                }
            ],
            conclusion: 'ขอขอบคุณทุกข้อเสนอแนะที่ส่งเข้ามาผ่านปุ่มรับฟังไอเดีย ทีมงานจะมุ่งมั่นพัฒนา PIMWAI ให้เป็นแพลตฟอร์มฝึกพิมพ์ที่ดีที่สุดสำหรับทุกคนครับ!'
        }
    },
    {
        id: 'pimwai-remaster',
        title: 'อัปเดตใหญ่: รีมาสเตอร์ 210 ด่านคำศัพท์จริง และเปิดตัวระบบแรงค์ระดับตำนาน Rank 4-7',
        subtitle: 'การอัปเกรดเนื้อหาครั้งใหญ่ของ PIMWAI พร้อมบทเรียนใหม่ 21 บทเรียน และตราสัญลักษณ์แรงค์ใหม่',
        coverImage: '/lesson.png',
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
        coverImage: '/progress.png',
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
        coverImage: '/Bannerlink.png',
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
        coverImage: '/presen.png',
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

    // ทำเครื่องหมายว่าอ่านข่าวสารล่าสุดแล้ว (ลบจุดแดงแจ้งเตือนบน Navbar ทันทีเมื่อเข้าหน้านี้)
    React.useEffect(() => {
        try {
            localStorage.setItem('pimwai_last_read_news_id', 'youtube-bgm-and-pimwai-domain');
            window.dispatchEvent(new Event('pimwai-news-read'));
        } catch (e) {}
    }, []);

    // ล็อกไม่ให้หน้าเว็บด้านหลังเลื่อนตามเมื่อเปิดอ่านข่าวสารใน Popup
    React.useEffect(() => {
        if (activePost) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [activePost]);

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

                    {/* Category Filter Pills (แคปซูลขอบกลมสีขาวเป๊ะตามแบบหน้าอันดับ) */}
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
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('guide')}
                            className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer whitespace-nowrap ${selectedCategory === 'guide'
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
                            className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-200 cursor-pointer group text-gray-800"
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
                        </div>
                    )}

                    {/* Posts Grid (กล่องบทความสีขาวพร้อมรูปปกด้านบนการ์ดแต่ละอัน) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredPosts.map((post) => (
                            <div
                                key={post.id}
                                onClick={() => setActivePost(post)}
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

            {/* Modal: Full Article Reader (ตัด backdrop-blur และเปิด GPU Scroll เพื่อความลื่น 60fps ไม่หน่วง) */}
            {activePost && (
                <div
                    onClick={() => setActivePost(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/50 overscroll-none"
                >
                    <div
                        className="bg-white rounded-3xl max-w-4xl lg:max-w-5xl w-full shadow-2xl border border-gray-100 relative max-h-[92vh] flex flex-col overflow-hidden text-gray-800 overscroll-contain transform-gpu"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-5 sm:p-7 pb-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${activePost.categoryColor}`}>
                                        {activePost.categoryLabel}
                                    </span>
                                </div>
                                <span className="text-[11px] sm:text-xs text-gray-400 flex items-center gap-1 mt-1">
                                    <Calendar size={13} />
                                    <span>เผยแพร่เมื่อ {activePost.date} • โดย {activePost.author}</span>
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setActivePost(null)}
                                className="p-2.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                                aria-label="ปิด"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Modal Body (Scrollable Article - ลื่นไหลด้วย transform-gpu) */}
                        <div
                            className="flex-1 overflow-y-auto overscroll-contain transform-gpu p-6 sm:p-10 space-y-7 text-xs sm:text-sm leading-relaxed text-gray-700"
                            style={{ WebkitOverflowScrolling: 'touch', willChange: 'scroll-position' }}
                        >
                            <div>
                                <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug">
                                    {activePost.title}
                                </h2>
                                <p className="text-xs sm:text-base text-gray-500 font-medium mt-1.5">
                                    {activePost.subtitle}
                                </p>
                            </div>

                            {/* Lead paragraph */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/70 border border-sky-100 text-sky-950 leading-relaxed font-medium text-xs sm:text-sm">
                                {activePost.content.intro}
                            </div>

                            {/* Main sections */}
                            <div className="space-y-7">
                                {activePost.content.sections.map((sec, idx) => (
                                    <div key={idx} className="space-y-3">
                                        <h4 className="text-sm sm:text-lg font-bold text-gray-900">
                                            {sec.title}
                                        </h4>
                                        <p className="text-gray-600 leading-relaxed">
                                            {sec.description}
                                        </p>
                                        {sec.image && (
                                            <div className="rounded-2xl overflow-hidden border border-gray-200/90 my-4 bg-gray-50 max-w-3xl mx-auto">
                                                <img
                                                    src={sec.image}
                                                    alt={sec.title}
                                                    decoding="async"
                                                    className="w-full h-auto object-contain block"
                                                />
                                                {sec.imageCaption && (
                                                    <div className="p-2 text-center text-[11px] text-gray-500 font-medium bg-gray-50 border-t border-gray-100">
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
