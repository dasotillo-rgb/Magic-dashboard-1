import { NextResponse } from 'next/server';

// ─── Config ──────────────────────────────────────────────────────────────────
const SIMMER_RPC = 'https://api.simmer.markets/api/rpc/polygon';
const API_KEY = process.env.APE_API_KEY || 'sk_live';
// Full Simmer-managed wallet address — set APE_WALLET in .env.local
const WALLET = process.env.APE_WALLET || '0x0000000000000000000000000000000000000000';

// USDC.e on Polygon (bridged PoS USDC, 6 decimals)
// Contract: 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
const USDC_CONTRACT = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
// Encode balanceOf(address) call: selector 0x70a08231 + padded address
function encodeBalanceOf(addr: string): string {
    const clean = addr.replace('0x', '').toLowerCase().padStart(40, '0');
    return `0x70a08231000000000000000000000000${clean}`;
}

// BigInt-safe hex → number conversion (handles 64-char ERC-20 results)
function hexToFloat(hex: string | null, decimals: number): number | null {
    if (!hex || hex === '0x' || hex === '0x0') return 0;
    try {
        const val = BigInt(hex);
        // Divide BigInt by 10^decimals using floating point
        return Number(val) / Math.pow(10, decimals);
    } catch {
        return null;
    }
}

const TIMEOUT_MS = 8000;

async function rpcCall(method: string, params: unknown[]): Promise<string | null> {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(SIMMER_RPC, {
            method: 'POST',
            cache: 'no-store',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY,
            },
            body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
        });
        clearTimeout(tid);
        if (!res.ok) return null;
        const json = await res.json();
        return json.result ?? null;
    } catch {
        clearTimeout(tid);
        return null;
    }
}

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Run both calls in parallel
        const [polHex, usdcHex] = await Promise.all([
            // Native POL balance (18 decimals)
            rpcCall('eth_getBalance', [WALLET, 'latest']),
            // USDC ERC-20 balance (6 decimals)
            rpcCall('eth_call', [{ to: USDC_CONTRACT, data: encodeBalanceOf(WALLET) }, 'latest']),
        ]);

        const pol = hexToFloat(polHex, 18);
        const usdc = hexToFloat(usdcHex, 6);

        return NextResponse.json({
            usdc,
            pol,
            wallet: WALLET,
            server_ok: polHex !== null || usdcHex !== null,
            source: 'simmer-rpc',
        });
    } catch (err) {
        console.error('[status] Error:', err);
        return NextResponse.json(
            { usdc: null, pol: null, server_ok: false, error: 'Internal error' },
            { status: 500 }
        );
    }
}
