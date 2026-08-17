# ATF Curios and Relics (C&R) Master List Dataset

## Overview & Purpose

This dataset provides a unified, structured master database of all firearm and ammunition classifications designated as **Curios or Relics (C&R)** by the Bureau of Alcohol, Tobacco, Firearms and Explosives (ATF) under **18 U.S.C. Chapter 44 (Gun Control Act of 1968)** and **26 U.S.C. Chapter 53 (National Firearms Act)**.

The data has been extracted, normalized, deduplicated, and cross-referenced from three primary ATF publications:
1. **ATF Publication 5300.11** — *Firearms Curios or Relics List* (Revised December 2007, covering 1972–2007).
2. **ATF Curios or Relics List** — *January 1972 through April 2018*.
3. **ATF Curios or Relics List** — *January 1972 through April 2025*.

The resulting dataset contains **4,207 total records** formatted as a clean, standardized CSV file (`curios_and_relics_master_list.csv`) designed for direct integration into digital logbooks, databases, search indexes, and mobile/desktop compliance applications for **Type 03 C&R Licensees**.

---

## Dataset Summary & Breakdown

| ATF Section | Section Name | Legal Regulatory Status | Total Records |
| :--- | :--- | :--- | :---: |
| **Section II** | Firearms Classified as Curios or Relics Under 18 U.S.C. Chapter 44 | GCA Only (Not NFA) | **990** |
| **Section III** | Firearms Removed from NFA Provisions & Classified as C&R Under 18 U.S.C. Chapter 44 | Exempt from NFA (Removed) | **1,951** |
| **Section IIIA** | Firearms Mfd. in/before 1898 Removed from NFA & Classified as Antiques | NFA Antique Exempt | **850** |
| **Section IV** | NFA Firearms Classified as Curios or Relics Under 26 U.S.C. Chapter 53 & 18 U.S.C. Chapter 44 | NFA Regulated (NFA & GCA) | **415** |
| **Section I** | Ammunition Classified as Curios or Relics (Historical Listing) | Ammunition | **1** |
| **TOTAL** | **Master Unified Dataset** | | **4,207** |

---

## CSV File Schema & Data Dictionary

The master CSV file (`curios_and_relics_master_list.csv`) consists of **16 columns**:

| Column Name | Data Type | Description & Example Values |
| :--- | :--- | :--- |
| `record_id` | String | Unique primary key (e.g., `CR-SEC2-0001`, `CR-SEC3-0142`, `CR-SEC1-0001`). |
| `section_code` | String | Official ATF Section Identifier (`Section II`, `Section III`, `Section IIIA`, `Section IV`, `Section I`). |
| `section_name` | String | Descriptive title of the ATF section (e.g., `Firearms Classified as Curios or Relics Under 18 U.S.C. Chapter 44 (GCA)`). |
| `nfa_status` | String | Legal classification status (`GCA Only (Not NFA)`, `Exempt from NFA (Removed from NFA)`, `NFA Antique Exempt`, `NFA Regulated (Subject to NFA & GCA)`, `Ammunition`). |
| `manufacturer_or_make` | String | Primary manufacturer, arsenal, make, or country of origin (e.g., `A.H. Fox`, `Beretta`, `Colt`, `Winchester`, `Albanian`, `British`, `German`). |
| `model` | String | Model designation or firearm series (e.g., `Model 1935`, `Model 1911A1`, `Model 94`, `SKS`, `PIAT`, `System Colt Model 1927`). |
| `caliber_or_gauge` | String | Caliber or gauge specification (e.g., `cal. 9mm`, `cal. .45 ACP`, `7.62x39`, `cal. .30-30`, `12 gauge`, `cal. .22`). |
| `serial_number_range` | String | Extracted serial number range or specific S/N restriction (e.g., `S/Ns C31509Z through C32000Z`, `S/Ns less than 24501`, `S/N 948487`). |
| `date_or_year_range` | String | Production dates, manufacture years, or era (e.g., `from approx. 1907 to 1947`, `1964 to 1978`, `prior to 1946`, `in or before 1898`). |
| `atf_classification_details` | String | Full text description including contract markings, barrel length restrictions, commemorative details, and special conditions. |
| `first_published_edition` | String | Earliest ATF publication edition where this listing appears (`ATF P 5300.11 (Dec 2007)`, `ATF C&R List (Jan 1972 - Apr 2018)`, `ATF C&R List (Jan 1972 - Apr 2025)`). |
| `latest_published_edition` | String | Latest ATF publication edition containing this listing. |
| `in_2025_publication` | Boolean | `TRUE` if entry exists in the April 2025 publication, else `FALSE`. |
| `in_2018_publication` | Boolean | `TRUE` if entry exists in the April 2018 publication, else `FALSE`. |
| `in_2007_publication` | Boolean | `TRUE` if entry exists in the December 2007 publication, else `FALSE`. |
| `full_raw_entry` | String | Complete unmodified raw text of the entry as printed in the ATF publication. |

---

## Data Extraction & Processing Methodology

1. **PDF Text Stream Parsing & Cleaning:**
   * Text was extracted from all three PDFs using PyMuPDF (`fitz`).
   * Headers, footers, page numbers, and Table of Contents (TOC) pages were filtered out.

2. **Section Boundary Detection:**
   * Exact page transitions were identified for each ATF Section (`Section II`, `Section III`, `Section IIIA`, `Section IV`, `Section I`).

3. **Entry Segmentation Algorithm:**
   * Paragraph and entry start signatures were identified using manufacturer capitalization rules, punctuation boundaries, and bullet patterns.

4. **Regex Field Extraction:**
   * Pattern matching extracted `manufacturer`, `model`, `caliber`, `serial_number`, `date_range`, and detailed classification notes.

5. **Cross-Publication Deduplication & Edition Tracking:**
   * Records were cross-referenced using a normalized cryptographic text hash (`SectionCode + NormalizedText`).
   * Historical entries (such as the Section I Ammunition listing from 2007) were preserved alongside newer 2018 and 2025 entries.
   * Edition tracking flags (`in_2025_publication`, `in_2018_publication`, `in_2007_publication`) indicate publication history.

---

## Future Update & Repopulation Instructions

When the ATF releases new C&R list publications in the future (e.g., 2026/2027 updates):

### Step 1: Download New ATF PDF
Save the new ATF publication PDF into the working `pdfs/` directory (e.g., `./pdfs/curios_and_relics_list_2026.pdf`).

### Step 2: Update Generator Script (`generate_cr_csv.py`)
Add the new PDF filename and publication label to the `PDF_FILES` dictionary in `generate_cr_csv.py`:

```python
PDF_FILES = {
    '2007': os.path.join(PDF_DIR, 'p-5300-11-firearms-curios-or-relics-list.pdf'),
    '2018': os.path.join(PDF_DIR, 'curios_and_relics_list_2018.pdf'),
    '2025': os.path.join(PDF_DIR, 'curios_or_relics_list_-_january_1972_through_april_2025.pdf'),
    '2026': os.path.join(PDF_DIR, 'curios_and_relics_list_2026.pdf')  # <-- Add new file
}
```

Add a new field column to the CSV fieldnames list (e.g., `in_2026_publication`).

### Step 3: Run Extraction Script
Execute the script from terminal:

```bash
python3 generate_cr_csv.py
```

The script will automatically parse the new publication, merge new entries, update publication flags, maintain existing record IDs, and output an updated `curios_and_relics_master_list.csv`.

### Step 4: Import New CSV Directly Into Application
Users and collectors can immediately import the new CSV into the running application without needing to upgrade or rebuild:
1. Navigate to the **ATF Master C&R Reference Library** tab (or press `Cmd+K` / `Ctrl+K` and search *Import / Update ATF C&R Master List*).
2. Click **Import Updated CSV**.
3. Drag and drop the generated `curios_and_relics_master_list.csv` file and click **Apply & Replace C&R List**.
4. The application dynamically updates its live search index and autocomplete references while keeping your bound book records safe.

