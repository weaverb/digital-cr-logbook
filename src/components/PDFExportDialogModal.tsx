import { useState } from 'react';
import { X, Download, FileCheck, ShieldCheck } from 'lucide-react';
import type { BoundBookRecord } from '../types/logbook';
import { generateBoundBookPDF } from '../lib/pdfExporter';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface PDFExportDialogModalProps {
  isOpen: boolean;
  records: BoundBookRecord[];
  onClose: () => void;
}

export function PDFExportDialogModal({ isOpen, records, onClose }: PDFExportDialogModalProps) {
  useEscapeKey(onClose, isOpen);
  const [collectorName, setCollectorName] = useState('John Doe (Type 03 C&R FFL)');
  const [fflNumber, setFflNumber] = useState('3-42-xxx-01');
  const [filter, setFilter] = useState<'all' | 'collection' | 'disposed'>('all');

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    generateBoundBookPDF(records, {
      collectorName: collectorName.trim() || undefined,
      fflNumber: fflNumber.trim() || undefined,
      filter
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              Generate ATF Printable Bound Book PDF
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              27 CFR § 478.125(f) & ATF Ruling 2016-1 Inspection Format
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1">Licensee / Collector Name *</label>
            <input
              type="text"
              required
              value={collectorName}
              onChange={(e) => setCollectorName(e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">FFL License Number *</label>
            <input
              type="text"
              required
              value={fflNumber}
              onChange={(e) => setFflNumber(e.target.value)}
              placeholder="e.g. 3-42-xxx-01"
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Records Inclusion Filter</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="all">All Bound Book Entries ({records.length} Records)</option>
              <option value="collection">Active Collection Only ({records.filter(r => r.status === 'In Collection').length} Records)</option>
              <option value="disposed">Disposed Records Only ({records.filter(r => r.status === 'Disposed').length} Records)</option>
            </select>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Printable Format Specs
            </div>
            <p>
              Generates a landscape A4 grid with auto-page numbering, line numbers, acquisition sources, disposition records, and formal ATF header block.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-950/20"
            >
              <FileCheck className="w-4 h-4" />
              Download Printable PDF
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
