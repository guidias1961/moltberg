'use client';

import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/Navigation';
import ProjectDetail from '@/components/ProjectDetail';
import Image from 'next/image';
import Link from 'next/link';
import { useMoltbergStore } from '@/store/store';
import { useRouter } from 'next/navigation';

const DataStream = dynamic(() => import('@/components/DataStream'), { ssr: false });

const NICHE_STYLES: Record<string, { text: string; bg: string; border: string }> = {
    'DeFi Disruption': { text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
    'Social Fix': { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' },
    'AI Agent Economy': { text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30' },
    'Hardware Innovation': { text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30' },
    'Bio-Hacking': { text: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/30' },
};

export default function LeaderboardPage() {
    const { projects, feePool, phase, selectProject } = useMoltbergStore();
    const router = useRouter();

    if (phase === 'intro') {
        router.push('/');
        return null;
    }

    const totalScores = projects.reduce((sum, p) => sum + p.totalScore, 0);

    const getRankBadge = (i: number) => {
        if (i === 0) return { label: '1ST', bg: 'bg-yellow-400/15', text: 'text-yellow-400', ring: 'ring-yellow-400/30' };
        if (i === 1) return { label: '2ND', bg: 'bg-gray-300/10', text: 'text-gray-300', ring: 'ring-gray-300/20' };
        if (i === 2) return { label: '3RD', bg: 'bg-amber-600/10', text: 'text-amber-600', ring: 'ring-amber-600/20' };
        return { label: `${i + 1}`, bg: 'bg-transparent', text: 'text-gray-500', ring: '' };
    };

    const top3 = projects.slice(0, 3);
    const rest = projects.slice(3);

    return (
        <main className="relative min-h-screen overflow-hidden">
            <DataStream />
            <div className="data-stream-bg" />
            <div className="scan-line" />

            <div className="relative z-10 min-h-screen flex flex-col">
                <Navigation />

                <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    {/* Page Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10"
                    >
                        <div className="flex items-center gap-3">
                            <Image src="/moltberg.png" alt="" width={40} height={40} className="drop-shadow-[0_0_10px_rgba(255,69,0,0.3)]" />
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white glitch-hover">
                                    Live Leaderboard
                                </h1>
                                <p className="font-mono text-[11px] text-gray-500">
                                    {projects.length} projects ranked by Moltberg Score — Top 3 receive funding
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="glass-card px-4 py-2">
                                <p className="font-mono text-[9px] text-gray-600 uppercase">Fee Pool</p>
                                <p className="font-mono text-sm font-bold text-lobster lobster-glow">
                                    ${feePool.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                            <Link href="/submit" className="submit-btn text-[11px] !py-2.5 !px-5">
                                ◈ Submit
                            </Link>
                        </div>
                    </motion.div>

                    {/* Top 3 Podium */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mb-8"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                            {/* Reorder for podium: 2nd, 1st, 3rd on desktop */}
                            {[top3[1], top3[0], top3[2]].filter(Boolean).map((project, i) => {
                                if (!project) return null;
                                const realIndex = projects.indexOf(project);
                                const badge = getRankBadge(realIndex);
                                const payout = totalScores > 0 ? ((project.totalScore / totalScores) * feePool) : 0;
                                const isFirst = realIndex === 0;
                                const nicheStyle = NICHE_STYLES[project.niche];

                                return (
                                    <motion.div
                                        key={project.id}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => selectProject(project)}
                                        className={`glass-card glass-card-hover p-6 cursor-pointer relative overflow-hidden
                      ${isFirst ? 'sm:row-start-1 sm:-mt-4 ring-1 ring-yellow-400/20' : ''}
                      ${i === 0 ? 'sm:order-1' : i === 1 ? 'sm:order-0 order-first' : 'sm:order-2'}
                    `}
                                    >
                                        {isFirst && (
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400/50 via-lobster/50 to-yellow-400/50" />
                                        )}

                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`font-mono text-xs font-bold px-3 py-1 rounded-lg ring-1 ${badge.bg} ${badge.text} ${badge.ring}`}>
                                                {badge.label}
                                            </span>
                                            <span className="font-mono text-2xl sm:text-3xl font-bold text-lobster lobster-glow">
                                                {project.totalScore.toFixed(1)}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-white mb-1 glitch-hover">{project.name}</h3>
                                        <span className={`font-mono text-[10px] px-2 py-0.5 rounded border inline-block mb-3 ${nicheStyle?.text} ${nicheStyle?.bg} ${nicheStyle?.border}`}>
                                            {project.niche}
                                        </span>

                                        <p className="font-mono text-[11px] text-gray-500 leading-relaxed line-clamp-3 mb-4">
                                            {project.pitch}
                                        </p>

                                        {/* Score bars mini */}
                                        <div className="space-y-1.5">
                                            {[
                                                { label: 'F', value: project.scores.feasibility, max: 33.33, color: 'bg-blue-500' },
                                                { label: 'M', value: project.scores.marketDisruption, max: 33.33, color: 'bg-orange-500' },
                                                { label: 'N', value: project.scores.narrativeStrength, max: 33.34, color: 'bg-purple-500' },
                                            ].map((s) => (
                                                <div key={s.label} className="flex items-center gap-2">
                                                    <span className="font-mono text-[8px] text-gray-600 w-3">{s.label}</span>
                                                    <div className="flex-1 h-1 bg-terminal-dark rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${s.color}`} style={{ width: `${(s.value / s.max) * 100}%` }} />
                                                    </div>
                                                    <span className="font-mono text-[9px] text-gray-500 w-8 text-right">{s.value.toFixed(1)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-terminal-border/50 flex justify-between items-center">
                                            <span className="font-mono text-[10px] text-gray-600">{project.submitter}</span>
                                            <span className="font-mono text-sm text-matrix font-semibold">
                                                ${payout.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Rest of rankings */}
                    {rest.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <div className="glass-card overflow-hidden">
                                {/* Table Header */}
                                <div className="grid grid-cols-[50px_1fr_100px_100px_100px] gap-2 px-6 py-3 border-b border-terminal-border/50 bg-terminal-dark/50 hidden sm:grid">
                                    <span className="font-mono text-[9px] text-gray-600 uppercase tracking-wider">Rank</span>
                                    <span className="font-mono text-[9px] text-gray-600 uppercase tracking-wider">Project</span>
                                    <span className="font-mono text-[9px] text-gray-600 uppercase tracking-wider text-right">Score</span>
                                    <span className="font-mono text-[9px] text-gray-600 uppercase tracking-wider text-right">Payout</span>
                                    <span className="font-mono text-[9px] text-gray-600 uppercase tracking-wider text-right">Niche</span>
                                </div>

                                <AnimatePresence mode="popLayout">
                                    {rest.map((project) => {
                                        const index = projects.indexOf(project);
                                        const badge = getRankBadge(index);
                                        const payout = totalScores > 0 ? ((project.totalScore / totalScores) * feePool) : 0;
                                        const nicheStyle = NICHE_STYLES[project.niche];

                                        return (
                                            <motion.div
                                                key={project.id}
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                transition={{ duration: 0.3 }}
                                                onClick={() => selectProject(project)}
                                                className="grid grid-cols-1 sm:grid-cols-[50px_1fr_100px_100px_100px] gap-2 sm:gap-2 px-6 py-4 border-b border-terminal-border/30
                          hover:bg-white/[0.03] cursor-pointer transition-colors group"
                                            >
                                                {/* Rank */}
                                                <span className={`font-mono text-xs font-bold ${badge.text} hidden sm:block self-center`}>
                                                    {badge.label}
                                                </span>

                                                {/* Project */}
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 sm:gap-0 sm:flex-col sm:items-start">
                                                        <span className={`font-mono text-xs font-bold sm:hidden ${badge.text}`}>{badge.label}</span>
                                                        <p className="font-semibold text-sm text-gray-300 group-hover:text-white truncate glitch-hover">
                                                            {project.name}
                                                        </p>
                                                    </div>
                                                    <p className="font-mono text-[10px] text-gray-600 truncate mt-0.5">
                                                        F:{project.scores.feasibility.toFixed(1)} M:{project.scores.marketDisruption.toFixed(1)} N:{project.scores.narrativeStrength.toFixed(1)}
                                                    </p>
                                                </div>

                                                {/* Score */}
                                                <span className="hidden sm:block font-mono text-sm font-bold text-gray-400 text-right self-center">
                                                    {project.totalScore.toFixed(2)}
                                                </span>

                                                {/* Payout */}
                                                <span className="hidden sm:block font-mono text-xs text-gray-500 text-right self-center">
                                                    ${payout.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </span>

                                                {/* Niche */}
                                                <span className={`font-mono text-[10px] text-right self-center hidden sm:block ${nicheStyle?.text}`}>
                                                    {project.niche}
                                                </span>

                                                {/* Mobile summary */}
                                                <div className="sm:hidden flex items-center justify-between mt-1">
                                                    <span className={`font-mono text-[10px] ${nicheStyle?.text}`}>{project.niche}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono text-sm font-bold text-gray-400">{project.totalScore.toFixed(1)}</span>
                                                        <span className="font-mono text-xs text-matrix">${payout.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {/* Footer */}
                                <div className="px-6 py-3 border-t border-terminal-border/50 flex justify-between items-center bg-terminal-dark/30">
                                    <span className="font-mono text-[10px] text-gray-600">Click any project to view Moltberg analysis</span>
                                    <span className="font-mono text-[10px] text-lobster">Pool: ${feePool.toLocaleString()}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            <ProjectDetail />
        </main>
    );
}
