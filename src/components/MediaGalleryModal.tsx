import { useState } from 'react';
import { X, Image as ImageIcon, Plus } from 'lucide-react';
import type { BoundBookRecord, MediaAttachment } from '../types/logbook';
import { getMediaAttachments, saveMediaAttachment } from '../lib/storage';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface MediaGalleryModalProps {
  isOpen: boolean;
  record: BoundBookRecord | null;
  onClose: () => void;
}

export function MediaGalleryModal({ isOpen, record, onClose }: MediaGalleryModalProps) {
  useEscapeKey(onClose, isOpen && !!record);
  const [, setAttachments] = useState<MediaAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MediaAttachment['category']>('Proof Mark');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen || !record) return null;

  // Load attachments for selected firearm
  const firearmAttachments = getMediaAttachments(record.id);

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      saveMediaAttachment({
        firearmId: record.id,
        title: title.trim(),
        category,
        dataUrl,
        mimeType: selectedFile.type || 'image/jpeg'
      });

      setAttachments(getMediaAttachments(record.id));
      setIsUploading(false);
      setTitle('');
      setSelectedFile(null);
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-500" />
              Proof Mark & Provenance Photo Gallery
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

        {/* Toolbar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Attached Files: {firearmAttachments.length}
          </span>
          <button
            onClick={() => setIsUploading(!isUploading)}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded text-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isUploading ? 'Cancel Upload' : 'Upload Proof / Provenance Photo'}</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {isUploading && (
            <form onSubmit={handleFileUpload} className="p-4 bg-slate-950 border border-amber-500/40 rounded-lg space-y-3">
              <div className="font-bold text-amber-400">Upload Photo or Document Scan</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Title / Description *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Receiver Proof Stamp 1941"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                  >
                    <option value="Proof Mark">Proof Mark</option>
                    <option value="Serial Number">Serial Number</option>
                    <option value="Provenance Document">Provenance Document</option>
                    <option value="Receipt">Receipt / Bill of Sale</option>
                    <option value="General Photo">General Photo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Select File (Image/Scan) *</label>
                  <input
                    type="file"
                    required
                    accept="image/*,.pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-[11px]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded text-xs transition-colors"
                >
                  Save Photo Attachment
                </button>
              </div>
            </form>
          )}

          {firearmAttachments.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <ImageIcon className="w-8 h-8 mx-auto text-slate-700" />
              <div className="text-sm font-medium">No Photos or Scans Attached</div>
              <div className="text-xs">Upload high-res receiver proof marks, serial numbers, or CMP certificates.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {firearmAttachments.map((att) => (
                <div key={att.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 overflow-hidden">
                  <div className="aspect-video bg-slate-900 rounded overflow-hidden flex items-center justify-center border border-slate-800/80">
                    <img src={att.dataUrl} alt={att.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200 text-xs truncate" title={att.title}>{att.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded">{att.category}</span>
                      <span>{new Date(att.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
