// lib/gemini-money-line.ts
// Port of "Gemini Money Line - Replica Exacta (Gap Protocol)" Pine Script to TypeScript

import type { Candle } from './pionex-client';

export type MoneyLinePoint = {
    time: number;
    value: number | null; // null = gap (flip)
    trend: 1 | -1;
};

export type MoneyLineLabel = {
    time: number;
    price: number;
    type: 'bullish' | 'bearish';
};

export type CloudPoint = {
    time: number;
    upper: number;
    lower: number;
    trend: 1 | -1;
};

export type MoneyLineResult = {
    line: MoneyLinePoint[];
    labels: MoneyLineLabel[];
    cloud: CloudPoint[];
    flipLevel: number | null;
    currentTrend: 1 | -1;
};

// ATR calibration factors per asset
const FACTORS: Record<string, number> = {
    BTC: 3.0036,
    BNB: 2.0267,
    SOL: 2.0127,
};
const DEFAULT_FACTOR = 3.0;
const ATR_PERIOD = 10;

/**
 * Calculate True Range for a candle
 */
function trueRange(candle: Candle, prevClose: number): number {
    const raw = Math.max(
        candle.high - candle.low,
        Math.abs(candle.high - prevClose),
        Math.abs(candle.low - prevClose)
    );

    // CAP TR at 10% of price to prevent cloud explosions on bad data
    const maxTR = prevClose * 0.10;
    return Math.min(raw, maxTR);
}

/**
 * Calculate ATR (Average True Range) using SMA
 */
function calculateATR(candles: Candle[], period: number): number[] {
    const tr: number[] = [];
    const atr: number[] = [];

    for (let i = 0; i < candles.length; i++) {
        if (i === 0) {
            tr.push(candles[i].high - candles[i].low);
        } else {
            tr.push(trueRange(candles[i], candles[i - 1].close));
        }

        if (i < period - 1) {
            atr.push(0);
        } else if (i === period - 1) {
            const sum = tr.slice(0, period).reduce((a, b) => a + b, 0);
            atr.push(sum / period);
        } else {
            // RMA-style (Wilder's smoothing) like Pine Script ta.atr
            atr.push((atr[atr.length - 1] * (period - 1) + tr[i]) / period);
        }
    }

    return atr;
}

/**
 * Get factor for a symbol
 */
function getFactor(symbol: string): number {
    const base = symbol.replace('_USDT', '').replace('/USDT', '').toUpperCase();
    return FACTORS[base] || DEFAULT_FACTOR;
}

/**
 * Calculate Gemini Money Line indicator
 * Exact replica of the Pine Script logic
 */
export function calculateGeminiMoneyLine(
    candles: Candle[],
    symbol: string
): MoneyLineResult {
    const factor = getFactor(symbol);
    const atrValues = calculateATR(candles, ATR_PERIOD);

    const line: MoneyLinePoint[] = [];
    const labels: MoneyLineLabel[] = [];
    const cloud: CloudPoint[] = [];

    let trendUp = 0;
    let trendDown = 0;
    let trend = 1 as 1 | -1;

    for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        const atr = atrValues[i];

        if (atr === 0 || i < ATR_PERIOD) {
            line.push({ time: c.time, value: null, trend: 1 });
            continue;
        }

        const src = (c.high + c.low) / 2; // hl2
        const up = src - factor * atr;
        const dn = src + factor * atr;

        const prevTrend = trend;
        const prevClose = i > 0 ? candles[i - 1].close : c.close;

        // TrendUp: if prevClose > prevTrendUp, use max(up, prevTrendUp), else up
        trendUp = prevClose > trendUp ? Math.max(up, trendUp) : up;

        // TrendDown: if prevClose < prevTrendDown, use min(dn, prevTrendDown), else dn
        trendDown = prevClose < trendDown ? Math.min(dn, trendDown) : dn;

        // Trend determination
        if (c.close > trendDown) {
            trend = 1;
        } else if (c.close < trendUp) {
            trend = -1;
        }

        const tsl = trend === 1 ? trendUp : trendDown;
        const isFlip = trend !== prevTrend && i > ATR_PERIOD;

        // Gap Protocol: null during flip
        line.push({
            time: c.time,
            value: isFlip ? null : tsl,
            trend,
        });

        // Cloud
        if (!isFlip) {
            cloud.push({
                time: c.time,
                upper: trend === 1 ? c.high : tsl,
                lower: trend === 1 ? tsl : c.low,
                trend,
            });
        }

        // Labels on flip
        if (isFlip) {
            const offset = atr * 3.0;
            labels.push({
                time: c.time,
                price: trend === 1 ? c.low - offset : c.high + offset,
                type: trend === 1 ? 'bullish' : 'bearish',
            });
        }
    }

    // Flip level = last valid tsl
    const lastValid = line.filter(l => l.value !== null);
    const flipLevel = lastValid.length > 0 ? lastValid[lastValid.length - 1].value : null;

    return {
        line,
        labels,
        cloud,
        flipLevel,
        currentTrend: trend,
    };
}
