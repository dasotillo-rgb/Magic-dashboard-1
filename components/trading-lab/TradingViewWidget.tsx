// components/trading-lab/TradingViewWidget.tsx
'use client';

import React, { useEffect, useRef, memo } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

const TradingViewWidget: React.FC = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (container.current && !container.current.querySelector('script')) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.type = 'text/javascript';
      script.async = true;
      script.onload = () => {
        if (window.TradingView) {
          new window.TradingView.widget({
            width: "100%",
            height: "100%",
            symbol: "BINANCE:BTCUSDT",
            interval: "D",
            timezone: "Europe/Madrid",
            theme: "dark",
            style: "1",
            locale: "es",
            hide_side_toolbar: false,
            allow_symbol_change: true,
            save_image: true,
            details: true,
            hotlist: true,
            calendar: true,
            studies: ["MAExp@tv-basicstudies", "RSI@tv-basicstudies", "MACD@tv-basicstudies"],
            container_id: "tradingview-widget-container",
            backgroundColor: "rgba(28, 28, 30, 1)",
          });
        }
      };
      container.current.appendChild(script);
    }
  }, []);

  return (
    <div className="h-full w-full bg-[#1C1C1E]/60 border border-white/10 rounded-[2rem] overflow-hidden">
      <div id="tradingview-widget-container" ref={container} className="h-full w-full" />
    </div>
  );
};

export default memo(TradingViewWidget);
