'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Fuel, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatusData {
    usdc: number | null;
    pol: number | null;
    wallet?: string;
    server_ok?: boolean;
    error?: string;
}

// Smart formatter: shows enough decimals to show non-zero value
const fmtUsdc = (n: number): string => {
    if (n === 0) return '$0.00';
    if (n < 0.01) return `$${n.toFixed(6)}`; // show micro-amounts
    if (n < 1) return `$${n.toFixed(4)}`;
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtPol = (n: number): string => {
    if (n < 0.001) return `${n.toFixed(6)} POL`;
    return `${n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} POL`;
};

export default function BalanceCards() {
    const [data, setData] = useState<StatusData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/status', { cache: 'no-store' });
            if (res.ok) {
                const json = await res.json();
                setData(json);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error('BalanceCards fetch error', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const iv = setInterval(fetchStatus, 60000); // every 60s
        return () => clearInterval(iv);
    }, []);

    const hasValues = data && (data.usdc !== null || data.pol !== null);
    const isOffline = !hasValues && !loading;

    return (
        <div className="flex items-center gap-3 flex-wrap">
            {/* USDC Card */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-2.5 bg-[#1C1C1E]/80 border border-blue-500/20 rounded-2xl px-4 py-2.5 backdrop-blur-sm"
            >
                <div className="w-7 h-7 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <DollarSign className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Saldo USDC</p>
                    {loading && !data ? (
                        <div className="h-4 w-16 bg-white/5 rounded animate-pulse mt-0.5" />
                    ) : (
                        <p className="text-sm font-black font-mono text-blue-300 leading-tight" title={data?.wallet}>
                            {data?.usdc !== null && data?.usdc !== undefined
                                ? fmtUsdc(data.usdc)
                                : <span className="text-gray-600 text-xs">—</span>}
                        </p>
                    )}
                </div>
            </motion.div>

            {/* POL / Gas Card */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06 }}
                className="flex items-center gap-2.5 bg-[#1C1C1E]/80 border border-purple-500/20 rounded-2xl px-4 py-2.5 backdrop-blur-sm"
            >
                <div className="w-7 h-7 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Fuel className="h-3.5 w-3.5 text-orange-400" />
                </div>
                <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Gas (POL)</p>
                    {loading && !data ? (
                        <div className="h-4 w-16 bg-white/5 rounded animate-pulse mt-0.5" />
                    ) : (
                        <p className="text-sm font-black font-mono text-orange-300 leading-tight">
                            {data?.pol !== null && data?.pol !== undefined
                                ? fmtPol(data.pol)
                                : <span className="text-gray-600 text-xs">—</span>}
                        </p>
                    )}
                </div>
            </motion.div>

            {/* Last updated + refresh */}
            <div className="flex items-center gap-2 self-end pb-0.5">
                {isOffline && (
                    <div className="flex items-center gap-1 text-[9px] text-red-400/70">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Sin conexión</span>
                    </div>
                )}
                {lastUpdated && (
                    <span className="text-[9px] text-gray-700 font-mono">
                        act. {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
                <button
                    onClick={fetchStatus}
                    title="Actualizar balance"
                    className="text-gray-600 hover:text-white transition-colors"
                >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </div>
    );
}
