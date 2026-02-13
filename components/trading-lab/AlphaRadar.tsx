// components/trading-lab/TrendSignalScanner.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowUp, ArrowDown } from 'lucide-react';

// Datos simulados realistas para la v1.0
const mockScanResults = [
  { pair: 'BTC/USDT', probability: 88, direction: 'UP' as const, signal: 'Cruce de Medias Móviles + RSI en sobreventa' },
  { pair: 'ETH/USDT', probability: 75, direction: 'UP' as const, signal: 'MACD alcista' },
  { pair: 'SOL/USDT', probability: 62, direction: 'DOWN' as const, signal: 'RSI en sobrecompra' },
  { pair: 'XRP/USDT', probability: 45, direction: 'UP' as const, signal: 'Volumen en aumento' },
];

const TrendSignalScanner = () => {
  return (
    <div className="bg-white/5 backdrop-blur-[40px] border border-white/10 rounded-[2.5rem] p-6 h-full">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="h-6 w-6 text-yellow-300" />
        <h3 className="text-xl font-black text-white">Trend Signal Scanner</h3>
      </div>
      <div className="space-y-3">
        {mockScanResults.map((result, index) => {
          const isHighProbability = result.probability > 80;
          return (
            <motion.div
              key={result.pair}
              className={`p-4 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between
                ${isHighProbability ? 'glow-effect' : ''}
              `}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-white">{result.pair}</span>
                  {result.direction === 'UP' ? <ArrowUp className="h-5 w-5 text-green-400" /> : <ArrowDown className="h-5 w-5 text-red-400" />}
                </div>
                <p className="text-xs text-gray-400 mt-1">{result.signal}</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-black ${isHighProbability ? 'text-yellow-300' : 'text-white'}`}>{result.probability}%</p>
                <p className="text-xs text-gray-400">Prob. de Éxito</p>
              </div>
            </motion.div>
          );
        })}
      </div>
      <style jsx>{`
        .glow-effect {
          box-shadow: 0 0 15px 5px rgba(250, 204, 21, 0.3);
        }
      `}</style>
    </div>
  );
};

export default TrendSignalScanner;
