import { NextRequest, NextResponse } from 'next/server';

const HFT_BASE = 'http://51.21.170.68:5001';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || '/api/all';

    try {
        const res = await fetch(`${HFT_BASE}${path}`, {
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) {
            return NextResponse.json({ error: `HFT server returned ${res.status}` }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: any) {
        console.error('[HFT Proxy] Error:', err.message);
        return NextResponse.json({ error: err.message || 'Connection failed' }, { status: 502 });
    }
}

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || '/api/bot-settings';

    try {
        const body = await req.json();
        const res = await fetch(`${HFT_BASE}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) {
            return NextResponse.json({ error: `HFT server returned ${res.status}` }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: any) {
        console.error('[HFT Proxy POST] Error:', err.message);
        return NextResponse.json({ error: err.message || 'Connection failed' }, { status: 502 });
    }
}
