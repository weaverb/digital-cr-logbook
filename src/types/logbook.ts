export type FirearmType = 
  | 'Rifle' 
  | 'Pistol' 
  | 'Revolver' 
  | 'Shotgun' 
  | 'Receiver / Frame' 
  | 'Combination' 
  | 'Other';

export type RecordStatus = 'In Collection' | 'Disposed';

export interface AuditLogEntry {
  id: string;
  recordId: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
  reason: string;
}

export interface MaintenanceRecord {
  id: string;
  firearmId: string;
  date: string;
  type: 'Cleaning' | 'Repair' | 'Part Replacement' | 'Refinishing' | 'Gunsmith Inspection';
  cost: number;
  performedBy: string;
  notes: string;
}

export interface RangeRecord {
  id: string;
  firearmId: string;
  date: string;
  ammoType: string;
  roundsFired: number;
  notes: string;
}

export interface BoundBookRecord {
  id: string;
  lineNumber: number;
  manufacturer: string;
  importer?: string;
  model: string;
  serialNumber: string;
  type: FirearmType;
  caliber: string;
  
  // Acquisition Info (27 CFR § 478.125(f))
  acqDate: string;
  acqName: string;
  acqAddress?: string;
  acqFFL?: string;
  
  // Disposition Info
  dispDate?: string;
  dispName?: string;
  dispAddress?: string;
  dispFFL?: string;
  
  status: RecordStatus;
  isLocked: boolean; // Locked upon disposition per ATF rules
  
  // C&R Classification Match
  crReferenceId?: string;
  crSection?: string;
  
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  category: 'Dealer' | 'Manufacturer' | 'Gunsmith' | 'Collector' | 'Other';
  name: string;
  fflNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface MediaAttachment {
  id: string;
  firearmId: string;
  title: string;
  category: 'Proof Mark' | 'Serial Number' | 'Provenance Document' | 'Receipt' | 'General Photo';
  dataUrl: string;
  mimeType: string;
  createdAt: string;
}

export interface CRReferenceEntry {
  record_id: string;
  section_code: string;
  section_name: string;
  nfa_status: string;
  manufacturer_or_make: string;
  model: string;
  caliber_or_gauge: string;
  serial_number_range: string;
  date_or_year_range: string;
  atf_classification_details: string;
  first_published_edition: string;
  latest_published_edition: string;
  in_2025_publication: boolean;
  in_2018_publication: boolean;
  in_2007_publication: boolean;
  full_raw_entry: string;
}
