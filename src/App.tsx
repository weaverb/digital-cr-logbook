import { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  Search, 
  Lock, 
  Plus, 
  Download, 
  Wrench, 
  Target, 
  Database, 
  HardDrive,
  Edit3,
  History,
  Sparkles,
  Users,
  Camera,
  Activity,
  Command,
  Tag,
  HelpCircle
} from 'lucide-react';
import { APP_VERSION } from './lib/version';
import { CfrLink } from './lib/legalLinks';
import type { BoundBookRecord, CRReferenceEntry, MaintenanceRecord } from './types/logbook';
import { 
  getBoundBookRecords, 
  saveBoundBookRecords, 
  getAuditLogs, 
  logAuditEvent,
  getMaintenanceRecords,
  saveMaintenanceRecord,
  getRangeRecords,
  saveRangeRecord
} from './lib/storage';
import { NewAcquisitionModal } from './components/NewAcquisitionModal';
import { LogDispositionModal } from './components/LogDispositionModal';
import { EditRecordModal } from './components/EditRecordModal';
import { AuditLogViewerModal } from './components/AuditLogViewerModal';
import { BackupVaultModal } from './components/BackupVaultModal';
import { ContactsRolodexModal } from './components/ContactsRolodexModal';
import { MediaGalleryModal } from './components/MediaGalleryModal';
import { AuditDashboardModal } from './components/AuditDashboardModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { PDFExportDialogModal } from './components/PDFExportDialogModal';
import { VaultHealthModal } from './components/VaultHealthModal';
import { UserSupportModal } from './components/UserSupportModal';
import { ImportCRCSVModal } from './components/ImportCRCSVModal';
import { saveFileWithNativePicker } from './lib/fileSaveHelper';
import { hotkeyLabel } from './lib/osHelper';
import { getActiveCRLibrary, getCRLibraryMetadata, type CRLibraryMetadata } from './lib/crLibraryStorage';

export function App() {
  const [records, setRecords] = useState<BoundBookRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState(getAuditLogs());
  const [activeTab, setActiveTab] = useState<'boundbook' | 'reference' | 'maintenance' | 'range'>('boundbook');

  // Dynamic C&R Reference Library State (Bundled or User-Imported CSV)
  const [crRecords, setCrRecords] = useState<CRReferenceEntry[]>(() => getActiveCRLibrary());
  const [crMetadata, setCrMetadata] = useState<CRLibraryMetadata>(() => getCRLibraryMetadata());
  
  // Selection and Search State
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'collection' | 'disposed'>('all');
  
  // Reference Library Search State
  const [crSearchQuery, setCrSearchQuery] = useState('');
  const [crSectionFilter, setCrSectionFilter] = useState<string>('all');

  // Modals
  const [isAcqModalOpen, setIsAcqModalOpen] = useState(false);
  const [dispModalRecord, setDispModalRecord] = useState<BoundBookRecord | null>(null);
  const [editModalRecord, setEditModalRecord] = useState<BoundBookRecord | null>(null);
  const [isAuditViewerOpen, setIsAuditViewerOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [isPDFOptionsOpen, setIsPDFOptionsOpen] = useState(false);
  const [isVaultHealthOpen, setIsVaultHealthOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isImportCRModalOpen, setIsImportCRModalOpen] = useState(false);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick Maintenance & Range Inputs for Selected Firearm
  const [newMaintType, setNewMaintType] = useState<MaintenanceRecord['type']>('Cleaning');
  const [newMaintCost, setNewMaintCost] = useState('');
  const [newMaintBy, setNewMaintBy] = useState('');
  const [newMaintNotes, setNewMaintNotes] = useState('');

  const [newRangeAmmo, setNewRangeAmmo] = useState('');
  const [newRangeRounds, setNewRangeRounds] = useState('');
  const [newRangeNotes, setNewRangeNotes] = useState('');

  // Load records from local storage on mount
  useEffect(() => {
    const loaded = getBoundBookRecords();
    setRecords(loaded);
    if (loaded.length > 0) {
      setSelectedRecordId(loaded[0].id);
    }
  }, []);

  const selectedRecord = useMemo(() => {
    return records.find(r => r.id === selectedRecordId) || records[0] || null;
  }, [records, selectedRecordId]);

  const [logRefreshKey, setLogRefreshKey] = useState(0);

  const selectedMaintenance = useMemo(() => {
    return selectedRecord ? getMaintenanceRecords(selectedRecord.id) : [];
  }, [selectedRecord, logRefreshKey]);

  const selectedRange = useMemo(() => {
    return selectedRecord ? getRangeRecords(selectedRecord.id) : [];
  }, [selectedRecord, logRefreshKey]);

  const totalRoundsFired = useMemo(() => {
    return selectedRange.reduce((acc, r) => acc + r.roundsFired, 0);
  }, [selectedRange]);

  const matchedCRInfo = useMemo(() => {
    if (!selectedRecord?.crReferenceId) return null;
    return crRecords.find(c => c.record_id === selectedRecord.crReferenceId) || null;
  }, [selectedRecord]);

  // Filtered Bound Book Records
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        record.manufacturer.toLowerCase().includes(q) ||
        record.model.toLowerCase().includes(q) ||
        record.serialNumber.toLowerCase().includes(q) ||
        (record.importer && record.importer.toLowerCase().includes(q)) ||
        record.caliber.toLowerCase().includes(q);
      
      if (filterStatus === 'collection') return matchesSearch && record.status === 'In Collection';
      if (filterStatus === 'disposed') return matchesSearch && record.status === 'Disposed';
      return matchesSearch;
    });
  }, [records, searchQuery, filterStatus]);

  // Filtered C&R Reference Entries
  const filteredCRLibrary = useMemo(() => {
    return crRecords.filter(cr => {
      const q = crSearchQuery.toLowerCase();
      const matchesSearch = 
        cr.manufacturer_or_make.toLowerCase().includes(q) ||
        cr.model.toLowerCase().includes(q) ||
        cr.atf_classification_details.toLowerCase().includes(q) ||
        cr.record_id.toLowerCase().includes(q);

      if (crSectionFilter !== 'all') return matchesSearch && cr.section_code === crSectionFilter;
      return matchesSearch;
    }).slice(0, 100); // High performance virtualization slice
  }, [crSearchQuery, crSectionFilter]);

  // Handle Save New Acquisition
  const handleSaveAcquisition = (newAcq: Omit<BoundBookRecord, 'id' | 'lineNumber' | 'status' | 'isLocked' | 'createdAt' | 'updatedAt'>) => {
    const nextLineNumber = records.length > 0 ? Math.max(...records.map(r => r.lineNumber)) + 1 : 1;
    const now = new Date().toISOString();
    
    const created: BoundBookRecord = {
      ...newAcq,
      id: 'rec-' + Date.now(),
      lineNumber: nextLineNumber,
      status: 'In Collection',
      isLocked: false,
      createdAt: now,
      updatedAt: now
    };

    const updated = [...records, created].sort((a, b) => a.lineNumber - b.lineNumber);
    setRecords(updated);
    saveBoundBookRecords(updated);
    setSelectedRecordId(created.id);
  };

  // Handle Save Disposition (Locking record per 27 CFR § 478.125(f))
  const handleSaveDisposition = (recordId: string, dispData: { dispDate: string; dispName: string; dispAddress?: string; dispFFL?: string }) => {
    const updated = records.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          ...dispData,
          status: 'Disposed' as const,
          isLocked: true, // Permanent ATF compliance lock
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });

    setRecords(updated);
    saveBoundBookRecords(updated);
  };

  // Handle Edit Record with Mandatory ATF Audit Log
  const handleSaveAmendment = (recordId: string, updatedData: Partial<BoundBookRecord>, auditReason: string) => {
    const existing = records.find(r => r.id === recordId);
    if (!existing) return;

    // Detect changed fields and write to ATF_AUDIT_LOG
    Object.keys(updatedData).forEach(key => {
      const k = key as keyof BoundBookRecord;
      if (existing[k] !== updatedData[k]) {
        logAuditEvent({
          recordId: existing.id,
          fieldChanged: key,
          oldValue: String(existing[k] ?? ''),
          newValue: String(updatedData[k] ?? ''),
          reason: auditReason
        });
      }
    });

    const updated = records.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          ...updatedData,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });

    setRecords(updated);
    saveBoundBookRecords(updated);
    setAuditLogs(getAuditLogs());
  };

  // Add Maintenance Log
  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !newMaintNotes.trim()) return;

    saveMaintenanceRecord({
      firearmId: selectedRecord.id,
      date: new Date().toISOString().split('T')[0],
      type: newMaintType,
      cost: parseFloat(newMaintCost) || 0,
      performedBy: newMaintBy.trim() || 'Self',
      notes: newMaintNotes.trim()
    });

    setNewMaintCost('');
    setNewMaintBy('');
    setNewMaintNotes('');
    setLogRefreshKey(prev => prev + 1);
  };

  // Add Range Log
  const handleAddRangeLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !newRangeAmmo.trim() || !newRangeRounds) return;

    saveRangeRecord({
      firearmId: selectedRecord.id,
      date: new Date().toISOString().split('T')[0],
      ammoType: newRangeAmmo.trim(),
      roundsFired: parseInt(newRangeRounds, 10) || 0,
      notes: newRangeNotes.trim()
    });

    setNewRangeAmmo('');
    setNewRangeRounds('');
    setNewRangeNotes('');
    setLogRefreshKey(prev => prev + 1);
  };

  // Export Bound Book as ATF Audit CSV
  const handleExportCSV = () => {
    const headers = ['Line #', 'Status', 'Manufacturer', 'Importer', 'Model', 'Serial Number', 'Type', 'Caliber', 'Acq Date', 'Acq Source', 'Acq FFL', 'Disp Date', 'Disp Recipient', 'Disp FFL'];
    const rows = records.map(r => [
      r.lineNumber,
      r.status,
      `"${r.manufacturer}"`,
      `"${r.importer || ''}"`,
      `"${r.model}"`,
      `"${r.serialNumber}"`,
      `"${r.type}"`,
      `"${r.caliber}"`,
      r.acqDate,
      `"${r.acqName}"`,
      `"${r.acqFFL || ''}"`,
      r.dispDate || '',
      `"${r.dispName || ''}"`,
      `"${r.dispFFL || ''}"`
    ]);

    const csvString = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const fileName = `ATF_Bound_Book_Export_${new Date().toISOString().split('T')[0]}.csv`;
    saveFileWithNativePicker(csvString, fileName, 'ATF Bound Book CSV (.csv)', 'csv');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-amber-950">
      {/* Top Tactical Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shadow-xl">
        {/* Title Area */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-100">
                C&R Digital Logbook
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-medium">
                <CfrLink text="27 CFR § 478.125(f)" className="hover:text-emerald-300 transition-colors" />
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-sans">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> FFL Type 03 Collector • 100% Offline Local Storage
            </p>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex items-center flex-wrap gap-2 justify-end">
          <button 
            onClick={() => setIsCmdPaletteOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-2 py-1.5 rounded text-xs font-mono transition-colors"
            title={`Global Command Palette (${hotkeyLabel})`}
          >
            <Command className="w-3.5 h-3.5 text-amber-400" />
            <span>{hotkeyLabel}</span>
          </button>

          <button 
            onClick={() => setIsDashboardModalOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit Dashboard</span>
          </button>

          <button 
            onClick={() => setIsContactsModalOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>FFL Rolodex</span>
          </button>

          <button 
            onClick={() => setIsAuditViewerOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Audit Logs ({auditLogs.length})</span>
          </button>

          {/* Export Actions Group */}
          <div className="flex items-center border border-slate-700/80 rounded bg-slate-800/60 p-0.5 space-x-0.5">
            <button 
              onClick={() => setIsPDFOptionsOpen(true)}
              className="flex items-center space-x-1 px-2 py-1 text-slate-300 hover:text-slate-100 hover:bg-slate-700/80 rounded text-xs font-medium transition-colors"
              title="Printable ATF PDF"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print PDF</span>
            </button>
            <button 
              onClick={handleExportCSV}
              className="flex items-center space-x-1 px-2 py-1 text-slate-300 hover:text-slate-100 hover:bg-slate-700/80 rounded text-xs font-medium transition-colors"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>CSV</span>
            </button>
            <button 
              onClick={() => setIsVaultModalOpen(true)}
              className="flex items-center space-x-1 px-2 py-1 text-slate-300 hover:text-slate-100 hover:bg-slate-700/80 rounded text-xs font-medium transition-colors"
              title="Encrypted Vault (.crbk)"
            >
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span>Vault (.crbk)</span>
            </button>
          </div>

          <button 
            onClick={() => setIsAcqModalOpen(true)}
            className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold px-3 py-1.5 rounded text-xs transition-colors shadow-md shadow-amber-950/20 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Acquisition</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-6 flex items-center space-x-1">
        <button
          onClick={() => setActiveTab('boundbook')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'boundbook'
              ? 'border-amber-500 text-amber-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Bound Book (A&D)</span>
          <span className="ml-1 px-1.5 py-0.2 text-[11px] rounded bg-slate-800 text-slate-300 font-mono">
            {records.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'maintenance'
              ? 'border-amber-500 text-amber-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Maintenance History</span>
        </button>

        <button
          onClick={() => setActiveTab('range')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'range'
              ? 'border-amber-500 text-amber-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Range Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('reference')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'reference'
              ? 'border-amber-500 text-amber-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>ATF Master C&R Reference Library</span>
          <span className="ml-1 px-1.5 py-0.2 text-[11px] rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
            {crRecords.length.toLocaleString()} Items
          </span>
        </button>
      </div>

      {/* Main Dual-Pane Content Area */}
      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        {activeTab === 'boundbook' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* Left Pane: High-Density Bound Book Table (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Search & Filter Bar */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Manufacturer, Model, Serial #, or Caliber..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-mono"
                  />
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                      filterStatus === 'all'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({records.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('collection')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                      filterStatus === 'collection'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Collection ({records.filter(r => r.status === 'In Collection').length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('disposed')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                      filterStatus === 'disposed'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Disposed ({records.filter(r => r.status === 'Disposed').length})
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto max-h-[680px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">Line</th>
                        <th className="py-2.5 px-3">Manufacturer & Model</th>
                        <th className="py-2.5 px-3">Serial Number</th>
                        <th className="py-2.5 px-3">Caliber</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredRecords.map((r) => {
                        const isSelected = selectedRecordId === r.id;
                        return (
                          <tr 
                            key={r.id}
                            onClick={() => setSelectedRecordId(r.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-amber-500/10 border-l-2 border-l-amber-500' 
                                : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center text-slate-400 font-bold bg-slate-950/30">
                              #{r.lineNumber}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-100 font-sans flex items-center gap-1.5">
                                {r.manufacturer}
                                {r.crSection && (
                                  <span className="text-[9px] px-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded font-mono">
                                    C&R
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400 text-[11px] font-sans">{r.model}</div>
                            </td>
                            <td className="py-2.5 px-3 text-amber-400 font-bold">
                              {r.serialNumber}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300 font-sans">
                              {r.caliber}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {r.status === 'In Collection' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                  In Collection
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium bg-purple-500/10 border border-purple-500/30 text-purple-400">
                                  Disposed
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => setEditModalRecord(r)}
                                  title="Amend Entry (ATF Audit Logged)"
                                  className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {r.status === 'In Collection' && (
                                  <button
                                    onClick={() => setDispModalRecord(r)}
                                    title="Log Disposition (27 CFR 478.125 Lock)"
                                    className="p-1 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded transition-colors"
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Pane: Detailed Inspection & Provenance Drawer (5 Cols) */}
            <div className="lg:col-span-5">
              {selectedRecord ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-2xl sticky top-6">
                  {/* Header info */}
                  <div className="border-b border-slate-800 pb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 rounded">
                        Line #{selectedRecord.lineNumber}
                      </span>
                      {selectedRecord.isLocked ? (
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded text-[10px] flex items-center gap-1 font-mono">
                          <Lock className="w-3 h-3" /> ATF Compliance Locked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[10px] flex items-center gap-1 font-mono">
                          <ShieldCheck className="w-3 h-3" /> Active Bound Book Entry
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-100">
                        {selectedRecord.manufacturer} {selectedRecord.model}
                      </h2>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Serial #: <span className="text-amber-400 font-bold">{selectedRecord.serialNumber}</span> • Caliber: {selectedRecord.caliber}
                      </p>
                    </div>
                  </div>

                  {/* C&R Official Citation Badge */}
                  {matchedCRInfo ? (
                    <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-cyan-400 font-semibold text-[11px]">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Official ATF C&R Listed Item
                        </span>
                        <span className="font-mono">{matchedCRInfo.record_id}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] line-clamp-2">
                        {matchedCRInfo.atf_classification_details}
                      </p>
                    </div>
                  ) : selectedRecord.crSection && (
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span>Classified under <strong>{selectedRecord.crSection}</strong></span>
                    </div>
                  )}

                  {/* Specification Breakdown Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                    <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Type</span>
                      <span className="font-semibold text-slate-200">{selectedRecord.type}</span>
                    </div>
                    <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Importer</span>
                      <span className="font-semibold text-slate-200">{selectedRecord.importer || 'N/A (Domestic)'}</span>
                    </div>
                    <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Acq Date</span>
                      <span className="font-semibold text-slate-200 font-mono">{selectedRecord.acqDate}</span>
                    </div>
                    <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Acquisition Source</span>
                      <span className="font-semibold text-slate-200 truncate block" title={selectedRecord.acqName}>{selectedRecord.acqName}</span>
                    </div>
                  </div>

                  {/* Disposition Details (if disposed) */}
                  {selectedRecord.status === 'Disposed' && (
                    <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-lg text-xs space-y-1.5">
                      <div className="font-bold text-purple-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" /> Disposition Record (27 CFR § 478.125)
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-purple-200">
                        <div>Date: {selectedRecord.dispDate}</div>
                        <div>Recipient: {selectedRecord.dispName}</div>
                        {selectedRecord.dispFFL && <div className="col-span-2">FFL: {selectedRecord.dispFFL}</div>}
                      </div>
                    </div>
                  )}

                  {/* History Stats Bar */}
                  <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Maintenance Entries</span>
                      <span className="text-amber-400 font-bold text-sm">{selectedMaintenance.length}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-800"></div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Rounds Fired</span>
                      <span className="text-cyan-400 font-bold text-sm">{totalRoundsFired}</span>
                    </div>
                  </div>

                  {/* Quick Action Footer */}
                  <div className="pt-2 flex items-center space-x-2">
                    <button
                      onClick={() => setIsMediaModalOpen(true)}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      Proof Marks & Scans
                    </button>
                    <button
                      onClick={() => setEditModalRecord(selectedRecord)}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      Amend Entry
                    </button>
                    {selectedRecord.status === 'In Collection' && (
                      <button
                        onClick={() => setDispModalRecord(selectedRecord)}
                        className="flex-1 py-2 bg-purple-400 hover:bg-purple-300 text-purple-950 font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Log Disposition
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 space-y-2">
                  <BookOpen className="w-8 h-8 mx-auto text-slate-700" />
                  <div>Select a bound book entry from the table to inspect details.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: ATF C&R Reference Library View */}
        {activeTab === 'reference' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  ATF Master Curios & Relics Reference Library
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Complete offline database containing {crRecords.length.toLocaleString()} historical classification records extracted from ATF publications.
                  {crMetadata.isCustom && (
                    <span className="ml-1 text-cyan-400 font-semibold">
                      (Custom Imported CSV Active: {crMetadata.sourceFileName})
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full text-xs font-mono">
                  {crRecords.length.toLocaleString()} Records {crMetadata.isCustom ? 'Loaded (Custom)' : 'Pre-Loaded'}
                </span>

                <button
                  onClick={() => setIsImportCRModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-bold rounded-lg text-xs transition-colors shadow-md shadow-cyan-950/20 cursor-pointer"
                  title="Import updated ATF C&R CSV file"
                >
                  <Download className="w-3.5 h-3.5 rotate-180" />
                  <span>Import Updated CSV</span>
                </button>
              </div>
            </div>

            {/* Search and Section Filters */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Manufacturer (e.g. Colt, Mauser, Springfield), Model, or Details..."
                  value={crSearchQuery}
                  onChange={(e) => setCrSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
                />
              </div>

              <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto">
                <button
                  onClick={() => setCrSectionFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    crSectionFilter === 'all'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Sections
                </button>
                <button
                  onClick={() => setCrSectionFilter('Section II')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    crSectionFilter === 'Section II'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Section II (GCA)
                </button>
                <button
                  onClick={() => setCrSectionFilter('Section III')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    crSectionFilter === 'Section III'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Section III (NFA Exempt)
                </button>
                <button
                  onClick={() => setCrSectionFilter('Section IIIA')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    crSectionFilter === 'Section IIIA'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Section IIIA (Antique)
                </button>
                <button
                  onClick={() => setCrSectionFilter('Section IV')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    crSectionFilter === 'Section IV'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Section IV (NFA C&R)
                </button>
                <button
                  onClick={() => setCrSectionFilter('Section I')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    crSectionFilter === 'Section I'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Section I (Ammo)
                </button>
              </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
              {filteredCRLibrary.map((cr) => (
                <div key={cr.record_id} className="p-4 bg-slate-950 border border-slate-800/80 hover:border-cyan-500/40 rounded-xl space-y-2 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded text-xs font-bold">
                        {cr.record_id}
                      </span>
                      <span className="text-slate-300 font-sans font-bold text-sm">
                        {cr.manufacturer_or_make} {cr.model}
                      </span>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-full font-mono">
                      {cr.section_code}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {cr.atf_classification_details}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-900 font-mono">
                    <div>
                      Published: <span className="text-slate-300">{cr.latest_published_edition}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span>NFA Status: <strong className="text-amber-400">{cr.nfa_status}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Maintenance History View */}
        {activeTab === 'maintenance' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-4">
              <Wrench className="w-5 h-5 text-amber-400" />
              Maintenance & Gunsmithing Log
            </h2>

            {selectedRecord && (
              <form onSubmit={handleAddMaintenance} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4 text-xs">
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <span>Log Maintenance Event for:</span>
                  <span className="text-amber-400 font-mono font-bold">{selectedRecord.manufacturer} {selectedRecord.model} ({selectedRecord.serialNumber})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-300 mb-1">Type</label>
                    <select
                      value={newMaintType}
                      onChange={(e) => setNewMaintType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-100"
                    >
                      <option value="Cleaning">Cleaning</option>
                      <option value="Repair">Repair</option>
                      <option value="Part Replacement">Part Replacement</option>
                      <option value="Refinishing">Refinishing</option>
                      <option value="Gunsmith Inspection">Gunsmith Inspection</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newMaintCost}
                      onChange={(e) => setNewMaintCost(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Performed By</label>
                    <input
                      type="text"
                      placeholder="e.g. Self or Gunsmith Shop"
                      value={newMaintBy}
                      onChange={(e) => setNewMaintBy(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-100"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-slate-300 mb-1">Maintenance Notes & Work Completed *</label>
                    <input
                      type="text"
                      required
                      placeholder="Details of cleaning, parts replaced, headspace check..."
                      value={newMaintNotes}
                      onChange={(e) => setNewMaintNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded text-xs transition-colors"
                >
                  Save Maintenance Record
                </button>
              </form>
            )}

            {/* List */}
            <div className="space-y-3">
              {selectedMaintenance.map((m) => (
                <div key={m.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs font-sans">
                  <div className="flex items-center justify-between font-mono">
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded font-bold">
                      {m.type}
                    </span>
                    <span className="text-slate-400">{m.date}</span>
                  </div>
                  <div className="text-slate-200 mt-1">{m.notes}</div>
                  <div className="text-slate-400 text-[11px] font-mono flex items-center justify-between pt-1">
                    <span>Performed by: {m.performedBy}</span>
                    <span>Cost: ${m.cost.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Range Logs View */}
        {activeTab === 'range' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-4">
              <Target className="w-5 h-5 text-cyan-400" />
              Range Trip & Ammunition Round Counter
            </h2>

            {selectedRecord && (
              <form onSubmit={handleAddRangeLog} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4 text-xs">
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <span>Log Range Trip for:</span>
                  <span className="text-cyan-400 font-mono font-bold">{selectedRecord.manufacturer} {selectedRecord.model} ({selectedRecord.serialNumber})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-300 mb-1">Ammunition Type *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 7.62x54mmR S&B 180gr FMJ"
                      value={newRangeAmmo}
                      onChange={(e) => setNewRangeAmmo(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Rounds Fired *</label>
                    <input
                      type="number"
                      required
                      placeholder="40"
                      value={newRangeRounds}
                      onChange={(e) => setNewRangeRounds(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-slate-300 mb-1">Range Notes & Accuracy Remarks</label>
                    <input
                      type="text"
                      placeholder="Group size, sight adjustments, feeding performance..."
                      value={newRangeNotes}
                      onChange={(e) => setNewRangeNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-bold rounded text-xs transition-colors"
                >
                  Save Range Entry
                </button>
              </form>
            )}

            {/* List */}
            <div className="space-y-3">
              {selectedRange.map((r) => (
                <div key={r.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs font-sans">
                  <div className="flex items-center justify-between font-mono">
                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded font-bold">
                      {r.roundsFired} Rounds Fired
                    </span>
                    <span className="text-slate-400">{r.date}</span>
                  </div>
                  <div className="text-slate-200 mt-1">{r.notes}</div>
                  <div className="text-slate-400 text-[11px] font-mono pt-1">
                    Ammo: {r.ammoType}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className="bg-slate-950 border-t border-slate-800/80 px-6 py-2.5 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs flex items-center gap-1">
            <Tag className="w-3 h-3" /> v{APP_VERSION}
          </span>
          <button
            onClick={() => setIsSupportModalOpen(true)}
            className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-xs flex items-center gap-1 transition-colors"
            title="Open User Support & Assistance"
          >
            <HelpCircle className="w-3 h-3" /> Support
          </button>
          <span>•</span>
          <button 
            onClick={() => setIsVaultHealthOpen(true)}
            className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
            title="Click to run vault integrity diagnostics"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SQLite WAL Mode: Active (Click for Health Diagnostics)
          </button>
          <span>•</span>
          <span>ATF Audit Log: Active ({auditLogs.length} Events)</span>
        </div>
        <div className="font-mono text-slate-400 flex items-center gap-3">
          <span><CfrLink text="27 CFR § 478.125(f) Compliant" className="hover:text-slate-200 transition-colors" /></span>
          <span>•</span>
          <span>Offline Bound Book</span>
        </div>
      </footer>

      {/* Modal Components */}
      <NewAcquisitionModal
        isOpen={isAcqModalOpen}
        onClose={() => setIsAcqModalOpen(false)}
        onSave={handleSaveAcquisition}
        crRecords={crRecords}
      />

      <LogDispositionModal
        isOpen={!!dispModalRecord}
        record={dispModalRecord}
        onClose={() => setDispModalRecord(null)}
        onSave={handleSaveDisposition}
      />

      <EditRecordModal
        isOpen={!!editModalRecord}
        record={editModalRecord}
        onClose={() => setEditModalRecord(null)}
        onSave={handleSaveAmendment}
      />

      <AuditLogViewerModal
        isOpen={isAuditViewerOpen}
        logs={auditLogs}
        onClose={() => setIsAuditViewerOpen(false)}
      />

      <BackupVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        onRestoreSuccess={() => {
          setRecords(getBoundBookRecords());
          setAuditLogs(getAuditLogs());
        }}
      />

      <ContactsRolodexModal
        isOpen={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
      />

      <MediaGalleryModal
        isOpen={isMediaModalOpen}
        record={selectedRecord}
        onClose={() => setIsMediaModalOpen(false)}
      />

      <AuditDashboardModal
        isOpen={isDashboardModalOpen}
        records={records}
        auditLogs={auditLogs}
        onClose={() => setIsDashboardModalOpen(false)}
      />

      <CommandPaletteModal
        isOpen={isCmdPaletteOpen}
        records={records}
        onClose={() => setIsCmdPaletteOpen(false)}
        onSelectRecord={(id) => {
          setSelectedRecordId(id);
          setActiveTab('boundbook');
        }}
        onOpenAcq={() => setIsAcqModalOpen(true)}
        onOpenDashboard={() => setIsDashboardModalOpen(true)}
        onOpenRolodex={() => setIsContactsModalOpen(true)}
        onOpenAuditLogs={() => setIsAuditViewerOpen(true)}
        onOpenPDF={() => setIsPDFOptionsOpen(true)}
        onOpenVault={() => setIsVaultModalOpen(true)}
        onOpenImportCR={() => setIsImportCRModalOpen(true)}
      />

      <PDFExportDialogModal
        isOpen={isPDFOptionsOpen}
        records={records}
        onClose={() => setIsPDFOptionsOpen(false)}
      />

      <VaultHealthModal
        isOpen={isVaultHealthOpen}
        records={records}
        auditLogs={auditLogs}
        onClose={() => setIsVaultHealthOpen(false)}
      />

      <UserSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />

      <ImportCRCSVModal
        isOpen={isImportCRModalOpen}
        onClose={() => setIsImportCRModalOpen(false)}
        onImportSuccess={(newEntries, meta) => {
          setCrRecords(newEntries);
          setCrMetadata(meta);
        }}
        onResetSuccess={(defaultEntries, meta) => {
          setCrRecords(defaultEntries);
          setCrMetadata(meta);
        }}
      />
    </div>
  );
}

export default App;
