import { X, ShieldCheck, BookOpen, Lock, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { BoundBookRecord, AuditLogEntry } from '../types/logbook';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { CfrLink, AtfRulingLink } from '../lib/legalLinks';
import { runComplianceChecks } from '../lib/vaultIntegrity';

interface AuditDashboardModalProps {
  isOpen: boolean;
  records: BoundBookRecord[];
  auditLogs: AuditLogEntry[];
  onClose: () => void;
}

export function AuditDashboardModal({ isOpen, records, auditLogs, onClose }: AuditDashboardModalProps) {
  useEscapeKey(onClose, isOpen);
  if (!isOpen) return null;

  const totalFirearms = records.length;
  const inCollection = records.filter(r => r.status === 'In Collection').length;
  const disposed = records.filter(r => r.status === 'Disposed').length;
  const lockedCount = records.filter(r => r.isLocked).length;

  // Real checks against current record/audit-log data — see src/lib/vaultIntegrity.ts.
  const complianceChecks = runComplianceChecks(records, auditLogs);
  const passedCount = complianceChecks.filter(c => c.pass).length;
  const allChecksPass = passedCount === complianceChecks.length;
  const scorePercent = complianceChecks.length > 0
    ? Math.round((passedCount / complianceChecks.length) * 100)
    : 100;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ATF Bound Book & Compliance Audit Dashboard
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Live collection health metrics, <CfrLink className="underline hover:text-emerald-300 transition-colors" /> compliance check, and audit trail analytics.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Firearms</span>
                <BookOpen className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">{totalFirearms}</div>
              <div className="text-xs text-slate-500">Recorded Bound Book Lines</div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>In Collection</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">{inCollection}</div>
              <div className="text-xs text-emerald-500/80">Active Bound Book Inventory</div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Disposed</span>
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400">{disposed}</div>
              <div className="text-xs text-amber-500/80">Transferred Out ({lockedCount} Locked)</div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Audit Amendments</span>
                <FileText className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-400">{auditLogs.length}</div>
              <div className="text-xs text-slate-500">Logged to ATF_AUDIT_LOG</div>
            </div>
          </div>

          {/* ATF 27 CFR 478.125 Compliance Verification Box */}
          <div className={`p-5 bg-slate-950 border rounded-xl space-y-3 ${allChecksPass ? 'border-emerald-500/30' : 'border-amber-500/30'}`}>
            <div className="flex items-center justify-between">
              <div className={`font-bold text-sm flex items-center gap-2 ${allChecksPass ? 'text-emerald-400' : 'text-amber-400'}`}>
                {allChecksPass ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
                <AtfRulingLink text="ATF Ruling 2016-1" className={`underline transition-colors font-bold ${allChecksPass ? 'hover:text-emerald-300' : 'hover:text-amber-300'}`} /> Compliance Scorecard: {scorePercent}% PASS
              </div>
              <span className={`px-2.5 py-0.5 border rounded-full font-mono text-xs ${
                allChecksPass
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}>
                {allChecksPass ? 'Inspection Ready' : 'Review Needed'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 text-sm">
              {complianceChecks.map(check => (
                <div key={check.id} className="p-2.5 bg-slate-900/80 border border-slate-800 rounded flex items-center gap-2">
                  {check.pass ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span>{check.label}</span>
                  <span className={`ml-auto font-mono font-bold text-xs ${check.pass ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {check.pass ? 'PASS' : 'REVIEW'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-slate-400 text-sm">
          <span>Logbook Vault Status: {allChecksPass ? 'Normal' : 'Review Needed'} (Local Storage)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
