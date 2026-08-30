import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { BackupVaultModal } from '../components/BackupVaultModal';
import { createEncryptedVaultArchive, generate12WordSeed } from '../lib/cryptoVault';
import { getBoundBookRecords, saveBoundBookRecords } from '../lib/storage';
import type { BoundBookRecord } from '../types/logbook';

const existingRecord: BoundBookRecord = {
  id: 'rec-existing',
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
  updatedAt: '2021-04-12T00:00:00Z',
};

async function buildValidCrbkFile(): Promise<{ file: File; seedPhrase: string }> {
  const seed = generate12WordSeed();
  const blob = await createEncryptedVaultArchive(
    {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      boundBookRecords: [],
      auditLogs: [],
      maintenanceRecords: [],
      rangeRecords: [],
    },
    seed
  );
  const file = new File([blob], 'test-vault.crbk', { type: 'application/octet-stream' });
  return { file, seedPhrase: seed.join(' ') };
}

async function fillAndSubmitRestoreForm(container: HTMLElement, file: File, seedPhrase: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Restore from Backup' }));

  const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
  Object.defineProperty(fileInput, 'files', { value: [file] });
  fireEvent.change(fileInput);

  const textarea = screen.getByPlaceholderText(/Enter all 12 words separated by spaces/i);
  fireEvent.change(textarea, { target: { value: seedPhrase } });

  fireEvent.click(screen.getByRole('button', { name: /Decrypt & Load Vault Data/i }));
}

describe('BackupVaultModal restore flow (confirmation gate before overwrite)', () => {
  beforeEach(() => {
    localStorage.clear();
    saveBoundBookRecords([existingRecord]);
  });

  it('does not overwrite any data until the user explicitly confirms the restore', async () => {
    const onRestoreSuccess = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <BackupVaultModal isOpen={true} onClose={onClose} onRestoreSuccess={onRestoreSuccess} />
    );

    const { file, seedPhrase } = await buildValidCrbkFile();
    await fillAndSubmitRestoreForm(container, file, seedPhrase);

    // A confirmation screen must appear before anything is written
    await waitFor(() => {
      expect(screen.getByText('Confirm Restore — This Cannot Be Undone')).toBeInTheDocument();
    });
    expect(screen.getByText('Current Data (Will Be Replaced)')).toBeInTheDocument();
    expect(screen.getByText(/Incoming Backup/)).toBeInTheDocument();

    // Nothing has been written to storage, and neither callback has fired
    expect(getBoundBookRecords()).toEqual([existingRecord]);
    expect(onRestoreSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('cancelling the confirmation screen leaves current data untouched', async () => {
    const { container } = render(
      <BackupVaultModal isOpen={true} onClose={vi.fn()} onRestoreSuccess={vi.fn()} />
    );

    const { file, seedPhrase } = await buildValidCrbkFile();
    await fillAndSubmitRestoreForm(container, file, seedPhrase);

    await waitFor(() => {
      expect(screen.getByText('Confirm Restore — This Cannot Be Undone')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('Confirm Restore — This Cannot Be Undone')).not.toBeInTheDocument();
    expect(getBoundBookRecords()).toEqual([existingRecord]);
  });

  it('confirming the restore overwrites data and notifies the caller', async () => {
    const onRestoreSuccess = vi.fn();
    const onClose = vi.fn();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { container } = render(
      <BackupVaultModal isOpen={true} onClose={onClose} onRestoreSuccess={onRestoreSuccess} />
    );

    const { file, seedPhrase } = await buildValidCrbkFile();
    await fillAndSubmitRestoreForm(container, file, seedPhrase);

    await waitFor(() => {
      expect(screen.getByText('Confirm Restore — This Cannot Be Undone')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Confirm & Overwrite Current Data/i }));

    expect(onRestoreSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    // The mocked decrypt path resolves to an empty bound book — confirming should have applied it
    expect(getBoundBookRecords()).toEqual([]);

    alertSpy.mockRestore();
  });

  it('keeps the existing decrypt-error path intact for an invalid backup file', async () => {
    const { container } = render(
      <BackupVaultModal isOpen={true} onClose={vi.fn()} onRestoreSuccess={vi.fn()} />
    );

    const badFile = new File(['not a valid crbk archive'], 'bad.crbk', { type: 'application/octet-stream' });
    await fillAndSubmitRestoreForm(container, badFile, generate12WordSeed().join(' '));

    await waitFor(() => {
      expect(
        screen.getByText(/Decryption failed: Invalid 12-word seed phrase or corrupted backup archive/i)
      ).toBeInTheDocument();
    });

    // No confirmation screen, and current data is untouched
    expect(screen.queryByText('Confirm Restore — This Cannot Be Undone')).not.toBeInTheDocument();
    expect(getBoundBookRecords()).toEqual([existingRecord]);
  });
});
