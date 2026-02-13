'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

const ApeChat: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages }),
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (err: any) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Error: ${err.message}`,
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Ape Button */}
            <AnimatePresence>
                {!open && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setOpen(true)}
                        className="fixed bottom-6 right-6 z-50 group"
                    >
                        <div className="relative">
                            {/* Glow ring */}
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-md opacity-40 group-hover:opacity-70 transition-opacity scale-110" />
                            {/* Avatar */}
                            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-purple-500/50 hover:border-purple-400 transition-all shadow-lg shadow-purple-500/20">
                                <img
                                    src="/ape-avatar.png?v=3"
                                    alt="Ape AI"
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            {/* Online dot */}
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#00FF41] rounded-full border-2 border-[#0D0D0F]" />
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-[#0D0D0F] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-[#1C1C1E]">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg overflow-hidden border border-purple-500/30">
                                    <img
                                        src="/ape-avatar.png?v=3"
                                        alt="Ape AI"
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">APE Intelligence</p>
                                    <p className="text-[9px] text-[#00FF41] flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41] inline-block" />
                                        Online · Gemini Pro
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                                    <Minimize2 className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                            {messages.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3 border border-purple-500/20">
                                        <img
                                            src="/ape-avatar.png?v=3"
                                            alt="Ape AI"
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <p className="text-sm font-bold text-white mb-1">¿Qué necesitas, Comandante?</p>
                                    <p className="text-[10px] text-gray-500 max-w-[250px] mx-auto">
                                        Puedo ayudarte con trading, análisis de mercado, ideas de negocio, importación de coches y más.
                                    </p>
                                    <div className="mt-4 space-y-1.5">
                                        {[
                                            '¿Cuál es el mejor momento para comprar BTC?',
                                            'Analiza el mercado de coches premium hoy',
                                            'Dame ideas para generar €5k este mes',
                                        ].map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setInput(s)}
                                                className="w-full text-left text-[10px] text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] px-3 py-2 rounded-lg border border-white/5 hover:border-white/10 transition-all"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 mt-0.5 border border-purple-500/20">
                                            <img src="/ape-avatar.png?v=3" alt="Ape" className="object-cover w-full h-full" />
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-500/20 text-blue-100 rounded-br-sm'
                                        : 'bg-white/5 text-gray-300 rounded-bl-sm'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex gap-2">
                                    <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 border border-purple-500/20">
                                        <img src="/ape-avatar.png?v=3" alt="Ape" className="object-cover w-full h-full" />
                                    </div>
                                    <div className="bg-white/5 rounded-xl px-3 py-2 rounded-bl-sm">
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="px-3 py-3 border-t border-white/5 bg-[#1C1C1E]">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Escribe un mensaje..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={loading || !input.trim()}
                                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-40 text-white rounded-xl px-3 transition-all"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ApeChat;
