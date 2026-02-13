'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, Twitter, TrendingDown, TrendingUp, AlertTriangle, RefreshCw, Info } from 'lucide-react';

type SentimentData = {
    fng: {
        value: number;
        label: string;
        timestamp: string;
    };
    twitter: {
        score: number;
        label: string;
        trendingTopics: string[];
        summary: string;
    };
};

const SentimentWidget = () => {
    const [data, setData] = useState<SentimentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSentiment = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/sentiment');
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setData(json);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSentiment();
        const interval = setInterval(fetchSentiment, 300000); // Poll every 5 minutes
        return () => clearInterval(interval);
    }, []);

    const getFngColor = (val: number) => {
        if (val < 25) return 'text-red-500';
        if (val < 45) return 'text-orange-400';
        if (val < 55) return 'text-yellow-400';
        if (val < 75) return 'text-[#00FF41]';
        return 'text-[#00FF41]';
    };

    const getFngGlow = (val: number) => {
        if (val < 25) return 'shadow-[0_0_20px_rgba(239,68,68,0.3)]';
        if (val < 45) return 'shadow-[0_0_20px_rgba(251,146,60,0.3)]';
        if (val < 75) return 'shadow-[0_0_20px_rgba(0,255,65,0.2)]';
        return 'shadow-[0_0_25px_rgba(0,255,65,0.4)]';
    };

    return (
        <div className="bg-[#1C1C1E] border border-white/10 rounded-[2.5rem] p-6 h-full flex flex-col gap-4 overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <Ghost className="h-6 w-6 text-orange-400" />
                    <h3 className="text-xl font-black tracking-tighter text-white">MARKET SENTIMENT</h3>
                </div>
                <button
                    onClick={fetchSentiment}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors group"
                >
                    <RefreshCw className={`h-4 w-4 text-gray-400 group-hover:text-white transition-all ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <AnimatePresence mode="wait">
                {loading && !data ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center gap-3"
                    >
                        <RefreshCw className="h-8 w-8 text-[#00FF41] animate-spin" />
                        <p className="text-xs font-mono text-gray-500 animate-pulse uppercase tracking-widest">Scanning Social Pulse...</p>
                    </motion.div>
                ) : error ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex items-center justify-center text-center p-4"
                    >
                        <div>
                            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                            <p className="text-sm text-red-400 font-mono italic">{error}</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-1 flex flex-col gap-6 overflow-y-auto min-h-0 pr-1"
                    >
                        {/* Fear & Greed Index */}
                        <div className="flex items-center gap-6 bg-white/5 rounded-3xl p-4 border border-white/5">
                            <div className="relative">
                                <svg className="w-20 h-20">
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r="36"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.05)"
                                        strokeWidth="8"
                                    />
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r="36"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        strokeDasharray={`${(data!.fng.value / 100) * 226} 226`}
                                        className={getFngColor(data!.fng.value)}
                                        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`text-2xl font-black ${getFngColor(data!.fng.value)}`}>{data!.fng.value}</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Fear & Greed Index</h4>
                                <p className={`text-2xl font-black uppercase tracking-tight ${getFngColor(data!.fng.value)}`}>
                                    {data!.fng.label}
                                </p>
                            </div>
                        </div>

                        {/* Twitter (X) Sentiment */}
                        <div className="flex flex-col gap-3 bg-white/5 rounded-3xl p-5 border border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Twitter className="h-4 w-4 text-sky-400" />
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">X Community Sentiment</h4>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${data!.twitter.score < 30 ? 'bg-red-500/20 text-red-400' : 'bg-[#00FF41]/20 text-[#00FF41]'}`}>
                                    {data!.twitter.label}
                                </div>
                            </div>

                            <p className="text-xs text-gray-300 leading-relaxed font-medium italic">
                                "{data!.twitter.summary}"
                            </p>

                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {data!.twitter.trendingTopics.map((topic, i) => (
                                    <span key={i} className="text-[9px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full border border-white/5">
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Analysis Footer */}
                        <div className="mt-auto flex items-start gap-2 text-[9px] text-gray-500 font-mono italic">
                            <Info className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>This indicator combines Alternative.me F&G data with real-time X social analysis. Extreme fear often precedes market accumulation phases.</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SentimentWidget;
