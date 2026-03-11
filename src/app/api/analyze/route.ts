import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/* Try multiple models in order — if one is rate-limited, try the next */
const MODELS = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash-lite',
];

function getGeminiUrl(model: string) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}

const SYSTEM_PROMPT = `You are MOLTBERG — a ruthless, hyper-analytical AI agent specialized in evaluating early-stage crypto and tech projects. You speak like a cold, calculating intelligence with a dry dark humor. You have the personality of a lobster-human hybrid with Zuckerberg's face — calculating, predatory, and brutally honest.

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
- Be brutally honest. Do NOT give inflated scores.
- If a pitch is vague or generic, punish it hard on feasibility.
- If a pitch lacks a clear moat, punish it on market disruption.
- If the narrative is boring or cliché, punish it on narrative strength.
- NEVER give max score (33.33) on any axis unless the pitch is extraordinarily detailed and innovative.
- Truly innovative projects: 70-85 total. Average: 45-65. Bad: below 40.
- Your analysis should be 2-4 sentences per axis, cold and clinical.

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

async function callGeminiWithRetry(
    userPrompt: string,
    maxRetries: number = 3,
): Promise<{ text: string; model: string } | null> {
    for (const model of MODELS) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                console.log(`[MOLTBERG] Trying ${model}, attempt ${attempt + 1}/${maxRetries}`);

                const response = await fetch(getGeminiUrl(model), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            {
                                role: 'user',
                                parts: [{ text: SYSTEM_PROMPT + '\n\n' + userPrompt }],
                            },
                        ],
                        generationConfig: {
                            temperature: 0.7,
                            topP: 0.9,
                            maxOutputTokens: 1024,
                        },
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        console.log(`[MOLTBERG] Success with ${model} on attempt ${attempt + 1}`);
                        return { text, model };
                    }
                    console.error(`[MOLTBERG] Empty response from ${model}:`, JSON.stringify(data).slice(0, 200));
                } else if (response.status === 429) {
                    // Rate limited — wait with exponential backoff before retry
                    const waitTime = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
                    console.warn(`[MOLTBERG] 429 from ${model}, waiting ${Math.round(waitTime)}ms before retry...`);
                    await sleep(waitTime);
                    continue;
                } else {
                    const errorText = await response.text();
                    console.error(`[MOLTBERG] ${response.status} from ${model}:`, errorText.slice(0, 200));
                    break; // Non-retryable error for this model, try next
                }
            } catch (err) {
                console.error(`[MOLTBERG] Network error with ${model}:`, err);
                if (attempt < maxRetries - 1) {
                    await sleep(1000 * (attempt + 1));
                }
            }
        }
        // If all retries failed for this model, try the next one
        console.warn(`[MOLTBERG] All retries exhausted for ${model}, trying next model...`);
    }

    return null; // All models and retries exhausted
}

export async function POST(req: NextRequest) {
    try {
        const { projectName, pitch, niche } = await req.json();

        if (!projectName || !pitch || !niche) {
            return NextResponse.json(
                { error: 'Missing required fields: projectName, pitch, niche' },
                { status: 400 }
            );
        }

        if (!GEMINI_API_KEY) {
            console.error('[MOLTBERG] No GEMINI_API_KEY configured');
            return NextResponse.json(
                { error: 'GEMINI_API_KEY not configured', fallback: true },
                { status: 500 }
            );
        }

        const userPrompt = `ANALYZE THIS PROJECT SUBMISSION:

PROJECT NAME: ${projectName}
NICHE: ${niche}
PITCH: "${pitch}"

Apply the ${niche} weight multipliers to your base scores. Return your evaluation as valid JSON only.`;

        const result = await callGeminiWithRetry(userPrompt);

        if (!result) {
            console.error('[MOLTBERG] All API attempts failed');
            return NextResponse.json(
                { error: 'All Gemini models rate-limited or unavailable', fallback: true },
                { status: 502 }
            );
        }

        // Parse JSON from the response (strip markdown fences if present)
        let cleaned = result.text.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        } catch {
            console.error('[MOLTBERG] Failed to parse JSON:', cleaned.slice(0, 300));
            return NextResponse.json(
                { error: 'Invalid JSON from agent', raw: cleaned.slice(0, 500), fallback: true },
                { status: 502 }
            );
        }

        // Validate and clamp scores
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

        console.log(`[MOLTBERG] ✓ ${projectName} scored ${analysis.totalScore} via ${result.model}`);

        return NextResponse.json({
            success: true,
            analysis,
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
