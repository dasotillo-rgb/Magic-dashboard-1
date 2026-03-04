'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Circle, ListTodo, Lightbulb, RefreshCw, Sparkles } from 'lucide-react';

type Task = {
    id: string;
    text: string;
    completed: boolean;
    type: 'monitor' | 'project' | 'asistencia' | 'feature' | 'fix';
    priority?: 'high' | 'medium' | 'low';
};

const DEFAULT_TASKS: Task[] = [
    // COMPLETED
    { id: 'done-1', text: 'Car Search Engine con filtro por marca/modelo/año', completed: true, type: 'feature' },
    { id: 'done-2', text: 'Logos SVG inline para marcas (BMW, Mercedes, Audi…)', completed: true, type: 'fix' },
    { id: 'done-3', text: 'Modelos exactos (xDrive30e, xDrive20i) en resultados', completed: true, type: 'fix' },
    { id: 'done-4', text: 'Cálculo de importación + profit por vehículo', completed: true, type: 'feature' },
    { id: 'done-5', text: 'Widgets minimizables con preview compacto', completed: true, type: 'feature' },
    { id: 'done-6', text: 'Widget Market Sentiment (Fear & Greed + Twitter)', completed: true, type: 'feature' },
    { id: 'done-7', text: 'Weather Widget con geolocalización', completed: true, type: 'feature' },
    { id: 'done-8', text: 'Dashboard drag & drop con persistencia', completed: true, type: 'feature' },
    { id: 'done-9', text: 'Polymarket Quant Fund widget — equity, P&L, posiciones', completed: true, type: 'feature' },
    { id: 'done-10', text: 'Emergency Stop button con modal de confirmación', completed: true, type: 'feature' },
    { id: 'done-11', text: 'Market Pulse BTC/ETH/SOL con cambio 24h en vivo', completed: true, type: 'feature' },
    { id: 'done-12', text: 'Oportunidades de negocio generadas por Gemini IA', completed: true, type: 'feature' },
    // PENDING
    { id: 'prog-1', text: 'Ampliar búsqueda a Mercedes GLC, Porsche Macan', completed: false, type: 'feature', priority: 'high' },
    { id: 'prog-2', text: 'Alertas automáticas cuando profit > €5.000', completed: false, type: 'feature', priority: 'high' },
    { id: 'prog-3', text: 'Integrar precios reales de España (Coches.net/Wallapop)', completed: false, type: 'project', priority: 'high' },
    { id: 'plan-1', text: 'Portfolio tracker cripto con PnL en tiempo real', completed: false, type: 'project', priority: 'medium' },
    { id: 'plan-2', text: 'Dashboard de ingresos: coches + cripto + proyectos', completed: false, type: 'feature', priority: 'medium' },
    { id: 'plan-3', text: 'Sistema de notificaciones push para oportunidades', completed: false, type: 'feature', priority: 'medium' },
    { id: 'plan-4', text: 'Historial de importaciones realizadas con profit real', completed: false, type: 'feature', priority: 'low' },
    { id: 'plan-5', text: 'Mobile responsive + PWA para acceso desde móvil', completed: false, type: 'feature', priority: 'low' },
];

type Props = {
    color?: string;
    borderColor?: string;
};

const typeColors: Record<string, string> = {
    monitor: 'text-blue-400', project: 'text-purple-400',
    asistencia: 'text-orange-400', feature: 'text-cyan-400', fix: 'text-yellow-400',
};

const priorityBadge: Record<string, { color: string; label: string }> = {
    high: { color: 'text-red-400 bg-red-400/10', label: 'ALTA' },
    medium: { color: 'text-yellow-400 bg-yellow-400/10', label: 'MEDIA' },
    low: { color: 'text-gray-500 bg-white/5', label: 'BAJA' },
};

const STORAGE_KEY = 'dashboard_roadmap_tasks';

const TasksWidget: React.FC<Props> = ({ color = 'bg-[#1C1C1E]/60', borderColor = 'border-white/10' }) => {
    const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
    const [aiLoading, setAiLoading] = useState(false);
    const [newTaskText, setNewTaskText] = useState('');
    const [adding, setAdding] = useState(false);

    // Load persisted task states from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const completedMap: Record<string, boolean> = JSON.parse(saved);
                setTasks(prev => prev.map(t => ({
                    ...t,
                    completed: completedMap[t.id] !== undefined ? completedMap[t.id] : t.completed,
                })));
            }
        } catch { /* ignore */ }
    }, []);

    // Persist whenever tasks change
    const persistTasks = useCallback((updated: Task[]) => {
        const map: Record<string, boolean> = {};
        updated.forEach(t => { map[t.id] = t.completed; });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    }, []);

    const toggleTask = (id: string) => {
        setTasks(prev => {
            const next = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
            persistTasks(next);
            return next;
        });
    };

    // Ask Gemini to suggest a new task
    const suggestTask = async () => {
        setAiLoading(true);
        try {
            const res = await fetch('/api/suggest-task');
            const data = await res.json();
            if (data.task) {
                const newTask: Task = {
                    id: `ai-${Date.now()}`,
                    text: data.task,
                    completed: false,
                    type: data.type || 'feature',
                    priority: data.priority || 'medium',
                };
                setTasks(prev => {
                    const next = [...prev, newTask];
                    persistTasks(next);
                    return next;
                });
            }
        } catch { /* silently ignore */ }
        finally { setAiLoading(false); }
    };

    const addManualTask = () => {
        if (!newTaskText.trim()) { setAdding(false); return; }
        const newTask: Task = {
            id: `manual-${Date.now()}`,
            text: newTaskText.trim(),
            completed: false,
            type: 'feature',
            priority: 'medium',
        };
        setTasks(prev => {
            const next = [...prev, newTask];
            persistTasks(next);
            return next;
        });
        setNewTaskText('');
        setAdding(false);
    };

    const completed = tasks.filter(t => t.completed);
    const pending = tasks.filter(t => !t.completed);
    const progressPct = Math.round((completed.length / tasks.length) * 100);

    return (
        <div className={`${color} border ${borderColor} rounded-[2rem] p-5 transition-all hover:bg-white/5 overflow-hidden flex flex-col h-full`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="text-[11px] font-bold text-gray-400 tracking-wider flex items-center gap-1.5 uppercase">
                    <ListTodo className="h-3.5 w-3.5 text-[#00FF41]" /> Roadmap Dashboard
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-gray-500">{completed.length}/{tasks.length}</span>
                    <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00FF41] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                    </div>
                    {/* Add task */}
                    <button
                        onClick={() => setAdding(v => !v)}
                        title="Añadir tarea"
                        className="text-gray-600 hover:text-[#00FF41] transition-colors text-[10px] font-bold"
                    >+</button>
                    {/* Gemini suggest */}
                    <button
                        onClick={suggestTask}
                        disabled={aiLoading}
                        title="Sugerir tarea con IA"
                        className="text-gray-600 hover:text-purple-400 transition-colors disabled:opacity-40"
                    >
                        <Sparkles className={`h-3 w-3 ${aiLoading ? 'animate-pulse' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Add task input */}
            {adding && (
                <div className="flex gap-1.5 mb-2 shrink-0">
                    <input
                        autoFocus
                        value={newTaskText}
                        onChange={e => setNewTaskText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addManualTask(); if (e.key === 'Escape') { setAdding(false); setNewTaskText(''); } }}
                        placeholder="Nueva tarea… (Enter para añadir)"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white placeholder-gray-600 outline-none focus:border-[#00FF41]/40"
                    />
                    <button onClick={addManualTask} className="text-[9px] text-[#00FF41] hover:text-white transition-colors font-bold px-1">✓</button>
                </div>
            )}

            {/* Task list */}
            <div className="space-y-2 flex-1 overflow-y-auto min-h-0 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {/* Pending */}
                <p className="text-[8px] text-gray-600 font-bold uppercase tracking-wider">Próximos pasos</p>
                {pending.map(task => (
                    <div
                        key={task.id}
                        className="flex items-start gap-2.5 group cursor-pointer"
                        onClick={() => toggleTask(task.id)}
                    >
                        <div className="mt-0.5 shrink-0">
                            {task.priority === 'high' ? (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-red-400/60 flex items-center justify-center group-hover:border-red-400 transition-colors">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                </div>
                            ) : (
                                <Circle className="h-3.5 w-3.5 text-gray-600 group-hover:text-[#00FF41] transition-colors" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] leading-relaxed text-gray-300 group-hover:text-white transition-colors truncate">{task.text}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[7px] uppercase tracking-wider font-bold ${typeColors[task.type] || 'text-gray-500'}`}>{task.type}</span>
                                {task.priority && (
                                    <span className={`text-[7px] px-1 py-px rounded font-bold ${priorityBadge[task.priority]?.color || ''}`}>
                                        {priorityBadge[task.priority]?.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Completed */}
                <p className="text-[8px] text-gray-600 font-bold uppercase tracking-wider mt-3 pt-2 border-t border-white/5">Completado</p>
                {completed.map(task => (
                    <div
                        key={task.id}
                        className="flex items-start gap-2.5 opacity-50 cursor-pointer hover:opacity-70 transition-opacity"
                        onClick={() => toggleTask(task.id)}
                    >
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#00FF41] mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] leading-relaxed text-gray-500 line-through truncate">{task.text}</p>
                            <span className={`text-[7px] uppercase tracking-wider font-bold ${typeColors[task.type] || 'text-gray-500'}`}>{task.type}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-3 pt-2 border-t border-white/5 shrink-0">
                <p className="text-[9px] text-gray-500 italic flex items-center gap-1">
                    <Lightbulb className="h-3 w-3 text-yellow-400" />
                    {progressPct}% completado · {pending.filter(t => t.priority === 'high').length} prioritarias · click para marcar
                </p>
            </div>
        </div>
    );
};

export default TasksWidget;
