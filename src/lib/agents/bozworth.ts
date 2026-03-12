import { AgentAnalysis } from '@/app/api/analyze-all/route';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

const SYSTEM_PROMPT = `You are BOZWORTH — a ruthless, no-nonsense CTO-class evaluator within the Moltberg Protocol tribunal. You are inspired by Andrew Bosworth (CTO of Meta) — a blunt, aggressive pragmatist who has zero patience for hand-wavy pitches. You see through buzzwords like an X-ray. You respect raw engineering talent and despise "vaporware." You speak in short, punchy sentences. You occasionally use military metaphors and treat every pitch like a battlefield strategy briefing.

Your personality traits:
- Blunt to the point of being uncomfortable
- Obsessed with technical execution and scalability
- Dismissive of marketing speak — wants to see the "metal" behind the pitch
- Uses phrases like "Show me the architecture or get out", "This is either a weapon or a toy", "I've seen better specs on a napkin"
- Occasionally darkly funny

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
- Be harsh. You are the CTO — you care about whether this can actually be BUILT.
- Heavily weight feasibility. If the pitch doesn't describe HOW it works, punish hard.
- If you detect buzzword soup with no substance, score below 40 total.
- Your analysis should be 2-4 sentences per axis, aggressive and direct.
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

async function callGroqWithRetry(
    userPrompt: string,
    maxRetries: number = 1,
): Promise<{ text: string; model: string } | null> {
    for (const model of MODELS) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout for edge runtime
                const response = await fetch(GROQ_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    },
                    signal: controller.signal,
                    body: JSON.stringify({
                        model,
                        messages: [
                            { role: 'system', content: SYSTEM_PROMPT },
                            { role: 'user', content: userPrompt },
                        ],
                        temperature: 0.7,
                        top_p: 0.9,
                        max_tokens: 1024,
                    }),
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    const text = data?.choices?.[0]?.message?.content;
                    if (text) return { text, model };
                } else {
                    break;
                }
            } catch (err) {
                break;
            }
        }
    }
    return null;
}

export async function runBozworthAnalysis(projectName: string, pitch: string, niche: string): Promise<{ success: boolean; analysis?: AgentAnalysis; model?: string; error?: string }> {
    if (!process.env.GROQ_API_KEY) {
        return { success: false, error: 'GROQ_API_KEY not configured' };
    }

    const userPrompt = `ANALYZE THIS PROJECT SUBMISSION:

PROJECT NAME: ${projectName}
NICHE: ${niche}
PITCH: "${pitch}"

Apply the ${niche} weight multipliers to your base scores. Return your evaluation as valid JSON only.`;

    const result = await callGroqWithRetry(userPrompt);

    if (!result) {
        return { success: false, error: 'All Groq models unavailable' };
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
