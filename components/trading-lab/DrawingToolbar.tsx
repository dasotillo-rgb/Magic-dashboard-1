import React from 'react';
import { MousePointer2, TrendingUp, Minus } from 'lucide-react';

export type DrawingTool = 'cursor' | 'trend' | 'horizontal';

interface DrawingToolbarProps {
    activeTool: DrawingTool;
    onSelectTool: (tool: DrawingTool) => void;
}

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({ activeTool, onSelectTool }) => {
    const tools: { id: DrawingTool, icon: React.ElementType, label: string }[] = [
        { id: 'cursor', icon: MousePointer2, label: 'Cursor' },
        { id: 'trend', icon: TrendingUp, label: 'Trend Line' },
        { id: 'horizontal', icon: Minus, label: 'Horizontal Line' },
    ];

    return (
        <div className="absolute top-4 left-4 flex flex-col gap-1 bg-[#1C1C1E] border border-white/10 rounded-lg p-1 z-20 shadow-xl">
            {tools.map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => onSelectTool(tool.id)}
                    className={`p-2 rounded transition-colors ${activeTool === tool.id
                            ? 'bg-white/10 text-[#00E676]'
                            : 'hover:bg-white/5 text-gray-400 hover:text-white'
                        }`}
                    title={tool.label}
                >
                    <tool.icon className="w-4 h-4" />
                </button>
            ))}
            <div className="h-[1px] bg-white/10 mx-2 my-1" />
        </div>
    );
};

export default DrawingToolbar;
