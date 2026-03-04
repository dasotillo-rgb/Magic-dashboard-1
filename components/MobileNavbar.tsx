'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, LineChart, Car, Activity, CloudLightning, Brain, Briefcase, Cog } from 'lucide-react';

const navItems = [
    { href: "/", icon: LayoutGrid, label: "Home" },
    { href: "/trading", icon: LineChart, label: "Trade" },
    { href: "/cars", icon: Car, label: "Cars" },
    { href: "/weather", icon: CloudLightning, label: "Weather" },
    { href: "/settings", icon: Cog, label: "Setup" },
];

export function MobileNavbar() {
    const pathname = usePathname();

    if (pathname === '/login') return null;

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-lg border-t border-white/10 px-6 py-3 flex justify-between items-center z-50">
            {navItems.map(item => {
                const isActive = pathname === item.href;
                return (
                    <Link key={item.label} href={item.href}
                        className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive
                            ? 'text-[#00FF41]'
                            : 'text-gray-500 hover:text-white'
                            }`}
                    >
                        <item.icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''}`} />
                        <span className="text-[10px] font-medium uppercase tracking-tighter">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
