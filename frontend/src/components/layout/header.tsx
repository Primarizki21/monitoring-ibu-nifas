'use client';

import React from 'react';
import { useTenant } from '@/lib/tenant-context';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, ShieldCheck, HeartPulse, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onOpenSimulator?: () => void;
}

export function Header({ onOpenSimulator }: HeaderProps) {
  const { faskesList, selectedFaskesId, setSelectedFaskesId, role } = useTenant();

  const rsList = faskesList.filter((f) => f.kategori === 'RSUD');
  const puskesmasList = faskesList.filter((f) => f.kategori === 'PUSKESMAS');

  const selectedValue = selectedFaskesId === null ? 'global' : String(selectedFaskesId);

  const handleSelectChange = (value: string | null) => {
    if (!value || value === 'global') {
      setSelectedFaskesId(null);
    } else {
      setSelectedFaskesId(Number(value));
    }
  };

  const getRoleBadge = () => {
    if (role === 'SUPER_ADMIN_DINKES') {
      return (
        <Badge variant="default" className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1 font-medium">
          <ShieldCheck className="size-3.5" />
          Dinkes Surabaya (Super Admin)
        </Badge>
      );
    }
    if (role === 'ADMIN_FASKES') {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 font-medium">
          <Building2 className="size-3.5" />
          Admin Faskes
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-teal-600 text-teal-700 bg-teal-50 dark:bg-teal-950 flex items-center gap-1 font-medium">
        <HeartPulse className="size-3.5" />
        Bidan Jaga (Triase)
      </Badge>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Sisi Kiri: Branding Sistem */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
            <HeartPulse className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-base sm:text-lg text-foreground">
                Sistem Monitoring Nifas
              </span>
              <span className="hidden rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-800 sm:inline">
                Surabaya Pilot
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              3 RS Rujukan • 10 Puskesmas Mitra • KIA Kemenkes RI
            </p>
          </div>
        </div>

        {/* Sisi Kanan: Tenant Switcher, Role Badge, & Simulator CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Tenant Switcher Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground hidden md:inline">Perspektif:</span>
            <Select value={selectedValue} onValueChange={handleSelectChange}>
              <SelectTrigger className="w-[180px] sm:w-[240px] text-xs">
                <SelectValue placeholder="Pilih Faskes..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">
                  🌐 Dinkes Surabaya (Global 13 Faskes)
                </SelectItem>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Rumah Sakit Rujukan</SelectLabel>
                  {rsList.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      🏥 {f.nama_faskes}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Puskesmas Mitra</SelectLabel>
                  {puskesmasList.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      🏥 {f.nama_faskes}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Role Pill */}
          <div className="hidden lg:block">{getRoleBadge()}</div>

          {/* Simulator Toolbar Button (Demo Pitching) */}
          {onOpenSimulator && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSimulator}
              className="border-amber-500/50 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800 font-medium text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="size-3.5 text-amber-600 animate-pulse" />
              <span className="hidden sm:inline">Simulasi WA Bot</span>
              <span className="sm:hidden">Demo</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
