'use client';

import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, AlertCircle, Key, Lock, Activity } from 'lucide-react';

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Load from cookies on mount
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
        };
        setApiKey(getCookie('pionex_api_key') || '');
        setApiSecret(getCookie('pionex_api_secret') || '');
    }, []);

    const saveSettings = async () => {
        setLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            // 1. Save to cookies (Client-side for now, valid for 30 days)
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);
            document.cookie = `pionex_api_key=${apiKey}; expires=${expiry.toUTCString()}; path=/; SameSite=Strict`;
            document.cookie = `pionex_api_secret=${apiSecret}; expires=${expiry.toUTCString()}; path=/; SameSite=Strict`;

            // 2. Test Connection
            const res = await fetch('/api/pionex/balances');
            const data = await res.json();

            if (data.error) {
                // If it's just "Failed to fetch balances" it might be auth, but let's assume valid JSON means we hit the API.
                // However, without keys, it throws "Missing API Credentials".
                throw new Error(data.error);
            }

            setStatus('success');
            setMessage('Connection Successful! Balances retrieved.');
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setMessage(err.message || 'Failed to connect. Check keys.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#09090B] text-gray-100 font-sans overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Header */}
                <header className="h-[60px] border-b border-[#27272A] bg-[#18181B] flex items-center justify-between px-6 flex-shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Activity size={18} />
                        </div>
                        <h1 className="text-lg font-medium text-white">System Configuration</h1>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-2xl mx-auto space-y-8">

                        {/* API Keys Section */}
                        <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#27272A] bg-[#1C1C1E]">
                                <h2 className="text-base font-medium text-white flex items-center gap-2">
                                    <Key size={18} className="text-indigo-400" />
                                    Pionex API Configuration
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Connect your account to enable trading and balance monitoring.
                                </p>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 font-medium">API Key</label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-2.5 text-gray-600" size={16} />
                                        <input
                                            type="text"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            className="w-full bg-[#09090B] border border-[#27272A] rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                            placeholder="Paste your Pionex API Key"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 font-medium">API Secret</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 text-gray-600" size={16} />
                                        <input
                                            type="password"
                                            value={apiSecret}
                                            onChange={(e) => setApiSecret(e.target.value)}
                                            className="w-full bg-[#09090B] border border-[#27272A] rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                            placeholder="Paste your Pionex API Secret"
                                        />
                                    </div>
                                </div>

                                {status === 'error' && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                                        <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                                        <p className="text-sm text-red-300">{message}</p>
                                    </div>
                                )}

                                {status === 'success' && (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-3">
                                        <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={18} />
                                        <p className="text-sm text-green-300">{message}</p>
                                    </div>
                                )}

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={saveSettings}
                                        disabled={loading}
                                        className={`
                                            flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all
                                            ${loading
                                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                            }
                                        `}
                                    >
                                        {loading ? (
                                            <>Processing...</>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                Save & Test
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Chart Settings (Optional for later) */}
                        <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden opacity-50 pointer-events-none grayscale">
                            <div className="px-6 py-4 border-b border-[#27272A] bg-[#1C1C1E]">
                                <h2 className="text-base font-medium text-white">Bot Configuration (Coming Soon)</h2>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-gray-500">
                                    Configuration for Grid and DCA bots will be available here in Phase 2.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
