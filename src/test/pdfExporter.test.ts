import { describe, it, expect } from 'vitest';
import { generateBoundBookPDF } from '../lib/pdfExporter';
import type { BoundBookRecord } from '../types/logbook';

describe('PDF Bound Book Exporter Subsystem', () => {
  it('generates landscape 27 CFR § 478.125(f) PDF without errors', () => {
    const mockRecords: BoundBookRecord[] = [
      {
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
      }
    ];

    expect(() => {
      generateBoundBookPDF(mockRecords, {
        collectorName: 'John Doe',
        fflNumber: '9-99-999-03-9X-99999'
      });
    }).not.toThrow();
  });
});
