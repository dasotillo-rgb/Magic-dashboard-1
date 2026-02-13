import { NextRequest, NextResponse } from 'next/server';
import { getCandles } from '@/lib/pionex-client';

// Binance public API as fallback for intervals Pionex doesn't support
const BINANCE_BASE = 'https://api.binance.com/api/v3';

// Pionex supported intervals
const PIONEX_INTERVALS = new Set(['4H', '8H', '12H', '1D', '1M']);

// Map our unified interval codes to Binance format
const BINANCE_INTERVAL_MAP: Record<string, string> = {
    '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h',
    '4H': '4h', '8H': '8h', '12H': '12h', '1D': '1d', '1W': '1w', '1M': '1M',
};

// Map symbol format: BTC_USDT → BTCUSDT
function toBinanceSymbol(symbol: string): string {
    return symbol.replace('_', '');
}

async function getBinanceCandles(symbol: string, interval: string, limit: number) {
    const binanceInterval = BINANCE_INTERVAL_MAP[interval] || '1d';
    const binanceSymbol = toBinanceSymbol(symbol);
    const url = `${BINANCE_BASE}/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Binance API ${res.status}`);

    const data = await res.json();
    return data.map((k: any[]) => ({
        time: Math.floor(k[0] / 1000),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
    })).sort((a: any, b: any) => a.time - b.time);
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol') || 'BTC_USDT';
        const interval = searchParams.get('interval') || '1D';
        const limit = parseInt(searchParams.get('limit') || '300');

        let candles;

        if (PIONEX_INTERVALS.has(interval)) {
            // Use Pionex for supported intervals
            candles = await getCandles(symbol, interval, limit);
        } else {
            // Use Binance for all other intervals (1m, 5m, 15m, 1h, 1W)
            candles = await getBinanceCandles(symbol, interval, limit);
        }

        return NextResponse.json({ candles });
    } catch (error: any) {
        console.error('Candles API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch candles' },
            { status: 500 }
        );
    }
}
