'use client';

import { useState, useEffect, useRef } from 'react';
import { BarChart2, RefreshCw, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';

interface LastAction {
    side: 'BUY' | 'SELL';
    price: number;
    size: number;
    timestamp: string;
}

interface MakerData {
    status: string;
    market: string;
    mid_price: number;
    spread: number;
    bid: number;
    ask: number;
    inventory?: number;
    pnl_session?: number;
    last_action?: LastAction;
    log?: string[];
    is_demo?: boolean;
    fetched_at?: number;
}

const fmt = (n: number, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

const STATUS_STYLES: Record<string, string> = {
    RUNNING: 'text-green-400',
    ACTIVE: 'text-green-400',
    IDLE: 'text-yellow-400',
    PAUSED: 'text-yellow-400',
    ERROR: 'text-red-400',
    DEMO: 'text-orange-400',
    STOPPED: 'text-red-400',
};

export function MarketMakerWidget() {
    const [data, setData] = useState<MakerData | null>(null);
    const [loading, setLoading] = useState(true);
    const logRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/trading/maker', { cache: 'no-store' });
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error('MarketMakerWidget fetch error', err);
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

    const statusColor = data ? (STATUS_STYLES[data.status] ?? 'text-gray-400') : 'text-gray-500';
    const isLive = data && !data.is_demo;

    return (
        <div className="bg-black/40 border border-white/10 rounded-xl backdrop-blur-sm h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2 border-b border-white/5">
                <h3 className="text-sm font-light tracking-wider text-emerald-200 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-emerald-400" />
                    APE-MAKER
                </h3>
                <div className="flex items-center gap-2">
                    {data?.is_demo && (
                        <span className="text-[8px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full">DEMO</span>
                    )}
                    <span className={`text-[10px] font-bold ${statusColor}`}>
                        ● {data?.status ?? '…'}
                    </span>
                    <button onClick={fetchData} className="text-white/30 hover:text-white transition-colors">
                        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Main metrics */}
            <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
                {/* Market & Mid */}
                <div className="px-3 py-2.5">
                    <p className="text-[9px] text-gray-600 uppercase tracking-widest">Mercado</p>
                    <p className="text-sm font-bold text-white leading-tight">{data?.market ?? '—'}</p>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                        mid <span className="text-white/70">{data?.mid_price ? `$${fmt(data.mid_price, 2)}` : '—'}</span>
                    </p>
                </div>
                {/* Bid / Ask */}
                <div className="px-3 py-2.5">
                    <p className="text-[9px] text-gray-600 uppercase tracking-widest">Spread</p>
                    <p className="text-sm font-bold text-white font-mono leading-tight">
                        {data?.spread != null ? `${data.spread.toFixed(3)}%` : '—'}
                    </p>
                    <p className="text-[10px] font-mono mt-0.5">
                        <span className="text-green-400">{data?.bid ? `${fmt(data.bid, 1)}` : '—'}</span>
                        <span className="text-gray-600 mx-1">/</span>
                        <span className="text-red-400">{data?.ask ? `${fmt(data.ask, 1)}` : '—'}</span>
                    </p>
                </div>
                {/* PnL */}
                <div className="px-3 py-2.5">
                    <p className="text-[9px] text-gray-600 uppercase tracking-widest">PnL Sesión</p>
                    <p className={`text-sm font-bold font-mono leading-tight ${(data?.pnl_session ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {data?.pnl_session != null ? `${data.pnl_session >= 0 ? '+' : ''}$${fmt(data.pnl_session)}` : '—'}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                        inv <span className="text-white/50">{data?.inventory != null ? fmt(data.inventory, 4) : '—'}</span>
                    </p>
                </div>
            </div>

            {/* Last action */}
            {data?.last_action && (
                <div className={`mx-2 mt-2 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-mono border ${data.last_action.side === 'BUY'
                        ? 'bg-green-500/10 border-green-500/20 text-green-300'
                        : 'bg-red-500/10 border-red-500/20 text-red-300'
                    }`}>
                    {data.last_action.side === 'BUY'
                        ? <TrendingUp className="h-3 w-3 shrink-0" />
                        : <TrendingDown className="h-3 w-3 shrink-0" />}
                    <span className="font-bold">{data.last_action.side}</span>
                    <span className="text-white/50">·</span>
                    <span>${fmt(data.last_action.price, 2)}</span>
                    <span className="text-white/40">size {data.last_action.size}</span>
                    <span className="ml-auto text-white/30 text-[8px]">
                        {new Date(data.last_action.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            )}

            {/* Mini log */}
            <div ref={logRef} className="flex-1 overflow-y-auto p-2 mt-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {(data?.log ?? []).map((line, i) => (
                    <p key={i} className="text-[9px] font-mono text-white/35 hover:text-white/60 transition-colors leading-relaxed px-1">{line}</p>
                ))}
                {(!data?.log || data.log.length === 0) && (
                    <p className="text-[9px] text-white/20 italic text-center mt-4">
                        {loading ? 'Conectando...' : 'Sin actividad reciente'}
                    </p>
                )}
            </div>

            {/* Footer */}
            <div className="px-3 py-1.5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[8px] text-gray-700 font-mono">market maker · 30s poll</span>
                <div className="flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5 text-emerald-700" />
                    <span className={`text-[8px] font-mono ${isLive ? 'text-emerald-600' : 'text-orange-700'}`}>
                        {isLive ? 'LIVE' : 'DEMO'}
                    </span>
                </div>
            </div>
        </div>
    );
}
