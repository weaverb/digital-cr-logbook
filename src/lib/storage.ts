import type { BoundBookRecord, AuditLogEntry, MaintenanceRecord, RangeRecord } from '../types/logbook';

const BOUND_BOOK_KEY = 'cr_logbook_bound_book_records_v1';
const AUDIT_LOG_KEY = 'cr_logbook_audit_log_v1';
const MAINTENANCE_KEY = 'cr_logbook_maintenance_records_v1';
const RANGE_KEY = 'cr_logbook_range_records_v1';

const defaultBoundBookRecords: BoundBookRecord[] = [
  {
    id: 'rec-001',
    lineNumber: 1,
    manufacturer: 'Tula Arms Plant',
    importer: 'Century Arms (CAI)',
    model: 'Mosin-Nagant M91/30',
    serialNumber: '913077421',
    type: 'Rifle',
    caliber: '7.62x54mmR',
    acqDate: '2021-04-12',
    acqName: 'Classic Firearms',
    acqAddress: 'Monroe, NC',
    acqFFL: '1-56-xxx-09',
    status: 'In Collection',
    isLocked: false,
    crReferenceId: 'CR-SectionII-0003',
    crSection: 'Section II',
    notes: 'Matching serial numbers on receiver, bolt, and magazine floorplate.',
    createdAt: '2021-04-12T10:00:00Z',
    updatedAt: '2021-04-12T10:00:00Z'
  },
  {
    id: 'rec-002',
    lineNumber: 2,
    manufacturer: 'Carl Walther Waffenfabrik',
    model: 'PPK (Commercial C&R)',
    serialNumber: '284910W',
    type: 'Pistol',
    caliber: '.32 ACP (7.65mm)',
    acqDate: '2022-09-05',
    acqName: 'Simpson Ltd',
    acqAddress: 'Galesburg, IL',
    acqFFL: '9-36-xxx-12',
    dispDate: '2024-01-18',
    dispName: 'John Doe',
    dispAddress: 'Dallas, TX',
    dispFFL: '3-42-xxx-01',
    status: 'Disposed',
    isLocked: true, // Disposed records are locked per 27 CFR 478.125(f)
    crReferenceId: 'CR-SectionII-0182',
    crSection: 'Section II',
    notes: 'Transferred to fellow Type 03 licensee.',
    createdAt: '2022-09-05T14:30:00Z',
    updatedAt: '2024-01-18T16:20:00Z'
  },
  {
    id: 'rec-003',
    lineNumber: 3,
    manufacturer: 'Springfield Armory',
    model: 'M1 Garand',
    serialNumber: '3829104',
    type: 'Rifle',
    caliber: '.30-06 Springfield',
    acqDate: '2023-06-15',
    acqName: 'Civilian Marksmanship Program (CMP)',
    acqAddress: 'Anniston, AL',
    acqFFL: '6-63-xxx-44',
    status: 'In Collection',
    isLocked: false,
    crReferenceId: 'CR-SectionII-0350',
    crSection: 'Section II',
    notes: 'Service Grade CMP rifle with original LMR barrel dated 1953.',
    createdAt: '2023-06-15T11:15:00Z',
    updatedAt: '2023-06-15T11:15:00Z'
  }
];

const defaultMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: 'maint-001',
    firearmId: 'rec-001',
    date: '2021-04-15',
    type: 'Cleaning',
    cost: 15.00,
    performedBy: 'Self (Cosmoline Removal)',
    notes: 'Complete teardown, mineral spirits soak, and lubrication with Ballistol.'
  },
  {
    id: 'maint-002',
    firearmId: 'rec-003',
    date: '2023-07-01',
    type: 'Gunsmith Inspection',
    cost: 45.00,
    performedBy: 'Ordnance Research Gunsmithing',
    notes: 'Headspace checked with Clymer GO / NO-GO gauges. Passed within MIL-SPEC limits.'
  }
];

const defaultRangeRecords: RangeRecord[] = [
  {
    id: 'range-001',
    firearmId: 'rec-001',
    date: '2021-05-02',
    ammoType: '7.62x54mmR Sellier & Bellot 180gr FMJ',
    roundsFired: 40,
    notes: 'Grouped 2.5 MOA at 100 yards. Elevation set to 200m mark.'
  },
  {
    id: 'range-002',
    firearmId: 'rec-003',
    date: '2023-07-08',
    ammoType: '.30-06 PPU M2 Ball 150gr FMJ',
    roundsFired: 80,
    notes: 'Zeroed sights at 100 yards. Perfect feeding and en-bloc clip ejection.'
  }
];

export function getBoundBookRecords(): BoundBookRecord[] {
  const data = localStorage.getItem(BOUND_BOOK_KEY);
  if (!data) {
    saveBoundBookRecords(defaultBoundBookRecords);
    return defaultBoundBookRecords;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse bound book records from storage', e);
    return defaultBoundBookRecords;
  }
}

export function saveBoundBookRecords(records: BoundBookRecord[]): void {
  localStorage.setItem(BOUND_BOOK_KEY, JSON.stringify(records));
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

const defaultContacts: import('../types/logbook').Contact[] = [
  {
    id: 'cnt-001',
    category: 'Dealer',
    name: 'Classic Firearms',
    fflNumber: '1-56-xxx-09',
    email: 'sales@classicfirearms.com',
    phone: '(704) 555-0192',
    address: 'Monroe, NC',
    notes: 'Primary C&R surplus distributor'
  },
  {
    id: 'cnt-002',
    category: 'Dealer',
    name: 'Simpson Ltd',
    fflNumber: '9-36-xxx-12',
    email: 'info@simpsonltd.com',
    phone: '(309) 342-5800',
    address: 'Galesburg, IL',
    notes: 'Collector firearm specialist'
  },
  {
    id: 'cnt-003',
    category: 'Collector',
    name: 'Civilian Marksmanship Program (CMP)',
    fflNumber: '6-63-xxx-44',
    phone: '(256) 835-8455',
    address: 'Anniston, AL',
    notes: 'US Military surplus rifles'
  }
];

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
