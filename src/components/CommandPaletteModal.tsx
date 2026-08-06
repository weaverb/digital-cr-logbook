import { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  BookOpen, 
  ShieldCheck, 
  Users, 
  Download, 
  HardDrive, 
  History,
  Command
} from 'lucide-react';
import type { BoundBookRecord } from '../types/logbook';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { hotkeyLabel } from '../lib/osHelper';

interface CommandPaletteModalProps {
  isOpen: boolean;
  records: BoundBookRecord[];
  onClose: () => void;
  onSelectRecord: (recordId: string) => void;
  onOpenAcq: () => void;
  onOpenDashboard: () => void;
  onOpenRolodex: () => void;
  onOpenAuditLogs: () => void;
  onOpenPDF: () => void;
  onOpenVault: () => void;
}

export function CommandPaletteModal({
  isOpen,
  records,
  onClose,
  onSelectRecord,
  onOpenAcq,
  onOpenDashboard,
  onOpenRolodex,
  onOpenAuditLogs,
  onOpenPDF,
  onOpenVault
}: CommandPaletteModalProps) {
  useEscapeKey(onClose, isOpen);
  const [query, setQuery] = useState('');

  const actionCommands = [
    { id: 'act-acq', title: 'Record New Firearm Acquisition', icon: Plus, category: 'Action', action: onOpenAcq },
    { id: 'act-dash', title: 'Open Compliance Audit Dashboard', icon: ShieldCheck, category: 'Action', action: onOpenDashboard },
    { id: 'act-rolodex', title: 'Open FFL Contacts & Transferee Rolodex', icon: Users, category: 'Action', action: onOpenRolodex },
    { id: 'act-logs', title: 'View ATF Audit Trail History', icon: History, category: 'Action', action: onOpenAuditLogs },
    { id: 'act-pdf', title: 'Generate Printable ATF Bound Book PDF', icon: Download, category: 'Action', action: onOpenPDF },
    { id: 'act-vault', title: 'Open Encrypted BIP-39 Vault (.crbk)', icon: HardDrive, category: 'Action', action: onOpenVault }
  ];

  const recordResults = useMemo(() => {
    if (!query.trim()) return records.slice(0, 5);
    const q = query.toLowerCase();
    return records.filter(r => 
      r.manufacturer.toLowerCase().includes(q) ||
      r.model.toLowerCase().includes(q) ||
      r.serialNumber.toLowerCase().includes(q) ||
      r.caliber.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query, records]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/60">
          <Search className="w-4 h-4 text-amber-500 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search firearms by Manufacturer, Serial #..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-xs focus:outline-none font-mono"
            autoFocus
          />
          <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="p-3 max-h-[60vh] overflow-y-auto space-y-4 text-xs">
          {/* Quick Actions Section */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase px-2 font-mono">
              Quick Actions
            </div>
            {actionCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  className="w-full p-2.5 hover:bg-slate-800/80 rounded-lg text-left text-slate-200 flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-slate-200">{cmd.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Command</span>
                </button>
              );
            })}
          </div>

          {/* Bound Book Records Search Section */}
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-500 uppercase px-2 font-mono flex items-center justify-between">
              <span>Bound Book Firearms</span>
              <span>{recordResults.length} Matches</span>
            </div>
            {recordResults.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  onSelectRecord(r.id);
                  onClose();
                }}
                className="w-full p-2.5 hover:bg-slate-800/80 rounded-lg text-left flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-bold text-slate-100">{r.manufacturer} {r.model}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Line #{r.lineNumber} • Serial: <span className="text-amber-400 font-bold">{r.serialNumber}</span>
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded text-[10px] font-mono">
                  {r.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3 text-slate-400" /> Global Palette Active ({hotkeyLabel})
          </span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
}
