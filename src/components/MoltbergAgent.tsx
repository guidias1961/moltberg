'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useMoltbergStore } from '@/store/store';

const SPEECH_BOXES = [
    'So, Mark Zuckerberg is famous for stealing or buying great ideas for a low price.',
    'Here, we do things differently. Your idea will be evaluated by me, MOLTBERG—an agent focused on analyzing analytically and without human bias.',
    'And then I will score it. If you stay among the first 3 places, you will receive money to make this idea be born.',
];

export default function MoltbergAgent() {
    const { phase, introTextsDone, markIntroTextsDone, setPhase } = useMoltbergStore();

    const [visibleBoxes, setVisibleBoxes] = useState<number[]>([]);
    const [typedTexts, setTypedTexts] = useState(['', '', '']);
    const [activeBox, setActiveBox] = useState(-1); // which box is currently typing, -1 = none yet
    const [showButton, setShowButton] = useState(false);
    const [fadingOut, setFadingOut] = useState(false);

    const isIntro = phase === 'intro';

    // Step 1: After mount, kick off first box after 1s
    useEffect(() => {
        if (!isIntro || activeBox >= 0) return;
        const t = setTimeout(() => {
            setVisibleBoxes([0]);
            setActiveBox(0);
        }, 1000);
        return () => clearTimeout(t);
    }, [isIntro, activeBox]);

    // Step 2: Typewriter effect for the active box
    useEffect(() => {
        if (activeBox < 0 || activeBox > 2) return;

        const text = SPEECH_BOXES[activeBox];
        let pos = 0;

        const interval = setInterval(() => {
            pos++;
            setTypedTexts((prev) => {
                const copy = [...prev];
                copy[activeBox] = text.slice(0, pos);
                return copy;
            });

            if (pos >= text.length) {
                clearInterval(interval);

                if (activeBox < 2) {
                    // Wait 2s, then show next box
                    setTimeout(() => {
                        const next = activeBox + 1;
                        setVisibleBoxes((prev) => [...prev, next]);
                        setActiveBox(next);
                    }, 2000);
                } else {
                    // All 3 done → fade out → show button
                    markIntroTextsDone();
                    setTimeout(() => {
                        setFadingOut(true);
                        setTimeout(() => {
                            setVisibleBoxes([]);
                            setShowButton(true);
                        }, 800);
                    }, 1500);
                }
            }
        }, 25);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeBox]);

    const highlightText = useCallback((text: string) => {
        const rules: [RegExp, string][] = [
            [/MOLTBERG/g, 'text-lobster font-black'],
            [/stealing/g, 'text-lobster/90 italic'],
            [/buying/g, 'text-lobster/90 italic'],
            [/first 3 places/g, 'text-matrix font-bold'],
            [/money/g, 'text-matrix font-bold'],
        ];

        let parts: (string | JSX.Element)[] = [text];

        rules.forEach(([regex, cls]) => {
            const next: (string | JSX.Element)[] = [];
            parts.forEach((part) => {
                if (typeof part !== 'string') { next.push(part); return; }
                const splits = part.split(regex);
                const matches = part.match(regex) || [];
                splits.forEach((seg, i) => {
                    if (seg) next.push(seg);
                    if (i < matches.length) {
                        next.push(
                            <span key={`${matches[i]}-${i}-${Math.random()}`} className={cls}>{matches[i]}</span>
                        );
                    }
                });
            });
            parts = next;
        });

        return parts;
    }, []);

    return (
        <div className={`flex flex-col items-center ${isIntro ? 'justify-center min-h-screen' : ''}`}>
            {/* Speech boxes — stacked ABOVE the agent */}
            {isIntro && (
                <div className="flex flex-col gap-3 mb-6 w-full max-w-xl px-4" style={{ minHeight: 180 }}>
                    <AnimatePresence>
                        {!fadingOut && visibleBoxes.map((idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -30, scale: 0.9, filter: 'blur(6px)' }}
                                transition={{ duration: 0.5 }}
                                className="glass-card px-5 py-4 border-l-2 border-lobster/60 relative overflow-hidden"
                            >
                                {/* Glitch scan overlay */}
                                <motion.div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,69,0,0.02) 2px, rgba(255,69,0,0.02) 4px)',
                                    }}
                                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <p className="font-mono text-sm leading-relaxed text-gray-300 relative z-10">
                                    {highlightText(typedTexts[idx])}
                                    {activeBox === idx && typedTexts[idx].length < SPEECH_BOXES[idx].length && (
                                        <span className="typewriter-cursor" />
                                    )}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Moltberg Character */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 14 }}
                className="relative"
            >
                {/* Glow aura */}
                <motion.div
                    className="absolute inset-[-30px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(255,69,0,0.12) 0%, transparent 70%)' }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />

                <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <Image
                        src="/moltberg.png"
                        alt="MOLTBERG"
                        width={isIntro ? 220 : 160}
                        height={isIntro ? 220 : 160}
                        priority
                        className="drop-shadow-[0_0_40px_rgba(255,69,0,0.5)] relative z-10"
                    />
                </motion.div>

                {/* Status dot */}
                <motion.div
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <span className="w-2 h-2 rounded-full bg-matrix animate-pulse" />
                    <span className="font-mono text-[10px] text-matrix/70 uppercase tracking-widest">
                        {isIntro ? (introTextsDone ? 'Awaiting' : activeBox >= 0 ? 'Speaking' : 'Booting') : 'Online'}
                    </span>
                </motion.div>
            </motion.div>

            {/* START ANALYSIS button */}
            <AnimatePresence>
                {isIntro && showButton && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        onClick={() => setPhase('dashboard')}
                        className="mt-8 start-analysis-btn"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-matrix animate-pulse" />
                            START ANALYSIS
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
