'use client';

import React from 'react';
import { useAuth } from '../../lib/auth-context';
import { Users } from 'lucide-react';

export function Header() {
  const { user, switchDemoUser, isLoading } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-900 tracking-tight">
          Vietnamese Enterprise Customs &amp; Trade Compliance
        </span>
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium">
          SYSTEM HEALTHY
        </span>
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200 font-medium">
          MOCK AI MODE (ZERO COST)
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Executive Segmented Role Controller */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/80 rounded-lg p-0.5 text-xs">
          <span className="px-2 text-slate-500 text-[11px] font-medium flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            Role:
          </span>
          <button
            onClick={() => switchDemoUser('analyst')}
            disabled={isLoading}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              user?.globalRole === 'ANALYST'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Analyst
          </button>
          <button
            onClick={() => switchDemoUser('reviewer')}
            disabled={isLoading}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              user?.globalRole === 'REVIEWER'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Reviewer
          </button>
          <button
            onClick={() => switchDemoUser('manager')}
            disabled={isLoading}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              user?.globalRole === 'COMPLIANCE_MANAGER'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manager
          </button>
          <button
            onClick={() => switchDemoUser('admin')}
            disabled={isLoading}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              user?.globalRole === 'SYSTEM_ADMIN'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => switchDemoUser('viewer')}
            disabled={isLoading}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              user?.globalRole === 'VIEWER'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Viewer
          </button>
        </div>

        {/* User Profile */}
        {user && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-semibold text-xs">
              {user.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left text-xs">
              <div className="font-semibold text-slate-900 leading-tight">{user.fullName}</div>
              <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
