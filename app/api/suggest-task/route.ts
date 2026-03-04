import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

function stripMarkdown(text: string): string {
    return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

export async function GET() {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `You are a smart assistant for a developer's personal dashboard. They already have:
- Car import deal finder (scraping autoscout24.de)
- Market Sentiment widget (Fear & Greed + X/Twitter via Gemini)
- Polymarket Quant Fund tracker with live positions
- BTC/ETH/SOL price widget
- AI-powered Business Opportunities widget
- Open Orders tracker (Pionex)

Suggest ONE new, specific, and actionable feature or task they could add to their dashboard. It should be technical, innovative, and buildable.

Respond with ONLY a JSON object (no markdown, no backticks):
{"task":"Exact task description in Spanish, max 80 characters","type":"feature|fix|project|monitor","priority":"high|medium|low"}`;

        const result = await model.generateContent(prompt);
        const cleaned = stripMarkdown(result.response.text());
        const parsed = JSON.parse(cleaned);

        return NextResponse.json(parsed);
    } catch (err) {
        return NextResponse.json({ error: 'Could not generate suggestion' }, { status: 500 });
    }
}
