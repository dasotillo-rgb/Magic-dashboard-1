"use client";
import React, { useState, useEffect } from 'react';

export default function ArbitragePanel() {
    const [prices, setPrices] = useState({ BTC: 70826, ETH: 3450, SOL: 145 });

    useEffect(() => {
        const interval = setInterval(() => {
            setPrices(prev => ({
                BTC: prev.BTC + (Math.random() * 10 - 5),
                ETH: prev.ETH + (Math.random() * 2 - 1),
                SOL: prev.SOL + (Math.random() * 1 - 0.5)
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-black/20 p-6 rounded-3xl border border-white/10 h-full">
            <h4 className="text-lg font-bold mb-4">Arbitrage Radar</h4>
            <div className="space-y-4">
                {Object.entries(prices).map(([asset, price]) => (
                    <div key={asset} className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/5">
                        <span className="text-sm font-semibold uppercase">{asset}</span>
                        <div className="flex gap-4 text-sm tabular-nums">
                            <span className="text-blue-400">Binance: $ {price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                            <span className="text-purple-400">Kraken: $ {(price * 0.998).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
