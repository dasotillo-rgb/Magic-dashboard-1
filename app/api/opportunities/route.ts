import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

function stripMarkdown(text: string): string {
    return text
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
}

export async function GET() {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `You are an expert business opportunity analyst for a tech-savvy entrepreneur in Spain who builds AI tools, imports cars from Germany, and runs crypto trading bots.

Based on CURRENT TRENDS in 2025 (AI, crypto, automation, import/export, digital products), generate 6 fresh business opportunity ideas that are:
- Actionable within weeks
- Based on tools and skills this entrepreneur already has
- Mix of difficulty levels (2 easy, 2 medium, 2 hard)
- Include specific revenue estimates and realistic ROI

Respond with ONLY a JSON array (no markdown, no backticks, no explanation):
[
  {
    "id": "unique-slug",
    "title": "Opportunity Title",
    "description": "2-3 sentence description of the opportunity and how to execute it",
    "category": "ai-saas|import|digital|automation|content",
    "estimatedRevenue": "€X.XXX-X.XXX/mes",
    "timeToRevenue": "X-X semanas",
    "difficulty": "easy|medium|hard",
    "roi": "Xx-Xx",
    "tags": ["tag1","tag2","tag3"],
    "hot": true|false
  }
]`;

        const result = await model.generateContent(prompt);
        const rawText = result.response.text();
        const cleaned = stripMarkdown(rawText);
        const opportunities = JSON.parse(cleaned);

        if (!Array.isArray(opportunities) || opportunities.length === 0) {
            throw new Error('Invalid opportunities response');
        }

        return NextResponse.json({
            opportunities,
            generated_at: Date.now(),
        });
    } catch (error) {
        console.error('[opportunities] Gemini error:', error instanceof Error ? error.message : error);
        return NextResponse.json({ error: 'Failed to generate opportunities', opportunities: [] }, { status: 500 });
    }
}
