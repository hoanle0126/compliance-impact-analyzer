'use client';

import React, { useState } from 'react';
import { X, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api-client';

interface ReviewModalProps {
  analysisId: string;
  isOpen: boolean;
  onClose: () => void;
  action?: 'APPROVE' | 'REJECT' | 'SUBMIT' | 'approve' | 'reject';
  onSubmit?: (data: { action: 'approve' | 'reject'; comments: string; severityOverride?: string; editedSummary?: string }) => Promise<void>;
  onSuccess?: () => void;
  currentSummary?: string;
  currentSeverity?: string;
}

export function ReviewModal({
  analysisId,
  isOpen,
  onClose,
  action = 'APPROVE',
  onSubmit,
  onSuccess,
  currentSummary = '',
  currentSeverity = '',
}: ReviewModalProps) {
  const initialDecision = action.toLowerCase() === 'reject' ? 'reject' : 'approve';
  const [decision, setDecision] = useState<'approve' | 'reject'>(initialDecision);
  const [comments, setComments] = useState('');
  const [severityOverride, setSeverityOverride] = useState<string>(currentSeverity);
  const [editedSummary, setEditedSummary] = useState(currentSummary);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({
          action: decision,
          comments,
          severityOverride: severityOverride || undefined,
          editedSummary: editedSummary !== currentSummary ? editedSummary : undefined,
        });
      } else {
        const isReject = (action || decision).toUpperCase() === 'REJECT';
        const endpoint = isReject ? `/analyses/${analysisId}/reject` : `/analyses/${analysisId}/approve`;
        await api.post(endpoint, {
          comments: comments || (isReject ? 'Rejected during human compliance review.' : 'Verified and approved by compliance reviewer.'),
          severityOverride: severityOverride || undefined,
        });
        onSuccess?.();
      }
      onClose();
    } catch (err: any) {
      alert(`Review submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Compliance Officer Review &amp; Approval
              </h3>
              <p className="text-xs text-slate-500">Formal human verification of AI assessment findings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Decision Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
              Review Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('approve')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-semibold transition-all ${
                  decision === 'approve'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Approve Assessment
              </button>
              <button
                type="button"
                onClick={() => setDecision('reject')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-semibold transition-all ${
                  decision === 'reject'
                    ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                Reject Assessment
              </button>
            </div>
          </div>

          {/* Review Comments */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-wider">
              Reviewer Rationale &amp; Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Detail your compliance legal findings, verified evidence validity, and operational directives..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:bg-white transition-all"
            />
          </div>

          {/* Optional Severity Override */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-wider">
              Optional Severity Level Override
            </label>
            <select
              value={severityOverride}
              onChange={(e) => setSeverityOverride(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:bg-white transition-all"
            >
              <option value="">Keep AI-calculated severity</option>
              <option value="CRITICAL">Override to CRITICAL</option>
              <option value="HIGH">Override to HIGH</option>
              <option value="MEDIUM">Override to MEDIUM</option>
              <option value="LOW">Override to LOW</option>
            </select>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !comments.trim()}
              className={`px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-all ${
                decision === 'approve'
                  ? 'bg-slate-900 hover:bg-slate-800 disabled:opacity-50'
                  : 'bg-rose-700 hover:bg-rose-800 disabled:opacity-50'
              }`}
            >
              {isSubmitting ? 'Recording...' : decision === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
