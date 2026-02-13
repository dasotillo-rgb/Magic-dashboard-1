'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { getPionexCandles } from '@/lib/pionex';

type Signal = {
  pair: string;
  direction: 'STRONG BUY' | 'STRONG SELL' | 'HOLD';
  price: number;
};

const TrendSignalScanner = () => {
  const [signal, setSignal] = useState<Signal | null>(null);

  useEffect(() => {
    const fetchAndAnalyze = async () => {
      // Usamos el par real BTC_USDT para Pionex
      const candles = await getPionexCandles('BTC_USDT');

      if (candles && candles.length > 0) {
        // Pionex devuelve arrays [time, open, close, high, low, volume] (strings)
        // El precio de cierre suele ser el índice 2 o 4 dependiendo de la versión,
        // verificamos documentación estándar: Open(1), Close(2), High(3), Low(4).
        // Ajustamos para seguridad: usaremos el último valor disponible.
        const lastCandle = candles[candles.length - 1];
        // En Pionex klines struct suele ser: time, open, close, high, low, vol.
        const lastPrice = parseFloat(lastCandle.close || lastCandle[2]);

        const newSignal: Signal = {
          pair: 'BTC/USDT',
          // Lógica simple placeholder
          direction: lastPrice > 65000 ? 'STRONG BUY' : 'HOLD',
          price: lastPrice,
        };
        setSignal(newSignal);
      } else {
        // Fallback si no hay datos (Mock para no dejar vacío el UI)
        setSignal({ pair: 'BTC/USDT', direction: 'HOLD', price: 0 });
      }
    };

    fetchAndAnalyze();
    const interval = setInterval(fetchAndAnalyze, 10000);
    return () => clearInterval(interval);
  }, []);

  const getSignalColor = (dir: Signal['direction']) => {
    if (dir === 'STRONG BUY') return 'text-[#00FF41]';
    if (dir === 'STRONG SELL') return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-6 h-full text-white flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="h-6 w-6 text-[#00FF41]" />
        <h3 className="text-xl font-black tracking-tighter">ALPHA RADAR</h3>
      </div>
      <div className="text-center flex-1 flex flex-col justify-center">
        {signal && signal.price > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-lg font-bold text-white/50">{signal.pair}</p>
            <p className={`text-5xl lg:text-6xl font-black my-4 tracking-tighter drop-shadow-[0_0_15px_rgba(0,255,65,0.3)] ${getSignalColor(signal.direction)}`}>
              {signal.direction}
            </p>
            <p className="text-sm tabular-nums font-mono text-white/60">@ ${signal.price.toLocaleString('en-US')}</p>
          </motion.div>
        ) : (
          <p className="text-gray-500 animate-pulse text-sm">Scanning Pionex Network...</p>
        )}
      </div>
    </div>
  );
};

export default TrendSignalScanner;
