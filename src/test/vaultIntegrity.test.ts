import { describe, it, expect } from 'vitest';
import {
  checkLineNumberContinuity,
  checkDispositionLocks,
  checkAcquisitionFieldsComplete,
  checkAuditReasonsLogged,
  runComplianceChecks,
} from '../lib/vaultIntegrity';
import type { BoundBookRecord, AuditLogEntry } from '../types/logbook';

function makeRecord(overrides: Partial<BoundBookRecord> = {}): BoundBookRecord {
  return {
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
    updatedAt: '2021-04-12T00:00:00Z',
    ...overrides,
  };
}

describe('vaultIntegrity checks (real, data-derived — not fabricated status)', () => {
  describe('checkLineNumberContinuity', () => {
    it('passes on an empty bound book', () => {
      expect(checkLineNumberContinuity([])).toBe(true);
    });

    it('passes on sequential 1..N line numbers', () => {
      const records = [makeRecord({ id: 'a', lineNumber: 1 }), makeRecord({ id: 'b', lineNumber: 2 }), makeRecord({ id: 'c', lineNumber: 3 })];
      expect(checkLineNumberContinuity(records)).toBe(true);
    });

    it('fails when there is a gap in line numbers', () => {
      const records = [makeRecord({ id: 'a', lineNumber: 1 }), makeRecord({ id: 'b', lineNumber: 3 })];
      expect(checkLineNumberContinuity(records)).toBe(false);
    });
  });

  describe('checkDispositionLocks', () => {
    it('passes when there are no disposed records', () => {
      expect(checkDispositionLocks([makeRecord({ status: 'In Collection', isLocked: false })])).toBe(true);
    });

    it('passes when every disposed record is locked', () => {
      const records = [makeRecord({ status: 'Disposed', isLocked: true })];
      expect(checkDispositionLocks(records)).toBe(true);
    });

    it('fails when a disposed record is not locked', () => {
      const records = [makeRecord({ status: 'Disposed', isLocked: false })];
      expect(checkDispositionLocks(records)).toBe(false);
    });
  });

  describe('checkAcquisitionFieldsComplete', () => {
    it('passes when every record has acquisition date & source', () => {
      expect(checkAcquisitionFieldsComplete([makeRecord()])).toBe(true);
    });

    it('fails when a record is missing acqDate', () => {
      expect(checkAcquisitionFieldsComplete([makeRecord({ acqDate: '' })])).toBe(false);
    });

    it('fails when a record is missing acqName', () => {
      expect(checkAcquisitionFieldsComplete([makeRecord({ acqName: '   ' })])).toBe(false);
    });
  });

  describe('checkAuditReasonsLogged', () => {
    const baseEntry: AuditLogEntry = {
      id: 'log-1',
      recordId: 'rec-001',
      fieldChanged: 'caliber',
      oldValue: '.303',
      newValue: '.303 British',
      timestamp: '2021-05-01T00:00:00Z',
      reason: 'Corrected caliber notation',
    };

    it('passes when there are no audit log entries', () => {
      expect(checkAuditReasonsLogged([])).toBe(true);
    });

    it('passes when every entry has a reason', () => {
      expect(checkAuditReasonsLogged([baseEntry])).toBe(true);
    });

    it('fails when an entry has an empty reason', () => {
      expect(checkAuditReasonsLogged([{ ...baseEntry, reason: '' }])).toBe(false);
    });
  });

  describe('runComplianceChecks', () => {
    it('reports all four checks passing for clean data', () => {
      const results = runComplianceChecks([makeRecord()], []);
      expect(results).toHaveLength(4);
      expect(results.every(r => r.pass)).toBe(true);
    });

    it('reports a failing check when data is non-compliant', () => {
      const badRecord = makeRecord({ status: 'Disposed', isLocked: false });
      const results = runComplianceChecks([badRecord], []);
      const lockCheck = results.find(r => r.id === 'disposition-lock');
      expect(lockCheck?.pass).toBe(false);
      expect(results.some(r => !r.pass)).toBe(true);
    });
  });
});
