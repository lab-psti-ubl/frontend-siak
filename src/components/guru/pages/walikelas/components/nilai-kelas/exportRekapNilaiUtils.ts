import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { User, Nilai, MataPelajaran } from '../../../../../../types';

interface RekapNilaiData {
  murid: User;
  nilaiPerMapel: { [mapelId: string]: number | null };
  rataRata?: number | null;
}

export const exportRekapNilaiPDF = (
  rekapData: RekapNilaiData[],
  sortedMapel: string[],
  mataPelajaran: MataPelajaran[],
  namaKelas: string,
  tahunAjaran: string,
  semester: number,
  namaWaliKelas: string
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const semesterLabel = semester === 1 ? 'Ganjil' : 'Genap';

  doc.setFontSize(16);
  doc.text('REKAP NILAI SEMESTER', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.text(`Kelas: ${namaKelas}`, 20, 30);
  doc.text(`Tahun Ajaran: ${tahunAjaran}`, 20, 37);
  doc.text(`Semester: ${semesterLabel}`, 20, 44);
  doc.text(`Wali Kelas: ${namaWaliKelas}`, 20, 51);

  // Calculate column widths first
  const columnStyles: any = {
    0: { halign: 'center', cellWidth: 10 },
    1: { halign: 'center', cellWidth: 25 },
    2: { halign: 'left', cellWidth: 40 },
  };

  const mapelColumnWidth = sortedMapel.length > 0 
    ? (pageWidth - 75 - 40 - 30) / sortedMapel.length // Subtract 30 for Rata-Rata column
    : 30;
  
  const mapelColumnWidths: number[] = [];
  sortedMapel.forEach((_, idx) => {
    const width = Math.max(25, Math.min(mapelColumnWidth, 35));
    columnStyles[3 + idx] = { halign: 'center', cellWidth: width };
    mapelColumnWidths.push(width);
  });

  // Add Rata-Rata column style
  columnStyles[3 + sortedMapel.length] = { halign: 'center', cellWidth: 30 };

  // Calculate positions for merged header
  const marginLeft = 20;
  const firstMapelColX = marginLeft + 10 + 25 + 40; // After No, NISN, Nama columns
  const mapelTotalWidth = mapelColumnWidths.reduce((sum, w) => sum + w, 0);

  // Prepare table headers - use 2 rows approach
  const headerRow1: any[] = ['No', 'NISN', 'Nama Murid'];
  const headerRow2: any[] = ['', '', ''];
  
  sortedMapel.forEach((mapelId) => {
    const mapel = mataPelajaran.find(m => m.id === mapelId);
    headerRow1.push('');
    headerRow2.push(mapel?.name || 'Unknown');
  });

  // Add Rata-Rata header
  headerRow1.push('Rata-Rata');
  headerRow2.push('');

  // Prepare table data
  const tableData = rekapData.map((data, idx) => {
    const row: any[] = [
      idx + 1,
      data.murid.nisn || '-',
      data.murid.name
    ];
    
    sortedMapel.forEach((mapelId) => {
      const nilaiAkhir = data.nilaiPerMapel[mapelId];
      row.push(nilaiAkhir != null ? nilaiAkhir.toFixed(1) : '-');
    });

    // Add Rata-Rata
    const rataRata = data.rataRata != null ? data.rataRata.toFixed(1) : '-';
    row.push(rataRata);
    
    return row;
  });

  let startY = 60;

  // Prepare header rows with proper structure
  // First row:
  // - "No", "NISN", "Nama Murid" (will be rowSpan = 2 via didParseCell)
  // - "Nilai Akhir Mata Pelajaran" spanning all mapel columns
  // - "Rata-Rata" (will be rowSpan = 2 via didParseCell)
  const headerRow1Final: any[] = ['No', 'NISN', 'Nama Murid'];
  const headerRow2Final: any[] = ['', '', ''];
  
  // Add "Nilai Akhir Mata Pelajaran" in first mapel column, empty strings for others
  headerRow1Final.push('Nilai Akhir Mata Pelajaran');
  for (let i = 1; i < sortedMapel.length; i++) {
    headerRow1Final.push(''); // Empty cells - text will be centered across all
  }
  
  // Add mapel names to second row
  sortedMapel.forEach((mapelId) => {
    const mapel = mataPelajaran.find(m => m.id === mapelId);
    headerRow2Final.push(mapel?.name || 'Unknown');
  });

  // Add Rata-Rata header
  headerRow1Final.push('Rata-Rata');
  headerRow2Final.push('');

  // Add specific column style for first mapel column to center align "Nilai Akhir Mata Pelajaran"
  const headerRowStyles: any = {};
  headerRowStyles[3] = { halign: 'center' }; // Center align first mapel column

  // Draw table with 2 header rows
  (doc as any).autoTable({
    head: [headerRow1Final, headerRow2Final],
    body: tableData,
    startY: startY,
    theme: 'grid', // Add grid theme for borders on all cells
    styles: { 
      fontSize: 8,
      cellPadding: 2,
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    headStyles: { 
      fillColor: [211, 211, 211], 
      textColor: 0, 
      fontStyle: 'bold', 
      halign: 'center',
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    columnStyles,
    margin: { left: marginLeft, right: 20 },
    // didParseCell is used to control rowSpan / colSpan for header cells
    didParseCell: (data: any) => {
      if (data.section === 'head') {
        const colIndex = data.column.index;
        const rowIndex = data.row.index;

        // Make "No", "NISN", "Nama Murid" span 2 header rows (like single-row header)
        if (rowIndex === 0 && colIndex <= 2) {
          data.cell.rowSpan = 2;
          data.cell.styles.valign = 'middle';
        }

        // Hide content of the second header row for first 3 columns
        if (rowIndex === 1 && colIndex <= 2) {
          data.cell.text = [];
        }

        // Make "Rata-Rata" span 2 header rows
        const rataRataColIndex = 3 + sortedMapel.length;
        if (rowIndex === 0 && colIndex === rataRataColIndex) {
          data.cell.rowSpan = 2;
          data.cell.styles.valign = 'middle';
        }

        // Hide content of the second header row for Rata-Rata column
        if (rowIndex === 1 && colIndex === rataRataColIndex) {
          data.cell.text = [];
        }

        // Horizontally span "Nilai Akhir Mata Pelajaran" across all mapel columns
        if (rowIndex === 0 && colIndex === 3) {
          data.cell.colSpan = Math.max(1, sortedMapel.length);
          data.cell.styles.halign = 'center';
        }

        // For first row, hide text in extra mapel header cells after the first one
        if (rowIndex === 0 && colIndex > 3 && colIndex < 3 + sortedMapel.length) {
          data.cell.text = [];
        }
      }
    }
  });

  const filename = `Rekap_Nilai_Semester_${namaKelas}_${tahunAjaran}_Semester_${semester}`;
  doc.save(`${filename}.pdf`);
};

export const exportRekapNilaiExcel = (
  rekapData: RekapNilaiData[],
  sortedMapel: string[],
  mataPelajaran: MataPelajaran[],
  namaKelas: string,
  tahunAjaran: string,
  semester: number,
  namaWaliKelas: string
) => {
  const wb = XLSX.utils.book_new();
  const wsData: any[] = [];

  const semesterLabel = semester === 1 ? 'Ganjil' : 'Genap';

  wsData.push(['REKAP NILAI SEMESTER']);
  wsData.push([]);
  wsData.push([`Kelas: ${namaKelas}`]);
  wsData.push([`Tahun Ajaran: ${tahunAjaran}`]);
  wsData.push([`Semester: ${semesterLabel}`]);
  wsData.push([`Wali Kelas: ${namaWaliKelas}`]);
  wsData.push([]);

  // Create header with 2 rows
  const headerRow1: any[] = ['No', 'NISN', 'Nama Murid', '', ...Array(sortedMapel.length - 1).fill(''), 'Rata-Rata'];
  const headerRow2: any[] = ['', '', '', ...sortedMapel.map(mapelId => {
    const mapel = mataPelajaran.find(m => m.id === mapelId);
    return mapel?.name || 'Unknown';
  }), ''];

  // Merge cells for "Nilai Akhir Mata Pelajaran" header
  wsData.push(headerRow1);
  wsData.push(headerRow2);
  
  // Update headerRow1 to have merged text
  const mapelStartCol = 3; // Column D (0-indexed: 3)
  headerRow1[mapelStartCol] = 'Nilai Akhir Mata Pelajaran';

  // Add data rows
  rekapData.forEach((data, idx) => {
    const row: any[] = [
      idx + 1,
      data.murid.nisn || '-',
      data.murid.name
    ];
    
    sortedMapel.forEach((mapelId) => {
      const nilaiAkhir = data.nilaiPerMapel[mapelId];
      row.push(nilaiAkhir != null ? nilaiAkhir.toFixed(1) : '-');
    });

    // Add Rata-Rata
    const rataRata = data.rataRata != null ? data.rataRata.toFixed(1) : '-';
    row.push(rataRata);
    
    wsData.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merge cells for header "Nilai Akhir Mata Pelajaran"
  if (sortedMapel.length > 0) {
    const mergeRange = {
      s: { r: 7, c: mapelStartCol }, // Row 8 (0-indexed: 7), Column D
      e: { r: 7, c: mapelStartCol + sortedMapel.length - 1 } // Same row, last mapel column
    };
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push(mergeRange);

    // Merge first three columns vertically across the two header rows
    // So "No", "NISN", and "Nama Murid" each occupy a single merged cell (2-row height)
    for (let col = 0; col < 3; col++) {
      ws['!merges'].push({
        s: { r: 7, c: col }, // start at first header row
        e: { r: 8, c: col }  // end at second header row
      });
    }

    // Merge Rata-Rata column vertically across the two header rows
    const rataRataCol = mapelStartCol + sortedMapel.length;
    ws['!merges'].push({
      s: { r: 7, c: rataRataCol }, // start at first header row
      e: { r: 8, c: rataRataCol }  // end at second header row
    });
  }

  // Set column widths
  const colWidths: XLSX.ColInfo[] = [
    { wch: 5 }, // No
    { wch: 15 }, // NISN
    { wch: 30 }, // Nama Murid
  ];
  sortedMapel.forEach(() => {
    colWidths.push({ wch: 20 }); // Each mata pelajaran column
  });
  colWidths.push({ wch: 15 }); // Rata-Rata column
  ws['!cols'] = colWidths;

  // Style header rows - use gray background to match table style
  const headerRowIndex1 = 7; // First header row (0-indexed)
  const headerRowIndex2 = 8; // Second header row (0-indexed)

  // Style first header row (No, NISN, Nama Murid)
  for (let col = 0; col < 3; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex1, c: col });
    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: headerRow1[col] };
    if (!ws[cellRef].s) ws[cellRef].s = {};
    ws[cellRef].s.fill = { fgColor: { rgb: 'FFD3D3D3' } }; // Gray background
    ws[cellRef].s.font = { bold: true, color: { rgb: 'FF000000' } }; // Black text
    ws[cellRef].s.alignment = { horizontal: 'center', vertical: 'center' };
  }
  
  // Style merged header cell for "Nilai Akhir Mata Pelajaran" - ensure center alignment
  for (let col = mapelStartCol; col < mapelStartCol + sortedMapel.length; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex1, c: col });
    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: headerRow1[mapelStartCol] };
    if (!ws[cellRef].s) ws[cellRef].s = {};
    ws[cellRef].s.fill = { fgColor: { rgb: 'FFD3D3D3' } }; // Gray background
    ws[cellRef].s.font = { bold: true, color: { rgb: 'FF000000' } }; // Black text
    ws[cellRef].s.alignment = { horizontal: 'center', vertical: 'center', wrapText: false };
  }
  
  // Ensure the merged cell (first cell) has the text and is centered
  const firstMergedCellRef = XLSX.utils.encode_cell({ r: headerRowIndex1, c: mapelStartCol });
  if (ws[firstMergedCellRef]) {
    if (!ws[firstMergedCellRef].s) ws[firstMergedCellRef].s = {};
    ws[firstMergedCellRef].s.alignment = { horizontal: 'center', vertical: 'center', wrapText: false };
  }

  // Style second header row (mata pelajaran names)
  sortedMapel.forEach((_, idx) => {
    const col = mapelStartCol + idx;
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex2, c: col });
    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: headerRow2[col] };
    if (!ws[cellRef].s) ws[cellRef].s = {};
    ws[cellRef].s.fill = { fgColor: { rgb: 'FFD3D3D3' } }; // Gray background
    ws[cellRef].s.font = { bold: true, color: { rgb: 'FF000000' } }; // Black text
    ws[cellRef].s.alignment = { horizontal: 'center', vertical: 'center' };
  });
  
  // Also style the first 3 columns in second row
  for (let col = 0; col < 3; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex2, c: col });
    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
    if (!ws[cellRef].s) ws[cellRef].s = {};
    ws[cellRef].s.fill = { fgColor: { rgb: 'FFD3D3D3' } }; // Gray background
    ws[cellRef].s.alignment = { horizontal: 'center', vertical: 'center' };
  }

  // Style Rata-Rata column header
  const rataRataCol = mapelStartCol + sortedMapel.length;
  const rataRataCellRef = XLSX.utils.encode_cell({ r: headerRowIndex1, c: rataRataCol });
  if (!ws[rataRataCellRef]) ws[rataRataCellRef] = { t: 's', v: 'Rata-Rata' };
  if (!ws[rataRataCellRef].s) ws[rataRataCellRef].s = {};
  ws[rataRataCellRef].s.fill = { fgColor: { rgb: 'FFD3D3D3' } }; // Gray background
  ws[rataRataCellRef].s.font = { bold: true, color: { rgb: 'FF000000' } }; // Black text
  ws[rataRataCellRef].s.alignment = { horizontal: 'center', vertical: 'center' };

  // Style Rata-Rata column in second header row
  const rataRataCellRef2 = XLSX.utils.encode_cell({ r: headerRowIndex2, c: rataRataCol });
  if (!ws[rataRataCellRef2]) ws[rataRataCellRef2] = { t: 's', v: '' };
  if (!ws[rataRataCellRef2].s) ws[rataRataCellRef2].s = {};
  ws[rataRataCellRef2].s.fill = { fgColor: { rgb: 'FFD3D3D3' } }; // Gray background
  ws[rataRataCellRef2].s.alignment = { horizontal: 'center', vertical: 'center' };

  // Style title row
  const titleCellRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
  if (ws[titleCellRef]) {
    if (!ws[titleCellRef].s) ws[titleCellRef].s = {};
    ws[titleCellRef].s.font = { bold: true, size: 14 };
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Nilai');
  const filename = `Rekap_Nilai_Semester_${namaKelas}_${tahunAjaran}_Semester_${semester}`;
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

