'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMoltbergStore, Niche } from '@/store/store';

const NICHES: { id: Niche; icon: string; color: string }[] = [
    { id: 'DeFi Disruption', icon: '⟐', color: 'from-orange-600/20 to-red-600/10 border-orange-500/40 hover:border-orange-400' },
    { id: 'Social Fix', icon: '◉', color: 'from-blue-600/20 to-cyan-600/10 border-blue-500/40 hover:border-blue-400' },
    { id: 'AI Agent Economy', icon: '⧫', color: 'from-purple-600/20 to-pink-600/10 border-purple-500/40 hover:border-purple-400' },
    { id: 'Hardware Innovation', icon: '⬡', color: 'from-green-600/20 to-emerald-600/10 border-green-500/40 hover:border-green-400' },
    { id: 'Bio-Hacking', icon: '⌬', color: 'from-rose-600/20 to-amber-600/10 border-rose-500/40 hover:border-rose-400' },
];

const ANALYSIS_STAGES: Record<Niche, string[]> = {
    'DeFi Disruption': ['Scanning tokenomics model...', 'Mapping liquidity vectors...', 'Simulating market shock...', 'Benchmarking yield curves...', 'Scoring protocol resilience...', 'Compiling Moltberg verdict...'],
    'Social Fix': ['Parsing social graph...', 'Measuring virality potential...', 'Evaluating adoption friction...', 'Modeling network effects...', 'Scoring community resilience...', 'Compiling Moltberg verdict...'],
    'AI Agent Economy': ['Decomposing agent stack...', 'Evaluating inference cost curve...', 'Mapping autonomy vectors...', 'Stress-testing decision loops...', 'Scoring scalability index...', 'Compiling Moltberg verdict...'],
    'Hardware Innovation': ['Scanning BOM feasibility...', 'Modeling supply chain risk...', 'Estimating unit economics...', 'Evaluating IP defensibility...', 'Scoring production readiness...', 'Compiling Moltberg verdict...'],
    'Bio-Hacking': ['Parsing biometric pipeline...', 'Evaluating FDA pathway...', 'Mapping human-data ethics...', 'Scoring clinical viability...', 'Benchmarking wearable stack...', 'Compiling Moltberg verdict...'],
};

export default function InputChamber() {
    const { phase, addProject, isAnalyzing, analysisProgress, setAnalyzing, setAnalysisProgress } = useMoltbergStore();
    const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
    const [projectName, setProjectName] = useState('');
    const [pitch, setPitch] = useState('');
    const [analysisComplete, setAnalysisComplete] = useState(false);
    const [lastScored, setLastScored] = useState<string | null>(null);

    const runAnalysis = useCallback(() => {
        if (!projectName.trim() || !pitch.trim() || !selectedNiche) return;

        setAnalyzing(true);
        setAnalysisProgress(0);
        setAnalysisComplete(false);

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 11 + 3;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setAnalysisProgress(100);
                setTimeout(() => {
                    addProject(projectName.trim(), pitch.trim(), selectedNiche);
                    setLastScored(projectName.trim());
                    setAnalyzing(false);
                    setAnalysisComplete(true);
                    setProjectName('');
                    setPitch('');
                    setSelectedNiche(null);
                    setTimeout(() => setAnalysisComplete(false), 4000);
                }, 600);
            } else {
                setAnalysisProgress(Math.round(progress));
            }
        }, 200);
    }, [projectName, pitch, selectedNiche, addProject, setAnalyzing, setAnalysisProgress]);

    if (phase !== 'dashboard') return null;

    const stages = selectedNiche ? ANALYSIS_STAGES[selectedNiche] : ANALYSIS_STAGES['DeFi Disruption'];
    const currentStage = Math.min(Math.floor(analysisProgress / (100 / stages.length)), stages.length - 1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md"
        >
            <div className="glass-card glass-card-hover p-6 relative overflow-hidden">
                {/* Analysis overlay */}
                <AnimatePresence>
                    {isAnalyzing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-terminal-dark/95 backdrop-blur-sm"
                        >
                            <div className="analysis-overlay absolute inset-0" />

                            {/* Horizontal scan */}
                            <motion.div
                                className="absolute left-0 w-full h-[1px]"
                                style={{ background: 'linear-gradient(90deg, transparent, #FF4500, transparent)' }}
                                animate={{ top: ['0%', '100%'] }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                            />
                            {/* Vertical scan */}
                            <motion.div
                                className="absolute top-0 h-full w-[1px]"
                                style={{ background: 'linear-gradient(180deg, transparent, #00FF41, transparent)' }}
                                animate={{ left: ['0%', '100%'] }}
                                transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                            />

                            <div className="relative z-10 flex flex-col items-center gap-4">
                                {/* Spinner */}
                                <div className="relative w-16 h-16">
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-lobster/30"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                        style={{ borderTopColor: '#FF4500', borderRightColor: 'transparent' }}
                                    />
                                    <motion.div
                                        className="absolute inset-2 rounded-full border border-matrix/30"
                                        animate={{ rotate: -360 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                        style={{ borderBottomColor: '#00FF41', borderLeftColor: 'transparent' }}
                                    />
                                </div>

                                <div className="text-center">
                                    <p className="font-mono text-xs text-lobster tracking-wider uppercase mb-2 glitch-hover">
                                        Deep Analysis
                                    </p>
                                    <p className="font-mono text-[11px] text-matrix/80 mb-3 h-4">
                                        {stages[currentStage]}
                                    </p>

                                    {/* Progress */}
                                    <div className="w-48 h-1 bg-terminal-dark rounded-full overflow-hidden border border-terminal-border">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${analysisProgress}%`,
                                                background: 'linear-gradient(90deg, #FF4500, #00FF41)',
                                            }}
                                        />
                                    </div>
                                    <p className="font-mono text-[10px] text-gray-600 mt-1">{analysisProgress}%</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Success */}
                <AnimatePresence>
                    {analysisComplete && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-0 left-0 right-0 py-2 px-4 bg-matrix/10 border-b border-matrix/30 z-10"
                        >
                            <p className="font-mono text-[11px] text-matrix text-center">
                                ✓ &quot;{lastScored}&quot; scored and ranked
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-1.5 h-1.5 rounded-full bg-lobster animate-pulse" />
                    <h2 className="font-mono text-xs text-lobster tracking-[0.2em] uppercase font-semibold">
                        Input Chamber
                    </h2>
                </div>

                {/* ── Niche Selection Grid ── */}
                <div className="mb-5">
                    <label className="block font-mono text-[10px] text-gray-500 uppercase tracking-wider mb-3">
                        Select Niche
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {NICHES.map((n) => (
                            <button
                                key={n.id}
                                onClick={() => setSelectedNiche(n.id)}
                                disabled={isAnalyzing}
                                className={`
                  px-3 py-2.5 rounded-lg border font-mono text-[11px] text-left
                  bg-gradient-to-br transition-all duration-300 relative overflow-hidden
                  ${n.color}
                  ${selectedNiche === n.id
                                        ? 'ring-1 ring-lobster/60 shadow-[0_0_15px_rgba(255,69,0,0.15)]'
                                        : 'opacity-70 hover:opacity-100'
                                    }
                  disabled:opacity-30
                `}
                            >
                                {selectedNiche === n.id && (
                                    <motion.div
                                        layoutId="niche-select"
                                        className="absolute inset-0 border border-lobster/40 rounded-lg"
                                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    />
                                )}
                                <span className="mr-1.5 text-sm">{n.icon}</span>
                                {n.id}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Project Name */}
                <AnimatePresence>
                    {selectedNiche && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="mb-4">
                                <label className="block font-mono text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                                    Project Designation
                                </label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="Enter project codename..."
                                    className="terminal-input w-full px-4 py-3 rounded-lg text-sm"
                                    disabled={isAnalyzing}
                                />
                            </div>

                            <div className="mb-5">
                                <label className="block font-mono text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                                    Vision Narrative
                                </label>
                                <textarea
                                    value={pitch}
                                    onChange={(e) => setPitch(e.target.value)}
                                    placeholder={`Describe your ${selectedNiche} vision...`}
                                    rows={4}
                                    className="terminal-input w-full px-4 py-3 rounded-lg text-sm resize-none"
                                    disabled={isAnalyzing}
                                />
                                <div className="flex justify-between mt-1">
                                    <span className="font-mono text-[10px] text-gray-600">
                                        {pitch.length > 0 ? `${pitch.length} chars` : ''}
                                    </span>
                                    <span className="font-mono text-[10px] text-gray-600">Min. 20 chars</span>
                                </div>
                            </div>

                            <button
                                onClick={runAnalysis}
                                disabled={isAnalyzing || !projectName.trim() || pitch.trim().length < 20}
                                className="submit-btn w-full text-xs disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
                            >
                                {isAnalyzing ? '◈ ANALYZING...' : '◈ SUBMIT FOR ANALYSIS'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
