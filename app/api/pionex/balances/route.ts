import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBalances } from '@/lib/pionex-client';

export async function GET() {
    try {
        const cookieStore = cookies();
        const apiKey = cookieStore.get('pionex_api_key')?.value;
        const apiSecret = cookieStore.get('pionex_api_secret')?.value;

        const creds = (apiKey && apiSecret) ? { apiKey, apiSecret } : undefined;

        const balances = await getBalances(creds);
        return NextResponse.json({ balances });
    } catch (error: any) {
        console.error('Pionex Balances Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch balances' },
            { status: 500 }
        );
    }
}
