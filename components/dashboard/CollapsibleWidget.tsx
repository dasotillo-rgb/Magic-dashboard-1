'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type Props = {
    id: string;
    children: React.ReactNode;
    /** Height in px for the compact/minimized preview */
    compactHeight?: number;
    defaultCollapsed?: boolean;
};

const CollapsibleWidget: React.FC<Props> = ({
    id,
    children,
    compactHeight = 260,
    defaultCollapsed = false,
}) => {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);

    // Persist collapsed state
    useEffect(() => {
        const saved = localStorage.getItem(`widget_compact_${id}`);
        if (saved !== null) setCollapsed(saved === 'true');
    }, [id]);

    const toggle = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem(`widget_compact_${id}`, String(next));
    };

    return (
        <div className="h-full flex flex-col relative">
            {/* Widget content — scrollable when collapsed, natural when expanded */}
            {/* Widget content — scrollable when collapsed, natural when expanded */}
            <div
                className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'overflow-hidden' : 'overflow-visible'
                    }`}
                style={collapsed ? { maxHeight: `${compactHeight}px` } : {}}
            >
                {/* Ensure children fill the height so their borders render correctly */}
                <div className="h-full flex flex-col">
                    {children}
                </div>
            </div>

            {/* Expand/Collapse toggle button */}
            <button
                onClick={toggle}
                className={`
                    flex items-center justify-center gap-1.5 w-full py-1.5
                    text-[9px] font-bold tracking-wider uppercase
                    transition-all z-20 mt-1
                    ${collapsed
                        ? 'text-gray-500 hover:text-blue-400'
                        : 'text-gray-600 hover:text-gray-400'
                    }
                `}
            >
                {collapsed ? (
                    <>
                        <ChevronDown className="h-3 w-3" />
                        <span>Expandir</span>
                    </>
                ) : (
                    <>
                        <ChevronUp className="h-3 w-3" />
                        <span>Minimizar</span>
                    </>
                )}
            </button>
        </div>
    );
};

export default CollapsibleWidget;
