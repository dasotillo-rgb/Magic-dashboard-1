import { NextResponse } from 'next/server';

const BASE = process.env.APE_SERVER || 'http://51.21.170.68:5000';
const TOKEN = process.env.APE_API_TOKEN || '';
const TIMEOUT_MS = 5_000;

export const dynamic = 'force-dynamic';

export async function GET() {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const res = await fetch(`${BASE}/live-trades`, {
            signal: controller.signal,
            cache: 'no-store',
            headers: { 'x-api-token': TOKEN },
        });
        clearTimeout(tid);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const trades = Array.isArray(json) ? json : (json.trades || []);
        return NextResponse.json({ trades });
    } catch (err) {
        clearTimeout(tid);
        return NextResponse.json({ trades: [] }, { status: 200 });
    }
}
