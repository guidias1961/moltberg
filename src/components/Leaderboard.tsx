'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMoltbergStore } from '@/store/store';

export default function Leaderboard() {
    const { projects, feePool, phase, selectProject } = useMoltbergStore();

    if (phase !== 'dashboard') return null;

    const totalScores = projects.reduce((sum, p) => sum + p.totalScore, 0);

    const getRankClass = (i: number) => {
        if (i === 0) return 'rank-gold';
        if (i === 1) return 'rank-silver';
        if (i === 2) return 'rank-bronze';
        return 'border-l-2 border-transparent';
    };

    const getRankBadge = (i: number) => {
        if (i === 0) return { label: '1ST', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
        if (i === 1) return { label: '2ND', color: 'text-gray-300', bg: 'bg-gray-300/10' };
        if (i === 2) return { label: '3RD', color: 'text-amber-600', bg: 'bg-amber-600/10' };
        return { label: `${i + 1}`, color: 'text-gray-500', bg: 'bg-transparent' };
    };

    const NICHE_COLORS: Record<string, string> = {
        'DeFi Disruption': 'text-orange-400',
        'Social Fix': 'text-blue-400',
        'AI Agent Economy': 'text-purple-400',
        'Hardware Innovation': 'text-green-400',
        'Bio-Hacking': 'text-rose-400',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-full max-w-xl"
        >
            <div className="glass-card p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-matrix animate-pulse" />
                        <h2 className="font-mono text-xs text-matrix tracking-[0.2em] uppercase font-semibold">
                            Live Leaderboard
                        </h2>
                    </div>
                    <span className="font-mono text-[10px] text-gray-500">{projects.length} ranked</span>
                </div>

                {/* Column Headers */}
                <div className="grid grid-cols-[44px_1fr_70px_90px] gap-2 mb-3 px-3">
                    <span className="font-mono text-[9px] text-gray-600 uppercase tracking-wider">#</span>
                    <span className="font-mono text-[9px] text-gray-600 uppercase tracking-wider">Project</span>
                    <span className="font-mono text-[9px] text-gray-600 uppercase tracking-wider text-right">Score</span>
                    <span className="font-mono text-[9px] text-gray-600 uppercase tracking-wider text-right">Payout</span>
                </div>

                {/* Rows */}
                <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1 custom-scroll">
                    <AnimatePresence mode="popLayout">
                        {projects.map((project, index) => {
                            const badge = getRankBadge(index);
                            const payout = totalScores > 0
                                ? ((project.totalScore / totalScores) * feePool).toFixed(2)
                                : '0.00';

                            return (
                                <motion.div
                                    key={project.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3, delay: index * 0.03 }}
                                    onClick={() => selectProject(project)}
                                    className={`grid grid-cols-[44px_1fr_70px_90px] gap-2 items-center px-3 py-2.5 rounded-lg cursor-pointer
                    ${getRankClass(index)}
                    ${index < 3 ? 'bg-white/[0.02]' : ''}
                    hover:bg-white/[0.06] hover:border-lobster/20 transition-all group`}
                                >
                                    {/* Rank */}
                                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${badge.bg} ${badge.color}`}>
                                        {badge.label}
                                    </span>

                                    {/* Project */}
                                    <div className="min-w-0">
                                        <p className={`font-medium text-sm truncate glitch-hover ${index < 3 ? 'text-white' : 'text-gray-300'}`}>
                                            {project.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`font-mono text-[9px] ${NICHE_COLORS[project.niche] || 'text-gray-500'}`}>
                                                {project.niche}
                                            </span>
                                            <span className="font-mono text-[8px] text-gray-700">|</span>
                                            <span className="font-mono text-[9px] text-gray-600">
                                                F:{project.scores.feasibility.toFixed(1)} M:{project.scores.marketDisruption.toFixed(1)} N:{project.scores.narrativeStrength.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <span className={`font-mono text-sm font-bold text-right ${index < 3 ? 'text-lobster' : 'text-gray-400'}`}>
                                        {project.totalScore.toFixed(2)}
                                    </span>

                                    {/* Payout */}
                                    <span className={`font-mono text-xs text-right ${index < 3 ? 'text-matrix' : 'text-gray-500'}`}>
                                        ${Number(payout).toLocaleString()}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-terminal-border flex justify-between items-center">
                    <span className="font-mono text-[10px] text-gray-600">Click a project to view analysis</span>
                    <span className="font-mono text-[10px] text-lobster">Pool: ${feePool.toLocaleString()}</span>
                </div>
            </div>
        </motion.div>
    );
}
