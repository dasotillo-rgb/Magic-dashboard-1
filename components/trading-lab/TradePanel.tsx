'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowRightLeft } from 'lucide-react';

type Props = {
    symbol: string;
    onOrderPlaced?: () => void;
};

const TradePanel: React.FC<Props> = ({ symbol, onOrderPlaced }) => {
    const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
    const [type, setType] = useState<'MARKET' | 'LIMIT'>('LIMIT');
    const [price, setPrice] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Available balance state
    const [available, setAvailable] = useState('0.00');

    // Fetch available balance
    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const res = await fetch('/api/pionex/balances');
                const data = await res.json();
                if (data.balances) {
                    const quoteCurrency = symbol.split('_')[1];
                    const baseCurrency = symbol.split('_')[0];

                    const targetCoin = side === 'BUY' ? quoteCurrency : baseCurrency;
                    const balance = data.balances.find((b: any) => b.coin === targetCoin);

                    setAvailable(balance ? parseFloat(balance.free).toFixed(6) : '0.00');
                }
            } catch (err) {
                console.error('Balance fetch error:', err);
            }
        };

        fetchBalance();
        const iv = setInterval(fetchBalance, 5000); // Poll every 5s
        return () => clearInterval(iv);
    }, [symbol, side]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch('/api/pionex/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol,
                    side,
                    type,
                    price: type === 'LIMIT' ? price : undefined,
                    amount,
                }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setSuccess(`Orden enviada: ${data.orderId}`);
            setAmount('');
            if (onOrderPlaced) onOrderPlaced();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const quoteCurrency = symbol.split('_')[1];
    const baseCurrency = symbol.split('_')[0];

    return (
        <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white tracking-tight">TRADE {baseCurrency}</h3>
                </div>
            </div>

            {/* Buy/Sell Tabs */}
            <div className="flex bg-[#2C2C2E] rounded-lg p-1 mb-4">
                <button
                    onClick={() => setSide('BUY')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${side === 'BUY'
                        ? 'bg-[#00E676] text-[#003311]'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    BUY
                </button>
                <button
                    onClick={() => setSide('SELL')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${side === 'SELL'
                        ? 'bg-[#FF5252] text-[#330000]'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    SELL
                </button>
            </div>

            {/* Market/Limit Tabs */}
            <div className="flex gap-4 mb-4 border-b border-white/10 px-1">
                <button
                    onClick={() => setType('LIMIT')}
                    className={`pb-2 text-xs font-medium transition-colors border-b-2 ${type === 'LIMIT'
                        ? 'border-[#00FF41] text-[#00FF41]'
                        : 'border-transparent text-gray-500 hover:text-white'
                        }`}
                >
                    Limit
                </button>
                <button
                    onClick={() => setType('MARKET')}
                    className={`pb-2 text-xs font-medium transition-colors border-b-2 ${type === 'MARKET'
                        ? 'border-[#00FF41] text-[#00FF41]'
                        : 'border-transparent text-gray-500 hover:text-white'
                        }`}
                >
                    Market
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* Price Input (Limit only) */}
                {type === 'LIMIT' && (
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-mono">Price ({quoteCurrency})</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                className="w-full bg-[#121214] border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[#00FF41]/50 font-mono"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                )}

                {/* Amount Input */}
                <div className="space-y-1">
                    <div className="flex justify-between">
                        <label className="text-[10px] text-gray-500 font-mono">
                            {type === 'MARKET' && side === 'BUY' ? `Amount (${quoteCurrency})` : `Amount (${baseCurrency})`}
                        </label>
                        <span className="text-[10px] text-gray-500 font-mono cursor-pointer hover:text-white" onClick={() => setAmount(available)}>
                            Avail: {available}
                        </span>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full bg-[#121214] border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[#00FF41]/50 font-mono"
                            placeholder={type === 'MARKET' && side === 'BUY' ? "Spend total..." : "Quantity..."}
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-xl text-sm font-bold mt-2 transition-transform active:scale-[0.98] ${side === 'BUY'
                        ? 'bg-[#00E676] text-[#003311] hover:bg-[#00C853]'
                        : 'bg-[#FF5252] text-white hover:bg-[#D50000]'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                        `${side} ${baseCurrency}`
                    )}
                </button>

                {/* Feedback */}
                {error && <p className="text-red-400 text-xs text-center mt-1">{error}</p>}
                {success && <p className="text-green-400 text-xs text-center mt-1">{success}</p>}
            </form>
        </div>
    );
};

export default TradePanel;
