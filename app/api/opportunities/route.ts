import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: { temperature: 0.9 },
        });

        const prompt = `You are an elite business opportunity scout. Your job is to find REAL, CURRENT opportunities by analyzing what people are actively discussing, complaining about, or requesting RIGHT NOW on the internet.

SEARCH the internet for:
1. Reddit posts from subreddits like r/entrepreneur, r/SideProject, r/startups, r/freelance, r/automation, r/artificial, r/smallbusiness — look for pain points, "I wish someone would build...", "Looking for a tool that...", "I'd pay for..."
2. X/Twitter trending discussions about unmet business needs, gaps in the market, viral complaints about existing tools
3. Recent tech news and product launches that create derivative opportunities
4. Trending niches on platforms like ProductHunt, IndieHackers, Hacker News

For each opportunity, you MUST:
- Base it on a REAL trend or real discussion happening NOW (March 2025)
- Explain why it's timely and how to execute it fast
- Include realistic revenue estimates
- Tag the source platform where you found the signal

The entrepreneur you're advising:
- Lives in Spain, speaks Spanish and English
- Has strong AI/coding skills (Python, JS, Next.js)
- Runs crypto trading bots on Polymarket
- Imports German cars to Spain
- Has access to Gemini API, web scraping tools, and automation infrastructure

Generate 6 opportunities. Mix of difficulty. At least 2 should be "hot" (high urgency, narrow time window).

Respond with ONLY a JSON array (no markdown, no backticks):
[
  {
    "id": "unique-slug",
    "title": "Opportunity Title (concise, punchy)",
    "description": "2-3 sentences: what the opportunity is, WHY it exists now (cite the trend/thread), and exact first steps to execute",
    "category": "ai-saas|import|digital|automation|content",
    "estimatedRevenue": "€X.XXX-X.XXX/mes",
    "timeToRevenue": "X-X semanas",
    "difficulty": "easy|medium|hard",
    "roi": "Xx-Xx",
    "tags": ["tag1","tag2","tag3"],
    "hot": true|false,
    "source": "reddit|twitter|producthunt|hackernews|web",
    "sourceUrl": "https://example.com/relevant-link-or-empty-string",
    "sourceSnippet": "Brief quote or summary of the signal that inspired this opportunity"
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
