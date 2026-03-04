'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Zap, TrendingUp, Clock, DollarSign, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';

type Opportunity = {
    id: string;
    title: string;
    description: string;
    category: 'ai-saas' | 'import' | 'digital' | 'automation' | 'content';
    estimatedRevenue: string;
    timeToRevenue: string;
    difficulty: 'easy' | 'medium' | 'hard';
    roi: string;
    actionUrl?: string;
    actionLabel?: string;
    tags: string[];
    hot?: boolean;
};

type Props = {
    color?: string;
    borderColor?: string;
};

const categoryConfig = {
    'ai-saas': { label: 'AI / SaaS', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    'import': { label: 'IMPORTACIÓN', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    'digital': { label: 'DIGITAL', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    'automation': { label: 'AUTOMATIZACIÓN', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    'content': { label: 'CONTENIDO', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
};

const difficultyConfig = {
    'easy': { label: 'FÁCIL', color: 'text-green-400', bg: 'bg-green-500/10' },
    'medium': { label: 'MEDIA', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    'hard': { label: 'AVANZADA', color: 'text-red-400', bg: 'bg-red-500/10' },
};

const POLL_MS = 4 * 60 * 60 * 1000; // 4 hours — Gemini call is expensive

const OpportunitiesWidget: React.FC<Props> = ({
    color = 'bg-[#1C1C1E]/60',
    borderColor = 'border-amber-500/20',
}) => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('all');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchOpportunities = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/opportunities', { cache: 'no-store' });
            const data = await res.json();
            if (data.error || !Array.isArray(data.opportunities) || data.opportunities.length === 0) {
                throw new Error(data.error || 'Empty response');
            }
            setOpportunities(data.opportunities);
            setLastUpdated(new Date());
            setExpandedId(null); // collapse all on refresh
        } catch (err: any) {
            setError(err.message || 'Error al cargar oportunidades');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOpportunities();
        const iv = setInterval(fetchOpportunities, POLL_MS);
        return () => clearInterval(iv);
    }, [fetchOpportunities]);

    const filtered = filter === 'all'
        ? opportunities
        : opportunities.filter(o => o.category === filter);

    const hotCount = opportunities.filter(o => o.hot).length;

    return (
        <div className={`${color} border ${borderColor} rounded-[2rem] p-5 flex flex-col h-full transition-all hover:bg-white/5`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="text-xs font-semibold text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    OPORTUNIDADES DE NEGOCIO
                </h3>
                <div className="flex items-center gap-2">
                    {hotCount > 0 && (
                        <span className="text-[8px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                            🔥 {hotCount} HOT
                        </span>
                    )}
                    <button
                        onClick={fetchOpportunities}
                        disabled={loading}
                        title="Regenerar con IA"
                        className="text-gray-500 hover:text-amber-400 transition-colors disabled:opacity-40"
                    >
                        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Loading state */}
            {loading && opportunities.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <Sparkles className="h-6 w-6 text-amber-400/40 animate-pulse" />
                    <p className="text-[10px] text-gray-500 font-mono italic">Analizando oportunidades con IA...</p>
                </div>
            )}

            {/* Error state */}
            {error && !loading && opportunities.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                    <p className="text-[10px] text-red-400/60 font-mono">⚠️ {error}</p>
                    <button onClick={fetchOpportunities} className="text-[9px] text-amber-400 hover:text-amber-300 underline">
                        Reintentar
                    </button>
                </div>
            )}

            {/* Content */}
            {opportunities.length > 0 && (
                <>
                    {/* Category Filters */}
                    <div className="flex gap-1 mb-3 overflow-x-auto pb-1 shrink-0">
                        {[
                            { value: 'all', label: 'TODAS' },
                            { value: 'ai-saas', label: 'AI / SaaS' },
                            { value: 'import', label: 'IMPORT' },
                            { value: 'automation', label: 'AUTO' },
                            { value: 'digital', label: 'DIGITAL' },
                            { value: 'content', label: 'CONTENIDO' },
                        ].map(f => (
                            <button
                                key={f.value}
                                onClick={() => setFilter(f.value)}
                                className={`text-[8px] font-bold px-2 py-1 rounded-lg transition-all whitespace-nowrap ${filter === f.value
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Opportunities List */}
                    <div className="space-y-2 flex-1 overflow-y-auto min-h-0 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {filtered.map((opp) => {
                            const cat = categoryConfig[opp.category] || categoryConfig['digital'];
                            const diff = difficultyConfig[opp.difficulty] || difficultyConfig['medium'];
                            const isExpanded = expandedId === opp.id;

                            return (
                                <div
                                    key={opp.id}
                                    className={`bg-white/[0.03] rounded-xl border transition-all cursor-pointer ${isExpanded ? 'border-amber-500/20 bg-white/[0.05]' : 'border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <div className="p-3 flex items-start gap-2.5" onClick={() => setExpandedId(isExpanded ? null : opp.id)}>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                {opp.hot && <span className="text-[8px]">🔥</span>}
                                                <p className="text-[11px] font-bold text-white truncate">{opp.title}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={`text-[7px] font-bold ${cat.color} ${cat.bg} px-1.5 py-0.5 rounded ${cat.border} border`}>
                                                    {cat.label}
                                                </span>
                                                <span className={`text-[7px] font-bold ${diff.color} ${diff.bg} px-1.5 py-0.5 rounded`}>
                                                    {diff.label}
                                                </span>
                                                <span className="text-[7px] text-gray-500 flex items-center gap-0.5">
                                                    <Clock className="h-2 w-2" /> {opp.timeToRevenue}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] font-black text-[#00FF41] font-mono">{opp.estimatedRevenue}</p>
                                            <p className="text-[8px] text-gray-500">ROI: {opp.roi}</p>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="px-3 pb-3 pt-0 space-y-2 border-t border-white/5 mt-0">
                                            <p className="text-[10px] text-gray-400 leading-relaxed pt-2">{opp.description}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {opp.tags?.map(tag => (
                                                    <span key={tag} className="text-[7px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                            {opp.actionUrl && (
                                                <a
                                                    href={opp.actionUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[9px] text-blue-400 hover:text-blue-300 font-bold transition-colors"
                                                >
                                                    <ExternalLink className="h-2.5 w-2.5" /> {opp.actionLabel}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Footer */}
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between shrink-0">
                <span className="text-[8px] text-gray-600 font-mono flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> Generado por Gemini AI
                </span>
                <span className="text-[8px] text-gray-700 font-mono">
                    {loading ? 'generando...' : lastUpdated
                        ? `act. ${lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                        : 'pendiente'}
                </span>
            </div>
        </div>
    );
};

export default OpportunitiesWidget;
