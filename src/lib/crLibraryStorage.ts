import type { CRReferenceEntry } from '../types/logbook';
import crMasterData from '../data/cr_master_data.json';

const CUSTOM_CR_LIBRARY_KEY = 'cr_logbook_custom_cr_library_v1';
const CR_LIBRARY_METADATA_KEY = 'cr_logbook_cr_library_metadata_v1';

const IDB_DB_NAME = 'cr_logbook_db';
const IDB_STORE_NAME = 'cr_library';
const IDB_DATA_KEY = 'custom_library';

export interface CRLibraryMetadata {
  isCustom: boolean;
  totalRecords: number;
  importedAt?: string;
  sourceFileName?: string;
}

// In-memory cache for fast synchronous access
let inMemoryLibraryCache: CRReferenceEntry[] | null = null;

// Initialize in-memory cache on load
function initCacheFromStorage(): CRReferenceEntry[] {
  if (inMemoryLibraryCache) return inMemoryLibraryCache;
  
  // Try localStorage first for quick synchronous recovery
  const customData = typeof localStorage !== 'undefined' ? localStorage.getItem(CUSTOM_CR_LIBRARY_KEY) : null;
  if (customData) {
    try {
      const parsed: CRReferenceEntry[] = JSON.parse(customData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryLibraryCache = parsed;
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse custom C&R dataset from localStorage', e);
    }
  }

  inMemoryLibraryCache = crMasterData as CRReferenceEntry[];
  return inMemoryLibraryCache;
}

/**
 * Open or upgrade IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not available in this environment.'));
    }
    const request = indexedDB.open(IDB_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Persist custom C&R entries to IndexedDB (asynchronous, supports 100MB+)
 */
export async function saveToIndexedDB(entries: CRReferenceEntry[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.put(entries, IDB_DATA_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (e) {
    console.warn('IndexedDB write failed, relying on in-memory and local storage', e);
  }
}

/**
 * Load custom C&R entries from IndexedDB if available
 */
export async function loadFromIndexedDB(): Promise<CRReferenceEntry[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(IDB_DATA_KEY);
      req.onsuccess = () => {
        db.close();
        if (Array.isArray(req.result) && req.result.length > 0) {
          inMemoryLibraryCache = req.result;
          resolve(req.result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Clear custom C&R entries from IndexedDB
 */
export async function clearIndexedDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      store.delete(IDB_DATA_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // Ignore error
  }
}

/**
 * Robust CSV line/record parser handling quoted fields, escaped quotes, multiline content, and commas.
 */
export function parseCSVToRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  // Normalize newlines to \n
  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if (char === '\n' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
      // Only push non-empty rows
      if (currentRow.some(cell => cell.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  // Final row if not ended with newline
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(cell => cell.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Converts parsed CSV rows into typed CRReferenceEntry objects with schema validation.
 */
export function parseCRReferenceCSV(csvText: string): CRReferenceEntry[] {
  const rows = parseCSVToRows(csvText);
  if (rows.length < 2) {
    throw new Error('The CSV file is empty or missing a header row.');
  }

  const rawHeaders = rows[0].map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
  
  // Find column index helper
  const findCol = (possibleNames: string[]): number => {
    return rawHeaders.findIndex(h => possibleNames.includes(h));
  };

  const idIdx = findCol(['record_id', 'id', 'record id']);
  const detailsIdx = findCol(['atf_classification_details', 'classification_details', 'details', 'full_raw_entry', 'description']);
  const mfgIdx = findCol(['manufacturer_or_make', 'manufacturer', 'make', 'mfg']);

  if (idIdx === -1 && detailsIdx === -1 && mfgIdx === -1) {
    throw new Error('Invalid C&R CSV format: Missing essential columns (record_id, manufacturer, or classification details).');
  }

  const secCodeIdx = findCol(['section_code', 'section', 'sec_code']);
  const secNameIdx = findCol(['section_name', 'section title']);
  const nfaIdx = findCol(['nfa_status', 'nfa status', 'nfa']);
  const modelIdx = findCol(['model', 'model designation']);
  const caliberIdx = findCol(['caliber_or_gauge', 'caliber', 'gauge']);
  const snIdx = findCol(['serial_number_range', 'serial_number', 'serial number', 'serial_range']);
  const dateIdx = findCol(['date_or_year_range', 'date_range', 'years', 'year_range']);
  const firstPubIdx = findCol(['first_published_edition', 'first_published']);
  const latestPubIdx = findCol(['latest_published_edition', 'latest_published', 'edition']);
  const in2025Idx = findCol(['in_2025_publication', 'in_2025']);
  const in2018Idx = findCol(['in_2018_publication', 'in_2018']);
  const in2007Idx = findCol(['in_2007_publication', 'in_2007']);
  const rawEntryIdx = findCol(['full_raw_entry', 'raw_entry', 'raw_text']);

  const entries: CRReferenceEntry[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const getVal = (idx: number): string => (idx >= 0 && idx < row.length ? row[idx].trim() : '');
    const getBool = (idx: number): boolean => {
      if (idx < 0 || idx >= row.length) return false;
      const v = row[idx].trim().toLowerCase();
      return v === 'true' || v === '1' || v === 'yes';
    };

    const record_id = getVal(idIdx) || `CR-CUST-${String(r).padStart(4, '0')}`;
    const manufacturer_or_make = getVal(mfgIdx);
    const details = getVal(detailsIdx);
    const rawText = getVal(rawEntryIdx) || details;

    // Skip empty dummy rows
    if (!record_id && !manufacturer_or_make && !details) continue;

    entries.push({
      record_id,
      section_code: getVal(secCodeIdx) || 'Section II',
      section_name: getVal(secNameIdx) || 'Firearms Classified as Curios or Relics',
      nfa_status: getVal(nfaIdx) || 'GCA Only (Not NFA)',
      manufacturer_or_make,
      model: getVal(modelIdx),
      caliber_or_gauge: getVal(caliberIdx),
      serial_number_range: getVal(snIdx),
      date_or_year_range: getVal(dateIdx),
      atf_classification_details: details || rawText,
      first_published_edition: getVal(firstPubIdx) || 'Imported ATF Publication',
      latest_published_edition: getVal(latestPubIdx) || 'Imported ATF Publication',
      in_2025_publication: getBool(in2025Idx),
      in_2018_publication: getBool(in2018Idx),
      in_2007_publication: getBool(in2007Idx),
      full_raw_entry: rawText
    });
  }

  if (entries.length === 0) {
    throw new Error('No valid C&R classification records found in the provided CSV file.');
  }

  return entries;
}

/**
 * Returns the currently active C&R Reference Library dataset.
 * Synchronous accessor for fast rendering.
 */
export function getActiveCRLibrary(): CRReferenceEntry[] {
  if (inMemoryLibraryCache) {
    return inMemoryLibraryCache;
  }
  return initCacheFromStorage();
}

/**
 * Returns metadata about the currently active C&R Reference Library dataset.
 */
export function getCRLibraryMetadata(): CRLibraryMetadata {
  if (typeof localStorage !== 'undefined') {
    const meta = localStorage.getItem(CR_LIBRARY_METADATA_KEY);
    if (meta) {
      try {
        return JSON.parse(meta);
      } catch (e) {
        console.error('Failed to parse C&R library metadata', e);
      }
    }
  }
  
  const bundled = crMasterData as CRReferenceEntry[];
  return {
    isCustom: false,
    totalRecords: bundled.length
  };
}

/**
 * Saves a new custom C&R dataset into memory, IndexedDB, and metadata into localStorage.
 * Does not hit the 5MB browser localStorage quota limit.
 */
export async function saveCustomCRLibrary(entries: CRReferenceEntry[], sourceFileName?: string): Promise<void> {
  // Update in-memory cache immediately
  inMemoryLibraryCache = entries;

  // Persist metadata in localStorage (small JSON string, <1KB)
  const metadata: CRLibraryMetadata = {
    isCustom: true,
    totalRecords: entries.length,
    importedAt: new Date().toISOString(),
    sourceFileName: sourceFileName || 'Custom C&R Master List.csv'
  };
  
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CR_LIBRARY_METADATA_KEY, JSON.stringify(metadata));
    // Try localStorage if small enough, but ignore quota errors gracefully
    try {
      localStorage.setItem(CUSTOM_CR_LIBRARY_KEY, JSON.stringify(entries));
    } catch {
      // Clean up localStorage key if exceeded so stale partial data doesn't persist
      localStorage.removeItem(CUSTOM_CR_LIBRARY_KEY);
    }
  }

  // Persist large dataset into IndexedDB
  await saveToIndexedDB(entries);
}

/**
 * Returns the default bundled C&R master dataset.
 */
export function getDefaultCRLibrary(): CRReferenceEntry[] {
  return crMasterData as CRReferenceEntry[];
}

/**
 * Resets the C&R dataset back to the default bundled dataset.
 */
export async function resetCRLibraryToDefault(): Promise<void> {
  inMemoryLibraryCache = crMasterData as CRReferenceEntry[];
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CUSTOM_CR_LIBRARY_KEY);
    localStorage.removeItem(CR_LIBRARY_METADATA_KEY);
  }
  await clearIndexedDB();
}
