'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api-client';
import {
  Building2,
  Globe2,
  Shield,
  Layers,
  ArrowRight,
  Search,
} from 'lucide-react';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<any[]>('/organizations');
      setOrganizations(data || []);
    } catch (err) {
      console.error('Failed to load organizations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const filteredOrgs = organizations.filter(
    (org) =>
      org.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500">
              Corporate Dossiers
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-slate-800" />
            Client Organizations
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Enterprise profiles with customs status, operational activities, raw materials, facilities, and verified profile facts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Organizations Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
          Loading client organizations...
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white border border-slate-200 text-slate-500 text-sm shadow-sm">
          No organizations matched your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrgs.map((org) => {
            const rawActivities = org.activities || org.businessActivities || [];
            const activities = rawActivities.map((a: any) => a.activityType);
            const isImporter = org.customsProfile?.isImporter ?? activities.includes('IMPORT');
            const isExporter = org.customsProfile?.isExporter ?? activities.includes('EXPORT');
            const factsCount = (org.facts || org.profileFacts || []).length;
            const versionsCount = (org.profileVersions || []).length;

            // Completeness check
            let completeness = 40;
            if (activities.length > 0) completeness += 25;
            if (org.customsProfile) completeness += 20;
            if (factsCount > 0) completeness += 15;

            return (
              <div
                key={org.id}
                className="p-6 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Top Tags */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {org.organizationType}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {org.country} &bull; {org.taxId || 'NO TAX ID'}
                    </span>
                  </div>

                  {/* Company Name */}
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                      {org.displayName}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-sans line-clamp-1">
                      {org.legalName}
                    </p>
                  </div>

                  {/* Industry & Model */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-y border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Industry</span>
                      <span className="font-medium text-slate-800">{org.industry || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Business Model</span>
                      <span className="font-medium text-slate-800">{org.businessModel || 'General'}</span>
                    </div>
                  </div>

                  {/* Activities Badges */}
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Business Activities
                    </span>
                    {activities.length === 0 ? (
                      <span className="text-xs text-amber-700 italic">No activities specified</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {activities.map((act: string) => (
                          <span
                            key={act}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-50 text-slate-700 border border-slate-200"
                          >
                            {act}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Customs Profile Indicators */}
                  <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span
                        className={`w-2 h-2 rounded-full ${isImporter ? 'bg-emerald-600' : 'bg-slate-300'}`}
                      />
                      Importer: <strong className="text-slate-900">{isImporter ? 'Yes' : 'No'}</strong>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <span
                        className={`w-2 h-2 rounded-full ${isExporter ? 'bg-blue-600' : 'bg-slate-300'}`}
                      />
                      Exporter: <strong className="text-slate-900">{isExporter ? 'Yes' : 'No'}</strong>
                    </span>
                  </div>

                  {/* Completeness Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium">Profile Completeness</span>
                      <span className="font-mono font-semibold text-slate-700">{completeness}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/50">
                      <div
                        className={`h-full rounded-full ${
                          completeness >= 80 ? 'bg-emerald-600' : completeness >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${completeness}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Link */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">
                    {factsCount} Facts &bull; {versionsCount} Versions
                  </span>
                  <Link
                    href={`/organizations/${org.id}`}
                    className="text-xs font-semibold text-slate-800 hover:text-slate-950 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                  >
                    View Full Profile <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
