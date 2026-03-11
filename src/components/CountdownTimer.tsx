'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMoltbergStore } from '@/store/store';

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number }

export default function CountdownTimer() {
    const { countdownTarget, phase } = useMoltbergStore();
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!mounted) return;
        const tick = () => {
            const diff = Math.max(0, countdownTarget - Date.now());
            setTimeLeft({
                days: Math.floor(diff / 86_400_000),
                hours: Math.floor((diff % 86_400_000) / 3_600_000),
                minutes: Math.floor((diff % 3_600_000) / 60_000),
                seconds: Math.floor((diff % 60_000) / 1000),
            });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [countdownTarget, mounted]);

    if (!mounted) return null;

    const digits = [
        { label: 'Days', value: String(timeLeft.days).padStart(2, '0') },
        { label: 'Hours', value: String(timeLeft.hours).padStart(2, '0') },
        { label: 'Minutes', value: String(timeLeft.minutes).padStart(2, '0') },
        { label: 'Seconds', value: String(timeLeft.seconds).padStart(2, '0') },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="w-full"
        >
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-lobster animate-pulse" />
                    <h2 className="font-mono text-xs text-lobster tracking-[0.2em] uppercase font-semibold">
                        Distribution Countdown
                    </h2>
                </div>

                <div className="flex items-center justify-center gap-3">
                    {digits.map((d, i) => (
                        <div key={d.label} className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                                <div className="countdown-digit rounded-xl px-4 py-3 min-w-[64px] text-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-matrix/[0.03] to-transparent" />
                                    <motion.span
                                        key={d.value}
                                        initial={{ y: -8, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="font-mono text-2xl font-bold text-matrix matrix-glow relative z-10 block"
                                    >
                                        {d.value}
                                    </motion.span>
                                </div>
                                <span className="font-mono text-[9px] text-gray-600 uppercase tracking-wider mt-2">{d.label}</span>
                            </div>
                            {i < 3 && (
                                <motion.span
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="text-matrix/50 text-xl font-mono mb-5"
                                >:</motion.span>
                            )}
                        </div>
                    ))}
                </div>

                <p className="font-mono text-[10px] text-gray-600 text-center mt-4">
                    Fee Pool distributes to Top 3 when timer reaches zero
                </p>
            </div>
        </motion.div>
    );
}
