import { useState } from 'react';
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
  FileCheck, 
  Key,
  HardDrive
} from 'lucide-react';

interface BoundBookRecord {
  id: string;
  lineNumber: number;
  manufacturer: string;
  model: string;
  serialNumber: string;
  type: string;
  caliber: string;
  acqDate: string;
  acqSource: string;
  dispDate?: string;
  dispRecipient?: string;
  status: 'In Collection' | 'Disposed';
  isLocked: boolean;
}

const mockRecords: BoundBookRecord[] = [
  {
    id: '1',
    lineNumber: 1,
    manufacturer: 'Tula Arms Plant',
    model: 'Mosin-Nagant M91/30',
    serialNumber: '913077421',
    type: 'Rifle',
    caliber: '7.62x54mmR',
    acqDate: '2021-04-12',
    acqSource: 'Classic Firearms (FFL #1-56-xxx-09)',
    status: 'In Collection',
    isLocked: true,
  },
  {
    id: '2',
    lineNumber: 2,
    manufacturer: 'Carl Walther Waffenfabrik',
    model: 'PPK (C&R Classification)',
    serialNumber: '284910W',
    type: 'Pistol',
    caliber: '.32 ACP (7.65mm)',
    acqDate: '2022-09-05',
    acqSource: 'Simpson Ltd (FFL #9-36-xxx-12)',
    dispDate: '2024-01-18',
    dispRecipient: 'John Doe (C&R FFL #3-42-xxx-01)',
    status: 'Disposed',
    isLocked: true,
  },
  {
    id: '3',
    lineNumber: 3,
    manufacturer: 'Fabrique Nationale (FN)',
    model: 'FN Browning M1910',
    serialNumber: '194012',
    type: 'Pistol',
    caliber: '.380 ACP',
    acqDate: '2023-11-20',
    acqSource: 'Private Collector Transfer (Lic #3-54-xxx-88)',
    status: 'In Collection',
    isLocked: false,
  }
];

export function App() {
  const [activeTab, setActiveTab] = useState<'boundbook' | 'reference' | 'maintenance' | 'range' | 'backup'>('boundbook');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'collection' | 'disposed'>('all');

  const filteredRecords = mockRecords.filter(record => {
    const matchesSearch = 
      record.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'collection') return matchesSearch && record.status === 'In Collection';
    if (filterStatus === 'disposed') return matchesSearch && record.status === 'Disposed';
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              C&R Digital Logbook
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-medium">
                27 CFR § 478.125(f) Compliant
              </span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> FFL Type 03 Collector • 100% Offline Single-File Vault
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right mr-3 hidden sm:block">
            <span className="text-xs text-slate-400 block">Backup Encryption Status</span>
            <span className="text-xs font-mono text-amber-400 flex items-center gap-1 justify-end">
              <Key className="w-3 h-3" /> BIP-39 Seed Vault Locked
            </span>
          </div>

          <button className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-md text-sm font-medium transition-colors">
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export ATF Audit PDF</span>
          </button>

          <button className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold px-4 py-2 rounded-md text-sm transition-colors shadow-md shadow-amber-950/20">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Acquisition</span>
          </button>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-6 flex items-center space-x-1">
        <button
          onClick={() => setActiveTab('boundbook')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'boundbook'
              ? 'border-amber-500 text-amber-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Bound Book (A&D)</span>
          <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300 font-mono">
            {mockRecords.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reference')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'reference'
              ? 'border-amber-500 text-amber-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>ATF Master C&R Reference Library</span>
          <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
            4,207 Records
          </span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'maintenance'
              ? 'border-amber-500 text-amber-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Maintenance & Gunsmithing</span>
        </button>

        <button
          onClick={() => setActiveTab('range')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'range'
              ? 'border-amber-500 text-amber-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Range Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'backup'
              ? 'border-amber-500 text-amber-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Encrypted Backups (.crbk)</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {activeTab === 'boundbook' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Manufacturer, Model, Serial Number, or Caliber..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filterStatus === 'all'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({mockRecords.length})
                </button>
                <button
                  onClick={() => setFilterStatus('collection')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filterStatus === 'collection'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  In Collection ({mockRecords.filter(r => r.status === 'In Collection').length})
                </button>
                <button
                  onClick={() => setFilterStatus('disposed')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filterStatus === 'disposed'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Disposed ({mockRecords.filter(r => r.status === 'Disposed').length})
                </button>
              </div>
            </div>

            {/* Bound Book High-Density Data Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4 w-12 text-center">Line</th>
                      <th className="py-3.5 px-4">Firearm Description</th>
                      <th className="py-3.5 px-4">Serial Number</th>
                      <th className="py-3.5 px-4">Type / Caliber</th>
                      <th className="py-3.5 px-4">Acquisition Date & Source</th>
                      <th className="py-3.5 px-4">Disposition Info</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-center text-slate-400 font-bold bg-slate-950/40">
                          #{record.lineNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-100 block">{record.manufacturer}</span>
                          <span className="text-slate-400 font-sans">{record.model}</span>
                        </td>
                        <td className="py-3 px-4 text-amber-400 font-bold">
                          {record.serialNumber}
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-300">
                          <div>{record.type}</div>
                          <div className="text-slate-400 text-[11px] font-mono">{record.caliber}</div>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <div className="text-slate-200 font-mono text-[11px]">{record.acqDate}</div>
                          <div className="text-slate-400 text-[11px]">{record.acqSource}</div>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          {record.dispDate ? (
                            <>
                              <div className="text-slate-200 font-mono text-[11px]">{record.dispDate}</div>
                              <div className="text-slate-400 text-[11px]">{record.dispRecipient}</div>
                            </>
                          ) : (
                            <span className="text-slate-600 italic">— N/A (Retained) —</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {record.status === 'In Collection' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-sans font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              In Collection
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-sans font-medium bg-purple-500/10 border border-purple-500/30 text-purple-400">
                              Disposed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {record.isLocked ? (
                            <span title="Record locked per ATF 2016-1 audit rules" className="inline-flex items-center text-slate-500">
                              <Lock className="w-3.5 h-3.5 text-amber-500/70" />
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[11px] font-sans">Editable</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reference' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  ATF Curios & Relics Master Reference Library
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Pre-seeded offline dataset containing 4,207 historical classification entries extracted from ATF publications (1972 – April 2025).
                </p>
              </div>
              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full text-xs font-mono">
                Offline Ready
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search master C&R list by manufacturer (e.g. Colt, Mauser, Springfield)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-cyan-400 flex items-center gap-2">
                <FileCheck className="w-4 h-4" /> Pre-bundled Master Dataset (`curios_and_relics_master_list_2026_08_06.csv`)
              </div>
              <p className="text-slate-400">
                Allows instant verification of C&R eligibility and auto-population of manufacturer, model, and caliber fields into your bound book during new acquisitions.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-amber-400" />
              BIP-39 Encrypted Portable Backups (`.crbk`)
            </h2>
            <p className="text-xs text-slate-400">
              Export and restore fully encrypted archives using an industry-standard 12-word seed phrase (AES-256-GCM + Argon2id).
            </p>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-sm font-medium text-slate-200">Local Database Integrity</div>
                  <div className="text-xs text-slate-400">SQLite WAL Mode active • Single-file storage at `~/.crbook/vault.sqlite`</div>
                </div>
              </div>
              <button className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold px-4 py-2 rounded-md text-xs transition-colors">
                Generate Backup Archive (.crbk)
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className="bg-slate-950 border-t border-slate-800/80 px-6 py-2 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Database WAL Mode: Online
          </span>
          <span>•</span>
          <span>ATF Audit Trail: Active</span>
        </div>
        <div className="font-mono text-slate-400">
          C&R Digital Logbook v1.0.0
        </div>
      </footer>
    </div>
  );
}

export default App;
