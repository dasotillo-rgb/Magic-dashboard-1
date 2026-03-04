import { NextResponse } from 'next/server';

const BASE = process.env.APE_SERVER || 'http://51.21.170.68:5000';
const TOKEN = process.env.APE_API_TOKEN || '';
const TIMEOUT_MS = 10_000;

export const dynamic = 'force-dynamic';

export async function POST() {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const res = await fetch(`${BASE}/panic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-token': TOKEN },
            signal: controller.signal,
        });
        clearTimeout(tid);

        const body = await res.json().catch(() => ({}));
        return NextResponse.json({ ok: res.ok, ...body }, { status: res.ok ? 200 : res.status });
    } catch (err) {
        clearTimeout(tid);
        const reason = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ ok: false, reason }, { status: 503 });
    }
}
