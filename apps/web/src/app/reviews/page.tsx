'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import {
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileText,
  Check,
  X,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { ReviewModal } from '../../components/review-modal';

export default function ReviewQueuePage() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'SUBMIT'>('APPROVE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'PENDING' | 'HISTORY' | 'ALL'>('PENDING');

  const fetchAnalyses = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<any[]>('/analyses');
      setAnalyses(data || []);
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const pendingAnalyses = analyses.filter(
    (a) => a.status === 'NEEDS_REVIEW' || a.status === 'IN_REVIEW' || a.status === 'ANALYZED'
  );

  const historyAnalyses = analyses.filter(
    (a) => a.status === 'APPROVED' || a.status === 'REJECTED'
  );

  const displayedList =
    filterMode === 'PENDING'
      ? pendingAnalyses
      : filterMode === 'HISTORY'
      ? historyAnalyses
      : analyses;

  const handleOpenReview = (analysisId: string, action: 'APPROVE' | 'REJECT') => {
    setSelectedAnalysisId(analysisId);
    setReviewAction(action);
    setIsModalOpen(true);
  };

  const isReviewerOrAdmin =
    user?.globalRole === 'REVIEWER' ||
    user?.globalRole === 'COMPLIANCE_MANAGER' ||
    user?.globalRole === 'SYSTEM_ADMIN';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500">
              Sign-off Docket
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-slate-800" />
            Compliance Review &amp; Sign-off Queue
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Human-in-the-loop validation pipeline. Qualified compliance officers review, verify evidence citations, and formalize advisory decisions.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto text-xs">
          <button
            onClick={() => setFilterMode('PENDING')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              filterMode === 'PENDING'
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Sign-offs ({pendingAnalyses.length})
          </button>
          <button
            onClick={() => setFilterMode('HISTORY')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              filterMode === 'HISTORY'
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Reviewed History ({historyAnalyses.length})
          </button>
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              filterMode === 'ALL'
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({analyses.length})
          </button>
        </div>
      </div>

      {/* Role Notice */}
      {!isReviewerOrAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              You are currently logged in as <strong>{user?.globalRole || 'ANALYST'}</strong>. Formal sign-off and approval actions require <strong>REVIEWER</strong> or <strong>COMPLIANCE_MANAGER</strong> role.
            </span>
          </div>
          <span className="text-[11px] text-amber-700 font-medium">Use top-right role switcher to toggle.</span>
        </div>
      )}

      {/* Queue List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
          Loading compliance reviews...
        </div>
      ) : displayedList.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white border border-slate-200 text-slate-500 space-y-2 shadow-sm">
          <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
          <p className="text-base font-semibold text-slate-800">No assessments pending review</p>
          <p className="text-xs text-slate-500">
            All current impact analyses have been processed and approved.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedList.map((item) => {
            const org = item.organization || {};
            const reg = item.regulatoryChange || {};
            const actionsCount = (item.recommendedActions || []).length;
            const obligationsCount = (item.obligations || []).length;

            return (
              <div
                key={item.id}
                className="p-6 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase border ${
                        item.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      {item.status}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${
                        item.applicabilityStatus === 'APPLIES'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : item.applicabilityStatus === 'POTENTIALLY_APPLIES'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.applicabilityStatus}
                    </span>

                    <span className="text-xs font-mono text-slate-500">
                      Priority Score: <strong className="text-slate-900">{item.priorityScore}</strong>/100
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {org.displayName} &bull;{' '}
                      <span className="text-slate-500 font-normal text-base">{org.organizationType}</span>
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Circular: <strong className="text-slate-900 font-mono">{reg.documentNumber}</strong> — {reg.title}
                    </p>
                  </div>

                  <p className="text-xs text-slate-700 line-clamp-2 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed font-sans">
                    {item.summary}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                    <span>{obligationsCount} Obligations</span>
                    <span>&bull;</span>
                    <span>{actionsCount} Action Items</span>
                    <span>&bull;</span>
                    <span className="font-mono">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Review Actions */}
                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="flex items-center gap-2">
                    {item.status !== 'APPROVED' && isReviewerOrAdmin && (
                      <>
                        <button
                          onClick={() => handleOpenReview(item.id, 'APPROVE')}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleOpenReview(item.id, 'REJECT')}
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                  </div>

                  <Link
                    href={`/analyses/${item.id}`}
                    className="text-xs text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors"
                  >
                    Inspect Full Assessment &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Sign-off Modal */}
      {isModalOpen && selectedAnalysisId && (
        <ReviewModal
          analysisId={selectedAnalysisId}
          action={reviewAction}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAnalysisId(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedAnalysisId(null);
            fetchAnalyses();
          }}
        />
      )}
    </div>
  );
}
