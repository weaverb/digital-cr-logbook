import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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

  it('CommandPaletteModal search input has a visible focus-ring treatment', () => {
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
    const input = screen.getByPlaceholderText(/Type a command or search firearms/i);
    expect(input.className).toMatch(/focus:ring-2/);
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

  it('EditRecordModal shows an inline error banner instead of alert() when audit reason is missing', () => {
    const onSave = vi.fn();
    render(
      <EditRecordModal
        isOpen={true}
        onClose={vi.fn()}
        record={mockRecord}
        onSave={onSave}
      />
    );
    // Whitespace-only satisfies the native `required` attribute but fails
    // the component's own .trim() check, which is what surfaces the banner.
    fireEvent.change(screen.getByPlaceholderText(/Corrected typo in serial number/i), { target: { value: '   ' } });
    fireEvent.click(screen.getByText(/Save Amendment & Log Audit Event/i));
    expect(screen.getByText(/Audit Reason Required/i)).toBeInTheDocument();
    expect(screen.getByText(/mandatory reason for amending bound book entries/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('EditRecordModal close button has an accessible label', () => {
    render(
      <EditRecordModal
        isOpen={true}
        onClose={vi.fn()}
        record={mockRecord}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
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

  it('LogDispositionModal shows an inline error banner instead of alert() when required fields are missing', () => {
    const onSave = vi.fn();
    render(
      <LogDispositionModal
        isOpen={true}
        onClose={vi.fn()}
        record={mockRecord}
        onSave={onSave}
      />
    );
    // Whitespace-only satisfies the native `required` attribute but fails
    // the component's own .trim() check, which is what surfaces the banner.
    fireEvent.change(screen.getByPlaceholderText(/John Smith or Dealer Name/i), { target: { value: '   ' } });
    fireEvent.click(screen.getByText(/Confirm & Lock Disposition Record/i));
    expect(screen.getByText(/Missing Required Fields/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
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

  it('NewAcquisitionModal shows an inline error banner instead of alert() when mandatory fields are missing', () => {
    const onSave = vi.fn();
    render(
      <NewAcquisitionModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );
    // Caliber isn't part of the component's own trim() validation, but it is
    // marked `required` at the HTML level, so it needs a real value or the
    // browser's native constraint validation would block submission before
    // our handler (and therefore the banner) ever runs. Manufacturer/Model/
    // Serial/Transferor Name are left whitespace-only: that satisfies the
    // native `required` attribute but still fails the component's .trim()
    // check, which is what surfaces the banner.
    fireEvent.change(screen.getByPlaceholderText(/Tula Arms Plant/i), { target: { value: '   ' } });
    fireEvent.change(screen.getByPlaceholderText(/M91\/30/i), { target: { value: '   ' } });
    fireEvent.change(screen.getByPlaceholderText(/913077421/i), { target: { value: '   ' } });
    fireEvent.change(screen.getByPlaceholderText(/7\.62x54mmR/i), { target: { value: '7.62x54mmR' } });
    fireEvent.change(screen.getByPlaceholderText(/Classic Firearms or John Smith/i), { target: { value: '   ' } });
    fireEvent.click(screen.getByText(/Save Bound Book Acquisition Record/i));
    expect(screen.getByText(/Missing Required Fields/i)).toBeInTheDocument();
    expect(screen.getByText(/mandatory ATF bound book fields/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('NewAcquisitionModal C&R search input has a visible focus-ring treatment', () => {
    render(
      <NewAcquisitionModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText(/Search 4,207 pre-loaded ATF C&R entries/i));
    const input = screen.getByPlaceholderText(/Search by Manufacturer, Model, or Details/i);
    expect(input.className).toMatch(/focus:ring-2/);
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
    expect(screen.getByText(/Vault Integrity & Database Diagnostics/i)).toBeInTheDocument();
  });
});
