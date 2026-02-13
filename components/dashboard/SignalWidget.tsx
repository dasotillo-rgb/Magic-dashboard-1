'use client';
import React from 'react';
import { Zap } from 'lucide-react';

type Props = {
    status: string;
    strategy: string;
    color?: string;
    borderColor?: string;
};

const SignalWidget: React.FC<Props> = ({ status, strategy, color = 'bg-[#1C1C1E]/60', borderColor = 'border-white/10' }) => {
    return (
        <div className={`${color} border ${borderColor} rounded-[2rem] p-6 h-full transition-all hover:bg-white/5`}>
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-semibold text-gray-400 tracking-wider flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-[#00FF41]" /> TREND SIGNAL
                </h3>
                <span className="text-[10px] font-bold bg-[#00FF41] text-black px-2.5 py-0.5 rounded-full">LIVE</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{strategy}</p>
            <p className="text-4xl font-black text-[#00FF41] italic mt-1">{status}</p>
            <div className="h-1 w-40 bg-[#00FF41] rounded-full mt-3" />
        </div>
    );
};

export default SignalWidget;
