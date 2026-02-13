"use client";
import React from 'react';

export default function Chart() {
    return (
        <div className="w-full h-[400px] bg-black/40 rounded-2xl flex items-center justify-center border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
            <p className="text-gray-500 font-mono text-xs animate-pulse tracking-widest">CONNECTING LIVE CHART FEED...</p>
        </div>
    );
}
