'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    TrendingUp, DollarSign, Layers, RefreshCw,
    Wifi, WifiOff, Search, AlertTriangle, X, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis,
    ReferenceLine, Tooltip, CartesianGrid, Customized
} from 'recharts';

/* ─── Types ──────────────────────────────────────────────────────────── */
interface Position {
    // L4 canonical fields
    symbol?: string;   // "Strike: $68,500.00"
    side?: string;   // "UP" | "DOWN"
    strategy?: string;
    time?: string;   // pre-formatted string from bot e.g. "02:14"
    entry?: unknown;  // may arrive as number or string
    current?: unknown;
    pnl?: string;   // pre-formatted: "+$1.42" | "-$0.30"
    // legacy aliases (kept for compatibility)
    asset_id?: string;
    id?: string;
    title?: string;
    entry_price?: unknown;
    avg_price?: unknown;
    mark_price?: unknown;
    last_price?: unknown;
    pnl_pct?: unknown;
    pnl_percent?: unknown;
    roi?: unknown;
    slug?: string;
    status?: string;
    timestamp?: string;
    [key: string]: unknown;
}

interface FundStatus {
    status?: string;
    equity: number | null;
    balance: number | null;
    active_count: number | null;
    total_pnl: number | null;
    realized_pnl: number | null;
    unrealized_pnl: number | null;
    positions: Position[];
    reason?: string;
    fetched_at?: number;
    last_heartbeat_time?: number | null;
    last_error?: string | null;
}

interface BotState {
    status?: string;
    last_heartbeat_time?: number | null;
    last_error?: string | null;
    fetched_at?: number;
}

interface WhaleMarket {
    market: string;
    liquidity_usd: number;
    token_id?: string;
}

interface ActiveMarket {
    status: string;           // "LIVE" | "waiting_data" | "no_active_market"
    time_left?: number | null; // seconds remaining
    strike_price?: number | null;
    current_price?: number | null;
    delta?: number | null;
    symbol?: string;
}

/* ─── Constants ──────────────────────────────────────────────────────── */
const POLL_MS = 5_000;
const RADAR_MS = 15_000;
const AM_MS = 1_000;   // active-market: poll every 1s
const HB_ALIVE_SECS = 45;


/* ─── Helpers ────────────────────────────────────────────────────────── */
const usd = (n: number | null, d = 2) =>
    n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

const toNum = (v: unknown): number | null => {
    if (v == null) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
};

// Null-safe price4
const price4 = (v: unknown): string => {
    const n = toNum(v);
    return n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
};

const pnlTextColor = (v: number | null) =>
    v == null ? 'text-gray-500' : v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-500' : 'text-gray-500';

// Derive colour from pre-formatted string "+$1.42"
const pnlStringColor = (s: string | null | undefined): string => {
    if (!s) return 'text-gray-500';
    if (s.startsWith('+')) return 'text-emerald-400';
    if (s.startsWith('-')) return 'text-red-500';
    return 'text-gray-400';
};

const pnlPillFromString = (s: string | null | undefined): string => {
    const base = pnlStringColor(s);
    if (base === 'text-emerald-400') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (base === 'text-red-500') return 'bg-red-500/10 text-red-500 border border-red-500/20';
    return 'bg-white/5 text-gray-500 border border-white/10';
};

const getMarketLabel = (pos: Position): string =>
    pos.symbol ?? pos.title ?? pos.asset_id ?? pos.id ?? pos.slug ?? '—';

const fmtSeconds = (secs: number | null | undefined): string => {
    if (secs == null || secs < 0) return '--:--';
    const s = Math.floor(secs);
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${m}:${ss}`;
};

const statusStyle = (s: string | undefined): { text: string; glow?: string } => {
    switch (s) {
        case 'QUANT_LIVE':
        case 'SCALPING_ACTIVE':
        case 'ONLINE':
            return { text: 'text-emerald-400', glow: 'drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]' };
        case 'PANIC_ACTIVE':
        case 'PANIC':
            return { text: 'text-red-500', glow: 'drop-shadow-[0_0_6px_rgba(239,68,68,0.9)]' };
        case 'STOPPED_DRAWDOWN':
            return { text: 'text-red-400' };
        case 'OFFLINE':
            return { text: 'text-gray-600' };
        default:
            return { text: 'text-yellow-400' };
    }
};

/* ─── HeartbeatLED ───────────────────────────────────────────────────── */
function HeartbeatLED({ alive, delay }: { alive: boolean; delay: number | null }) {
    return (
        <span
            title={alive
                ? `Heartbeat OK — ${delay != null ? Math.floor(delay) + 's ago' : ''}`
                : delay != null ? `Señal perdida (${Math.floor(delay)}s sin heartbeat)` : 'Sin datos de heartbeat'}
            className="relative flex items-center justify-center w-2.5 h-2.5 shrink-0"
        >
            {alive ? (
                <>
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </>
            ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-700" />
            )}
        </span>
    );
}

/* ─── ActiveMarketModule (Recharts) ──────────────────────────────────── */
interface HistoryPoint { time: string; price: number; }

function ActiveMarketModule() {
    const [history, setHistory] = useState<HistoryPoint[]>([]);
    const [current, setCurrent] = useState<number | null>(null);
    const [strike, setStrike] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [amSlug, setAmSlug] = useState<string | null>(null);
    const [amStatus, setAmStatus] = useState<string>('waiting_data');

    // Poll /active-market every 1s — ALL data comes from the backend
    useEffect(() => {
        const poll = async () => {
            try {
                const res = await fetch('/api/fund/active-market', { cache: 'no-store' });
                const json: ActiveMarket = await res.json();

                setAmStatus(json.status ?? 'waiting_data');
                if (json.symbol) setAmSlug(json.symbol);

                if (json.current_price != null) {
                    setCurrent(json.current_price);
                    // Append to rolling 60s chart history
                    const now = new Date();
                    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    setHistory(prev => [...prev.slice(-60), { time: timeStr, price: json.current_price! }]);
                }
                if (json.strike_price != null) setStrike(json.strike_price);
                if (json.time_left != null) setTimeLeft(json.time_left);
            } catch { /* silent */ }
        };
        poll();
        const iv = setInterval(poll, AM_MS);
        return () => clearInterval(iv);
    }, []);

    const delta = current != null && strike != null ? current - strike : 0;
    const aboveStrike = current != null && strike != null && current > strike;

    return (
        <div className="border-b border-white/5 shrink-0">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2">
                <p className="text-[7px] font-bold text-violet-400 uppercase tracking-[0.2em] flex items-center gap-1.5 truncate">
                    <Clock className="h-2.5 w-2.5 shrink-0" />
                    Polymarket Clone · L4 {amSlug ? `// ${amSlug}` : ''}
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 animate-pulse">LIVE</span>
                </div>
            </div>

            {/* Strike focal display — shown always 24/7 */}
            <div className="flex items-baseline justify-between px-4 pb-1">
                <div>
                    <p className="text-[7px] text-gray-600 uppercase tracking-widest font-mono mb-0.5">Strike</p>
                    {strike != null && strike > 0 ? (
                        <p className="text-4xl font-black font-mono tabular-nums text-cyan-300 drop-shadow-[0_0_14px_rgba(103,232,249,0.55)] leading-none">
                            ${strike.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    ) : (
                        <p className="text-lg font-mono text-gray-600 italic animate-pulse leading-none">
                            Fijando Strike Oficial...
                        </p>
                    )}
                </div>
                {/* Big countdown always shown */}
                <div className="text-right">
                    <p className="text-[7px] text-gray-600 uppercase tracking-widest font-mono mb-0.5">Tiempo</p>
                    <p className="text-4xl font-black font-mono tabular-nums text-white leading-none">
                        {fmtSeconds(timeLeft)}
                    </p>
                </div>
            </div>

            <div className="pb-2 space-y-1">
                {/* Countdown + delta row */}
                <div className="flex items-center justify-between px-4">
                    <div>
                        {strike != null && strike > 0 && current != null ? (
                            <p className={`text-[10px] font-mono font-bold ${aboveStrike ? 'text-emerald-400' : 'text-red-400'}`}>
                                {aboveStrike ? '▲' : '▼'} Δ {delta >= 0 ? '+' : ''}{delta.toFixed(2)}
                            </p>
                        ) : (
                            <p className="text-[10px] font-mono text-gray-700">Δ —</p>
                        )}
                    </div>
                </div>

                {/* Recharts line chart */}
                <div className="transition-opacity duration-500">
                    <ResponsiveContainer width="100%" height={110}>
                        <LineChart data={history} margin={{ top: 4, right: 72, left: 4, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="time" tick={false} axisLine={false} tickLine={false} />
                            <YAxis
                                domain={['dataMin - 50', 'dataMax + 50']}
                                tick={{ fontSize: 7, fill: '#4b5563', fontFamily: 'monospace' }}
                                axisLine={false}
                                tickLine={false}
                                tickCount={4}
                                width={68}
                                tickFormatter={(v: number) =>
                                    `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                                }
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#0d0d0d',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 8,
                                    fontSize: 9,
                                    fontFamily: 'monospace',
                                    color: '#e5e7eb',
                                    padding: '4px 8px',
                                }}
                                labelStyle={{ color: '#6b7280', fontSize: 8 }}
                                formatter={(v: number | undefined) => v == null ? ['—', 'Price'] : [
                                    `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                    'Price',
                                ]}
                                cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
                            />
                            {/* Dashed cyan strike line — Polymarket-style */}
                            {strike != null && strike > 0 && (
                                <ReferenceLine
                                    y={strike}
                                    stroke="#22d3ee"
                                    strokeDasharray="6 4"
                                    strokeWidth={1.5}
                                    strokeOpacity={0.6}
                                    label={{
                                        value: `Strike $${strike.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                                        fill: '#22d3ee',
                                        fontSize: 8,
                                        fontFamily: 'monospace',
                                        fontWeight: 'bold',
                                        position: 'insideBottomLeft',
                                    }}
                                />
                            )}
                            {/* Orange price line */}
                            <Line
                                type="monotone"
                                dataKey="price"
                                stroke="#f97316"
                                strokeWidth={1.5}
                                dot={false}
                                activeDot={{ r: 3, fill: '#f97316', stroke: '#0d0d0d', strokeWidth: 1 }}
                                isAnimationActive={false}
                            />
                            {/* ── Current-price live label on right edge ── */}
                            {current != null && history.length > 0 && (
                                <Customized
                                    component={(props: Record<string, unknown>) => {
                                        // Extract recharts internals
                                        const yAxisMap = props.yAxisMap as Record<string, { scale: (v: number) => number }> | undefined;
                                        const offset = props.offset as { left?: number; width?: number; top?: number; height?: number } | undefined;
                                        if (!yAxisMap || !offset) return null;
                                        const yAxis = yAxisMap[0] ?? Object.values(yAxisMap)[0];
                                        if (!yAxis?.scale) return null;
                                        const rawY = yAxis.scale(current);
                                        // Clamp label within plot area
                                        const plotTop = offset.top ?? 0;
                                        const plotH = offset.height ?? 110;
                                        const labelY = Math.max(plotTop + 6, Math.min(plotTop + plotH - 6, rawY));
                                        // X positions for tick + label
                                        const plotRight = (offset.left ?? 0) + (offset.width ?? 0);
                                        const priceStr = `$${current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                        return (
                                            <g>
                                                {/* small horizontal tick connecting orange line to label */}
                                                <line
                                                    x1={plotRight}
                                                    x2={plotRight + 6}
                                                    y1={rawY}
                                                    y2={rawY}
                                                    stroke="#facc15"
                                                    strokeWidth={1}
                                                    strokeOpacity={0.7}
                                                />
                                                {/* glowing dot at live end */}
                                                <circle cx={plotRight} cy={rawY} r={2.5} fill="#facc15" opacity={0.9} />
                                                {/* price text label */}
                                                <text
                                                    x={plotRight + 9}
                                                    y={labelY + 4}
                                                    fill="#facc15"
                                                    fontSize={9}
                                                    fontFamily="monospace"
                                                    fontWeight="bold"
                                                    style={{ filter: 'drop-shadow(0 0 4px rgba(250,204,21,0.7))' }}
                                                >
                                                    {priceStr}
                                                </text>
                                            </g>
                                        );
                                    }}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}


/* ─── RecentTradesLedger ─────────────────────────────────────────────── */
interface Trade {
    date_str?: string;
    action?: string;
    side?: string;
    price_executed?: unknown;
    usd_value?: unknown;
    order_id?: string;
    token?: string;
    is_paper?: boolean;
}

const LEDGER_MS = 5_000;

const tradeActionColor = (action: string | undefined): string => {
    if (!action) return 'text-gray-500';
    const a = action.toUpperCase();
    if (a === 'BUY') return 'text-emerald-400';
    if (a === 'SELL' || a === 'CLOSE') return 'text-red-400';
    return 'text-gray-400';
};

const tradeActionBg = (action: string | undefined): string => {
    if (!action) return '';
    const a = action.toUpperCase();
    if (a === 'BUY') return 'bg-emerald-500/5';
    if (a === 'SELL' || a === 'CLOSE') return 'bg-red-500/5';
    return '';
};

const fmtPrice = (v: unknown, minDecimals = 2, maxDecimals = 4): string => {
    const n = parseFloat(String(v ?? ''));
    if (isNaN(n)) return '—';
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: minDecimals, maximumFractionDigits: maxDecimals })}`;
};

const fmtSide = (s: string | undefined): { label: string; cls: string } => {
    if (!s) return { label: '—', cls: 'text-gray-600' };
    const side = s.toUpperCase();
    const up = side === 'UP' || side === 'BUY';
    const dn = side === 'DOWN' || side === 'SELL';
    return up ? { label: 'UP ▲', cls: 'text-emerald-400' }
        : dn ? { label: 'DOWN ▼', cls: 'text-red-400' }
            : { label: side, cls: 'text-gray-400' };
};


const PAPER_BASE_EQUITY = 16_423.00;

interface PaperTrade {
    time?: string;
    timestamp?: string;
    side?: string;
    entry_price?: unknown;
    exit_price?: unknown;
    pnl?: number | string | null;
    reason?: string;
    outcome?: string;
    result?: string;
    entry?: unknown;
    exit?: unknown;
    close_price?: unknown;
}

/* ─── PaperTradingLedger ─────────────────────────────────────────────── */
function PaperTradingLedger({ trades, loading }: { trades: PaperTrade[]; loading: boolean }) {
    const rows = trades.slice(0, 25);

    return (
        <div className="border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between px-4 py-2 bg-violet-500/5">
                <p className="text-[7px] font-bold text-violet-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <span className="text-[8px]">📋</span>
                    Paper Trading Ledger
                </p>
                {!loading && rows.length > 0 && (
                    <span className="text-[7px] font-mono text-gray-700">{rows.length} ops</span>
                )}
            </div>

            {rows.length > 0 && (
                <div className="grid grid-cols-6 px-4 pb-1">
                    {['Time', 'Side', 'Entry', 'Exit', 'P&L', 'Reason'].map(h => (
                        <p key={h} className={`text-[7px] text-gray-700 uppercase tracking-widest ${h !== 'Time' ? 'text-right' : ''}`}>{h}</p>
                    ))}
                </div>
            )}

            <div className="max-h-[160px] overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="h-2 w-24 bg-white/5 rounded animate-pulse" />
                    </div>
                ) : rows.length === 0 ? (
                    <p className="text-[9px] text-gray-700 italic font-mono px-4 pb-3">
                        Sin operaciones de paper trading...
                    </p>
                ) : (
                    <AnimatePresence initial={false}>
                        {rows.map((t, i) => {
                            const time = t.time ?? t.timestamp ?? '—';
                            const sideInfo = fmtSide(t.side);
                            const entry = t.entry_price ?? t.entry;
                            const exit = t.exit_price ?? t.exit ?? t.close_price;
                            const pnlRaw = t.pnl;
                            const pnlStr = pnlRaw != null ? String(pnlRaw) : '—';
                            const reasonText = t.reason ?? t.outcome ?? '—';

                            const isWin = pnlStr.includes('+') || (typeof pnlRaw === 'number' && pnlRaw > 0);
                            const isLoss = pnlStr.includes('-') || (typeof pnlRaw === 'number' && pnlRaw < 0);
                            let pnlClass = 'text-gray-500';
                            if (isWin) pnlClass = 'text-emerald-400 bg-emerald-500/10';
                            if (isLoss) pnlClass = 'text-red-400 bg-red-500/10';

                            return (
                                <motion.div
                                    key={`paper-${i}-${time}`}
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.18, delay: i * 0.02 }}
                                    className="grid grid-cols-6 px-4 py-1.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors gap-2"
                                >
                                    <p className="text-[8px] font-mono text-gray-500 tabular-nums truncate pr-1">{time}</p>
                                    <p className={`text-[8px] font-mono font-bold text-right ${sideInfo.cls}`}>{sideInfo.label}</p>
                                    <p className="text-[8px] font-mono text-gray-400 text-right tabular-nums">{fmtPrice(entry, 2, 4)}</p>
                                    <p className="text-[8px] font-mono text-gray-400 text-right tabular-nums">{fmtPrice(exit, 2, 4)}</p>
                                    <div className="flex justify-end">
                                        <span className={`text-[8px] font-mono font-bold text-right tabular-nums px-1 rounded ${pnlClass}`}>
                                            {typeof pnlRaw === 'number' ? `${pnlRaw >= 0 ? '+' : ''}$${pnlRaw.toFixed(2)}` : pnlStr}
                                        </span>
                                    </div>
                                    <p title={reasonText} className="text-[7px] font-mono text-violet-400/80 text-right truncate pl-1 cursor-default">
                                        {reasonText.length > 20 ? reasonText.slice(0, 20) + '…' : reasonText}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

/* ─── LiveTradesLedger (Symmetric with Paper) ──────────────────────────── */
interface LiveTrade {
    date_str?: string;
    time?: string;
    timestamp?: string;
    action?: string;
    side?: string;
    entry_price?: unknown;
    exit_price?: unknown;
    price_executed?: unknown;
    usd_value?: unknown;
    pnl?: number | string | null;
    order_id?: string;
    token?: string;
    token_id?: string;
    entry?: unknown;
    exit?: unknown;
    reason?: string;
}

function LiveTradesLedger() {
    const [trades, setTrades] = useState<LiveTrade[]>([]);
    const [realStatus, setRealStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetch_ = useCallback(async () => {
        try {
            const [resTrades, resStatus] = await Promise.all([
                fetch('/api/fund/live-trades', { cache: 'no-store' }),
                fetch('/api/fund/real-status', { cache: 'no-store' })
            ]);
            const jsonTrades = await resTrades.json();
            const jsonStatus = await resStatus.json();
            setTrades(Array.isArray(jsonTrades.trades) ? jsonTrades.trades : []);
            setRealStatus(jsonStatus);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetch_();
        ivRef.current = setInterval(fetch_, LEDGER_MS);
        return () => { if (ivRef.current) clearInterval(ivRef.current); };
    }, [fetch_]);

    const rows = trades.slice(0, 20);

    const makeContractUrl = (t: LiveTrade): string | null => {
        const id = t.token_id ?? t.order_id ?? t.token;
        if (!id) return null;
        // If it looks like a hex hash, link to Polygonscan
        if (id.startsWith('0x')) return `https://polygonscan.com/tx/${id}`;
        // Otherwise link to Polymarket
        return `https://polymarket.com/event/${id}`;
    };

    return (
        <div className="border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between px-4 py-2 bg-emerald-500/5">
                <p className="text-[7px] font-bold text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <span className="text-[8px]">🔥</span>
                    LIVE REAL TRADES
                    {realStatus && realStatus.status && realStatus.status !== 'OFFLINE' && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[7px]">
                            {realStatus.status}
                        </span>
                    )}
                </p>
                {!loading && rows.length > 0 && (
                    <span className="text-[7px] font-mono text-emerald-700">{rows.length} ops</span>
                )}
            </div>

            {rows.length > 0 && (
                <div className="grid grid-cols-6 px-4 pb-1">
                    {['Time', 'Side', 'Entry', 'Exit', 'P&L', 'Contrato'].map(h => (
                        <p key={h} className={`text-[7px] text-gray-700 uppercase tracking-widest ${h !== 'Time' ? 'text-right' : ''}`}>{h}</p>
                    ))}
                </div>
            )}

            <div className="max-h-[160px] overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="h-2 w-24 bg-white/5 rounded animate-pulse" />
                    </div>
                ) : rows.length === 0 ? (
                    <p className="text-[9px] text-gray-700 italic font-mono px-4 pb-3">
                        Sin operaciones LIVE recientes...
                    </p>
                ) : (
                    <AnimatePresence initial={false}>
                        {rows.map((t, i) => {
                            const time = t.date_str ?? t.time ?? t.timestamp ?? '—';
                            const sideInfo = fmtSide(t.side);
                            const entry = t.entry_price ?? t.entry ?? t.price_executed;
                            const exit = t.exit_price ?? t.exit;
                            const pnlRaw = t.pnl;
                            const pnlStr = pnlRaw != null ? String(pnlRaw) : '—';
                            const contractUrl = makeContractUrl(t);
                            const contractLabel = t.token_id?.slice(0, 10) ?? t.order_id?.slice(0, 10) ?? t.token?.slice(0, 10) ?? '—';

                            const isWin = pnlStr.includes('+') || (typeof pnlRaw === 'number' && pnlRaw > 0);
                            const isLoss = pnlStr.includes('-') || (typeof pnlRaw === 'number' && pnlRaw < 0);
                            let pnlClass = 'text-gray-500';
                            if (isWin) pnlClass = 'text-emerald-400 bg-emerald-500/10';
                            if (isLoss) pnlClass = 'text-red-400 bg-red-500/10';

                            return (
                                <motion.div
                                    key={`live-${t.order_id ?? i}-${i}`}
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.18, delay: i * 0.02 }}
                                    className="grid grid-cols-6 px-4 py-1.5 border-b border-emerald-500/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors gap-2"
                                >
                                    <p className="text-[8px] font-mono text-emerald-500/50 tabular-nums truncate pr-1">{time}</p>
                                    <p className={`text-[8px] font-mono font-bold text-right ${sideInfo.cls}`}>{sideInfo.label}</p>
                                    <p className="text-[8px] font-mono text-gray-400 text-right tabular-nums">{fmtPrice(entry, 2, 4)}</p>
                                    <p className="text-[8px] font-mono text-gray-400 text-right tabular-nums">{fmtPrice(exit, 2, 4)}</p>
                                    <div className="flex justify-end">
                                        <span className={`text-[8px] font-mono font-bold text-right tabular-nums px-1 rounded ${pnlClass}`}>
                                            {typeof pnlRaw === 'number' ? `${pnlRaw >= 0 ? '+' : ''}$${pnlRaw.toFixed(2)}` : pnlStr}
                                        </span>
                                    </div>
                                    {contractUrl ? (
                                        <a
                                            href={contractUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[7px] font-mono text-cyan-400 hover:text-cyan-300 text-right truncate pl-1 underline decoration-dotted underline-offset-2 transition-colors"
                                            title={t.token_id ?? t.order_id ?? ''}
                                        >
                                            {contractLabel}…
                                        </a>
                                    ) : (
                                        <p className="text-[7px] font-mono text-emerald-400/60 text-right truncate pl-1">—</p>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

/* ─── Panic Modal ────────────────────────────────────────────────────── */
function PanicModal({ onConfirm, onCancel, loading }: {
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#0f0f0f] border border-red-500/40 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(239,68,68,0.2)]"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-red-400 tracking-wide">EMERGENCY STOP</h3>
                        <p className="text-[9px] text-gray-600 uppercase tracking-widest">acción irreversible</p>
                    </div>
                    <button onClick={onCancel} className="ml-auto text-gray-700 hover:text-gray-400 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed mb-5">
                    ¿Confirmas la <span className="text-red-400 font-semibold">liquidación inmediata</span> de todas las posiciones?
                    Esta operación no puede deshacerse.
                </p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-[10px] font-bold text-gray-400 border border-white/10 hover:bg-white/5 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 py-2 rounded-xl text-[10px] font-bold text-black bg-red-500 hover:bg-red-400 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-60"
                    >
                        {loading ? 'Enviando…' : '⚡ CONFIRMAR STOP'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

/* ─── P&L accumulator helper ─────────────────────────────────────────── */
function sumPaperPnl(trades: PaperTrade[]): number {
    return trades.reduce((acc, t) => {
        const raw = t.pnl;
        if (raw == null) return acc;
        let n: number;
        if (typeof raw === 'number') n = raw;
        else {
            const cleaned = String(raw).replace(/[^\d.\-+]/g, '');
            n = parseFloat(cleaned);
        }
        return isNaN(n) ? acc : acc + n;
    }, 0);
}

/* ─── Main Widget ────────────────────────────────────────────────────── */
export default function PolymarketFundWidget() {
    const [data, setData] = useState<FundStatus | null>(null);
    const [botState, setBotState] = useState<BotState | null>(null);
    const [whaleMarkets, setWhaleMarkets] = useState<WhaleMarket[]>([]);
    const [paperTrades, setPaperTrades] = useState<PaperTrade[]>([]);
    const [paperLoading, setPaperLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [offline, setOffline] = useState(false);

    const [showPanicModal, setShowPanicModal] = useState(false);
    const [panicLoading, setPanicLoading] = useState(false);
    const [panicResult, setPanicResult] = useState<'ok' | 'err' | null>(null);

    const [now, setNow] = useState<number>(Date.now());
    useEffect(() => {
        const iv = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(iv);
    }, []);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/fund/status', { cache: 'no-store' });
            const json = await res.json();
            setData(json);
            setOffline(json.status === 'OFFLINE');
            setLastUpdated(new Date());
        } catch { setOffline(true); }
        finally { setLoading(false); }
    }, []);

    const fetchBotState = useCallback(async () => {
        try {
            const res = await fetch('/api/fund/bot-state', { cache: 'no-store' });
            const json = await res.json();
            setBotState(json);
        } catch { /* silent */ }
    }, []);

    const fetchSmartMoney = useCallback(async () => {
        try {
            const res = await fetch('/api/fund/smart-money', { cache: 'no-store' });
            const json = await res.json();
            if (Array.isArray(json.active_whale_markets)) setWhaleMarkets(json.active_whale_markets);
        } catch { /* silent */ }
    }, []);

    // Lifted: fetch paper trades at widget level so equity flows to top metrics
    const fetchPaperTrades = useCallback(async () => {
        try {
            const res = await fetch('/api/fund/paper-trades', { cache: 'no-store' });
            const json = await res.json();
            setPaperTrades(Array.isArray(json.trades) ? json.trades : []);
        } catch { /* silent */ }
        finally { setPaperLoading(false); }
    }, []);

    useEffect(() => {
        fetchStatus(); fetchBotState(); fetchSmartMoney(); fetchPaperTrades();
        const ivS = setInterval(fetchStatus, POLL_MS);
        const ivB = setInterval(fetchBotState, POLL_MS);
        const ivR = setInterval(fetchSmartMoney, RADAR_MS);
        const ivP = setInterval(fetchPaperTrades, LEDGER_MS);
        return () => { clearInterval(ivS); clearInterval(ivB); clearInterval(ivR); clearInterval(ivP); };
    }, [fetchStatus, fetchBotState, fetchSmartMoney, fetchPaperTrades]);

    const handlePanicConfirm = async () => {
        setPanicLoading(true);
        try {
            await fetch('/api/fund/panic', { method: 'POST' });
            setPanicResult('ok');
            fetchStatus();
            setTimeout(fetchStatus, 1500);
        } catch { setPanicResult('err'); }
        finally {
            setPanicLoading(false);
            setTimeout(() => { setShowPanicModal(false); setPanicResult(null); }, 2500);
        }
    };

    /* Derived — Lifted paper equity */
    const paperNetPnl = sumPaperPnl(paperTrades);
    const paperEquity = PAPER_BASE_EQUITY + paperNetPnl;

    const isPanic = data?.status === 'PANIC_ACTIVE' || botState?.status === 'PANIC';
    const isDrawdown = data?.status === 'STOPPED_DRAWDOWN' || botState?.status === 'STOPPED_DRAWDOWN';
    const isOnline = !offline && data?.status !== 'OFFLINE';
    const positions = Array.isArray(data?.positions) ? data.positions : [];
    const totalPnl = paperNetPnl;
    const lastHb = data?.last_heartbeat_time ?? botState?.last_heartbeat_time;
    const hbDelay = lastHb != null ? (Date.now() / 1000) - lastHb : null;
    const hbAlive = hbDelay != null && hbDelay < HB_ALIVE_SECS;
    const lastError = data?.last_error ?? botState?.last_error;
    const hasError = lastError && lastError !== 'None' && lastError !== 'none';
    const displayStatus = botState?.status && botState.status !== 'OFFLINE'
        ? botState.status : data?.status ?? '—';
    const ss = statusStyle(displayStatus);

    const borderClass = isPanic
        ? 'border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.25)] animate-pulse'
        : isDrawdown
            ? 'border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.1)]'
            : 'border-white/10';

    // 7-column table headers
    const TABLE_HEADERS = ['Market', 'Side', 'Estrategia', 'Tiempo', 'Entry', 'Current', 'P&L ($)'];

    return (
        <>
            <AnimatePresence>
                {showPanicModal && (
                    <PanicModal
                        onConfirm={handlePanicConfirm}
                        onCancel={() => setShowPanicModal(false)}
                        loading={panicLoading}
                    />
                )}
            </AnimatePresence>

            <div className={`bg-black/40 border ${borderClass} rounded-2xl backdrop-blur-sm overflow-hidden flex flex-col transition-all duration-500`}>

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isPanic ? 'bg-red-500/20 border border-red-500/30' : 'bg-violet-500/20 border border-violet-500/30'}`}>
                            {isPanic
                                ? <AlertTriangle className="h-4 w-4 text-red-400" />
                                : <TrendingUp className="h-4 w-4 text-violet-400" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-white tracking-wide">Polymarket Quant Fund</h3>
                                <HeartbeatLED alive={hbAlive} delay={hbDelay} />
                            </div>
                            <p className="text-[9px] text-gray-600 tracking-[0.2em] uppercase">prediction markets · live</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <AnimatePresence mode="wait">
                            {!loading && (
                                <motion.div
                                    key={isOnline ? 'on' : 'off'}
                                    initial={{ opacity: 0, scale: 0.88 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.88 }}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold tracking-widest ${isPanic
                                        ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                                        : isOnline
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                            : 'bg-red-500/10 border-red-500/30 text-red-400'}`}
                                >
                                    {isPanic
                                        ? <><AlertTriangle className="h-2.5 w-2.5" />PANIC</>
                                        : isOnline
                                            ? <><Wifi className="h-2.5 w-2.5" />ONLINE</>
                                            : <><WifiOff className="h-2.5 w-2.5" />OFFLINE</>}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={() => setShowPanicModal(true)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black tracking-widest text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/60 hover:shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all duration-200"
                        >
                            ⚡ EMERGENCY STOP
                        </button>

                        <button onClick={() => { fetchStatus(); fetchBotState(); }} title="Actualizar" className="text-white/25 hover:text-white/70 transition-colors">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* ── Yellow error banner ─────────────────────────────── */}
                <AnimatePresence>
                    {hasError && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex items-start gap-2 px-5 py-2.5 bg-yellow-500/10 border-b border-yellow-500/20">
                                <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-mono text-yellow-300 break-all leading-relaxed">
                                    <span className="text-yellow-500 font-bold uppercase tracking-wider">error: </span>
                                    {lastError}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {offline ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 shrink-0">
                        <WifiOff className="h-8 w-8 text-red-500/30" />
                        <p className="text-sm text-red-400/60 font-medium">Servidor inaccesible</p>
                        {data?.reason && <p className="text-[10px] text-gray-700 font-mono">{data.reason}</p>}
                        {lastUpdated && <p className="text-[9px] text-gray-700">Último contacto: {lastUpdated.toLocaleTimeString('es-ES')}</p>}
                    </div>
                ) : (
                    <>
                        {/* ── Equity + Total P&L ─────────────────────── */}
                        <div className="px-5 pt-4 pb-4 border-b border-white/5 flex items-end justify-between gap-4 shrink-0">
                            <div>
                                <p className="text-[8px] text-gray-600 uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5">
                                    <TrendingUp className="h-2.5 w-2.5 text-violet-500" /> Equity
                                </p>
                                {loading && !data && paperLoading
                                    ? <div className="h-8 w-40 rounded-lg bg-white/5 animate-pulse" />
                                    : <motion.p
                                        key={paperEquity}
                                        initial={{ opacity: 0.6 }}
                                        animate={{ opacity: 1 }}
                                        className="text-3xl font-black font-mono text-white tracking-tight leading-none"
                                    >
                                        ${usd(paperEquity)}
                                    </motion.p>
                                }
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                                <p className="text-[8px] text-gray-600 uppercase tracking-[0.2em] mb-1">Total P&L</p>
                                {loading && !data
                                    ? <div className="h-6 w-20 rounded bg-white/5 animate-pulse" />
                                    : <AnimatePresence mode="wait">
                                        <motion.p
                                            key={totalPnl}
                                            initial={{ opacity: 0, y: 3 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`text-xl font-bold font-mono ${pnlTextColor(totalPnl)}`}
                                        >
                                            {totalPnl == null ? '—' : `${totalPnl >= 0 ? '+' : ''}$${usd(totalPnl)}`}
                                        </motion.p>
                                    </AnimatePresence>
                                }
                            </div>
                        </div>

                        {/* ── Sub-metrics ────────────────────────────── */}
                        <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5 shrink-0">
                            <div className="px-4 py-3">
                                <p className="text-[8px] text-gray-600 uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                                    <DollarSign className="h-2.5 w-2.5 text-sky-400" /> Cash Available
                                </p>
                                {loading && paperLoading
                                    ? <div className="h-5 w-20 rounded bg-white/5 animate-pulse" />
                                    : <p className="text-sm font-bold font-mono text-sky-300">${usd(paperEquity)}</p>
                                }
                            </div>
                            <div className="px-4 py-3">
                                <p className="text-[8px] text-gray-600 uppercase tracking-[0.2em] mb-1">Realized P&L</p>
                                {loading && paperLoading
                                    ? <div className="h-5 w-16 rounded bg-white/5 animate-pulse" />
                                    : <p className={`text-sm font-bold font-mono ${pnlTextColor(paperNetPnl)}`}>
                                        {`${paperNetPnl >= 0 ? '+' : ''}$${usd(paperNetPnl)}`}
                                    </p>
                                }
                            </div>
                            <div className="px-4 py-3">
                                <p className="text-[8px] text-gray-600 uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                                    <Layers className="h-2.5 w-2.5 text-amber-400" /> Unrealized
                                </p>
                                {loading && !data
                                    ? <div className="h-5 w-16 rounded bg-white/5 animate-pulse" />
                                    : <div className="flex items-baseline gap-2">
                                        <p className={`text-sm font-bold font-mono ${pnlTextColor(data?.unrealized_pnl ?? null)}`}>
                                            {data?.unrealized_pnl != null ? `${data.unrealized_pnl >= 0 ? '+' : ''}$${usd(data.unrealized_pnl)}` : '—'}
                                        </p>
                                        {data?.active_count != null && (
                                            <span className="text-[8px] text-amber-500/60 font-mono">({data.active_count} pos)</span>
                                        )}
                                    </div>
                                }
                            </div>
                        </div>

                        {/* ── Active Market Module (L4) ───────────────── */}
                        <ActiveMarketModule />

                        {/* ── Position table header ──────────────────── */}
                        <div className="grid grid-cols-7 px-4 py-2 border-b border-white/[0.06] shrink-0">
                            {TABLE_HEADERS.map(h => (
                                <p key={h} className={`text-[7px] text-gray-600 uppercase tracking-widest ${h !== 'Market' ? 'text-right' : ''}`}>{h}</p>
                            ))}
                        </div>

                        {/* ── Scrollable rows ─────────────────────────── */}
                        <div className="overflow-y-auto flex-1" style={{ minHeight: '60px', maxHeight: '180px' }}>
                            {loading && positions.length === 0 ? (
                                <div className="flex items-center justify-center py-6">
                                    <div className="h-3 w-28 bg-white/5 rounded animate-pulse" />
                                </div>
                            ) : positions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-2 py-6">
                                    <Search className="h-6 w-6 text-violet-500/30" />
                                    <p className="text-[10px] text-gray-600 italic tracking-wide">Buscando oportunidades de alta liquidez...</p>
                                </div>
                            ) : (
                                positions.map((pos, i) => {
                                    const label = getMarketLabel(pos);
                                    const side = pos.side ?? '';
                                    const isUp = side.toUpperCase() === 'UP';
                                    const isDown = side.toUpperCase() === 'DOWN';
                                    const tiempo = pos.time ?? pos.timestamp ?? '—';
                                    const entryN = toNum(pos.entry ?? pos.entry_price ?? pos.avg_price);
                                    const currN = toNum(pos.current ?? pos.mark_price ?? pos.last_price);
                                    const pnlStr = pos.pnl as string | null | undefined;
                                    const strategy = pos.strategy ?? '';
                                    const strategyColor = strategy.includes('WHALE') ? 'text-blue-400'
                                        : strategy.includes('FLASH_CRASH') ? 'text-orange-400'
                                            : strategy.includes('SCALP') ? 'text-cyan-400'
                                                : strategy.includes('HEDGE') ? 'text-purple-400'
                                                    : strategy.includes('YIELD') ? 'text-emerald-400'
                                                        : 'text-gray-500';

                                    return (
                                        <div
                                            key={String(pos.asset_id ?? pos.id ?? pos.symbol ?? '') + i}
                                            className="grid grid-cols-7 px-4 py-2 border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors group"
                                        >
                                            {/* Market */}
                                            <p title={label} className="text-[9px] font-mono text-gray-400 group-hover:text-gray-200 transition-colors truncate pr-1 cursor-default">
                                                {label.length > 22 ? label.slice(0, 22) + '…' : label}
                                            </p>
                                            {/* Side */}
                                            <p className={`text-[9px] font-mono font-bold text-right ${isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-gray-600'}`}>
                                                {isUp ? 'UP 📈' : isDown ? 'DOWN 📉' : side || '—'}
                                            </p>
                                            {/* Estrategia */}
                                            <p title={strategy} className={`text-[8px] font-mono text-right truncate pr-1 ${strategyColor}`}>
                                                {strategy || '—'}
                                            </p>
                                            {/* Tiempo */}
                                            <p className="text-[9px] font-mono text-gray-500 text-right tabular-nums">
                                                {tiempo}
                                            </p>
                                            {/* Entry */}
                                            <p className="text-[9px] font-mono text-gray-500 text-right">{price4(entryN)}</p>
                                            {/* Current */}
                                            <p className={`text-[9px] font-mono text-right font-medium ${pnlTextColor(currN != null && entryN != null ? currN - entryN : null)}`}>
                                                {price4(currN)}
                                            </p>
                                            {/* P&L ($) */}
                                            <div className="flex justify-end">
                                                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md ${pnlPillFromString(pnlStr)}`}>
                                                    {pnlStr ?? '—'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}

                {/* ── Paper Trading Ledger (Simulation) ────────────────── */}
                <PaperTradingLedger trades={paperTrades} loading={paperLoading} />



                {/* ── Live Real Trades Ledger ───────────────────── */}
                <LiveTradesLedger />

                {/* ── Footer / Status Console ─────────────────────────── */}
                <div className="px-5 py-2 border-t border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] text-gray-700 font-mono">sys:</span>
                        <span className={`text-[8px] font-mono font-bold tracking-widest uppercase ${ss.text} ${ss.glow ?? ''}`}>
                            {displayStatus}
                        </span>
                        {hasError && (
                            <span title={lastError!} className="cursor-help text-[9px] text-orange-400 hover:text-orange-300 transition-colors" aria-label={`Error: ${lastError}`}>
                                ⚠️
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] text-gray-700 font-mono">5s poll</span>
                        {lastUpdated && (
                            <span className="text-[8px] text-gray-700 font-mono">
                                act. {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
