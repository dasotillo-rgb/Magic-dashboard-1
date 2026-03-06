"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CloudLightning, Zap, Settings, ActivitySquare, LayoutList, CheckCircle2, History, AlertTriangle } from "lucide-react";
import BalanceCards from "@/components/dashboard/BalanceCards";

// --- STATIC INFO FROM CLAUDE ---
const strategies = [
  {
    id: "weather",
    name: "🌡️ Weather Arbitrage",
    risk: "Bajo",
    riskColor: "#22c55e",
    returns: "10-40% por trade",
    winRate: "75-85%",
    capital: "$100-500",
    difficulty: "Fácil",
    status: "✅ ACTIVA — Sin fees",
    description: "Compara datos NOAA con precios de Polymarket. Los mercados de clima NO tienen taker fees, lo que lo hace ideal para principiantes.",
    howItWorks: [
      "El bot consulta pronósticos NOAA/Open-Meteo cada 2-5 minutos",
      "Compara probabilidades del pronóstico con precios de Polymarket",
      "Si pronóstico dice >80% y el mercado lo valora barato, compra",
      "Repite en múltiples ciudades: NYC, Londres, Chicago, Seúl, Atlanta"
    ],
    realResults: "Un bot convirtió $1,000 → $24,000 en Londres. Otro hizo $65,000 en múltiples ciudades.",
    tools: "py-clob-client, NOAA API, Open-Meteo, Gamma API",
    markets: "346 mercados activos de clima en Polymarket sin dynamic fees",
    pros: ["Sin fees de trading", "Edge claro y verificable", "Resolución predecible matemática", "Bajo capital inicial"],
    cons: ["Requiere monitoreo continuo de ciudades", "Edge se reduce si el mercado se da cuenta"]
  },
  {
    id: "maker",
    name: "📊 Market Making",
    risk: "Medio",
    riskColor: "#eab308",
    returns: "1-3% mes + rebates",
    winRate: "78-85%",
    capital: "$5,000+",
    difficulty: "Avanzado",
    status: "✅ META ACTUAL",
    description: "Proveer liquidez en ambos lados del mercado para ganar spreads y maker rebates.",
    howItWorks: [
      "Coloca órdenes límite en ambos lados (YES y NO) con un spread",
      "Capturas la diferencia (ej: compras a $0.58 y vendes a $0.62)",
      "Recibes Maker Rebates redistribuidos de los taker fees"
    ],
    realResults: "Bots top rentables escalan de $200 a $800/día ganando primas y rebates.",
    tools: "WebSocket feed, polyfill-rs (Rust) o C++ para baja latencia",
    markets: "Mercados de alto volumen como Política o Crypto",
    pros: ["Flujo constante", "Maker rebates", "No adivinas dirección"],
    cons: ["Requiere latencia <100ms", "VPS dedicado", "Alto capital"]
  }
];

const criticalChanges = [
  { date: "18 Feb 2026", change: "500ms taker delay ELIMINADO", impact: "Órdenes taker se ejecutan instantáneamente." },
  { date: "Ene 2026", change: "Dynamic taker fees en crypto", impact: "C × 0.25 × (p × (1-p))². Hasta ~1.56% fee que mata arbitraje temporal." },
  { date: "18 Feb 2026", change: "Maker Rebates Program", impact: "100% de taker fees redistribuidos a makers en USDC diariamente." }
];

export default function WeatherDashboard() {
  const [activeTab, setActiveTab] = useState("live");
  const [apiBase, setApiBase] = useState("http://51.21.170.68:5002"); // Asumimos python está en el puerto 5002
  const [connected, setConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Real-time state
  const [lastUpdate, setLastUpdate] = useState(null);
  const [status, setStatus] = useState("OFFLINE");
  const [summary, setSummary] = useState({ trades: 0, cost: 0, payout: 0, edge: 0 });
  const [recentTrades, setRecentTrades] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [botConfig, setBotConfig] = useState({ max_usd: 2.0, entry: 0.15, cities: "New York, London" });

  const busy = useRef(false);
  const [isFetching, setIsFetching] = useState(false);

  // Formatting helpers
  const fmtUsd = (val) => val == null ? "—" : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);
  const pct = (val) => val == null ? "—" : `${(val * 100).toFixed(1)}%`;

  // Fetch logic
  const fetchAll = useCallback(async (isManual = false) => {
    if (busy.current) return;
    busy.current = true;
    if (isManual) setIsFetching(true);
    try {
      // Use server-side proxy to avoid HTTPS→HTTP mixed content on mobile/Vercel
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const targetUrl = isHttps
        ? `/api/weather-proxy?path=/api/weather/status`
        : `${apiBase}/api/weather/status`;
      console.log(`[Weather] Intentando conectar a: ${targetUrl}`);
      const response = await fetch(targetUrl, { signal: AbortSignal.timeout(8000) });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
      }

      const d = await response.json();
      console.log(`[Weather] Datos recibidos:`, d);
      setSummary(d.summary || { trades: 0, cost: 0, payout: 0, edge: 0 });
      setRecentTrades(d.recent_trades || []);
      setOpportunities(d.opportunities || []);
      setStatus(d.running ? "CONNECTED" : "STOPPED");
      setConnected(true);
      setErrorMsg(null);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("[Weather] Fallo al obtener datos:", err);
      setConnected(false);
      setStatus("ERROR DE CONEXIÓN");
      setErrorMsg(err.message || "No se pudo conectar al backend Flask");
    } finally {
      busy.current = false;
      if (isManual) setIsFetching(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchAll(false);
    const iv = setInterval(() => fetchAll(false), 5000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  // Settings Save
  const handleSaveSettings = async () => {
    try {
      console.log(`[Weather] Guardando settings`);
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const targetUrl = isHttps
        ? `/api/weather-proxy?path=/api/weather/config`
        : `${apiBase}/api/weather/config`;
      // Esto hará POST a la API de python para actualizar config
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(botConfig),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      alert("Settings saved successfully to the bot runtime!");
    } catch (err) {
      console.error("[Weather] Error al guardar config:", err);
      alert(`Error saving settings: ${err.message}. Verifica log de consola y API.`);
    }
  };

  const pnl = summary.payout - summary.cost;

  // TABS definition
  const tabs = [
    { id: "live", label: "🔴 LIVE MONITOR" },
    { id: "strategies", label: "📚 ESTRATEGIAS" },
    { id: "changes", label: "⚡ NOVEDADES 2026" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] font-sans text-gray-200 p-4 lg:p-6 max-w-[100vw] mx-auto space-y-4 lg:space-y-6 relative pb-24 lg:pb-6 overflow-x-hidden">

      {/* --- HEADER --- */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <CloudLightning className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-300 tracking-tight">
                Weather Arbitrage V2
              </h1>
              <p className="text-xs text-gray-400 font-medium tracking-wide">Polymarket NOAA/Open-Meteo Integration</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className={`text-[10px] uppercase tracking-widest font-black flex items-center gap-2 px-3 py-1.5 rounded-full border ${connected ? 'bg-[#00FF41]/10 text-[#00FF41] border-[#00FF41]/30' : status === 'ERROR DE CONEXIÓN' ? 'bg-red-500/10 text-red-500 border-red-500/30 font-bold' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#00FF41] animate-pulse shadow-[0_0_8px_#00FF41]' : 'bg-red-500'}`} />
              {status}
            </span>
            {lastUpdate && <span className="text-[9px] text-gray-500 font-mono mt-1">LAST FETCH: {lastUpdate.toLocaleTimeString()}</span>}
          </div>
        </div>
      </div>

      {/* --- BALANCES & PNL --- */}
      <div className="flex flex-wrap items-center gap-2 pb-1 mb-4 lg:mb-8">
        <BalanceCards />

        {/* Custom Weather P&L Card */}
        <div className={`flex items-center gap-2 bg-[#1C1C1E]/80 border ${pnl < 0 ? 'border-red-500/20' : 'border-[#00FF41]/20'} rounded-2xl px-3 py-2 backdrop-blur-sm`}>
          <div className={`w-6 h-6 rounded-full ${pnl < 0 ? 'bg-red-500/15 border-red-500/30' : 'bg-[#00FF41]/15 border-[#00FF41]/30'} flex items-center justify-center shrink-0`}>
            <ActivitySquare className={`h-3.5 w-3.5 ${pnl < 0 ? 'text-red-400' : 'text-[#00FF41]'}`} />
          </div>
          <div>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Weather P&L</p>
            <p className={`text-sm font-black font-mono leading-tight ${pnl < 0 ? 'text-red-400' : 'text-[#00FF41]'}`}>
              {fmtUsd(pnl)}
            </p>
          </div>
        </div>
      </div>

      {/* --- CONNECTION INPUT --- */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#1C1C1E]/80 border border-[#27272A] rounded-lg px-3 py-1.5 w-full sm:w-80 shadow-inner">
            <Zap className="h-4 w-4 text-blue-400" />
            <input
              type="text"
              value={apiBase}
              onChange={(e) => setApiBase(e.target.value)}
              className="bg-transparent border-none text-xs text-gray-300 font-mono focus:outline-none w-full"
              placeholder="http://51.21.170.68:5002"
            />
          </div>
          <button
            onClick={() => fetchAll(true)}
            disabled={isFetching}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors border uppercase tracking-wider flex items-center gap-2 ${isFetching
              ? "bg-[#3F3F46] text-gray-400 border-gray-600 cursor-not-allowed"
              : "bg-[#27272A] hover:bg-[#3F3F46] text-gray-300 border-gray-700/50"
              }`}
          >
            {isFetching ? (
              <>
                <div className="w-3 h-3 border-2 border-t-transparent border-gray-400 rounded-full animate-spin" />
                Validating...
              </>
            ) : status === "ERROR DE CONEXIÓN" ? "Reintentar" : "Connect / Refresh"}
          </button>
        </div>

        {errorMsg && (
          <div className="text-red-400 text-xs font-mono bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg max-w-xl">
            ⚠️ <b>Error de conexión:</b> {errorMsg}. Verifica que no haya bloqueos CORS o HTTPS/HTTP (Mixed Content) en la consola del navegador.
          </div>
        )}
      </div>

      {/* --- TAB NAVIGATION --- */}
      <div className="flex gap-2 mb-4 lg:mb-6 border-b border-[#27272A] pb-0 overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-200 border-b-2 whitespace-nowrap ${activeTab === t.id
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* --- TAB: LIVE MONITOR --- */}
      {activeTab === "live" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 flex flex-col gap-6">

            {/* Live Trades Panel */}
            <div className="bg-[#18181B] border border-[#27272A]/80 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden ring-1 ring-white/5 max-w-full">
              <div className="px-5 py-4 border-b border-[#27272A] bg-[#1C1C1E]/80 backdrop-blur-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest">Recent Trades</h3>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">{summary.trades} Total Executed</span>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="bg-[#1C1C1E]/50 text-gray-400 font-bold uppercase tracking-widest border-b border-[#27272A]">
                    <tr>
                      <th className="px-3 py-2.5 whitespace-nowrap">City</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Type</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Cost</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Payout</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Edge</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272A]/50 font-mono">
                    {recentTrades.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-gray-500/50">
                          Waiting for backend endpoint <code className="text-gray-500">/api/weather/status</code> to return data...
                        </td>
                      </tr>
                    ) : (
                      recentTrades.map((t, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-3 py-2.5 text-gray-300 font-sans whitespace-nowrap">{t.city}</td>
                          <td className="px-3 py-2.5 text-blue-400 font-bold">{t.type}</td>
                          <td className="px-3 py-2.5 text-gray-400">{fmtUsd(t.cost)}</td>
                          <td className="px-3 py-2.5 text-[#00FF41]">{fmtUsd(t.payout)}</td>
                          <td className="px-3 py-2.5 text-amber-500">{pct(t.edge)}</td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${t.status === 'LIVE' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-800 text-gray-400'}`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Active Opportunities Panel */}
            <div className="bg-[#18181B] border border-[#27272A]/80 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden ring-1 ring-white/5 max-w-full">
              <div className="px-5 py-4 border-b border-[#27272A] bg-[#1C1C1E]/80 backdrop-blur-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest">Active Scanned Opportunities</h3>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunities.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-gray-600 text-sm italic">
                    No active edges detected. Scanning Polymarket NOAA markets...
                  </div>
                ) : (
                  opportunities.map((o, i) => (
                    <div key={i} className="bg-[#09090B] border border-blue-500/20 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-200">{o.city}</span>
                        <span className="text-xs text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded">Edge {pct(o.edge)}</span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3">{o.question}</p>
                      <div className="flex justify-between items-end border-t border-[#27272A] pt-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 tracking-widest uppercase">Target</span>
                          <span className="text-xs font-mono text-[#00FF41]">{fmtUsd(o.targetPrice)}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] text-gray-500 tracking-widest uppercase">Forecast Temp</span>
                          <span className="text-xs font-mono text-gray-300">{o.forecast} F</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Control Panel */}
            <div className="bg-[#18181B] border border-[#27272A]/80 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.2)] ring-1 ring-white/5">
              <div className="px-5 py-4 border-b border-[#27272A] flex items-center gap-3 bg-[#1C1C1E]/80 backdrop-blur-sm">
                <Settings className="h-5 w-5 text-gray-400" />
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest">Control Panel</h3>
              </div>
              <div className="p-5 flex flex-col gap-5">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Max USD / Trade</label>
                  <input
                    type="number"
                    value={botConfig.max_usd}
                    onChange={(e) => setBotConfig(s => ({ ...s, max_usd: parseFloat(e.target.value) }))}
                    className="w-full bg-[#09090B] text-blue-400 font-mono text-lg px-3 py-2 rounded-lg border border-[#27272A] focus:border-blue-500/50 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Max Entry Price</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min="0.05" max="1.0" step="0.01"
                      value={botConfig.entry}
                      onChange={(e) => setBotConfig(s => ({ ...s, entry: parseFloat(e.target.value) }))}
                      className="flex-1 accent-blue-500"
                    />
                    <span className="text-xs font-mono text-blue-400 w-12">{botConfig.entry.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Target Cities (CSV)</label>
                  <input
                    type="text"
                    value={botConfig.cities}
                    onChange={(e) => setBotConfig(s => ({ ...s, cities: e.target.value }))}
                    className="w-full bg-[#09090B] text-gray-300 font-mono text-xs px-3 py-2.5 rounded-lg border border-[#27272A] focus:border-blue-500/50 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSaveSettings}
                  className="w-full mt-2 py-3 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-black tracking-widest uppercase transition-colors"
                >
                  📡 PUSH CONFIG TO BOT
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB: ESTRATEGIAS (Original Claude Data) --- */}
      {activeTab === "strategies" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {strategies.map((s) => (
            <div key={s.id} className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden shadow-lg flex flex-col">
              <div className="px-5 py-4 border-b border-[#27272A] bg-[#1C1C1E]/80 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-bold text-gray-100">{s.name}</h3>
                  <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded bg-[#09090B] border`} style={{ color: s.riskColor, borderColor: `${s.riskColor}30` }}>
                    {s.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{s.description}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-[#27272A] bg-[#09090B] overflow-hidden">
                <div className="p-3 border-r border-[#27272A] text-center">
                  <p className="text-[9px] text-gray-600 uppercase tracking-widest">WR</p>
                  <p className="text-xs font-bold text-gray-200 mt-1">{s.winRate}</p>
                </div>
                <div className="p-3 border-r border-[#27272A] text-center">
                  <p className="text-[9px] text-gray-600 uppercase tracking-widest">Returns</p>
                  <p className="text-xs font-bold text-[#00FF41] mt-1">{s.returns}</p>
                </div>
                <div className="p-3 border-r border-[#27272A] text-center">
                  <p className="text-[9px] text-gray-600 uppercase tracking-widest">Capital</p>
                  <p className="text-xs font-bold text-gray-300 mt-1">{s.capital}</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-[9px] text-gray-600 uppercase tracking-widest">Risk</p>
                  <p className="text-xs font-bold mt-1" style={{ color: s.riskColor }}>{s.risk}</p>
                </div>
              </div>
              <div className="p-5 flex-1">
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">🛠️ How it works</h4>
                <ul className="text-xs text-gray-400 flex flex-col gap-2">
                  {s.howItWorks.map((hw, i) => (
                    <li key={i} className="flex gap-2 leading-relaxed">
                      <span className="text-blue-500 mt-0.5">•</span> {hw}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-5 bg-gradient-to-br from-green-500/5 to-transparent border-t border-[#27272A]">
                <h4 className="text-[10px] font-bold text-[#00FF41] uppercase tracking-widest mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Real Results
                </h4>
                <p className="text-xs text-green-100/70 italic leading-relaxed">{s.realResults}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- TAB: CAMBIOS 2026 --- */}
      {activeTab === "changes" && (
        <div className="max-w-4xl">
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" /> Alerta Crítica (Feb 2026)
            </h3>
            <p className="text-xs text-red-200/70 leading-relaxed">
              Polymarket eliminó el delay de 500ms y añadió dynamic fees a los criptomercados. El arbitraje taker puro está muerto. Las nuevas opciones rentables son ser Maker (market making con rebates) o explotar mercados sin fees (como los de Weather).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {criticalChanges.map((c, i) => (
              <div key={i} className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="bg-[#09090B] px-3 py-1.5 rounded-lg border border-[#27272A] text-xs font-mono text-gray-400 whitespace-nowrap self-start">
                  {c.date}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-200 mb-1">{c.change}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{c.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
