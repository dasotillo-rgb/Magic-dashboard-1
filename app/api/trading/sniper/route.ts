import { NextResponse } from 'next/server';

const BASE = process.env.APE_SERVER || 'http://51.21.170.68:5000';
const API_KEY = process.env.APE_API_KEY || '';
const TIMEOUT_MS = 8000;

const DEMO_DATA = {
    is_demo: true,
    detected_at: new Date().toISOString(),
    arbitrages: [
        { question: 'BTC/USDT Futures spread', strategy: 'Bullish momentum oscillator cross', net_profit_pct: 1.42 },
        { question: 'ETH perp vs spot delta', strategy: 'Neutral arbitrage hedge', net_profit_pct: 0.87 },
    ],
};

export const dynamic = 'force-dynamic';

export async function GET() {
    const url = `${BASE}/api/crypto${API_KEY ? `?api_key=${API_KEY}` : ''}`;

    try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const res = await fetch(url, {
                cache: 'no-store',
                signal: controller.signal,
                headers: { 'Authorization': `Bearer ${API_KEY}` },
            });
            clearTimeout(tid);

            if (!res.ok) throw new Error(`Remote error: ${res.status}`);

            const data = await res.json();
            return NextResponse.json({ ...data, is_demo: false });
        } catch (err) {
            clearTimeout(tid);
            console.warn('[sniper] Remote unreachable:', err);
            return NextResponse.json({ ...DEMO_DATA, detected_at: new Date().toISOString() });
        }
    } catch (err) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
