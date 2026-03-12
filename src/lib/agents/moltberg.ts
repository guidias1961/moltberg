import { AgentAnalysis } from '@/app/api/analyze-all/route';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MODELS = ['mixtral-8x7b-32768', 'llama-3.3-70b-versatile'];

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
  "feasibility": number,
  "marketDisruption": number,
  "narrativeStrength": number,
  "totalScore": number,
  "rationale": {
    "feasibility": "...",
    "marketDisruption": "...",
    "narrativeStrength": "...",
    "verdict": "VERDICT: REJECTED | MONITOR | INVEST"
  }
}`;

async function callMixedApiWithRetry(
    userPrompt: string,
    maxRetries: number = 1,
): Promise<{ text: string; model: string; error?: string } | null> {
    const errors: string[] = [];
    for (const model of MODELS) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 25000);

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
                        max_tokens: 1024,
                    }),
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    const text = data?.choices?.[0]?.message?.content;
                    if (text) return { text, model };
                } else {
                    const errText = await response.text();
                    errors.push(`${model}: HTTP ${response.status} - ${errText.slice(0, 100)}`);
                    break;
                }
            } catch (err: any) {
                errors.push(`${model}: Fetch Error - ${err.message}`);
                break;
            }
        }
    }
    return { text: '', model: '', error: errors.join(' | ') || 'All Groq models failed' };
}

export async function runMoltbergAnalysis(projectName: string, pitch: string, niche: string): Promise<{ success: boolean; analysis?: AgentAnalysis; model?: string; error?: string }> {
    try {
        const prompt = `Project Name: ${projectName}\nNiche: ${niche}\nPitch: ${pitch}`;
        const result = await callMixedApiWithRetry(prompt);

        if (!result || !result.text) {
            return { success: false, error: result?.error || "Moltberg is currently offline" };
        }

        // Clean JSON formatting
        let cleanJson = result.text.replace(/```json\n?/, '').replace(/```\n?/, '').trim();

        try {
            const parsed = JSON.parse(cleanJson);
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
            return {
                success: true,
                analysis,
                model: result.model
            };
        } catch (parseError) {
            console.error('[MOLTBERG] JSON Parse error:', parseError, 'Raw text:', result.text);
            return { success: false, error: "Failed to parse agent response" };
        }
    } catch (error: any) {
        console.error('[MOLTBERG] Analysis error:', error);
        return { success: false, error: error.message };
    }
}
