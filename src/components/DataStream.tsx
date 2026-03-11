'use client';

import { useEffect, useRef } from 'react';

export default function DataStream() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$@#%&*{}[]<>±≠≈∞∑∏∂∫'.split('');
        const fontSize = 12;
        let columns: number;
        let drops: number[];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            columns = Math.floor(canvas.width / fontSize);
            drops = new Array(columns).fill(0).map(() => Math.random() * -100);
        };

        resize();
        window.addEventListener('resize', resize);

        const draw = () => {
            ctx.fillStyle = 'rgba(10, 10, 15, 0.08)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < columns; i++) {
                // Only render ~30% of columns for subtlety
                if (i % 3 !== 0) continue;

                const char = chars[Math.floor(Math.random() * chars.length)];
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                // Vary opacity for depth
                const opacity = 0.03 + Math.random() * 0.05;
                ctx.fillStyle = `rgba(0, 255, 65, ${opacity})`;
                ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
                ctx.fillText(char, x, y);

                if (y > canvas.height && Math.random() > 0.98) {
                    drops[i] = 0;
                }
                drops[i] += 0.5 + Math.random() * 0.5;
            }

            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity: 0.6 }}
        />
    );
}
