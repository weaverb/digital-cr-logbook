import { useState, useMemo, useEffect, useCallback } from 'react';
import { X, Plus, ShieldCheck, Search, CheckCircle2, RotateCcw } from 'lucide-react';
import type { BoundBookRecord, FirearmType, CRReferenceEntry } from '../types/logbook';
import crMasterData from '../data/cr_master_data.json';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface NewAcquisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newRecord: Omit<BoundBookRecord, 'id' | 'lineNumber' | 'status' | 'isLocked' | 'createdAt' | 'updatedAt'>) => void;
}

const crRecords = crMasterData as CRReferenceEntry[];

export function NewAcquisitionModal({ isOpen, onClose, onSave }: NewAcquisitionModalProps) {
  const [manufacturer, setManufacturer] = useState('');
  const [importer, setImporter] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [type, setType] = useState<FirearmType>('Rifle');
  const [caliber, setCaliber] = useState('');
  const [acqDate, setAcqDate] = useState(new Date().toISOString().split('T')[0]);
  const [acqName, setAcqName] = useState('');
  const [acqAddress, setAcqAddress] = useState('');
  const [acqFFL, setAcqFFL] = useState('');
  const [notes, setNotes] = useState('');

  // Selected C&R Reference Match
  const [selectedCR, setSelectedCR] = useState<CRReferenceEntry | null>(null);
  const [crSearchQuery, setCrSearchQuery] = useState('');
  const [showCrPicker, setShowCrPicker] = useState(false);

  const resetForm = useCallback(() => {
    setManufacturer('');
    setImporter('');
    setModel('');
    setSerialNumber('');
    setType('Rifle');
    setCaliber('');
    setAcqDate(new Date().toISOString().split('T')[0]);
    setAcqName('');
    setAcqAddress('');
    setAcqFFL('');
    setNotes('');
    setSelectedCR(null);
    setCrSearchQuery('');
    setShowCrPicker(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  useEscapeKey(handleClose, isOpen);

  // Automatically reset form whenever modal closes or opens fresh
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const filteredCRs = useMemo(() => {
    if (!crSearchQuery.trim()) return crRecords.slice(0, 10);
    const q = crSearchQuery.toLowerCase();
    return crRecords.filter(r => 
      r.manufacturer_or_make.toLowerCase().includes(q) ||
      r.model.toLowerCase().includes(q) ||
      r.atf_classification_details.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [crSearchQuery]);

  if (!isOpen) return null;

  const handleSelectCR = (cr: CRReferenceEntry) => {
    setSelectedCR(cr);
    if (cr.manufacturer_or_make) setManufacturer(cr.manufacturer_or_make);
    if (cr.model) setModel(cr.model);
    if (cr.caliber_or_gauge) setCaliber(cr.caliber_or_gauge);
    setShowCrPicker(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manufacturer.trim() || !model.trim() || !serialNumber.trim() || !acqDate || !acqName.trim()) {
      alert('Please fill out all mandatory ATF bound book fields (Manufacturer, Model, Serial Number, Acq Date, Acq Source Name).');
      return;
    }

    onSave({
      manufacturer: manufacturer.trim(),
      importer: importer.trim() || undefined,
      model: model.trim(),
      serialNumber: serialNumber.trim(),
      type,
      caliber: caliber.trim(),
      acqDate,
      acqName: acqName.trim(),
      acqAddress: acqAddress.trim() || undefined,
      acqFFL: acqFFL.trim() || undefined,
      crReferenceId: selectedCR?.record_id,
      crSection: selectedCR?.section_code,
      notes: notes.trim() || undefined
    });

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" />
              Record Firearm Acquisition
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter mandatory acquisition details pursuant to 27 CFR § 478.125(f).
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* C&R Autocomplete Selector */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                ATF C&R Reference Database Autocomplete (Optional)
              </label>
              {selectedCR && (
                <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded text-[11px] font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Matched: {selectedCR.record_id} ({selectedCR.section_code})
                </span>
              )}
            </div>

            {!showCrPicker ? (
              <button
                type="button"
                onClick={() => setShowCrPicker(true)}
                className="w-full bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 text-slate-300 py-2 px-3 rounded text-left flex items-center justify-between text-xs transition-colors"
              >
                <span>{selectedCR ? `${selectedCR.manufacturer_or_make} ${selectedCR.model}` : 'Search 4,207 pre-loaded ATF C&R entries to auto-fill specs...'}</span>
                <Search className="w-4 h-4 text-slate-400" />
              </button>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Manufacturer, Model, or Details..."
                    value={crSearchQuery}
                    onChange={(e) => setCrSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-cyan-500/50 rounded pl-8 pr-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-slate-800 rounded bg-slate-900 divide-y divide-slate-800/60 font-mono">
                  {filteredCRs.map(cr => (
                    <button
                      key={cr.record_id}
                      type="button"
                      onClick={() => handleSelectCR(cr)}
                      className="w-full text-left p-2 hover:bg-slate-800/80 text-slate-300 hover:text-slate-100 text-[11px] flex justify-between items-center transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-cyan-400">{cr.manufacturer_or_make}</span> {cr.model}
                        <div className="text-[10px] text-slate-400 line-clamp-1 font-sans">{cr.atf_classification_details}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded shrink-0">{cr.section_code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected C&R Reference Verification Box */}
            {selectedCR && (
              <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/40 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    Matched C&R Entry Verification: {selectedCR.record_id}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCR(null)}
                    className="text-[11px] text-slate-400 hover:text-rose-400 underline font-mono flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear / Re-select
                  </button>
                </div>
                <p className="text-slate-300 font-sans leading-relaxed">{selectedCR.atf_classification_details}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">MANUFACTURER</span>
                    <span className="text-cyan-300 font-semibold">{selectedCR.manufacturer_or_make || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">MODEL</span>
                    <span className="text-cyan-300 font-semibold">{selectedCR.model || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">CALIBER</span>
                    <span className="text-cyan-300 font-semibold">{selectedCR.caliber_or_gauge || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">SECTION</span>
                    <span className="text-cyan-300 font-semibold">{selectedCR.section_code}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Firearm Description Fields */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 pb-1 border-b border-slate-800">
              Firearm Identification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 mb-1">Manufacturer *</label>
                <input
                  type="text"
                  required
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="e.g. Tula Arms Plant"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Importer (if applicable)</label>
                <input
                  type="text"
                  value={importer}
                  onChange={(e) => setImporter(e.target.value)}
                  placeholder="e.g. CAI Georgia VT"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Model *</label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. M91/30"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Serial Number *</label>
                <input
                  type="text"
                  required
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. 913077421"
                  className="w-full bg-slate-950 border border-slate-800 font-mono rounded px-3 py-2 text-amber-400 font-bold focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as FirearmType)}
                  className="w-full bg-slate-950 text-slate-100 border border-slate-800 rounded px-3 py-2 focus:outline-none focus:border-amber-500/50 font-medium"
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
                <label className="block text-slate-300 mb-1">Caliber / Gauge *</label>
                <input
                  type="text"
                  required
                  value={caliber}
                  onChange={(e) => setCaliber(e.target.value)}
                  placeholder="e.g. 7.62x54mmR"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          </div>

          {/* Acquisition Details */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 pb-1 border-b border-slate-800">
              Acquisition Information (Seller / Transferor)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 mb-1">Acquisition Date *</label>
                <input
                  type="date"
                  required
                  value={acqDate}
                  onChange={(e) => setAcqDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Transferor Name *</label>
                <input
                  type="text"
                  required
                  value={acqName}
                  onChange={(e) => setAcqName(e.target.value)}
                  placeholder="e.g. Classic Firearms or John Smith"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Transferor FFL # (if FFL)</label>
                <input
                  type="text"
                  value={acqFFL}
                  onChange={(e) => setAcqFFL(e.target.value)}
                  placeholder="e.g. 1-56-xxx-09"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/50 font-mono"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-slate-300 mb-1">Transferor Address</label>
                <input
                  type="text"
                  value={acqAddress}
                  onChange={(e) => setAcqAddress(e.target.value)}
                  placeholder="Street Address, City, State, ZIP"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 mb-1">Notes & Provenance Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional markings, matching parts, C&R provenance documentation notes..."
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded text-xs transition-colors shadow-lg shadow-amber-950/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Save Bound Book Acquisition Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
