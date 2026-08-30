import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AuditDashboardModal } from '../components/AuditDashboardModal';
import { AuditLogViewerModal } from '../components/AuditLogViewerModal';
import { BackupVaultModal } from '../components/BackupVaultModal';
import { CommandPaletteModal } from '../components/CommandPaletteModal';
import { ContactsRolodexModal } from '../components/ContactsRolodexModal';
import { EditRecordModal } from '../components/EditRecordModal';
import { LogDispositionModal } from '../components/LogDispositionModal';
import { MediaGalleryModal } from '../components/MediaGalleryModal';
import { NewAcquisitionModal } from '../components/NewAcquisitionModal';
import { PDFExportDialogModal } from '../components/PDFExportDialogModal';
import { VaultHealthModal } from '../components/VaultHealthModal';

import type { BoundBookRecord } from '../types/logbook';

const mockRecord: BoundBookRecord = {
  id: 'rec-001',
  lineNumber: 1,
  status: 'In Collection',
  manufacturer: 'Tula Arms Plant',
  model: 'Mosin-Nagant M91/30',
  serialNumber: '913077421',
  type: 'Rifle',
  caliber: '7.62x54mmR',
  acqDate: '2021-04-12',
  acqName: 'Classic Firearms',
  isLocked: false,
  createdAt: '2021-04-12T00:00:00Z',
  updatedAt: '2021-04-12T00:00:00Z'
};

describe('Modals & Tactical UI Dialogs', () => {
  it('renders AuditDashboardModal when open', () => {
    render(
      <AuditDashboardModal
        isOpen={true}
        onClose={vi.fn()}
        records={[mockRecord]}
        auditLogs={[]}
      />
    );
    expect(screen.getByText(/ATF Bound Book & Compliance Audit Dashboard/i)).toBeInTheDocument();
  });

  it('renders AuditLogViewerModal when open', () => {
    render(
      <AuditLogViewerModal
        isOpen={true}
        onClose={vi.fn()}
        logs={[]}
      />
    );
    expect(screen.getByText(/ATF Compliance Audit Log/i)).toBeInTheDocument();
  });

  it('renders BackupVaultModal when open', () => {
    render(
      <BackupVaultModal
        isOpen={true}
        onClose={vi.fn()}
        onRestoreSuccess={vi.fn()}
      />
    );
    expect(screen.getByText(/BIP-39 Encrypted Backup & Restore Vault/i)).toBeInTheDocument();
  });

  it('renders CommandPaletteModal when open', () => {
    render(
      <CommandPaletteModal
        isOpen={true}
        onClose={vi.fn()}
        records={[mockRecord]}
        onSelectRecord={vi.fn()}
        onOpenAcq={vi.fn()}
        onOpenDashboard={vi.fn()}
        onOpenRolodex={vi.fn()}
        onOpenAuditLogs={vi.fn()}
        onOpenPDF={vi.fn()}
        onOpenVault={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText(/Type a command or search firearms/i)).toBeInTheDocument();
  });

  it('renders ContactsRolodexModal when open', () => {
    render(
      <ContactsRolodexModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/FFL Contacts & Transferee Rolodex/i)).toBeInTheDocument();
  });

  it('renders EditRecordModal when open', () => {
    render(
      <EditRecordModal
        isOpen={true}
        onClose={vi.fn()}
        record={mockRecord}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByText(/Amend Bound Book Entry/i)).toBeInTheDocument();
  });

  it('renders LogDispositionModal when open', () => {
    render(
      <LogDispositionModal
        isOpen={true}
        onClose={vi.fn()}
        record={mockRecord}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByText(/Log Firearm Disposition/i)).toBeInTheDocument();
  });

  it('renders MediaGalleryModal when open', () => {
    render(
      <MediaGalleryModal
        isOpen={true}
        onClose={vi.fn()}
        record={mockRecord}
      />
    );
    expect(screen.getByText(/Proof Marks/i)).toBeInTheDocument();
  });

  it('renders NewAcquisitionModal when open', () => {
    render(
      <NewAcquisitionModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByText(/Record Firearm Acquisition/i)).toBeInTheDocument();
  });

  it('renders PDFExportDialogModal when open', () => {
    render(
      <PDFExportDialogModal
        isOpen={true}
        onClose={vi.fn()}
        records={[mockRecord]}
      />
    );
    expect(screen.getByText(/Generate ATF Printable Bound Book PDF/i)).toBeInTheDocument();
  });

  it('renders VaultHealthModal when open', () => {
    render(
      <VaultHealthModal
        isOpen={true}
        onClose={vi.fn()}
        records={[mockRecord]}
        auditLogs={[]}
      />
    );
    expect(screen.getByText(/Vault Integrity & Data Diagnostics/i)).toBeInTheDocument();
  });
});
