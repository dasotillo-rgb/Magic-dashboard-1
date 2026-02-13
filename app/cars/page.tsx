'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Car, RefreshCw, ExternalLink, ChevronDown, ChevronUp,
    MapPin, Search, TrendingUp, Sparkles, Send, Bot, User, X
} from 'lucide-react';

type CarListing = {
    id: string;
    title: string;
    exactModel?: string;
    price: number;
    year: number;
    mileage: string;
    mileageNum: number;
    fuel: string;
    url: string;
    source: string;
    make: string;
    model: string;
    importCost: number;
    estimatedESPrice: number;
    estimatedProfit: number;
    profitRating: 'HIGH' | 'MEDIUM' | 'LOW';
    location?: string;
    searchReasoning?: string;
};

// Brand Logo SVGs
const BrandLogo = ({ make, size = 24 }: { make: string; size?: number }) => {
    const m = make.toLowerCase();
    if (m === 'bmw') return (
        <svg width={size} height={size} viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="31" fill="#1C1C1E" stroke="#fff" strokeWidth="2" />
            <circle cx="32" cy="32" r="26" fill="none" stroke="#fff" strokeWidth="2" />
            <path d="M32 6 A26 26 0 0 1 58 32 L32 32 Z" fill="#318CE7" />
            <path d="M58 32 A26 26 0 0 1 32 58 L32 32 Z" fill="#fff" />
            <path d="M32 58 A26 26 0 0 1 6 32 L32 32 Z" fill="#318CE7" />
            <path d="M6 32 A26 26 0 0 1 32 6 L32 32 Z" fill="#fff" />
        </svg>
    );
    if (m === 'mercedes-benz') return (
        <svg width={size} height={size} viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="30" fill="none" stroke="#C0C0C0" strokeWidth="3" />
            <circle cx="32" cy="32" r="24" fill="none" stroke="#C0C0C0" strokeWidth="2" />
            <line x1="32" y1="8" x2="32" y2="32" stroke="#C0C0C0" strokeWidth="2.5" />
            <line x1="32" y1="32" x2="10" y2="45" stroke="#C0C0C0" strokeWidth="2.5" />
            <line x1="32" y1="32" x2="54" y2="45" stroke="#C0C0C0" strokeWidth="2.5" />
        </svg>
    );
    if (m === 'audi') return (
        <svg width={size * 1.4} height={size * 0.6} viewBox="0 0 84 28">
            <circle cx="14" cy="14" r="10" fill="none" stroke="#C0C0C0" strokeWidth="2.5" />
            <circle cx="32" cy="14" r="10" fill="none" stroke="#C0C0C0" strokeWidth="2.5" />
            <circle cx="50" cy="14" r="10" fill="none" stroke="#C0C0C0" strokeWidth="2.5" />
            <circle cx="68" cy="14" r="10" fill="none" stroke="#C0C0C0" strokeWidth="2.5" />
        </svg>
    );
    if (m === 'volkswagen') return (
        <svg width={size} height={size} viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="30" fill="none" stroke="#00539F" strokeWidth="3" />
            <text x="32" y="40" textAnchor="middle" fill="#00539F" fontSize="26" fontWeight="bold" fontFamily="Arial">VW</text>
        </svg>
    );
    if (m === 'porsche') return (
        <svg width={size} height={size} viewBox="0 0 64 64">
            <rect x="6" y="12" width="52" height="40" rx="3" fill="none" stroke="#B8860B" strokeWidth="2.5" />
            <text x="32" y="38" textAnchor="middle" fill="#B8860B" fontSize="11" fontWeight="bold" fontFamily="serif">PORSCHE</text>
        </svg>
    );
    if (m === 'volvo') return (
        <svg width={size} height={size} viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#003057" strokeWidth="3" />
            <line x1="32" y1="4" x2="48" y2="20" stroke="#003057" strokeWidth="3" />
            <text x="32" y="40" textAnchor="middle" fill="#003057" fontSize="14" fontWeight="bold" fontFamily="sans-serif">VOLVO</text>
        </svg>
    );
    return <Car className="w-5 h-5 text-gray-400" />;
};

const FuelBadge = ({ fuel }: { fuel: string }) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        'DSL': { bg: 'bg-yellow-500/15', text: 'text-yellow-400', label: 'Diésel' },
        'BNZ': { bg: 'bg-green-500/15', text: 'text-green-400', label: 'Gasolina' },
        'PHEV': { bg: 'bg-purple-500/15', text: 'text-purple-400', label: 'Híbrido Ench.' },
        'HYB': { bg: 'bg-cyan-500/15', text: 'text-cyan-400', label: 'Híbrido' },
        'ELC': { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Eléctrico' },
    };
    const c = config[fuel] || config['BNZ'];
    return <span className={`${c.bg} ${c.text} text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wider shrink-0`}>{c.label}</span>;
};

const MAKES = [
    { value: 'bmw', label: 'BMW' },
    { value: 'mercedes-benz', label: 'Mercedes-Benz' },
    { value: 'audi', label: 'Audi' },
    { value: 'volkswagen', label: 'Volkswagen' },
    { value: 'porsche', label: 'Porsche' },
    { value: 'volvo', label: 'Volvo' },
];

const MODELS: Record<string, { value: string; label: string }[]> = {
    'bmw': [
        { value: 'x3', label: 'X3' }, { value: '3er', label: 'Serie 3 (330)' },
        { value: 'x5', label: 'X5' }, { value: '5er', label: 'Serie 5' },
        { value: 'x1', label: 'X1' }, { value: '1er', label: 'Serie 1' },
    ],
    'mercedes-benz': [
        { value: 'c-klasse', label: 'Clase C' }, { value: 'glc', label: 'GLC' },
        { value: 'e-klasse', label: 'Clase E' }, { value: 'a-klasse', label: 'Clase A' },
    ],
    'audi': [
        { value: 'a4', label: 'A4' }, { value: 'q5', label: 'Q5' },
        { value: 'a3', label: 'A3' }, { value: 'q3', label: 'Q3' }, { value: 'a6', label: 'A6' },
    ],
    'volkswagen': [
        { value: 'golf', label: 'Golf' }, { value: 'tiguan', label: 'Tiguan' },
        { value: 'passat', label: 'Passat' }, { value: 'id.4', label: 'ID.4' },
    ],
    'porsche': [{ value: 'cayenne', label: 'Cayenne' }, { value: 'macan', label: 'Macan' }],
    'volvo': [{ value: 'xc60', label: 'XC60' }, { value: 'xc90', label: 'XC90' }],
};

const YEARS = [2022, 2023, 2024, 2025];
const KM_OPTIONS = [
    { value: '', label: 'Sin límite' },
    { value: '50000', label: '< 50.000 km' },
    { value: '100000', label: '< 100.000 km' },
    { value: '150000', label: '< 150.000 km' },
    { value: '200000', label: '< 200.000 km' },
];

const fmt = (n: number) => n.toLocaleString('de-DE');

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    results?: CarListing[];
    searches?: { make: string; model: string; reasoning: string; found: number }[];
};

export default function CarsPage() {
    const [make, setMake] = useState('bmw');
    const [model, setModel] = useState('x3');
    const [yearFrom, setYearFrom] = useState(2022);
    const [maxKm, setMaxKm] = useState('100000');
    const [listings, setListings] = useState<CarListing[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [totalFound, setTotalFound] = useState(0);
    const [hasSearched, setHasSearched] = useState(false);

    // Smart Search state
    const [smartSearchOpen, setSmartSearchOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [smartResults, setSmartResults] = useState<CarListing[]>([]);

    const handleSearch = async () => {
        setLoading(true);
        setError(null);
        setHasSearched(true);
        try {
            const params = new URLSearchParams({ make, model, yearFrom: String(yearFrom) });
            if (maxKm) params.set('maxKm', maxKm);
            const res = await fetch(`/api/cars?${params.toString()}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setListings(data.listings || []);
            setTotalFound(data.totalFound || 0);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSmartSearch = async () => {
        if (!chatInput.trim() || chatLoading) return;

        const userMsg: ChatMessage = { role: 'user', content: chatInput };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setChatLoading(true);

        try {
            const res = await fetch('/api/cars/smart-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: chatInput,
                    chatHistory: chatMessages.map(m => ({ role: m.role, content: m.content })),
                }),
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            const assistantMsg: ChatMessage = {
                role: 'assistant',
                content: data.aiResponse?.advice || 'Aquí tienes los resultados.',
                results: data.results || [],
                searches: data.searches || [],
            };
            setChatMessages(prev => [...prev, assistantMsg]);

            if (data.results?.length > 0) {
                setSmartResults(data.results);
            }
        } catch (err: any) {
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: `Error: ${err.message}`,
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    const ratingColor = (r: string) => {
        if (r === 'HIGH') return 'text-[#00FF41] bg-[#00FF41]/10 border-[#00FF41]/20';
        if (r === 'MEDIUM') return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
        return 'text-gray-400 bg-white/5 border-white/10';
    };

    const ratingLabel = (r: string) => {
        if (r === 'HIGH') return '🔥 RENTABILIDAD ALTA';
        if (r === 'MEDIUM') return '⚡ RENTABILIDAD MEDIA';
        return 'RENTABILIDAD BAJA';
    };

    // Choose which listings to display
    const displayListings = smartResults.length > 0 ? smartResults : listings;
    const isSmartMode = smartResults.length > 0;

    return (
        <main className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-6 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Car className="h-8 w-8 text-blue-400" />
                        Car Search Engine
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Busca oportunidades en Alemania 🇩🇪 para revender en España 🇪🇸 · Ordenado por profit ↓
                    </p>
                </div>
                <button
                    onClick={() => setSmartSearchOpen(!smartSearchOpen)}
                    className={`text-xs font-bold transition-all px-4 py-2.5 rounded-xl flex items-center gap-2 border ${smartSearchOpen
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30'
                            : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border-purple-500/20 hover:border-purple-500/40'
                        }`}
                >
                    <Sparkles className="h-4 w-4" />
                    Smart Search AI
                </button>
            </div>

            {/* Smart Search AI Panel */}
            <AnimatePresence>
                {smartSearchOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-[#1C1C1E] border border-purple-500/20 rounded-2xl overflow-hidden">
                            {/* Chat Header */}
                            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                        <Bot className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">Smart Search AI</p>
                                        <p className="text-[9px] text-gray-500">Describe qué coche buscas y encontraré las mejores oportunidades</p>
                                    </div>
                                </div>
                                <button onClick={() => setSmartSearchOpen(false)} className="text-gray-500 hover:text-white">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Chat Messages */}
                            <div className="max-h-80 overflow-y-auto p-4 space-y-3">
                                {chatMessages.length === 0 && (
                                    <div className="text-center py-4">
                                        <Sparkles className="h-8 w-8 text-purple-500/30 mx-auto mb-2" />
                                        <p className="text-gray-500 text-xs mb-3">Ejemplos de búsqueda inteligente:</p>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {[
                                                'SUV premium con mayor margen de beneficio',
                                                'Coche familiar alemán que se revenda bien en España',
                                                'Porsche o BMW deportivo con buen profit',
                                                'El mejor coche para importar por menos de €35.000',
                                            ].map((suggestion, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => { setChatInput(suggestion); }}
                                                    className="text-[10px] text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg transition-colors border border-purple-500/10"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.role === 'assistant' && (
                                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                                                <Bot className="h-3.5 w-3.5 text-white" />
                                            </div>
                                        )}
                                        <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
                                            <div className={`rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${msg.role === 'user'
                                                    ? 'bg-blue-500/20 text-blue-100 rounded-tr-sm'
                                                    : 'bg-white/5 text-gray-300 rounded-tl-sm'
                                                }`}>
                                                {msg.content}
                                            </div>

                                            {/* Search summary badges */}
                                            {msg.searches && msg.searches.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {msg.searches.map((s, j) => (
                                                        <span key={j} className="text-[8px] bg-purple-500/10 text-purple-400 px-2 py-1 rounded-lg font-mono">
                                                            {s.make.toUpperCase()} {s.model} → {s.found} resultados
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Inline mini results */}
                                            {msg.results && msg.results.length > 0 && (
                                                <div className="space-y-1">
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                                                        Top {Math.min(msg.results.length, 5)} oportunidades:
                                                    </p>
                                                    {msg.results.slice(0, 5).map((r, j) => (
                                                        <a
                                                            key={j}
                                                            href={r.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] rounded-lg px-2.5 py-1.5 border border-white/5 hover:border-white/10 transition-all group"
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <BrandLogo make={r.make} size={14} />
                                                                <span className="text-[10px] text-white font-bold truncate">{r.exactModel || r.title}</span>
                                                                <span className="text-[8px] text-gray-500">{r.year} · €{fmt(r.price)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <span className={`text-[9px] font-mono font-bold ${r.estimatedProfit > 5000 ? 'text-[#00FF41]' : 'text-orange-400'}`}>
                                                                    +€{fmt(r.estimatedProfit)}
                                                                </span>
                                                                <ExternalLink className="h-2.5 w-2.5 text-gray-600 group-hover:text-blue-400" />
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {msg.role === 'user' && (
                                            <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                                <User className="h-3.5 w-3.5 text-blue-400" />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {chatLoading && (
                                    <div className="flex gap-2.5">
                                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                                            <Bot className="h-3.5 w-3.5 text-white" />
                                        </div>
                                        <div className="bg-white/5 rounded-xl px-3.5 py-2.5 rounded-tl-sm">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div className="px-4 py-3 border-t border-white/5">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSmartSearch()}
                                        placeholder="Describe qué coche buscas..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                                    />
                                    <button
                                        onClick={handleSmartSearch}
                                        disabled={chatLoading || !chatInput.trim()}
                                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white rounded-xl px-4 transition-all flex items-center gap-1.5"
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Filters */}
            <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Marca</label>
                        <select
                            value={make}
                            onChange={(e) => {
                                setMake(e.target.value);
                                const models = MODELS[e.target.value];
                                if (models && models.length > 0) setModel(models[0].value);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                        >
                            {MAKES.map(m => (<option key={m.value} value={m.value} className="bg-[#1C1C1E]">{m.label}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Modelo</label>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                        >
                            {(MODELS[make] || []).map(m => (<option key={m.value} value={m.value} className="bg-[#1C1C1E]">{m.label}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Año desde</label>
                        <select
                            value={yearFrom}
                            onChange={(e) => setYearFrom(parseInt(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                        >
                            {YEARS.map(y => (<option key={y} value={y} className="bg-[#1C1C1E]">{y}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">KM máximos</label>
                        <select
                            value={maxKm}
                            onChange={(e) => setMaxKm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                        >
                            {KM_OPTIONS.map(k => (<option key={k.value} value={k.value} className="bg-[#1C1C1E]">{k.label}</option>))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            {loading ? 'Buscando...' : 'Buscar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Smart mode banner */}
            {isSmartMode && (
                <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <span className="text-xs text-purple-300 font-bold">Resultados de Smart Search AI</span>
                        <span className="text-[10px] text-gray-500">{smartResults.length} oportunidades encontradas</span>
                    </div>
                    <button
                        onClick={() => setSmartResults([])}
                        className="text-[10px] text-gray-400 hover:text-white transition-colors"
                    >
                        Volver a búsqueda manual
                    </button>
                </div>
            )}

            {/* Results */}
            {(hasSearched || isSmartMode) && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400">
                            {loading ? 'Buscando...' : `${displayListings.length} resultados encontrados`}
                            {totalFound > displayListings.length && !isSmartMode && ` (${totalFound} total)`}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <TrendingUp className="h-3 w-3" /> Ordenado por profit
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        {displayListings.map((car, i) => {
                            const isExpanded = expanded === car.id;
                            const displayModel = car.exactModel || car.title;
                            return (
                                <motion.div
                                    key={car.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="bg-[#1C1C1E] border border-white/10 rounded-2xl hover:border-white/20 transition-all"
                                >
                                    <div
                                        className="flex items-center justify-between p-5 cursor-pointer"
                                        onClick={() => setExpanded(isExpanded ? null : car.id)}
                                    >
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                <BrandLogo make={car.make} size={24} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-white truncate">{displayModel}</p>
                                                    <FuelBadge fuel={car.fuel} />
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                                                    <span className="font-mono">{car.year}</span>
                                                    {car.mileage && <span>• {car.mileage}</span>}
                                                    {car.location && (
                                                        <span className="flex items-center gap-0.5">
                                                            <MapPin className="h-2.5 w-2.5" />{car.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            {car.price > 0 && (
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-white font-mono">€{fmt(car.price)}</p>
                                                    <div className="flex items-center gap-2 justify-end mt-0.5">
                                                        <span className="text-[10px] text-gray-500 font-mono">imp. €{fmt(car.importCost)}</span>
                                                        {car.estimatedProfit > 0 ? (
                                                            <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${ratingColor(car.profitRating)}`}>
                                                                +€{fmt(car.estimatedProfit)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-mono text-gray-500">sin margen</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                                                    {car.price > 0 && (
                                                        <div className="grid grid-cols-4 gap-3">
                                                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Compra 🇩🇪</p>
                                                                <p className="text-xl font-black text-white font-mono">€{fmt(car.price)}</p>
                                                            </div>
                                                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center">
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Importar</p>
                                                                <p className="text-xl font-black text-white font-mono">€{fmt(car.importCost)}</p>
                                                            </div>
                                                            <div className="bg-[#00FF41]/10 border border-[#00FF41]/20 rounded-xl p-3 text-center">
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Venta 🇪🇸</p>
                                                                <p className="text-xl font-black text-[#00FF41] font-mono">€{fmt(car.estimatedESPrice)}</p>
                                                            </div>
                                                            <div className={`border rounded-xl p-3 text-center ${ratingColor(car.profitRating)}`}>
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Beneficio</p>
                                                                <p className="text-xl font-black font-mono">+€{fmt(car.estimatedProfit)}</p>
                                                                <p className="text-[9px] mt-0.5">{ratingLabel(car.profitRating)}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <a
                                                        href={car.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 text-sm font-bold transition-colors w-full"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                        Ver anuncio en {car.source === 'autoscout24' ? 'AutoScout24.de' : 'Mobile.de'}
                                                    </a>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>

                    {displayListings.length === 0 && !loading && !error && (
                        <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-12 text-center">
                            <Car className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">No se encontraron anuncios con estos filtros</p>
                            <p className="text-gray-600 text-xs mt-1">Prueba con otros parámetros o usa Smart Search AI</p>
                        </div>
                    )}
                </div>
            )}

            {/* Initial State */}
            {!hasSearched && !isSmartMode && (
                <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-16 text-center">
                    <Search className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-400 mb-2">Busca tu oportunidad</h2>
                    <p className="text-gray-600 text-sm max-w-md mx-auto mb-4">
                        Selecciona marca, modelo, año y kilómetros máximos para encontrar las mejores ofertas en Alemania con análisis de rentabilidad para reventa en España.
                    </p>
                    <button
                        onClick={() => setSmartSearchOpen(true)}
                        className="text-sm text-purple-400 hover:text-purple-300 font-bold flex items-center gap-2 mx-auto transition-colors"
                    >
                        <Sparkles className="h-4 w-4" /> O prueba Smart Search AI
                    </button>
                </div>
            )}
        </main>
    );
}
