import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

/** Strip markdown code fences (```json ... ```) and return raw JSON string */
function stripMarkdown(text: string): string {
    return text
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
}

export async function GET() {
    try {
        // ── Fear & Greed Index ─────────────────────────────────────────────
        const fngRes = await fetch('https://api.alternative.me/fng/', { cache: 'no-store' });
        const fngData = await fngRes.json();
        const currentFng = fngData.data[0];
        const fngValue = parseInt(currentFng.value);
        const fngLabel = currentFng.value_classification;

        // ── Gemini X/Twitter sentiment ─────────────────────────────────────
        let twitterSentiment = {
            score: fngValue,
            label: fngLabel,
            trendingTopics: ['#Bitcoin', '#Crypto', '#BTC', '#Altcoins'],
            summary: `Market at ${fngValue}/100 F&G (${fngLabel}). Community watching key levels.`,
        };

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const prompt = `You are a real-time crypto social media analyst. Today's Fear & Greed Index is ${fngValue}/100 labeled "${fngLabel}".

Analyze what the crypto community on X (Twitter) would currently be saying. Consider:
- Recent BTC price action relative to ATH
- Current market sentiment shown by F&G index
- Typical narratives at this fear level

Respond with ONLY a JSON object (no markdown, no backticks, no explanation):
{"score":NUMBER_0_TO_100,"label":"STRING_MAX_20_CHARS","trendingTopics":["#tag1","#tag2","#tag3","#tag4"],"summary":"ONE_sentence_max_20_words"}`;

            const result = await model.generateContent(prompt);
            const rawText = result.response.text();
            const cleaned = stripMarkdown(rawText);
            const parsed = JSON.parse(cleaned);

            if (
                typeof parsed.score === 'number' &&
                parsed.label &&
                Array.isArray(parsed.trendingTopics) &&
                parsed.summary
            ) {
                twitterSentiment = parsed;
            }
        } catch (aiErr) {
            console.warn('[sentiment] Gemini failed, using F&G-derived fallback:', aiErr instanceof Error ? aiErr.message : aiErr);
        }

        return NextResponse.json({
            fng: { value: fngValue, label: fngLabel, timestamp: currentFng.timestamp },
            twitter: twitterSentiment,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('[sentiment] Fatal error:', error);
        return NextResponse.json({ error: 'Failed to fetch sentiment data' }, { status: 500 });
    }
}
