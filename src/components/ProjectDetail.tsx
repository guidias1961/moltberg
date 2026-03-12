'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useMoltbergStore, Project } from '@/store/store';

const NICHE_COLORS: Record<string, string> = {
    'DeFi Disruption': 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    'Social Fix': 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    'AI Agent Economy': 'text-purple-400 bg-purple-400/10 border-purple-400/30',
    'Hardware Innovation': 'text-green-400 bg-green-400/10 border-green-400/30',
    'Bio-Hacking': 'text-rose-400 bg-rose-400/10 border-rose-400/30',
};

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = (value / max) * 100;
    return (
        <div className="mb-3">
            <div className="flex justify-between mb-1">
                <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">{label}</span>
                <span className={`font-mono text-xs font-bold ${color}`}>{value.toFixed(2)}/{max}</span>
            </div>
            <div className="w-full h-1.5 bg-terminal-dark rounded-full overflow-hidden border border-terminal-border/50">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${pct > 80 ? 'bg-matrix' : pct > 60 ? 'bg-yellow-500' : 'bg-lobster'
                        }`}
                />
            </div>
        </div>
    );
}

export default function ProjectDetail() {
    const { selectedProject, selectProject, projects, feePool } = useMoltbergStore();

    if (!selectedProject) return null;

    const project = selectedProject;
    const rank = projects.findIndex((p) => p.id === project.id) + 1;
    const totalScores = projects.reduce((sum, p) => sum + p.totalScore, 0);
    const payout = totalScores > 0 ? ((project.totalScore / totalScores) * feePool) : 0;
    const nicheStyle = NICHE_COLORS[project.niche] || 'text-gray-400';
    const date = new Date(project.timestamp);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                onClick={() => selectProject(null)}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-terminal-dark/80 backdrop-blur-sm" />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="glass-card w-full max-w-2xl max-h-[85vh] overflow-y-auto relative z-10 custom-scroll"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 z-20 bg-terminal-mid/95 backdrop-blur px-6 py-4 border-b border-terminal-border flex items-start justify-between rounded-t-2xl">
                        <div className="flex items-center gap-4">
                            <Image src="/moltberg.png" alt="MOLTBERG" width={44} height={44} className="drop-shadow-[0_0_10px_rgba(255,69,0,0.3)]" />
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    {project.name}
                                    <span className="font-mono text-xs font-normal text-gray-500">#{rank}</span>
                                </h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${nicheStyle}`}>
                                        {project.niche}
                                    </span>
                                    <span className="font-mono text-[10px] text-gray-600">
                                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => selectProject(null)}
                            className="text-gray-500 hover:text-lobster transition-colors font-mono text-lg leading-none p-1"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Pitch */}
                        <div>
                            <h3 className="font-mono text-[10px] text-gray-500 uppercase tracking-wider mb-2">Submitted Pitch</h3>
                            <p className="text-sm text-gray-300 leading-relaxed bg-terminal-dark/50 rounded-lg p-4 border border-terminal-border/50 font-mono">
                                &quot;{project.pitch}&quot;
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="font-mono text-[10px] text-gray-600">Submitter: {project.submitter}</span>
                            </div>
                        </div>

                        {/* Score Overview */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-terminal-dark/50 rounded-lg p-4 border border-terminal-border/50">
                                <p className="font-mono text-[10px] text-gray-500 uppercase mb-1">Moltberg Score</p>
                                <p className="font-mono text-3xl font-bold text-lobster lobster-glow">{project.totalScore.toFixed(2)}</p>
                                <p className="font-mono text-[10px] text-gray-600 mt-0.5">out of 100.00</p>
                            </div>
                            <div className="bg-terminal-dark/50 rounded-lg p-4 border border-terminal-border/50">
                                <p className="font-mono text-[10px] text-gray-500 uppercase mb-1">Est. Payout</p>
                                <p className="font-mono text-3xl font-bold text-matrix matrix-glow">${payout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                <p className="font-mono text-[10px] text-gray-600 mt-0.5">
                                    {rank <= 3 ? '✓ Funding eligible' : '✗ Below Top 3 threshold'}
                                </p>
                            </div>
                        </div>

                        {/* Score Bars */}
                        <div className="bg-terminal-dark/30 rounded-lg p-4 border border-terminal-border/50">
                            <h3 className="font-mono text-[10px] text-gray-500 uppercase tracking-wider mb-4">Score Breakdown</h3>
                            <ScoreBar label="Feasibility" value={project.scores.feasibility} max={33.33} color="text-blue-400" />
                            <ScoreBar label="Market Disruption" value={project.scores.marketDisruption} max={33.33} color="text-orange-400" />
                            <ScoreBar label="Narrative Strength" value={project.scores.narrativeStrength} max={33.34} color="text-purple-400" />
                        </div>

                        {/* Per-Agent Breakdown */}
                        {project.agentBreakdown && project.agentBreakdown.length > 0 && (
                            <div className="bg-terminal-dark/30 rounded-lg p-4 border border-terminal-border/50">
                                <h3 className="font-mono text-[10px] text-gray-500 uppercase tracking-wider mb-4">
                                    Tribunal Breakdown — Per Agent
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {project.agentBreakdown.map((ab) => {
                                        const agentColors: Record<string, { accent: string; text: string; border: string }> = {
                                            moltberg: { accent: '#FF4500', text: 'text-lobster', border: 'border-lobster/40' },
                                            bozworth: { accent: '#00C8FF', text: 'text-cyan-400', border: 'border-cyan-400/40' },
                                            coxwell: { accent: '#A855F7', text: 'text-purple-400', border: 'border-purple-400/40' },
                                        };
                                        const colors = agentColors[ab.agent] || agentColors.moltberg;
                                        return (
                                            <div key={ab.agent} className={`rounded-lg p-3 border ${colors.border} bg-white/[0.02]`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent }} />
                                                    <span className={`font-mono text-[10px] font-bold ${colors.text} uppercase`}>
                                                        {ab.agent}
                                                    </span>
                                                    <span className={`ml-auto font-mono text-[8px] ${ab.online ? 'text-matrix' : 'text-red-400'}`}>
                                                        {ab.online ? '● ONLINE' : '● OFFLINE'}
                                                    </span>
                                                </div>
                                                {ab.scores && ab.totalScore !== null ? (
                                                    <>
                                                        <p className={`font-mono text-xl font-bold ${colors.text} mb-1`}>
                                                            {ab.totalScore.toFixed(2)}
                                                        </p>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between font-mono text-[9px]">
                                                                <span className="text-gray-600">FEA</span>
                                                                <span className="text-gray-400">{ab.scores.feasibility.toFixed(1)}</span>
                                                            </div>
                                                            <div className="flex justify-between font-mono text-[9px]">
                                                                <span className="text-gray-600">MKT</span>
                                                                <span className="text-gray-400">{ab.scores.marketDisruption.toFixed(1)}</span>
                                                            </div>
                                                            <div className="flex justify-between font-mono text-[9px]">
                                                                <span className="text-gray-600">NAR</span>
                                                                <span className="text-gray-400">{ab.scores.narrativeStrength.toFixed(1)}</span>
                                                            </div>
                                                        </div>
                                                        <p className="font-mono text-[8px] text-gray-700 mt-1">
                                                            Weight: {(ab.weight * 100).toFixed(0)}%
                                                        </p>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col gap-1 mt-1">
                                                        <p className="font-mono text-[10px] text-gray-600">Agent unavailable</p>
                                                        {ab.error && (
                                                            <div className="mt-2 p-2 bg-red-500/15 border border-red-500/40 rounded animate-pulse">
                                                                <p className="font-mono text-[8px] text-red-500 uppercase font-bold mb-1">
                                                                    Tribunal API Error:
                                                                </p>
                                                                <p className="font-mono text-[9px] text-red-300 break-all">
                                                                    &quot;{ab.error}&quot;
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Agent Rationale */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Image src="/moltberg.png" alt="" width={24} height={24} />
                                <h3 className="font-mono text-xs text-lobster tracking-[0.15em] uppercase font-semibold">
                                    Tribunal Analysis
                                </h3>
                                {project.aiPowered ? (
                                    <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-matrix/15 text-matrix border border-matrix/30 flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-matrix animate-pulse" />
                                        AI-POWERED
                                    </span>
                                ) : (
                                    <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-gray-600/15 text-gray-500 border border-gray-600/30">
                                        DETERMINISTIC
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3">
                                <RationaleBox
                                    title="Feasibility Analysis"
                                    text={project.rationale.feasibility}
                                    borderColor="border-blue-500/30"
                                    iconColor="bg-blue-500"
                                />
                                <RationaleBox
                                    title="Market Disruption Analysis"
                                    text={project.rationale.marketDisruption}
                                    borderColor="border-orange-500/30"
                                    iconColor="bg-orange-500"
                                />
                                <RationaleBox
                                    title="Narrative Strength Analysis"
                                    text={project.rationale.narrativeStrength}
                                    borderColor="border-purple-500/30"
                                    iconColor="bg-purple-500"
                                />
                                <RationaleBox
                                    title="Final Verdict"
                                    text={project.rationale.verdict}
                                    borderColor="border-lobster/40"
                                    iconColor="bg-lobster"
                                    highlight
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function RationaleBox({
    title,
    text,
    borderColor,
    iconColor,
    highlight,
}: {
    title: string;
    text: string;
    borderColor: string;
    iconColor: string;
    highlight?: boolean;
}) {
    // Extract the tier tag like [FEASIBILITY → HIGH]
    const tierMatch = text.match(/\[([^\]]+)\]/);
    const tier = tierMatch ? tierMatch[1] : '';
    const body = tierMatch ? text.slice(tierMatch[0].length).trim() : text;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`border-l-2 ${borderColor} bg-terminal-dark/40 rounded-r-lg p-4 relative overflow-hidden ${highlight ? 'ring-1 ring-lobster/20' : ''
                }`}
        >
            {highlight && (
                <div className="absolute inset-0 bg-gradient-to-r from-lobster/[0.03] to-transparent pointer-events-none" />
            )}
            <div className="flex items-center gap-2 mb-2">
                <span className={`w-1.5 h-1.5 rounded-full ${iconColor}`} />
                <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">{title}</span>
                {tier && (
                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${tier.includes('HIGH') || tier.includes('ELITE') ? 'bg-matrix/10 text-matrix' :
                        tier.includes('MODERATE') || tier.includes('COMPETITIVE') ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-lobster/10 text-lobster'
                        }`}>
                        {tier}
                    </span>
                )}
            </div>
            <p className="font-mono text-[11px] leading-relaxed text-gray-400 relative z-10">{body}</p>
        </motion.div>
    );
}
