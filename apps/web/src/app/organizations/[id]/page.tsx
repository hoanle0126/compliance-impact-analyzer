'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api-client';
import {
  Building2,
  ArrowLeft,
  Shield,
  Layers,
  MapPin,
  Box,
  FileCheck,
  History,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { RunAnalysisModal } from '../../../components/run-analysis-modal';

export default function OrganizationDetailPage() {
  const params = useParams();
  const orgId = params.id as string;

  const [org, setOrg] = useState<any>(null);
  const [profileVersions, setProfileVersions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'facts' | 'facilities' | 'products' | 'versions'>('profile');
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [orgData, versions] = await Promise.all([
          api.get(`/organizations/${orgId}`),
          api.get(`/organizations/${orgId}/profile/versions`),
        ]);
        setOrg(orgData);
        setProfileVersions(versions || []);
      } catch (err) {
        console.error('Failed to load organization:', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (orgId) {
      loadData();
    }
  }, [orgId]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
        Loading organization profile...
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
        Organization not found.{' '}
        <Link href="/organizations" className="underline font-semibold ml-2">
          Back to list
        </Link>
      </div>
    );
  }

  const activities = org.activities || org.businessActivities || [];
  const facilities = org.facilities || [];
  const products = org.products || [];
  const facts = org.facts || org.profileFacts || [];
  const customs = org.customsProfile || {
    isImporter: activities.some((a: any) => a.activityType === 'IMPORT'),
    isExporter: activities.some((a: any) => a.activityType === 'EXPORT'),
    isFdi: org.organizationType === 'FDI_ENTERPRISE',
    isEpe: org.organizationType === 'EXPORT_PROCESSING_ENTERPRISE',
    isCustomsBroker: false,
    isBondedWarehouse: false,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/organizations"
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Organizations
        </Link>

        <button
          onClick={() => setIsAnalysisModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-2 shadow-sm transition-all"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          Run Impact Analysis for this Organization
        </button>
      </div>

      {/* Organization Header Banner */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
              {org.organizationType}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Country: <strong className="text-slate-700">{org.country}</strong> &bull; Tax ID:{' '}
              <strong className="text-slate-700">{org.taxId || 'NOT_PROVIDED'}</strong>
            </span>
            {org.active ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                ACTIVE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-500 border border-slate-200">
                INACTIVE
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{org.displayName}</h1>
          <p className="text-sm text-slate-500 font-sans">{org.legalName}</p>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 text-xs text-slate-500">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Industry</span>
            <span className="font-semibold text-slate-800">{org.industry || 'Unknown'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Profile Version</span>
            <span className="font-mono font-bold text-slate-900">v{profileVersions[0]?.versionNumber || 1}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Facts Verified</span>
            <span className="font-mono font-bold text-emerald-700">{facts.length}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 text-sm gap-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3 font-medium transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Customs &amp; Operations
        </button>
        <button
          onClick={() => setActiveTab('facts')}
          className={`pb-3 px-3 font-medium transition-colors border-b-2 ${
            activeTab === 'facts'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Profile Facts ({facts.length})
        </button>
        <button
          onClick={() => setActiveTab('facilities')}
          className={`pb-3 px-3 font-medium transition-colors border-b-2 ${
            activeTab === 'facilities'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Facilities ({facilities.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-3 font-medium transition-colors border-b-2 ${
            activeTab === 'products'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Products &amp; HS ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          className={`pb-3 px-3 font-medium transition-colors border-b-2 ${
            activeTab === 'versions'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Version History ({profileVersions.length})
        </button>
      </div>

      {/* Tab 1: Customs & Operations */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customs Profile */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-700" />
              Customs Status Profile
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block font-medium">Registered Importer</span>
                <span className={`font-bold text-sm ${customs.isImporter ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {customs.isImporter ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block font-medium">Registered Exporter</span>
                <span className={`font-bold text-sm ${customs.isExporter ? 'text-blue-700' : 'text-slate-500'}`}>
                  {customs.isExporter ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block font-medium">FDI Enterprise</span>
                <span className={`font-bold text-sm ${customs.isFdi ? 'text-amber-700' : 'text-slate-500'}`}>
                  {customs.isFdi ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block font-medium">EPE (Export Processing)</span>
                <span className={`font-bold text-sm ${customs.isEpe ? 'text-indigo-700' : 'text-slate-500'}`}>
                  {customs.isEpe ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block font-medium">Customs Broker</span>
                <span className="font-bold text-sm text-slate-700">
                  {customs.isCustomsBroker ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block font-medium">Bonded Warehouse</span>
                <span className="font-bold text-sm text-slate-700">
                  {customs.isBondedWarehouse ? 'YES' : 'NO'}
                </span>
              </div>
            </div>
          </div>

          {/* Business Activities */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              Registered Business Activities
            </h2>
            {activities.length === 0 ? (
              <div className="p-6 text-center text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
                No business activities recorded. This profile will trigger INSUFFICIENT_INFORMATION in regulatory evaluations.
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((act: any) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 font-mono">{act.activityType}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{act.description || 'Active business operation'}</p>
                    </div>
                    {act.isPrimary && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-800 font-bold border border-slate-300">
                        PRIMARY
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Profile Facts */}
      {activeTab === 'facts' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Structured Profile Facts</h2>
              <p className="text-xs text-slate-500">
                Verified attributes utilized by the deterministic applicability rule engine.
              </p>
            </div>
          </div>

          {facts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No structured profile facts registered yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50/70">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Fact Key</th>
                    <th className="py-3 px-4 font-semibold">Value</th>
                    <th className="py-3 px-4 font-semibold">Source</th>
                    <th className="py-3 px-4 font-semibold">Confidence</th>
                    <th className="py-3 px-4 font-semibold">Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {facts.map((fact: any) => (
                    <tr key={fact.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900">
                        {fact.factType || fact.factKey}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-800">
                        {JSON.stringify(fact.valueJson ?? fact.factValue)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                          {fact.source}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          {fact.confidence}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {fact.verified ? (
                          <span className="flex items-center gap-1 text-emerald-700 text-xs font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 text-xs">
                            <HelpCircle className="w-3.5 h-3.5" /> Unverified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Facilities */}
      {activeTab === 'facilities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facilities.length === 0 ? (
            <div className="col-span-2 p-8 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-200 text-xs shadow-sm">
              No facility locations recorded.
            </div>
          ) : (
            facilities.map((fac: any) => (
              <div key={fac.id} className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase font-mono">{fac.facilityType}</span>
                  {fac.isBonded && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                      BONDED AREA
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{fac.location || 'Location not specified'}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Customs Area: <span className="font-medium text-slate-800">{fac.customsArea || 'N/A'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Products */}
      {activeTab === 'products' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Commodities &amp; HS Codes</h2>
          {products.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
              No commodities registered for this organization.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((p: any) => (
                <div key={p.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">HS: {p.hsCode || 'N/A'}</span>
                    <span className="text-[10px] font-mono uppercase bg-white px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                      {p.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">{p.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                    <span>Origins: {(p.originCountries || []).join(', ') || 'Any'}</span>
                    <span>Destinations: {(p.destinationCountries || []).join(', ') || 'Any'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Version History */}
      {activeTab === 'versions' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-700" />
            Profile Version Audit History
          </h2>
          <div className="space-y-3">
            {profileVersions.map((v: any) => (
              <div
                key={v.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">v{v.versionNumber}</span>
                    <span className="text-xs text-slate-600">{v.changeReason || 'Profile snapshot created'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    Created at: {new Date(v.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-800 border border-slate-300 font-semibold">
                  IMMUTABLE SNAPSHOT
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Run Analysis Modal */}
      {isAnalysisModalOpen && (
        <RunAnalysisModal
          isOpen={isAnalysisModalOpen}
          onClose={() => setIsAnalysisModalOpen(false)}
          defaultOrgId={org.id}
          onSuccess={() => {
            setIsAnalysisModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
