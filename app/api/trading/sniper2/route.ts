import { NextResponse } from 'next/server';

const BASE = process.env.APE_SERVER || 'http://51.21.170.68:5000';
const API_KEY = process.env.APE_API_KEY || '';
const TIMEOUT_MS = 6000;

export const dynamic = 'force-dynamic';

const DEMO = () => ({
    is_demo: true,
    status: 'DEMO',
    pair: 'BTC/USDT',
    exchange: 'Bybit',
    trend_5m: 'NEUTRAL',
    trend_strength: 0,
    price_now: 69420.0,
    phase: 'SCANNING',
    signal_strength: 0,
    targets: [],
    log: [
        `[${new Date().toLocaleTimeString()}] APE-SNIPER iniciado. Escaneando mercado...`,
    ],
    fetched_at: Date.now(),
});

export async function GET() {
    const url = `${BASE}/api/sniper${API_KEY ? `?api_key=${API_KEY}` : ''}`;

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
            console.warn('[sniper2] Remote unreachable, returning demo data.', err);
            return NextResponse.json(DEMO());
        }
    } catch (err) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
