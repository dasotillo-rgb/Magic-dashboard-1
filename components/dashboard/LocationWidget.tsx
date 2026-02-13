'use client';
import React from 'react';
import { MapPin } from 'lucide-react';

type Props = {
    detail: string;
    color?: string;
    borderColor?: string;
};

const LocationWidget: React.FC<Props> = ({ detail, color = 'bg-[#1C1C1E]/60', borderColor = 'border-orange-500/20' }) => {
    return (
        <div className={`${color} border ${borderColor} rounded-[2rem] p-6 h-full transition-all hover:bg-white/5`}>
            <h3 className="text-xs font-semibold text-orange-400 tracking-wider flex items-center gap-1.5 mb-4">
                <MapPin className="h-3.5 w-3.5" /> LOCATION INTEL
            </h3>
            <p className="text-sm text-gray-300 italic leading-relaxed">
                &quot;{detail}&quot;
            </p>
        </div>
    );
};

export default LocationWidget;
