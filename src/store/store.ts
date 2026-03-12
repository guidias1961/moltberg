import { create } from 'zustand';

/* ─── Types ─── */

export type Niche =
    | 'DeFi Disruption'
    | 'Social Fix'
    | 'AI Agent Economy'
    | 'Hardware Innovation'
    | 'Bio-Hacking';

export type AgentId = 'moltberg' | 'bozworth' | 'coxwell';

export interface ProjectScore {
    feasibility: number;
    marketDisruption: number;
    narrativeStrength: number;
}

export interface ScoreRationale {
    feasibility: string;
    marketDisruption: string;
    narrativeStrength: string;
    verdict: string;
}

export interface AgentBreakdown {
    agent: string;
    online: boolean;
    model: string | null;
    scores: ProjectScore | null;
    totalScore: number | null;
    rationale: ScoreRationale | null;
    error?: string | null;
    weight: number;
}

export interface ChatMessage {
    id: string;
    agent: AgentId;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface Project {
    id: string;
    name: string;
    pitch: string;
    niche: Niche;
    scores: ProjectScore;
    totalScore: number;
    rationale: ScoreRationale;
    aiPowered: boolean;
    agentBreakdown?: AgentBreakdown[];
    timestamp: number;
    submitter: string;
}

type AppPhase = 'intro' | 'dashboard';

interface MoltbergStore {
    /* ─ Phase ─ */
    phase: AppPhase;
    introStep: number;
    introTextsDone: boolean;
    setPhase: (p: AppPhase) => void;
    advanceIntro: () => void;
    markIntroTextsDone: () => void;

    /* ─ Projects ─ */
    projects: Project[];
    selectedProject: Project | null;
    addProject: (name: string, pitch: string, niche: Niche) => void;
    addProjectFromAI: (name: string, pitch: string, niche: Niche, analysis: {
        feasibility: number;
        marketDisruption: number;
        narrativeStrength: number;
        totalScore: number;
        rationale: ScoreRationale;
    }, breakdown?: AgentBreakdown[]) => void;
    selectProject: (project: Project | null) => void;

    /* ─ Fee Pool (live ticker) ─ */
    feePool: number;
    tickFeePool: () => void;

    /* ─ Countdown ─ */
    countdownTarget: number;

    /* ─ Wallet ─ */
    walletAddress: string | null;
    connectWallet: () => void;
    disconnectWallet: () => void;

    /* ─ Analysis ─ */
    isAnalyzing: boolean;
    analysisProgress: number;
    setAnalyzing: (v: boolean) => void;
    setAnalysisProgress: (v: number) => void;

    /* ─ Chat ─ */
    chatMessages: ChatMessage[];
    chatAgent: AgentId;
    chatLoading: boolean;
    setChatAgent: (agent: AgentId) => void;
    addChatMessage: (msg: ChatMessage) => void;
    setChatLoading: (v: boolean) => void;
    clearChat: () => void;
}

/* ─── Scoring ─── */

function hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
        return (s >>> 0) / 0xFFFFFFFF;
    };
}

/* Niche-specific weight multipliers */
const NICHE_WEIGHTS: Record<Niche, { f: number; m: number; n: number }> = {
    'DeFi Disruption': { f: 1.15, m: 1.25, n: 0.85 },
    'Social Fix': { f: 0.90, m: 1.00, n: 1.30 },
    'AI Agent Economy': { f: 1.20, m: 1.15, n: 0.90 },
    'Hardware Innovation': { f: 1.30, m: 0.95, n: 0.90 },
    'Bio-Hacking': { f: 1.10, m: 1.10, n: 1.05 },
};

function scoreProject(name: string, pitch: string, niche: Niche): ProjectScore {
    const seed = hashString(`${name}::${pitch}`);
    const rng = seededRandom(seed);
    const w = NICHE_WEIGHTS[niche];

    const rawF = 15 + rng() * 18.33;
    const rawM = 12 + rng() * 21.33;
    const rawN = 10 + rng() * 23.34;

    const feasibility = Math.round(Math.min(rawF * w.f, 33.33) * 100) / 100;
    const marketDisruption = Math.round(Math.min(rawM * w.m, 33.33) * 100) / 100;
    const narrativeStrength = Math.round(Math.min(rawN * w.n, 33.34) * 100) / 100;

    return { feasibility, marketDisruption, narrativeStrength };
}

/* ─── MOLTBERG AGENT: Rationale Generator ───
 *
 * The agent analyzes the pitch text, detects keywords/concepts,
 * and generates niche-aware scoring rationale for each axis.
 */

const KEYWORD_SIGNALS: Record<string, { axis: 'f' | 'm' | 'n'; weight: 'positive' | 'negative'; label: string }[]> = {
    // Feasibility signals
    'smart contract': [{ axis: 'f', weight: 'positive', label: 'smart contract architecture' }],
    'on-chain': [{ axis: 'f', weight: 'positive', label: 'on-chain verifiability' }],
    'middleware': [{ axis: 'f', weight: 'positive', label: 'modular middleware approach' }],
    'protocol': [{ axis: 'f', weight: 'positive', label: 'protocol-level design' }],
    'algorithm': [{ axis: 'f', weight: 'positive', label: 'algorithmic foundation' }],
    'machine learning': [{ axis: 'f', weight: 'positive', label: 'ML integration' }],
    'autonomous': [{ axis: 'f', weight: 'positive', label: 'autonomous execution' }],
    'decentralized': [{ axis: 'f', weight: 'positive', label: 'decentralized architecture' }, { axis: 'm', weight: 'positive', label: 'decentralization thesis' }],
    'marketplace': [{ axis: 'f', weight: 'positive', label: 'marketplace model' }, { axis: 'm', weight: 'positive', label: 'market creation potential' }],
    'governance': [{ axis: 'f', weight: 'positive', label: 'governance framework' }],
    'verification': [{ axis: 'f', weight: 'positive', label: 'verification mechanisms' }],
    'api': [{ axis: 'f', weight: 'positive', label: 'API integration path' }],
    'sdk': [{ axis: 'f', weight: 'positive', label: 'SDK tooling' }],
    'wearable': [{ axis: 'f', weight: 'positive', label: 'wearable hardware integration' }],
    'biometric': [{ axis: 'f', weight: 'positive', label: 'biometric data pipeline' }],
    // Market Disruption signals
    'disruption': [{ axis: 'm', weight: 'positive', label: 'disruption thesis' }],
    'cross-chain': [{ axis: 'm', weight: 'positive', label: 'cross-chain interoperability' }],
    'nft': [{ axis: 'm', weight: 'positive', label: 'NFT primitives' }],
    'dao': [{ axis: 'm', weight: 'positive', label: 'DAO governance model' }],
    'defi': [{ axis: 'm', weight: 'positive', label: 'DeFi sector positioning' }],
    'oracle': [{ axis: 'm', weight: 'positive', label: 'oracle infrastructure' }],
    'token': [{ axis: 'm', weight: 'positive', label: 'tokenomics presence' }],
    'bonding curve': [{ axis: 'm', weight: 'positive', label: 'bonding curve mechanics' }],
    'prediction market': [{ axis: 'm', weight: 'positive', label: 'prediction market layer' }],
    'yield': [{ axis: 'm', weight: 'positive', label: 'yield generation mechanism' }],
    'liquidity': [{ axis: 'm', weight: 'positive', label: 'liquidity architecture' }],
    'staking': [{ axis: 'm', weight: 'positive', label: 'staking mechanics' }],
    // Narrative signals
    'vision': [{ axis: 'n', weight: 'positive', label: 'strong vision articulation' }],
    'incentive': [{ axis: 'n', weight: 'positive', label: 'incentive alignment' }],
    'community': [{ axis: 'n', weight: 'positive', label: 'community-centric pitch' }],
    'research': [{ axis: 'n', weight: 'positive', label: 'research backing' }],
    'clinical': [{ axis: 'n', weight: 'positive', label: 'clinical validation angle' }],
    'peer-review': [{ axis: 'n', weight: 'positive', label: 'peer-review credibility' }],
    'provable': [{ axis: 'n', weight: 'positive', label: 'provability claims' }],
    'royalt': [{ axis: 'n', weight: 'positive', label: 'royalty model narrative' }],
    'funding': [{ axis: 'n', weight: 'positive', label: 'funding model clarity' }],
    'game theory': [{ axis: 'n', weight: 'positive', label: 'game-theoretic design' }, { axis: 'f', weight: 'positive', label: 'game-theory foundations' }],
    'sentiment': [{ axis: 'n', weight: 'positive', label: 'sentiment analysis angle' }],
    'health': [{ axis: 'n', weight: 'positive', label: 'health sector narrative' }],
    'security': [{ axis: 'f', weight: 'positive', label: 'security layer focus' }],
    'quantum': [{ axis: 'm', weight: 'positive', label: 'quantum-resistance positioning' }, { axis: 'f', weight: 'positive', label: 'quantum crypto feasibility' }],
};

const NICHE_CONTEXT: Record<Niche, { fContext: string; mContext: string; nContext: string }> = {
    'DeFi Disruption': {
        fContext: 'DeFi protocols demand battle-tested smart contract architecture and composability with existing liquidity primitives.',
        mContext: 'The DeFi sector is saturated—only protocols introducing novel primitives or superior capital efficiency break through.',
        nContext: 'DeFi narratives must balance technical credibility with accessible value propositions for liquidity providers.',
    },
    'Social Fix': {
        fContext: 'Social platforms face the cold-start problem; feasibility depends on user acquisition loops and data portability.',
        mContext: 'Disrupting social incumbents requires network effects that compound faster than existing platforms can adapt.',
        nContext: 'Social projects live or die by their narrative—community trust and cultural alignment are non-negotiable.',
    },
    'AI Agent Economy': {
        fContext: 'AI agent systems need robust inference infrastructure, clear cost models, and deterministic execution guarantees.',
        mContext: 'The AI agent market is nascent but moving fast—first-mover advantage is real but defensibility is the challenge.',
        nContext: 'AI narratives must demonstrate tangible autonomy, not just wrapper interfaces over centralized API calls.',
    },
    'Hardware Innovation': {
        fContext: 'Hardware projects carry high feasibility risk: supply chain complexity, manufacturing costs, and iteration cycles are brutal.',
        mContext: 'Hardware disruption requires at least a 10x improvement over existing solutions to justify switching costs.',
        nContext: 'Hardware narratives must ground ambitious vision in concrete manufacturing milestones and unit economics.',
    },
    'Bio-Hacking': {
        fContext: 'Bio-hacking projects must navigate regulatory labyrinths and demonstrate ethical data handling from day one.',
        mContext: 'The convergence of biometrics and blockchain is pre-paradigm—first credible players capture outsized value.',
        nContext: 'Bio-hacking narratives need to balance futuristic vision with pragmatic safety and consent frameworks.',
    },
};

function generateRationale(
    name: string,
    pitch: string,
    niche: Niche,
    scores: ProjectScore,
    totalScore: number,
): ScoreRationale {
    const lowerPitch = pitch.toLowerCase();
    const detected = { f: [] as string[], m: [] as string[], n: [] as string[] };

    // Scan for keyword signals
    Object.entries(KEYWORD_SIGNALS).forEach(([keyword, signals]) => {
        if (lowerPitch.includes(keyword)) {
            signals.forEach((sig) => {
                if (!detected[sig.axis].includes(sig.label)) {
                    detected[sig.axis].push(sig.label);
                }
            });
        }
    });

    const ctx = NICHE_CONTEXT[niche];
    const seed = hashString(`${name}::rationale`);
    const rng = seededRandom(seed);

    // Feasibility rationale
    const fSignals = detected.f.length > 0
        ? `Detected signals: ${detected.f.join(', ')}.`
        : 'No strong technical signals detected in the pitch text.';
    const fTier = scores.feasibility > 27 ? 'HIGH' : scores.feasibility > 20 ? 'MODERATE' : 'LOW';
    const fExtra = fTier === 'HIGH'
        ? 'The technical architecture appears well-defined and executable within current infrastructure constraints.'
        : fTier === 'MODERATE'
            ? 'There is a reasonable technical foundation, but execution risk remains above threshold. Additional technical specification would strengthen this axis.'
            : 'The pitch lacks concrete technical grounding. MOLTBERG requires more specificity on implementation stack, performance benchmarks, and deployment strategy.';
    const feasibility = `[FEASIBILITY → ${fTier}] ${ctx.fContext} ${fSignals} ${fExtra} Score: ${scores.feasibility}/33.33.`;

    // Market Disruption rationale
    const mSignals = detected.m.length > 0
        ? `Detected signals: ${detected.m.join(', ')}.`
        : 'Limited market disruption vectors identified.';
    const mTier = scores.marketDisruption > 27 ? 'HIGH' : scores.marketDisruption > 20 ? 'MODERATE' : 'LOW';
    const mExtra = mTier === 'HIGH'
        ? 'This project positions itself at a market inflection point with clear competitive advantages.'
        : mTier === 'MODERATE'
            ? 'The market positioning shows promise but lacks a definitive moat or first-mover catalyst.'
            : 'Market disruption potential is below threshold. The competitive landscape appears crowded with insufficient differentiation.';
    const marketDisruption = `[MARKET DISRUPTION → ${mTier}] ${ctx.mContext} ${mSignals} ${mExtra} Score: ${scores.marketDisruption}/33.33.`;

    // Narrative Strength rationale
    const nSignals = detected.n.length > 0
        ? `Detected signals: ${detected.n.join(', ')}.`
        : 'Narrative relies primarily on technical description.';
    const nTier = scores.narrativeStrength > 27 ? 'HIGH' : scores.narrativeStrength > 20 ? 'MODERATE' : 'LOW';
    const nExtra = nTier === 'HIGH'
        ? 'The narrative is compelling, specific, and communicates a clear vision that would resonate with both builders and capital allocators.'
        : nTier === 'MODERATE'
            ? 'The story has substance but would benefit from sharper positioning and more vivid articulation of the end-state.'
            : 'The narrative lacks emotional conviction. Submissions that combine technical credibility with aspirational storytelling score significantly higher on this axis.';
    const narrativeStrength = `[NARRATIVE STRENGTH → ${nTier}] ${ctx.nContext} ${nSignals} ${nExtra} Score: ${scores.narrativeStrength}/33.34.`;

    // Verdict
    const rank = totalScore > 80 ? 'ELITE' : totalScore > 70 ? 'COMPETITIVE' : totalScore > 55 ? 'VIABLE' : 'BELOW THRESHOLD';
    const verdictText = rank === 'ELITE'
        ? `${name} demonstrates exceptional strength across all evaluation axes. This project is currently positioned for Top 3 funding allocation. Maintain momentum.`
        : rank === 'COMPETITIVE'
            ? `${name} shows strong fundamentals but falls short of the elite tier. Strengthening the weakest axis could push this into Top 3 contention.`
            : rank === 'VIABLE'
                ? `${name} has a viable foundation but requires significant iteration. Focus on the lowest-scoring axis to improve overall ranking.`
                : `${name} does not currently meet MOLTBERG's threshold for funding consideration. A substantial pivot or deepening of the core thesis is recommended.`;
    const verdict = `[MOLTBERG VERDICT → ${rank}] Composite Score: ${totalScore}/100.00. ${verdictText}`;

    return { feasibility, marketDisruption, narrativeStrength, verdict };
}

/* ─── Seed projects ─── */

function buildSeedProjects(): Project[] {
    const entries: { name: string; pitch: string; niche: Niche; submitter: string }[] = [
        { name: "NeuralVault", pitch: "Decentralized AI model marketplace with on-chain inference verification and royalty distribution.", niche: 'AI Agent Economy', submitter: '0xa3b1...d4e2' },
        { name: "ChainMind", pitch: "Autonomous DAO governance engine powered by real-time NLP sentiment scoring of proposals.", niche: 'DeFi Disruption', submitter: '0x7f92...c1a8' },
        { name: "QuantumLedger", pitch: "Post-quantum cryptographic middleware for L1 chains—drop-in security upgrade without forking.", niche: 'Hardware Innovation', submitter: '0x2d5c...f9b3' },
        { name: "MetaForge", pitch: "Cross-chain NFT compositing protocol with provable rarity algorithms and verifiable lineage.", niche: 'DeFi Disruption', submitter: '0x8e41...a7d5' },
        { name: "SynapseDAO", pitch: "Tokenized scientific-paper funding with dual-token bonding curves for peer-review incentives.", niche: 'Social Fix', submitter: '0xb6f3...e2c9' },
        { name: "OracleSwarm", pitch: "Game-theory oracle network where data providers compete in prediction markets for truth consensus.", niche: 'AI Agent Economy', submitter: '0x5ca7...d8f1' },
        { name: "BioSync", pitch: "Wearable-to-chain biometric data marketplace for decentralized clinical trials and health DAOs.", niche: 'Bio-Hacking', submitter: '0x1d89...b4a6' },
    ];

    return entries.map((e, i) => {
        const scores = scoreProject(e.name, e.pitch, e.niche);
        const totalScore = Math.round((scores.feasibility + scores.marketDisruption + scores.narrativeStrength) * 100) / 100;
        const rationale = generateRationale(e.name, e.pitch, e.niche, scores, totalScore);
        return {
            id: `seed-${i}`,
            name: e.name,
            pitch: e.pitch,
            niche: e.niche,
            scores,
            totalScore,
            rationale,
            aiPowered: false,
            timestamp: Date.now() - (i + 1) * 3_600_000,
            submitter: e.submitter,
        };
    }).sort((a, b) => b.totalScore - a.totalScore);
}

/* ─── Countdown target ─── */

function getCountdownTarget(): number {
    if (typeof window === 'undefined') return Date.now() + 7 * 86_400_000;
    const stored = localStorage.getItem('molt-countdown');
    if (stored) {
        const t = parseInt(stored, 10);
        if (t > Date.now()) return t;
    }
    const t = Date.now() + 7 * 86_400_000;
    localStorage.setItem('molt-countdown', t.toString());
    return t;
}

function generateWallet(): string {
    const hex = '0123456789abcdef';
    let a = '0x';
    for (let i = 0; i < 40; i++) a += hex[Math.floor(Math.random() * 16)];
    return a;
}

/* ─── Store ─── */

export const useMoltbergStore = create<MoltbergStore>((set, get) => ({
    phase: 'intro',
    introStep: 0,
    introTextsDone: false,
    setPhase: (p) => set({ phase: p }),
    advanceIntro: () => set((s) => ({ introStep: Math.min(s.introStep + 1, 3) })),
    markIntroTextsDone: () => set({ introTextsDone: true }),

    projects: buildSeedProjects(),
    selectedProject: null,
    selectProject: (project) => set({ selectedProject: project }),
    addProject: (name, pitch, niche) => {
        const scores = scoreProject(name, pitch, niche);
        const totalScore = Math.round((scores.feasibility + scores.marketDisruption + scores.narrativeStrength) * 100) / 100;
        const rationale = generateRationale(name, pitch, niche, scores, totalScore);
        const walletAddr = get().walletAddress || '0x0000...0000';
        const proj: Project = {
            id: `p-${Date.now()}`,
            name,
            pitch,
            niche,
            scores,
            totalScore,
            rationale,
            aiPowered: false,
            timestamp: Date.now(),
            submitter: `${walletAddr.slice(0, 6)}...${walletAddr.slice(-4)}`,
        };
        const projects = [...get().projects, proj].sort((a, b) => b.totalScore - a.totalScore);
        set({ projects });
    },
    addProjectFromAI: (name, pitch, niche, analysis, breakdown) => {
        const walletAddr = get().walletAddress || '0x0000...0000';
        const proj: Project = {
            id: `p-${Date.now()}`,
            name,
            pitch,
            niche,
            scores: {
                feasibility: analysis.feasibility,
                marketDisruption: analysis.marketDisruption,
                narrativeStrength: analysis.narrativeStrength,
            },
            totalScore: analysis.totalScore,
            rationale: analysis.rationale,
            aiPowered: true,
            agentBreakdown: breakdown,
            timestamp: Date.now(),
            submitter: `${walletAddr.slice(0, 6)}...${walletAddr.slice(-4)}`,
        };
        const projects = [...get().projects, proj].sort((a, b) => b.totalScore - a.totalScore);
        set({ projects });
    },

    feePool: 847_291.42,
    tickFeePool: () => {
        set((s) => {
            const delta = (Math.random() - 0.35) * 12.5;
            return { feePool: Math.round((s.feePool + delta) * 100) / 100 };
        });
    },

    countdownTarget: getCountdownTarget(),

    walletAddress: null,
    connectWallet: () => set({ walletAddress: generateWallet() }),
    disconnectWallet: () => set({ walletAddress: null }),

    isAnalyzing: false,
    analysisProgress: 0,
    setAnalyzing: (v) => set({ isAnalyzing: v }),
    setAnalysisProgress: (v) => set({ analysisProgress: v }),

    /* ─ Chat ─ */
    chatMessages: [],
    chatAgent: 'moltberg',
    chatLoading: false,
    setChatAgent: (agent) => set({ chatAgent: agent }),
    addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
    setChatLoading: (v) => set({ chatLoading: v }),
    clearChat: () => set({ chatMessages: [] }),
}));
