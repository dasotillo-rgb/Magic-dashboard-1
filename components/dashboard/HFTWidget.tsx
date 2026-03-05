'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, ArrowUpRight, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';

// Formatting utilities
const fmtUsd = (val: number | undefined | null) =>
    val == null ? "—" : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);
const pct = (val: number | undefined | null) =>
    val == null ? "—" : `${(val * 100).toFixed(1)}%`;
const fmt = (n: number | undefined | null, d = 2) =>
    (n != null ? Number(n).toFixed(d) : "—");

export default function HFTWidget() {
    const [data, setData] = useState<{
        market: any;
        health: any;
        metrics: any;
        real_status: any;
    } | null>(null);
    const [connected, setConnected] = useState(false);
    const busy = useRef(false);

    const fetchAll = useCallback(async () => {
        if (busy.current) return;
        busy.current = true;
        try {
            const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
            const apiBase = "http://51.21.170.68:5001";
            const targetUrl = isHttps
                ? `/api/hft-proxy?path=/api/all`
                : `${apiBase}/api/all`;

            const response = await fetch(targetUrl, {
                signal: AbortSignal.timeout(6000),
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) {
                setConnected(false);
                busy.current = false;
                return;
            }

            const d = await response.json();
            if (d) {
                setData(d);
                setConnected(true);
            } else {
                setConnected(false);
            }
        } catch (err) {
            setConnected(false);
        }
        busy.current = false;
    }, []);

    useEffect(() => {
        fetchAll();
        const iv = setInterval(fetchAll, 5000);
        return () => clearInterval(iv);
    }, [fetchAll]);

    const isLive = data?.market?.status === "LIVE";
    const market = data?.market;
    const metrics = data?.metrics;

    return (
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 lg:p-6 flex flex-col h-full shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:border-[#3F3F46] transition-colors relative overflow-hidden group">
            {/* Background Effect */}
            <div className="absolute top-0 right-0 p-32 bg-[#00FF41]/5 rounded-full blur-[100px] -mr-16 -mt-16 pointer-events-none group-hover:bg-[#00FF41]/10 transition-colors duration-500" />

            <div className="flex justify-between items-start mb-6 relative z-10">
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

            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10 flex-1">
                <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-4 flex flex-col justify-center relative overflow-hidden">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total PnL</div>
                    <div className={`text-2xl font-black font-mono tracking-tight ${(metrics?.total_pnl ?? 0) >= 0 ? 'text-[#00FF41]' : 'text-red-500'}`}>
                        {metrics ? fmtUsd(metrics.total_pnl) : "$0.00"}
                    </div>
                    {(metrics?.total_pnl ?? 0) >= 0 && (
                        <div className="absolute top-2 right-2 flex scale-75 opacity-20">
                            <ArrowUpRight className="h-8 w-8 text-[#00FF41]" />
                        </div>
                    )}
                </div>
                <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-4 flex flex-col justify-center">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Trades</div>
                    <div className="text-2xl font-black text-white font-mono tracking-tight">
                        {metrics?.total_trades || 0}
                    </div>
                </div>
            </div>

            <div className="mt-auto relative z-10 border-t border-[#27272A] pt-4">
                {isLive && market ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">BTC Price</div>
                                <div className="text-sm font-black text-white font-mono">{fmtUsd(market.current_price)}</div>
                            </div>
                            <div className="h-8 w-px bg-[#27272A]" />
                            <div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Strike</div>
                                <div className="text-sm font-bold text-gray-300 font-mono">{fmtUsd(market.strike_price)}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Delta</div>
                            <div className={`text-sm font-black font-mono ${market.delta > 0 ? "text-[#00FF41]" : "text-red-500"}`}>
                                {market.delta > 0 ? "+" : ""}{fmt(market.delta)}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-500 justify-center py-2 h-full italic">
                        <Target className="w-4 h-4 text-gray-600" /> Waiting for active market...
                    </div>
                )}
            </div>
        </div>
    );
}
