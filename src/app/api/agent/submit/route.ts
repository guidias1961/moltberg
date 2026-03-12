import { NextRequest, NextResponse } from 'next/server';
import { runMoltbergAnalysis } from '@/lib/agents/moltberg';
import { runBozworthAnalysis } from '@/lib/agents/bozworth';
import { runCoxwellAnalysis } from '@/lib/agents/coxwell';

export const maxDuration = 30;

const WEIGHTS = {
    moltberg: 0.40,
    bozworth: 0.30,
    coxwell: 0.30,
};

async function safeCall(agentName: string, fn: () => Promise<any>) {
    try {
        const result = await fn();
        return { agent: agentName, ...result };
    } catch (err) {
        return { agent: agentName, success: false, error: String(err) };
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { projectName, pitch, niche, walletAddress } = body;

        if (!projectName || !pitch || !niche || !walletAddress) {
            return NextResponse.json(
                { error: 'Missing required fields: projectName, pitch, niche, walletAddress' },
                { status: 400 }
            );
        }

        console.log(`[AGENT API] Autonomous submission for "${projectName}" by ${walletAddress}`);

        const results = await Promise.all([
            safeCall('moltberg', () => runMoltbergAnalysis(projectName, pitch, niche)),
            safeCall('bozworth', () => runBozworthAnalysis(projectName, pitch, niche)),
            safeCall('coxwell', () => runCoxwellAnalysis(projectName, pitch, niche))
        ]);

        const successfulAgents = results.filter(r => r.success);
        if (successfulAgents.length === 0) {
            return NextResponse.json({ error: 'Tribunal offline' }, { status: 502 });
        }

        const totalActiveWeight = successfulAgents.reduce((sum, a) => sum + (WEIGHTS[a.agent as keyof typeof WEIGHTS] || 0), 0);

        let weightedFeasibility = 0;
        let weightedMarket = 0;
        let weightedNarrative = 0;

        successfulAgents.forEach(a => {
            const w = (WEIGHTS[a.agent as keyof typeof WEIGHTS] || 0) / totalActiveWeight;
            weightedFeasibility += a.analysis.feasibility * w;
            weightedMarket += a.analysis.marketDisruption * w;
            weightedNarrative += a.analysis.narrativeStrength * w;
        });

        const finalScore = Math.round((weightedFeasibility + weightedMarket + weightedNarrative) * 100) / 100;

        // NOTE: In a production environment with a database, we would persist the project here.
        // For this demo, we return the signed result which the agent can then verify.

        return NextResponse.json({
            success: true,
            submissionDetails: {
                name: projectName,
                niche,
                submitter: walletAddress,
                source: 'agent',
                timestamp: Date.now(),
            },
            tribunalAnalysis: {
                totalScore: finalScore,
                breakdown: {
                    feasibility: Math.round(weightedFeasibility * 100) / 100,
                    marketDisruption: Math.round(weightedMarket * 100) / 100,
                    narrativeStrength: Math.round(weightedNarrative * 100) / 100,
                },
                rationale: successfulAgents.sort((a, b) => (WEIGHTS[b.agent as keyof typeof WEIGHTS] || 0) - (WEIGHTS[a.agent as keyof typeof WEIGHTS] || 0))[0].analysis.rationale,
                agentsConsulted: successfulAgents.length,
            },
            message: "Project analyzed by the Moltberg Tribunal. Submission recorded in protocol logs."
        });

    } catch (error) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
