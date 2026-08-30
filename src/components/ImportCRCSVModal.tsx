import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Database,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { 
  parseCRReferenceCSV, 
  saveCustomCRLibrary, 
  resetCRLibraryToDefault, 
  getDefaultCRLibrary,
  getCRLibraryMetadata,
  type CRLibraryMetadata
} from '../lib/crLibraryStorage';
import type { CRReferenceEntry } from '../types/logbook';

interface ImportCRCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedRecords: CRReferenceEntry[], metadata: CRLibraryMetadata) => void;
  onResetSuccess: (defaultRecords: CRReferenceEntry[], metadata: CRLibraryMetadata) => void;
}

export function ImportCRCSVModal({
  isOpen,
  onClose,
  onImportSuccess,
  onResetSuccess
}: ImportCRCSVModalProps) {
  useEscapeKey(onClose, isOpen);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewEntries, setPreviewEntries] = useState<CRReferenceEntry[] | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMetadata = getCRLibraryMetadata();

  if (!isOpen) return null;

  const resetState = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setErrorMessage(null);
    setPreviewEntries(null);
    setConfirmReset(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Please select a valid .csv file.');
      setSelectedFile(null);
      setPreviewEntries(null);
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const text = await file.text();
      const entries = parseCRReferenceCSV(text);
      setPreviewEntries(entries);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse the uploaded CSV file.');
      setPreviewEntries(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplyImport = async () => {
    if (!previewEntries || previewEntries.length === 0) return;

    try {
      setIsProcessing(true);
      await saveCustomCRLibrary(previewEntries, selectedFile?.name);
      const meta = getCRLibraryMetadata();
      onImportSuccess(previewEntries, meta);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save imported C&R dataset to storage.');
      setIsProcessing(false);
    }
  };

  const handleResetToDefault = async () => {
    await resetCRLibraryToDefault();
    const meta = getCRLibraryMetadata();
    const defaults = getDefaultCRLibrary();
    onResetSuccess(defaults, meta);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              Import ATF C&R Master List (CSV)
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Drop and replace the offline Curios & Relics reference library with an updated official CSV list.
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Active Dataset Status Card */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-slate-400 font-mono text-xs">Current Active Dataset:</div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-200 font-bold text-sm">
                  {currentMetadata.isCustom ? 'Custom User-Imported List' : 'Default Official Bundled List'}
                </span>
                <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full font-mono text-xs">
                  {currentMetadata.totalRecords.toLocaleString()} Records
                </span>
              </div>
              {currentMetadata.isCustom && (
                <div className="text-sm text-slate-400 font-mono">
                  Source: {currentMetadata.sourceFileName} • Imported: {new Date(currentMetadata.importedAt || '').toLocaleDateString()}
                </div>
              )}
            </div>

            {currentMetadata.isCustom && (
              <div>
                {!confirmReset ? (
                  <button
                    onClick={() => setConfirmReset(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Restore Bundled Default</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleResetToDefault}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded text-sm transition-colors"
                    >
                      Confirm Reset
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="px-2 py-1 text-slate-400 hover:text-slate-200 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
              dragOver 
                ? 'border-cyan-400 bg-cyan-950/20' 
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-950/10'
                : 'border-slate-800 hover:border-cyan-500/40 bg-slate-950/50 hover:bg-slate-950'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv"
              className="hidden"
            />

            <div className={`p-3 rounded-full ${selectedFile ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
              {selectedFile ? <FileSpreadsheet className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
            </div>

            <div className="space-y-1">
              <p className="text-slate-200 font-medium">
                {selectedFile ? selectedFile.name : 'Choose a new ATF C&R CSV file or drag and drop here'}
              </p>
              <p className="text-xs text-slate-500">
                Supports official ATF Master C&R CSV datasets (`curios_and_relics_master_list_*.csv`)
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-start space-x-3 text-rose-300">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <strong className="font-semibold block">CSV Parsing Error</strong>
                <span className="text-sm">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Preview Details */}
          {previewEntries && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Ready to Import and Replace
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded font-mono font-bold text-sm">
                  {previewEntries.length.toLocaleString()} Valid Records Extracted
                </span>
              </div>

              <p className="text-slate-300 text-sm">
                Importing will replace the active local C&R reference database. Your logbook records, acquisitions, and audit entries will remain completely intact and reference the updated list.
              </p>
            </div>
          )}

          {/* Guidelines info */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex items-start space-x-3 text-slate-400 text-sm">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Source of Truth:</strong> When the ATF publishes updated C&R PDFs, generate the corresponding CSV list using the repository extraction tooling and import it here to update the application instantly without reinstalling.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleApplyImport}
            disabled={!previewEntries || previewEntries.length === 0 || isProcessing}
            className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-md ${
              previewEntries && previewEntries.length > 0 && !isProcessing
                ? 'bg-cyan-500 hover:bg-cyan-400 text-cyan-950 shadow-cyan-500/20 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{isProcessing ? 'Processing...' : 'Apply & Replace C&R List'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
