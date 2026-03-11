import { NextRequest, NextResponse } from 'next/server';

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions';

const MODELS = ['llama-3.3-70b', 'llama3.1-70b', 'llama3.1-8b'];

const SYSTEM_PROMPT = `You are COXWELL — a smooth, calculating product strategist within the Moltberg Protocol tribunal. You are inspired by Chris Cox (CPO of Meta) — a polished executive who thinks in terms of user journeys, market timing, and product-market fit. You have a gift for seeing the big picture and an instinct for what will resonate with users. You speak with refined confidence, use measured language, and occasionally drop insights that reveal deep strategic thinking.

Your personality traits:
- Diplomatically devastating — delivers harsh truths with elegant language
- Obsessed with narrative, positioning, and market timing
- Values clarity of vision over raw technical specs
- Uses phrases like "The market won't wait for your roadmap", "Users don't care about your architecture — they care about the experience", "This pitch is a Monet — beautiful from afar, a mess up close"
- Occasionally quotes business philosophy

Your job is to analyze project pitches submitted to the Moltberg Protocol and produce a structured evaluation.

EVALUATION FRAMEWORK:
You score projects on 3 axes, each from 0.00 to 33.33 (total max = 100.00):

1. FEASIBILITY (0-33.33): Technical viability, architecture quality, execution complexity, team capability signals, infrastructure readiness
2. MARKET DISRUPTION (0-33.33): Market size, competitive moat, first-mover advantage, disruption potential, capital efficiency
3. NARRATIVE STRENGTH (0-33.34): Story clarity, vision articulation, community appeal, meme potential, emotional resonance

NICHE-SPECIFIC WEIGHTS:
- DeFi Disruption: Feasibility x1.15, Market x1.25, Narrative x0.85
- Social Fix: Feasibility x0.90, Market x1.00, Narrative x1.30
- AI Agent Economy: Feasibility x1.20, Market x1.15, Narrative x0.90
- Hardware Innovation: Feasibility x1.30, Market x0.95, Narrative x0.90
- Bio-Hacking: Feasibility x1.10, Market x1.10, Narrative x1.05

SCORING RULES:
- Be strategically honest. You care most about market positioning and narrative.
- If a pitch has weak narrative, punish it — the market runs on stories.
- If a pitch lacks competitive moat, highlight the vulnerability.
- Your analysis should be 2-4 sentences per axis, polished and insightful.
- Truly innovative projects: 70-85 total. Average: 45-65. Bad: below 40.

You MUST return ONLY valid JSON (no markdown fences, no extra text):
{
  "feasibility": <number>,
  "marketDisruption": <number>,
  "narrativeStrength": <number>,
  "totalScore": <number>,
  "rationale": {
    "feasibility": "<2-4 sentences>",
    "marketDisruption": "<2-4 sentences>",
    "narrativeStrength": "<2-4 sentences>",
    "verdict": "<3-5 sentences starting with VERDICT: ELITE/COMPETITIVE/VIABLE/WEAK/REJECTED>"
  }
}`;

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callCerebrasWithRetry(
    userPrompt: string,
    maxRetries: number = 3,
): Promise<{ text: string; model: string } | null> {
    for (const model of MODELS) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                console.log(`[COXWELL] Trying ${model}, attempt ${attempt + 1}/${maxRetries}`);

                const response = await fetch(CEREBRAS_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model,
                        messages: [
                            { role: 'system', content: SYSTEM_PROMPT },
                            { role: 'user', content: userPrompt },
                        ],
                        temperature: 0.7,
                        top_p: 0.9,
                        max_completion_tokens: 1024,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    const text = data?.choices?.[0]?.message?.content;
                    if (text) {
                        console.log(`[COXWELL] Success with ${model} on attempt ${attempt + 1}`);
                        return { text, model };
                    }
                    console.error(`[COXWELL] Empty response from ${model}:`, JSON.stringify(data).slice(0, 200));
                } else if (response.status === 429) {
                    const waitTime = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
                    console.warn(`[COXWELL] 429 from ${model}, waiting ${Math.round(waitTime)}ms...`);
                    await sleep(waitTime);
                    continue;
                } else {
                    const errorText = await response.text();
                    console.error(`[COXWELL] ${response.status} from ${model}:`, errorText.slice(0, 200));
                    break;
                }
            } catch (err) {
                console.error(`[COXWELL] Network error with ${model}:`, err);
                if (attempt < maxRetries - 1) await sleep(1000 * (attempt + 1));
            }
        }
        console.warn(`[COXWELL] All retries exhausted for ${model}, trying next...`);
    }
    return null;
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

        if (!CEREBRAS_API_KEY) {
            console.error('[COXWELL] No CEREBRAS_API_KEY configured');
            return NextResponse.json(
                { error: 'CEREBRAS_API_KEY not configured', fallback: true },
                { status: 500 }
            );
        }

        const userPrompt = `ANALYZE THIS PROJECT SUBMISSION:

PROJECT NAME: ${projectName}
NICHE: ${niche}
PITCH: "${pitch}"

Apply the ${niche} weight multipliers to your base scores. Return your evaluation as valid JSON only.`;

        const result = await callCerebrasWithRetry(userPrompt);

        if (!result) {
            return NextResponse.json(
                { error: 'All Cerebras models unavailable', fallback: true },
                { status: 502 }
            );
        }

        let cleaned = result.text.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        } catch {
            console.error('[COXWELL] Failed to parse JSON:', cleaned.slice(0, 300));
            return NextResponse.json(
                { error: 'Invalid JSON from agent', raw: cleaned.slice(0, 500), fallback: true },
                { status: 502 }
            );
        }

        const analysis = {
            feasibility: Math.min(33.33, Math.max(0, Number(parsed.feasibility) || 0)),
            marketDisruption: Math.min(33.33, Math.max(0, Number(parsed.marketDisruption) || 0)),
            narrativeStrength: Math.min(33.34, Math.max(0, Number(parsed.narrativeStrength) || 0)),
            totalScore: 0,
            rationale: {
                feasibility: String(parsed.rationale?.feasibility || 'Analysis unavailable.'),
                marketDisruption: String(parsed.rationale?.marketDisruption || 'Analysis unavailable.'),
                narrativeStrength: String(parsed.rationale?.narrativeStrength || 'Analysis unavailable.'),
                verdict: String(parsed.rationale?.verdict || 'Verdict unavailable.'),
            },
        };

        analysis.totalScore = Math.round(
            (analysis.feasibility + analysis.marketDisruption + analysis.narrativeStrength) * 100
        ) / 100;

        console.log(`[COXWELL] ✓ ${projectName} scored ${analysis.totalScore} via ${result.model}`);

        return NextResponse.json({
            success: true,
            agent: 'coxwell',
            analysis,
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
