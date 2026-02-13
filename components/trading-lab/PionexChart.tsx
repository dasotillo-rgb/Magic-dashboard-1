'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
    createChart,
    CandlestickSeries,
    LineSeries,
    AreaSeries,
    type IChartApi,
    type CandlestickData,
    type LineData,
    type Time,
    type LineWidth,
} from 'lightweight-charts';
import { calculateGeminiMoneyLine, type MoneyLinePoint } from '@/lib/gemini-money-line';
import { RangeAreaSeries } from './plugins/RangeAreaSeriesV2';
import DrawingToolbar, { type DrawingTool } from './DrawingToolbar';

// Types for drawings
type DrawingPoint = { time: Time; price: number };
type Drawing = {
    id: string;
    type: 'trend' | 'horizontal';
    p1: DrawingPoint;
    p2?: DrawingPoint; // p2 used for trend lines
};

type Props = {
    symbol: string;
    interval: string;
};

const PionexChart: React.FC<Props> = ({ symbol, interval }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRefs = useRef<any[]>([]);
    const candleSeriesRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Drawing state
    const [activeTool, setActiveTool] = useState<DrawingTool>('cursor');
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [svgContent, setSvgContent] = useState<React.ReactNode>(null);

    const resizeObserver = useRef<ResizeObserver | null>(null);

    // Helper to create chart options
    const getChartOptions = (width: number, height: number) => ({
        width,
        height,
        layout: {
            background: { color: '#1C1C1E' },
            textColor: '#9CA3AF',
            fontSize: 12,
        },
        grid: {
            vertLines: { color: 'rgba(255,255,255,0.04)' },
            horzLines: { color: 'rgba(255,255,255,0.04)' },
        },
        crosshair: {
            vertLine: { color: 'rgba(0,255,65,0.3)', width: 1 as LineWidth, style: 2 },
            horzLine: { color: 'rgba(0,255,65,0.3)', width: 1 as LineWidth, style: 2 },
        },
        rightPriceScale: {
            borderColor: 'rgba(255,255,255,0.1)',
            autoScale: true,
        },
        timeScale: {
            borderColor: 'rgba(255,255,255,0.1)',
            timeVisible: true,
            secondsVisible: false,
        },
        handleScroll: true,
        handleScale: true,
    });

    const fetchAndRender = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/pionex/candles?symbol=${symbol}&interval=${interval}&limit=500`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);
            if (!data.candles || data.candles.length === 0) throw new Error('No candle data received');

            if (!containerRef.current) return;

            // HARD RESET: Destroy old chart AND Clear DOM to ensure no ghosts
            if (chartRef.current) {
                try {
                    chartRef.current.remove();
                } catch (e) { console.warn(e); }
                chartRef.current = null;
            }
            if (resizeObserver.current) {
                resizeObserver.current.disconnect();
                resizeObserver.current = null;
            }
            // Nuking the DOM container is the most reliable way to clear LWC ghosts
            containerRef.current.innerHTML = '';

            // Create new chart
            const chart = createChart(containerRef.current, getChartOptions(
                containerRef.current.clientWidth,
                containerRef.current.clientHeight
            ));
            chartRef.current = chart;

            // Setup ResizeObserver
            const ro = new ResizeObserver(() => {
                if (containerRef.current && chartRef.current) {
                    chartRef.current.applyOptions({
                        width: containerRef.current.clientWidth,
                        height: containerRef.current.clientHeight,
                    });
                }
            });
            ro.observe(containerRef.current);
            resizeObserver.current = ro;

            seriesRefs.current = [];

            let candles = data.candles;

            // FIX: Find the contiguous segment of legitimate data ending at the present.
            const lastClose = candles[candles.length - 1].close;
            let startIndex = candles.length - 1;

            for (let i = candles.length - 1; i >= 0; i--) {
                const c = candles[i];
                const diff = Math.abs(c.close - lastClose) / lastClose;
                if (diff > 0.3) {
                    startIndex = i + 1;
                    break;
                }
                startIndex = i;
            }

            if (candles.length - startIndex < 50) {
                startIndex = Math.max(0, candles.length - 100);
            }

            candles = candles.slice(startIndex);

            // FIX 2: Clamp bad wicks 
            const sliceCount = candles.length;
            candles = candles.map((c: any) => {
                const limitHigh = lastClose * 1.25;
                const limitLow = lastClose * 0.75;
                return {
                    ...c,
                    high: c.high > limitHigh ? limitHigh : c.high,
                    low: c.low < limitLow ? limitLow : c.low,
                    open: Math.min(Math.max(c.open, limitLow), limitHigh),
                    close: Math.min(Math.max(c.close, limitLow), limitHigh),
                };
            });
            console.log(`Clamped ${sliceCount} candles.`);

            const maxHigh = Math.max(...candles.map((c: any) => c.high));
            const minLow = Math.min(...candles.map((c: any) => c.low));

            // --- 1. Cloud fill (Custom RangeAreaSeries) ---
            const moneyLine = calculateGeminiMoneyLine(candles, symbol);

            const cloudData: any[] = [];
            for (const p of moneyLine.cloud) {
                cloudData.push({
                    time: p.time as Time,
                    upper: p.upper,
                    lower: p.lower,
                    color: p.trend === 1 ? 'rgba(0, 230, 118, 0.4)' : 'rgba(255, 82, 82, 0.4)',
                });
            }

            const cloudSeries = chart.addCustomSeries(new RangeAreaSeries(), {
                priceLineVisible: false,
                lastValueVisible: false,
            } as any);
            cloudSeries.setData(cloudData);
            seriesRefs.current.push(cloudSeries);

            // --- 2. Candlestick series ---
            const candleSeries = chart.addSeries(CandlestickSeries, {
                upColor: '#00E676',
                downColor: '#FF5252',
                borderUpColor: '#00E676',
                borderDownColor: '#FF5252',
                wickUpColor: '#00E676',
                wickDownColor: '#FF5252',
            });
            candleSeriesRef.current = candleSeries;

            const candleData: CandlestickData<Time>[] = candles.map((c: any) => ({
                time: c.time as Time,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
            }));
            candleSeries.setData(candleData);
            seriesRefs.current.push(candleSeries);

            // --- 3. MoneyLine Segments ---
            const segments: { trend: 1 | -1; data: LineData<Time>[] }[] = [];
            let currentSegment: { trend: 1 | -1; data: LineData<Time>[] } | null = null;

            for (const point of moneyLine.line) {
                if (point.value === null) {
                    if (currentSegment && currentSegment.data.length > 0) {
                        segments.push(currentSegment);
                    }
                    currentSegment = null;
                    continue;
                }

                if (!currentSegment || currentSegment.trend !== point.trend) {
                    if (currentSegment && currentSegment.data.length > 0) {
                        segments.push(currentSegment);
                        const lastPt = currentSegment.data[currentSegment.data.length - 1] as LineData<Time>;
                        currentSegment = { trend: point.trend, data: [lastPt] };
                    } else {
                        currentSegment = { trend: point.trend, data: [] };
                    }
                }
                currentSegment.data.push({ time: point.time as Time, value: point.value });
            }
            if (currentSegment && currentSegment.data.length > 0) {
                segments.push(currentSegment);
            }

            for (const seg of segments) {
                if (seg.data.length < 2) continue;
                const lineSeries = chart.addSeries(LineSeries, {
                    color: seg.trend === 1 ? '#00E676' : '#FF5252',
                    lineWidth: 2,
                    lastValueVisible: seg === segments[segments.length - 1],
                    priceLineVisible: false,
                    crosshairMarkerVisible: false,
                });
                lineSeries.setData(seg.data);
                seriesRefs.current.push(lineSeries);
            }

            // --- 4. Flip Level ---
            if (moneyLine.flipLevel !== null) {
                candleSeries.createPriceLine({
                    price: moneyLine.flipLevel,
                    color: moneyLine.currentTrend === 1 ? '#00E676' : '#FF5252',
                    lineWidth: 1 as any,
                    lineStyle: 2,
                    axisLabelVisible: true,
                    title: 'Flip Level',
                });
            }

            // --- 5. Markers ---
            try {
                const markers = moneyLine.labels.map(label => ({
                    time: label.time as Time,
                    position: label.type === 'bullish' ? 'belowBar' as const : 'aboveBar' as const,
                    color: label.type === 'bullish' ? '#00E676' : '#FF0080',
                    shape: label.type === 'bullish' ? 'arrowUp' as const : 'arrowDown' as const,
                    text: label.type,
                }));
                // We rely on LWC auto-scale handling markers. Now that data is clamped, markers shouldn't fly away too far.
                // The TR cap in calculateMoneyLine prevents 3*ATR from being huge.
                if (typeof (candleSeries as any).setMarkers === 'function') {
                    (candleSeries as any).setMarkers(markers);
                }
            } catch { }

            // --- 6. Bot Visuals ---
            try {
                const botsRes = await fetch('/api/pionex/bots');
                const { bots } = await botsRes.json();
                const activeBotsForSymbol = bots.filter((b: any) => b.symbol === symbol && b.status === 'RUNNING');

                for (const bot of activeBotsForSymbol) {
                    if (bot.type === 'GRID' && bot.upperPrice && bot.lowerPrice) {
                        // Draw grid boundary lines
                        candleSeries.createPriceLine({
                            price: bot.upperPrice,
                            color: 'rgba(99, 102, 241, 0.6)',
                            lineWidth: 1 as any,
                            lineStyle: 3,
                            axisLabelVisible: true,
                            title: 'Grid Upper',
                        });
                        candleSeries.createPriceLine({
                            price: bot.lowerPrice,
                            color: 'rgba(99, 102, 241, 0.6)',
                            lineWidth: 1 as any,
                            lineStyle: 3,
                            axisLabelVisible: true,
                            title: 'Grid Lower',
                        });
                    }
                }
            } catch (e) {
                console.warn('Could not fetch bot visualizations', e);
            }

            // FIX: Ensure Visible
            chart.timeScale().fitContent();

            // --- Drawing System Update Loop ---
            const updateDrawings = () => {
                const chart = chartRef.current;
                const series = candleSeriesRef.current;
                if (!chart || !series || !overlayRef.current) return;
                const timeScale = chart.timeScale();
                const getCoords = (p: DrawingPoint) => {
                    const x = timeScale.timeToCoordinate(p.time);
                    const y = series.priceToCoordinate(p.price);
                    return { x: x ?? -100, y: y ?? -100 };
                };
                const allDrawings = [...drawings, ...(currentDrawing ? [currentDrawing] : [])];
                const paths = allDrawings.map((d) => {
                    const c1 = getCoords(d.p1);
                    if (d.type === 'horizontal') {
                        const width = containerRef.current?.clientWidth || 0;
                        return (
                            <line key={d.id} x1={0} y1={c1.y} x2={width} y2={c1.y} stroke="#00E676" strokeWidth={2} strokeDasharray="5,5" />
                        );
                    } else if (d.type === 'trend' && d.p2) {
                        const c2 = getCoords(d.p2);
                        return (
                            <line key={d.id} x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke="#00E676" strokeWidth={2} />
                        );
                    }
                    return null;
                });
                setSvgContent(paths);
            };

            (chart as any)._updateDrawings = updateDrawings;
            chart.timeScale().subscribeVisibleTimeRangeChange(updateDrawings);

        } catch (err: any) {
            console.error('Chart fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [symbol, interval, drawings, currentDrawing, overlayRef, containerRef]);

    useEffect(() => {
        fetchAndRender();
        return () => {
            if (resizeObserver.current) {
                resizeObserver.current.disconnect();
                resizeObserver.current = null;
            }
            if (chartRef.current) {
                try { chartRef.current.remove(); } catch { }
                chartRef.current = null;
            }
        };
    }, [fetchAndRender]);

    useEffect(() => {
        if (chartRef.current && (chartRef.current as any)._updateDrawings) {
            (chartRef.current as any)._updateDrawings();
        }
    }, [drawings, currentDrawing, activeTool]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (activeTool === 'cursor' || !chartRef.current || !candleSeriesRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const timeScale = chartRef.current.timeScale();
        const series = candleSeriesRef.current;
        const time = timeScale.coordinateToTime(x) as Time;
        const price = series.coordinateToPrice(y);
        if (!time || !price) return;

        if (activeTool === 'horizontal') {
            const newDrawing: Drawing = { id: Math.random().toString(36).substr(2, 9), type: 'horizontal', p1: { time, price } };
            setDrawings(prev => [...prev, newDrawing]);
            setActiveTool('cursor');
        } else if (activeTool === 'trend') {
            const newDrawing: Drawing = { id: Math.random().toString(36).substr(2, 9), type: 'trend', p1: { time, price }, p2: { time, price } };
            setCurrentDrawing(newDrawing);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!currentDrawing || !chartRef.current || !candleSeriesRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const timeScale = chartRef.current.timeScale();
        const series = candleSeriesRef.current;
        const time = timeScale.coordinateToTime(x) as Time;
        const price = series.coordinateToPrice(y);
        if (time && price) setCurrentDrawing(prev => prev ? { ...prev, p2: { time, price } } : null);
    };

    const handleMouseUp = () => {
        if (currentDrawing) {
            setDrawings(prev => [...prev, currentDrawing]);
            setCurrentDrawing(null);
            setActiveTool('cursor');
        }
    };

    return (
        <div className="relative w-full h-full flex flex-col bg-[#1C1C1E]">
            {error && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#1C1C1E]/90">
                    <div className="text-center px-6">
                        <p className="text-red-400 text-sm font-mono mb-2">⚠️ {error}</p>
                        <button onClick={fetchAndRender} className="text-xs text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-colors">Reintentar</button>
                    </div>
                </div>
            )}
            <div ref={containerRef} className="w-full h-full relative">
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ zIndex: 10 }}>{svgContent}</svg>
                {activeTool !== 'cursor' && (
                    <div className="absolute inset-0 z-20 cursor-crosshair" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} />
                )}
                <div ref={containerRef} className="w-full h-full" />
            </div>
            <DrawingToolbar activeTool={activeTool} onSelectTool={setActiveTool} />
        </div>
    );
};

export default PionexChart;
