'use client';

import React from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

type Props = {
    symbol: string;
    interval?: string;
    theme?: 'light' | 'dark';
};

const TvWidget: React.FC<Props> = ({ symbol, interval = 'D', theme = 'dark' }) => {
    // Map standard intervals to TV format if needed (e.g., '1h' -> '60')
    // But the widget is smart enough.

    return (
        <div className="w-full h-full">
            <AdvancedRealTimeChart
                symbol={symbol}
                theme={theme}
                autosize
                interval={interval as any}
                timezone="Etc/UTC"
                style="1"
                locale="en"
                toolbar_bg="#f1f3f6"
                enable_publishing={false}
                hide_side_toolbar={false}
                allow_symbol_change={true}
                container_id="tradingview_widget"
            />
        </div>
    );
};

export default TvWidget;
