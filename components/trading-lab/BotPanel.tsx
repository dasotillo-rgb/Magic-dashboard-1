'use client';

import React, { useState } from 'react';
import { Bot, Settings, Play, Info, BarChart3, Zap, ShieldCheck } from 'lucide-react';

type Props = {
    symbol: string;
};

const BotPanel: React.FC<Props> = ({ symbol }) => {
    const [botType, setBotType] = useState<'GRID' | 'INDICATOR'>('GRID');
    const [investment, setInvestment] = useState('100');
    const [range, setRange] = useState({ lower: '63000', upper: '69000' });
    const [grids, setGrids] = useState('50');
    const [isDeploying, setIsDeploying] = useState(false);
    const [activeBot, setActiveBot] = useState<any>(null);

    const handleCreate = async () => {
        setIsDeploying(true);
        try {
            const res = await fetch('/api/pionex/bots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol,
                    type: botType,
                    investment,
                    upperPrice: range.upper,
                    lowerPrice: range.lower,
                    grids
                })
            });
            const data = await res.json();
            if (data.success) {
                setActiveBot(data.bot);
                // Trigger an initial pulse
                fetch('/api/pionex/bots', { method: 'PUT' });
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (e) {
            alert('Fallo de conexión con el motor de bots');
        } finally {
            setIsDeploying(false);
        }
    };

    if (activeBot) {
        return (
            <div className="bg-[#1C1C1E] border border-[#00FF41]/30 rounded-2xl p-6 flex flex-col gap-4 shadow-[0_0_20px_rgba(0,255,65,0.05)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#00FF41]/10 rounded-lg animate-pulse">
                            <Bot className="h-5 w-5 text-[#00FF41]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-tight">{activeBot.type} BOT LIVE</h3>
                            <p className="text-[10px] text-[#00FF41] font-mono flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41]" /> OPERATIONAL
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="text-[9px] text-gray-500 uppercase font-bold">Investment</span>
                        <p className="text-sm text-white font-mono">${activeBot.investment}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="text-[9px] text-gray-500 uppercase font-bold">Profit (H)</span>
                        <p className="text-sm text-[#00FF41] font-mono">+$0.00</p>
                    </div>
                </div>

                <button
                    onClick={() => setActiveBot(null)}
                    className="w-full py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                >
                    STOP ENGINE
                </button>
            </div>
        );
    }

    return (
        <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-5 flex flex-col gap-5 shadow-xl transition-all hover:border-[#00FF41]/30">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Bot className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">MANAGED BOT v1</h3>
                        <p className="text-[10px] text-gray-500 font-mono">Status: WAITING</p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setBotType('GRID')}
                        className={`p-1.5 rounded-md transition-all ${botType === 'GRID' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-600 hover:text-gray-400'}`}
                        title="Grid Bot"
                    >
                        <BarChart3 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setBotType('INDICATOR')}
                        className={`p-1.5 rounded-md transition-all ${botType === 'INDICATOR' ? 'bg-[#00FF41]/20 text-[#00FF41]' : 'text-gray-600 hover:text-gray-400'}`}
                        title="Indicator Bot (Prophet)"
                    >
                        <Zap className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Config Fields */}
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Investment (USDT)</label>
                    <div className="relative">
                        <input
                            type="number"
                            disabled={isDeploying}
                            value={investment}
                            onChange={(e) => setInvestment(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-indigo-500/50 outline-none transition-all disabled:opacity-50"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] text-gray-600">USDT</span>
                    </div>
                </div>

                {botType === 'GRID' ? (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Lower Price</label>
                            <input
                                type="number"
                                disabled={isDeploying}
                                value={range.lower}
                                onChange={(e) => setRange({ ...range, lower: e.target.value })}
                                className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-indigo-500/50 outline-none disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Upper Price</label>
                            <input
                                type="number"
                                disabled={isDeploying}
                                value={range.upper}
                                onChange={(e) => setRange({ ...range, upper: e.target.value })}
                                className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-indigo-500/50 outline-none disabled:opacity-50"
                            />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Grids (Quantity)</label>
                            <input
                                type="number"
                                disabled={isDeploying}
                                value={grids}
                                onChange={(e) => setGrids(e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-indigo-500/50 outline-none disabled:opacity-50"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-2">
                        <div className="flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5 text-[#00FF41]" />
                            <span className="text-xs font-bold text-[#00FF41]">GEMINI MONEY LINE</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                            Este bot ejecutará compras en señales <span className="text-green-400 font-bold">BULLISH</span> y ventas en señales <span className="text-red-400 font-bold">BEARISH</span> automáticamente.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                            <ShieldCheck className="h-3 w-3 text-indigo-400" />
                            <span className="text-[9px] text-indigo-400 uppercase font-bold">Risk Management: Optimized</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Action */}
            <div className="space-y-3 pt-2">
                <button
                    disabled={isDeploying}
                    onClick={handleCreate}
                    className={`w-full py-3 ${isDeploying ? 'bg-gray-700' : botType === 'GRID' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-[#00FF41] hover:bg-[#00FF41]/90 text-black'} rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] uppercase disabled:opacity-50 disabled:cursor-wait`}
                >
                    {isDeploying ? (
                        <>Iniciando motor...</>
                    ) : (
                        <>
                            <Play className={`h-3 w-3 ${botType === 'GRID' ? 'fill-current' : 'fill-black'}`} />
                            DESPLEGAR {botType} BOT
                        </>
                    )}
                </button>

                <div className="flex items-start gap-1.5 opacity-60">
                    <Info className="h-3 w-3 text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-[9px] text-gray-500 leading-tight">
                        Managed Bots operan internamente en este dashboard usando tus API keys para simular estrategias avanzadas con control total.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BotPanel;
