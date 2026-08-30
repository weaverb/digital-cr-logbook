import { useState } from 'react';
import { X, Lock, AlertTriangle } from 'lucide-react';
import type { BoundBookRecord } from '../types/logbook';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { CfrLink } from '../lib/legalLinks';

interface LogDispositionModalProps {
  isOpen: boolean;
  record: BoundBookRecord | null;
  onClose: () => void;
  onSave: (recordId: string, dispData: { dispDate: string; dispName: string; dispAddress?: string; dispFFL?: string }) => void;
}

export function LogDispositionModal({ isOpen, record, onClose, onSave }: LogDispositionModalProps) {
  useEscapeKey(onClose, isOpen && !!record);
  const [dispDate, setDispDate] = useState(new Date().toISOString().split('T')[0]);
  const [dispName, setDispName] = useState('');
  const [dispAddress, setDispAddress] = useState('');
  const [dispFFL, setDispFFL] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!dispDate || !dispName.trim()) {
      setErrorMessage('Please fill out the mandatory Disposition Date and Recipient Name fields required by 27 CFR § 478.125(f).');
      return;
    }

    onSave(record.id, {
      dispDate,
      dispName: dispName.trim(),
      dispAddress: dispAddress.trim() || undefined,
      dispFFL: dispFFL.trim() || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              Log Firearm Disposition
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Line #{record.lineNumber} • {record.manufacturer} {record.model} ({record.serialNumber})
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

        {/* Warning Banner */}
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/30 flex items-start space-x-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-amber-200 space-y-1">
            <div className="font-semibold">ATF <CfrLink text="27 CFR § 478.125(f)" className="underline hover:text-amber-300 transition-colors" /> Compliance Lock</div>
            <div className="text-[11px] text-amber-300">
              Recording a disposition marks this firearm as transferred out of your collection. Once saved, this record will be permanently locked against deletion to satisfy ATF audit regulations.
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Validation Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-start space-x-3 text-rose-300">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <strong className="font-semibold block">Missing Required Fields</strong>
                <span className="text-xs">{errorMessage}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1">Disposition Date *</label>
              <input
                type="date"
                required
                value={dispDate}
                onChange={(e) => setDispDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Recipient Name / Business *</label>
              <input
                type="text"
                required
                value={dispName}
                onChange={(e) => setDispName(e.target.value)}
                placeholder="e.g. John Smith or Dealer Name"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Recipient FFL # (if FFL holder)</label>
              <input
                type="text"
                value={dispFFL}
                onChange={(e) => setDispFFL(e.target.value)}
                placeholder="e.g. 3-42-xxx-01"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Recipient Address</label>
              <input
                type="text"
                value={dispAddress}
                onChange={(e) => setDispAddress(e.target.value)}
                placeholder="City, State, ZIP"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded text-xs transition-colors shadow-lg shadow-amber-950/20 flex items-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              Confirm & Lock Disposition Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
