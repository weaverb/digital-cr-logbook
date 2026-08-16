import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportCRCSVModal } from '../components/ImportCRCSVModal';

const validCSV = `record_id,section_code,section_name,nfa_status,manufacturer_or_make,model,caliber_or_gauge,serial_number_range,date_or_year_range,atf_classification_details,first_published_edition,latest_published_edition,in_2025_publication,in_2018_publication,in_2007_publication,full_raw_entry
CR-SEC2-0001,Section II,Firearms Classified as Curios or Relics Under 18 U.S.C. Chapter 44 (GCA),GCA Only (Not NFA),Walther,PPK,cal. 7.65mm,S/Ns 10000-20000,1931-1945,"Walther PPK pistols in .32 ACP.",ATF 2025,ATF 2025,TRUE,TRUE,FALSE,"Walther PPK pistols, cal. 7.65mm."
`;

describe('ImportCRCSVModal Component', () => {
  const onImportSuccess = vi.fn();
  const onResetSuccess = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <ImportCRCSVModal
        isOpen={false}
        onClose={onClose}
        onImportSuccess={onImportSuccess}
        onResetSuccess={onResetSuccess}
      />
    );
    expect(screen.queryByText(/Import ATF C&R Master List/i)).not.toBeInTheDocument();
  });

  it('renders correctly with current active dataset information', () => {
    render(
      <ImportCRCSVModal
        isOpen={true}
        onClose={onClose}
        onImportSuccess={onImportSuccess}
        onResetSuccess={onResetSuccess}
      />
    );
    expect(screen.getByText(/Import ATF C&R Master List \(CSV\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Default Official Bundled List/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose a new ATF C&R CSV file or drag and drop here/i)).toBeInTheDocument();
  });

  it('handles uploading a valid CSV and enables the Apply & Replace button', async () => {
    render(
      <ImportCRCSVModal
        isOpen={true}
        onClose={onClose}
        onImportSuccess={onImportSuccess}
        onResetSuccess={onResetSuccess}
      />
    );

    const file = new File([validCSV], 'updated_cr_list.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/1 Valid Records Extracted/i)).toBeInTheDocument();
      expect(screen.getByText(/Ready to Import and Replace/i)).toBeInTheDocument();
    });

    const applyButton = screen.getByRole('button', { name: /Apply & Replace C&R List/i });
    expect(applyButton).not.toBeDisabled();

    fireEvent.click(applyButton);

    expect(onImportSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('displays an error message when an invalid non-CSV file or corrupted content is chosen', async () => {
    render(
      <ImportCRCSVModal
        isOpen={true}
        onClose={onClose}
        onImportSuccess={onImportSuccess}
        onResetSuccess={onResetSuccess}
      />
    );

    const file = new File(['just,random,headers\n1,2,3'], 'bad_format.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/CSV Parsing Error/i)).toBeInTheDocument();
    });
  });
});
