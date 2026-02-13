'use client';
import React from 'react';
import { Terminal } from 'lucide-react';

type Props = {
    color?: string;
    borderColor?: string;
};

const ConsoleWidget: React.FC<Props> = ({ color = 'bg-[#1C1C1E]/60', borderColor = 'border-green-500/20' }) => {
    return (
        <div className={`${color} border ${borderColor} rounded-[2rem] p-6 h-80 flex flex-col transition-all hover:bg-white/5`}>
            <h3 className="text-xs font-semibold text-[#00FF41] tracking-wider flex items-center gap-1.5 mb-3">
                <Terminal className="h-3.5 w-3.5" /> APE CONSOLE
            </h3>
            <div className="flex-1 bg-[#0A0A0A] rounded-xl p-4 flex flex-col justify-end font-mono text-sm border border-white/5">
                <p className="text-gray-500">{'#'} ApeOS Systems Online. Conectado a Gemini Pro. ¿Cuál es el siguiente movimiento, Comandante?</p>
            </div>
        </div>
    );
};

export default ConsoleWidget;
