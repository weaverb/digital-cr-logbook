import { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Mail, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Camera,
  Info
} from 'lucide-react';
import { APP_VERSION } from '../lib/version';
import { useEscapeKey } from '../hooks/useEscapeKey';

function GithubIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}

interface UserSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSupportModal({ isOpen, onClose }: UserSupportModalProps) {
  useEscapeKey(onClose, isOpen);

  const [copiedSysInfo, setCopiedSysInfo] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen) return null;

  const supportEmail = 'cr-logbook-support.vocalist722@passmail.net';
  const githubIssueUrl = 'https://github.com/weaverb/digital-cr-logbook/issues/new?template=support_request.yml';

  const userAgentString = typeof window !== 'undefined' && window.navigator ? window.navigator.userAgent : 'Desktop Client';

  const systemDetailsText = `C&R Collector Digital Logbook Version: v${APP_VERSION}
Environment / OS: ${userAgentString}
Timestamp: ${new Date().toISOString()}`;

  const handleCopySysInfo = () => {
    navigator.clipboard.writeText(systemDetailsText);
    setCopiedSysInfo(true);
    setTimeout(() => setCopiedSysInfo(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-gunmetal-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-100 selection:bg-amber-500 selection:text-amber-950"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                User Support & Assistance
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs">
                  v{APP_VERSION}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Need help or encountered a bug? Choose your preferred contact method below.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 100% Privacy Assurance Banner */}
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-start space-x-3 text-xs text-emerald-200/90 leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-emerald-300 font-semibold block mb-0.5">100% Offline & Privacy-First Architecture</strong>
            To protect collector privacy, this application contains <strong>zero remote tracking, zero telemetry, and zero automatic background submissions</strong>. Support requests are submitted manually by you.
          </div>
        </div>

        {/* Dedicated System & Diagnostic Information Section */}
        <div className="p-5 bg-gunmetal-950 border border-slate-800 rounded-2xl space-y-3.5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">System & Diagnostic Information</h3>
                <p className="text-xs text-slate-400">Copy this details block to include with either GitHub Issue or Email support.</p>
              </div>
            </div>
            <button
              onClick={handleCopySysInfo}
              className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-cyan-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shrink-0"
              title="Copy system details to clipboard"
            >
              {copiedSysInfo ? <Check className="w-4 h-4 text-cyan-950" /> : <Copy className="w-4 h-4 text-cyan-950" />}
              {copiedSysInfo ? 'Copied to Clipboard!' : 'Copy System Info'}
            </button>
          </div>

          {/* Live Data Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Exact System Info to be Copied:</span>
              <span className="text-emerald-400 font-sans">✓ No serial numbers or logbook records included</span>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto selection:bg-slate-700 selection:text-slate-100">
{systemDetailsText}
            </pre>
          </div>
        </div>

        {/* Support Option 1: GitHub Issue */}
        <div className="p-5 bg-gunmetal-950 border border-slate-800 rounded-2xl space-y-4 shadow-lg hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
                <GithubIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Option 1: Submit a GitHub Issue (Recommended)</h3>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full">
              Bug Reports & Feature Requests
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Submit a structured issue on our official GitHub repository. Paste your copied system info, describe the issue, and attach screenshots.
          </p>

          <div className="flex items-center justify-end pt-1">
            <a
              href={githubIssueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
            >
              <ExternalLink className="w-4 h-4" /> Open GitHub Issue Form
            </a>
          </div>
        </div>

        {/* Support Option 2: Email Support */}
        <div className="p-5 bg-gunmetal-950 border border-slate-800 rounded-2xl space-y-4 shadow-lg hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Option 2: Direct Email Support</h3>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full">
              Direct Contact
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Send an email directly to the project maintainer. Please include your app version (<strong>v{APP_VERSION}</strong>), steps to reproduce, and attach screenshots if applicable.
          </p>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono text-amber-300">
            <span className="truncate">{supportEmail}</span>
            <button
              onClick={handleCopyEmail}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 font-sans text-xs flex items-center gap-1 transition-colors shrink-0 ml-2"
              title="Copy email address"
            >
              {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              {copiedEmail ? 'Copied' : 'Copy Email'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Attaching screenshots to your email is greatly appreciated!</span>
            </div>
            <a
              href={`mailto:${supportEmail}?subject=C%26R%20Logbook%20Support%20Request%20%5Bv${APP_VERSION}%5D`}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Mail className="w-4 h-4" /> Open Email Client
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
