'use client';
import React from 'react';
import OrdersPanel from '@/components/trading-lab/OrdersPanel';
import { Activity } from 'lucide-react';

type Props = {
    color?: string;
    borderColor?: string;
};

const OrdersWidget: React.FC<Props> = ({ color = 'bg-[#1C1C1E]/60', borderColor = 'border-blue-500/20' }) => {
    return (
        <div className={`${color} border ${borderColor} rounded-[2rem] p-6 h-full flex flex-col transition-all hover:bg-white/5`}>
            <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-blue-400" />
                <h3 className="text-xs font-semibold text-gray-400 tracking-wider">OPEN ORDERS</h3>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-white/5">
                <OrdersPanel symbol="BTC_USDT" />
            </div>
        </div>
    );
};

export default OrdersWidget;
