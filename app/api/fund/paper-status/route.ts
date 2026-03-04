import { NextResponse } from 'next/server';

const BASE = process.env.APE_SERVER || 'http://51.21.170.68:5000';
const TOKEN = process.env.APE_API_TOKEN || '';
const TIMEOUT_MS = 7000;

export const dynamic = 'force-dynamic';

export async function GET() {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const res = await fetch(`${BASE}/paper-status`, {
            cache: 'no-store',
            signal: controller.signal,
            headers: { 'x-api-token': TOKEN },
        });
        clearTimeout(tid);

        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const data = await res.json();
        return NextResponse.json({ ...data, fetched_at: Date.now() });
    } catch (err) {
        clearTimeout(tid);
        const reason = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({
            status: 'OFFLINE',
            equity: null,
            balance: null,
            active_positions: null,
            reason,
            fetched_at: Date.now(),
        });
    }
}
