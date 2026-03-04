'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, LineChart, Brain, Briefcase, Cog, Zap, Car, Activity, CloudLightning } from 'lucide-react';

const navItems = [
  { href: "/", icon: LayoutGrid, label: "Overview" },
  { href: "/trading", icon: LineChart, label: "Trading Lab" },
  { href: "/cars", icon: Car, label: "Car Search" },
  { href: "/hft", icon: Activity, label: "HFT V2 Bot" },
  { href: "/weather", icon: CloudLightning, label: "Weather Bot" },
  { href: "/brain", icon: Brain, label: "Brain Chat" },
  { href: "/projects", icon: Briefcase, label: "Projects" },
  { href: "/settings", icon: Cog, label: "Settings" },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  return (
    <aside className="group w-20 hover:w-56 bg-[#0A0A0A] border-r border-white/10 py-6 px-4 flex flex-col items-start flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden z-50">
      {/* Logo — fixed height so it doesn't overlap */}
      <div className="flex items-center gap-3 mb-10 px-1 h-8 whitespace-nowrap overflow-hidden">
        <Zap className="h-6 w-6 text-white flex-shrink-0" />
        <span className="text-white font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 truncate">APE Intelligence</span>
      </div>

      {/* Navigation — increased gap */}
      <nav className="flex flex-col gap-4 w-full">
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.label} href={item.href} title={item.label}
              className={`flex items-center gap-3 px-2.5 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap ${isActive
                ? 'bg-[#00FF41]/15 text-[#00FF41]'
                : 'text-gray-500 hover:bg-white/5 hover:text-white'
                }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom circle */}
      <div className="mt-auto px-1">
        <div className="w-9 h-9 rounded-full bg-indigo-500/80 flex-shrink-0" />
      </div>
    </aside>
  );
}
