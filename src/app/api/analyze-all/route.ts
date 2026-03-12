import { NextRequest, NextResponse } from 'next/server';
import { runMoltbergAnalysis } from '@/lib/agents/moltberg';
import { runBozworthAnalysis } from '@/lib/agents/bozworth';
import { runCoxwellAnalysis } from '@/lib/agents/coxwell';

export const maxDuration = 30;


/* ─── Agent Weights ─── */
const WEIGHTS = {
    moltberg: 0.40,
    bozworth: 0.30,
    coxwell: 0.30,
};

export interface AgentAnalysis {
    feasibility: number;
    marketDisruption: number;
    narrativeStrength: number;
    totalScore: number;
    rationale: {
        feasibility: string;
        marketDisruption: string;
        narrativeStrength: string;
        verdict: string;
    };
}

interface AgentResult {
    agent: string;
    success: boolean;
    analysis?: AgentAnalysis;
    model?: string;
    error?: string;
}

async function safeCall(agentName: string, fn: () => Promise<{ success: boolean; analysis?: AgentAnalysis; model?: string; error?: string }>): Promise<AgentResult> {
    try {
        const result = await fn();
        return { agent: agentName, ...result };
    } catch (err) {
        return { agent: agentName, success: false, error: String(err) };
    }
}

export async function POST(req: NextRequest) {
    try {
        const { projectName, pitch, niche } = await req.json();

        if (!projectName || !pitch || !niche) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        console.log(`[TRIBUNAL] Starting parallel analysis of "${projectName}" by all 3 agents (Direct Function Calls)...`);

        // Call all 3 agents in parallel using imported library functions
        const results = await Promise.all([
            safeCall('moltberg', () => runMoltbergAnalysis(projectName, pitch, niche)),
            safeCall('bozworth', () => runBozworthAnalysis(projectName, pitch, niche)),
            safeCall('coxwell', () => runCoxwellAnalysis(projectName, pitch, niche))
        ]);

        const agentResults: AgentResult[] = results;

        const moltbergResult = agentResults.find(r => r.agent === 'moltberg');
        const bozworthResult = agentResults.find(r => r.agent === 'bozworth');
        const coxwellResult = agentResults.find(r => r.agent === 'coxwell');

        const successfulAgents: { agent: string; analysis: AgentAnalysis; weight: number }[] = [];
        if (moltbergResult?.success && moltbergResult.analysis) {
            successfulAgents.push({ agent: 'moltberg', analysis: moltbergResult.analysis, weight: WEIGHTS.moltberg });
        }
        if (bozworthResult?.success && bozworthResult.analysis) {
            successfulAgents.push({ agent: 'bozworth', analysis: bozworthResult.analysis, weight: WEIGHTS.bozworth });
        }
        if (coxwellResult?.success && coxwellResult.analysis) {
            successfulAgents.push({ agent: 'coxwell', analysis: coxwellResult.analysis, weight: WEIGHTS.coxwell });
        }

        if (successfulAgents.length === 0) {
            return NextResponse.json(
                { error: 'All agents failed', fallback: true, agentResults },
                { status: 502 }
            );
        }

        // Redistribute weights proportionally if some agents failed
        const totalActiveWeight = successfulAgents.reduce((sum, a) => sum + a.weight, 0);
        const normalizedAgents = successfulAgents.map(a => ({
            ...a,
            normalizedWeight: a.weight / totalActiveWeight,
        }));

        // Compute weighted average scores
        const weightedAnalysis: AgentAnalysis = {
            feasibility: 0,
            marketDisruption: 0,
            narrativeStrength: 0,
            totalScore: 0,
            rationale: {
                feasibility: '',
                marketDisruption: '',
                narrativeStrength: '',
                verdict: '',
            },
        };

        normalizedAgents.forEach(({ analysis, normalizedWeight }) => {
            weightedAnalysis.feasibility += analysis.feasibility * normalizedWeight;
            weightedAnalysis.marketDisruption += analysis.marketDisruption * normalizedWeight;
            weightedAnalysis.narrativeStrength += analysis.narrativeStrength * normalizedWeight;
        });

        weightedAnalysis.feasibility = Math.round(weightedAnalysis.feasibility * 100) / 100;
        weightedAnalysis.marketDisruption = Math.round(weightedAnalysis.marketDisruption * 100) / 100;
        weightedAnalysis.narrativeStrength = Math.round(weightedAnalysis.narrativeStrength * 100) / 100;
        weightedAnalysis.totalScore = Math.round(
            (weightedAnalysis.feasibility + weightedAnalysis.marketDisruption + weightedAnalysis.narrativeStrength) * 100
        ) / 100;

        // Use the highest-weighted successful agent's rationale as the main rationale
        const primaryAgent = normalizedAgents.sort((a, b) => b.normalizedWeight - a.normalizedWeight)[0];
        weightedAnalysis.rationale = primaryAgent.analysis.rationale;

        // Build per-agent breakdown
        const breakdown = agentResults.map(r => ({
            agent: r.agent,
            online: r.success,
            model: r.model || null,
            error: r.error || null,
            scores: r.success && r.analysis ? {
                feasibility: r.analysis.feasibility,
                marketDisruption: r.analysis.marketDisruption,
                narrativeStrength: r.analysis.narrativeStrength,
            } : null,
            totalScore: r.success && r.analysis ? r.analysis.totalScore : null,
            rationale: r.success && r.analysis ? r.analysis.rationale : null,
            weight: WEIGHTS[r.agent as keyof typeof WEIGHTS] || 0,
        }));

        console.log(`[TRIBUNAL] ✓ "${projectName}" — final weighted score: ${weightedAnalysis.totalScore} (${successfulAgents.length}/3 agents)`);

        return NextResponse.json({
            success: true,
            analysis: weightedAnalysis,
            breakdown,
            agentsOnline: successfulAgents.length,
            agentsTotal: 3,
            aiPowered: true,
        });
    } catch (error) {
        console.error('[TRIBUNAL] Internal error:', error);
        return NextResponse.json(
            { error: 'Internal server error', fallback: true },
            { status: 500 }
        );
    }
}
