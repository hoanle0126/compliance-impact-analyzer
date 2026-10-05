'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api-client';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  Building2,
  ArrowRight,
  Filter,
  Check,
  RotateCw,
  Search,
  LayoutGrid,
  List,
} from 'lucide-react';

export default function ActionPlanPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchActions = async () => {
    setIsLoading(true);
    try {
      const analyses = await api.get<any[]>('/analyses');
      const allActions: any[] = [];
      (analyses || []).forEach((a) => {
        (a.recommendedActions || []).forEach((act: any) => {
          allActions.push({
            ...act,
            analysisId: a.id,
            orgName: a.organization?.displayName || 'Unknown Organization',
            documentNumber: a.regulatoryChange?.documentNumber || 'Circular',
          });
        });
      });
      setActions(allActions);
    } catch (err) {
      console.error('Failed to load actions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleUpdateStatus = async (actionId: string, newStatus: string) => {
    setUpdatingId(actionId);
    try {
      await api.patch(`/actions/${actionId}`, { status: newStatus });
      setActions((prev) =>
        prev.map((a) => (a.id === actionId ? { ...a, status: newStatus } : a))
      );
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredActions = actions.filter((act) => {
    const matchesPriority = priorityFilter === 'ALL' || act.priority === priorityFilter;
    const matchesStatus = statusFilter === 'ALL' || act.status === statusFilter;
    const matchesOwner = ownerFilter === 'ALL' || act.suggestedOwner === ownerFilter;
    const matchesSearch =
      !searchQuery ||
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.orgName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPriority && matchesStatus && matchesOwner && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500">
              Operations Tracking
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ListTodo className="w-6 h-6 text-slate-800" />
            Compliance Action Plan
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Operational action items generated from regulatory impact assessments with owners, deadlines, and tracking.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" /> Table View
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'kanban'
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Kanban Board
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center gap-4 text-xs shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action items or companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">All Statuses</option>
            <option value="NOT_STARTED">NOT_STARTED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="DISMISSED">DISMISSED</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Owner:</span>
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">All Departments</option>
            <option value="CUSTOMS">CUSTOMS</option>
            <option value="LEGAL">LEGAL</option>
            <option value="IT">IT</option>
            <option value="FINANCE">FINANCE</option>
            <option value="LOGISTICS">LOGISTICS</option>
            <option value="OPERATIONS">OPERATIONS</option>
          </select>
        </div>
      </div>

      {/* View 1: Table */}
      {viewMode === 'table' && (
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading action items...</div>
          ) : filteredActions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No compliance actions found matching your criteria.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5 font-semibold">Priority</th>
                  <th className="py-3 px-4 font-semibold">Action Item</th>
                  <th className="py-3 px-4 font-semibold">Organization</th>
                  <th className="py-3 px-4 font-semibold">Owner</th>
                  <th className="py-3 px-4 font-semibold">Due Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-5 text-right font-semibold">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredActions.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          act.priority === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : act.priority === 'HIGH'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {act.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-slate-900 text-xs">{act.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {act.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-medium text-slate-800 block">{act.orgName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {act.documentNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono font-medium text-slate-700">
                      {act.suggestedOwner}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono">
                      {act.dueDate ? (
                        <span className="text-amber-800 font-semibold">{act.dueDate}</span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          act.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : act.status === 'IN_PROGRESS'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {act.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {act.status !== 'IN_PROGRESS' && act.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleUpdateStatus(act.id, 'IN_PROGRESS')}
                            disabled={updatingId === act.id}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium border border-slate-200 transition-colors"
                          >
                            Start
                          </button>
                        )}
                        {act.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleUpdateStatus(act.id, 'COMPLETED')}
                            disabled={updatingId === act.id}
                            className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium border border-emerald-200 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        <Link
                          href={`/analyses/${act.analysisId}`}
                          className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs transition-colors"
                        >
                          View &rarr;
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* View 2: Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column: NOT_STARTED */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                To Do / Not Started
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white text-slate-600 border border-slate-200 font-semibold">
                {filteredActions.filter((a) => a.status === 'NOT_STARTED').length}
              </span>
            </div>
            <div className="space-y-3">
              {filteredActions
                .filter((a) => a.status === 'NOT_STARTED')
                .map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-lg bg-white border border-slate-200 space-y-2 hover:border-slate-300 shadow-2xs transition-all text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                        {act.priority}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 font-medium">{act.suggestedOwner}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-xs">{act.title}</h3>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{act.description}</p>
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                      <span className="text-[10px] text-slate-500 truncate max-w-[120px] font-medium">
                        {act.orgName}
                      </span>
                      <button
                        onClick={() => handleUpdateStatus(act.id, 'IN_PROGRESS')}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-[10px] font-medium transition-colors"
                      >
                        Start &rarr;
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Column: IN_PROGRESS */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-900">
                In Progress
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                {filteredActions.filter((a) => a.status === 'IN_PROGRESS').length}
              </span>
            </div>
            <div className="space-y-3">
              {filteredActions
                .filter((a) => a.status === 'IN_PROGRESS')
                .map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-lg bg-white border border-blue-200 space-y-2 shadow-2xs text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 uppercase">
                        {act.priority}
                      </span>
                      <span className="font-mono text-[10px] text-blue-700 font-medium">{act.suggestedOwner}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-xs">{act.title}</h3>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{act.description}</p>
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                      <span className="text-[10px] text-slate-500 truncate max-w-[120px] font-medium">
                        {act.orgName}
                      </span>
                      <button
                        onClick={() => handleUpdateStatus(act.id, 'COMPLETED')}
                        className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-medium transition-colors"
                      >
                        Complete &#10003;
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Column: COMPLETED */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
                Completed
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                {filteredActions.filter((a) => a.status === 'COMPLETED').length}
              </span>
            </div>
            <div className="space-y-3">
              {filteredActions
                .filter((a) => a.status === 'COMPLETED')
                .map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-lg bg-white/90 border border-slate-200 space-y-2 opacity-85 text-xs shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        DONE
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 font-medium">{act.suggestedOwner}</span>
                    </div>
                    <h3 className="font-semibold text-slate-500 line-through text-xs">{act.title}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{act.description}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
