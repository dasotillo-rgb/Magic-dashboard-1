'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Brain, Send, Loader2, Sparkles, User, Trash2 } from 'lucide-react';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export default function BrainChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        const userMessage: Message = { role: 'user', content: trimmed };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMessages }),
            });

            if (!res.ok) {
                throw new Error('Error en la conexión con Gemini');
            }

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (err: any) {
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: `⚠️ Error: ${err.message}. Verifica tu API key de Gemini.` },
            ]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
    };

    return (
        <main className="p-6 lg:p-10 max-w-[1600px] mx-auto flex flex-col h-screen">
            {/* Header */}
            <header className="flex items-center justify-between mb-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Brain className="h-8 w-8 text-purple-400" />
                        Brain Chat
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Conectado a Gemini 2.0 Flash
                        <span className="inline-block w-2 h-2 rounded-full bg-[#00FF41] ml-2 animate-pulse align-middle" />
                    </p>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={clearChat}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
                        title="Limpiar chat"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                )}
            </header>

            {/* Chat Area */}
            <div className="flex-1 bg-[#1C1C1E]/60 border border-white/10 rounded-[2rem] flex flex-col overflow-hidden min-h-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <Sparkles className="h-16 w-16 text-purple-400/30 mb-4" />
                            <h2 className="text-xl font-bold text-white/50 mb-2">APE Intelligence</h2>
                            <p className="text-sm text-gray-500 max-w-md">
                                Tu co-piloto de inteligencia artificial. Pregúntame sobre trading, estrategias, análisis de mercado, o lo que necesites.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-6 justify-center">
                                {[
                                    '¿Qué opinas de BTC a corto plazo?',
                                    'Explícame la estrategia DCA',
                                    '¿Cómo funciona el arbitraje?',
                                ].map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onClick={() => {
                                            setInput(suggestion);
                                            inputRef.current?.focus();
                                        }}
                                        className="px-3 py-1.5 text-xs text-gray-400 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:text-white transition-all"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                    <Sparkles className="h-4 w-4 text-purple-400" />
                                </div>
                            )}
                            <div
                                className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                        ? 'bg-[#00FF41]/15 text-white rounded-br-md'
                                        : 'bg-white/5 text-gray-200 rounded-bl-md border border-white/5'
                                    }`}
                            >
                                {msg.content}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-[#00FF41]/20 flex items-center justify-center flex-shrink-0 mt-1">
                                    <User className="h-4 w-4 text-[#00FF41]" />
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="h-4 w-4 text-purple-400" />
                            </div>
                            <div className="px-4 py-3 bg-white/5 rounded-2xl rounded-bl-md border border-white/5">
                                <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-end gap-3">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribe un mensaje..."
                            rows={1}
                            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all max-h-32"
                            style={{ minHeight: '44px' }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || loading}
                            className="p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl transition-all flex-shrink-0"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
