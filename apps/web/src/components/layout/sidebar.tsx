'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  LayoutDashboard,
  FileText,
  Building2,
  Cpu,
  ListTodo,
  CheckCircle2,
  Scale,
  History,
  AlertTriangle,
} from 'lucide-react';

const navigationItems = [
  { name: 'Executive Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Regulatory Changes', href: '/regulatory-changes', icon: FileText },
  { name: 'Client Organizations', href: '/organizations', icon: Building2 },
  { name: 'Impact Analyses', href: '/analyses', icon: Cpu },
  { name: 'Action Plan', href: '/actions', icon: ListTodo },
  { name: 'Review Queue', href: '/reviews', icon: CheckCircle2 },
  { name: 'Applicability Rules', href: '/rules', icon: Scale },
  { name: 'Audit History', href: '/audit', icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <div className="h-8 w-8 rounded-md bg-slate-900 flex items-center justify-center text-white shadow-sm">
          <ShieldAlert className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-slate-900 tracking-tight text-sm block leading-tight">
            ImpactLens
          </span>
          <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase block">
            Compliance AI
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Compliance Platform
        </div>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-500'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Legal Safety Notice Card */}
      <div className="p-3.5 m-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px]">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Decision Support Tool</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-600">
          Not qualified legal counsel. Conclusions distinguish facts, inferences, and AI interpretations.
        </p>
      </div>

      {/* Infrastructure Footer */}
      <div className="p-4 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-[11px] text-slate-700 font-medium">PROJECT: impactlens</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <div className="text-[11px] text-slate-500 space-y-0.5">
          <div>Postgres: <span className="text-slate-700 font-mono">55433</span></div>
          <div>Redis: <span className="text-slate-700 font-mono">6383</span></div>
          <div>API Port: <span className="text-slate-700 font-mono">4201</span></div>
        </div>
      </div>
    </aside>
  );
}
