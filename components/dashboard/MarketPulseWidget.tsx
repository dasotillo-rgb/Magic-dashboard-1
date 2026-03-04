'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

interface CoinPrice {
    name: string;
    symbol: string;
    price: number;
    change24h: number;
}

type Props = {
    color?: string;
    borderColor?: string;
};

const COINS = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
];

const MarketPulseWidget: React.FC<Props> = ({
    color = 'bg-[#1C1C1E]/60',
    borderColor = 'border-white/10',
}) => {
    const [prices, setPrices] = useState<CoinPrice[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchPrices = useCallback(async () => {
        try {
            const res = await fetch('/api/market/prices', { cache: 'no-store' });
            if (!res.ok) throw new Error('API error');
            const data = await res.json();
            if (data.prices && data.prices.length > 0) {
                setPrices(data.prices);
            }
            setLastUpdated(new Date());
        } catch (err) {
            console.error('MarketPulse fetch error', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPrices();
        const iv = setInterval(fetchPrices, 60_000); // 1 min
        return () => clearInterval(iv);
    }, [fetchPrices]);

    return (
        <div className={`${color} border ${borderColor} rounded-[2rem] p-6 h-full flex flex-col transition-all hover:bg-white/5`}>
            <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-xs font-semibold text-gray-400 tracking-wider">MARKET PULSE</h3>
                <div className="flex items-center gap-2">
                    {lastUpdated && (
                        <span className="text-[8px] text-gray-700 font-mono">
                            {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <button onClick={fetchPrices} className="text-gray-600 hover:text-white transition-colors">
                        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto min-h-0 pr-1">
                {(loading && prices.length === 0)
                    ? COINS.map(c => (
                        <div key={c.id} className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-white/10 animate-pulse" />
                                <span className="text-sm font-bold text-white/30">{c.name}</span>
                            </div>
                            <div className="h-4 w-20 rounded bg-white/5 animate-pulse" />
                        </div>
                    ))
                    : prices.map(asset => {
                        const up = asset.change24h > 0;
                        const neutral = Math.abs(asset.change24h) < 0.05;
                        const Icon = neutral ? Minus : up ? TrendingUp : TrendingDown;
                        const changeColor = neutral ? 'text-gray-500' : up ? 'text-emerald-400' : 'text-red-400';

                        return (
                            <div key={asset.symbol} className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${up ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    <div>
                                        <span className="text-sm font-bold text-white">{asset.name}</span>
                                        <span className="text-[9px] text-gray-600 ml-1.5 font-mono">{asset.symbol}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-mono tabular-nums text-white/80">
                                        ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className={`text-[9px] font-mono font-semibold flex items-center justify-end gap-0.5 ${changeColor}`}>
                                        <Icon className="h-2.5 w-2.5" />
                                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        );
                    })}
            </div>

            <p className="text-[8px] text-gray-700 font-mono mt-3 pt-2 border-t border-white/5 shrink-0">
                coingecko · actualiza cada 60s
            </p>
        </div>
    );
};

export default MarketPulseWidget;
