'use client';

import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import MoltbergAgent from '@/components/MoltbergAgent';
import CountdownTimer from '@/components/CountdownTimer';
import WalletConnect from '@/components/WalletConnect';
import Navigation from '@/components/Navigation';
import ProjectDetail from '@/components/ProjectDetail';
import AgentChat from '@/components/AgentChat';
import Link from 'next/link';
import { useEffect } from 'react';
import { useMoltbergStore } from '@/store/store';

const DataStream = dynamic(() => import('@/components/DataStream'), { ssr: false });

export default function Home() {
    const { phase, projects, feePool, fetchProjects } = useMoltbergStore();

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const top3 = projects.slice(0, 3);
    const totalScores = projects.reduce((sum, p) => sum + p.totalScore, 0);

    return (
        <main className="relative min-h-screen overflow-hidden">
            <DataStream />
            <div className="data-stream-bg" />
            <div className="scan-line" />

            <div className="relative z-10 min-h-screen flex flex-col">
                <Navigation />

                {/* ═══ INTRO PHASE ═══ */}
                <AnimatePresence mode="wait">
                    {phase === 'intro' && (
                        <motion.div
                            key="intro"
                            exit={{ opacity: 0, filter: 'blur(8px)', scale: 0.98 }}
                            transition={{ duration: 0.6 }}
                            className="flex-1"
                        >
                            <MoltbergAgent />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ DASHBOARD PHASE ═══ */}
                <AnimatePresence>
                    {phase === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="flex-1 flex flex-col glitch-enter"
                        >
                            {/* Hero Section */}
                            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
                                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                                    {/* Agent + Title */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.6, delay: 0.4 }}
                                        className="flex flex-col items-center lg:items-start text-center lg:text-left"
                                    >
                                        <div className="mb-4">
                                            <MoltbergAgent />
                                        </div>
                                        <h1 className="font-outfit text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight glitch-hover">
                                            <span className="text-lobster">MOLT</span>
                                            <span className="text-gray-200">BERG</span>
                                            <span className="text-matrix/60 text-lg sm:text-xl lg:text-2xl font-mono ml-2 font-normal block sm:inline mt-1 sm:mt-0">
                                                PROTOCOL
                                            </span>
                                        </h1>
                                        <p className="font-mono text-[11px] text-gray-500 tracking-[0.2em] uppercase mt-2 max-w-md">
                                            Decentralized Project Evaluation Hub — Submit. Score. Fund.
                                        </p>
                                        <div className="flex gap-3 mt-6">
                                            <Link href="/submit" className="submit-btn text-xs !py-3 !px-6">
                                                ◈ Submit Project
                                            </Link>
                                            <Link
                                                href="/leaderboard"
                                                className="px-6 py-3 rounded-lg border border-terminal-border font-mono text-xs text-gray-400 uppercase tracking-wider
                          hover:border-matrix/50 hover:text-matrix hover:bg-matrix/5 transition-all duration-300"
                                            >
                                                ◉ Leaderboard
                                            </Link>
                                        </div>
                                    </motion.div>

                                    {/* Stats Cards */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.6, delay: 0.6 }}
                                        className="grid grid-cols-2 sm:grid-cols-2 gap-4 w-full max-w-md"
                                    >
                                        <StatCard label="Projects Scored" value={String(projects.length)} color="text-lobster" />
                                        <StatCard label="Fee Pool" value={`$${(feePool / 1000).toFixed(0)}K`} color="text-matrix" />
                                        <StatCard label="Active Niches" value="5" color="text-purple-400" />
                                        <StatCard label="Top Score" value={projects[0]?.totalScore.toFixed(1) || '—'} color="text-yellow-400" />
                                    </motion.div>
                                </div>
                            </section>

                            {/* Countdown + Treasury Row */}
                            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <CountdownTimer />
                                    <WalletConnect />
                                </div>
                            </section>

                            {/* Agent Chat */}
                            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                                <AgentChat />
                            </section>

                            {/* Top 3 Preview */}
                            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.8 }}
                                >
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                            <h2 className="font-mono text-xs text-yellow-400 tracking-[0.2em] uppercase font-semibold">
                                                Funding Leaders
                                            </h2>
                                        </div>
                                        <Link
                                            href="/leaderboard"
                                            className="font-mono text-[10px] text-gray-500 hover:text-lobster transition-colors uppercase tracking-wider"
                                        >
                                            View all →
                                        </Link>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {top3.map((project, i) => {
                                            const payout = totalScores > 0 ? ((project.totalScore / totalScores) * feePool) : 0;
                                            const medals = ['🥇', '🥈', '🥉'];
                                            const borderColors = ['border-yellow-500/40', 'border-gray-400/40', 'border-amber-700/40'];
                                            return (
                                                <Link key={project.id} href="/leaderboard">
                                                    <div className={`glass-card glass-card-hover p-5 border-t-2 ${borderColors[i]} cursor-pointer group`}>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="text-2xl">{medals[i]}</span>
                                                            <span className="font-mono text-xl font-bold text-lobster lobster-glow">
                                                                {project.totalScore.toFixed(1)}
                                                            </span>
                                                        </div>
                                                        <h3 className="font-semibold text-white text-base mb-1 group-hover:text-lobster transition-colors glitch-hover">
                                                            {project.name}
                                                        </h3>
                                                        <p className="font-mono text-[10px] text-gray-500 mb-3 line-clamp-2">
                                                            {project.pitch}
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-mono text-[9px] text-purple-400">{project.niche}</span>
                                                            <span className="font-mono text-xs text-matrix font-semibold">
                                                                ${payout.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            </section>

                            {/* Status Bar */}
                            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-auto">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.2 }}
                                    className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap"
                                >
                                    <StatusPill label="Protocol" value="v1.0.0" color="text-lobster" />
                                    <StatusPill label="Network" value="Base L2" color="text-blue-400" />
                                    <StatusPill label="Status" value="Active" color="text-matrix" dot />
                                    <StatusPill label="Agents" value="3 ONLINE" color="text-lobster" dot />
                                </motion.div>
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <ProjectDetail />
        </main>
    );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="glass-card p-4 text-center">
            <p className="font-mono text-[9px] text-gray-600 uppercase tracking-wider mb-1">{label}</p>
            <p className={`font-mono text-2xl font-bold ${color}`}>{value}</p>
        </div>
    );
}

function StatusPill({ label, value, color, dot }: { label: string; value: string; color: string; dot?: boolean }) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-terminal-border/50 bg-terminal-dark/50">
            {dot && <span className="w-1.5 h-1.5 rounded-full bg-matrix animate-pulse" />}
            <span className="font-mono text-[9px] text-gray-600 uppercase">{label}:</span>
            <span className={`font-mono text-[10px] font-semibold ${color}`}>{value}</span>
        </div>
    );
}
