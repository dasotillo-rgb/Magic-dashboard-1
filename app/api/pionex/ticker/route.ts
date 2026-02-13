import { NextRequest, NextResponse } from 'next/server';
import { getTicker, getTickers } from '@/lib/pionex-client';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');

        if (symbol) {
            const ticker = await getTicker(symbol);
            return NextResponse.json({ ticker });
        } else {
            const tickers = await getTickers();
            // Filter to main USDT pairs
            const mainPairs = ['BTC_USDT', 'ETH_USDT', 'BNB_USDT', 'SOL_USDT', 'XRP_USDT', 'ADA_USDT', 'DOGE_USDT', 'AVAX_USDT', 'DOT_USDT', 'MATIC_USDT'];
            const filtered = tickers.filter((t: any) => mainPairs.includes(t.symbol));
            return NextResponse.json({ tickers: filtered });
        }
    } catch (error: any) {
        console.error('Pionex Ticker Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch ticker' },
            { status: 500 }
        );
    }
}
