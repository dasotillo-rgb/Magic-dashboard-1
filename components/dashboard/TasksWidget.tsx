'use client';
import React from 'react';
import { CheckCircle2, Circle, ListTodo, Lightbulb, ArrowRight, Clock } from 'lucide-react';

type Task = {
    id: string;
    text: string;
    completed: boolean;
    type: 'monitor' | 'project' | 'asistencia' | 'feature' | 'fix';
    priority?: 'high' | 'medium' | 'low';
};

// Dynamic task list — reflects current Magic Dashboard development progress
const DASHBOARD_TASKS: Task[] = [
    // COMPLETED — things we've already built
    { id: 'done-1', text: 'Car Search Engine con filtro por marca/modelo/año', completed: true, type: 'feature' },
    { id: 'done-2', text: 'Logos SVG inline para marcas (BMW, Mercedes, Audi...)', completed: true, type: 'fix' },
    { id: 'done-3', text: 'Modelos exactos (xDrive30e, xDrive20i) en resultados', completed: true, type: 'fix' },
    { id: 'done-4', text: 'Cálculo de importación + profit por vehículo', completed: true, type: 'feature' },
    { id: 'done-5', text: 'Widgets minimizables con preview compacto', completed: true, type: 'feature' },
    { id: 'done-6', text: 'Widget Market Sentiment (Fear & Greed + Twitter)', completed: true, type: 'feature' },
    { id: 'done-7', text: 'Weather Widget con geolocalización', completed: true, type: 'feature' },
    { id: 'done-8', text: 'Dashboard drag & drop con persistencia', completed: true, type: 'feature' },

    // IN PROGRESS — current development focus
    { id: 'prog-1', text: 'Ampliar búsqueda a Mercedes GLC, Audi Q5, Porsche Macan', completed: false, type: 'feature', priority: 'high' },
    { id: 'prog-2', text: 'Alertas automáticas cuando profit > €5.000', completed: false, type: 'feature', priority: 'high' },
    { id: 'prog-3', text: 'Integrar precios reales de España (Coches.net / Wallapop)', completed: false, type: 'project', priority: 'high' },

    // PLANNED — next steps
    { id: 'plan-1', text: 'Portfolio tracker cripto con PnL en tiempo real', completed: false, type: 'project', priority: 'medium' },
    { id: 'plan-2', text: 'Bot de trading automático BTC/USDT en Pionex', completed: false, type: 'project', priority: 'medium' },
    { id: 'plan-3', text: 'Dashboard de ingresos: coches + cripto + proyectos', completed: false, type: 'feature', priority: 'medium' },
    { id: 'plan-4', text: 'Sistema de notificaciones push para oportunidades', completed: false, type: 'feature', priority: 'medium' },
    { id: 'plan-5', text: 'Historial de importaciones realizadas con profit real', completed: false, type: 'feature', priority: 'low' },
    { id: 'plan-6', text: 'CloudBot: IA asistente integrado en el dashboard', completed: false, type: 'project', priority: 'low' },
    { id: 'plan-7', text: 'Mobile responsive + PWA para acceso desde móvil', completed: false, type: 'feature', priority: 'low' },
    { id: 'plan-8', text: 'API de autenticación + multi-usuario', completed: false, type: 'project', priority: 'low' },
];

type Props = {
    color?: string;
    borderColor?: string;
};

const typeColors: Record<string, string> = {
    monitor: 'text-blue-400',
    project: 'text-purple-400',
    asistencia: 'text-orange-400',
    feature: 'text-cyan-400',
    fix: 'text-yellow-400',
};

const priorityBadge: Record<string, { color: string; label: string }> = {
    high: { color: 'text-red-400 bg-red-400/10', label: 'ALTA' },
    medium: { color: 'text-yellow-400 bg-yellow-400/10', label: 'MEDIA' },
    low: { color: 'text-gray-500 bg-white/5', label: 'BAJA' },
};

const TasksWidget: React.FC<Props> = ({ color = 'bg-[#1C1C1E]/60', borderColor = 'border-white/10' }) => {
    const completed = DASHBOARD_TASKS.filter(t => t.completed);
    const pending = DASHBOARD_TASKS.filter(t => !t.completed);
    const progressPct = Math.round((completed.length / DASHBOARD_TASKS.length) * 100);

    return (
        <div className={`${color} border ${borderColor} rounded-[2rem] p-5 transition-all hover:bg-white/5 overflow-hidden flex flex-col h-full`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold text-gray-400 tracking-wider flex items-center gap-1.5 uppercase">
                    <ListTodo className="h-3.5 w-3.5 text-[#00FF41]" /> Roadmap Dashboard
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-gray-500">{completed.length}/{DASHBOARD_TASKS.length}</span>
                    <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#00FF41] rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Pending tasks — sorted by priority */}
            <div className="space-y-2 flex-1 overflow-y-auto min-h-0 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <p className="text-[8px] text-gray-600 font-bold uppercase tracking-wider">Próximos pasos</p>
                {pending.map(task => (
                    <div key={task.id} className="flex items-start gap-2.5 group">
                        <div className="mt-0.5 shrink-0">
                            {task.priority === 'high' ? (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-red-400/60 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                </div>
                            ) : (
                                <Circle className="h-3.5 w-3.5 text-gray-600 group-hover:text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] leading-relaxed text-gray-300 truncate">{task.text}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[7px] uppercase tracking-wider font-bold ${typeColors[task.type] || 'text-gray-500'}`}>
                                    {task.type}
                                </span>
                                {task.priority && (
                                    <span className={`text-[7px] px-1 py-px rounded font-bold ${priorityBadge[task.priority]?.color || ''}`}>
                                        {priorityBadge[task.priority]?.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Completed tasks */}
                <p className="text-[8px] text-gray-600 font-bold uppercase tracking-wider mt-3 pt-2 border-t border-white/5">Completado</p>
                {completed.map(task => (
                    <div key={task.id} className="flex items-start gap-2.5 opacity-50">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#00FF41] mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] leading-relaxed text-gray-500 line-through truncate">{task.text}</p>
                            <span className={`text-[7px] uppercase tracking-wider font-bold ${typeColors[task.type] || 'text-gray-500'}`}>
                                {task.type}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-3 pt-2 border-t border-white/5">
                <p className="text-[9px] text-gray-500 italic flex items-center gap-1">
                    <Lightbulb className="h-3 w-3 text-yellow-400" />
                    Progreso: {progressPct}% completado · {pending.filter(t => t.priority === 'high').length} tareas prioritarias
                </p>
            </div>
        </div>
    );
};

export default TasksWidget;
