'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api-client';
import {
  FileText,
  ArrowLeft,
  Calendar,
  Building,
  Scale,
  Zap,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { RunAnalysisModal } from '../../../components/run-analysis-modal';

export default function RegulatoryChangeDetailPage() {
  const params = useParams();
  const changeId = params.id as string;

  const [change, setChange] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await api.get(`/regulatory-changes/${changeId}`);
        setChange(data);
      } catch (err) {
        console.error('Failed to load regulatory change:', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (changeId) {
      loadData();
    }
  }, [changeId]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
        Loading regulatory change details...
      </div>
    );
  }

  if (!change) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
        Regulatory change not found.{' '}
        <Link href="/regulatory-changes" className="underline font-semibold ml-2">
          Back to list
        </Link>
      </div>
    );
  }

  const changeItems = change.changes || change.changeItems || [];
  const topics = Array.isArray(change.topics)
    ? change.topics.map((t: any) => (typeof t === 'string' ? { topic: t } : t))
    : [];
  const evidences = change.evidences || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/regulatory-changes"
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Regulatory Changes
        </Link>

        <button
          onClick={() => setIsAnalysisModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-2 shadow-sm transition-all"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          Run Impact Analysis with this Circular
        </button>
      </div>

      {/* Circular Header Card */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
            {change.documentNumber}
          </span>
          <span className="text-xs text-slate-600 font-mono">
            Authority: <strong className="text-slate-900">{change.authority}</strong>
          </span>
          <span className="text-slate-300">&bull;</span>
          <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Effective:{' '}
            {change.effectiveAt ? new Date(change.effectiveAt).toLocaleDateString() : 'N/A'}
          </span>
          {change.sourceUrl && (
            <a
              href={change.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-600 hover:text-slate-900 font-mono flex items-center gap-1 ml-auto underline"
            >
              Official Gazette Link <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 leading-snug">{change.title}</h1>

        <p className="text-sm text-slate-600 leading-relaxed font-sans">{change.summary}</p>

        {/* Topics */}
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Classified Topics:
          </span>
          {topics.map((t: any) => (
            <span
              key={t.id || t.topic}
              className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-slate-50 text-slate-700 border border-slate-200"
            >
              {t.topic}
            </span>
          ))}
        </div>
      </div>

      {/* Provision Diffs: Old vs New Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-700" />
            Modified Provisions &amp; Legal Diffs ({changeItems.length})
          </h2>
          <span className="text-xs text-slate-500">
            Deterministic clause diffs comparison for compliance analysis
          </span>
        </div>

        {changeItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-200 text-xs shadow-sm">
            No specific change items recorded.
          </div>
        ) : (
          <div className="space-y-4">
            {changeItems.map((item: any, idx: number) => (
              <div
                key={item.id || idx}
                className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                      {item.changeType}
                    </span>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {item.hierarchyPath || `Clause ${idx + 1}`}
                    </span>
                  </div>
                  {item.article && (
                    <span className="text-xs text-slate-500 font-mono">
                      Article: {item.article} {item.clause ? `Clause: ${item.clause}` : ''}
                    </span>
                  )}
                </div>

                {/* Diff Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Previous Version */}
                  <div className="p-4 rounded-lg bg-rose-50/50 border border-rose-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" /> Previous Legal Text
                      </span>
                      <span className="text-[10px] font-mono text-rose-600 font-semibold px-1.5 py-0.5 rounded bg-rose-100 border border-rose-200">
                        Superseded
                      </span>
                    </div>
                    <div className="text-xs font-serif text-slate-800 leading-relaxed whitespace-pre-wrap bg-white/80 p-3.5 rounded-lg border border-rose-200/60 shadow-2xs">
                      {item.oldContent || '(None / Newly introduced article)'}
                    </div>
                  </div>

                  {/* New Enacted Version */}
                  <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> New Enacted Text
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-200">
                        Current Law
                      </span>
                    </div>
                    <div className="text-xs font-serif text-slate-900 leading-relaxed whitespace-pre-wrap bg-white/80 p-3.5 rounded-lg border border-emerald-200/60 shadow-2xs font-medium">
                      {item.newContent}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evidences Attached */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-700" />
          Supporting Legal Evidence Citations ({evidences.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {evidences.map((ev: any) => (
            <div
              key={ev.id}
              className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">{ev.id}</span>
                <span className="text-[10px] font-mono font-semibold text-emerald-800 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                  VERIFIED
                </span>
              </div>
              <p className="font-medium text-slate-800 font-mono text-[11px]">{ev.hierarchyPath}</p>
              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-serif">
                {ev.textExcerpt}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Launch Analysis Modal */}
      {isAnalysisModalOpen && (
        <RunAnalysisModal
          isOpen={isAnalysisModalOpen}
          defaultChangeId={change.id}
          onClose={() => setIsAnalysisModalOpen(false)}
          onSuccess={() => setIsAnalysisModalOpen(false)}
        />
      )}
    </div>
  );
}
