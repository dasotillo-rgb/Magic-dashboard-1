'use client';

import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';

const API_URL = 'http://13.48.4.202:5000/api/bot-settings';

export default function L3SettingsWidget() {
    const [tradeAmount, setTradeAmount] = useState<string>('');
    const [statusMsg, setStatusMsg] = useState<string>('');
    const [statusColor, setStatusColor] = useState<string>('#888');

    useEffect(() => {
        fetch(API_URL)
            .then(response => response.json())
            .then(data => {
                if (data.trade_amount !== undefined) {
                    setTradeAmount(data.trade_amount.toString());
                }
            })
            .catch(err => console.error('Error leyendo settings:', err));
    }, []);

    const updateL3Settings = () => {
        setStatusColor('#888');
        setStatusMsg('Actualizando...');

        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trade_amount: Number(tradeAmount) })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setStatusColor('#00ff00');
                    setStatusMsg(data.message || 'Actualizado correctamente');
                } else {
                    setStatusColor('#ff0000');
                    setStatusMsg('Error: ' + (data.error || 'A problem occurred'));
                }
                setTimeout(() => setStatusMsg(''), 3000);
            })
            .catch(err => {
                setStatusColor('#ff0000');
                setStatusMsg('Error de conexión');
                setTimeout(() => setStatusMsg(''), 3000);
            });
    };

    return (
        <div className="bg-[#121212] border border-[#333] rounded-lg p-5 w-full flex-1 flex flex-col font-mono text-white h-full relative overflow-hidden">
            <h3 className="mt-0 text-[#00ff00] border-b border-[#333] pb-2.5 flex items-center gap-2 mb-4 font-bold text-lg">
                <Settings className="w-5 h-5" />
                L3 Engine Settings
            </h3>

            <div className="mb-4">
                <label className="block mb-1.5 text-[#888] text-sm font-medium">Monto por Operación ($):</label>
                <input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    className="w-full bg-black text-[#00ff00] border border-[#555] p-2.5 rounded-md text-base box-border focus:outline-none focus:border-[#00ff00] focus:ring-1 focus:ring-[#00ff00]/50 transition-all font-mono"
                    placeholder="0.00"
                />
            </div>

            <div className="mt-auto">
                <button
                    onClick={updateL3Settings}
                    className="w-full bg-[#00ff00] text-black border-none p-3 font-bold cursor-pointer rounded-md hover:bg-[#00cc00] hover:shadow-[0_0_15px_rgba(0,255,0,0.3)] transition-all uppercase tracking-wider text-sm"
                >
                    ACTUALIZAR MOTOR
                </button>
                <div
                    style={{ color: statusColor }}
                    className="mt-2.5 text-xs text-center min-h-[15px] font-medium"
                >
                    {statusMsg}
                </div>
            </div>
        </div>
    );
}
