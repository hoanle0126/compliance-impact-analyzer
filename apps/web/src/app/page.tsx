'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../lib/api-client';
import {
  FileText,
  Building2,
  AlertOctagon,
  Clock,
  ListTodo,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Play,
  FileCheck,
} from 'lucide-react';
import { RunAnalysisModal } from '../components/run-analysis-modal';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    regulatoryChangesCount: 0,
    organizationsCount: 0,
    highPriorityImpacts: 0,
    pendingReviews: 0,
    openActions: 0,
    upcomingDeadlines: 0,
  });

  const [regulatoryChanges, setRegulatoryChanges] = useState<any[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [pendingReviewsList, setPendingReviewsList] = useState<any[]>([]);
  const [upcomingActions, setUpcomingActions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [regChanges, orgs, analyses] = await Promise.all([
        api.get<any[]>('/regulatory-changes').catch(() => []),
        api.get<any[]>('/organizations').catch(() => []),
        api.get<any[]>('/analyses').catch(() => []),
      ]);

      setRegulatoryChanges(regChanges || []);
      setRecentAnalyses((analyses || []).slice(0, 5));

      const pending = (analyses || []).filter(
        (a: any) => a.status === 'NEEDS_REVIEW' || a.status === 'IN_REVIEW'
      );
      setPendingReviewsList(pending);

      const highPriority = (analyses || []).filter(
        (a: any) => a.priorityScore >= 50 || a.applicabilityStatus === 'APPLIES'
      );

      // Collect all actions across all analyses
      const allActions: any[] = [];
      let deadlinesCount = 0;
      (analyses || []).forEach((a: any) => {
        (a.recommendedActions || []).forEach((act: any) => {
          if (act.status !== 'COMPLETED' && act.status !== 'DISMISSED') {
            allActions.push({ ...act, analysisId: a.id, orgName: a.organization?.displayName });
          }
          if (act.dueDate) {
            deadlinesCount++;
          }
        });
        (a.obligations || []).forEach((ob: any) => {
          if (ob.deadline) deadlinesCount++;
        });
      });

      setUpcomingActions(allActions.slice(0, 5));

      setStats({
        regulatoryChangesCount: regChanges?.length || 0,
        organizationsCount: orgs?.length || 0,
        highPriorityImpacts: highPriority.length,
        pendingReviews: pending.length,
        openActions: allActions.length,
        upcomingDeadlines: deadlinesCount,
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Executive Briefing Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              Regulatory Intelligence &amp; Trade Decision-Support
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Compliance Impact &amp; Regulatory Intelligence
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Evaluate Vietnamese customs circulars against verified enterprise profiles.
            Deterministic rule engine with strict legal evidence citations and human sign-off workflows.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsAnalysisModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-sm"
          >
            <Play className="w-4 h-4 fill-current" />
            Run Impact Analysis
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Regulatory Changes */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Monitored Circulars
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {isLoading ? '-' : stats.regulatoryChangesCount}
          </div>
          <p className="text-xs text-slate-500">Official gazette updates</p>
        </div>

        {/* KPI 2: High Priority Impacts */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              High-Priority Impacts
            </span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {isLoading ? '-' : stats.highPriorityImpacts}
          </div>
          <p className="text-xs text-slate-500">Priority score &ge; 50 or APPLIES</p>
        </div>

        {/* KPI 3: Pending Reviews */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Pending Reviews
            </span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {isLoading ? '-' : stats.pendingReviews}
          </div>
          <p className="text-xs text-slate-500">Awaiting officer sign-off</p>
        </div>

        {/* KPI 4: Open Actions */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Open Action Items
            </span>
            <ListTodo className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {isLoading ? '-' : stats.openActions}
          </div>
          <p className="text-xs text-slate-500">Across Customs, IT &amp; Legal</p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Circulars & Analyses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Circulars Section */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Active Regulatory Updates
                </h2>
                <p className="text-xs text-slate-500">
                  Vietnamese Customs &amp; Ministry of Finance instruments under monitoring
                </p>
              </div>
              <Link
                href="/regulatory-changes"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                View All Circulars <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {regulatoryChanges.map((reg) => (
                <div
                  key={reg.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {reg.documentNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {reg.issuingAuthority}
                      </span>
                      <span className="text-xs text-slate-400">&bull;</span>
                      <span className="text-xs text-slate-500">
                        Effective: <strong className="text-slate-700 font-mono">{reg.effectiveAt ? new Date(reg.effectiveAt).toLocaleDateString() : 'Pending'}</strong>
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                      {reg.title}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {(reg.topics || []).map((t: any) => (
                        <span
                          key={t.id || t.topic}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-50 text-slate-600 border border-slate-200"
                        >
                          {t.topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      href={`/regulatory-changes/${reg.id}`}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                      Inspect Provisions
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Impact Analyses Section */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Recent Compliance Impact Assessments
                </h2>
                <p className="text-xs text-slate-500">
                  Entity-specific determinations generated by the deterministic applicability engine
                </p>
              </div>
              <Link
                href="/analyses"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                View All Analyses <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentAnalyses.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">
                No impact analyses found. Click &quot;Run Impact Analysis&quot; above to generate one.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider ${
                            analysis.applicabilityStatus === 'APPLIES'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : analysis.applicabilityStatus === 'POTENTIALLY_APPLIES'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : analysis.applicabilityStatus === 'DOES_NOT_APPLY'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {analysis.applicabilityStatus}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          Score: <strong className="text-slate-900">{analysis.priorityScore}/100</strong>
                        </span>
                        <span className="text-xs text-slate-400">&bull;</span>
                        <span className="text-xs text-slate-500 font-mono">
                          Workflow: <strong className="text-slate-700">{analysis.status}</strong>
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {analysis.organization?.displayName} ({analysis.organization?.organizationType})
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        Document: {analysis.regulatoryChange?.documentNumber} — {analysis.regulatoryChange?.title}
                      </div>
                    </div>

                    <Link
                      href={`/analyses/${analysis.id}`}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      View Report <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Priority Actions & Demonstration Guide */}
        <div className="space-y-6">
          {/* Priority Actions */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">Priority Action Items</h2>
              </div>
              <Link href="/actions" className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                All Actions <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {upcomingActions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No active actions pending.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingActions.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                        {act.suggestedOwner}
                      </span>
                      <span className={`text-[10px] font-mono font-semibold ${act.priority === 'HIGH' ? 'text-rose-600' : 'text-slate-500'}`}>
                        {act.priority} PRIORITY
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-900 leading-snug">
                      {act.title}
                    </div>
                    {act.dueDate && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Due: <span className="font-mono text-slate-700">{new Date(act.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Demo Scenarios Card */}
          <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Demo Walkthrough Guide
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Experience the 3 evaluation cases built into ImpactLens:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700/80">
                <span className="font-semibold text-emerald-400 block mb-0.5">Case 1: Positive match</span>
                <p className="text-[11px] text-slate-300">
                  &quot;Demo Import Manufacturing Co.&quot; &rarr; <strong>POTENTIALLY_APPLIES</strong> (Article 8 customs documentation).
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700/80">
                <span className="font-semibold text-slate-200 block mb-0.5">Case 2: Negative match</span>
                <p className="text-[11px] text-slate-300">
                  &quot;Demo Local Service Co.&quot; &rarr; <strong>DOES_NOT_APPLY</strong> (no import activities).
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700/80">
                <span className="font-semibold text-amber-400 block mb-0.5">Case 3: Incomplete profile</span>
                <p className="text-[11px] text-slate-300">
                  &quot;Demo Unknown Trading Co.&quot; &rarr; <strong>INSUFFICIENT_INFORMATION</strong> (missing import status).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Runner Modal */}
      <RunAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => {
          setIsAnalysisModalOpen(false);
          fetchDashboardData();
        }}
      />
    </div>
  );
}
