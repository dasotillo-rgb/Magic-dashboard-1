'use client';
import React from 'react';
import {
    Briefcase,
    TrendingUp,
    CheckCircle2,
    Play,
    Zap,
    Plus,
    Bot,
    ArrowUpRight,
    Target,
    Clock,
    LayoutGrid
} from 'lucide-react';

const PROJECTS = [
    {
        id: '1',
        name: 'Trading Strategy v2',
        progress: 85,
        status: 'OPTIMIZING',
        tasks: ['Backtest 1H timeframe', 'Refine Flip Logics'],
        color: 'text-green-400',
        icon: TrendingUp
    },
    {
        id: '2',
        name: 'Ape Dash Alpha',
        progress: 60,
        status: 'DEVELOPING',
        tasks: ['Implement Projects DB', 'Fix Drag & Drop handles'],
        color: 'text-orange-400',
        icon: LayoutGrid
    },
    {
        id: '3',
        name: 'Portfolio Tracker',
        progress: 30,
        status: 'PLANNING',
        tasks: ['Gather Binance API Specs', 'Sketch UI layout'],
        color: 'text-blue-400',
        icon: Target
    },
];

const RECOMMENDATIONS = [
    {
        title: 'CloudBot CashGen',
        desc: 'Bot de arbitraje de baja latencia desplegable en VPS.',
        roi: '+15% mensual est.',
        difficulty: 'Easy (with Assistant)',
        icon: Bot,
        glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]'
    },
    {
        title: 'SaaS Crypto Signals',
        desc: 'Alertas Premium vía Telegram de mis indicadores.',
        roi: 'Escalable',
        difficulty: 'Medium',
        icon: Zap,
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]'
    }
];

export default function ProjectsPage() {
    return (
        <main className="p-6 lg:p-10 max-w-[1600px] mx-auto min-h-screen space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Briefcase className="h-8 w-8 text-orange-400" />
                        Project Ecosystem
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Monitoreo, evolución y expansión de activos digitales</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#00FF41] text-black text-sm font-bold rounded-lg hover:bg-[#00FF41]/90 transition-all">
                    <Plus className="h-4 w-4" /> NEW PROJECT
                </button>
            </header>

            <div className="grid grid-cols-12 gap-6">
                {/* PROJECTS EVOLUTION */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                    <section className="bg-[#1C1C1E]/60 border border-white/10 rounded-[2rem] p-8">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Evolución de Proyectos
                        </h2>

                        <div className="space-y-10">
                            {PROJECTS.map(project => (
                                <div key={project.id} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                                                <project.icon className={`h-6 w-6 ${project.color}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white tracking-tight">{project.name}</h3>
                                                <p className="text-xs text-gray-500 font-mono italic">{project.status}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-white tabular-nums">{project.progress}%</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className={`h-full bg-gradient-to-r ${project.progress > 70 ? 'from-green-500 to-emerald-400' :
                                                    project.progress > 40 ? 'from-orange-500 to-yellow-400' :
                                                        'from-blue-500 to-cyan-400'
                                                }`}
                                            style={{ width: `${project.progress}%` }}
                                        />
                                    </div>

                                    {/* Tasks Preview */}
                                    <div className="flex items-center gap-6 pt-2">
                                        {project.tasks.map((task, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <CheckCircle2 className="h-3 w-3 text-gray-600" />
                                                <span className="text-[10px] text-gray-400 font-medium">{task}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* QUICK TASKS AREA */}
                    <section className="bg-[#1C1C1E]/60 border border-white/10 rounded-[2rem] p-8">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Próximos Pasos (Backlog)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-xl border border-dashed border-white/10 hover:border-[#00FF41]/40 transition-all cursor-pointer group">
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Immediate</span>
                                <p className="text-xs text-gray-300 mt-1 flex items-center gap-2">
                                    <Play className="h-3 w-3 text-[#00FF41]" /> Desplegar monitoreo en tiempo real para Pionex
                                </p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-dashed border-white/10 hover:border-[#00FF41]/40 transition-all cursor-pointer group">
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Strategic</span>
                                <p className="text-xs text-gray-300 mt-1 flex items-center gap-2">
                                    <Play className="h-3 w-3 text-[#00FF41]" /> Documentar manual de IA para futuros proyectos
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* SIDEBAR: RECOMMENDATIONS */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <section className="bg-[#1C1C1E]/80 border border-orange-500/20 rounded-[2rem] p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[60px]" />
                        <h2 className="text-xs font-bold text-orange-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <ArrowUpRight className="h-4 w-4" /> AI Recommendations
                        </h2>

                        <div className="space-y-6">
                            {RECOMMENDATIONS.map((rec, i) => (
                                <div key={i} className={`p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all relative group ${rec.glow}`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-black/40 rounded-2xl border border-white/5 text-orange-400">
                                            <rec.icon className="h-6 w-6" />
                                        </div>
                                        <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded text-bold">{rec.roi}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{rec.title}</h3>
                                    <p className="text-xs text-gray-400 leading-relaxed mb-4">{rec.desc}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-600 font-mono uppercase tracking-tighter">Dif: {rec.difficulty}</span>
                                        <button className="text-[10px] font-black text-orange-400 hover:text-white flex items-center gap-1 group">
                                            EXPLORE <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-6 bg-gradient-to-br from-[#00FF41]/10 to-transparent rounded-3xl border border-[#00FF41]/20">
                            <h4 className="text-sm font-bold text-[#00FF41] mb-2 flex items-center gap-2">
                                <Bot className="h-4 w-4" /> ClawedBot v1 (Beta)
                            </h4>
                            <p className="text-[10px] text-gray-300 italic mb-4">
                                "Comandante, he detectado una ineficiencia en el par SOL/USDT que podemos explotar con un micro-bot."
                            </p>
                            <button className="w-full py-2 bg-[#00FF41]/20 border border-[#00FF41]/40 rounded-lg text-[#00FF41] text-[10px] font-black hover:bg-[#00FF41] hover:text-black transition-all">
                                LAUNCH CASH GEN ENGINE
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
