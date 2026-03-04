'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Arbitrage {
    question: string;
    strategy: string;
    net_profit_pct: number;
}

interface SniperData {
    detected_at: string;
    arbitrages: Arbitrage[];
    is_demo?: boolean;
}

export function CryptoSniperWidget() {
    const [data, setData] = useState<SniperData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/trading/sniper', { cache: 'no-store' });
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error('Failed to fetch sniper data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const getTrendIcon = (strategy: string) => {
        if (strategy.toLowerCase().includes('bullish')) return <TrendingUp className="h-4 w-4 text-green-500" />;
        if (strategy.toLowerCase().includes('bearish')) return <TrendingDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-gray-500" />;
    };

    return (
        <div className="bg-black/40 border border-white/10 rounded-xl backdrop-blur-sm h-full flex flex-col overflow-hidden">
            <div className="flex flex-row items-center justify-between p-4 pb-2 border-b border-white/5">
                <h3 className="text-sm font-light tracking-wider text-purple-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    CRYPTO SNIPER
                </h3>
                <div className="flex items-center gap-2">
                    {data?.is_demo && (
                        <span className="text-[8px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full">
                            DEMO
                        </span>
                    )}
                    <span className="text-[10px] text-white/30 font-mono">
                        {data?.detected_at ? new Date(data.detected_at).toLocaleTimeString() : '--:--:--'}
                    </span>
                    <button onClick={fetchData} className="text-white/40 hover:text-white transition-colors">
                        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
            <div className="p-0 flex-1 overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {data && data.arbitrages && data.arbitrages.length > 0 ? (
                    <table className="w-full text-xs text-left">
                        <thead className="bg-white/5 text-white/40 font-medium sticky top-0 backdrop-blur-md">
                            <tr>
                                <th className="p-3 font-light">QUESTION / ASSET</th>
                                <th className="p-3 font-light">STRATEGY / TREND</th>
                                <th className="p-3 font-light text-right">PROFIT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.arbitrages.map((arb, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-3 text-white/80 font-medium group-hover:text-purple-300 transition-colors">
                                        {arb.question}
                                    </td>
                                    <td className="p-3 text-white/50 flex items-center gap-2">
                                        {getTrendIcon(arb.strategy)}
                                        {arb.strategy}
                                    </td>
                                    <td className="p-3 text-right font-mono font-bold text-green-400">
                                        +{arb.net_profit_pct !== undefined && arb.net_profit_pct !== null ? arb.net_profit_pct.toFixed(2) : '0.00'}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex items-center justify-center h-full text-white/20 text-xs italic p-4">
                        {loading ? 'Conectando al servidor...' : 'Waiting for arbitrage opportunities...'}
                    </div>
                )}
            </div>
        </div>
    );
}
