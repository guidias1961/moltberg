import { NextRequest, NextResponse } from 'next/server';
import { runBozworthAnalysis } from '@/lib/agents/bozworth';

export async function POST(req: NextRequest) {
    try {
        const { projectName, pitch, niche } = await req.json();

        if (!projectName || !pitch || !niche) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await runBozworthAnalysis(projectName, pitch, niche);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Bozworth analysis failed', fallback: true },
                { status: 502 }
            );
        }

        console.log(`[BOZWORTH] ✓ ${projectName} scored ${result.analysis?.totalScore} via ${result.model}`);

        return NextResponse.json({
            success: true,
            agent: 'bozworth',
            analysis: result.analysis,
            model: result.model,
            aiPowered: true,
        });
    } catch (error) {
        console.error('[BOZWORTH] Internal error:', error);
        return NextResponse.json(
            { error: 'Internal server error', fallback: true },
            { status: 500 }
        );
    }
}
