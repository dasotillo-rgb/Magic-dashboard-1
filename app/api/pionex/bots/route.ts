// app/api/pionex/bots/route.ts
import { NextResponse } from 'next/server';
import { BotEngine, BotConfig } from '@/lib/bot-engine';
import { cookies } from 'next/headers';

export async function GET() {
    return NextResponse.json({ bots: BotEngine.getBots() });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, symbol, type, investment, upperPrice, lowerPrice, grids } = body;

        const cookieStore = cookies();
        const apiKey = cookieStore.get('pionex_api_key')?.value;
        const apiSecret = cookieStore.get('pionex_api_secret')?.value;

        if (!apiKey || !apiSecret) {
            return NextResponse.json({ error: 'Missing API Credentials in cookies' }, { status: 401 });
        }

        const config: BotConfig = {
            id: id || Math.random().toString(36).substring(7),
            symbol,
            type,
            investment: parseFloat(investment),
            upperPrice: upperPrice ? parseFloat(upperPrice) : undefined,
            lowerPrice: lowerPrice ? parseFloat(lowerPrice) : undefined,
            grids: grids ? parseInt(grids) : undefined,
            status: 'RUNNING',
            lastUpdate: Date.now(),
            totalProfit: 0,
        };

        await BotEngine.createBot(config, { apiKey, apiSecret });

        return NextResponse.json({ success: true, bot: config });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('id');

    if (!botId) return NextResponse.json({ error: 'Missing bot ID' }, { status: 400 });

    BotEngine.stopBot(botId);
    return NextResponse.json({ success: true });
}

/**
 * Pulse check endpoint to trigger bot evaluation.
 * In a production app, this would be a CRON job.
 */
export async function PUT(request: Request) {
    try {
        const cookieStore = cookies();
        const apiKey = cookieStore.get('pionex_api_key')?.value;
        const apiSecret = cookieStore.get('pionex_api_secret')?.value;

        if (!apiKey || !apiSecret) {
            return NextResponse.json({ error: 'Missing API Credentials' }, { status: 401 });
        }

        const bots = BotEngine.getBots();
        for (const bot of bots) {
            if (bot.status === 'RUNNING') {
                await BotEngine.tick(bot.id, { apiKey, apiSecret });
            }
        }

        return NextResponse.json({ success: true, count: bots.length });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
