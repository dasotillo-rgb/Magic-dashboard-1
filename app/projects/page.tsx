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
    LayoutGrid,
    X,
    FileText,
    ListTodo,
    AlertTriangle,
    ArrowRight
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Suspense } from 'react';

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

const BLUEPRINTS: Record<string, { title: string, description: string, difficulty: string, roi: string, steps: string[], risks: string[] }> = {
    'ai-realestate': {
        title: 'AI Wrapper para Inmobiliarias',
        description: 'Desarrollar una herramienta SaaS que automatice la redacción de descripciones de propiedades y mejoras de imágenes para agentes inmobiliarios usando OpenAI y Replicate.',
        difficulty: 'Medium',
        roi: '€2k-€5k/mes en 3 meses',
        steps: [
            'Investigar APIs de portales inmobiliarios (Idealista, Fotocasa) para entender el formato de datos.',
            'Crear prototipo en Next.js que acepte fotos y datos básicos de un piso.',
            'Integrar GPT-4o para generar descripciones persuasivas en 3 idiomas.',
            'Integrar API de Replicate para "staging virtual" (amueblar fotos vacías).',
            'Contactar 50 agencias en LinkedIn ofreciendo beta gratuita.',
            'Lanzar landing page con Stripe para suscripciones (€49/mes).'
        ],
        risks: ['Saturación de herramientas similares', 'Dependencia de costes de API de OpenAI']
    },
    'car-api-saas': {
        title: 'API de Precios de Coches (SaaS)',
        description: 'Empaquetar nuestro scraper de Mobile.de/AutoScout24 como una API REST comercial para concesionarios pequeños que quieren monitorizar competencia.',
        difficulty: 'Hard',
        roi: '€500-€1k/mes inicial',
        steps: [
            'Empaquetar el bot de scraping actual en un contenedor Docker aislado.',
            'Crear una capa de API segura con autenticación (API Keys) usando FastAPI o Next.js API Routes.',
            'Implementar sistema de créditos/cuotas (e.g., 1000 requests/mes).',
            'Crear documentación en Postman.',
            'Promocionar en foros de compraventa de coches y RapidAPI.'
        ],
        risks: ['Bloqueos de IP por parte de las plataformas fuente', 'Aspectos legales del scraping masivo']
    },
    'content-strategy': {
        title: 'Estrategia de Contenido TikTok: Coches',
        description: 'Crear una marca personal automatizada que suba clips de los "chollos" detectados a TikTok/Reels para atraer compradores y derivarlos a un servicio de importación personal.',
        difficulty: 'Easy',
        roi: '€1k/coche gestionado',
        steps: [
            'Configurar bot para que genere un video simple (imágenes + texto superpuesto) cada vez que detecte un profit > €4k.',
            'Crear cuenta "AlemaniaImport Pro" en TikTok/IG/Shorts.',
            'Publicar 3 vídeos diarios automáticamente.',
            'En el link de la bio, poner formulario para "Encargar coche".',
            'Cobrar comisión de gestión por ayudar al cliente a la importación.'
        ],
        risks: ['Tasa de conversión baja inicial', 'Shadowban si el contenido es muy repetitivo']
    }
};

const ProjectBlueprintModal = ({ id, onClose }: { id: string, onClose: () => void }) => {
    const blueprint = BLUEPRINTS[id];
    if (!blueprint) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-[#1C1C1E] w-full max-w-2xl max-h-[80vh] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider">
                                Blueprint
                            </span>
                            <span className="text-[10px] font-mono text-gray-500">ID: {id}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white leading-tight">{blueprint.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8">
                    {/* Overview */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Dificultad</h3>
                            <p className="text-lg font-bold text-white">{blueprint.difficulty}</p>
                        </div>
                        <div className="p-4 bg-[#00FF41]/10 rounded-2xl border border-[#00FF41]/20">
                            <h3 className="text-xs font-bold text-[#00FF41]/70 uppercase tracking-wider mb-1">ROI Estimado</h3>
                            <p className="text-lg font-bold text-[#00FF41]">{blueprint.roi}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-gray-300 leading-relaxed text-sm">{blueprint.description}</p>
                    </div>

                    {/* Steps */}
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                            <ListTodo className="h-4 w-4 text-blue-400" /> Plan de Ejecución
                        </h3>
                        <div className="space-y-3">
                            {blueprint.steps.map((step, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                                            {i + 1}
                                        </div>
                                        {i < blueprint.steps.length - 1 && <div className="w-0.5 flex-1 bg-white/5" />}
                                    </div>
                                    <p className="text-sm text-gray-400 pt-0.5 pb-4">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Risks */}
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                            <AlertTriangle className="h-4 w-4 text-orange-400" /> Riesgos y Mitigaciones
                        </h3>
                        <ul className="space-y-2">
                            {blueprint.risks.map((risk, i) => (
                                <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                                    <span className="w-1 h-1 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                                    {risk}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-colors">
                        Cerrar
                    </button>
                    <button className="px-5 py-2 rounded-xl bg-[#00FF41] text-black text-sm font-bold hover:bg-[#00FF41]/90 transition-colors flex items-center gap-2">
                        Iniciar Proyecto <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

function ProjectsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const blueprintId = searchParams.get('blueprint');

    const closeBlueprint = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('blueprint');
        router.push(`/projects?${params.toString()}`);
    };

    return (
        <main className="p-6 lg:p-10 max-w-[1600px] mx-auto min-h-screen space-y-8 relative">
            <AnimatePresence>
                {blueprintId && <ProjectBlueprintModal id={blueprintId} onClose={closeBlueprint} />}
            </AnimatePresence>

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

export default function ProjectsPage() {
    return (
        <Suspense fallback={<div className="text-white p-10">Loading Projects...</div>}>
            <ProjectsContent />
        </Suspense>
    );
}
