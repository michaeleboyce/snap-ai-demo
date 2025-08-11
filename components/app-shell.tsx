"use client";

import Link from 'next/link';

interface AppShellProps {
  children: React.ReactNode;
  showDemoBadge?: boolean;
  rightSlot?: React.ReactNode;
}

export default function AppShell({ children, showDemoBadge = true, rightSlot }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <header className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="bg-blue-900 text-white px-3 py-1.5 rounded font-bold tracking-wide group-hover:bg-blue-800 transition-colors">
                USDR
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900">SNAP Interview Assistant</span>
                <span className="text-xs text-slate-500">US Digital Response</span>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              {rightSlot}
              {showDemoBadge && (
                <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-semibold">DEMO</span>
              )}
            </div>
          </header>
        </div>
      </div>
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>
      <footer className="border-t mt-16 py-8 text-center text-xs text-slate-500">
        <p>Created by US Digital Response for Connecticut Department of Social Services</p>
        <p className="mt-1">SNAP AI Interview Assistant Prototype</p>
      </footer>
    </div>
  );
}


