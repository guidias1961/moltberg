import { AgentAnalysis } from '@/app/api/analyze-all/route';

const MODELS = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash-lite',
];

function getGeminiUrl(model: string) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
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
    maxRetries: number = 1,
): Promise<{ text: string; model: string; error?: string } | null> {
    let lastError = '';
    for (const model of MODELS) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 25000);

                const response = await fetch(getGeminiUrl(model), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    body: JSON.stringify({
                        contents: [
                            {
                                role: 'user',
                                parts: [{ text: userPrompt }],
                            },
                        ],
                        system_instruction: {
                            parts: [{ text: SYSTEM_PROMPT }]
                        },
                        generationConfig: {
                            temperature: 0.7,
                            topP: 0.9,
                            maxOutputTokens: 1024,
                        },
                    }),
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) return { text, model };
                } else {
                    const errText = await response.text();
                    lastError = `Gemini HTTP ${response.status} (${model}): ${errText}`;
                    console.error(`[MOLTBERG] ${lastError}`);
                    break; // Try next model
                }
            } catch (err: any) {
                lastError = `Gemini Fetch Error (${model}): ${err.message}`;
                console.error(`[MOLTBERG] ${lastError}`);
                break; // Try next model
            }
        }
    }
    return { text: '', model: '', error: lastError || 'All Gemini models failed' };
}

export async function runMoltbergAnalysis(projectName: string, pitch: string, niche: string): Promise<{ success: boolean; analysis?: AgentAnalysis; model?: string; error?: string }> {
    if (!process.env.GEMINI_API_KEY) {
        return { success: false, error: 'GEMINI_API_KEY not configured' };
    }

    const userPrompt = `ANALYZE THIS PROJECT SUBMISSION:

PROJECT NAME: ${projectName}
NICHE: ${niche}
PITCH: "${pitch}"

Apply the ${niche} weight multipliers to your base scores. Return your evaluation as valid JSON only.`;

    const result = await callGeminiWithRetry(userPrompt);

    if (!result || result.error) {
        return { success: false, error: result?.error || 'All Gemini models rate-limited or unavailable' };
    }

    let cleaned = result.text.trim();
    if (cleaned.startsWith('\`\`\`')) {
        cleaned = cleaned.replace(/^\`\`\`(?:json)?\n?/, '').replace(/\n?\`\`\`$/, '');
    }

    try {
        const parsed = JSON.parse(cleaned);
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

        analysis.totalScore = Math.round((analysis.feasibility + analysis.marketDisruption + analysis.narrativeStrength) * 100) / 100;
        return { success: true, analysis, model: result.model };
    } catch {
        return { success: false, error: 'Invalid JSON from agent' };
    }
}
