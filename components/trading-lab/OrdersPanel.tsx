'use client';

import React, { useEffect, useState } from 'react';
import { List, RefreshCw, X } from 'lucide-react';

type Order = {
    orderId: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    type: string;
    price: string;
    size: string;
    filledSize: string;
    filledAmount: string; // Added to capture quote currency total
    status: string;
    createTime: number;
};

type Props = {
    symbol: string;
};

const OrdersPanel: React.FC<Props> = ({ symbol }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<'open' | 'all'>('open');

    const [canceling, setCanceling] = useState<string | null>(null);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/pionex/orders?symbol=${symbol}&type=${tab}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setOrders(data.orders || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchTicker = async () => {
        try {
            const res = await fetch(`/api/pionex/candles?symbol=${symbol}&interval=1m&limit=1`);
            const data = await res.json();
            if (data.candles && data.candles.length > 0) {
                setCurrentPrice(data.candles[0].close);
            }
        } catch (e) {
            console.error('Ticker fetch error', e);
        }
    };

    const handleCancel = async (orderId: string) => {
        if (!confirm('Cancel this order?')) return;
        setCanceling(orderId);
        try {
            const res = await fetch(`/api/pionex/orders?orderId=${orderId}&symbol=${symbol}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            fetchOrders(); // Refresh list
        } catch (err: any) {
            alert(err.message);
        } finally {
            setCanceling(null);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchTicker();
        const tickerIv = setInterval(fetchTicker, 5000);
        const ordersIv = setInterval(fetchOrders, 30_000); // refresh orders every 30s
        return () => {
            clearInterval(tickerIv);
            clearInterval(ordersIv);
        };
    }, [symbol, tab]);


    return (
        <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <List className="h-4 w-4 text-orange-400" />
                    <h3 className="text-sm font-bold text-white tracking-tight">ORDERS</h3>
                </div>
                <button onClick={fetchOrders} className="text-gray-500 hover:text-white transition-colors">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-3">
                {(['open', 'all'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${tab === t
                            ? 'bg-white/10 text-white'
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {t === 'open' ? 'Abiertas' : 'Historial'}
                    </button>
                ))}
            </div>

            {error && (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-red-400 text-xs font-mono">⚠️ {error}</p>
                </div>
            )}

            {!error && (
                <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 text-xs animate-pulse font-mono">Cargando órdenes...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 text-xs font-mono">
                                {tab === 'open' ? 'Sin órdenes abiertas' : 'Sin historial'}
                            </p>
                        </div>
                    ) : (
                        orders.slice(0, 15).map(order => (
                            <div key={order.orderId} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${order.side === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {order.side}
                                    </span>
                                    <div>
                                        {/* FIX: If price is 0 (Market Order), calculate average price from fills */}
                                        <p className="text-xs text-white font-mono">
                                            {(() => {
                                                const avgPrice = parseFloat(order.price) > 0
                                                    ? parseFloat(order.price)
                                                    : order.status === 'CLOSED' && parseFloat(order.filledSize) > 0
                                                        ? parseFloat(order.filledAmount) / parseFloat(order.filledSize)
                                                        : null;

                                                if (!avgPrice) return 'MARKET';

                                                // Calculate PnL
                                                let pnl = null;
                                                let pnlPct = null;
                                                if (currentPrice && avgPrice > 0) {
                                                    const size = parseFloat(order.filledSize) || parseFloat(order.size);
                                                    if (order.side === 'BUY') {
                                                        pnl = (currentPrice - avgPrice) * size;
                                                        pnlPct = ((currentPrice - avgPrice) / avgPrice) * 100;
                                                    } else {
                                                        pnl = (avgPrice - currentPrice) * size;
                                                        pnlPct = ((avgPrice - currentPrice) / currentPrice) * 100;
                                                    }
                                                }

                                                return (
                                                    <span className="flex items-center gap-2">
                                                        <span>${avgPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                        {pnl !== null && (
                                                            <span className={`text-[9px] px-1 rounded-sm font-bold ${pnl >= 0 ? 'text-[#00FF41] bg-[#00FF41]/10' : 'text-red-400 bg-red-400/10'}`}>
                                                                {pnl >= 0 ? '+' : ''}{pnlPct?.toFixed(2)}%
                                                                <span className="ml-1 hidden xl:inline">(${Math.abs(pnl).toFixed(2)})</span>
                                                            </span>
                                                        )}
                                                    </span>
                                                );
                                            })()}
                                        </p>
                                        <p className="text-[10px] text-gray-500">{order.type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        {/* FIX: Show filled size for history, original size for open */}
                                        <p className="text-xs text-white/70 font-mono tabular-nums">
                                            {tab === 'all' ? parseFloat(order.filledSize).toFixed(6) : parseFloat(order.size).toFixed(6)}
                                        </p>
                                        <p className="text-[10px] text-gray-500">{order.status}</p>
                                    </div>
                                    {tab === 'open' && (
                                        <button
                                            onClick={() => handleCancel(order.orderId)}
                                            disabled={canceling === order.orderId}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                                            title="Cancel Order"
                                        >
                                            <X className={`h-3 w-3 text-gray-400 hover:text-white ${canceling === order.orderId ? 'animate-spin' : ''}`} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default OrdersPanel;
