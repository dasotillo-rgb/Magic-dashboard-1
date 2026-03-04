import { NextResponse } from 'next/server';

const BASE = process.env.APE_SERVER || 'http://51.21.170.68:5000';
const TOKEN = process.env.APE_API_TOKEN || '';
const TIMEOUT_MS = 6_000;

export const dynamic = 'force-dynamic';

export async function GET() {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const res = await fetch(`${BASE}/bot_state`, {
            signal: controller.signal,
            cache: 'no-store',
            headers: { 'x-api-token': TOKEN },
        });
        clearTimeout(tid);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return NextResponse.json({ ...json, fetched_at: Date.now() });
    } catch (err) {
        clearTimeout(tid);
        // Graceful offline envelope — widget shows loss-of-signal state
        return NextResponse.json({
            status: 'OFFLINE',
            last_heartbeat_time: null,
            last_error: 'None',
            fetched_at: Date.now(),
        }, { status: 200 }); // 200 so widget doesn't crash on !res.ok
    }
}
