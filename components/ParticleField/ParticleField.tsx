"use client";

import React, { useRef, useEffect, useCallback } from 'react';

interface Particle {
    x: number;
    y: number;
    baseX: number;
    baseY: number;
    size: number;
}

interface ParticleFieldProps {
    particleCount?: number;
    particleColor?: string;
    repulsionRadius?: number;
    repulsionForce?: number;
}

export default function ParticleField({
    particleCount = 80,
    particleColor = 'rgba(255, 255, 255, 0.5)',
    repulsionRadius = 120,
    repulsionForce = 8,
}: ParticleFieldProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const animationRef = useRef<number | null>(null);

    // Initialize particles in a grid pattern with exclusion zone
    const initParticles = useCallback((width: number, height: number) => {
        const particles: Particle[] = [];
        const cols = Math.ceil(Math.sqrt(particleCount * (width / height)));
        const rows = Math.ceil(particleCount / cols);
        const spacingX = width / cols;
        const spacingY = height / rows;

        // Define exclusion zone (smaller, tighter around text)
        const exclusionZone = {
            x: width * 0.25,        // 25% from left
            y: height * 0.10,       // 10% from top
            width: width * 0.50,    // 50% width (centered)
            height: height * 0.12   // 12% height (just the text area)
        };

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (particles.length >= particleCount) break;
                const x = spacingX / 2 + col * spacingX;
                const y = spacingY / 2 + row * spacingY;

                // Skip particles inside the exclusion zone
                const inExclusionZone =
                    x >= exclusionZone.x &&
                    x <= exclusionZone.x + exclusionZone.width &&
                    y >= exclusionZone.y &&
                    y <= exclusionZone.y + exclusionZone.height;

                if (inExclusionZone) continue;

                particles.push({
                    x,
                    y,
                    baseX: x,
                    baseY: y,
                    size: 2,
                });
            }
        }
        particlesRef.current = particles;
    }, [particleCount]);

    // Animation loop
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const mouse = mouseRef.current;

        particlesRef.current.forEach((particle) => {
            const dx = mouse.x - particle.baseX;
            const dy = mouse.y - particle.baseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            let targetX = particle.baseX;
            let targetY = particle.baseY;

            if (distance < repulsionRadius && distance > 0) {
                const force = (repulsionRadius - distance) / repulsionRadius;
                const angle = Math.atan2(dy, dx);
                const displacement = force * repulsionForce * 10;
                targetX = particle.baseX - Math.cos(angle) * displacement;
                targetY = particle.baseY - Math.sin(angle) * displacement;
            }

            const ease = 0.15;
            particle.x += (targetX - particle.x) * ease;
            particle.y += (targetY - particle.y) * ease;

            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = particleColor;
            ctx.fill();
        });

        animationRef.current = requestAnimationFrame(animate);
    }, [particleColor, repulsionRadius, repulsionForce]);

    // Handle resize - use fixed 250vh height
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const updateSize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight * 2.5; // 250vh

            canvas.width = width;
            canvas.height = height;
            initParticles(width, height);
        };

        updateSize();
        window.addEventListener('resize', updateSize);

        return () => {
            window.removeEventListener('resize', updateSize);
        };
    }, [initParticles]);

    // Handle mouse move
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top + window.scrollY,
            };
        };

        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 };
        };

        window.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    // Start animation
    useEffect(() => {
        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [animate]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ zIndex: 1 }}
        />
    );
}
