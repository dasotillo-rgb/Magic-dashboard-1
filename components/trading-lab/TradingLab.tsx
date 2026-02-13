'use client';

import React from 'react';
import Chart from './Chart';
import BotPanel from './BotPanel';
import ArbitragePanel from './ArbitragePanel';

const TradingLab = () => {
  return (
    <div className="grid grid-cols-12 gap-6 h-full p-2">
      {/* Columna Izquierda: Gráfico y Panel de Arbitraje */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        <div className="bg-white/5 backdrop-blur-[40px] border border-white/10 rounded-[2.5rem] p-6">
          <h3 className="text-lg font-bold mb-4 text-white">BTC/USDT Real-Time</h3>
          <Chart />
        </div>
        <div className="flex-1">
          <ArbitragePanel />
        </div>
      </div>
      
      {/* Columna Derecha: Panel del Bot */}
      <div className="col-span-12 lg:col-span-4">
        <BotPanel />
      </div>
    </div>
  );
};

export default TradingLab;
// Force update: Sun Feb  8 13:07:25 UTC 2026
