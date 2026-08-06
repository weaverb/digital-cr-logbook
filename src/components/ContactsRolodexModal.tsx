import { useState } from 'react';
import { X, Users, Plus, Building2, Phone, Mail, MapPin, Copy, Check } from 'lucide-react';
import type { Contact } from '../types/logbook';
import { getContacts, saveContact } from '../lib/storage';

interface ContactsRolodexModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactsRolodexModal({ isOpen, onClose }: ContactsRolodexModalProps) {
  const [contacts, setContacts] = useState<Contact[]>(getContacts());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Contact Form State
  const [category, setCategory] = useState<Contact['category']>('Dealer');
  const [name, setName] = useState('');
  const [fflNumber, setFflNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleCopyFFL = (contactId: string, ffl?: string) => {
    if (!ffl) return;
    navigator.clipboard.writeText(ffl);
    setCopiedId(contactId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const created = saveContact({
      category,
      name: name.trim(),
      fflNumber: fflNumber.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined
    });

    setContacts([created, ...contacts]);
    setIsAddingNew(false);
    setName('');
    setFflNumber('');
    setEmail('');
    setPhone('');
    setAddress('');
    setNotes('');
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.fflNumber && c.fflNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              FFL Contacts & Transferee Rolodex
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Directory of FFL Dealers, Manufacturers, Gunsmiths, and Licensees for quick bound book logging.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Search contacts by Name, FFL #, or Address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-mono"
          />

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded text-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingNew ? 'Cancel New Contact' : 'Add New Contact'}</span>
          </button>
        </div>

        {/* Form or List Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {isAddingNew && (
            <form onSubmit={handleAddSubmit} className="p-4 bg-slate-950 border border-amber-500/40 rounded-lg space-y-3">
              <div className="font-bold text-amber-400">Add New Contact to Rolodex</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                  >
                    <option value="Dealer">Dealer</option>
                    <option value="Manufacturer">Manufacturer</option>
                    <option value="Gunsmith">Gunsmith</option>
                    <option value="Collector">Collector</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Name / Business *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Simpson Ltd"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">FFL License #</label>
                  <input
                    type="text"
                    value={fflNumber}
                    onChange={(e) => setFflNumber(e.target.value)}
                    placeholder="e.g. 9-36-xxx-12"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@dealer.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="City, State, ZIP"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded text-xs transition-colors"
                >
                  Save Contact
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredContacts.map((c) => (
              <div key={c.id} className="p-4 bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl space-y-2 font-sans">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    {c.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-full font-mono">
                    {c.category}
                  </span>
                </div>

                {c.fflNumber && (
                  <div className="p-1.5 bg-slate-900 border border-slate-800 rounded flex items-center justify-between text-[11px] font-mono">
                    <span className="text-amber-400 font-bold">FFL: {c.fflNumber}</span>
                    <button
                      onClick={() => handleCopyFFL(c.id, c.fflNumber)}
                      className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Copy FFL Number"
                    >
                      {copiedId === c.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}

                <div className="space-y-1 text-[11px] text-slate-400">
                  {c.address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{c.address}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{c.email}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
