'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api-client';
import {
  FileText,
  Search,
  Plus,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { RunAnalysisModal } from '../../components/run-analysis-modal';

export default function AnalysesListPage() {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [applicabilityFilter, setApplicabilityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAnalyses = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<any[]>('/analyses');
      setAnalyses(data || []);
    } catch (err) {
      console.error('Failed to load analyses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const filteredAnalyses = analyses.filter((item) => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesApplicability =
      applicabilityFilter === 'ALL' || item.applicabilityStatus === applicabilityFilter;
    const matchesSearch =
      !searchQuery ||
      item.organization?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.regulatoryChange?.documentNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.regulatoryChange?.title?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesApplicability && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500">
              Evaluations Docket
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-slate-800" />
            Impact Analyses
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Enterprise regulatory evaluations combining deterministic applicability rules, statutory evidence citations, and formal compliance sign-offs.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Run Impact Analysis
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center gap-4 text-xs shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company or circular number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Outcome:</span>
          <select
            value={applicabilityFilter}
            onChange={(e) => setApplicabilityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">All Outcomes</option>
            <option value="APPLIES">APPLIES</option>
            <option value="POTENTIALLY_APPLIES">POTENTIALLY_APPLIES</option>
            <option value="DOES_NOT_APPLY">DOES_NOT_APPLY</option>
            <option value="INSUFFICIENT_INFORMATION">INSUFFICIENT_INFORMATION</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Workflow:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">All Statuses</option>
            <option value="ANALYZED">ANALYZED</option>
            <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
            <option value="IN_REVIEW">IN_REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Analyses Table */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
          Loading regulatory analyses...
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white border border-slate-200 text-slate-500 text-sm shadow-sm">
          No impact analyses matched your criteria.
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="py-3 px-5 font-semibold">Client Organization</th>
                <th className="py-3 px-4 font-semibold">Regulatory Change</th>
                <th className="py-3 px-4 font-semibold">Applicability</th>
                <th className="py-3 px-4 font-semibold">Priority</th>
                <th className="py-3 px-4 font-semibold">Workflow Status</th>
                <th className="py-3 px-4 font-semibold">Created</th>
                <th className="py-3 px-5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredAnalyses.map((a) => {
                const isApproved = a.status === 'APPROVED';
                const isRejected = a.status === 'REJECTED';

                return (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-900">
                        {a.organization?.displayName || 'Unknown Org'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {a.organization?.organizationType}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-xs font-semibold text-slate-900 block">
                        {a.regulatoryChange?.documentNumber}
                      </span>
                      <span className="text-xs text-slate-600 line-clamp-1 max-w-xs mt-0.5">
                        {a.regulatoryChange?.title}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-medium border ${
                          a.applicabilityStatus === 'APPLIES'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : a.applicabilityStatus === 'POTENTIALLY_APPLIES'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : a.applicabilityStatus === 'DOES_NOT_APPLY'
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-sky-50 text-sky-800 border-sky-200'
                        }`}
                      >
                        {a.applicabilityStatus}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <span
                          className={`font-mono text-sm font-bold ${
                            a.priorityScore >= 70
                              ? 'text-rose-700'
                              : a.priorityScore >= 40
                              ? 'text-amber-700'
                              : 'text-slate-700'
                          }`}
                        >
                          {a.priorityScore}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">/100</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isRejected
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs font-mono text-slate-500">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        href={`/analyses/${a.id}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        View Report <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Run Analysis Modal */}
      {isModalOpen && (
        <RunAnalysisModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchAnalyses();
          }}
        />
      )}
    </div>
  );
}
