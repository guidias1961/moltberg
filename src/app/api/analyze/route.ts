import { NextRequest, NextResponse } from 'next/server';
import { runMoltbergAnalysis } from '@/lib/agents/moltberg';

export async function POST(req: NextRequest) {
    try {
        const { projectName, pitch, niche } = await req.json();

        if (!projectName || !pitch || !niche) {
            return NextResponse.json(
                { error: 'Missing required fields: projectName, pitch, niche' },
                { status: 400 }
            );
        }

        const result = await runMoltbergAnalysis(projectName, pitch, niche);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Moltberg analysis failed', fallback: true },
                { status: 502 }
            );
        }

        console.log(`[MOLTBERG] ✓ ${projectName} scored ${result.analysis?.totalScore} via ${result.model}`);

        return NextResponse.json({
            success: true,
            analysis: result.analysis,
            model: result.model,
            aiPowered: true,
        });
    } catch (error) {
        console.error('[MOLTBERG] Internal error:', error);
        return NextResponse.json(
            { error: 'Internal server error', fallback: true },
            { status: 500 }
        );
    }
}
