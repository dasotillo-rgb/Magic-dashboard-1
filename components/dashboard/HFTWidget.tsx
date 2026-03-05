'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, ArrowUpRight, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

// Formatting utilities
const fmtUsd = (val: number | undefined | null) =>
    val == null ? "—" : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);
const fmt = (n: number | undefined | null, d = 2) =>
    (n != null ? Number(n).toFixed(d) : "—");

type PricePoint = { price: number; strike: number; time: number };

export default function HFTWidget() {
    const [data, setData] = useState<{
        market: any;
        health: any;
        metrics: any;
        real_status: any;
    } | null>(null);
    const [trades, setTrades] = useState<any[]>([]);
    const [connected, setConnected] = useState(false);
    const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
    const busy = useRef(false);

    const getUrl = useCallback((path: string) => {
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        return isHttps
            ? `/api/hft-proxy?path=${path}`
            : `http://51.21.170.68:5001${path}`;
    }, []);

    const fetchAll = useCallback(async () => {
        if (busy.current) return;
        busy.current = true;
        try {
            const [allRes, tradesRes] = await Promise.all([
                fetch(getUrl('/api/all'), { signal: AbortSignal.timeout(6000), headers: { "Content-Type": "application/json" } }),
                fetch(getUrl('/api/paper-trades'), { signal: AbortSignal.timeout(6000), headers: { "Content-Type": "application/json" } }).catch(() => null),
            ]);

            if (!allRes.ok) { setConnected(false); busy.current = false; return; }

            const d = await allRes.json();
            if (d) {
                setData(d);
                setConnected(true);

                // Track price history for sparkline
                if (d.market?.current_price && d.market?.strike_price) {
                    setPriceHistory(prev => {
                        const next = [...prev, { price: d.market.current_price, strike: d.market.strike_price, time: Date.now() }];
                        return next.length > 60 ? next.slice(-60) : next; // Keep last 60 points (5 min at 5s interval)
                    });
                }
            } else {
                setConnected(false);
            }

            // Parse trades
            if (tradesRes && tradesRes.ok) {
                const td = await tradesRes.json();
                const tradeList = Array.isArray(td) ? td : td?.trades || td?.paper_trades || [];
                setTrades(tradeList.slice(-5).reverse()); // Last 5, most recent first
            }
        } catch (err) {
            setConnected(false);
        }
        busy.current = false;
    }, [getUrl]);

    useEffect(() => {
        fetchAll();
        const iv = setInterval(fetchAll, 5000);
        return () => clearInterval(iv);
    }, [fetchAll]);

    const isLive = data?.market?.status === "LIVE";
    const market = data?.market;
    const metrics = data?.metrics;

    // SVG Sparkline renderer
    const renderSparkline = () => {
        if (priceHistory.length < 2) return null;
        const W = 320, H = 48;
        const prices = priceHistory.map(p => p.price);
        const strikes = priceHistory.map(p => p.strike);
        const allVals = [...prices, ...strikes];
        const min = Math.min(...allVals);
        const max = Math.max(...allVals);
        const range = max - min || 1;
        const pad = 2;

        const toY = (v: number) => pad + (1 - (v - min) / range) * (H - pad * 2);
        const toX = (i: number) => (i / (priceHistory.length - 1)) * W;

        const pricePath = prices.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
        const strikePath = strikes.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

        return (
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00FF41" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#00FF41" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Price fill area */}
                <path d={`${pricePath} L${W},${H} L0,${H} Z`} fill="url(#priceGrad)" />
                {/* Strike dashed line */}
                <path d={strikePath} fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
                {/* Price solid line */}
                <path d={pricePath} fill="none" stroke="#00FF41" strokeWidth="1.5" />
                {/* Current price dot */}
                <circle cx={W} cy={toY(prices[prices.length - 1])} r="2.5" fill="#00FF41" />
            </svg>
        );
    };

    return (
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 lg:p-6 flex flex-col h-full shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:border-[#3F3F46] transition-colors relative overflow-hidden group">
            {/* Background Effect */}
            <div className="absolute top-0 right-0 p-32 bg-[#00FF41]/5 rounded-full blur-[100px] -mr-16 -mt-16 pointer-events-none group-hover:bg-[#00FF41]/10 transition-colors duration-500" />

            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00FF41]/10 border border-[#00FF41]/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,255,65,0.15)]">
                        <Activity className="h-5 w-5 text-[#00FF41]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                            HFT Engine V2
                            <div className="flex space-x-1">
                                <motion.div animate={{ height: [4, 12, 4] }} transition={{ duration: 1, repeat: Infinity }} className="w-1 bg-[#00FF41] rounded-full" />
                                <motion.div animate={{ height: [8, 4, 8] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1 bg-[#00FF41] rounded-full" />
                                <motion.div animate={{ height: [4, 16, 4] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1 bg-[#00FF41] rounded-full" />
                            </div>
                        </h3>
                        {market?.slug ? (
                            <p className="text-xs text-gray-400 font-mono mt-0.5 truncate max-w-[180px] sm:max-w-xs">{market.slug}</p>
                        ) : (
                            <p className="text-xs text-gray-400 font-medium">Polymarket BTC 5min Binary Options</p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-[10px] font-black tracking-widest uppercase ${connected ? 'bg-[#00FF41]/10 border-[#00FF41]/30 text-[#00FF41]' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#00FF41] animate-pulse shadow-[0_0_8px_rgba(0,255,65,0.8)]' : 'bg-red-500'}`} />
                        {connected ? 'CONNECTED' : 'OFFLINE'}
                    </div>
                    {data?.real_status?.status === 'OPEN' && (
                        <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            POSITION OPEN
                        </span>
                    )}
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-3 flex flex-col justify-center relative overflow-hidden">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total PnL</div>
                    <div className={`text-xl font-black font-mono tracking-tight ${(metrics?.total_pnl ?? 0) >= 0 ? 'text-[#00FF41]' : 'text-red-500'}`}>
                        {metrics ? fmtUsd(metrics.total_pnl) : "$0.00"}
                    </div>
                    {(metrics?.total_pnl ?? 0) >= 0 && (
                        <div className="absolute top-2 right-2 flex scale-75 opacity-20">
                            <ArrowUpRight className="h-6 w-6 text-[#00FF41]" />
                        </div>
                    )}
                </div>
                <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-3 flex flex-col justify-center">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Trades</div>
                    <div className="text-xl font-black text-white font-mono tracking-tight">
                        {metrics?.total_trades || 0}
                    </div>
                </div>
            </div>

            {/* BTC Price vs Strike Sparkline */}
            {isLive && market && (
                <div className="relative z-10 mb-4">
                    <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-3 overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">BTC</div>
                                    <div className="text-sm font-black text-white font-mono">{fmtUsd(market.current_price)}</div>
                                </div>
                                <div className="h-6 w-px bg-[#27272A]" />
                                <div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Strike</div>
                                    <div className="text-sm font-bold text-amber-400 font-mono">{fmtUsd(market.strike_price)}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Delta</div>
                                <div className={`text-sm font-black font-mono ${market.delta > 0 ? "text-[#00FF41]" : "text-red-500"}`}>
                                    {market.delta > 0 ? "+" : ""}{fmt(market.delta)}
                                </div>
                            </div>
                        </div>
                        {/* Sparkline */}
                        <div className="mt-1">
                            {renderSparkline() || (
                                <div className="h-12 flex items-center justify-center text-[10px] text-gray-600 italic">
                                    Cargando timeline...
                                </div>
                            )}
                        </div>
                        {/* Legend */}
                        <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-[2px] bg-[#00FF41] rounded" />
                                <span className="text-[8px] text-gray-500 font-medium">BTC Price</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-[2px] bg-amber-500 rounded" style={{ borderTop: '1px dashed #F59E0B' }} />
                                <span className="text-[8px] text-gray-500 font-medium">Strike</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Waiting state when no market */}
            {!isLive && (
                <div className="relative z-10 mb-4 border-t border-[#27272A] pt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 justify-center py-2 italic">
                        <Target className="w-4 h-4 text-gray-600" /> Waiting for active market...
                    </div>
                </div>
            )}

            {/* Last 5 Trades */}
            <div className="relative z-10 mt-auto">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Últimos Trades</div>
                {trades.length > 0 ? (
                    <div className="space-y-1">
                        {trades.map((t: any, i: number) => {
                            const side = t.side || t.direction || (t.action === 'BUY' ? 'BUY' : 'SELL');
                            const isBuy = side?.toUpperCase() === 'BUY' || side?.toUpperCase() === 'YES';
                            const pnl = t.pnl ?? t.profit ?? t.realized_pnl ?? null;
                            const entry = t.entry_price ?? t.entry ?? t.price ?? null;
                            const exit = t.exit_price ?? t.exit ?? null;
                            const time = t.timestamp || t.time || t.created_at;
                            const timeStr = time ? new Date(time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

                            return (
                                <div key={i} className="flex items-center justify-between bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-1.5 text-[10px] font-mono">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-gray-600">{timeStr}</span>
                                        <span className={`font-black px-1.5 py-0.5 rounded text-[9px] ${isBuy ? 'text-[#00FF41] bg-[#00FF41]/10' : 'text-red-400 bg-red-500/10'}`}>
                                            {isBuy ? 'BUY' : 'SELL'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {entry != null && <span className="text-gray-400">{fmtUsd(entry)}</span>}
                                        {exit != null && (
                                            <>
                                                <span className="text-gray-600">→</span>
                                                <span className="text-gray-300">{fmtUsd(exit)}</span>
                                            </>
                                        )}
                                        {pnl != null && (
                                            <span className={`font-black ${pnl >= 0 ? 'text-[#00FF41]' : 'text-red-400'}`}>
                                                {pnl >= 0 ? '+' : ''}{fmtUsd(pnl)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-[10px] text-gray-600 italic text-center py-2">
                        Sin trades recientes
                    </div>
                )}
            </div>
        </div>
    );
}
