import { NextResponse } from 'next/server';

const BASE = process.env.APE_SERVER || 'http://51.21.170.68:5000';
const API_KEY = process.env.APE_API_KEY || '';
const TIMEOUT_MS = 8000;

export const dynamic = 'force-dynamic';

export async function GET() {
    const url = `${BASE}/api/weather${API_KEY ? `?api_key=${API_KEY}` : ''}`;

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
            console.warn('[weather] Remote unreachable:', err);
            return NextResponse.json({ is_demo: true, logs: demoLogs(), fetched_at: Date.now() });
        }
    } catch (err) {
        console.error('[weather] Internal error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

const today = () => new Date().toISOString().slice(0, 10);
const demoLogs = () => [
    `[${today()} 06:00:01] INFO: Weather Farmer iniciado.`,
    `[${today()} 06:15:32] INFO: Temperatura media: 14°C | Humedad: 72%`,
    `[${today()} 06:30:00] INFO: Sin señales activas.`,
];
