'use client';
import React from 'react';
import { Eye, ArrowUp } from 'lucide-react';

type Props = {
    value: number;
    change: number;
    color?: string;
    borderColor?: string;
};

const AssetsWidget: React.FC<Props> = ({ value, change, color = 'bg-[#1C1C1E]/60', borderColor = 'border-white/10' }) => {
    return (
        <div className={`${color} border ${borderColor} rounded-[2rem] p-6 h-full transition-all hover:bg-white/5`}>
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-semibold text-gray-400 tracking-wider flex items-center gap-1.5">
                    <span>💼</span> TOTAL ASSETS
                </h3>
                <Eye className="h-4 w-4 text-gray-500" />
            </div>
            <p className="text-4xl font-black mt-3 tabular-nums text-white">${value.toLocaleString('en-US')}</p>
            <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-[#00FF41] flex items-center gap-1">
                    +{change}% this month
                </p>
                <ArrowUp className="h-4 w-4 text-[#00FF41]" />
            </div>
        </div>
    );
};

export default AssetsWidget;
