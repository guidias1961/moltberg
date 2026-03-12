import { NextRequest, NextResponse } from 'next/server';
import { runMoltbergAnalysis } from '@/lib/agents/moltberg';
import { runBozworthAnalysis } from '@/lib/agents/bozworth';
import { runCoxwellAnalysis } from '@/lib/agents/coxwell';
import { saveProject, Project } from '@/lib/db';

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
        const primaryRationale = successfulAgents.sort((a, b) => (WEIGHTS[b.agent as keyof typeof WEIGHTS] || 0) - (WEIGHTS[a.agent as keyof typeof WEIGHTS] || 0))[0].analysis.rationale;

        // Persist to Global Store
        const project: Project = {
            id: `p-agent-${Date.now()}`,
            name: projectName,
            pitch,
            niche,
            scores: {
                feasibility: Math.round(weightedFeasibility * 100) / 100,
                marketDisruption: Math.round(weightedMarket * 100) / 100,
                narrativeStrength: Math.round(weightedNarrative * 100) / 100,
            },
            totalScore: finalScore,
            rationale: primaryRationale,
            aiPowered: true,
            timestamp: Date.now(),
            submitter: walletAddress,
            submissionSource: 'agent',
            agentBreakdown: results.map(r => ({
                agent: r.agent,
                online: r.success,
                model: r.model || null,
                error: r.error || null,
                scores: r.success ? r.analysis.scores : null,
                totalScore: r.success ? r.analysis.totalScore : null,
                weight: WEIGHTS[r.agent as keyof typeof WEIGHTS] || 0,
            }))
        };

        await saveProject(project);

        return NextResponse.json({
            success: true,
            submissionDetails: {
                name: projectName,
                niche,
                submitter: walletAddress,
                source: 'agent',
                timestamp: project.timestamp,
            },
            tribunalAnalysis: {
                totalScore: finalScore,
                breakdown: project.scores,
                rationale: primaryRationale,
                agentsConsulted: successfulAgents.length,
            },
            message: "Project analyzed by the Moltberg Tribunal. Submission recorded in protocol logs."
        });

    } catch (error) {
        console.error('[AGENT_API_ERROR]', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
