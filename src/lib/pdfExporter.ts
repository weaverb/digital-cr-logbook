import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BoundBookRecord } from '../types/logbook';
import { saveFileWithNativePicker } from './fileSaveHelper';

export interface PDFExportOptions {
  collectorName?: string;
  fflNumber?: string;
  filter?: 'all' | 'collection' | 'disposed';
}

export function generateBoundBookPDF(records: BoundBookRecord[], options: PDFExportOptions = {}): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const collectorName = options.collectorName || 'Type 03 C&R FFL Collector';
  const fflNumber = options.fflNumber || 'Lic # 3-xx-xxx-xx';
  const printDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Filter records if option provided
  const recordsToExport = records.filter(r => {
    if (options.filter === 'collection') return r.status === 'In Collection';
    if (options.filter === 'disposed') return r.status === 'Disposed';
    return true;
  }).sort((a, b) => a.lineNumber - b.lineNumber);

  // Document Title Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FIREARMS ACQUISITION AND DISPOSITION RECORD', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Compliant with 27 CFR § 478.125(f) & ATF Ruling 2016-1 (Type 03 C&R Bound Book)', 14, 20);

  // Licensee Info Box
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Licensee: ${collectorName}`, 200, 15);
  doc.text(`FFL Number: ${fflNumber}`, 200, 19);
  doc.text(`Date Printed: ${printDate}`, 200, 23);

  doc.setLineWidth(0.5);
  doc.line(14, 26, 283, 26);

  // Table Data Mapping
  const tableRows = recordsToExport.map(r => [
    r.lineNumber.toString(),
    r.manufacturer + (r.importer ? `\n(Imp: ${r.importer})` : ''),
    r.model,
    r.serialNumber,
    r.type,
    r.caliber,
    r.acqDate,
    `${r.acqName}${r.acqAddress ? `\n${r.acqAddress}` : ''}${r.acqFFL ? `\nFFL: ${r.acqFFL}` : ''}`,
    r.dispDate || '—',
    r.dispName ? `${r.dispName}${r.dispAddress ? `\n${r.dispAddress}` : ''}${r.dispFFL ? `\nFFL: ${r.dispFFL}` : ''}` : '— (Retained)'
  ]);

  autoTable(doc, {
    startY: 29,
    head: [[
      'Line', 
      'Manufacturer / Importer', 
      'Model', 
      'Serial Number', 
      'Type', 
      'Caliber', 
      'Acq Date', 
      'Acquired From (Name, Address, FFL)', 
      'Disp Date', 
      'Disposed To (Name, Address, FFL)'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Dark Slate #1E293B
      textColor: [248, 250, 252],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [15, 23, 42],
      cellPadding: 2,
      valign: 'top'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' }, // Line
      1: { cellWidth: 32 }, // Manufacturer
      2: { cellWidth: 26 }, // Model
      3: { cellWidth: 26, fontStyle: 'bold' }, // Serial
      4: { cellWidth: 18 }, // Type
      5: { cellWidth: 20 }, // Caliber
      6: { cellWidth: 20, halign: 'center' }, // Acq Date
      7: { cellWidth: 45 }, // Acq From
      8: { cellWidth: 20, halign: 'center' }, // Disp Date
      9: { cellWidth: 52 }  // Disp To
    },
    didDrawPage: () => {
      // Footer page numbering
      const totalPages = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : 1;
      const str = `Page ${totalPages}`;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text(str, 283 - doc.getTextWidth(str), 202);
      doc.text('OFFICIAL RECORD - KEEP COMPLIANT FOR ATF INSPECTION', 14, 202);
    }
  });

  // Generate ArrayBuffer and prompt with Native OS File Picker
  const pdfBlob = doc.output('blob');
  const fileName = `ATF_Bound_Book_${printDate.replace(/ /g, '_')}.pdf`;
  saveFileWithNativePicker(pdfBlob, fileName, 'ATF Bound Book Printable PDF (.pdf)', 'pdf');
}
