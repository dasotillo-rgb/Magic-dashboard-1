'use client';

import { useState, useEffect, useRef } from 'react';
import { CloudRain, AlertTriangle, CheckCircle2, Terminal, Radio, Moon, RefreshCw } from 'lucide-react';

interface WeatherApiResponse {
    logs: string[];
    is_demo?: boolean;
    fetched_at?: number;
}

// Extract a timestamp from a log line "2026-02-20 14:34:49,056 - ..."
function parseLogDate(line: string): Date | null {
    const m = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    if (!m) return null;
    return new Date(m[1].replace(' ', 'T'));
}

// Returns how many minutes ago the last log was
function minutesAgo(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / 60000);
}

export function WeatherFarmerWidget() {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);
    const [lastLogDate, setLastLogDate] = useState<Date | null>(null);
    const [staleMins, setStaleMins] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/trading/weather', { cache: 'no-store' });
            if (res.ok) {
                const json: WeatherApiResponse = await res.json();
                const newLogs = json.logs || [];
                setLogs(newLogs);
                setIsDemo(json.is_demo ?? false);

                // Find the timestamp of the last meaningful log
                for (let i = newLogs.length - 1; i >= 0; i--) {
                    const d = parseLogDate(newLogs[i]);
                    if (d) { setLastLogDate(d); break; }
                }
            }
        } catch (error) {
            console.error('Failed to fetch weather logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Update staleness counter every minute
    useEffect(() => {
        const tick = () => {
            if (lastLogDate) setStaleMins(minutesAgo(lastLogDate));
        };
        tick();
        const iv = setInterval(tick, 60000);
        return () => clearInterval(iv);
    }, [lastLogDate]);

    // Auto-scroll to bottom on new logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Bot is considered sleeping if last log is > 10 minutes old
    const botSleeping = !isDemo && lastLogDate && staleMins > 10;
    // Estimate next wake: APE-WEATHER sleeps 3600s = 60 min cycles
    const nextWakeMins = botSleeping ? Math.max(0, 60 - (staleMins % 60)) : null;

    const formatLogLine = (line: string) => {
        if (!line || typeof line !== 'string') return null;
        const isSignalReal = line.includes('[SEÑAL REAL]');
        const isPolygon = line.includes('EJECUTANDO EN POLYGON');
        const isAlertFuerte = line.includes('[SEÑAL FUERTE]');
        const isAction = line.includes('EJECUTANDO');
        const isWeatherReal = line.includes('[WEATHER-REAL]');

        const highlight = isSignalReal || isPolygon;
        const warning = isAlertFuerte;
        const exec = isAction && !highlight;

        return (
            <div className={`
                py-1 px-2 border-l-2 text-[10px] font-mono mb-1 rounded-r transition-all
                ${highlight ? 'border-green-500 bg-green-500/15 text-green-200 font-bold' : ''}
                ${warning && !highlight ? 'border-yellow-500 bg-yellow-500/10 text-yellow-200' : ''}
                ${exec && !highlight ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200 font-bold' : ''}
                ${isWeatherReal && !highlight && !warning && !exec ? 'border-blue-500/50 text-blue-200/80' : ''}
                ${!highlight && !warning && !exec && !isWeatherReal ? 'border-transparent text-white/40 hover:bg-white/5' : ''}
            `}>
                <div className="flex gap-2 items-start">
                    {(isSignalReal || isPolygon) && <Radio className="h-3 w-3 text-green-400 shrink-0 mt-0.5 animate-pulse" />}
                    {warning && !highlight && <AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0 mt-0.5" />}
                    {exec && !highlight && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />}
                    <span className="break-all whitespace-pre-wrap leading-relaxed">{line}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-black/40 border border-white/10 rounded-xl backdrop-blur-sm h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex flex-row items-center justify-between p-4 pb-2 border-b border-white/5">
                <h3 className="text-sm font-light tracking-wider text-blue-200 flex items-center gap-2">
                    <CloudRain className="h-4 w-4 text-blue-400" />
                    WEATHER FARMER
                </h3>
                <div className="flex items-center gap-2">
                    {isDemo && (
                        <span className="text-[8px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full">
                            DEMO
                        </span>
                    )}
                    {botSleeping && (
                        <span className="text-[8px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Moon className="h-2.5 w-2.5" />
                            DURMIENDO ~{nextWakeMins}min
                        </span>
                    )}
                    <Terminal className="h-3 w-3 text-white/20" />
                    {botSleeping ? (
                        <span className="text-[10px] text-indigo-400">● SLEEP</span>
                    ) : (
                        <span className="text-[10px] text-green-500 animate-pulse">● LIVE</span>
                    )}
                    <button onClick={fetchData} className="text-white/30 hover:text-white transition-colors" title="Forzar actualización">
                        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Sleep banner */}
            {botSleeping && (
                <div className="mx-2 mt-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center gap-2 text-[10px] text-indigo-300">
                    <Moon className="h-3.5 w-3.5 shrink-0" />
                    <span>
                        APE-WEATHER en ciclo de espera · Último ciclo hace <strong>{staleMins}min</strong> ·
                        Próximo despertar en ~<strong>{nextWakeMins}min</strong>
                    </span>
                </div>
            )}

            {/* Log feed */}
            <div className="p-2 flex-1 overflow-hidden">
                <div
                    ref={scrollRef}
                    className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1"
                >
                    {logs.length > 0 ? (
                        logs.map((log, i) => (
                            <div key={i}>{formatLogLine(log)}</div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-white/20 text-xs gap-2">
                            <span className="animate-pulse">
                                {loading ? 'Conectando al servidor...' : 'Listening for weather signals...'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer: last log time */}
            {lastLogDate && (
                <div className="px-3 py-1.5 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[8px] text-gray-600 font-mono">
                        Último log: {lastLogDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className={`text-[8px] font-mono ${staleMins > 10 ? 'text-indigo-500' : 'text-green-600'}`}>
                        {staleMins > 0 ? `hace ${staleMins}min` : 'ahora'}
                    </span>
                </div>
            )}
        </div>
    );
}
