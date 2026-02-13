'use client';

import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, Clock, DollarSign, ChevronRight, Sparkles, RefreshCw, ExternalLink } from 'lucide-react';

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

const OPPORTUNITIES: Opportunity[] = [
    {
        id: 'ai-car-alerts',
        title: 'Bot de Alertas de Coches con IA',
        description: 'Servicio de suscripción: alertas en Telegram/WhatsApp cuando aparecen deals de coches con profit >€5k. Usar nuestra API existente + Gemini para análisis automático.',
        category: 'ai-saas',
        estimatedRevenue: '€500-2.000/mes',
        timeToRevenue: '1-2 semanas',
        difficulty: 'easy',
        roi: '∞ (sin coste)',
        tags: ['ya tenemos api', 'escalable', 'recurrente'],
        hot: true,
    },
    {
        id: 'ai-wrapper',
        title: 'Wrapper AI para Nichos Específicos',
        description: 'Crear herramientas de IA especializadas (ej: generador de contratos, analizador de CVs, copywriter). Usar Gemini API + front simple. Cobrar suscripción mensual.',
        category: 'ai-saas',
        estimatedRevenue: '€1.000-10.000/mes',
        timeToRevenue: '2-4 semanas',
        difficulty: 'medium',
        roi: '50x-100x',
        actionUrl: 'https://ai.google.dev/gemini-api',
        actionLabel: 'Gemini API →',
        tags: ['mrr', 'api existente', 'mercado validado'],
        hot: true,
    },
    {
        id: 'car-import-service',
        title: 'Servicio de Importación Llave en Mano',
        description: 'Ofrecer servicio completo de importación DE→ES. Cobrar comisión del 5-10% sobre el profit. Usar nuestra plataforma para encontrar deals y gestionar el proceso.',
        category: 'import',
        estimatedRevenue: '€2.000-8.000/operación',
        timeToRevenue: '1 mes',
        difficulty: 'medium',
        roi: '10x-20x',
        tags: ['alto margen', 'expertise existente', 'b2c'],
    },
    {
        id: 'micro-saas-dashboard',
        title: 'Dashboards Personalizados SaaS',
        description: 'Vender dashboards analíticos personalizados para PyMEs. Basados en nuestra stack Next.js. Cada cliente paga mensual por su panel de datos en tiempo real.',
        category: 'ai-saas',
        estimatedRevenue: '€200-500/cliente/mes',
        timeToRevenue: '2-3 semanas',
        difficulty: 'medium',
        roi: '30x-50x',
        tags: ['mrr', 'stack ya construida', 'replicable'],
    },
    {
        id: 'telegram-trading-signals',
        title: 'Canal Premium de Señales Trading',
        description: 'Canal de Telegram con señales automáticas generadas por nuestro análisis de sentiment + Fear&Greed Index. Suscripción mensual €29-99.',
        category: 'automation',
        estimatedRevenue: '€500-5.000/mes',
        timeToRevenue: '1 semana',
        difficulty: 'easy',
        roi: '∞ (automatizado)',
        tags: ['ya tenemos datos', 'pasivo', 'escalable'],
        hot: true,
    },
    {
        id: 'ai-content-agency',
        title: 'Agencia de Contenido con IA',
        description: 'Ofrecer servicios de content marketing usando IA: blog posts, social media, newsletters. Stack: Gemini + templates. Cobrar €500-2.000/cliente.',
        category: 'content',
        estimatedRevenue: '€2.000-8.000/mes',
        timeToRevenue: '1-2 semanas',
        difficulty: 'easy',
        roi: '20x-50x',
        tags: ['bajo overhead', 'demanda alta', 'recurrente'],
    },
    {
        id: 'api-marketplace',
        title: 'API de Precios de Coches como Servicio',
        description: 'Monetizar nuestra API de scraping: ofrecer datos de precios DE vs ES a concesionarios, importadores y particulares. Modelo freemium: gratis 10 consultas/día, premium ilimitado.',
        category: 'digital',
        estimatedRevenue: '€1.000-5.000/mes',
        timeToRevenue: '3-4 semanas',
        difficulty: 'hard',
        roi: '100x+',
        actionUrl: 'https://rapidapi.com',
        actionLabel: 'RapidAPI →',
        tags: ['api existente', 'b2b', 'escalable'],
    },
    {
        id: 'course-import',
        title: 'Curso Online: Importar Coches de Alemania',
        description: 'Crear curso digital completo sobre el proceso de importación. Incluir acceso a nuestra herramienta de búsqueda. Precio: €197-497. Vender con ads en redes.',
        category: 'content',
        estimatedRevenue: '€2.000-15.000/lanzamiento',
        timeToRevenue: '2-4 semanas',
        difficulty: 'medium',
        roi: '50x-100x',
        tags: ['pasivo', 'autoridad', 'lead gen'],
    },
];

const OpportunitiesWidget: React.FC<Props> = ({
    color = 'bg-[#1C1C1E]/60',
    borderColor = 'border-amber-500/20',
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('all');

    const filtered = filter === 'all'
        ? OPPORTUNITIES
        : OPPORTUNITIES.filter(o => o.category === filter);

    const hotCount = OPPORTUNITIES.filter(o => o.hot).length;

    return (
        <div className={`${color} border ${borderColor} rounded-[2rem] p-5 flex flex-col h-full transition-all hover:bg-white/5`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    OPORTUNIDADES DE NEGOCIO
                </h3>
                <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                        🔥 {hotCount} HOT
                    </span>
                    <span className="text-[8px] text-gray-500 font-mono">{OPPORTUNITIES.length} ideas</span>
                </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
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
                    const cat = categoryConfig[opp.category];
                    const diff = difficultyConfig[opp.difficulty];
                    const isExpanded = expandedId === opp.id;

                    return (
                        <div
                            key={opp.id}
                            className={`bg-white/[0.03] rounded-xl border transition-all cursor-pointer ${isExpanded ? 'border-amber-500/20 bg-white/[0.05]' : 'border-white/5 hover:border-white/10'
                                }`}
                        >
                            {/* Main Row */}
                            <div
                                className="p-3 flex items-start gap-2.5"
                                onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                            >
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

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="px-3 pb-3 pt-0 space-y-2 border-t border-white/5 mt-0">
                                    <p className="text-[10px] text-gray-400 leading-relaxed pt-2">{opp.description}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {opp.tags.map(tag => (
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

            {/* Footer */}
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between shrink-0">
                <span className="text-[8px] text-gray-600 font-mono flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> Ideas para monetizar con AI
                </span>
                <span className="text-[8px] text-gray-500">
                    <DollarSign className="h-2.5 w-2.5 inline" /> Revenue potencial: €10k-50k/mes
                </span>
            </div>
        </div>
    );
};

export default OpportunitiesWidget;
