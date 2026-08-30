import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AuditDashboardModal } from '../components/AuditDashboardModal';
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

describe('AuditDashboardModal compliance scorecard (reflects real record data)', () => {
  it('shows 100% PASS and "Inspection Ready" when all checks pass', () => {
    render(
      <AuditDashboardModal
        isOpen={true}
        onClose={vi.fn()}
        records={[makeRecord()]}
        auditLogs={[]}
      />
    );

    expect(screen.getByText(/Compliance Scorecard: 100% PASS/i)).toBeInTheDocument();
    expect(screen.getByText('Inspection Ready')).toBeInTheDocument();
    expect(screen.getByText(/Logbook Vault Status: Normal \(Local Storage\)/i)).toBeInTheDocument();
  });

  it('shows a reduced score and "Review Needed" when a disposed record is not locked', () => {
    const badRecord = makeRecord({ status: 'Disposed', isLocked: false });

    render(
      <AuditDashboardModal
        isOpen={true}
        onClose={vi.fn()}
        records={[badRecord]}
        auditLogs={[]}
      />
    );

    expect(screen.queryByText(/Compliance Scorecard: 100% PASS/i)).not.toBeInTheDocument();
    expect(screen.getByText('Review Needed')).toBeInTheDocument();
    expect(screen.getByText(/Logbook Vault Status: Review Needed \(Local Storage\)/i)).toBeInTheDocument();
  });

  it('shows a reduced score when an audit log entry is missing its required reason', () => {
    const emptyReasonLog: AuditLogEntry = {
      id: 'log-1',
      recordId: 'rec-001',
      fieldChanged: 'caliber',
      oldValue: '.303',
      newValue: '.303 British',
      timestamp: '2021-05-01T00:00:00Z',
      reason: '',
    };

    render(
      <AuditDashboardModal
        isOpen={true}
        onClose={vi.fn()}
        records={[makeRecord()]}
        auditLogs={[emptyReasonLog]}
      />
    );

    expect(screen.queryByText(/Compliance Scorecard: 100% PASS/i)).not.toBeInTheDocument();
    expect(screen.getByText('Review Needed')).toBeInTheDocument();
  });

  it('does not claim SQLite or WAL mode anywhere in the dashboard', () => {
    render(
      <AuditDashboardModal
        isOpen={true}
        onClose={vi.fn()}
        records={[makeRecord()]}
        auditLogs={[]}
      />
    );

    expect(screen.queryByText(/SQLite/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/WAL Mode/i)).not.toBeInTheDocument();
  });
});
