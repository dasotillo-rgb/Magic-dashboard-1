'use client';

import { useState, useEffect, useRef } from 'react';
import { Crosshair, RefreshCw, TrendingUp, TrendingDown, Minus, Radio, Loader2 } from 'lucide-react';

interface SniperData {
    status: string;
    pair: string;
    exchange: string;
    trend_5m: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    trend_strength: number;   // 0-100
    price_now: number;
    phase: 'SCANNING' | 'LOCKED' | 'EXECUTING' | 'COOLDOWN';
    signal_strength: number;  // 0-100
    targets?: { price: number; side: string }[];
    log?: string[];
    is_demo?: boolean;
    fetched_at?: number;
}

const fmt = (n: number, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

const TREND_CONFIG = {
    BULLISH: { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    BEARISH: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    NEUTRAL: { icon: Minus, color: 'text-gray-400', bg: 'bg-white/5 border-white/10' },
};

const PHASE_CONFIG = {
    SCANNING: { label: 'BUSCANDO', color: 'text-blue-400', pulse: true },
    LOCKED: { label: 'OBJETIVO', color: 'text-yellow-400', pulse: true },
    EXECUTING: { label: 'EJECUTANDO', color: 'text-green-400', pulse: true },
    COOLDOWN: { label: 'COOLDOWN', color: 'text-gray-500', pulse: false },
};

export function ApeSniperWidget() {
    const [data, setData] = useState<SniperData | null>(null);
    const [loading, setLoading] = useState(true);
    const logRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/trading/sniper2', { cache: 'no-store' });
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error('ApeSniperWidget fetch error', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const iv = setInterval(fetchData, 30000);
        return () => clearInterval(iv);
    }, []);

    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [data?.log]);

    const trend = data?.trend_5m ?? 'NEUTRAL';
    const trendCfg = TREND_CONFIG[trend];
    const TrendIcon = trendCfg.icon;

    const phase = data?.phase ?? 'SCANNING';
    const phaseCfg = PHASE_CONFIG[phase] ?? PHASE_CONFIG.SCANNING;
    const isLive = data && !data.is_demo;

    return (
        <div className="bg-black/40 border border-white/10 rounded-xl backdrop-blur-sm h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2 border-b border-white/5">
                <h3 className="text-sm font-light tracking-wider text-red-200 flex items-center gap-2">
                    <Crosshair className="h-4 w-4 text-red-400" />
                    APE-SNIPER
                </h3>
                <div className="flex items-center gap-2">
                    {data?.is_demo && (
                        <span className="text-[8px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full">DEMO</span>
                    )}
                    <span className="text-[10px] font-bold text-white/60">
                        {data?.exchange ?? 'Bybit'} · <span className="text-white">{data?.pair ?? '—'}</span>
                    </span>
                    <button onClick={fetchData} className="text-white/30 hover:text-white transition-colors">
                        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Phase + Trend row */}
            <div className="grid grid-cols-2 gap-2 p-2 border-b border-white/5">
                {/* Phase */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${phase === 'EXECUTING' ? 'bg-green-500/10 border-green-500/20' :
                        phase === 'LOCKED' ? 'bg-yellow-500/10 border-yellow-500/20' :
                            phase === 'COOLDOWN' ? 'bg-white/5 border-white/10' :
                                'bg-blue-500/10 border-blue-500/20'
                    }`}>
                    {phase === 'EXECUTING' ? (
                        <Radio className="h-3.5 w-3.5 text-green-400 animate-pulse shrink-0" />
                    ) : phase === 'SCANNING' ? (
                        <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin shrink-0" />
                    ) : (
                        <Crosshair className={`h-3.5 w-3.5 shrink-0 ${phaseCfg.color}`} />
                    )}
                    <div>
                        <p className="text-[8px] text-gray-600 uppercase tracking-widest">Fase</p>
                        <p className={`text-xs font-bold ${phaseCfg.color}`}>{phaseCfg.label}</p>
                    </div>
                </div>

                {/* 5m Trend */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${trendCfg.bg}`}>
                    <TrendIcon className={`h-3.5 w-3.5 shrink-0 ${trendCfg.color}`} />
                    <div>
                        <p className="text-[8px] text-gray-600 uppercase tracking-widest">Tendencia 5m</p>
                        <p className={`text-xs font-bold ${trendCfg.color}`}>{trend}</p>
                    </div>
                    {(data?.trend_strength ?? 0) > 0 && (
                        <span className="ml-auto text-[9px] text-white/40 font-mono">{data?.trend_strength}%</span>
                    )}
                </div>
            </div>

            {/* Price + Signal strength */}
            <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
                <div>
                    <p className="text-[9px] text-gray-600 uppercase tracking-widest">Precio Actual</p>
                    <p className="text-lg font-black font-mono text-white leading-tight">
                        {data?.price_now ? `$${fmt(data.price_now, 2)}` : '—'}
                    </p>
                </div>
                {/* Signal strength bar */}
                <div className="flex flex-col items-end gap-1">
                    <p className="text-[9px] text-gray-600 uppercase tracking-widest">Señal</p>
                    <div className="flex items-center gap-1.5">
                        <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${(data?.signal_strength ?? 0) > 70 ? 'bg-green-400' :
                                        (data?.signal_strength ?? 0) > 40 ? 'bg-yellow-400' : 'bg-white/20'
                                    }`}
                                style={{ width: `${data?.signal_strength ?? 0}%` }}
                            />
                        </div>
                        <span className="text-[9px] font-mono text-white/50">{data?.signal_strength ?? 0}%</span>
                    </div>
                </div>
            </div>

            {/* Mini log */}
            <div ref={logRef} className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {(data?.log ?? []).map((line, i) => {
                    const isSignal = line.includes('SEÑAL') || line.includes('EJECUTANDO') || line.includes('TARGET');
                    return (
                        <p key={i} className={`text-[9px] font-mono leading-relaxed px-1 transition-colors ${isSignal ? 'text-yellow-300/80' : 'text-white/30 hover:text-white/60'
                            }`}>{line}</p>
                    );
                })}
                {(!data?.log || data.log.length === 0) && (
                    <p className="text-[9px] text-white/20 italic text-center mt-4">
                        {loading ? 'Conectando...' : 'Esperando señales del mercado...'}
                    </p>
                )}
            </div>

            {/* Footer */}
            <div className="px-3 py-1.5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[8px] text-gray-700 font-mono">sniper · bybit · 30s poll</span>
                <span className={`text-[8px] font-mono ${isLive ? 'text-green-600' : 'text-orange-700'}`}>
                    {isLive ? '● LIVE' : '● DEMO'}
                </span>
            </div>
        </div>
    );
}
