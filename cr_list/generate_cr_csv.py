import fitz
import re
import csv
import hashlib
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_DIR = os.getenv('ATF_PDF_DIR', os.path.join(BASE_DIR, 'pdfs'))

PDF_FILES = {
    '2007': os.path.join(PDF_DIR, 'p-5300-11-firearms-curios-or-relics-list.pdf'),
    '2018': os.path.join(PDF_DIR, 'curios_and_relics_list_2018.pdf'),
    '2025': os.path.join(PDF_DIR, 'curios_or_relics_list_-_january_1972_through_april_2025.pdf')
}

SECTION_NAMES = {
    'Section I': 'Ammunition Classified as Curios or Relics (Historical)',
    'Section II': 'Firearms Classified as Curios or Relics Under 18 U.S.C. Chapter 44 (GCA)',
    'Section III': 'Firearms Removed from NFA Provisions and Classified as Curios or Relics Under 18 U.S.C. Chapter 44',
    'Section IIIA': 'Firearms Manufactured in or Before 1898 Removed from NFA Provisions and Classified as Antiques',
    'Section IV': 'NFA Firearms Classified as Curios or Relics Under 26 U.S.C. Chapter 53 (NFA) and 18 U.S.C. Chapter 44 (GCA)'
}

NFA_STATUS = {
    'Section I': 'Ammunition',
    'Section II': 'GCA Only (Not NFA)',
    'Section III': 'Exempt from NFA (Removed from NFA)',
    'Section IIIA': 'NFA Antique Exempt',
    'Section IV': 'NFA Regulated (Subject to NFA & GCA)'
}

def extract_raw_lines(pdf_path, pub_key):
    doc = fitz.open(pdf_path)
    filename = os.path.basename(pdf_path)
    current_sec = 'PREAMBLE'
    all_lines = []
    
    for page_idx in range(len(doc)):
        p_num = page_idx + 1
        lines = doc[page_idx].get_text('text').split('\n')
        
        for line in lines:
            s = line.strip()
            if not s:
                continue
                
            # Filter headers, footers, TOC
            if re.match(r'^Curios or Relics List —', s, re.I): continue
            if re.match(r'^FIREARMS CURIOS OR RELICS LIST', s, re.I): continue
            if re.match(r'^\(1972\s*-\s*200\d\)', s): continue
            if re.match(r'^Page\s+\d+$', s, re.I): continue
            if re.match(r'^\d+$', s): continue
            if s.startswith('U.S. Department of Justice') or s.startswith('Bureau of Alcohol'): continue
            if 'Dear Collector' in s or 'The Firearms and Ammunition Technology Division' in s: continue
            
            # Skip TOC pages
            if '5300' in filename and p_num < 14: continue
            if ('2018' in filename or '2025' in filename) and p_num == 1:
                if 'provisions of 18' in s or 'provisions of 26' in s or 'manufactured in or before 1898' in s:
                    if not s.startswith('A.H. Fox') and not s.startswith('Section II —'):
                        continue
                        
            # Detect section transitions
            if re.match(r'^SECTION I[:\.]', s, re.I) or (s == 'SECTION I' and '5300' in filename):
                current_sec = 'Section I'
                continue
            elif re.match(r'^SECTION II[:\.\s—–]', s, re.I) or (s == 'SECTION II' and '5300' in filename):
                if 'SECTION IIIA' not in s and 'Section IIIA' not in s:
                    current_sec = 'Section II'
                    continue
            elif re.match(r'^SECTION III[:\.\s—–]', s, re.I) or (s == 'SECTION III' and '5300' in filename):
                if 'SECTION IIIA' not in s and 'Section IIIA' not in s:
                    current_sec = 'Section III'
                    continue
            elif re.match(r'^SECTION IIIA[:\.\s—–]', s, re.I) or (s == 'SECTION IIIA' and '5300' in filename):
                current_sec = 'Section IIIA'
                continue
            elif re.match(r'^SECTION IV[:\.\s—–]', s, re.I) or (s == 'SECTION IV' and '5300' in filename):
                current_sec = 'Section IV'
                continue
                
            if current_sec != 'PREAMBLE':
                all_lines.append((current_sec, p_num, s))
                
    return all_lines

def segment_entries(all_lines):
    section_entries = {}
    for sec in ['Section I', 'Section II', 'Section III', 'Section IIIA', 'Section IV']:
        sec_lines = [(p, l) for (s_name, p, l) in all_lines if s_name == sec]
        entries = []
        curr = []
        
        for p_num, l in sec_lines:
            # Skip introductory explanation sentences under section headers
            if 'still subject to the provisions of 18' in l or 'removed from the provisions of the National' in l or 'Ammunition is no longer classified' in l or 'Weapons in this section are excluded' in l or 'These weapons (e.g., machineguns) are firearms' in l:
                continue
                
            is_new = False
            if not curr:
                is_new = True
            else:
                prev_text = ' '.join([x for _, x in curr]).strip()
                if prev_text.endswith('.') or prev_text.endswith(':') or prev_text.endswith(';'):
                    if re.match(r'^[A-Z0-9][A-Za-z0-9\.\'\’\-\s/]+,\s', l) or \
                       re.match(r'^All\s+(original|properly|shotguns|military|commercial)\b', l, re.I) or \
                       re.match(r'^(British|German|Japanese|Russian|U\.S\.|Swedish|Finnish|Italian|French|Spanish|Czech|Polish|Canadian|Austrian|Belgian|Danish|Swiss|Chinese|Hungarian|Yugoslavian|Rumanian|Romanian|Egyptian|Israel|Mexican)\b', l, re.I) or \
                       re.match(r'^[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s*\(', l):
                        is_new = True
                        
            if is_new:
                if curr:
                    entries.append(curr)
                curr = [(p_num, l)]
            else:
                curr.append((p_num, l))
                
        if curr:
            entries.append(curr)
        section_entries[sec] = entries
        
    return section_entries

def parse_entry_details(raw_text):
    raw_text_clean = ' '.join(raw_text.split()).strip()
    
    # 1. Manufacturer / Make
    mfr = ''
    parts = raw_text_clean.split(',')
    first_part = parts[0].strip()
    
    if re.search(r'\b(Model|M\d+|SKS|PIAT|AR-\d+)\b', first_part, re.I):
        m = re.search(r'^(.*?)\s+(Model\s+\S+|M\d+|SKS|PIAT|AR-\d+.*)', first_part, re.I)
        if m:
            mfr = m.group(1).strip()
        else:
            mfr = first_part
    else:
        mfr = first_part
    mfr = re.sub(r'^[•\-\*\d\.\s]+', '', mfr).strip()
    
    # 2. Model
    model = ''
    model_match = re.search(r'\b(Model\s+[\w\-\.\/]+|Mod\.\s+[\w\-\.\/]+|M\d{2,4}[A-Z0-9]*|SKS|PIAT|AR-10|AR-15|FN\s+FAL|GARAND|CARBINE|COMMANDO|AUTO-MAG|INFALLIBLE|LUGER|PARABELLUM)\b', raw_text_clean, re.I)
    if model_match:
        model = model_match.group(0).strip()
        
    # 3. Caliber / Gauge
    cal = ''
    m1 = re.search(r'\b(?:cal(?:iber|\.s?|\.)?\s*([\.\d]+(?:\-[0-9]+)?(?:\s*[x×]\s*[\.\d]+)?(?:\s*(?:mm|gauge|ACP|WCF|Win|Rem|NATO|Luger|Parabellum|Scurt|Rimfire|Centerfire|Long|Short|Special|Colt|Smith\s*&\s*Wesson|S&W|Mauser|Bergmann-Bayard|Browning))?))', raw_text_clean, re.I)
    if m1:
        cal = m1.group(0).strip()
    else:
        m2 = re.search(r'\b\d{1,2}\s*gauge\b', raw_text_clean, re.I)
        if m2:
            cal = m2.group(0).strip()
        else:
            m3 = re.search(r'\b\.\d{2,3}(?:[\-\/]\d{2,3})?(?:\s*[A-Z]+)?\b', raw_text_clean)
            if m3:
                cal = m3.group(0).strip()
                
    # 4. Serial Numbers
    sn = ''
    sn_match = re.search(r'\b(S/Ns?\s*[^,;\.]+|serial\s+numbers?\s*[^,;\.]+|in S/N range\s*[^,;\.]+|bearing S/N[s\s]*[^,;\.]+|having S/N[s\s]*[^,;\.]+)', raw_text_clean, re.I)
    if sn_match:
        sn = sn_match.group(0).strip()
        
    # 5. Date / Years
    years = ''
    yr_match = re.search(r'\b(mfd\.?\s*(?:from|between|in|prior to)?\s*\d{4}(?:\s*(?:to|-|through)\s*\d{4})?|from\s*(?:approx\.?\s*)?\d{4}\s*to\s*\d{4}|prior to\s*\d{4}|in or before\s*1898|mfd\.?\s*prior to\s*\d{4}|between\s*\d{4}\s*and\s*\d{4})', raw_text_clean, re.I)
    if yr_match:
        years = yr_match.group(0).strip()
        
    # 6. Description / Notes (the portion after mfr/model)
    notes = raw_text_clean
    if mfr and notes.startswith(mfr):
        notes = notes[len(mfr):].lstrip(', ').strip()
        
    return {
        'manufacturer': mfr,
        'model': model,
        'caliber': cal,
        'serial_number': sn,
        'years': years,
        'notes': notes,
        'raw_text': raw_text_clean
    }

def main():
    print("Extracting entries from ATF PDF publications...")
    parsed_pub_records = {}
    
    for pub_key, pdf_path in PDF_FILES.items():
        print(f"  Processing edition {pub_key} ({os.path.basename(pdf_path)})...")
        raw_lines = extract_raw_lines(pdf_path, pub_key)
        sec_entries = segment_entries(raw_lines)
        
        pub_records = []
        for sec, entries in sec_entries.items():
            for e_lines in entries:
                raw_text = ' '.join([l for _, l in e_lines])
                details = parse_entry_details(raw_text)
                details['section_code'] = sec
                details['pub_key'] = pub_key
                pub_records.append(details)
        parsed_pub_records[pub_key] = pub_records
        print(f"    -> Extracted {len(pub_records)} entries for {pub_key}")
        
    # Deduplicate and combine across publications
    # Primary key for deduplication: normalized (section_code + raw_text_clean_hash)
    master_dict = {}
    
    pub_labels = {
        '2007': 'ATF P 5300.11 (Dec 2007)',
        '2018': 'ATF C&R List (Jan 1972 - Apr 2018)',
        '2025': 'ATF C&R List (Jan 1972 - Apr 2025)'
    }
    
    # Process in chronological order: 2007 -> 2018 -> 2025
    for pub_key in ['2007', '2018', '2025']:
        for rec in parsed_pub_records[pub_key]:
            sec = rec['section_code']
            norm_key = sec + '||' + re.sub(r'[^a-zA-Z0-9]', '', rec['raw_text'].lower())
            
            if norm_key not in master_dict:
                master_dict[norm_key] = {
                    'section_code': sec,
                    'section_name': SECTION_NAMES[sec],
                    'nfa_status': NFA_STATUS[sec],
                    'manufacturer': rec['manufacturer'],
                    'model': rec['model'],
                    'caliber': rec['caliber'],
                    'serial_number': rec['serial_number'],
                    'years': rec['years'],
                    'notes': rec['notes'],
                    'raw_text': rec['raw_text'],
                    'first_published': pub_labels[pub_key],
                    'latest_published': pub_labels[pub_key],
                    'in_2007': (pub_key == '2007'),
                    'in_2018': (pub_key == '2018'),
                    'in_2025': (pub_key == '2025')
                }
            else:
                entry = master_dict[norm_key]
                entry['latest_published'] = pub_labels[pub_key]
                if pub_key == '2007': entry['in_2007'] = True
                if pub_key == '2018': entry['in_2018'] = True
                if pub_key == '2025': entry['in_2025'] = True
                # If newer text has slightly richer detail, update details
                if len(rec['raw_text']) > len(entry['raw_text']):
                    entry['raw_text'] = rec['raw_text']
                    entry['notes'] = rec['notes']

    # Sort master entries by Section and Manufacturer name
    section_order = {'Section II': 1, 'Section III': 2, 'Section IIIA': 3, 'Section IV': 4, 'Section I': 5}
    sorted_records = sorted(
        master_dict.values(),
        key=lambda x: (section_order.get(x['section_code'], 99), x['manufacturer'].lower(), x['model'].lower(), x['raw_text'].lower())
    )
    
    # Assign sequential record IDs
    sec_counters = {}
    for r in sorted_records:
        code = r['section_code'].replace(' ', '')
        sec_counters[code] = sec_counters.get(code, 0) + 1
        r['record_id'] = f"CR-{code}-{sec_counters[code]:04d}"

    # Write to CSV file
    output_csv = os.path.join(BASE_DIR, 'curios_and_relics_master_list.csv')
    
    fieldnames = [
        'record_id',
        'section_code',
        'section_name',
        'nfa_status',
        'manufacturer_or_make',
        'model',
        'caliber_or_gauge',
        'serial_number_range',
        'date_or_year_range',
        'atf_classification_details',
        'first_published_edition',
        'latest_published_edition',
        'in_2025_publication',
        'in_2018_publication',
        'in_2007_publication',
        'full_raw_entry'
    ]
    
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for r in sorted_records:
            writer.writerow({
                'record_id': r['record_id'],
                'section_code': r['section_code'],
                'section_name': r['section_name'],
                'nfa_status': r['nfa_status'],
                'manufacturer_or_make': r['manufacturer'],
                'model': r['model'],
                'caliber_or_gauge': r['caliber'],
                'serial_number_range': r['serial_number'],
                'date_or_year_range': r['years'],
                'atf_classification_details': r['notes'],
                'first_published_edition': r['first_published'],
                'latest_published_edition': r['latest_published'],
                'in_2025_publication': 'TRUE' if r['in_2025'] else 'FALSE',
                'in_2018_publication': 'TRUE' if r['in_2018'] else 'FALSE',
                'in_2007_publication': 'TRUE' if r['in_2007'] else 'FALSE',
                'full_raw_entry': r['raw_text']
            })
            
    print(f"\nSUCCESS: Generated master CSV with {len(sorted_records)} records!")
    print(f"Output saved to: {output_csv}")
    
    # Print breakdown statistics
    sec_stats = {}
    for r in sorted_records:
        sec_stats[r['section_code']] = sec_stats.get(r['section_code'], 0) + 1
    print("\nMaster Dataset Record Breakdown by ATF Section:")
    for k, v in sec_stats.items():
        print(f"  - {k} ({SECTION_NAMES[k]}): {v} records")

if __name__ == '__main__':
    main()
