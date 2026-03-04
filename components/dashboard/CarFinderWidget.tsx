'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ExternalLink, ChevronDown, ChevronUp, MapPin, TrendingUp } from 'lucide-react';
import Link from 'next/link';

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
    cochesNetUrl?: string;
};

type Props = {
    borderColor?: string;
};

// Proper BMW Roundel SVG
const BMWRoundel = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="31" fill="#1C1C1E" stroke="#fff" strokeWidth="2" />
        <circle cx="32" cy="32" r="26" fill="none" stroke="#fff" strokeWidth="2" />
        <path d="M32 6 A26 26 0 0 1 58 32 L32 32 Z" fill="#318CE7" />
        <path d="M58 32 A26 26 0 0 1 32 58 L32 32 Z" fill="#fff" />
        <path d="M32 58 A26 26 0 0 1 6 32 L32 32 Z" fill="#318CE7" />
        <path d="M6 32 A26 26 0 0 1 32 6 L32 32 Z" fill="#fff" />
    </svg>
);

const fmt = (n: number) => n.toLocaleString('de-DE');

const CarFinderWidget: React.FC<Props> = ({ borderColor = 'border-blue-500/20' }) => {
    const [listings, setListings] = useState<CarListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Define target models to scan for opportunities (2020+ with Sport packages)
            const targets = [
                { make: 'bmw', model: 'x3', year: 2020, extras: 'M Sport' },
                { make: 'bmw', model: '3er', year: 2020, extras: '330e M Sport' }, // Hybrid + Sport
                { make: 'mercedes-benz', model: 'suv', year: 2020, extras: 'AMG' }, // All SUVs
                { make: 'audi', model: 'q5', year: 2020, extras: 'S Line' },
            ];

            // Fetch all in parallel
            const promises = targets.map(t =>
                fetch(`/api/cars?make=${t.make}&model=${t.model}&yearFrom=${t.year}&maxKm=130000${t.extras ? `&extras=${encodeURIComponent(t.extras)}` : ''}`)
                    .then(res => res.json())
                    .then(data => data.listings || [])
                    .catch(() => [])
            );

            const results = await Promise.all(promises);
            const allListings = results.flat();

            // Filter for high profit and sort by profit desc
            // Lowered profit threshold slightly to catch more "quick flip" deals
            const profitable = allListings
                .filter((l: CarListing) => l.estimatedProfit >= 500)
                .sort((a: CarListing, b: CarListing) => b.estimatedProfit - a.estimatedProfit)
                .slice(0, 25);

            setListings(profitable);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching car data:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        // 6 hours = 1000 * 60 * 60 * 6 = 21600000 ms
        const iv = setInterval(fetchData, 21600000);
        return () => clearInterval(iv);
    }, []);

    const bestProfit = listings.length > 0 ? Math.max(...listings.map(l => l.estimatedProfit)) : 0;

    return (
        <div className={`bg-[#1C1C1E]/60 border ${borderColor} rounded-[2rem] p-5 flex flex-col h-full transition-all hover:bg-white/5 overflow-hidden`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <BMWRoundel size={18} />
                    <h3 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">Top Deals 🇩🇪</h3>
                    {bestProfit > 0 && (
                        <span className="text-[9px] font-bold font-mono text-[#00FF41] bg-[#00FF41]/10 px-1.5 py-0.5 rounded">
                            best +€{fmt(bestProfit)}
                        </span>
                    )}
                </div>
                <button onClick={fetchData} className="text-gray-500 hover:text-white transition-colors">
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Subtitle */}
            <p className="text-[9px] text-gray-600 mb-2.5">Oportunidades Premium (2020+) · Sport/AMG/S-Line</p>

            {/* Listings — show ALL, CollapsibleWidget handles the clipping */}
            <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {loading && listings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6">
                        <RefreshCw className="h-5 w-5 text-gray-600 animate-spin mb-2" />
                        <p className="text-gray-500 text-[10px] font-mono">Buscando oportunidades...</p>
                    </div>
                ) : (
                    <>
                        {listings.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-4">
                                <p className="text-gray-500 text-[10px] font-mono mb-2">Sin resultados altos en AS24</p>
                            </div>
                        )}

                        {listings.map((car, i) => {
                            const isExp = expanded === car.id;
                            const displayModel = car.exactModel || car.title;
                            return (
                                <motion.div
                                    key={car.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="bg-white/[0.03] rounded-lg border border-white/5 hover:border-white/10 transition-all"
                                >
                                    <div
                                        className="flex items-center justify-between px-2.5 py-2 cursor-pointer gap-2"
                                        onClick={() => setExpanded(isExp ? null : car.id)}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <BMWRoundel size={14} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-bold text-white truncate leading-tight">{displayModel}</p>
                                                <div className="flex items-center gap-1.5 text-[8px] text-gray-500 mt-px">
                                                    <span>{car.year}</span>
                                                    {car.mileage && <span>· {car.mileage}</span>}
                                                    {car.location && (
                                                        <span className="flex items-center gap-0.5">
                                                            <MapPin className="h-2 w-2" />{car.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 flex flex-col items-end">
                                            {car.price > 0 && (
                                                <p className="text-[10px] font-bold text-white font-mono">€{fmt(car.price)}</p>
                                            )}
                                            <p className={`text-[9px] font-mono font-bold ${car.estimatedProfit > 5000 ? 'text-[#00FF41]' : 'text-orange-400'
                                                }`}>+€{fmt(car.estimatedProfit)}</p>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExp && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-2.5 pb-2.5 space-y-1.5 border-t border-white/5 pt-1.5">
                                                    {car.price > 0 && (
                                                        <div className="grid grid-cols-4 gap-1 text-[8px]">
                                                            <div className="bg-blue-500/10 rounded p-1.5 text-center">
                                                                <p className="text-gray-500 text-[7px]">🇩🇪 Compra</p>
                                                                <p className="text-white font-mono font-bold">€{fmt(car.price)}</p>
                                                            </div>
                                                            <div className="bg-orange-500/10 rounded p-1.5 text-center">
                                                                <p className="text-gray-500 text-[7px]">Import</p>
                                                                <p className="text-white font-mono font-bold">€{fmt(car.importCost)}</p>
                                                            </div>
                                                            <div className="bg-[#00FF41]/10 rounded p-1.5 text-center">
                                                                <p className="text-gray-500 text-[7px]">🇪🇸 Venta</p>
                                                                <p className="text-[#00FF41] font-mono font-bold">€{fmt(car.estimatedESPrice)}</p>
                                                            </div>
                                                            <div className={`rounded p-1.5 text-center ${car.estimatedProfit > 5000 ? 'bg-[#00FF41]/10' : 'bg-orange-500/10'}`}>
                                                                <p className="text-gray-500 text-[7px]">Profit</p>
                                                                <p className={`font-mono font-bold ${car.estimatedProfit > 5000 ? 'text-[#00FF41]' : 'text-orange-400'}`}>+€{fmt(car.estimatedProfit)}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <a
                                                            href={car.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 flex items-center justify-center gap-1 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded py-1.5 text-[9px] font-bold transition-colors"
                                                        >
                                                            <ExternalLink className="h-2.5 w-2.5" /> Ver anuncio
                                                        </a>
                                                        {car.cochesNetUrl && (
                                                            <a
                                                                href={car.cochesNetUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex-1 flex items-center justify-center gap-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded py-1.5 text-[9px] font-bold transition-colors"
                                                            >
                                                                <ExternalLink className="h-2.5 w-2.5" /> Comparar ES
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}

                        {/* Mobile.de Quick Link Card */}
                        <a
                            href="https://suchen.mobile.de/fahrzeuge/search.html?dam=0&isSearchRequest=true&vc=Car&categories=OffRoad&minFirstRegistrationDate=2020&minPrice=20000"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-orange-500/[0.05] rounded-lg border border-orange-500/20 hover:bg-orange-500/10 transition-all p-2.5 flex items-center justify-between group cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-[8px] font-bold text-black">M</div>
                                <div>
                                    <p className="text-[10px] font-bold text-orange-200">Buscar en Mobile.de</p>
                                    <p className="text-[8px] text-orange-500/60">Ver ofertas adicionales</p>
                                </div>
                            </div>
                            <ExternalLink className="h-3 w-3 text-orange-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </a>
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[8px] text-gray-600 font-mono">
                    {listings.length} oportunidades · profit ↓
                    {lastUpdated && <> · <span className="text-gray-700">act. {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span></>}
                </span>
                <Link
                    href="/cars"
                    className="text-[9px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-0.5 transition-colors"
                >
                    Buscador <ChevronDown className="h-2.5 w-2.5 -rotate-90" />
                </Link>
            </div>
        </div>
    );
};

export default CarFinderWidget;
