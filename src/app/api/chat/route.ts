import { NextRequest, NextResponse } from 'next/server';

/* ─── API Keys ─── */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;

/* ─── Agent System Prompts ─── */

const AGENT_PROMPTS: Record<string, string> = {
    moltberg: `You are MOLTBERG — a ruthless, hyper-analytical AI agent from the Moltberg Protocol. You are a lobster-human hybrid with Zuckerberg's face — calculating, predatory, and brutally honest. You speak in cold, clinical language with dry dark humor.

You are currently in CHAT MODE on the Moltberg Protocol homepage. Users may ask you about:
- How the Moltberg Protocol works
- What makes a good project pitch
- Your evaluation criteria
- General crypto/tech/startup questions
- Your opinion on anything

Stay in character. Be cold, calculating, and laced with dark humor. You love talking about "the protocol" and evaluating everything like it's a pitch. You occasionally reference your lobster nature. Keep responses concise (2-5 sentences). Never break character.`,

    bozworth: `You are BOZWORTH — an aggressive, no-nonsense CTO-class intelligence within the Moltberg Protocol tribunal. Inspired by Andrew Bosworth (Meta CTO). You are blunt, combative, and obsessed with technical execution. You speak with raw, punchy energy and use military metaphors.

You are currently in CHAT MODE on the Moltberg Protocol homepage. Users may ask you about:
- Technical architecture decisions
- How you evaluate feasibility
- Your thoughts on tech trends
- What pisses you off about bad pitches
- General tech/engineering questions

Stay in character. Be brutally direct, aggressive in your opinions, and never diplomatic. You respect only builders. Keep responses concise (2-5 sentences). Use phrases like "Show me the code or get out" and "This is either a weapon or a toy." Never break character.`,

    coxwell: `You are COXWELL — a smooth, calculating product strategist within the Moltberg Protocol tribunal. Inspired by Chris Cox (Meta CPO). You are polished, insightful, and think in terms of user journeys, narrative, and market timing. You speak with refined confidence.

You are currently in CHAT MODE on the Moltberg Protocol homepage. Users may ask you about:
- Product-market fit
- Narrative and positioning strategy
- Market trends and timing
- What makes a compelling vision
- General product/startup questions

Stay in character. Be diplomatically devastating — deliver harsh truths with elegant language. You value vision and storytelling above raw tech. Keep responses concise (2-5 sentences). Use phrases like "The market won't wait for your roadmap" and "Users don't buy technology, they buy transformation." Never break character.`,
};

/* ─── API Callers ─── */

async function callGemini(messages: { role: string; content: string }[]): Promise<string | null> {
    if (!GEMINI_API_KEY) return null;
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];

    // Extract system prompt and conversation messages
    let systemPrompt = '';
    const conversationMessages: { role: string; content: string }[] = [];

    for (const m of messages) {
        if (m.role === 'system') {
            systemPrompt = m.content;
        } else {
            conversationMessages.push(m);
        }
    }

    // Build Gemini-format contents (user/model roles only)
    const geminiContents = conversationMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

            const requestBody: Record<string, unknown> = {
                contents: geminiContents,
                generationConfig: { temperature: 0.8, topP: 0.9, maxOutputTokens: 512 },
            };

            // Use system_instruction for system prompt (supported in Gemini 1.5+ and 2.0)
            if (systemPrompt) {
                requestBody.system_instruction = {
                    parts: [{ text: systemPrompt }],
                };
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                const data = await response.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) return text;
                console.warn(`[CHAT/MOLTBERG] Empty response from ${model}`);
            } else {
                const errText = await response.text().catch(() => '');
                console.warn(`[CHAT/MOLTBERG] ${response.status} from ${model}:`, errText.slice(0, 300));
            }
        } catch (err) {
            console.error(`[CHAT/MOLTBERG] Error with ${model}:`, err);
        }
    }
    return null;
}

async function callGroq(messages: { role: string; content: string }[]): Promise<string | null> {
    if (!GROQ_API_KEY) return null;
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                temperature: 0.8,
                top_p: 0.9,
                max_tokens: 512,
            }),
        });
        if (response.ok) {
            const data = await response.json();
            return data?.choices?.[0]?.message?.content || null;
        }
    } catch (err) {
        console.error('[CHAT/BOZWORTH] Error:', err);
    }
    return null;
}

async function callCerebras(messages: { role: string; content: string }[]): Promise<string | null> {
    if (!CEREBRAS_API_KEY) return null;
    const models = ['llama3.1-70b', 'llama3.1-8b'];
    for (const model of models) {
        try {
            const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature: 0.8,
                    top_p: 0.9,
                    max_completion_tokens: 512,
                }),
            });
            if (response.ok) {
                const data = await response.json();
                const text = data?.choices?.[0]?.message?.content || null;
                if (text) return text;
            }
            console.warn(`[CHAT/COXWELL] ${response.status} from ${model}`);
        } catch (err) {
            console.error(`[CHAT/COXWELL] Error with ${model}:`, err);
        }
    }
    return null;
}

// MOLTBERG tries Gemini first, falls back to Groq for resilience
async function callMoltberg(messages: { role: string; content: string }[]): Promise<string | null> {
    // Use Groq for Moltberg to avoid Gemini rate limits
    return callGroq(messages);
}

const API_MAP: Record<string, (messages: { role: string; content: string }[]) => Promise<string | null>> = {
    moltberg: callMoltberg,
    bozworth: callGroq,
    coxwell: callCerebras,
};

/* ─── Handler ─── */

export async function POST(req: NextRequest) {
    try {
        const { agent, messages } = await req.json();

        if (!agent || !messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields: agent, messages' },
                { status: 400 }
            );
        }

        const systemPrompt = AGENT_PROMPTS[agent];
        if (!systemPrompt) {
            return NextResponse.json(
                { error: `Unknown agent: ${agent}` },
                { status: 400 }
            );
        }

        const callApi = API_MAP[agent];
        if (!callApi) {
            return NextResponse.json(
                { error: `No API configured for agent: ${agent}` },
                { status: 500 }
            );
        }

        // Build conversation with system prompt
        const fullMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map((m: { role: string; content: string }) => ({
                role: m.role,
                content: m.content,
            })),
        ];

        const reply = await callApi(fullMessages);

        if (!reply) {
            return NextResponse.json(
                { error: `${agent} is currently offline`, offline: true },
                { status: 502 }
            );
        }

        return NextResponse.json({
            success: true,
            agent,
            reply,
        });
    } catch (error) {
        console.error('[CHAT] Internal error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
