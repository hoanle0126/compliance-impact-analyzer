'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Play, Building2, Loader2, Sparkles } from 'lucide-react';
import { api } from '../lib/api-client';

interface RunAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrganizationId?: string;
  defaultRegulatoryChangeId?: string;
  defaultOrgId?: string;
  defaultChangeId?: string;
  onSuccess?: (analysis?: any) => void;
}

export function RunAnalysisModal({
  isOpen,
  onClose,
  defaultOrganizationId,
  defaultRegulatoryChangeId,
  defaultOrgId,
  defaultChangeId,
  onSuccess,
}: RunAnalysisModalProps) {
  const router = useRouter();

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [regulatoryChanges, setRegulatoryChanges] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState(defaultOrganizationId || defaultOrgId || '');
  const [selectedRegId, setSelectedRegId] = useState(defaultRegulatoryChangeId || defaultChangeId || '');

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.get('/organizations').then((res) => {
        setOrganizations(res || []);
        if (!selectedOrgId && res?.length > 0) {
          setSelectedOrgId(defaultOrganizationId || res[0].id);
        }
      });
      api.get('/regulatory-changes').then((res) => {
        setRegulatoryChanges(res || []);
        if (!selectedRegId && res?.length > 0) {
          setSelectedRegId(defaultRegulatoryChangeId || res[0].id);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRun = async () => {
    if (!selectedOrgId || !selectedRegId) return;

    setIsRunning(true);
    setCurrentStep('Loading target company profile facts & trade history...');

    try {
      setTimeout(() => setCurrentStep('Evaluating deterministic applicability rules against Vietnamese customs topics...'), 400);
      setTimeout(() => setCurrentStep('Retrieving and cross-verifying official legal citations...'), 900);
      setTimeout(() => setCurrentStep('Synthesizing structured compliance impacts, obligations, and actions...'), 1400);

      const res = await api.post('/analyses', {
        organizationId: selectedOrgId,
        regulatoryChangeId: selectedRegId,
        forceReanalyze: true,
      });

      setCurrentStep('Analysis complete! Redirecting to report...');
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(res);
        }
        onClose();
        router.push(`/analyses/${res.id}`);
      }, 500);
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Execute Compliance Impact Analysis
              </h3>
              <p className="text-xs text-slate-500">Evaluate legal change against enterprise profile facts</p>
            </div>
          </div>
          {!isRunning && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {isRunning ? (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-9 h-9 animate-spin text-slate-800 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Analyzing Regulatory Impact</h4>
              <p className="text-xs text-slate-600 font-mono animate-pulse">{currentStep}</p>
            </div>
            <div className="w-48 h-1 bg-slate-100 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-slate-900 rounded-full animate-indeterminate"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Target Organization Selector */}
            <div>
              <label htmlFor="target-org-select" className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Select Target Enterprise
              </label>
              <select
                id="target-org-select"
                data-testid="target-org-select"
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:bg-white transition-all"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.legalName} ({org.displayName}) — {org.organizationType}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Regulatory Change Selector */}
            <div>
              <label htmlFor="target-reg-select" className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                Select Regulatory Document
              </label>
              <select
                id="target-reg-select"
                data-testid="target-reg-select"
                value={selectedRegId}
                onChange={(e) => setSelectedRegId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:bg-white transition-all"
              >
                {regulatoryChanges.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    Số: {reg.documentNumber} — {reg.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">Analysis Methodology:</div>
              <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                <li>Deterministic rule evaluation on verified company profile facts.</li>
                <li>Zero-cost offline execution with strict citation bounds.</li>
                <li>Automated prompt injection defense &amp; deadline extraction.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRun}
                disabled={!selectedOrgId || !selectedRegId}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white shadow-sm flex items-center gap-2 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Analysis Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
