'use client';
import { useState, useEffect, useCallback, useRef } from "react";
import { Activity, Zap, Server, Settings, ActivitySquare, LayoutList, History } from 'lucide-react';
import BalanceCards from '@/components/dashboard/BalanceCards';

const API_BASE_DEFAULT = "http://51.21.170.68:5001";

// --- Utility ---
const fmt = (n, d = 2) => (n != null ? Number(n).toFixed(d) : "—");
const fmtUsd = (n) => (n != null ? `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—");
const pct = (n) => (n != null ? `${(Number(n) * 100).toFixed(1)}%` : "—");

// --- Components ---
function StatusDot({ alive, size = 8 }) {
  return (
    <span
      className={`inline-block rounded-full flex-shrink-0 ${alive
        ? 'bg-[#00FF41] shadow-[0_0_8px_rgba(0,255,65,0.4)]'
        : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
        }`}
      style={{ width: size, height: size }}
    />
  );
}

function Card({ title, icon, children, className = "", headerRight }) {
  return (
    <div className={`bg-[#18181B] border border-[#27272A] rounded-xl p-5 ${className}`}>
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2.5">
          {typeof icon === 'string' ? <span className="text-lg">{icon}</span> : icon}
          <span className="text-[13px] font-bold uppercase tracking-widest text-gray-400">{title}</span>
        </div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}

function BigNum({ label, value, sub, colorClass, small }) {
  return (
    <div className="text-center flex flex-col items-center justify-center overflow-hidden min-w-0">
      <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{label}</div>
      <div className={`${small ? 'text-base sm:text-lg' : 'text-xl sm:text-3xl'} font-black ${colorClass || 'text-white'} font-mono leading-none tracking-tight truncate max-w-full`}>{value}</div>
      {sub && <div className="text-[10px] text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, max, bgClass, heightClass = "h-1.5" }) {
  const pctVal = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className={`w-full ${heightClass} bg-[#27272A] rounded-full overflow-hidden`}>
      <div
        className={`h-full ${bgClass} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${pctVal}%` }}
      />
    </div>
  );
}

// --- Main Dashboard ---
export default function HFTV2Dashboard() {
  const [apiBase, setApiBase] = useState(() => {
    try { return window._hftApiBase || API_BASE_DEFAULT; } catch { return API_BASE_DEFAULT; }
  });
  const [apiInput, setApiInput] = useState(apiBase);
  const [connected, setConnected] = useState(false);
  const [market, setMarket] = useState(null);
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [liveTrades, setLiveTrades] = useState([]);
  const [paperTrades, setPaperTrades] = useState([]);
  const [realStatus, setRealStatus] = useState(null);
  const [settings, setSettings] = useState({ trade_amount: 5, slippage_venta: 0.90, min_edge: 0.06 });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [tab, setTab] = useState("live");
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);
  const busy = useRef(false);

  const fetchAll = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      // Use server-side proxy to avoid HTTPS→HTTP mixed content on mobile/Vercel
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const targetUrl = isHttps
        ? `/api/hft-proxy?path=/api/all`
        : `${apiBase}/api/all`;
      console.log(`[HFT V2] Realizando fetch a: ${targetUrl}`);

      const headers = { "Content-Type": "application/json" };

      const response = await fetch(targetUrl, {
        headers,
        signal: AbortSignal.timeout(6000)
      }).catch(err => {
        console.error(`[HFT V2] Error de red al contactar ${targetUrl}:`, err);
        throw err;
      });

      if (!response.ok) {
        console.error(`[HFT V2] Error HTTP: Status ${response.status} en ${targetUrl}`);
        setConnected(false);
        busy.current = false;
        return;
      }

      const d = await response.json();
      console.log(`[HFT V2] Datos recibidos correctamente:`, d);

      if (d) {
        setMarket(d.market || null);
        setHealth(d.health || null);
        setMetrics(d.metrics || null);
        setLiveTrades(d.live_trades || []);
        setPaperTrades(d.paper_trades || []);
        setRealStatus(d.real_status || null);
        if (d.settings) setSettings((prev) => ({ ...prev, ...d.settings }));
        setConnected(true);
        setLastUpdate(new Date());
      } else {
        setConnected(false);
      }
    } catch (err) {
      console.error(`[HFT V2] Error capturado en fetchAll:`, err);
      setConnected(false);
    }
    busy.current = false;
  }, [apiBase]);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, 5000);
    return () => clearInterval(intervalRef.current);
  }, [fetchAll]);

  const handleConnect = () => {
    setApiBase(apiInput.replace(/\/+$/, ""));
  };

  const handleSaveSettings = async () => {
    try {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const targetUrl = isHttps
        ? `/api/hft-proxy?path=/api/bot-settings`
        : `${apiBase}/api/bot-settings`;
      console.log(`[HFT V2] Guardando settings en: ${targetUrl}`, settings);

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        console.error(`[HFT V2] Error HTTP al guardar settings. Status:`, response.status);
        return;
      }

      const data = await response.json();
      console.log(`[HFT V2] Settings guardadas exitosamente:`, data);

      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (err) {
      console.error(`[HFT V2] Excepción al guardar settings:`, err);
    }
  };

  const hp = health || {};
  const l0 = hp.L0 || {};
  const l2 = hp.L2 || {};
  const l3 = hp.L3 || {};

  const deltaText = market?.delta > 0 ? 'text-[#00FF41]' : market?.delta < 0 ? 'text-red-500' : 'text-gray-400';
  const timeText = market?.time_left < 30 ? 'text-red-500' : market?.time_left < 60 ? 'text-amber-500' : 'text-[#00FF41]';
  const timeBg = market?.time_left < 30 ? 'bg-red-500' : market?.time_left < 60 ? 'bg-amber-500' : 'bg-[#00FF41]';

  const paperPnl = paperTrades.reduce((acc, t) => acc + (Number(t.pnl_total_usd) || 0), 0);
  const paperBalance = 1000 + paperPnl; // Assuming a base paper equity of $1000

  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] bg-[#09090B] font-sans text-gray-200">

      {/* ===== HEADER ===== */}
      <header className="flex flex-wrap items-center justify-between flex-shrink-0 px-4 lg:px-6 py-3 lg:py-4 bg-[#18181B] border-b border-[#27272A] gap-2">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#00FF41]/10 border border-[#00FF41]/20 flex items-center justify-center flex-shrink-0">
            <Activity className="h-5 w-5 text-[#00FF41]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">HFT Engine V2</h1>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">Polymarket BTC 5min Binary Options</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {connected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#00FF41]/10 rounded-full border border-[#00FF41]/20">
              <StatusDot alive={true} size={8} />
              <span className="text-xs text-[#00FF41] font-bold tracking-wide">CONNECTED</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full border border-red-500/20">
              <StatusDot alive={false} size={8} />
              <span className="text-xs text-red-500 font-bold tracking-wide">OFFLINE</span>
            </div>
          )}
          {lastUpdate && <span className="text-xs font-mono text-gray-500 hidden sm:block">{lastUpdate.toLocaleTimeString()}</span>}
        </div>
      </header>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6 pb-24 lg:pb-6">

        {/* --- BALANCES & PNL --- */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
          <BalanceCards />

          {/* Custom PnL Card matching BalanceCards style */}
          <div className={`flex items-center gap-2.5 bg-[#1C1C1E]/80 border ${(metrics?.total_pnl ?? 0) < 0 ? 'border-red-500/20' : 'border-[#00FF41]/20'} rounded-2xl px-4 py-2.5 backdrop-blur-sm`}>
            <div className={`w-7 h-7 rounded-full ${(metrics?.total_pnl ?? 0) < 0 ? 'bg-red-500/15 border-red-500/30' : 'bg-[#00FF41]/15 border-[#00FF41]/30'} flex items-center justify-center shrink-0`}>
              <ActivitySquare className={`h-3.5 w-3.5 ${(metrics?.total_pnl ?? 0) < 0 ? 'text-red-400' : 'text-[#00FF41]'}`} />
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Total P&L</p>
              <p className={`text-sm font-black font-mono leading-tight ${(metrics?.total_pnl ?? 0) < 0 ? 'text-red-400' : 'text-[#00FF41]'}`}>
                {metrics ? fmtUsd(metrics.total_pnl) : "—"}
              </p>
            </div>
          </div>

          {/* Paper P&L Card */}
          <div className={`flex items-center gap-2.5 bg-[#1C1C1E]/80 border ${paperPnl < 0 ? 'border-red-500/20' : 'border-[#00FF41]/20'} rounded-2xl px-4 py-2.5 backdrop-blur-sm`}>
            <div className={`w-7 h-7 rounded-full ${paperPnl < 0 ? 'bg-red-500/15 border-red-500/30' : 'bg-[#00FF41]/15 border-[#00FF41]/30'} flex items-center justify-center shrink-0`}>
              <ActivitySquare className={`h-3.5 w-3.5 ${paperPnl < 0 ? 'text-red-400' : 'text-[#00FF41]'}`} />
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Paper P&L</p>
              <p className={`text-sm font-black font-mono leading-tight ${paperPnl < 0 ? 'text-red-400' : 'text-[#00FF41]'}`}>
                {fmtUsd(paperPnl)}
              </p>
            </div>
          </div>

          {/* Paper Saldo Card */}
          <div className={`flex items-center gap-2.5 bg-[#1C1C1E]/80 border ${paperBalance < 1000 ? 'border-red-500/20' : 'border-[#00FF41]/20'} rounded-2xl px-4 py-2.5 backdrop-blur-sm`}>
            <div className={`w-7 h-7 rounded-full ${paperBalance < 1000 ? 'bg-red-500/15 border-red-500/30' : 'bg-[#00FF41]/15 border-[#00FF41]/30'} flex items-center justify-center shrink-0`}>
              <ActivitySquare className={`h-3.5 w-3.5 ${paperBalance < 1000 ? 'text-red-400' : 'text-[#00FF41]'}`} />
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Paper Saldo</p>
              <p className={`text-sm font-black font-mono leading-tight ${paperBalance < 1000 ? 'text-red-400' : 'text-[#00FF41]'}`}>
                {fmtUsd(paperBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* --- API CONNECTION --- */}
        <div className="flex gap-3 items-center w-full max-w-full sm:max-w-md">
          <div className="relative flex-1">
            <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={apiInput}
              onChange={(e) => setApiInput(e.target.value)}
              placeholder="http://YOUR_SERVER_IP:5001"
              className="w-full pl-9 pr-4 py-2 bg-[#18181B] border border-[#27272A] rounded-lg text-sm font-mono text-gray-300 focus:outline-none focus:border-[#00FF41]/50 focus:ring-1 focus:ring-[#00FF41]/20 transition-all"
            />
          </div>
          <button
            onClick={handleConnect}
            className="px-5 py-2 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-white text-sm font-bold tracking-wide transition-colors"
          >
            CONNECT
          </button>
        </div>

        {/* --- MARKET OVERVIEW --- */}
        <Card
          title="Live Market"
          icon={<ActivitySquare className="h-5 w-5 text-[#00FF41]" />}
          headerRight={market?.slug ? <span className="text-xs font-mono text-gray-500 bg-[#27272A] px-2 py-1 rounded-md">{market.slug}</span> : null}
        >
          {market?.status === "LIVE" ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-3 lg:gap-4">
                <BigNum label="BTC Price" value={fmtUsd(market.current_price)} small />
                <BigNum label="Strike" value={fmtUsd(market.strike_price)} small />
                <BigNum label="Delta" value={`${market.delta > 0 ? "+" : ""}${fmt(market.delta)}`} colorClass={deltaText} small />
                <BigNum label="Time Left" value={`${market.time_left}s`} colorClass={timeText} small />
                <BigNum label="Volatility" value={`$${fmt(market.volatility_5m)}`} colorClass="text-amber-500" small />
              </div>

              <ProgressBar value={280 - (market.time_left || 0)} max={280} bgClass={timeBg} heightClass="h-2" />

              {/* Fair Value Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="bg-[#00FF41]/5 border border-[#00FF41]/20 rounded-xl p-4 flex flex-col items-center justify-center">
                  <div className="text-xs font-bold text-[#00FF41] mb-2 tracking-widest">FAIR VALUE UP</div>
                  <div className="text-3xl font-black text-[#00FF41] font-mono">{pct(market.fair_value_up)}</div>
                  {market.order_book?.up && (
                    <div className="text-[9px] text-gray-500 mt-2 font-mono break-all leading-relaxed">
                      Ask: {fmt(market.order_book.up.best_ask, 3)} | Spread: {fmt(market.order_book.up.spread, 4)} | Depth: {fmt(market.order_book.up.ask_depth_5, 0)}
                    </div>
                  )}
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex flex-col items-center justify-center">
                  <div className="text-xs font-bold text-red-500 mb-2 tracking-widest">FAIR VALUE DOWN</div>
                  <div className="text-3xl font-black text-red-500 font-mono">{pct(market.fair_value_down)}</div>
                  {market.order_book?.down && (
                    <div className="text-[9px] text-gray-500 mt-2 font-mono break-all leading-relaxed">
                      Ask: {fmt(market.order_book.down.best_ask, 3)} | Spread: {fmt(market.order_book.down.spread, 4)} | Depth: {fmt(market.order_book.down.ask_depth_5, 0)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 text-sm font-medium">Waiting for active market...</div>
          )}
        </Card>

        {/* --- GRID: Health + Controls --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SYSTEM HEALTH */}
          <Card title="System Health" icon={<Zap className="h-5 w-5 text-amber-500" />}>
            <div className="flex flex-col gap-3">
              {[
                { name: "L0 Foundation", alive: l0.alive, sub: l0.alive ? `Vol: $${fmt(l0.vol)}` : "Not running" },
                { name: "L2 Brain", alive: (l2.age || 9999) < 600, sub: `Last: ${fmt(l2.age, 0)}s ago` },
                { name: "L3 Executor", alive: l3.status !== "OFFLINE", sub: l3.status || "OFFLINE" },
                { name: "L4 Dashboard", alive: connected, sub: connected ? "Serving API" : "Unreachable" },
              ].map((layer) => (
                <div key={layer.name} className="flex items-center gap-3 py-2 border-b border-[#27272A] last:border-0 last:pb-0">
                  <StatusDot alive={layer.alive} size={10} />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-200">{layer.name}</div>
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5">{layer.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Position Status */}
            {realStatus && realStatus.status !== "OFFLINE" && realStatus.status !== "IDLE" && (
              <div className={`mt-4 p-3 rounded-lg border ${realStatus.status === "OPEN" ? 'bg-amber-500/10 border-amber-500/30' : 'bg-blue-500/5 border-blue-500/20'}`}>
                <div className={`text-xs font-black tracking-widest mb-1 ${realStatus.status === "OPEN" ? 'text-amber-500' : 'text-blue-400'}`}>
                  POSITION: {realStatus.status}
                </div>
                {realStatus.status === "OPEN" && (
                  <div className="text-[11px] text-gray-400 font-mono whitespace-nowrap overflow-x-auto">
                    {realStatus.side_str} | Entry: {fmt(realStatus.entry_price, 4)}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* CONTROL PANEL */}
          <Card title="Control Panel" icon={<Settings className="h-5 w-5 text-gray-400" />}>
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Trade Amount ($)</label>
                <input
                  type="number"
                  value={settings.trade_amount}
                  onChange={(e) => setSettings((s) => ({ ...s, trade_amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#27272A] bg-[#09090B] text-[#00FF41] text-lg font-bold font-mono outline-none focus:border-[#00FF41]/50 focus:ring-1 focus:ring-[#00FF41]/20 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Min Edge to Enter <span className="text-[#00FF41] ml-1">{pct(settings.min_edge)}</span>
                </label>
                <input
                  type="range"
                  min="0.02"
                  max="0.20"
                  step="0.01"
                  value={settings.min_edge}
                  onChange={(e) => setSettings((s) => ({ ...s, min_edge: parseFloat(e.target.value) }))}
                  className="w-full accent-[#00FF41]"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-medium">
                  <span>2% (Agresivo)</span>
                  <span>20% (Conservador)</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Sell Slippage <span className="text-amber-500 ml-1">{pct(settings.slippage_venta)}</span>
                </label>
                <input
                  type="range"
                  min="0.80"
                  max="0.99"
                  step="0.01"
                  value={settings.slippage_venta}
                  onChange={(e) => setSettings((s) => ({ ...s, slippage_venta: parseFloat(e.target.value) }))}
                  className="w-full accent-amber-500"
                />
              </div>

              <button
                onClick={handleSaveSettings}
                className={`w-full py-3 rounded-lg border-none text-xs font-black tracking-widest uppercase transition-all duration-300 ${settingsSaved
                  ? 'bg-[#00FF41] text-black shadow-[0_0_15px_rgba(0,255,65,0.4)]'
                  : 'bg-[#00FF41]/10 text-[#00FF41] hover:bg-[#00FF41]/20'
                  }`}
              >
                {settingsSaved ? "✅ SAVED" : "💾 SAVE SETTINGS TO BOT"}
              </button>
            </div>
          </Card>
        </div>

        {/* --- METRICS --- */}
        {metrics && metrics.total_trades > 0 && (
          <Card title="Performance" icon={<LayoutList className="h-5 w-5 text-indigo-400" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
              <BigNum label="Trades" value={metrics.total_trades} small />
              <BigNum label="Win Rate" value={`${fmt(metrics.win_rate, 1)}%`} colorClass={metrics.win_rate >= 50 ? 'text-[#00FF41]' : 'text-red-500'} small />
              <BigNum label="Total PnL" value={fmtUsd(metrics.total_pnl)} colorClass={metrics.total_pnl >= 0 ? 'text-[#00FF41]' : 'text-red-500'} small />
              <BigNum label="Avg PnL" value={fmtUsd(metrics.avg_pnl)} colorClass={metrics.avg_pnl >= 0 ? 'text-[#00FF41]' : 'text-red-500'} small />
              <BigNum label="Best" value={fmtUsd(metrics.best_trade)} colorClass="text-[#00FF41]" small />
              <BigNum label="Worst" value={fmtUsd(metrics.worst_trade)} colorClass="text-red-500" small />
              <BigNum label="Avg Edge" value={pct(metrics.avg_edge_entry)} colorClass="text-blue-400" small />
            </div>
          </Card>
        )}

        {/* --- TRADE HISTORY TABS --- */}
        <div className="flex flex-col mt-2">
          {/* Tabs */}
          <div className="flex gap-2 mb-0 overflow-x-auto no-scrollbar">
            {[
              { id: "live", label: `LIVE TRADES (${liveTrades.length})`, icon: "🔴" },
              { id: "paper", label: `PAPER TRADES (${paperTrades.length})`, icon: "📝" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-bold tracking-widest transition-colors border-b-2 ${tab === t.id
                  ? 'bg-[#18181B] text-[#00FF41] border-[#00FF41]'
                  : 'bg-[#18181B]/50 text-gray-500 border-transparent hover:bg-[#18181B]/80 hover:text-gray-300'
                  }`}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>

          {/* Table Container */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-b-xl rounded-tr-xl overflow-hidden shadow-lg">
            <div className="max-h-[400px] overflow-y-auto overflow-x-auto custom-scrollbar">
              {tab === "live" && (
                liveTrades.length > 0 ? (
                  <table className="w-full border-collapse text-left min-w-[650px]">
                    <thead className="sticky top-0 bg-[#09090B] z-10 border-b border-[#27272A]">
                      <tr>
                        {["Time", "Side", "Entry", "Exit", "Size", "PnL", "Edge", "Note"].map((h) => (
                          <th key={h} className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272A]/50 text-xs font-mono">
                      {liveTrades.slice(0, 30).map((t, i) => {
                        const isOpen = t.pnl === "OPEN";
                        const pnlColor = isOpen ? 'text-amber-500' : (Number(t.pnl) >= 0 ? 'text-[#00FF41]' : 'text-red-500');
                        return (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{t.time || "—"}</td>
                            <td className={`px-3 py-2.5 font-bold ${t.side === "UP" ? 'text-[#00FF41]' : 'text-red-500'}`}>{t.side || "—"}</td>
                            <td className="px-3 py-2.5 text-gray-300">{fmt(t.entry, 4)}</td>
                            <td className="px-3 py-2.5 text-gray-300">{isOpen ? "—" : fmt(t.exit, 4)}</td>
                            <td className="px-3 py-2.5 text-gray-500">{fmt(t.size, 1)}</td>
                            <td className={`px-3 py-2.5 font-bold ${pnlColor}`}>{isOpen ? "OPEN" : fmtUsd(t.pnl)}</td>
                            <td className="px-3 py-2.5 text-blue-400">{t.edge ? pct(t.edge) : "—"}</td>
                            <td className="px-3 py-2.5 text-gray-500 font-sans text-[11px] truncate max-w-[150px]">{t.note || ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-16 text-gray-500 text-sm font-medium">No live trades yet. Bot needs to be running.</div>
                )
              )}

              {tab === "paper" && (
                paperTrades.length > 0 ? (
                  <table className="w-full border-collapse text-left min-w-[700px]">
                    <thead className="sticky top-0 bg-[#09090B] z-10 border-b border-[#27272A]">
                      <tr>
                        {["Time", "Side", "Entry", "Exit", "FV In", "FV Out", "Edge", "PnL $", "Reason"].map((h) => (
                          <th key={h} className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272A]/50 text-xs font-mono">
                      {paperTrades.slice(0, 30).map((t, i) => {
                        const pnlColor = Number(t.pnl_total_usd) >= 0 ? 'text-[#00FF41]' : 'text-red-500';
                        return (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{t.timestamp || "—"}</td>
                            <td className={`px-3 py-2.5 font-bold ${t.side?.includes("UP") ? 'text-[#00FF41]' : 'text-red-500'}`}>{t.side?.replace("BUY_", "") || "—"}</td>
                            <td className="px-3 py-2.5 text-gray-300">{fmt(t.entry_price, 3)}</td>
                            <td className="px-3 py-2.5 text-gray-300">{fmt(t.exit_price, 3)}</td>
                            <td className="px-3 py-2.5 text-blue-400">{fmt(t.fair_value_entry, 3)}</td>
                            <td className="px-3 py-2.5 text-blue-400">{fmt(t.fair_value_exit, 3)}</td>
                            <td className="px-3 py-2.5 text-indigo-400">{pct(t.edge_entry)}</td>
                            <td className={`px-3 py-2.5 font-bold ${pnlColor}`}>{fmtUsd(t.pnl_total_usd)}</td>
                            <td className="px-3 py-2.5 text-gray-500 font-sans text-[11px] truncate max-w-[150px]">{t.reason || ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-16 text-gray-500 text-sm font-medium">No paper trades yet. L2 Brain needs to be running.</div>
                )
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center pb-8 pt-4 text-[11px] font-mono text-gray-600">
          HFT V2 — Single endpoint — Refresh: 5s — Port 5001
        </div>
      </div>
    </div>
  );
}
