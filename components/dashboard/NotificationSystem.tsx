'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Car, TrendingUp, Zap, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

type NotificationType = 'car' | 'crypto' | 'business';

type Notification = {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    time: string;
    read: boolean;
};

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string; bg: string; border: string }> = {
    car: { icon: Car, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    crypto: { icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    business: { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
};

// Simulated notifications pool — in production this would come from WebSocket/SSE
const NOTIFICATION_POOL: Omit<Notification, 'id' | 'time' | 'read'>[] = [
    { type: 'car', title: '🚗 Deal detectado!', body: 'BMW X3 xDrive20i 2022 · Profit estimado €8.200' },
    { type: 'car', title: '🚗 Nueva oportunidad', body: 'Mercedes GLC 300 2023 · Profit €6.750' },
    { type: 'car', title: '🚗 Hot deal!', body: 'Audi Q5 Sportback 2022 · Profit €9.100' },
    { type: 'car', title: '🚗 Alerta de precio', body: 'Porsche Macan 2023 bajó €4.000 en AutoScout24' },
    { type: 'crypto', title: '📈 Señal BTC/USDT', body: 'RSI cruzó 30 — posible entrada LONG en zona de $68.500' },
    { type: 'crypto', title: '📊 Fear & Greed cambió', body: 'Índice subió de 5 (Extreme Fear) a 15 (Fear)' },
    { type: 'crypto', title: '🔔 Alerta SOL', body: 'Solana rompió resistencia de $85 — target $92' },
    { type: 'crypto', title: '⚡ Liquidación masiva', body: '$142M en longs liquidados en BTC últimas 4h' },
    { type: 'business', title: '💡 Oportunidad detectada', body: 'Demanda alta de AI wrappers para inmobiliarias — nichos disponibles' },
    { type: 'business', title: '🔥 Trending en RapidAPI', body: 'Las APIs de precios de coches están en top 10 de búsquedas' },
    { type: 'business', title: '💰 Revenue update', body: 'Canal Telegram en nicho trading alcanzó 500 subs en 3 días' },
    { type: 'business', title: '🚀 Tendencia TikTok', body: '#ImportarCochesDeAlemania tiene 2.3M views esta semana' },
];

const NotificationSystem: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [panelOpen, setPanelOpen] = useState(false);
    const [toast, setToast] = useState<Notification | null>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Simulate push notification generation
    const addNotification = useCallback(() => {
        const randomTemplate = NOTIFICATION_POOL[Math.floor(Math.random() * NOTIFICATION_POOL.length)];
        const newNotif: Notification = {
            ...randomTemplate,
            id: `notif-${Date.now()}`,
            time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            read: false,
        };

        setNotifications(prev => [newNotif, ...prev].slice(0, 20));
        setToast(newNotif);
    }, []);

    // Periodic notification generation (every 30-90 seconds)
    useEffect(() => {
        // Initial notification after 10 seconds
        const firstTimer = setTimeout(addNotification, 10000);

        // Then periodic
        const interval = setInterval(() => {
            addNotification();
        }, 30000 + Math.random() * 60000);

        return () => {
            clearTimeout(firstTimer);
            clearInterval(interval);
        };
    }, [addNotification]);

    // Auto-dismiss toast after 5s
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <>
            {/* Toast notification (speech bubble from ape) */}
            <AnimatePresence>
                {toast && !panelOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, y: 10 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: 20, y: 10 }}
                        className="fixed bottom-24 right-6 z-[60] max-w-[300px]"
                    >
                        <div className="relative bg-[#1C1C1E] border border-white/10 rounded-xl p-3 shadow-2xl shadow-black/50">
                            {/* Speech bubble arrow */}
                            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-[#1C1C1E] border-r border-b border-white/10 transform rotate-45" />

                            <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-purple-500/30">
                                    <img src="/ape-avatar.png?v=3" alt="Ape" className="object-cover w-full h-full" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-white">{toast.title}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{toast.body}</p>
                                </div>
                                <button
                                    onClick={() => setToast(null)}
                                    className="text-gray-600 hover:text-white transition-colors shrink-0"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notification bell icon (top-right area of the ape button) */}
            {unreadCount > 0 && (
                <button
                    onClick={() => setPanelOpen(!panelOpen)}
                    className="fixed bottom-[72px] right-5 z-[55] "
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
                        className="fixed bottom-6 right-6 z-[55] w-[340px] max-h-[460px] bg-[#0D0D0F] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
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

                        {/* Notification list */}
                        <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="text-center py-8">
                                    <Bell className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                                    <p className="text-xs text-gray-500">Sin notificaciones</p>
                                </div>
                            ) : (
                                notifications.map(notif => {
                                    const cfg = typeConfig[notif.type];
                                    const Icon = cfg.icon;

                                    return (
                                        <div
                                            key={notif.id}
                                            className={`px-3 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors flex items-start gap-2.5 group ${!notif.read ? 'bg-white/[0.02]' : ''
                                                }`}
                                        >
                                            <div className={`w-7 h-7 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0 mt-0.5`}>
                                                <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-[11px] font-bold text-white truncate">{notif.title}</p>
                                                    {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{notif.body}</p>
                                                <p className="text-[8px] text-gray-600 mt-1 font-mono">{notif.time}</p>
                                            </div>
                                            <button
                                                onClick={() => removeNotification(notif.id)}
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
