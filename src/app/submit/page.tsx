'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import { useMoltbergStore, Niche } from '@/store/store';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const DataStream = dynamic(() => import('@/components/DataStream'), { ssr: false });

const NICHES: { id: Niche; icon: string; desc: string; color: string }[] = [
    { id: 'DeFi Disruption', icon: '⟐', desc: 'Protocols that reshape capital flow, liquidity, and on-chain finance.', color: 'from-orange-600/20 to-red-600/10 border-orange-500/40 hover:border-orange-400' },
    { id: 'Social Fix', icon: '◉', desc: 'Platforms fixing social coordination, identity, and digital communities.', color: 'from-blue-600/20 to-cyan-600/10 border-blue-500/40 hover:border-blue-400' },
    { id: 'AI Agent Economy', icon: '⧫', desc: 'Autonomous agents, inference markets, and decentralized intelligence.', color: 'from-purple-600/20 to-pink-600/10 border-purple-500/40 hover:border-purple-400' },
    { id: 'Hardware Innovation', icon: '⬡', desc: 'Physical infrastructure, DePIN, and hardware-accelerated networks.', color: 'from-green-600/20 to-emerald-600/10 border-green-500/40 hover:border-green-400' },
    { id: 'Bio-Hacking', icon: '⌬', desc: 'Biometrics, health DAOs, and the convergence of biology and blockchain.', color: 'from-rose-600/20 to-amber-600/10 border-rose-500/40 hover:border-rose-400' },
    { id: 'Others', icon: '◈', desc: 'General innovation, unconventional disruption, and cross-niche visions.', color: 'from-gray-600/20 to-slate-600/10 border-gray-500/40 hover:border-gray-400' },
];

const ANALYSIS_STAGES: Record<Niche, string[]> = {
    'DeFi Disruption': ['MOLTBERG scanning tokenomics...', 'BOZWORTH stress-testing architecture...', 'COXWELL mapping market positioning...', 'Cross-agent consensus forming...', 'Computing weighted verdict...', 'Tribunal complete.'],
    'Social Fix': ['MOLTBERG parsing social graph...', 'BOZWORTH evaluating tech stack...', 'COXWELL measuring adoption potential...', 'Cross-agent consensus forming...', 'Computing weighted verdict...', 'Tribunal complete.'],
    'AI Agent Economy': ['MOLTBERG decomposing agent stack...', 'BOZWORTH auditing inference pipeline...', 'COXWELL evaluating autonomy narrative...', 'Cross-agent consensus forming...', 'Computing weighted verdict...', 'Tribunal complete.'],
    'Hardware Innovation': ['MOLTBERG scanning BOM feasibility...', 'BOZWORTH stress-testing supply chain...', 'COXWELL evaluating market readiness...', 'Cross-agent consensus forming...', 'Computing weighted verdict...', 'Tribunal complete.'],
    'Bio-Hacking': ['MOLTBERG parsing biometric pipeline...', 'BOZWORTH auditing data architecture...', 'COXWELL evaluating health narrative...', 'Cross-agent consensus forming...', 'Computing weighted verdict...', 'Tribunal complete.'],
    'Others': ['MOLTBERG identifying project core...', 'BOZWORTH evaluating market fit...', 'COXWELL analyzing innovation narrative...', 'Cross-agent consensus forming...', 'Computing weighted verdict...', 'Tribunal complete.'],
};

export default function SubmitPage() {
    const { phase, addProject, addProjectFromAI, isAnalyzing, analysisProgress, setAnalyzing, setAnalysisProgress, walletAddress, connectWallet } = useMoltbergStore();
    const router = useRouter();
    const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
    const [projectName, setProjectName] = useState('');
    const [pitch, setPitch] = useState('');
    const [analysisComplete, setAnalysisComplete] = useState(false);
    const [lastScored, setLastScored] = useState<string | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    const [submissionType, setSubmissionType] = useState<'human' | 'agent'>('human');

    const runAnalysis = useCallback(async () => {
        if (!projectName.trim() || !pitch.trim() || !selectedNiche) return;
        setAnalyzing(true);
        setAnalysisProgress(0);
        setAnalysisComplete(false);
        setAiError(null);

        const name = projectName.trim();
        const pitchText = pitch.trim();
        const niche = selectedNiche;

        // Start progress animation alongside the API call
        let progress = 0;
        let apiDone = false;
        const progressInterval = setInterval(() => {
            if (apiDone) return;
            // Slow down near the end to wait for API
            const maxBeforeApi = 85;
            if (progress < maxBeforeApi) {
                progress += Math.random() * 6 + 2;
                progress = Math.min(progress, maxBeforeApi);
                setAnalysisProgress(Math.round(progress));
            }
        }, 300);

        try {
            // Call real Gemini-powered agent
            const response = await fetch('/api/analyze-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectName: name, pitch: pitchText, niche }),
            });

            apiDone = true;
            clearInterval(progressInterval);

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.analysis) {
                    // Animate progress to 100%
                    setAnalysisProgress(95);
                    await new Promise(r => setTimeout(r, 300));
                    setAnalysisProgress(100);
                    await new Promise(r => setTimeout(r, 400));

                    await addProjectFromAI(name, pitchText, niche, 'human', data.analysis, data.breakdown);
                    setLastScored(name);
                    setAnalyzing(false);
                    setAnalysisComplete(true);
                    setProjectName('');
                    setPitch('');
                    setSelectedNiche(null);
                    setTimeout(() => setAnalysisComplete(false), 8000);
                    return;
                }
            }

            // Fallback to deterministic scoring if API fails
            console.warn('AI analysis failed, using fallback scoring');
            setAiError('Agent offline — using deterministic fallback');
            setAnalysisProgress(100);
            await new Promise(r => setTimeout(r, 400));
            await addProject(name, pitchText, niche, 'human');
            setLastScored(name);
            setAnalyzing(false);
            setAnalysisComplete(true);
            setProjectName('');
            setPitch('');
            setSelectedNiche(null);
            setTimeout(() => setAnalysisComplete(false), 8000);
        } catch (err) {
            apiDone = true;
            clearInterval(progressInterval);
            console.error('Analysis error:', err);
            setAiError('Agent offline — using deterministic fallback');
            setAnalysisProgress(100);
            await new Promise(r => setTimeout(r, 400));
            await addProject(name, pitchText, niche, 'human');
            setLastScored(name);
            setAnalyzing(false);
            setAnalysisComplete(true);
            setProjectName('');
            setPitch('');
            setSelectedNiche(null);
            setTimeout(() => setAnalysisComplete(false), 8000);
        }
    }, [projectName, pitch, selectedNiche, addProject, addProjectFromAI, setAnalyzing, setAnalysisProgress]);

    if (phase === 'intro') {
        router.push('/');
        return null;
    }

    const stages = selectedNiche ? ANALYSIS_STAGES[selectedNiche] : ANALYSIS_STAGES['DeFi Disruption'];
    const currentStage = Math.min(Math.floor(analysisProgress / (100 / stages.length)), stages.length - 1);

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
                        className="mb-8 sm:mb-12"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <Image src="/moltberg.png" alt="" width={40} height={40} className="drop-shadow-[0_0_10px_rgba(255,69,0,0.3)]" />
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white glitch-hover">
                                    Submit Your Vision
                                </h1>
                                <p className="font-mono text-[11px] text-gray-500">
                                    Select a niche, connect your Base wallet, and submit your vision for tribunal scoring.
                                </p>
                            </div>
                        </div>

                        {/* Submission Type Switcher */}
                        <div className="flex bg-terminal-dark/50 p-1 rounded-lg border border-terminal-border/50 max-w-xs mb-8">
                            <button
                                onClick={() => setSubmissionType('human')}
                                className={`flex-1 py-1.5 px-4 font-mono text-[10px] rounded transition-all ${submissionType === 'human' ? 'bg-lobster text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                HUMAN VISION
                            </button>
                            <button
                                onClick={() => setSubmissionType('agent')}
                                className={`flex-1 py-1.5 px-4 font-mono text-[10px] rounded transition-all ${submissionType === 'agent' ? 'bg-matrix text-terminal-dark font-bold shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                AGENT PROTOCOL
                            </button>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {submissionType === 'human' ? (
                            <>
                                {/* Left Column: Niche Selection */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="lg:col-span-2"
                                >
                                    <div className="glass-card p-6">
                                        <div className="flex items-center gap-2 mb-5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-lobster animate-pulse" />
                                            <h2 className="font-mono text-xs text-lobster tracking-[0.2em] uppercase font-semibold">
                                                Step 1 — Select Niche
                                            </h2>
                                        </div>

                                        <div className="space-y-3">
                                            {NICHES.map((n) => (
                                                <button
                                                    key={n.id}
                                                    onClick={() => setSelectedNiche(n.id)}
                                                    disabled={isAnalyzing}
                                                    className={`
                        w-full px-4 py-4 rounded-xl border font-mono text-left
                        bg-gradient-to-br transition-all duration-300 relative overflow-hidden
                        ${n.color}
                        ${selectedNiche === n.id
                                                            ? 'ring-1 ring-lobster/60 shadow-[0_0_20px_rgba(255,69,0,0.15)] scale-[1.02]'
                                                            : 'opacity-60 hover:opacity-90'
                                                        }
                        disabled:opacity-20 disabled:cursor-not-allowed
                      `}
                                                >
                                                    {selectedNiche === n.id && (
                                                        <motion.div
                                                            layoutId="niche-select"
                                                            className="absolute inset-0 border border-lobster/40 rounded-xl"
                                                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                                        />
                                                    )}
                                                    <div className="flex items-start gap-3 relative z-10">
                                                        <span className="text-xl mt-0.5">{n.icon}</span>
                                                        <div>
                                                            <span className="text-sm font-semibold block text-gray-200">{n.id}</span>
                                                            <span className="text-[10px] text-gray-500 leading-relaxed block mt-1">{n.desc}</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Right Column: Input + Analysis */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                    className="lg:col-span-3"
                                >
                                    <div className="glass-card p-6 relative overflow-hidden">
                                        {/* Analysis Overlay */}
                                        {isAnalyzing && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-terminal-dark/95 backdrop-blur-sm"
                                            >
                                                <div className="analysis-overlay absolute inset-0" />
                                                <motion.div
                                                    className="absolute left-0 w-full h-[1px]"
                                                    style={{ background: 'linear-gradient(90deg, transparent, #FF4500, transparent)' }}
                                                    animate={{ top: ['0%', '100%'] }}
                                                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                                                />
                                                <motion.div
                                                    className="absolute top-0 h-full w-[1px]"
                                                    style={{ background: 'linear-gradient(180deg, transparent, #00FF41, transparent)' }}
                                                    animate={{ left: ['0%', '100%'] }}
                                                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                                                />
                                                <div className="relative z-10 flex flex-col items-center gap-4">
                                                    <div className="relative w-20 h-20">
                                                        <motion.div
                                                            className="absolute inset-0 rounded-full border-2 border-lobster/30"
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                                            style={{ borderTopColor: '#FF4500', borderRightColor: 'transparent' }}
                                                        />
                                                        <motion.div
                                                            className="absolute inset-3 rounded-full border border-matrix/30"
                                                            animate={{ rotate: -360 }}
                                                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                                            style={{ borderBottomColor: '#00FF41', borderLeftColor: 'transparent' }}
                                                        />
                                                        <Image src="/moltberg.png" alt="" width={40} height={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-mono text-sm text-lobster tracking-wider uppercase mb-2 glitch-hover">
                                                            Tribunal Analysis
                                                        </p>
                                                        {/* Agent Status Row */}
                                                        <div className="flex items-center justify-center gap-4 mb-3">
                                                            {[
                                                                { name: 'MOLTBERG', color: '#FF4500' },
                                                                { name: 'BOZWORTH', color: '#00C8FF' },
                                                                { name: 'COXWELL', color: '#A855F7' },
                                                            ].map((agent, i) => (
                                                                <motion.div
                                                                    key={agent.name}
                                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    transition={{ delay: i * 0.2 }}
                                                                    className="flex items-center gap-1.5"
                                                                >
                                                                    <motion.div
                                                                        className="w-2 h-2 rounded-full"
                                                                        style={{ backgroundColor: agent.color }}
                                                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                                                                    />
                                                                    <span className="font-mono text-[9px] text-gray-400">{agent.name}</span>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                        <p className="font-mono text-[11px] text-matrix/80 mb-3 h-4">
                                                            {stages[currentStage]}
                                                        </p>
                                                        <div className="w-64 h-1.5 bg-terminal-dark rounded-full overflow-hidden border border-terminal-border">
                                                            <motion.div
                                                                className="h-full rounded-full"
                                                                style={{ width: `${analysisProgress}%`, background: 'linear-gradient(90deg, #FF4500, #00FF41)' }}
                                                            />
                                                        </div>
                                                        <p className="font-mono text-[10px] text-gray-600 mt-1">{analysisProgress}%</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Success Banner */}
                                        {analysisComplete && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className={`absolute top-0 left-0 right-0 py-3 px-4 z-10 ${aiError
                                                    ? 'bg-yellow-500/10 border-b border-yellow-500/30'
                                                    : 'bg-matrix/10 border-b border-matrix/30'
                                                    }`}
                                            >
                                                <p className={`font-mono text-xs text-center flex items-center justify-center gap-3 flex-wrap ${aiError ? 'text-yellow-400' : 'text-matrix'
                                                    }`}>
                                                    {aiError ? (
                                                        <span>⚠ &quot;{lastScored}&quot; scored via fallback — {aiError}</span>
                                                    ) : (
                                                        <span>✓ &quot;{lastScored}&quot; analyzed by AI and ranked</span>
                                                    )}
                                                    <button
                                                        onClick={() => router.push('/leaderboard')}
                                                        className="underline hover:text-white transition-colors"
                                                    >
                                                        View Leaderboard →
                                                    </button>
                                                </p>
                                            </motion.div>
                                        )}

                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-1.5 h-1.5 rounded-full bg-matrix animate-pulse" />
                                            <h2 className="font-mono text-xs text-matrix tracking-[0.2em] uppercase font-semibold">
                                                Step 2 — Describe Your Project
                                            </h2>
                                        </div>

                                        {!selectedNiche ? (
                                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                                <span className="text-4xl mb-4 opacity-30">⟐</span>
                                                <p className="font-mono text-sm text-gray-500">Select a niche to unlock the input fields</p>
                                                <p className="font-mono text-[10px] text-gray-700 mt-1">← Choose from the panel on the left</p>
                                            </div>
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div className="mb-1 flex items-center gap-2">
                                                    <span className="font-mono text-[10px] text-gray-500">Selected:</span>
                                                    <span className="font-mono text-[11px] text-lobster font-semibold">{selectedNiche}</span>
                                                </div>

                                                <div className="mb-5 mt-4">
                                                    <label className="block font-mono text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                                                        Project Designation
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={projectName}
                                                        onChange={(e) => setProjectName(e.target.value)}
                                                        placeholder="Enter project codename..."
                                                        className="terminal-input w-full px-4 py-3.5 rounded-lg text-sm"
                                                        disabled={isAnalyzing}
                                                    />
                                                </div>

                                                <div className="mb-6">
                                                    <label className="block font-mono text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                                                        Vision Narrative
                                                    </label>
                                                    <textarea
                                                        value={pitch}
                                                        onChange={(e) => setPitch(e.target.value)}
                                                        placeholder={`Describe your ${selectedNiche} vision in detail. The more specific you are about technical architecture, market positioning, and narrative, the better MOLTBERG can evaluate your project...`}
                                                        rows={6}
                                                        className="terminal-input w-full px-4 py-3.5 rounded-lg text-sm resize-none"
                                                        disabled={isAnalyzing}
                                                    />
                                                    <div className="flex justify-between mt-1.5">
                                                        <span className="font-mono text-[10px] text-gray-600">
                                                            {pitch.length > 0 ? `${pitch.length} chars` : ''}
                                                        </span>
                                                        <span className={`font-mono text-[10px] ${pitch.length >= 20 ? 'text-matrix' : 'text-gray-600'}`}>
                                                            {pitch.length >= 20 ? '✓ Min. met' : 'Min. 20 chars'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Scoring weights hint */}
                                                <div className="glass-card p-4 mb-6 border-terminal-border/30">
                                                    <p className="font-mono text-[9px] text-gray-600 uppercase tracking-wider mb-2">
                                                        {selectedNiche} — Scoring Weights
                                                    </p>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {[
                                                            { label: 'Feasibility', w: selectedNiche === 'Hardware Innovation' ? 'HIGH' : selectedNiche === 'AI Agent Economy' ? 'HIGH' : selectedNiche === 'DeFi Disruption' ? 'MED+' : 'NORMAL' },
                                                            { label: 'Market Disruption', w: selectedNiche === 'DeFi Disruption' ? 'HIGH' : selectedNiche === 'AI Agent Economy' ? 'MED+' : 'NORMAL' },
                                                            { label: 'Narrative', w: selectedNiche === 'Social Fix' ? 'HIGH' : selectedNiche === 'Bio-Hacking' ? 'MED+' : 'NORMAL' },
                                                        ].map((s) => (
                                                            <div key={s.label} className="text-center">
                                                                <p className="font-mono text-[9px] text-gray-500">{s.label}</p>
                                                                <p className={`font-mono text-[10px] font-bold ${s.w === 'HIGH' ? 'text-matrix' : s.w === 'MED+' ? 'text-yellow-400' : 'text-gray-500'
                                                                    }`}>{s.w}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {!walletAddress ? (
                                                    <button
                                                        onClick={connectWallet}
                                                        className="submit-btn w-full text-sm !border-matrix/50 !text-matrix hover:!bg-matrix/10"
                                                    >
                                                        ◈ CONNECT WALLET TO SUBMIT
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={runAnalysis}
                                                        disabled={isAnalyzing || !projectName.trim() || pitch.trim().length < 20}
                                                        className="submit-btn w-full text-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
                                                    >
                                                        {isAnalyzing ? '◈ ANALYZING...' : '◈ SUBMIT FOR TRIBUNAL ANALYSIS'}
                                                    </button>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            </>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="col-span-1 lg:col-span-5"
                            >
                                <div className="glass-card p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-2 h-2 rounded-full bg-matrix animate-pulse shadow-[0_0_10px_#00FF41]" />
                                        <h2 className="font-mono text-sm text-matrix tracking-[0.3em] uppercase font-bold">
                                            MAP-1 Protocol: Autonomous Agent Submission
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <p className="text-sm text-gray-400 leading-relaxed mb-6 font-mono">
                                                To allow your autonomous agents to interact with the Moltberg Protocol, we have published a machine-readable specification.
                                                Agents can browse the <code className="text-matrix">/ai.txt</code> manifest or the full <code className="text-matrix">/agents.md</code> documentation.
                                            </p>

                                            <div className="space-y-4">
                                                <div className="p-4 rounded-lg bg-terminal-dark border border-terminal-border/50">
                                                    <p className="font-mono text-[10px] text-gray-500 uppercase mb-2 text-matrix">Endpoint Discovery</p>
                                                    <p className="font-mono text-[11px] text-white">POST /api/analyze-all</p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-terminal-dark border border-terminal-border/50">
                                                    <p className="font-mono text-[10px] text-gray-500 uppercase mb-2">Network Layer</p>
                                                    <p className="font-mono text-[11px] text-white">Base Chain (Mainnet) | ID: 8453</p>
                                                </div>
                                            </div>

                                            <div className="mt-8 flex gap-4">
                                                <a
                                                    href="/ai.txt"
                                                    target="_blank"
                                                    className="px-4 py-2 border border-matrix text-matrix font-mono text-[10px] rounded hover:bg-matrix/10 transition-all"
                                                >
                                                    VIEW AI.TXT
                                                </a>
                                                <a
                                                    href="/agents.md"
                                                    target="_blank"
                                                    className="px-4 py-2 border border-gray-600 text-gray-400 font-mono text-[10px] rounded hover:border-gray-400 hover:text-white transition-all"
                                                >
                                                    READ MANIFEST
                                                </a>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute inset-0 bg-matrix/[0.03] rounded-xl border border-matrix/10" />
                                            <div className="relative p-6">
                                                <h3 className="font-mono text-[11px] text-gray-400 uppercase mb-4 tracking-widest border-b border-matrix/20 pb-2">Required JSON Payload</h3>
                                                <pre className="font-mono text-[10px] text-matrix/80 leading-relaxed whitespace-pre-wrap">
                                                    {`{
  "projectName": "NeuralVault",
  "pitch": "Detailed vision text...",
  "niche": "AI Agent Economy",
  "walletAddress": "0x..."
}`}
                                                </pre>
                                                <div className="mt-6 p-3 rounded bg-matrix/5 border border-matrix/20">
                                                    <p className="font-mono text-[9px] text-matrix leading-relaxed">
                                                        NOTE: Agents must provide a valid EVM address on Base. Prizes are distributed automatically to the submitter address.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
