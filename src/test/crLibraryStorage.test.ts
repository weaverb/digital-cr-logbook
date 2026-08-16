import { describe, it, expect, beforeEach } from 'vitest';
import { 
  parseCSVToRows, 
  parseCRReferenceCSV, 
  getActiveCRLibrary, 
  saveCustomCRLibrary, 
  resetCRLibraryToDefault, 
  getCRLibraryMetadata 
} from '../lib/crLibraryStorage';
import type { CRReferenceEntry } from '../types/logbook';

const sampleCSV = `record_id,section_code,section_name,nfa_status,manufacturer_or_make,model,caliber_or_gauge,serial_number_range,date_or_year_range,atf_classification_details,first_published_edition,latest_published_edition,in_2025_publication,in_2018_publication,in_2007_publication,full_raw_entry
CR-TEST-0001,Section II,Firearms Classified as Curios or Relics Under 18 U.S.C. Chapter 44 (GCA),GCA Only (Not NFA),Springfield Armory,Model 1903,cal. .30-06,S/Ns 100 to 500,from 1903 to 1920,"Springfield Model 1903 rifles, cal. .30-06, serials 100 to 500.",ATF P 5300.11 (Dec 2007),ATF C&R List (Jan 1972 - Apr 2025),TRUE,TRUE,TRUE,"Springfield Armory Model 1903 rifles, cal. .30-06, S/Ns 100 to 500."
CR-TEST-0002,Section III,Firearms Removed from NFA Provisions and Classified as Curios or Relics Under 18 U.S.C. Chapter 44,Exempt from NFA (Removed from NFA),Colt,Single Action Army,cal. .45 Colt,,prior to 1899,"Colt SAA revolvers, cal. .45 Colt, manufactured prior to 1899.",ATF C&R List (Jan 1972 - Apr 2018),ATF C&R List (Jan 1972 - Apr 2025),TRUE,TRUE,FALSE,"Colt Single Action Army revolvers, cal. .45 Colt."
`;

const sampleCSVWithQuotesAndCommas = `"record_id","section_code","section_name","nfa_status","manufacturer_or_make","model","caliber_or_gauge","serial_number_range","date_or_year_range","atf_classification_details","first_published_edition","latest_published_edition","in_2025_publication","in_2018_publication","in_2007_publication","full_raw_entry"
"CR-TEST-0003","Section IV","NFA Regulated","NFA Regulated (Subject to NFA & GCA)","Mauser","C96 ""Bolo""","cal. 7.63mm","S/Ns 1000, 2000, 3000","1920-1930","Mauser C96 ""Bolo"" pistols with original shoulder stock.","ATF 2025","ATF 2025","TRUE","FALSE","FALSE","Mauser C96 Bolo pistols."
`;

describe('C&R Master List CSV Parser & Storage Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('parseCSVToRows', () => {
    it('handles commas inside quotes properly', () => {
      const csv = 'col1,col2\n"value, with comma",plain_value';
      const rows = parseCSVToRows(csv);
      expect(rows.length).toBe(2);
      expect(rows[1][0]).toBe('value, with comma');
      expect(rows[1][1]).toBe('plain_value');
    });

    it('handles escaped double quotes inside quotes properly', () => {
      const csv = 'col1\n"value with ""quotes"""';
      const rows = parseCSVToRows(csv);
      expect(rows.length).toBe(2);
      expect(rows[1][0]).toBe('value with "quotes"');
    });

    it('handles CRLF and LF newlines', () => {
      const csv = 'col1,col2\r\nval1,val2\r\nval3,val4\nval5,val6';
      const rows = parseCSVToRows(csv);
      expect(rows.length).toBe(4);
      expect(rows[3][0]).toBe('val5');
    });
  });

  describe('parseCRReferenceCSV', () => {
    it('parses valid C&R master CSV text into structured records', () => {
      const entries = parseCRReferenceCSV(sampleCSV);
      expect(entries.length).toBe(2);

      const first = entries[0];
      expect(first.record_id).toBe('CR-TEST-0001');
      expect(first.manufacturer_or_make).toBe('Springfield Armory');
      expect(first.model).toBe('Model 1903');
      expect(first.caliber_or_gauge).toBe('cal. .30-06');
      expect(first.serial_number_range).toBe('S/Ns 100 to 500');
      expect(first.date_or_year_range).toBe('from 1903 to 1920');
      expect(first.in_2025_publication).toBe(true);
      expect(first.in_2018_publication).toBe(true);
      expect(first.in_2007_publication).toBe(true);

      const second = entries[1];
      expect(second.record_id).toBe('CR-TEST-0002');
      expect(second.section_code).toBe('Section III');
      expect(second.nfa_status).toBe('Exempt from NFA (Removed from NFA)');
      expect(second.in_2007_publication).toBe(false);
    });

    it('handles quoted fields and escaped quotes in CSV', () => {
      const entries = parseCRReferenceCSV(sampleCSVWithQuotesAndCommas);
      expect(entries.length).toBe(1);
      expect(entries[0].record_id).toBe('CR-TEST-0003');
      expect(entries[0].manufacturer_or_make).toBe('Mauser');
      expect(entries[0].model).toBe('C96 "Bolo"');
      expect(entries[0].serial_number_range).toBe('S/Ns 1000, 2000, 3000');
      expect(entries[0].atf_classification_details).toBe('Mauser C96 "Bolo" pistols with original shoulder stock.');
    });

    it('throws an error if CSV is empty or missing headers', () => {
      expect(() => parseCRReferenceCSV('')).toThrow('The CSV file is empty or missing a header row.');
      expect(() => parseCRReferenceCSV('some,random,stuff')).toThrow('The CSV file is empty or missing a header row.');
    });

    it('throws an error if CSV does not have expected C&R columns', () => {
      const invalidCSV = 'fruit,color,quantity\nApple,Red,10\nBanana,Yellow,5';
      expect(() => parseCRReferenceCSV(invalidCSV)).toThrow('Invalid C&R CSV format: Missing essential columns');
    });
  });

  describe('C&R Storage Management (Dynamic C&R Library)', () => {
    it('returns bundled default dataset when no custom CSV has been imported', () => {
      const records = getActiveCRLibrary();
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThan(4000);

      const meta = getCRLibraryMetadata();
      expect(meta.isCustom).toBe(false);
      expect(meta.totalRecords).toBe(records.length);
    });

    it('saves custom C&R dataset and returns custom metadata', async () => {
      const customEntries: CRReferenceEntry[] = [
        {
          record_id: 'CR-NEW-001',
          section_code: 'Section II',
          section_name: 'Firearms Classified as Curios or Relics',
          nfa_status: 'GCA Only (Not NFA)',
          manufacturer_or_make: 'Custom Arsenal',
          model: 'Model 2026',
          caliber_or_gauge: 'cal. 9mm',
          serial_number_range: '1-100',
          date_or_year_range: '1970',
          atf_classification_details: 'Custom 2026 classification listing.',
          first_published_edition: 'ATF 2026',
          latest_published_edition: 'ATF 2026',
          in_2025_publication: false,
          in_2018_publication: false,
          in_2007_publication: false,
          full_raw_entry: 'Custom Arsenal Model 2026'
        }
      ];

      await saveCustomCRLibrary(customEntries, 'curios_and_relics_2026.csv');

      const active = getActiveCRLibrary();
      expect(active.length).toBe(1);
      expect(active[0].record_id).toBe('CR-NEW-001');

      const meta = getCRLibraryMetadata();
      expect(meta.isCustom).toBe(true);
      expect(meta.totalRecords).toBe(1);
      expect(meta.sourceFileName).toBe('curios_and_relics_2026.csv');
      expect(meta.importedAt).toBeDefined();
    });

    it('resets custom C&R dataset back to bundled default', async () => {
      await saveCustomCRLibrary([
        {
          record_id: 'CR-TEMP-001',
          section_code: 'Section II',
          section_name: 'Test',
          nfa_status: 'GCA Only',
          manufacturer_or_make: 'Temp',
          model: 'Temp',
          caliber_or_gauge: '',
          serial_number_range: '',
          date_or_year_range: '',
          atf_classification_details: '',
          first_published_edition: '',
          latest_published_edition: '',
          in_2025_publication: false,
          in_2018_publication: false,
          in_2007_publication: false,
          full_raw_entry: ''
        }
      ]);

      expect(getActiveCRLibrary().length).toBe(1);
      await resetCRLibraryToDefault();
      
      const reverted = getActiveCRLibrary();
      expect(reverted.length).toBeGreaterThan(4000);
      const meta = getCRLibraryMetadata();
      expect(meta.isCustom).toBe(false);
    });
  });
});
