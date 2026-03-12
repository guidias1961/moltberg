'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useMoltbergStore } from '@/store/store';
import { useEffect } from 'react';
import Image from 'next/image';

const NAV_ITEMS = [
    { href: '/', label: 'Dashboard', icon: '◈' },
    { href: '/submit', label: 'Submit', icon: '⬡' },
    { href: '/leaderboard', label: 'Leaderboard', icon: '◉' },
];

export default function Navigation() {
    const pathname = usePathname();
    const { phase, fetchProjects } = useMoltbergStore();

    useEffect(() => {
        if (phase === 'dashboard') {
            fetchProjects();
        }
    }, [phase, fetchProjects]);

    if (phase === 'intro') return null;

    return (
        <motion.nav
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="sticky top-0 z-40 w-full border-b border-terminal-border/50 bg-terminal-dark/80 backdrop-blur-xl"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <Image
                            src="/moltberg.png"
                            alt="MOLTBERG"
                            width={32}
                            height={32}
                            className="drop-shadow-[0_0_8px_rgba(255,69,0,0.4)] group-hover:scale-110 transition-transform"
                        />
                        <div className="hidden sm:block">
                            <span className="text-lobster font-bold text-sm tracking-tight">MOLT</span>
                            <span className="text-gray-200 font-bold text-sm">BERG</span>
                            <span className="text-matrix/50 font-mono text-[10px] ml-1.5">PROTOCOL</span>
                        </div>
                    </Link>

                    {/* Nav Links */}
                    <div className="flex items-center gap-1">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                    relative px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all duration-300
                    ${isActive
                                            ? 'text-lobster'
                                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                                        }
                  `}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-sm">{item.icon}</span>
                                        <span className="hidden sm:inline">{item.label}</span>
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-active"
                                            className="absolute bottom-0 left-2 right-2 h-[2px] bg-lobster rounded-full"
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Status */}
                    <div className="hidden md:flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-matrix animate-pulse" />
                            <span className="font-mono text-[9px] text-matrix/60 uppercase">Live</span>
                        </div>
                        <div className="h-3 w-px bg-terminal-border" />
                        <span className="font-mono text-[9px] text-gray-600">Base L2</span>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}
