import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getBoundBookRecords, 
  getMaintenanceRecords,
  saveMaintenanceRecord,
  getRangeRecords,
  saveRangeRecord
} from '../lib/storage';

describe('Storage Library Advanced Coverage Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('verifies bound book records initialization', () => {
    const records = getBoundBookRecords();
    expect(records).toEqual([]);
  });

  it('handles invalid JSON in localStorage gracefully with fallback defaults', () => {
    localStorage.setItem('cr_logbook_bound_book_v1', 'INVALID_JSON{');
    localStorage.setItem('cr_logbook_audit_log_v1', 'INVALID_JSON{');
    localStorage.setItem('cr_logbook_maintenance_records_v1', 'INVALID_JSON{');
    localStorage.setItem('cr_logbook_range_records_v1', 'INVALID_JSON{');

    const records = getBoundBookRecords();
    expect(records).toEqual([]);
  });

  it('saves and filters range records for specific firearms', () => {
    saveRangeRecord({
      firearmId: 'firearm-001',
      date: '2026-08-06',
      ammoType: '7.62x54R',
      roundsFired: 100,
      notes: 'Test trip'
    });

    saveRangeRecord({
      firearmId: 'firearm-002',
      date: '2026-08-06',
      ammoType: '.30-06',
      roundsFired: 20,
      notes: 'Garand test'
    });

    const range1 = getRangeRecords('firearm-001');
    const range2 = getRangeRecords('firearm-002');
    expect(range1.length).toBeGreaterThan(0);
    expect(range2.length).toBeGreaterThan(0);
  });

  it('saves and filters maintenance records for specific firearms', () => {
    saveMaintenanceRecord({
      firearmId: 'firearm-001',
      date: '2026-08-06',
      type: 'Cleaning',
      cost: 10,
      performedBy: 'Self',
      notes: 'Routine'
    });

    const maint1 = getMaintenanceRecords('firearm-001');
    expect(maint1.length).toBeGreaterThan(0);
  });
});
