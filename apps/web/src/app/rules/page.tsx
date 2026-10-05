'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api-client';
import {
  Scale,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Info,
  Shield,
  Layers,
} from 'lucide-react';

export default function RulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<any[]>('/rules');
      setRules(data || []);
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggleRule = async (ruleId: string, currentEnabled: boolean) => {
    setTogglingId(ruleId);
    try {
      await api.patch(`/rules/${ruleId}`, { enabled: !currentEnabled });
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, enabled: !currentEnabled } : r))
      );
    } catch (err: any) {
      alert(`Failed to toggle rule: ${err.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500">
              Deterministic Logic Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-slate-800" />
            Deterministic Applicability Rules
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Safe, auditable evaluation rules executed against organization profile facts before LLM reasoning. No arbitrary eval().
          </p>
        </div>

        <span className="px-3 py-1 rounded-lg text-xs font-mono bg-slate-100 text-slate-800 border border-slate-200 font-semibold self-start sm:self-auto">
          {rules.length} Configured Rules
        </span>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 flex items-start gap-3 shadow-sm">
        <Info className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-slate-900 font-semibold">Deterministic First Principle:</strong>
          <p className="text-slate-600 leading-relaxed font-sans">
            The applicability engine never asks an LLM &quot;Does this regulation apply?&quot; in a single unconstrained prompt.
            Instead, verified organization attributes (importer flag, business activities, customs area) are matched against statutory conditions.
          </p>
        </div>
      </div>

      {/* Rules List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
          Loading applicability rules...
        </div>
      ) : rules.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white border border-slate-200 text-slate-500 text-sm shadow-sm">
          No applicability rules found in database.
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => {
            const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];

            return (
              <div
                key={rule.id}
                className={`p-6 rounded-xl border transition-all ${
                  rule.enabled
                    ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    : 'bg-slate-50/70 border-slate-200 opacity-70'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {rule.name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-800 border border-slate-200 font-semibold">
                        Topic: {rule.topic}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                        Priority: {rule.priority}
                      </span>
                      {rule.enabled ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          ENABLED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-400 border border-slate-200 font-semibold">
                          DISABLED
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      {rule.description}
                    </p>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => handleToggleRule(rule.id, rule.enabled)}
                    disabled={togglingId === rule.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-medium text-slate-800 border border-slate-200 shrink-0 shadow-2xs transition-colors"
                  >
                    {rule.enabled ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-600" /> Disable Rule
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-400" /> Enable Rule
                      </>
                    )}
                  </button>
                </div>

                {/* Conditions Block */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                    Safe Evaluation Conditions ({conditions.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {conditions.map((c: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs flex items-center justify-between"
                      >
                        <span className="text-slate-800 font-bold">{c.field}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-amber-800 font-bold">
                            {c.operator}
                          </span>
                          <span className="text-emerald-800 font-semibold">{JSON.stringify(c.value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
