import { useState, useEffect } from 'react';
import { X, Edit3, ShieldAlert, AlertTriangle } from 'lucide-react';
import type { BoundBookRecord, FirearmType } from '../types/logbook';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { AtfRulingLink } from '../lib/legalLinks';

interface EditRecordModalProps {
  isOpen: boolean;
  record: BoundBookRecord | null;
  onClose: () => void;
  onSave: (recordId: string, updatedData: Partial<BoundBookRecord>, auditReason: string) => void;
}

export function EditRecordModal({ isOpen, record, onClose, onSave }: EditRecordModalProps) {
  useEscapeKey(onClose, isOpen && !!record);
  const [manufacturer, setManufacturer] = useState('');
  const [importer, setImporter] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [type, setType] = useState<FirearmType>('Rifle');
  const [caliber, setCaliber] = useState('');
  const [acqDate, setAcqDate] = useState('');
  const [acqName, setAcqName] = useState('');
  const [acqAddress, setAcqAddress] = useState('');
  const [acqFFL, setAcqFFL] = useState('');
  const [notes, setNotes] = useState('');
  const [auditReason, setAuditReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setManufacturer(record.manufacturer);
      setImporter(record.importer || '');
      setModel(record.model);
      setSerialNumber(record.serialNumber);
      setType(record.type);
      setCaliber(record.caliber);
      setAcqDate(record.acqDate);
      setAcqName(record.acqName);
      setAcqAddress(record.acqAddress || '');
      setAcqFFL(record.acqFFL || '');
      setNotes(record.notes || '');
      setAuditReason('');
      setErrorMessage(null);
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!auditReason.trim()) {
      setErrorMessage('ATF 2016-1 audit rules require a mandatory reason for amending bound book entries (e.g. Typo correction in serial number, corrected manufacturer name).');
      return;
    }

    onSave(
      record.id,
      {
        manufacturer,
        importer: importer.trim() || undefined,
        model,
        serialNumber,
        type,
        caliber,
        acqDate,
        acqName,
        acqAddress: acqAddress.trim() || undefined,
        acqFFL: acqFFL.trim() || undefined,
        notes: notes.trim() || undefined
      },
      auditReason.trim()
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-500" />
              Amend Bound Book Entry #{record.lineNumber}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              ATF <AtfRulingLink text="Ruling 2016-1" className="underline hover:text-amber-400 transition-colors" /> compliant record editing with immutable audit trail.
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

        {/* Mandatory Reason Prompt */}
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/30 flex items-start space-x-3 text-sm">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-amber-200 space-y-1">
            <div className="font-semibold">ATF Audit Trail Log Requirement</div>
            <div className="text-sm text-amber-300">
              Any modifications to previously saved bound book records are logged in <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-400 font-mono">ATF_AUDIT_LOG</code> along with the previous value, new value, timestamp, and your explicit explanation.
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
          {/* Validation Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-start space-x-3 text-rose-300">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <strong className="font-semibold block">Audit Reason Required</strong>
                <span className="text-sm">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Reason input at top */}
          <div className="p-3 bg-slate-950 border border-amber-500/40 rounded-lg space-y-1.5">
            <label className="block text-amber-400 font-semibold">
              Mandatory Reason for Editing *
            </label>
            <input
              type="text"
              required
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              placeholder="e.g. Corrected typo in serial number digit from 7 to 1"
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-slate-300 mb-1">Manufacturer *</label>
              <input
                type="text"
                required
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Importer</label>
              <input
                type="text"
                value={importer}
                onChange={(e) => setImporter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Model *</label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Serial Number *</label>
              <input
                type="text"
                required
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 font-mono rounded px-3 py-2 text-amber-400 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as FirearmType)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Rifle">Rifle</option>
                <option value="Pistol">Pistol</option>
                <option value="Revolver">Revolver</option>
                <option value="Shotgun">Shotgun</option>
                <option value="Receiver / Frame">Receiver / Frame</option>
                <option value="Combination">Combination</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Caliber *</label>
              <input
                type="text"
                required
                value={caliber}
                onChange={(e) => setCaliber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-slate-300 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded text-sm transition-colors shadow-lg shadow-amber-950/20"
            >
              Save Amendment & Log Audit Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
