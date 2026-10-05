'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api-client';
import {
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  Search,
  Zap,
  Building,
} from 'lucide-react';
import { RunAnalysisModal } from '../../components/run-analysis-modal';

export default function RegulatoryChangesPage() {
  const [changes, setChanges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [selectedChangeId, setSelectedChangeId] = useState<string | undefined>(undefined);

  const fetchChanges = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<any[]>('/regulatory-changes');
      setChanges(data || []);
    } catch (err) {
      console.error('Failed to load regulatory changes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChanges();
  }, []);

  const filteredChanges = changes.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.authority.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500">
              Official Gazette Feed
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-slate-800" />
            Regulatory Changes Feed
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Tracked circulars, decrees, and trade law amendments from Vietnamese ministries (Ministry of Finance, General Department of Customs).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search circulars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Changes Feed List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
          Loading regulatory changes...
        </div>
      ) : filteredChanges.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white border border-slate-200 text-slate-500 text-sm shadow-sm">
          No regulatory changes found matching your query.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredChanges.map((change) => {
            const itemsCount = (change.changes || change.changeItems || []).length;
            const topics = Array.isArray(change.topics)
              ? change.topics.map((t: any) => (typeof t === 'string' ? { topic: t } : t))
              : [];
            const effectiveDate = change.effectiveAt
              ? new Date(change.effectiveAt).toLocaleDateString()
              : 'Not specified';

            return (
              <div
                key={change.id}
                className="p-6 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
              >
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {change.documentNumber}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      Authority: <strong className="text-slate-900">{change.authority}</strong>
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Effective: {effectiveDate}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                      {change.title}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                      {change.summary || 'Official regulatory modification.'}
                    </p>
                  </div>

                  {/* Topics Badges */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      Topics:
                    </span>
                    {topics.map((t: any) => (
                      <span
                        key={t.id || t.topic}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-50 text-slate-700 border border-slate-200"
                      >
                        {t.topic}
                      </span>
                    ))}
                    <span className="text-xs text-slate-400 font-mono ml-2">
                      ({itemsCount} modified clause{itemsCount === 1 ? '' : 's'})
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedChangeId(change.id);
                      setIsAnalysisModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    Analyze Impact
                  </button>

                  <Link
                    href={`/regulatory-changes/${change.id}`}
                    className="text-xs text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors"
                  >
                    Inspect Provisions &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Analysis Launch Modal */}
      {isAnalysisModalOpen && (
        <RunAnalysisModal
          isOpen={isAnalysisModalOpen}
          defaultChangeId={selectedChangeId}
          onClose={() => {
            setIsAnalysisModalOpen(false);
            setSelectedChangeId(undefined);
          }}
          onSuccess={() => {
            setIsAnalysisModalOpen(false);
            setSelectedChangeId(undefined);
          }}
        />
      )}
    </div>
  );
}
