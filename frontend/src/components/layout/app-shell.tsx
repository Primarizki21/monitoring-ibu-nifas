'use client';

import React, { useState } from 'react';
import { TenantProvider } from '@/lib/tenant-context';
import { Header } from '@/components/layout/header';
import { Navigation } from '@/components/layout/navigation';
import { WhatsAppSimulator } from '@/components/simulator/whatsapp-simulator';
import { Toaster } from '@/components/ui/sonner';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSimulationSuccess = () => {
    // Increment trigger agar komponen anak bisa re-fetch otomatis
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <TenantProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-teal-500/20">
        <Header onOpenSimulator={() => setSimulatorOpen(true)} />
        <Navigation />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6" data-refresh={refreshTrigger}>
          {children}
        </main>

        {/* Floating Demo Trigger Button (Bottom-Right FAB) */}
        <div className="fixed bottom-5 right-5 z-40">
          <Button
            onClick={() => setSimulatorOpen(true)}
            size="sm"
            className="rounded-full shadow-lg bg-teal-600 hover:bg-teal-700 text-white font-medium flex items-center gap-2 px-4 py-2 border border-teal-500/30 text-xs sm:text-sm"
          >
            <Sparkles className="size-4 animate-spin text-teal-200" style={{ animationDuration: '4s' }} />
            <span>Simulasi WA Bot</span>
          </Button>
        </div>

        {/* Global WhatsApp Simulator Drawer */}
        <WhatsAppSimulator
          open={simulatorOpen}
          onOpenChange={setSimulatorOpen}
          onSimulationSuccess={handleSimulationSuccess}
        />

        {/* Sonner Toast Notification */}
        <Toaster position="top-right" richColors closeButton />

        {/* Footer Klinis */}
        <footer className="border-t py-4 bg-muted/20 text-center text-xs text-muted-foreground">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <strong>Sistem Monitoring Nifas Surabaya</strong> — Pilot Pengabdian Masyarakat (3 RSUD & 10 Puskesmas Mitra)
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-emerald-500"></span>
              <span>Protokol Buku KIA Kemenkes RI • Strictly Zero-LLM</span>
            </div>
          </div>
        </footer>
      </div>
    </TenantProvider>
  );
}
