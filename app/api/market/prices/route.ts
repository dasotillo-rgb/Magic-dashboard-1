import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const COINS = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    { id: 'solana', symbol: 'SOL', name: 'Solana' },
];

export async function GET() {
    try {
        const ids = COINS.map(c => c.id).join(',');
        const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
            { cache: 'no-store', next: { revalidate: 0 } }
        );

        if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
        const data = await res.json();

        const prices = COINS.map(c => ({
            name: c.name,
            symbol: c.symbol,
            price: data[c.id]?.usd ?? 0,
            change24h: data[c.id]?.usd_24h_change ?? 0,
        }));

        return NextResponse.json({ prices, fetched_at: Date.now() });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg, prices: [], fetched_at: Date.now() }, { status: 500 });
    }
}
