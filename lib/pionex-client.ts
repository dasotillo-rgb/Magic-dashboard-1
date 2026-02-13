import crypto from 'crypto';

const BASE_URL = 'https://api.pionex.com';

// Dynamic credential support
export type Credentials = {
    apiKey: string;
    apiSecret: string;
};

const getCredentials = (creds?: Credentials) => {
    return {
        key: creds?.apiKey || process.env.NEXT_PUBLIC_PIONEX_KEY || '',
        secret: creds?.apiSecret || process.env.NEXT_PUBLIC_PIONEX_SECRET || '',
    };
};

/**
 * Generate HMAC SHA256 signature for Pionex API
 */
function signRequest(
    method: string,
    path: string,
    params: Record<string, string>,
    secret: string,
    body?: string
): { signature: string; timestamp: string } {
    const timestamp = Date.now().toString();

    // Add timestamp to params
    const allParams = { ...params, timestamp };

    // Sort by key ascending ASCII and join
    const sortedKeys = Object.keys(allParams).sort();
    const queryString = sortedKeys.map(k => `${k}=${(allParams as Record<string, string>)[k]}`).join('&');

    // Build PATH_URL
    const pathUrl = `${path}?${queryString}`;

    // Message = Method + PathUrl + Body
    const bodyStr = body ? body : '';
    const message = method + pathUrl + bodyStr;

    const signature = crypto
        .createHmac('sha256', secret)
        .update(message)
        .digest('hex');

    return { signature, timestamp };
}

/**
 * Make authenticated request to Pionex API
 */
async function pionexRequest<T>(
    method: string,
    path: string,
    params: Record<string, string> = {},
    body?: object,
    creds?: Credentials
): Promise<T> {
    const { key, secret } = getCredentials(creds);
    if (!key || !secret) {
        // Fallback or error? For public endpoints this is fine, but this function is for auth calls.
        if (!key && !secret) throw new Error('Missing API Credentials. Please configure them in Settings.');
    }

    const bodyStr = body ? JSON.stringify(body) : undefined;
    const { signature, timestamp } = signRequest(method, path, params, secret, bodyStr);

    // Build full URL with sorted params + timestamp
    const allParams = { ...params, timestamp };
    const sortedKeys = Object.keys(allParams).sort();
    const queryString = sortedKeys.map(k => `${k}=${encodeURIComponent((allParams as Record<string, string>)[k])}`).join('&');
    const url = `${BASE_URL}${path}?${queryString}`;

    const headers: Record<string, string> = {
        'PIONEX-KEY': key,
        'PIONEX-SIGNATURE': signature,
        'Content-Type': 'application/json',
    };

    const res = await fetch(url, {
        method,
        headers,
        body: bodyStr,
        cache: 'no-store',
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Pionex API ${res.status}: ${text}`);
    }

    return res.json();
}

/**
 * Public (no auth) request
 */
async function pionexPublicRequest<T>(
    path: string,
    params: Record<string, string> = {}
): Promise<T> {
    const queryString = Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');
    const url = `${BASE_URL}${path}${queryString ? '?' + queryString : ''}`;

    const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Pionex API ${res.status}: ${text}`);
    }

    return res.json();
}

// ===== PUBLIC ENDPOINTS =====

export type Candle = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

export type TickerData = {
    symbol: string;
    price: string;
    volume: string;
    change: string;
};

export async function getCandles(
    symbol: string,
    interval: string = '1D',
    limit: number = 300
): Promise<Candle[]> {
    const data = await pionexPublicRequest<any>('/api/v1/market/klines', {
        symbol,
        interval,
        limit: limit.toString(),
    });

    if (!data?.data?.klines) return [];

    const candles = data.data.klines.map((k: any) => ({
        time: Math.floor(Number(k.time || k[0]) / 1000),
        open: parseFloat(k.open || k[1]),
        close: parseFloat(k.close || k[2]),
        high: parseFloat(k.high || k[3]),
        low: parseFloat(k.low || k[4]),
        volume: parseFloat(k.volume || k[5]),
    }));

    candles.sort((a: Candle, b: Candle) => a.time - b.time);
    return candles;
}

export async function getTickers(): Promise<TickerData[]> {
    const data = await pionexPublicRequest<any>('/api/v1/market/tickers');
    if (!data?.data?.tickers) return [];
    return data.data.tickers;
}

export async function getTicker(symbol: string): Promise<TickerData | null> {
    const tickers = await getTickers();
    return tickers.find((t: any) => t.symbol === symbol) || null;
}

// ===== PRIVATE ENDPOINTS =====

export type Balance = {
    coin: string;
    free: string;
    frozen: string;
    total: number;
};

export async function getBalances(creds?: Credentials): Promise<Balance[]> {
    const data = await pionexRequest<any>('GET', '/api/v1/account/balances', {}, undefined, creds);

    if (data.result === false || !data?.data?.balances) {
        throw new Error(data.message || `Pionex API Error: ${data.code || 'Unknown'}`);
    }

    return data.data.balances
        .map((b: any) => ({
            coin: b.coin,
            free: b.free,
            frozen: b.frozen,
            total: parseFloat(b.free) + parseFloat(b.frozen),
        }))
        .map((b: any) => ({
            coin: b.coin,
            free: b.free,
            frozen: b.frozen,
            total: parseFloat(b.free) + parseFloat(b.frozen),
        }))
        // .filter((b: Balance) => b.total > 0) // SHOW ALL BALANCES FOR DEBUGGING
        .sort((a: Balance, b: Balance) => b.total - a.total);
}

export type Order = {
    orderId: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    type: string;
    price: string;
    size: string;
    filledSize: string;
    filledAmount: string;
    status: string;
    createTime: number;
};

export async function getOpenOrders(symbol: string, creds?: Credentials): Promise<Order[]> {
    const data = await pionexRequest<any>('GET', '/api/v1/trade/openOrders', { symbol }, undefined, creds);
    return data?.data?.orders || [];
}

export async function getAllOrders(
    symbol: string,
    limit: number = 20,
    creds?: Credentials
): Promise<Order[]> {
    const data = await pionexRequest<any>('GET', '/api/v1/trade/allOrders', {
        symbol,
        limit: limit.toString(),
    }, undefined, creds);
    return data?.data?.orders || [];
}

// ===== TRADE EXECUTION =====

export async function placeOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    type: 'MARKET' | 'LIMIT',
    quantity: string, // Changed variable name for clarity
    price?: string,
    creds?: Credentials
): Promise<{ orderId: string }> {
    const params: Record<string, string> = {
        symbol,
        side,
        type,
    };

    if (type === 'LIMIT') {
        params.size = quantity;
        if (price) params.price = price;
    } else {
        // MARKET
        if (side === 'BUY') {
            params.amount = quantity; // Total quote currency
        } else {
            params.size = quantity; // Amount of base currency
        }
    }

    const data = await pionexRequest<any>('POST', '/api/v1/trade/order', params, params, creds);
    return { orderId: data?.data?.orderId };
}

export async function cancelOrder(orderId: string, symbol: string, creds?: Credentials): Promise<boolean> {
    const params = { orderId, symbol };
    await pionexRequest<any>('DELETE', '/api/v1/trade/order', params, params, creds);
    return true;
}
