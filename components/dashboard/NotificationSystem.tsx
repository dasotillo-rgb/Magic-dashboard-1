'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Car, TrendingUp, Zap, Bell, ExternalLink, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

type NotificationType = 'car' | 'crypto' | 'business' | 'signal';

type Notification = {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    time: string;
    read: boolean;
    actionUrl?: string;
    actionLabel?: string;
    isExternal?: boolean;
};

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string; bg: string; border: string }> = {
    car: { icon: Car, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    crypto: { icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    business: { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    signal: { icon: Radio, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
};

// Fallback pool used ONLY when the remote server is unavailable
const FALLBACK_POOL: Omit<Notification, 'id' | 'time' | 'read'>[] = [
    { type: 'car', title: '🚗 Deal detectado!', body: 'BMW X3 xDrive20i 2022 · Profit estimado €8.200', actionUrl: '/cars?make=bmw&model=x3&yearFrom=2022&maxKm=80000', actionLabel: 'Ver Resultados' },
    { type: 'car', title: '🚗 Nueva oportunidad', body: 'Mercedes GLC 300 2023 · Profit €6.750', actionUrl: 'https://suchen.mobile.de/fahrzeuge/search.html?dam=0&isSearchRequest=true&ms=17200;48;&vc=Car', actionLabel: 'Ver en Mobile.de', isExternal: true },
    { type: 'crypto', title: '📈 Señal BTC/USDT', body: 'RSI cruzó 30 — posible entrada LONG en zona de $68.500', actionUrl: '/trading', actionLabel: 'Ver Gráfico' },
    { type: 'crypto', title: '📊 Fear & Greed cambió', body: 'Índice subió de 5 (Extreme Fear) a 15 (Fear)', actionUrl: '/trading', actionLabel: 'Ver Mercado' },
    { type: 'business', title: '💡 Oportunidad detectada', body: 'Demanda alta de AI wrappers para inmobiliarias', actionUrl: '/projects', actionLabel: 'Ver Plan' },
];

// Keywords that trigger a real notification from weather logs
const SIGNAL_KEYWORDS = ['[SEÑAL REAL]', 'EJECUTANDO EN POLYGON'];

const getTodayPrefix = () => new Date().toISOString().slice(0, 10); // "2026-02-20"

const NotificationSystem: React.FC = () => {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [panelOpen, setPanelOpen] = useState(false);
    const [toast, setToast] = useState<Notification | null>(null);
    const [serverOnline, setServerOnline] = useState<boolean | null>(null);

    // Stores hashes of log lines already shown as notifications (persisted in memory per session)
    const seenLinesRef = useRef<Set<string>>(new Set());

    const unreadCount = notifications.filter(n => !n.read).length;

    // Add a new notification and show toast
    const addNotification = useCallback((notif: Omit<Notification, 'id' | 'time' | 'read'>) => {
        const newNotif: Notification = {
            ...notif,
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            read: false,
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 30));
        setToast(newNotif);
    }, []);

    // Poll weather log endpoint for real signals
    const pollWeatherLog = useCallback(async () => {
        try {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 6000);
            const res = await fetch('/api/trading/weather', { cache: 'no-store', signal: controller.signal });
            clearTimeout(tid);

            if (!res.ok) {
                setServerOnline(false);
                return;
            }

            const json = await res.json();
            setServerOnline(true);

            const logs: string[] = json.logs || [];
            const todayPrefix = getTodayPrefix();

            // Only consider logs from today
            const todayLogs = logs.filter(line => line.includes(todayPrefix));

            let newSignalFound = false;
            for (const line of todayLogs) {
                const isSignal = SIGNAL_KEYWORDS.some(kw => line.includes(kw));
                if (!isSignal) continue;

                // Deduplicate by exact line content
                if (seenLinesRef.current.has(line)) continue;
                seenLinesRef.current.add(line);
                newSignalFound = true;

                const isReal = line.includes('[SEÑAL REAL]');
                const isExec = line.includes('EJECUTANDO EN POLYGON');

                // Parse a short description from the log line
                const shortBody = line.replace(/^\[.*?\]\s*/, '').slice(0, 100);

                addNotification({
                    type: 'signal',
                    title: isExec
                        ? '⚡ ORDEN EJECUTADA EN POLYGON'
                        : '🟢 SEÑAL REAL DETECTADA',
                    body: shortBody,
                    actionUrl: '/trading',
                    actionLabel: 'Ver Trading Lab',
                });
            }
        } catch {
            // Server unreachable — use fallback
            setServerOnline(prev => {
                if (prev !== false) {
                    // First failure: fire a single fallback notification
                    const template = FALLBACK_POOL[Math.floor(Math.random() * FALLBACK_POOL.length)];
                    addNotification(template);
                }
                return false;
            });
        }
    }, [addNotification]);

    // Poll real signals every 30s
    useEffect(() => {
        pollWeatherLog(); // immediate first call
        const interval = setInterval(pollWeatherLog, 30000);
        return () => clearInterval(interval);
    }, [pollWeatherLog]);

    // When server is confirmed offline, run fallback pool at a slower cadence (60s)
    useEffect(() => {
        if (serverOnline !== false) return;
        const interval = setInterval(() => {
            const template = FALLBACK_POOL[Math.floor(Math.random() * FALLBACK_POOL.length)];
            addNotification(template);
        }, 60000);
        return () => clearInterval(interval);
    }, [serverOnline, addNotification]);

    // Auto-dismiss toast after 6s
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 6000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    const removeNotification = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleNotificationClick = (notification: Notification) => {
        if (notification.actionUrl) {
            if (notification.isExternal) {
                window.open(notification.actionUrl, '_blank');
            } else {
                router.push(notification.actionUrl);
            }
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
            if (toast?.id === notification.id) setToast(null);
            if (panelOpen) setPanelOpen(false);
        }
    };

    return (
        <>
            {/* Toast */}
            <AnimatePresence>
                {toast && !panelOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, y: 10 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: 20, y: 10 }}
                        className="fixed bottom-24 right-6 z-[60] max-w-[300px]"
                    >
                        <div className="relative bg-[#1C1C1E] border border-white/10 rounded-xl p-3 shadow-2xl shadow-black/50">
                            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-[#1C1C1E] border-r border-b border-white/10 transform rotate-45" />
                            <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-purple-500/30">
                                    <img src="/ape-avatar.png?v=3" alt="Ape" className="object-cover w-full h-full" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-white">{toast.title}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{toast.body}</p>
                                    {toast.actionLabel && (
                                        <button
                                            onClick={() => handleNotificationClick(toast)}
                                            className="mt-2 text-[9px] font-bold bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-md transition-colors flex items-center gap-1.5"
                                        >
                                            {toast.actionLabel}
                                            <ExternalLink className="w-2.5 h-2.5" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setToast(null); }}
                                    className="text-gray-600 hover:text-white transition-colors shrink-0"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bell button */}
            {unreadCount > 0 && (
                <button
                    onClick={() => setPanelOpen(!panelOpen)}
                    className="fixed bottom-[72px] right-5 z-[55]"
                >
                    <div className="relative">
                        <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                            <Bell className="h-3 w-3 text-red-400" />
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </div>
                </button>
            )}

            {/* Notification panel */}
            <AnimatePresence>
                {panelOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-[55] w-[340px] max-h-[480px] bg-[#0D0D0F] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-[#1C1C1E]">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md overflow-hidden border border-purple-500/20">
                                    <img src="/ape-avatar.png?v=3" alt="Ape" className="object-cover w-full h-full" />
                                </div>
                                <h3 className="text-xs font-bold text-white">Notificaciones</h3>
                                {unreadCount > 0 && (
                                    <span className="text-[8px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">{unreadCount} nuevas</span>
                                )}
                                {/* Server status indicator */}
                                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full border ${serverOnline === true ? 'bg-green-500/10 border-green-500/20 text-green-400' : serverOnline === false ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                                    {serverOnline === true ? '● LIVE' : serverOnline === false ? '● OFFLINE' : '● —'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} className="text-[9px] text-gray-500 hover:text-white transition-colors">
                                        Marcar todo leído
                                    </button>
                                )}
                                <button onClick={() => setPanelOpen(false)} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="text-center py-8">
                                    <Bell className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                                    <p className="text-xs text-gray-500">Sin notificaciones</p>
                                    <p className="text-[9px] text-gray-600 mt-1 font-mono">Esperando señales del servidor...</p>
                                </div>
                            ) : (
                                notifications.map(notif => {
                                    const cfg = typeConfig[notif.type];
                                    const Icon = cfg.icon;
                                    return (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`px-3 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors flex items-start gap-2.5 group cursor-pointer ${!notif.read ? 'bg-white/[0.02]' : ''}`}
                                        >
                                            <div className={`w-7 h-7 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0 mt-0.5`}>
                                                <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-[11px] font-bold text-white truncate">{notif.title}</p>
                                                    {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <p className="text-[8px] text-gray-600 font-mono">{notif.time}</p>
                                                    {notif.actionLabel && (
                                                        <span className="text-[8px] text-white/40 group-hover:text-white/80 transition-colors flex items-center gap-0.5">
                                                            {notif.actionLabel} <ExternalLink className="w-2 h-2" />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => removeNotification(notif.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/5 text-gray-600 hover:text-white transition-all shrink-0"
                                            >
                                                <X className="h-2.5 w-2.5" />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default NotificationSystem;
