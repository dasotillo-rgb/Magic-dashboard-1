'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, LineChart, Car, Activity, CloudLightning, Cog } from 'lucide-react';

const navItems = [
    { href: "/", icon: LayoutGrid, label: "Home" },
    { href: "/trading", icon: LineChart, label: "Trade" },
    { href: "/hft", icon: Activity, label: "HFT" },
    { href: "/weather", icon: CloudLightning, label: "Weather" },
    { href: "/cars", icon: Car, label: "Cars" },
    { href: "/settings", icon: Cog, label: "Setup" },
];

export function MobileNavbar() {
    const pathname = usePathname();

    if (pathname === '/login') return null;

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-lg border-t border-white/10 px-4 pt-2 flex justify-around items-center z-50" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}>
            {navItems.map(item => {
                const isActive = pathname === item.href;
                return (
                    <Link key={item.label} href={item.href}
                        className={`flex flex-col items-center gap-0.5 transition-all duration-200 min-w-[3rem] ${isActive
                            ? 'text-[#00FF41]'
                            : 'text-gray-500 hover:text-white'
                            }`}
                    >
                        <item.icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''}`} />
                        <span className="text-[9px] font-medium uppercase tracking-tight">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
