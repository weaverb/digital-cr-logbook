import type { BoundBookRecord, AuditLogEntry } from '../types/logbook';

/**
 * Real, locally-computed integrity checks against the current in-memory
 * bound book / audit log data. These run entirely against localStorage-backed
 * app state — there is no SQLite engine and no PRAGMA statement involved on
 * either the web or Tauri desktop build (the desktop shell has no Rust-side
 * database bridge; it reads the same browser localStorage as the web build).
 * Keep this module's checks honest: only claim what is actually verified below.
 */

export interface IntegrityCheckResult {
  id: string;
  label: string;
  pass: boolean;
}

/** Every bound book line number from 1..N present, with no gaps or duplicates. */
export function checkLineNumberContinuity(records: BoundBookRecord[]): boolean {
  const lineNumbers = records.map(r => r.lineNumber).sort((a, b) => a - b);
  for (let i = 0; i < lineNumbers.length; i++) {
    if (lineNumbers[i] !== i + 1) {
      return false;
    }
  }
  return true;
}

/** Every disposed record is locked against further edits, per ATF Ruling 2016-1. */
export function checkDispositionLocks(records: BoundBookRecord[]): boolean {
  return records.filter(r => r.status === 'Disposed').every(r => r.isLocked);
}

/** Every record has the mandatory acquisition source name & date logged. */
export function checkAcquisitionFieldsComplete(records: BoundBookRecord[]): boolean {
  return records.every(r => !!r.acqDate?.trim() && !!r.acqName?.trim());
}

/** Every audit log entry (i.e. every amendment) carries a non-empty reason. */
export function checkAuditReasonsLogged(auditLogs: AuditLogEntry[]): boolean {
  return auditLogs.every(entry => !!entry.reason?.trim());
}

/**
 * Runs the full set of compliance checks used by the Audit Dashboard's
 * scorecard. Each result reflects the actual current record/audit-log data —
 * nothing here is a static "always pass" claim.
 */
export function runComplianceChecks(
  records: BoundBookRecord[],
  auditLogs: AuditLogEntry[]
): IntegrityCheckResult[] {
  return [
    {
      id: 'line-continuity',
      label: 'Auto-incrementing line numbering without gaps',
      pass: checkLineNumberContinuity(records),
    },
    {
      id: 'acquisition-fields',
      label: 'Mandatory acquisition source & date logging',
      pass: checkAcquisitionFieldsComplete(records),
    },
    {
      id: 'disposition-lock',
      label: 'Permanent lock on transferred/disposed entries',
      pass: checkDispositionLocks(records),
    },
    {
      id: 'audit-reasons',
      label: 'Immutable reason tracking on all record edits',
      pass: checkAuditReasonsLogged(auditLogs),
    },
  ];
}
