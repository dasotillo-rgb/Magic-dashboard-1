import { NextResponse } from 'next/server';

const BASE = process.env.APE_SERVER || 'http://51.21.170.68:5000';
const API_KEY = process.env.APE_API_KEY || '';
const TIMEOUT_MS = 6000;

export const dynamic = 'force-dynamic';

const DEMO = () => ({
    is_demo: true,
    status: 'DEMO',
    market: 'BTC/USDT',
    mid_price: 69420.5,
    spread: 0.08,
    bid: 69415.0,
    ask: 69426.0,
    inventory: 0,
    pnl_session: 0,
    last_action: {
        side: 'BUY',
        price: 69415.0,
        size: 0.001,
        timestamp: new Date().toISOString(),
    },
    log: [
        `[${new Date().toLocaleTimeString()}] Market Maker iniciado. Esperando señal del servidor...`,
    ],
    fetched_at: Date.now(),
});

export async function GET() {
    const url = `${BASE}/api/maker${API_KEY ? `?api_key=${API_KEY}` : ''}`;

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
            return NextResponse.json({ ...data, is_demo: false, fetched_at: Date.now() });
        } catch (err) {
            clearTimeout(tid);
            console.warn('[maker] Remote unreachable, returning demo data.', err);
            return NextResponse.json(DEMO());
        }
    } catch (err) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
