'use client';
import React from 'react';

type MarketItem = {
    name: string;
    price: number;
};

type Props = {
    data: MarketItem[];
    color?: string;
    borderColor?: string;
};

const MarketPulseWidget: React.FC<Props> = ({ data, color = 'bg-[#1C1C1E]/60', borderColor = 'border-white/10' }) => {
    return (
        <div className={`${color} border ${borderColor} rounded-[2rem] p-6 h-full flex flex-col transition-all hover:bg-white/5`}>
            <h3 className="text-xs font-semibold text-gray-400 tracking-wider mb-4 shrink-0">MARKET PULSE</h3>
            <div className="space-y-5 flex-1 overflow-y-auto min-h-0 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {data.map(asset => (
                    <div key={asset.name} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                            <span className="text-sm font-bold text-white">{asset.name}</span>
                        </div>
                        <span className="text-sm font-mono tabular-nums text-white/80">${asset.price.toLocaleString('en-US')}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarketPulseWidget;
