import type { BoundBookRecord, AuditLogEntry, MaintenanceRecord, RangeRecord } from '../types/logbook';

const BOUND_BOOK_KEY = 'cr_logbook_bound_book_records_v1';
const AUDIT_LOG_KEY = 'cr_logbook_audit_log_v1';
const MAINTENANCE_KEY = 'cr_logbook_maintenance_records_v1';
const RANGE_KEY = 'cr_logbook_range_records_v1';

const defaultBoundBookRecords: BoundBookRecord[] = [];
const defaultMaintenanceRecords: MaintenanceRecord[] = [];
const defaultRangeRecords: RangeRecord[] = [];

export function getBoundBookRecords(): BoundBookRecord[] {
  const data = localStorage.getItem(BOUND_BOOK_KEY);
  if (!data) {
    saveBoundBookRecords(defaultBoundBookRecords);
    return defaultBoundBookRecords;
  }
  try {
    const parsed: BoundBookRecord[] = JSON.parse(data);
    return parsed.sort((a, b) => a.lineNumber - b.lineNumber);
  } catch (e) {
    console.error('Failed to parse bound book records from storage', e);
    return defaultBoundBookRecords;
  }
}

export function saveBoundBookRecords(records: BoundBookRecord[]): void {
  const sorted = [...records].sort((a, b) => a.lineNumber - b.lineNumber);
  localStorage.setItem(BOUND_BOOK_KEY, JSON.stringify(sorted));
}

export function getAuditLogs(): AuditLogEntry[] {
  const data = localStorage.getItem(AUDIT_LOG_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse audit logs', e);
    return [];
  }
}

export function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  const currentLogs = getAuditLogs();
  const newEntry: AuditLogEntry = {
    ...entry,
    id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString()
  };
  const updatedLogs = [newEntry, ...currentLogs];
  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(updatedLogs));
}

export function getMaintenanceRecords(firearmId?: string): MaintenanceRecord[] {
  const data = localStorage.getItem(MAINTENANCE_KEY);
  let records: MaintenanceRecord[] = [];
  if (!data) {
    records = defaultMaintenanceRecords;
    localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(records));
  } else {
    try {
      records = JSON.parse(data);
    } catch (e) {
      records = defaultMaintenanceRecords;
    }
  }
  return firearmId ? records.filter(r => r.firearmId === firearmId) : records;
}

export function saveMaintenanceRecord(record: Omit<MaintenanceRecord, 'id'>): MaintenanceRecord {
  const records = getMaintenanceRecords();
  const newRecord: MaintenanceRecord = {
    ...record,
    id: 'maint-' + Date.now()
  };
  const updated = [newRecord, ...records];
  localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(updated));
  return newRecord;
}

export function getRangeRecords(firearmId?: string): RangeRecord[] {
  const data = localStorage.getItem(RANGE_KEY);
  let records: RangeRecord[] = [];
  if (!data) {
    records = defaultRangeRecords;
    localStorage.setItem(RANGE_KEY, JSON.stringify(records));
  } else {
    try {
      records = JSON.parse(data);
    } catch (e) {
      records = defaultRangeRecords;
    }
  }
  return firearmId ? records.filter(r => r.firearmId === firearmId) : records;
}

export function saveRangeRecord(record: Omit<RangeRecord, 'id'>): RangeRecord {
  const records = getRangeRecords();
  const newRecord: RangeRecord = {
    ...record,
    id: 'range-' + Date.now()
  };
  const updated = [newRecord, ...records];
  localStorage.setItem(RANGE_KEY, JSON.stringify(updated));
  return newRecord;
}

const CONTACTS_KEY = 'cr_logbook_contacts_v1';
const MEDIA_KEY = 'cr_logbook_media_attachments_v1';

const defaultContacts: import('../types/logbook').Contact[] = [];

export function getContacts(): import('../types/logbook').Contact[] {
  const data = localStorage.getItem(CONTACTS_KEY);
  if (!data) {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(defaultContacts));
    return defaultContacts;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultContacts;
  }
}

export function saveContact(contact: Omit<import('../types/logbook').Contact, 'id'>): import('../types/logbook').Contact {
  const current = getContacts();
  const newContact: import('../types/logbook').Contact = {
    ...contact,
    id: 'cnt-' + Date.now()
  };
  const updated = [newContact, ...current];
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
  return newContact;
}

export function deleteContact(id: string): void {
  const current = getContacts();
  const updated = current.filter(c => c.id !== id);
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
}

export function getMediaAttachments(firearmId?: string): import('../types/logbook').MediaAttachment[] {
  const data = localStorage.getItem(MEDIA_KEY);
  let attachments: import('../types/logbook').MediaAttachment[] = [];
  if (data) {
    try {
      attachments = JSON.parse(data);
    } catch (e) {
      attachments = [];
    }
  }
  return firearmId ? attachments.filter(a => a.firearmId === firearmId) : attachments;
}

export function saveMediaAttachment(attachment: Omit<import('../types/logbook').MediaAttachment, 'id' | 'createdAt'>): import('../types/logbook').MediaAttachment {
  const current = getMediaAttachments();
  const newAttachment: import('../types/logbook').MediaAttachment = {
    ...attachment,
    id: 'media-' + Date.now(),
    createdAt: new Date().toISOString()
  };
  const updated = [newAttachment, ...current];
  localStorage.setItem(MEDIA_KEY, JSON.stringify(updated));
  return newAttachment;
}

export function deleteMediaAttachment(id: string): void {
  const current = getMediaAttachments();
  const updated = current.filter(a => a.id !== id);
  localStorage.setItem(MEDIA_KEY, JSON.stringify(updated));
}

