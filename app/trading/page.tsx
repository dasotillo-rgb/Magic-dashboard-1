'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp, ChevronDown, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const TvWidget = dynamic(() => import('@/components/chart/TvWidget'), { ssr: false });
const PionexChart = dynamic(() => import('@/components/trading-lab/PionexChart'), { ssr: false });
const AccountPanel = dynamic(() => import('@/components/trading-lab/AccountPanel'), { ssr: false });
const OrdersPanel = dynamic(() => import('@/components/trading-lab/OrdersPanel'), { ssr: false });
const TradePanel = dynamic(() => import('@/components/trading-lab/TradePanel'), { ssr: false });
const BotPanel = dynamic(() => import('@/components/trading-lab/BotPanel'), { ssr: false });

const SYMBOLS = [
  { label: 'BTC/USDT', value: 'BTC_USDT' },
  { label: 'ETH/USDT', value: 'ETH_USDT' },
  { label: 'BNB/USDT', value: 'BNB_USDT' },
  { label: 'SOL/USDT', value: 'SOL_USDT' },
  { label: 'XRP/USDT', value: 'XRP_USDT' },
  { label: 'DOGE/USDT', value: 'DOGE_USDT' },
  { label: 'ADA/USDT', value: 'ADA_USDT' },
  { label: 'AVAX/USDT', value: 'AVAX_USDT' },
];

const INTERVALS = [
  { label: '4H', value: '4H' },
  { label: '8H', value: '8H' },
  { label: '12H', value: '12H' },
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
];

export default function TradingPage() {
  const [symbol, setSymbol] = useState('BTC_USDT');
  const [interval, setInterval] = useState('1D');
  const [showSymbolMenu, setShowSymbolMenu] = useState(false);
  const [connected, setConnected] = useState(false);
  const [price, setPrice] = useState<string | null>(null);
  const [chartKey, setChartKey] = useState(0);
  const [chartMode, setChartMode] = useState<'tv' | 'custom'>('tv'); // Default to TV

  // Fetch current price & check connection
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(`/api/pionex/ticker?symbol=${symbol}`);
        const data = await res.json();
        if (data.ticker) {
          setPrice(parseFloat(data.ticker.close || data.ticker.price || '0').toLocaleString('en-US', { maximumFractionDigits: 2 }));
          setConnected(true);
        }
      } catch {
        setConnected(false);
      }
    };
    fetchPrice();
    const iv = window.setInterval(fetchPrice, 10000);
    return () => window.clearInterval(iv);
  }, [symbol]);

  // Bot Engine Pulse (Heartbeat)
  useEffect(() => {
    const pulseBots = () => fetch('/api/pionex/bots', { method: 'PUT' }).catch(() => { });
    pulseBots(); // Initial pulse
    const iv = window.setInterval(pulseBots, 30000); // Pulse every 30s
    return () => window.clearInterval(iv);
  }, []);

  const selectedLabel = SYMBOLS.find(s => s.value === symbol)?.label || symbol;

  // Mapper for TV widget
  const getTvSymbol = (s: string) => {
    return 'BINANCE:' + s.replace('_', '');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-3 bg-[#09090B]">
      {/* ===== HEADER ===== */}
      <header className="flex items-center justify-between flex-shrink-0 px-4 py-2 bg-[#18181B] border-b border-[#27272A]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-[#00FF41]" />
            <h1 className="text-xl font-bold text-white tracking-tight">Trading Lab</h1>
          </div>

          <div className="h-6 w-[1px] bg-white/10 mx-2" />

          {/* Symbol Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSymbolMenu(!showSymbolMenu)}
              className="flex items-center gap-2 bg-[#27272A] hover:bg-[#3F3F46] px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
            >
              <span className="font-bold">{selectedLabel}</span>
              {price && <span className="text-[#00FF41] font-mono">${price}</span>}
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </button>

            {showSymbolMenu && (
              <div className="absolute top-full mt-1 left-0 bg-[#1C1C1E] border border-white/10 rounded-xl shadow-xl z-50 min-w-[160px] overflow-hidden">
                {SYMBOLS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => { setSymbol(s.value); setShowSymbolMenu(false); setChartKey(k => k + 1); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors ${s.value === symbol ? 'text-[#00FF41] bg-white/5' : 'text-white'
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interval Selector */}
          <div className="flex bg-[#27272A] rounded-lg p-1 gap-1">
            {INTERVALS.map(iv => (
              <button
                key={iv.value}
                onClick={() => { setInterval(iv.value); setChartKey(k => k + 1); }}
                className={`px-2 py-0.5 text-xs rounded-md font-medium transition-colors ${interval === iv.value
                  ? 'bg-[#00FF41] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                {iv.label}
              </button>
            ))}
          </div>

          {/* Chart Mode Toggle */}
          <div className="flex bg-[#27272A] rounded-lg p-1 gap-1 ml-2">
            <button
              onClick={() => setChartMode('custom')}
              className={`px-3 py-0.5 text-xs rounded-md font-medium transition-colors ${chartMode === 'custom'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Custom
            </button>
            <button
              onClick={() => setChartMode('tv')}
              className={`px-3 py-0.5 text-xs rounded-md font-medium transition-colors ${chartMode === 'tv'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              TradingView
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {connected ? (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                <Wifi className="h-3 w-3 text-green-400" />
                <span className="text-xs text-green-400 font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                <WifiOff className="h-3 w-3 text-red-400" />
                <span className="text-xs text-red-400 font-medium">Offline</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="flex-1 grid grid-cols-[1fr_320px] gap-4 min-h-0 px-4 pb-4">
        {/* Left: Chart */}
        <div className="min-h-0 flex flex-col gap-3 bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden shadow-sm">
          {/* Chart Area */}
          <div className="flex-1 relative">
            {chartMode === 'custom' ? (
              <>
                <PionexChart key={`custom-${chartKey}`} symbol={symbol} interval={interval} />
                {/* Indicator Badge only for custom chart */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-[#09090B]/90 backdrop-blur-md border border-white/10 rounded-lg shadow-lg pointer-events-none z-10">
                  <div className="w-2 h-2 bg-[#00E676] rounded-full animate-pulse shadow-[0_0_8px_rgba(0,230,118,0.5)]" />
                  <span className="text-xs text-gray-300 font-medium tracking-wide">Gemini Money Line</span>
                </div>
              </>
            ) : (
              <TvWidget key={`tv-${chartKey}`} symbol={getTvSymbol(symbol)} interval="D" theme="dark" />
            )}
          </div>
        </div>

        {/* Right: Panels */}
        <div className="flex flex-col gap-3 min-h-0 w-full overflow-y-auto pr-1">
          {/* Trade Panel */}
          <div className="flex-none">
            <TradePanel symbol={symbol} onOrderPlaced={() => setChartKey(k => k + 1)} />
          </div>

          {/* Bot Panel (New) */}
          <div className="flex-none">
            <BotPanel symbol={symbol} />
          </div>

          {/* Account Panel */}
          <div className="flex-none h-[200px]">
            <AccountPanel />
          </div>

          {/* Orders Panel */}
          <div className="flex-1 min-h-[200px]">
            <OrdersPanel symbol={symbol} />
          </div>
        </div>
      </div>
    </div>
  );
}
