import { NextResponse } from 'next/server';

const BASE = process.env.APE_SERVER || 'http://51.21.170.68:5000';
const TOKEN = process.env.APE_API_TOKEN || '';
const TIMEOUT_MS = 4_000; // fast — polled every 1s

export const dynamic = 'force-dynamic';

export async function GET() {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const res = await fetch(`${BASE}/active-market`, {
            signal: controller.signal,
            cache: 'no-store',
            headers: { 'x-api-token': TOKEN },
        });
        clearTimeout(tid);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return NextResponse.json(json);
    } catch {
        clearTimeout(tid);
        // Graceful fallback — widget shows "waiting" state
        return NextResponse.json({ status: 'waiting_data' }, { status: 200 });
    }
}
