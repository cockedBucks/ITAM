'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Monitor,
  Users,
  History,
  ScanLine,
} from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleScanClick = () => {
    if (pathname === '/assets') {
      // Trigger scan parameter reload or dispatch custom event
      router.push('/assets?scan=true');
      window.dispatchEvent(new CustomEvent('open-mobile-scanner'));
    } else {
      router.push('/assets?scan=true');
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { href: '/assets', label: 'الأصول', icon: Monitor },
    { href: '/employees', label: 'الموظفون', icon: Users },
    { href: '/history', label: 'السجل', icon: History },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#030712]/90 backdrop-blur-2xl border-t border-cyan-500/20 px-3 py-2 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around relative">
        {/* Left items */}
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all',
                isActive ? 'text-cyan-400 font-bold' : 'text-oasis-400 hover:text-oasis-200'
              )}
            >
              <item.icon size={20} className={isActive ? 'text-cyan-400' : 'text-oasis-400'} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}

        {/* Center Quick Scan Floating Action Button */}
        <button
          type="button"
          onClick={handleScanClick}
          className="relative -top-5 flex flex-col items-center justify-center group"
          aria-label="مسح سريع"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 via-teal-400 to-cyan-300 p-0.5 shadow-[0_0_25px_rgba(6,182,212,0.6)] group-active:scale-95 transition-transform">
            <div className="w-full h-full rounded-full bg-[#030712] flex items-center justify-center text-cyan-400 group-hover:text-white transition-colors">
              <ScanLine size={26} className="animate-pulse" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-cyan-300 -mt-1 drop-shadow">مسح كود</span>
        </button>

        {/* Right items */}
        {navItems.slice(2).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all',
                isActive ? 'text-cyan-400 font-bold' : 'text-oasis-400 hover:text-oasis-200'
              )}
            >
              <item.icon size={20} className={isActive ? 'text-cyan-400' : 'text-oasis-400'} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
