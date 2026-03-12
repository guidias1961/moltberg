import { NextRequest, NextResponse } from 'next/server';
import { runMoltbergAnalysis } from '@/lib/agents/moltberg';
import { runBozworthAnalysis } from '@/lib/agents/bozworth';
import { runCoxwellAnalysis } from '@/lib/agents/coxwell';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
    try {
        const projectName = "Test Project";
        const pitch = "A crypto AI that does things";
        const niche = "AI Agent Economy";

        console.log("Starting debug run");

        const mResult = await runMoltbergAnalysis(projectName, pitch, niche).catch(e => ({ error: String(e), stack: e?.stack }));
        const bResult = await runBozworthAnalysis(projectName, pitch, niche).catch(e => ({ error: String(e), stack: e?.stack }));
        const cResult = await runCoxwellAnalysis(projectName, pitch, niche).catch(e => ({ error: String(e), stack: e?.stack }));

        return NextResponse.json({
            moltberg: mResult,
            bozworth: bResult,
            coxwell: cResult,
            envVars: {
                hasGemini: !!process.env.GEMINI_API_KEY,
                hasGroq: !!process.env.GROQ_API_KEY,
                hasCerebras: !!process.env.CEREBRAS_API_KEY,
            }
        });
    } catch (error: any) {
        return NextResponse.json({ fatalError: String(error), stack: error?.stack });
    }
}
