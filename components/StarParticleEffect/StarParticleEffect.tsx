// components/StarParticleEffect/StarParticleEffect.tsx
"use client";

import React, { useEffect, useRef } from 'react';

// Props สำหรับตั้งค่าการระเบิดของดาว
type Props = {
    count?: number;      // จำนวนดาว
    sizeMin?: number;    // ขนาดดาวต่ำสุด
    sizeMax?: number;    // ขนาดดาวสูงสุด
    duration?: number;   // เวลาการเคลื่อนไหว
    spread?: number;     // ระยะการกระจาย
    colors?: string[];   // สีดาวที่ใช้สุ่ม
};

// สีเริ่มต้น ถ้าไม่ได้ส่งเข้ามา
const DEFAULT_COLORS = ['#FACC15'];

export default function StarParticleEffect({
    count = 35,
    sizeMin = 35,
    sizeMax = 55,
    duration = 3000,
    spread = 1000,
    colors = DEFAULT_COLORS,
}: Props) {

    // กล่องหลักที่จะใส่ดาวทั้งหมด
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const particles: HTMLElement[] = [];

        // รูปร่างดาวหลายแบบเพื่อความหลากหลาย
        const shapes = ['★', '✦', '✧', '✩'];

        for (let i = 0; i < count; i++) {

            // ขนาดดาวสุ่ม
            const starSize = Math.random() * (sizeMax - sizeMin) + sizeMin;

            // สีดาวสุ่มจาก array
            const randomColor =
                colors[Math.floor(Math.random() * colors.length)];

            const starElement = document.createElement('div');
            starElement.style.position = 'absolute';
            starElement.style.left = '50%';
            starElement.style.top = '50%';
            starElement.style.lineHeight = '1';
            starElement.style.fontSize = `${starSize}px`;
            starElement.style.color = randomColor;

            // ใส่รูปแบบดาวแบบสุ่ม
            starElement.innerHTML =
                shapes[Math.floor(Math.random() * shapes.length)];

            // คำนวณทิศทางและแรงระเบิดแบบสุ่ม
            const angle = Math.random() * Math.PI * 2;
            const force = (Math.random() * 0.4 + 0.5) * spread;
            const burstX = Math.cos(angle) * force;
            const burstY = Math.sin(angle) * force;
            const rotation = (Math.random() - 0.5) * 2000;

            container.appendChild(starElement);
            particles.push(starElement);

            // ทำ Animation 3-phase: พุ่งออกแรง → ช้าลง → เล็กหายไป
            starElement.animate(
                [
                    // จุดเริ่มต้น
                    {
                        transform: `translate(-50%, -50%) scale(1) rotate(0deg)`,
                        opacity: 1,
                        offset: 0,
                    },
                    // ระเบิดแรงเร็ว → ช้าลง
                    {
                        transform: `translate(calc(-50% + ${burstX * 0.7}px), calc(-50% + ${burstY * 0.7
                            }px)) scale(1.15) rotate(${rotation / 2}deg)`,
                        opacity: 0.9,
                        offset: 0.25,
                    },
                    // ค่อย ๆ ลอยไปช้า ๆ เล็กลง → หายไป
                    {
                        transform: `translate(calc(-50% + ${burstX}px), calc(-50% + ${burstY}px)) scale(0) rotate(${rotation}deg)`,
                        opacity: 0,
                        offset: 1,
                    },
                ],
                {
                    duration: duration + Math.random() * 800,           // เพิ่มความสุ่มให้ไม่เหมือนกัน
                    easing: "cubic-bezier(.1, .7, .3, 1)",             // เส้นโค้ง Animation
                    fill: "forwards",                                  // เก็บสถานะสุดท้าย
                    delay: Math.random() * 60,                         // สุ่มดีเลย์
                }
            );
        }

        // ลบดาวทั้งหมดเมื่อ component ถูกลบ
        return () => {
            particles.forEach((p) => p.remove());
        };
    }, [count, sizeMin, sizeMax, duration, spread, colors]);

    // กล่องหลักสำหรับใส่ดาวทั้งหมด (pointer-events-none เพื่อไม่ให้กวนคลิก)
    return (
        <div
            ref={containerRef}
            className="absolute inset-0 pointer-events-none z-50"
        />
    );
}
