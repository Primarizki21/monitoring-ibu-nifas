'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { HeartPulse, UserPlus, BarChart3, Info } from 'lucide-react';
import { useTenant } from '@/lib/tenant-context';

export function Navigation() {
  const pathname = usePathname();
  const { currentFaskes, selectedFaskesId } = useTenant();

  const navItems = [
    {
      label: 'Antrean Triase Nifas',
      href: '/triage',
      icon: HeartPulse,
      description: 'Pemantauan klinis & follow-up WhatsApp',
    },
    {
      label: 'Registrasi Discharge',
      href: '/register',
      icon: UserPlus,
      description: 'Pendaftaran kepulangan & kalkulator KF',
    },
    {
      label: 'Panel Dinkes Surabaya',
      href: '/dinkes',
      icon: BarChart3,
      description: 'Agregat epidemiologi 13 faskes',
    },
  ];

  return (
    <div className="border-b bg-muted/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-2 gap-2">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href === '/triage' && pathname === '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-background text-foreground shadow-xs border'
                    : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'size-4',
                    isActive ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground'
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Tenant Indicator Context */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground self-end sm:self-auto">
          <Info className="size-3.5 text-teal-600" />
          <span>
            {selectedFaskesId === null ? (
              <strong className="text-foreground">Cakupan Global:</strong>
            ) : (
              <strong className="text-foreground">Faskes Aktif:</strong>
            )}{' '}
            {currentFaskes ? currentFaskes.nama_faskes : 'Seluruh Wilayah Surabaya'}
          </span>
        </div>
      </div>
    </div>
  );
}
