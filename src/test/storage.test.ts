import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getBoundBookRecords, 
  saveBoundBookRecords, 
  getAuditLogs, 
  logAuditEvent,
  getMaintenanceRecords,
  saveMaintenanceRecord,
  getRangeRecords,
  saveRangeRecord,
  getContacts,
  saveContact,
  getMediaAttachments,
  saveMediaAttachment
} from '../lib/storage';

describe('Storage Library (Bound Book & Audit Engine)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes default bound book records as empty array when localStorage is empty', () => {
    const records = getBoundBookRecords();
    expect(records).toEqual([]);
  });

  it('persists and retrieves updated bound book records', () => {
    const records = getBoundBookRecords();
    const updatedRecords = [
      ...records,
      {
        id: 'test-001',
        lineNumber: records.length + 1,
        status: 'In Collection' as const,
        manufacturer: 'Test Armory',
        model: 'Test Model',
        serialNumber: 'SN-99999',
        type: 'Rifle' as const,
        caliber: '7.62x54R',
        acqDate: '2026-08-06',
        acqName: 'Test Seller',
        isLocked: false,
        createdAt: '2026-08-06T10:00:00.000Z',
        updatedAt: '2026-08-06T10:00:00.000Z'
      }
    ];

    saveBoundBookRecords(updatedRecords);
    const retrieved = getBoundBookRecords();
    expect(retrieved.length).toBe(records.length + 1);
    expect(retrieved[retrieved.length - 1].serialNumber).toBe('SN-99999');
  });

  it('logs audit trail events and retrieves audit history', () => {
    const initialLogs = getAuditLogs();
    logAuditEvent({
      recordId: 'rec-001',
      fieldChanged: 'serialNumber',
      oldValue: 'OLD123',
      newValue: 'NEW123',
      reason: 'Typo correction'
    });

    const updatedLogs = getAuditLogs();
    expect(updatedLogs.length).toBe(initialLogs.length + 1);
    expect(updatedLogs[0].reason).toBe('Typo correction');
  });

  it('manages maintenance records correctly', () => {
    const maint = getMaintenanceRecords();
    expect(maint).toEqual([]);

    const newMaint = saveMaintenanceRecord({
      firearmId: 'firearm-001',
      date: '2026-08-06',
      type: 'Cleaning',
      cost: 15.0,
      performedBy: 'Self',
      notes: 'Cleaned barrel and bolt'
    });

    expect(newMaint.id).toBeDefined();
    const firearmMaint = getMaintenanceRecords('firearm-001');
    expect(firearmMaint.some(m => m.id === newMaint.id)).toBe(true);
  });

  it('manages range trip records correctly', () => {
    const range = getRangeRecords();
    expect(range).toEqual([]);

    const newRange = saveRangeRecord({
      firearmId: 'firearm-001',
      date: '2026-08-06',
      ammoType: 'Winchester 7.62x54R',
      roundsFired: 50,
      notes: 'Zeroing scope'
    });

    expect(newRange.id).toBeDefined();
    const firearmRange = getRangeRecords('firearm-001');
    expect(firearmRange.some(r => r.id === newRange.id)).toBe(true);
  });

  it('manages contacts rolodex correctly', () => {
    const contacts = getContacts();
    expect(contacts).toEqual([]);

    const newContact = saveContact({
      category: 'Dealer',
      name: 'MidwayUSA',
      email: 'support@midwayusa.com',
      phone: '800-243-3220',
      address: 'Columbia, MO'
    });

    expect(newContact.id).toBeDefined();
    const updatedContacts = getContacts();
    expect(updatedContacts.some(c => c.name === 'MidwayUSA')).toBe(true);
  });

  it('manages media attachments correctly', () => {
    const attachments = getMediaAttachments();
    expect(attachments.length).toBe(0);

    const newMedia = saveMediaAttachment({
      firearmId: 'firearm-001',
      title: 'Receiver Stamp',
      category: 'Proof Mark',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/png'
    });

    expect(newMedia.id).toBeDefined();
    const firearmMedia = getMediaAttachments('firearm-001');
    expect(firearmMedia.length).toBe(1);
  });
});
