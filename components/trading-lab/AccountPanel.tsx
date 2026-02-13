'use client';

import React, { useEffect, useState } from 'react';
import { Wallet, RefreshCw } from 'lucide-react';

type Balance = {
    coin: string;
    free: string;
    frozen: string;
    total: number;
};

const COIN_COLORS: Record<string, string> = {
    USDT: '#26A17B',
    BTC: '#F7931A',
    ETH: '#627EEA',
    BNB: '#F3BA2F',
    SOL: '#9945FF',
    XRP: '#23292F',
    ADA: '#0033AD',
    DOT: '#E6007A',
    DOGE: '#C2A633',
    AVAX: '#E84142',
};

const AccountPanel: React.FC = () => {
    const [balances, setBalances] = useState<Balance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBalances = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/pionex/balances');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setBalances(data.balances || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalances();
        const interval = setInterval(fetchBalances, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-[#00FF41]" />
                    <h3 className="text-sm font-bold text-white tracking-tight">ACCOUNT</h3>
                </div>
                <button onClick={fetchBalances} className="text-gray-500 hover:text-white transition-colors">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {error && (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-red-400 text-xs font-mono">⚠️ {error}</p>
                </div>
            )}

            {!error && (
                <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
                    {loading && balances.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 text-xs animate-pulse font-mono">Conectando a Pionex...</p>
                        </div>
                    ) : balances.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 text-xs font-mono">Sin saldos disponibles</p>
                        </div>
                    ) : (
                        balances.map(b => (
                            <div key={b.coin} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                        style={{ backgroundColor: COIN_COLORS[b.coin] || '#4B5563' }}
                                    >
                                        {b.coin.slice(0, 2)}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-white">{b.coin}</p>
                                        {parseFloat(b.frozen) > 0 && (
                                            <p className="text-[10px] text-yellow-500">🔒 {parseFloat(b.frozen).toFixed(4)}</p>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs font-mono text-white/80 tabular-nums">
                                    {b.total < 0.0001 ? b.total.toExponential(2) : b.total.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default AccountPanel;
