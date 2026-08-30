import { X, FileText, Clock, ShieldCheck } from 'lucide-react';
import type { AuditLogEntry } from '../types/logbook';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { AtfRulingLink } from '../lib/legalLinks';

interface AuditLogViewerModalProps {
  isOpen: boolean;
  logs: AuditLogEntry[];
  onClose: () => void;
}

export function AuditLogViewerModal({ isOpen, logs, onClose }: AuditLogViewerModalProps) {
  useEscapeKey(onClose, isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ATF Compliance Audit Log (`ATF_AUDIT_LOG`)
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Immutable log of record amendments per <AtfRulingLink className="underline hover:text-amber-400 transition-colors" />.
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

        {/* Audit Log Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-600" />
              <div className="text-sm font-medium">No Record Amendments Recorded</div>
              <div className="text-sm">All bound book entries remain in their original clean state.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2 text-sm font-sans">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-sm font-bold">
                        {log.fieldChanged}
                      </span>
                      <span className="text-slate-400">Record ID: {log.recordId}</span>
                    </div>
                    <span className="text-slate-400 flex items-center gap-1 font-mono text-sm">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-mono">
                    <div className="p-2 bg-slate-900/80 border border-slate-800 rounded">
                      <div className="text-slate-400 text-sm uppercase font-sans">Old Value</div>
                      <div className="text-red-400 line-through mt-0.5">{log.oldValue || '— (Empty)'}</div>
                    </div>
                    <div className="p-2 bg-slate-900/80 border border-slate-800 rounded">
                      <div className="text-slate-400 text-sm uppercase font-sans">New Value</div>
                      <div className="text-emerald-400 font-semibold mt-0.5">{log.newValue || '— (Empty)'}</div>
                    </div>
                  </div>

                  <div className="pt-1 text-sm text-slate-300">
                    <span className="font-semibold text-amber-400">Amendment Reason: </span>
                    {log.reason}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-sm text-slate-400">
          <span>Total Audit Trail Events: {logs.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
