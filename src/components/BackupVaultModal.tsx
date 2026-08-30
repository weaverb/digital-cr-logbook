import { useState } from 'react';
import { X, ShieldCheck, Key, Download, Upload, Copy, Check, AlertTriangle } from 'lucide-react';
import { generate12WordSeed, createEncryptedVaultArchive, decryptVaultArchive } from '../lib/cryptoVault';
import type { VaultPayload } from '../lib/cryptoVault';
import { 
  getBoundBookRecords, 
  saveBoundBookRecords, 
  getAuditLogs, 
  getMaintenanceRecords, 
  getRangeRecords 
} from '../lib/storage';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { saveFileWithNativePicker } from '../lib/fileSaveHelper';

interface BackupVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess: () => void;
}

interface PendingRestore {
  payload: VaultPayload;
  currentCounts: {
    boundBook: number;
    audit: number;
    maintenance: number;
    range: number;
  };
}

export function BackupVaultModal({ isOpen, onClose, onRestoreSuccess }: BackupVaultModalProps) {
  const [activeMode, setActiveMode] = useState<'backup' | 'restore'>('backup');

  // Seed phrase state for backup
  const [seedWords, setSeedWords] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Input seed phrase state for restore
  const [restoreInputSeed, setRestoreInputSeed] = useState('');
  const [selectedRestoreFile, setSelectedRestoreFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set once a backup file decrypts successfully; the actual overwrite is
  // held until the user explicitly confirms it in the review screen below.
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(null);

  const handleModalClose = () => {
    setPendingRestore(null);
    setErrorMessage(null);
    onClose();
  };

  useEscapeKey(handleModalClose, isOpen);

  if (!isOpen) return null;

  const handleGenerateNewSeed = async () => {
    const newSeed = await generate12WordSeed();
    setSeedWords(newSeed);
    setCopied(false);
  };

  const handleCopySeed = () => {
    navigator.clipboard.writeText(seedWords.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportBackup = async () => {
    if (seedWords.length !== 12) {
      alert('Please generate a 12-word seed phrase first.');
      return;
    }

    try {
      setIsProcessing(true);
      const payload: VaultPayload = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        boundBookRecords: getBoundBookRecords(),
        auditLogs: getAuditLogs(),
        maintenanceRecords: getMaintenanceRecords(),
        rangeRecords: getRangeRecords()
      };

      const blob = await createEncryptedVaultArchive(payload, seedWords);
      const fileName = `cnr_logbook_encrypted_vault_${new Date().toISOString().split('T')[0]}.crbk`;

      await saveFileWithNativePicker(
        blob,
        fileName,
        'Encrypted Logbook Backup Vault (.crbk)',
        'crbk'
      );

      setIsProcessing(false);
    } catch (e: any) {
      setIsProcessing(false);
      alert('Failed to generate encrypted backup vault: ' + e.message);
    }
  };

  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedRestoreFile) {
      setErrorMessage('Please select a valid .crbk backup archive file.');
      return;
    }

    const words = restoreInputSeed.trim().toLowerCase().split(/\s+/);
    if (words.length !== 12) {
      setErrorMessage('Please enter all 12 seed phrase words separated by spaces.');
      return;
    }

    try {
      setIsProcessing(true);
      const arrayBuffer = await selectedRestoreFile.arrayBuffer();
      const payload = await decryptVaultArchive(arrayBuffer, words);

      // Decryption succeeded — stage the restore and let the user review
      // exactly what will be overwritten before anything is written.
      // (defensively tolerate an older/partial archive missing a field)
      setPendingRestore({
        payload,
        currentCounts: {
          boundBook: getBoundBookRecords().length,
          audit: getAuditLogs().length,
          maintenance: getMaintenanceRecords().length,
          range: getRangeRecords().length,
        },
      });
      setIsProcessing(false);
    } catch (e: any) {
      setIsProcessing(false);
      setErrorMessage(
        e?.message || 'Decryption failed: Invalid 12-word seed phrase or corrupted backup archive.'
      );
    }
  };

  const handleCancelRestore = () => {
    setPendingRestore(null);
  };

  const handleConfirmRestore = () => {
    if (!pendingRestore) return;
    const { payload } = pendingRestore;

    // Save restored data to storage — this is the only place that actually
    // overwrites current records, and it only runs after explicit confirmation.
    saveBoundBookRecords(payload.boundBookRecords ?? []);
    localStorage.setItem('cr_logbook_audit_log_v1', JSON.stringify(payload.auditLogs ?? []));
    localStorage.setItem('cr_logbook_maintenance_records_v1', JSON.stringify(payload.maintenanceRecords ?? []));
    localStorage.setItem('cr_logbook_range_records_v1', JSON.stringify(payload.rangeRecords ?? []));

    setPendingRestore(null);
    alert('Vault successfully restored! Bound book and compliance records reloaded.');
    onRestoreSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              BIP-39 Encrypted Backup & Restore Vault
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              100% offline AES-256-GCM encrypted backup archives (`.crbk`).
            </p>
          </div>
          <button
            onClick={handleModalClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="bg-slate-950 px-6 pt-3 border-b border-slate-800 flex space-x-2">
          <button
            onClick={() => setActiveMode('backup')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeMode === 'backup'
                ? 'bg-slate-900 text-amber-400 border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Create Encrypted Backup
          </button>
          <button
            onClick={() => setActiveMode('restore')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeMode === 'restore'
                ? 'bg-slate-900 text-cyan-400 border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Restore from Backup
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {activeMode === 'backup' ? (
            <div className="space-y-5 text-xs">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2">
                <div className="font-bold text-amber-400 flex items-center gap-2">
                  <Key className="w-4 h-4" /> 12-Word BIP-39 Vault Seed Key
                </div>
                <p className="text-amber-200 text-[11px]">
                  Write down or copy these 12 seed words. You will need this exact seed phrase to restore your encrypted bound book backup on another computer.
                </p>
              </div>

              {seedWords.length === 0 ? (
                <div className="text-center py-6">
                  <button
                    onClick={handleGenerateNewSeed}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-lg text-xs transition-colors shadow-lg shadow-amber-950/20"
                  >
                    Generate 12-Word BIP-39 Seed Key
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 border border-slate-800 rounded-lg font-mono text-xs">
                    {seedWords.map((word, idx) => (
                      <div key={idx} className="p-2 bg-slate-900 border border-slate-800 rounded flex items-center space-x-2">
                        <span className="text-slate-500 text-[10px] w-4">{idx + 1}.</span>
                        <span className="text-amber-300 font-bold">{word}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleCopySeed}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium text-xs flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied to Clipboard' : 'Copy Seed Phrase'}</span>
                    </button>

                    <button
                      onClick={handleExportBackup}
                      disabled={isProcessing}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded text-xs transition-colors shadow-lg shadow-amber-950/20 flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      Download Encrypted Archive (.crbk)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : pendingRestore ? (
            /* Restore Confirmation — nothing is written until the user confirms here */
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg space-y-2">
                <div className="font-bold text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Confirm Restore — This Cannot Be Undone
                </div>
                <p className="text-red-200 text-[11px]">
                  The backup file decrypted successfully. Restoring will permanently
                  <strong> replace your current bound book, audit log, maintenance, and range records </strong>
                  with the contents of this backup. Review the counts below before continuing.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                  <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wide">
                    Current Data (Will Be Replaced)
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Bound Book Records</span>
                    <span className="font-mono text-slate-100">{pendingRestore.currentCounts.boundBook}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Audit Log Entries</span>
                    <span className="font-mono text-slate-100">{pendingRestore.currentCounts.audit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Maintenance Records</span>
                    <span className="font-mono text-slate-100">{pendingRestore.currentCounts.maintenance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Range Records</span>
                    <span className="font-mono text-slate-100">{pendingRestore.currentCounts.range}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-cyan-500/30 rounded-lg space-y-1.5">
                  <div className="text-cyan-400 font-semibold text-[11px] uppercase tracking-wide">
                    Incoming Backup ({new Date(pendingRestore.payload.timestamp).toLocaleDateString()})
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Bound Book Records</span>
                    <span className="font-mono text-cyan-300">{pendingRestore.payload.boundBookRecords?.length ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Audit Log Entries</span>
                    <span className="font-mono text-cyan-300">{pendingRestore.payload.auditLogs?.length ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Maintenance Records</span>
                    <span className="font-mono text-cyan-300">{pendingRestore.payload.maintenanceRecords?.length ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Range Records</span>
                    <span className="font-mono text-cyan-300">{pendingRestore.payload.rangeRecords?.length ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelRestore}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-xs transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Confirm & Overwrite Current Data
                </button>
              </div>
            </div>
          ) : (
            /* Restore Mode */
            <form onSubmit={handleRestoreSubmit} className="space-y-4 text-xs">
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg space-y-1.5">
                <div className="font-bold text-cyan-400 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Decrypt & Restore Vault Archive
                </div>
                <p className="text-cyan-200 text-[11px]">
                  Select a saved `.crbk` encrypted file and provide the 12-word seed phrase used during backup.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1">Select `.crbk` Vault File *</label>
                <input
                  type="file"
                  accept=".crbk"
                  onChange={(e) => setSelectedRestoreFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">12-Word BIP-39 Seed Phrase *</label>
                <textarea
                  rows={3}
                  placeholder="Enter all 12 words separated by spaces (e.g. abandon ability able about above...)"
                  value={restoreInputSeed}
                  onChange={(e) => setRestoreInputSeed(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-amber-300 font-mono text-xs focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-bold rounded text-xs transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Decrypt & Load Vault Data
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
