import { NextRequest, NextResponse } from 'next/server';

/* ─── Agent Weights ─── */
const WEIGHTS = {
    moltberg: 0.40,
    bozworth: 0.30,
    coxwell: 0.30,
};

interface AgentAnalysis {
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

async function callAgent(
    agentPath: string,
    body: object,
    baseUrl: string,
): Promise<AgentResult> {
    const agentName = agentPath.includes('boz') ? 'bozworth' : agentPath.includes('cox') ? 'coxwell' : 'moltberg';
    try {
        const response = await fetch(`${baseUrl}/api/${agentPath}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.analysis) {
                return { agent: agentName, success: true, analysis: data.analysis, model: data.model };
            }
        }
        const errorText = await response.text().catch(() => 'Unknown error');
        return { agent: agentName, success: false, error: errorText.slice(0, 200) };
    } catch (err) {
        console.error(`[TRIBUNAL] ${agentName} failed:`, err);
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

        const body = { projectName, pitch, niche };

        // Determine base URL from request or environment
        const origin = req.nextUrl.origin;
        const baseUrl = origin !== 'http://localhost:3000' && origin !== 'http://:' ? origin : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        console.log(`[TRIBUNAL] Starting parallel analysis of "${projectName}" by all 3 agents...`);

        // Call all 3 agents in parallel
        const results = await Promise.allSettled([
            callAgent('analyze', body, baseUrl),
            callAgent('analyze-boz', body, baseUrl),
            callAgent('analyze-cox', body, baseUrl),
        ]);

        const agentResults: AgentResult[] = results.map((r) =>
            r.status === 'fulfilled' ? r.value : { agent: 'unknown', success: false, error: 'Promise rejected' }
        );

        // Map results to named agents
        const moltbergResult = agentResults.find(r => r.agent === 'moltberg');
        const bozworthResult = agentResults.find(r => r.agent === 'bozworth');
        const coxwellResult = agentResults.find(r => r.agent === 'coxwell');

        // Calculate weighted average from successful agents
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
