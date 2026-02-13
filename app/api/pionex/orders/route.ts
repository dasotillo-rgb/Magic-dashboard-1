import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOpenOrders, getAllOrders, placeOrder, cancelOrder, type Credentials } from '@/lib/pionex-client';

const getCreds = (): Credentials | undefined => {
    const cookieStore = cookies();
    const apiKey = cookieStore.get('pionex_api_key')?.value;
    const apiSecret = cookieStore.get('pionex_api_secret')?.value;
    return (apiKey && apiSecret) ? { apiKey, apiSecret } : undefined;
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol') || 'BTC_USDT';
        const type = searchParams.get('type') || 'all'; // 'open' | 'all'
        const creds = getCreds();

        const orders = type === 'open'
            ? await getOpenOrders(symbol, creds)
            : await getAllOrders(symbol, 20, creds);

        return NextResponse.json({ orders });
    } catch (error: any) {
        console.error('Pionex Orders Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { symbol, side, type, amount, price } = body;
        const creds = getCreds();

        if (!symbol || !side || !type || !amount) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const result = await placeOrder(symbol, side, type, amount, price, creds);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Pionex Place Order Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to place order' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const symbol = searchParams.get('symbol');
        const creds = getCreds();

        if (!orderId || !symbol) {
            return NextResponse.json(
                { error: 'Missing orderId or symbol' },
                { status: 400 }
            );
        }

        const success = await cancelOrder(orderId, symbol, creds);
        return NextResponse.json({ success });
    } catch (error: any) {
        console.error('Pionex Cancel Order Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to cancel order' },
            { status: 500 }
        );
    }
}
