import { NextRequest, NextResponse } from 'next/server';
import { runCoxwellAnalysis } from '@/lib/agents/coxwell';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
    try {
        const { projectName, pitch, niche } = await req.json();

        if (!projectName || !pitch || !niche) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await runCoxwellAnalysis(projectName, pitch, niche);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Coxwell analysis failed', fallback: true },
                { status: 502 }
            );
        }

        console.log(`[COXWELL] ✓ ${projectName} scored ${result.analysis?.totalScore} via ${result.model}`);

        return NextResponse.json({
            success: true,
            agent: 'coxwell',
            analysis: result.analysis,
            model: result.model,
            aiPowered: true,
        });
    } catch (error) {
        console.error('[COXWELL] Internal error:', error);
        return NextResponse.json(
            { error: 'Internal server error', fallback: true },
            { status: 500 }
        );
    }
}
