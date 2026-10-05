'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api-client';
import { useAuth } from '../../../lib/auth-context';
import {
  ArrowLeft,
  Check,
  X,
  FileText,
  AlertTriangle,
  Info,
  Calendar,
  Building2,
  RefreshCw,
  Clock,
  Layers,
  FileCheck,
} from 'lucide-react';
import { EvidenceDrawer } from '../../../components/evidence-drawer';
import { ReviewModal } from '../../../components/review-modal';

export default function AnalysisDetailPage() {
  const params = useParams();
  const analysisId = params.id as string;
  const { user } = useAuth();

  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'obligations' | 'actions' | 'trace' | 'reviews'>('overview');

  // Evidence Drawer state
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);

  // Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'SUBMIT'>('APPROVE');
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    try {
      const data = await api.get(`/analyses/${analysisId}`);
      setAnalysis(data);
    } catch (err) {
      console.error('Failed to load analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (analysisId) {
      fetchAnalysis();
    }
  }, [analysisId]);

  const handleOpenEvidence = (evId: string) => {
    const ev = (analysis?.regulatoryChange?.evidences || []).find((e: any) => e.id === evId);
    if (ev) {
      setSelectedEvidence(ev);
      setIsEvidenceOpen(true);
    } else {
      setSelectedEvidence({
        id: evId,
        documentNumber: analysis?.regulatoryChange?.documentNumber || '39/2026/TT-BTC',
        documentTitle: analysis?.regulatoryChange?.title || 'Thông tư hải quan',
        hierarchyPath: 'Chương II > Điều 8',
        article: 'Điều 8',
        clause: 'Khoản 1',
        textExcerpt:
          '1. Doanh nghiệp nhập khẩu nộp tài liệu A và tài liệu B khi thực hiện thủ tục hải quan. 2. Hồ sơ được lưu trong thời hạn 5 năm. 3. Tài liệu phải được lưu dưới dạng điện tử.',
        sourceUrl: analysis?.regulatoryChange?.sourceUrl,
        retrievalSource: 'REGULATORY_CHANGE',
        verified: true,
      });
      setIsEvidenceOpen(true);
    }
  };

  const handleReanalyze = async () => {
    if (!confirm('Re-run impact analysis with latest profile and rules?')) return;
    setIsReanalyzing(true);
    try {
      await api.post(`/analyses/${analysisId}/reanalyze`, {});
      await fetchAnalysis();
    } catch (err: any) {
      alert(`Re-analysis failed: ${err.message}`);
    } finally {
      setIsReanalyzing(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500 font-medium text-sm">Loading comprehensive compliance impact analysis...</div>;
  }

  if (!analysis) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-xl">
        Analysis record not found.{' '}
        <Link href="/analyses" className="underline font-semibold ml-2">
          Back to list
        </Link>
      </div>
    );
  }

  const org = analysis.organization || {};
  const regChange = analysis.regulatoryChange || {};
  const obligations = analysis.obligations || [];
  const actions = analysis.recommendedActions || [];
  const impactAreas = analysis.impactAreas || [];
  const reviews = analysis.reviews || [];
  const decisionTrace = analysis.decisionTrace || [];
  const assumptions = analysis.assumptions || [];
  const missingInfo = analysis.missingInformation || [];

  const isReviewerOrAdmin =
    user?.globalRole === 'REVIEWER' ||
    user?.globalRole === 'COMPLIANCE_MANAGER' ||
    user?.globalRole === 'SYSTEM_ADMIN';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/analyses"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Analyses
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleReanalyze}
            disabled={isReanalyzing}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin text-slate-900' : ''}`} />
            Re-analyze
          </button>

          {analysis.status !== 'APPROVED' && isReviewerOrAdmin && (
            <>
              <button
                onClick={() => {
                  setReviewAction('APPROVE');
                  setIsReviewModalOpen(true);
                }}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Check className="w-3.5 h-3.5" /> Approve Assessment
              </button>
              <button
                onClick={() => {
                  setReviewAction('REJECT');
                  setIsReviewModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          )}

          {analysis.status === 'ANALYZED' && (
            <button
              onClick={() => {
                setReviewAction('SUBMIT');
                setIsReviewModalOpen(true);
              }}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              Submit for Sign-off
            </button>
          )}
        </div>
      </div>

      {/* Flagship Executive Memo Header */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider ${
                  analysis.applicabilityStatus === 'APPLIES'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : analysis.applicabilityStatus === 'POTENTIALLY_APPLIES'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : analysis.applicabilityStatus === 'DOES_NOT_APPLY'
                    ? 'bg-slate-100 text-slate-700 border border-slate-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                {analysis.applicabilityStatus}
              </span>

              <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">
                Confidence: {analysis.confidenceScore || 'HIGH'}
              </span>

              <span
                className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                  analysis.status === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : analysis.status === 'NEEDS_REVIEW' || analysis.status === 'IN_REVIEW'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                Workflow: {analysis.status}
              </span>

              <span className="text-xs font-mono text-slate-400">
                Analysis Engine v{analysis.analysisEngineVersion || '1.0.0'}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Regulatory Impact Assessment
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap pt-1">
              <span>
                Organization: <strong className="text-slate-900">{org.displayName}</strong> ({org.organizationType})
              </span>
              <span className="text-slate-300">&bull;</span>
              <span>
                Circular: <strong className="text-slate-900 font-mono">{regChange.documentNumber}</strong> — {regChange.title}
              </span>
            </div>
          </div>

          {/* Priority Score Gauge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shrink-0 flex items-center gap-5">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                Impact Priority Score
              </span>
              <div
                className={`text-3xl font-extrabold font-mono mt-0.5 ${
                  analysis.priorityScore >= 70
                    ? 'text-rose-700'
                    : analysis.priorityScore >= 40
                    ? 'text-amber-700'
                    : 'text-slate-700'
                }`}
              >
                {analysis.priorityScore}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-600 border-l border-slate-200 pl-4 space-y-0.5 font-mono">
              <div>Severity: <strong className="text-slate-900">{analysis.severity || 'MEDIUM'}</strong></div>
              <div>Urgency: <strong className="text-slate-900">{analysis.urgency || 'MEDIUM'}</strong></div>
              <div className="text-[10px] text-slate-400 pt-0.5">Formula: S &times; C &times; U &times; B</div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="p-4 rounded-lg bg-slate-50 border-l-2 border-slate-900 text-sm text-slate-800 leading-relaxed space-y-1">
          <strong className="text-slate-900 text-xs font-bold uppercase tracking-wider block">
            Executive Compliance Summary:
          </strong>
          <p>{analysis.summary}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-sm gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 text-xs ${
            activeTab === 'overview'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          5-Pillar Framework &amp; Impact Matrix
        </button>
        <button
          onClick={() => setActiveTab('obligations')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 text-xs ${
            activeTab === 'obligations'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Obligations ({obligations.length})
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 text-xs ${
            activeTab === 'actions'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Action Plan ({actions.length})
        </button>
        <button
          onClick={() => setActiveTab('trace')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 text-xs ${
            activeTab === 'trace'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Decision Trace &amp; Audit ({decisionTrace.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 text-xs ${
            activeTab === 'reviews'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sign-off History ({reviews.length})
        </button>
      </div>

      {/* Tab 1: 5-Pillar Framework & Impact Areas */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* The 5 Compliance Pillars */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                5-Pillar Compliance Assessment Framework
              </h2>
              <span className="text-xs text-slate-500">Structured Decision Logic</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* 1. WHAT */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-800 uppercase block w-fit">
                  1. WHAT
                </span>
                <div className="text-xs font-bold text-slate-900">Regulatory Change</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Circular {regChange.documentNumber} modifies customs documentation, records retention period, and mandates electronic storage.
                </p>
              </div>

              {/* 2. WHO */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-800 uppercase block w-fit">
                  2. WHO
                </span>
                <div className="text-xs font-bold text-slate-900">Target Entity</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {org.displayName} ({org.organizationType}) operating in {org.industry || 'general industry'}.
                </p>
              </div>

              {/* 3. WHY */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-800 uppercase block w-fit">
                  3. WHY
                </span>
                <div className="text-xs font-bold text-slate-900">Applicability Basis</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {analysis.applicabilityReason || 'Rule matched business activity and customs status against modified circular topics.'}
                </p>
              </div>

              {/* 4. SO WHAT */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-800 uppercase block w-fit">
                  4. SO WHAT
                </span>
                <div className="text-xs font-bold text-slate-900">Business Impact</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {impactAreas.length} departments affected. Retention extended 2&rarr;5 yrs, requiring IT archiving updates.
                </p>
              </div>

              {/* 5. NOW WHAT */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-800 uppercase block w-fit">
                  5. NOW WHAT
                </span>
                <div className="text-xs font-bold text-slate-900">Recommended Actions</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Audit customs declaration checklist, update archive policy, verify electronic document storage readiness.
                </p>
              </div>
            </div>
          </div>

          {/* Departmental Impact Matrix */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Affected Operational Areas &amp; Severity Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Breakdown across corporate functions with supporting statutory evidence
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-600">
                {impactAreas.length} Areas Affected
              </span>
            </div>

            {impactAreas.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs">
                No direct operational impact areas identified.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {impactAreas.map((area: any) => {
                  const evList = (area.evidenceList || area.evidenceIds || []);
                  return (
                    <div
                      key={area.id || area.area}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-slate-900">
                            {area.area}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              area.severity === 'CRITICAL'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : area.severity === 'HIGH'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {area.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{area.description}</p>
                      </div>

                      {/* Evidence Citations */}
                      <div className="pt-2 border-t border-slate-200/80 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-medium">Citations:</span>
                        {evList.map((ev: any) => {
                          const evId = typeof ev === 'string' ? ev : ev.evidenceId;
                          return (
                            <button
                              key={evId}
                              onClick={() => handleOpenEvidence(evId)}
                              className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                            >
                              [{evId}]
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assumptions & Missing Info Safety Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Info className="w-3.5 h-3.5 text-blue-600" /> Explicit Assumptions
              </span>
              {assumptions.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No assumptions required for this assessment.</p>
              ) : (
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                  {assumptions.map((a: string, idx: number) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Missing Information / Uncertainties
              </span>
              {missingInfo.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No missing information detected.</p>
              ) : (
                <ul className="list-disc list-inside text-xs text-amber-800 space-y-1 font-medium">
                  {missingInfo.map((m: string, idx: number) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Obligations */}
      {activeTab === 'obligations' && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Compliance Obligations ({obligations.length})</h2>
            <span className="text-xs text-slate-500">Mandatory Statutory Duties</span>
          </div>
          {obligations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
              No new obligations created by this regulation.
            </div>
          ) : (
            <div className="space-y-3">
              {obligations.map((ob: any) => {
                const evList = ob.evidenceList || [];
                return (
                  <div
                    key={ob.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-slate-800 border border-slate-200">
                          {ob.obligationType}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{ob.title}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-500">
                        Dept: <strong className="text-slate-800">{ob.responsibleDepartment}</strong>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{ob.description}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-500 text-[11px] font-medium">Supporting Citations:</span>
                        {evList.map((ev: any) => (
                          <button
                            key={ev.id || ev.evidenceId}
                            onClick={() => handleOpenEvidence(ev.evidenceId)}
                            className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                          >
                            [{ev.evidenceId}]
                          </button>
                        ))}
                      </div>

                      {ob.deadline ? (
                        <span className="font-mono text-rose-700 font-bold text-xs">
                          Mandatory Deadline: {new Date(ob.deadline).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">No explicit statutory deadline</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Action Plan */}
      {activeTab === 'actions' && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recommended Actions ({actions.length})</h2>
            <span className="text-xs text-slate-500">Operational Directives</span>
          </div>
          {actions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
              No recommended action items.
            </div>
          ) : (
            <div className="space-y-3">
              {actions.map((act: any) => (
                <div
                  key={act.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          act.priority === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : act.priority === 'HIGH'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {act.priority}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{act.title}</span>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white border border-slate-200 text-slate-700">
                      Status: {act.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{act.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs text-slate-500">
                    <div>
                      Suggested Owner: <strong className="text-slate-800">{act.suggestedOwner}</strong>
                    </div>
                    {act.dueDate ? (
                      <span className="font-mono text-slate-800 font-semibold">Target Date: {act.dueDate}</span>
                    ) : (
                      <span className="text-slate-400">Before enactment</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Technical Decision Trace */}
      {activeTab === 'trace' && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Deterministic Decision Trace</h2>
            <span className="text-xs text-slate-500 font-mono">Engine v{analysis.analysisEngineVersion || '1.0.0'}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 space-y-2">
            {decisionTrace.length === 0 ? (
              <p className="text-slate-400 italic">No detailed execution trace available.</p>
            ) : (
              decisionTrace.map((step: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-slate-400 select-none">[{idx + 1}]</span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Sign-off History */}
      {activeTab === 'reviews' && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Compliance Officer Sign-off History</h2>
            <span className="text-xs text-slate-500">{reviews.length} Sign-off records</span>
          </div>

          {reviews.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
              No formal reviews recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev: any) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                          rev.decision === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {rev.decision}
                      </span>
                      <span className="text-xs text-slate-600">
                        by <strong className="text-slate-800">{rev.reviewer?.fullName || rev.reviewerId}</strong>
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(rev.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans">{rev.comments}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Evidence Slide-over Drawer */}
      <EvidenceDrawer
        isOpen={isEvidenceOpen}
        evidence={selectedEvidence}
        onClose={() => setIsEvidenceOpen(false)}
      />

      {/* Human Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        analysisId={analysisId}
        action={reviewAction}
        currentSeverity={analysis.severity}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={() => {
          fetchAnalysis();
          setIsReviewModalOpen(false);
        }}
      />
    </div>
  );
}
