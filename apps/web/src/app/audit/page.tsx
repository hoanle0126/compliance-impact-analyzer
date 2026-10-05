'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api-client';
import {
  History,
  ShieldAlert,
  User,
  Clock,
  Building2,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  FileCheck,
  ArrowRight,
} from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<any[]>('/analyses/audit/logs');
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesSearch =
      !searchQuery ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.detailsJson).toLowerCase().includes(searchQuery.toLowerCase());

    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500">
              Immutable System Logs
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <History className="w-6 h-6 text-slate-800" />
            Compliance Audit Trail
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Immutable system audit logs tracking analysis executions, legal evidence evaluations, sign-off approvals, rejections, and profile revisions.
          </p>
        </div>

        <span className="px-3 py-1 rounded-lg text-xs font-mono bg-slate-100 text-slate-800 border border-slate-200 font-semibold self-start sm:self-auto">
          {logs.length} Recorded Audit Events
        </span>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center gap-4 text-xs shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit actions, user emails, or parameters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Action Type:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">All Actions</option>
            <option value="ANALYSIS_RUN">ANALYSIS_RUN</option>
            <option value="ANALYSIS_REANALYZED">ANALYSIS_REANALYZED</option>
            <option value="SUBMIT_FOR_REVIEW">SUBMIT_FOR_REVIEW</option>
            <option value="ANALYSIS_APPROVED">ANALYSIS_APPROVED</option>
            <option value="ANALYSIS_REJECTED">ANALYSIS_REJECTED</option>
            <option value="COMMENT_ADDED">COMMENT_ADDED</option>
            <option value="ACTION_UPDATED">ACTION_UPDATED</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
          Loading audit trail...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white border border-slate-200 text-slate-500 text-sm shadow-sm">
          No audit records found matching your query.
        </div>
      ) : (
        <div className="space-y-3 font-sans">
          {filteredLogs.map((log) => {
            const orgName = log.analysis?.organization?.displayName;
            const docNum = log.analysis?.regulatoryChange?.documentNumber;

            return (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        log.action === 'ANALYSIS_APPROVED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : log.action === 'ANALYSIS_REJECTED'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : log.action === 'ANALYSIS_RUN'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {log.action}
                    </span>

                    <span className="text-xs text-slate-600 flex items-center gap-1 font-mono">
                      <User className="w-3 h-3 text-slate-400" />
                      {log.userEmail || 'system@impactlens.local'}
                    </span>

                    <span className="text-slate-300">&bull;</span>

                    <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {orgName && (
                    <div className="text-xs text-slate-700">
                      Organization: <strong className="text-slate-900">{orgName}</strong> &bull; Circular:{' '}
                      <span className="font-mono text-slate-900 font-semibold">{docNum}</span>
                    </div>
                  )}

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 overflow-x-auto">
                    {JSON.stringify(log.detailsJson, null, 2)}
                  </div>
                </div>

                {log.analysisId && (
                  <Link
                    href={`/analyses/${log.analysisId}`}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-medium border border-slate-200 flex items-center gap-1 transition-colors self-end md:self-center"
                  >
                    View Analysis <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
