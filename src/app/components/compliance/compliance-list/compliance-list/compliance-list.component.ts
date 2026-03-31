import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplianceDisplay, ComplianceDto } from '../../../../../models/compliance.model';
import { ComplianceService } from '../../../../../services/compliance.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-compliance-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './compliance-list.component.html',
  styleUrls: ['./compliance-list.component.css']
})
export class ComplianceListComponent implements OnInit {

  complianceList: ComplianceDisplay[] = [];
  filteredCompliances: ComplianceDisplay[] = [];
  isLoading = true;
  errorMessage: string = '';

  // Filtres
  searchTerm: string = '';
  dateFilter: string = '';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // Math pour le template
  Math = Math;
  
   monthFilter: string = '';
  yearFilter: string = '';

  // ✅ Listes pour les selects
  availableMonths: { value: string; label: string }[] = [
    { value: '01', label: 'Janvier' },
    { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' },
    { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' },
    { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ];
  
  availableYears: number[] = [];

  constructor(
    private complianceService: ComplianceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllCompliance();
  }

  loadAllCompliance(): void {
    this.isLoading = true;
    this.complianceService.getAll2().subscribe({
      next: (res) => {
         console.log('Données reçues:', res);
        this.complianceList = res;
        this.applyFilters();
         this.generateAvailableYears();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur récupération conformité :', err);
        this.errorMessage = 'Impossible de récupérer la liste des conformités';
        this.isLoading = false;
      }
    });
  }
// ✅ Générer les années disponibles
  generateAvailableYears(): void {
    const years = new Set<number>();
    const currentYear = new Date().getFullYear();
    
    years.add(currentYear);
    years.add(currentYear - 1);
    
    this.complianceList.forEach(compliance => {
      if (compliance.createdAt) {
        const year = new Date(compliance.createdAt).getFullYear();
        years.add(year);
      }
      if (compliance.testDateTime) {
        const year = new Date(compliance.testDateTime).getFullYear();
        years.add(year);
      }
    });
    
    this.availableYears = Array.from(years).sort((a, b) => b - a);
  }
  // ============ FILTRES ============
  applyFilters(): void {
    this.filteredCompliances = this.complianceList.filter(compliance => {
      // Filtre par recherche textuelle
      if (this.searchTerm) {
        const searchStr = this.searchTerm.toLowerCase();
        const matchOrder = compliance.orderNumber?.toLowerCase().includes(searchStr) || false;
        const matchItem = compliance.orderitemNumber?.toLowerCase().includes(searchStr) || false;
        const matchTechnician = compliance.technicianName?.toLowerCase().includes(searchStr) || false;

        if (!matchOrder && !matchItem && !matchTechnician) {
          return false;
        }
      }

      // Filtre par date
      if (this.dateFilter && compliance.testDateTime) {
        const complianceDate = new Date(compliance.testDateTime).toISOString().split('T')[0];
        if (complianceDate !== this.dateFilter) {
          return false;
        }
      }
// ✅ NOUVEAU : Filtre par mois (testDateTime)
      if (this.monthFilter && compliance.testDateTime) {
        const complianceMonth = new Date(compliance.testDateTime).getMonth() + 1;
        const monthStr = complianceMonth.toString().padStart(2, '0');
        if (monthStr !== this.monthFilter) {
          return false;
        }
      }
      
      // ✅ NOUVEAU : Filtre par année (testDateTime)
      if (this.yearFilter && compliance.testDateTime) {
        const complianceYear = new Date(compliance.testDateTime).getFullYear();
        if (complianceYear.toString() !== this.yearFilter) {
          return false;
        }
      }

      return true;
    });

    this.totalPages = Math.ceil(this.filteredCompliances.length / this.pageSize);
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.dateFilter = '';
       this.monthFilter = '';
    this.yearFilter = '';
    this.filteredCompliances = [...this.complianceList];
    this.totalPages = Math.ceil(this.filteredCompliances.length / this.pageSize);
    this.currentPage = 1;
  }
   // ✅ Filtrer par mois
  filterByMonth(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.monthFilter = target.value;
    this.applyFilters();
  }

  // ✅ Filtrer par année
  filterByYear(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.yearFilter = target.value;
    this.applyFilters();
  }
 // ✅ Obtenir le libellé du mois
  getMonthLabel(monthValue: string): string {
    const month = this.availableMonths.find(m => m.value === monthValue);
    return month ? month.label : '';
  }
  // ============ PAGINATION ============
  get paginatedCompliances(): ComplianceDisplay[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredCompliances.slice(start, end);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredCompliances.length / this.pageSize);
  }

  // ============ CRUD ============
  deleteCompliance(id: number) {
    if (!id) return;
    if (!confirm('Voulez-vous vraiment supprimer cette fiche ?')) return;

    this.complianceService.deleteCompliance(id).subscribe({
      next: () => {
        this.complianceList = this.complianceList.filter(c => c.id && c.id !== id);
        this.applyFilters();
        alert('Fiche supprimée avec succès !');
      },
      error: (err) => {
        console.error('Erreur suppression :', err);
        alert('Erreur lors de la suppression !');
      }
    });
  }

  detailCompliance(id: number): void {
    this.router.navigate(['/compliance', id, 'detail']);
  }
  // ============ EXPORT EXCEL ============
  
// ✅ Export de toutes les fiches filtrées avec le même design que l'export individuel
async exportAllToExcel(): Promise<void> {
  if (this.filteredCompliances.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Conformités');

  // ===== ENTÊTE =====
  // Ligne 1: AA 3159
  worksheet.mergeCells(1, 1, 1, 28);
  const cellA1 = worksheet.getCell('A1');
  cellA1.value = 'AA 3159';
  cellA1.font = { bold: true, size: 14 };
  cellA1.alignment = { horizontal: 'left' };

  // Ligne 2: Enclosure 1 / 10.18
  worksheet.mergeCells(2, 1, 2, 28);
  const cellA2 = worksheet.getCell('A2');
  cellA2.value = 'Enclosure 1 / 10.18';
  cellA2.font = { italic: true, size: 10 };
  cellA2.alignment = { horizontal: 'left' };

  // Ligne 3: Page 1 of 1
  worksheet.mergeCells(3, 1, 3, 28);
  const cellA3 = worksheet.getCell('A3');
  cellA3.value = 'Page 1 of 1';
  cellA3.font = { italic: true, size: 10 };
  cellA3.alignment = { horizontal: 'right' };

  // Ligne 4: Quality surveillance of test modules
  worksheet.mergeCells(4, 1, 4, 28);
  const cellA4 = worksheet.getCell('A4');
  cellA4.value = 'Quality surveillance of test modules';
  cellA4.font = { bold: true, size: 12 };
  cellA4.alignment = { horizontal: 'center' };

  // Ligne 5: vide
  worksheet.addRow([]);

  // Ligne 6: Note
  worksheet.mergeCells(6, 1, 6, 28);
  const cellA6 = worksheet.getCell('A6');
  cellA6.value = 'Every single module has to be tested! (Even if it is a duplicate)';
  cellA6.font = { italic: true, size: 10, color: { argb: 'FF666666' } };
  cellA6.alignment = { horizontal: 'center' };

  // Ligne 7: vide
  worksheet.addRow([]);

  // ===== LIGNE 8: TITRES DES GROUPES =====
  // Position (colonne A)
  const cellA8 = worksheet.getCell('A8');
  cellA8.value = 'Position';
  
  // General: colonnes B à D (B, C, D)
  worksheet.mergeCells(8, 2, 8, 4);
  const cellB8 = worksheet.getCell('B8');
  cellB8.value = 'General:';
  
  // Identity code: colonnes E à I (E, F, G, H, I)
  worksheet.mergeCells(8, 5, 8, 9);
  const cellE8 = worksheet.getCell('E8');
  cellE8.value = 'Identity code:';
  
  // Inspection: colonnes J à X (J à X = 10 à 24)
  worksheet.mergeCells(8, 10, 8, 24);
  const cellJ8 = worksheet.getCell('J8');
  cellJ8.value = 'Inspection:';
  
  // Qualification result: colonnes Y à AA (Y, Z, AA = 25 à 27)
  worksheet.mergeCells(8, 25, 8, 27);
  const cellY8 = worksheet.getCell('Y8');
  cellY8.value = 'Qualification result:';
  
  // Remarks: colonne AB (28)
  const cellAB8 = worksheet.getCell('AB8');
  cellAB8.value = 'Remarks:';

  // Styler la ligne 8
  for (let col = 1; col <= 28; col++) {
    const cell = worksheet.getCell(8, col);
    cell.font = { bold: true, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4E73DF' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }
  worksheet.getRow(8).height = 25;

  // ===== LIGNE 9: SOUS-TITRES =====
  const subHeaders = [
    '',                     // A: Position
    'Order-Number:',        // B: General 1
    'Date & time of test:', // C: General 2
    'Name: (TT Technicien)',// D: General 3
    'RFID number:',         // E: Identity code 1
    'LEONI-part number:',   // F: Identity code 2
    'Index:',               // G: Identity code 3
    'Producer:',            // H: Identity code 4
    'Type:',                // I: Identity code 5
    'Sequence of test pins (OK / NOK)',      // J: Inspection 1
    'Coding request (OK / NOK)',             // K: Inspection 2
    'Secondary locking (OK / NOK)',          // L: Inspection 3
    'Offset test (in mm)',                   // M: Inspection 4
    'Stable offset test (in mm)',            // N: Inspection 5
    'Displacement path (for Push back) (in mm)', // O: Inspection 6
    'Housing attachments (OK / NOK)',        // P: Inspection 7
    'Max. Leak test (in mbar)',              // Q: Inspection 8
    'Adjustment leak test (in mbar)',        // R: Inspection 9
    'Colour verification (OK / NOK)',        // S: Inspection 10
    'Terminal alignment (OK / NOK)',         // T: Inspection 11
    'Open shunts (Airbag test) (OK / NOK)',  // U: Inspection 12
    'Spacer Closing Unit (OK / NOK)',        // V: Inspection 13
    'Special functions (OK / NOK)',          // W: Inspection 14
    'Contact problems (jiggle wiggle) (%) - recommendation 25 times', // X: Inspection 15
    'Qualified test module',                 // Y: Qualification 1
    'Conditionally qualified test module',   // Z: Qualification 2
    'Not qualified test module',             // AA: Qualification 3
    'Remarks:'                               // AB: Remarks
  ];

  for (let col = 1; col <= subHeaders.length; col++) {
    const cell = worksheet.getCell(9, col);
    cell.value = subHeaders[col - 1];
    cell.font = { bold: true, size: 10 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE9ECEF' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  }
  worksheet.getRow(9).height = 50;

  // ===== DÉFINIR LES LARGEURS DES COLONNES =====
  const colWidths = [
    8,   // A: Position
    15,  // B: Order-Number
    15,  // C: Date & time
    15,  // D: Name
    15,  // E: RFID number
    18,  // F: LEONI-part number
    8,   // G: Index
    12,  // H: Producer
    10,  // I: Type
    20,  // J: Sequence of test pins
    18,  // K: Coding request
    18,  // L: Secondary locking
    15,  // M: Offset test
    15,  // N: Stable offset test
    20,  // O: Displacement path
    18,  // P: Housing attachments
    15,  // Q: Max. Leak test
    15,  // R: Adjustment leak test
    18,  // S: Colour verification
    18,  // T: Terminal alignment
    20,  // U: Open shunts
    18,  // V: Spacer Closing Unit
    18,  // W: Special functions
    20,  // X: Contact problems
    15,  // Y: Qualified
    18,  // Z: Conditionally qualified
    12,  // AA: Not qualified
    20   // AB: Remarks
  ];

  for (let i = 0; i < colWidths.length; i++) {
    worksheet.getColumn(i + 1).width = colWidths[i];
  }

  // ===== AJOUT DES DONNÉES =====
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatBoolean = (value: boolean | undefined): string => {
    if (value === undefined) return '-';
    return value ? '✓' : '✗';
  };

  const formatOkNok = (value: string | undefined): string => {
    if (!value) return '-';
    return value === 'OK' || value === 'Ok' || value === 'ok' ? 'OK' : 'NOK';
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    return String(value).replace('.', ',');
  };

  // Pour chaque fiche
  for (let idx = 0; idx < this.filteredCompliances.length; idx++) {
    const c = this.filteredCompliances[idx];
    
    const rowData = [
      (idx + 1).toString(),                   // A: Position
      c.orderNumber || '-',                   // B: Order-Number
      formatDate(c.testDateTime),             // C: Date & time of test
      c.technicianName || '-',                // D: Name
      c.rfidNumber || '-',                    // E: RFID number
      c.leoniPartNumber || '-',               // F: LEONI-part number
      (c as any).indexValue !== undefined ? (c as any).indexValue : '-', // G: Index
      c.producer || '-',                      // H: Producer
      c.type || '-',                          // I: Type
      formatOkNok(c.sequenceTestPins),        // J: Sequence of test pins
      formatOkNok(c.codingRequest),           // K: Coding request
      formatOkNok(c.secondaryLocking),        // L: Secondary locking
      formatValue(c.offsetTestMm),            // M: Offset test
      formatValue(c.stableOffsetTestMm),      // N: Stable offset test
      formatValue(c.displacementPathPushBackMm), // O: Displacement path
      formatOkNok(c.housingAttachments),      // P: Housing attachments
      formatValue(c.maxLeakTestMbar),         // Q: Max. Leak test
      formatValue(c.adjustmentLeakTestMbar),  // R: Adjustment leak test
      formatOkNok(c.colourVerification),      // S: Colour verification
      formatOkNok(c.terminalAlignment),       // T: Terminal alignment
      formatOkNok(c.openShuntsAirbag),        // U: Open shunts
      formatOkNok(c.spacerClosingUnit),       // V: Spacer Closing Unit
      formatOkNok(c.specialFunctions),        // W: Special functions
      c.contactProblemsPercentage !== undefined ? c.contactProblemsPercentage + '%' : '-', // X: Contact problems
      formatBoolean(c.qualifiedTestModule),   // Y: Qualified
      formatBoolean(c.conditionallyQualifiedTestModule), // Z: Conditionally qualified
      formatBoolean(c.notQualifiedTestModule), // AA: Not qualified
      c.remarks || '-'                        // AB: Remarks
    ];

    const dataRow = worksheet.addRow(rowData);
    dataRow.height = 25;

    // ===== STYLES POUR LES CELLULES DE DONNÉES =====
    // Colonnes OK/NOK: J, K, L, P, S, T, U, V, W (10, 11, 12, 16, 19, 20, 21, 22, 23)
    const okNokColumns = [10, 11, 12, 16, 19, 20, 21, 22, 23];
    // Colonnes qualification: Y, Z, AA (25, 26, 27)
    const qualificationColumns = [25, 26, 27];

    for (let col = 1; col <= rowData.length; col++) {
      const cell = dataRow.getCell(col);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      if (okNokColumns.includes(col)) {
        const value = cell.value;
        if (value === 'OK') {
          cell.font = { color: { argb: 'FF27AE60' }, bold: true };
        } else if (value === 'NOK') {
          cell.font = { color: { argb: 'FFE74C3C' }, bold: true };
        }
      }
      
      if (qualificationColumns.includes(col)) {
        const value = cell.value;
        if (value === '✓') {
          cell.font = { color: { argb: 'FF27AE60' }, bold: true };
        } else if (value === '✗') {
          cell.font = { color: { argb: 'FFE74C3C' }, bold: true };
        }
      }
    }

    // Alternance des couleurs pour les lignes
    if ((idx + 1) % 2 === 0) {
      for (let col = 1; col <= rowData.length; col++) {
        const cell = dataRow.getCell(col);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F9FA' }
        };
      }
    }
  }

  // ===== AJOUTER DES BORDURES =====
  const startRow = 8;
  const endRow = worksheet.rowCount;
  const maxCol = 28;

  for (let i = startRow; i <= endRow; i++) {
    for (let j = 1; j <= maxCol; j++) {
      const cell = worksheet.getCell(i, j);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
      };
    }
  }

  // ===== GÉNÉRER LE FICHIER =====
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const fileName = `Conformites_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(blob, fileName);
  
  alert(`✅ Export terminé avec succès : ${this.filteredCompliances.length} fiche(s) exportée(s)`);
}
// ✅ Export d'une seule fiche de conformité avec en-têtes groupés corrigés
async exportOneToExcel(compliance: ComplianceDisplay): Promise<void> {
  if (!compliance || !compliance.id) {
    alert('Données invalides pour l\'export');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Conformité');

  // ===== ENTÊTE =====
 
  // Ligne 4: Quality surveillance of test modules
  worksheet.mergeCells(4, 1, 4, 35);
  const cellA4 = worksheet.getCell('A4');
  cellA4.value = 'Quality surveillance of test modules';
  cellA4.font = { bold: true, size: 12 };
  cellA4.alignment = { horizontal: 'center' };

  // Ligne 5: vide
  worksheet.addRow([]);

  // ===== LIGNE 7: TITRES DES GROUPES (LIGNE 7) =====
  // Position (colonne A)
  const cellA7 = worksheet.getCell('A7');
  cellA7.value = 'Position';
  
  // General: colonnes B à E (B, C, D, E)
  worksheet.mergeCells(7, 2, 7, 4);
  const cellB7 = worksheet.getCell('B7');
  cellB7.value = 'General:';
  
  // Identity code: colonnes F à L (F, G, H, I, J, K, L)
  worksheet.mergeCells(7, 5, 7, 9);
  const cellF7 = worksheet.getCell('E7');
  cellF7.value = 'Identity code:';
  
  // Inspection: colonnes M à AB (M à AB = 13 à 28)
  worksheet.mergeCells(7, 10, 7, 24);
  const cellM7 = worksheet.getCell('J7');
  cellM7.value = 'Inspection:';
  
  // Qualification result: colonnes AC à AE (AC, AD, AE = 29 à 31)
  worksheet.mergeCells(7, 25, 7, 27);
  const cellAC7 = worksheet.getCell('Y7');
  cellAC7.value = 'Qualification result:';
  
  // Remarks: colonne AG (33)
  const cellAG7 = worksheet.getCell('AB7');
  cellAG7.value = 'Remarks:';

  // Styler la ligne 7
  for (let col = 1; col <= 33; col++) {
    const cell = worksheet.getCell(7, col);
    cell.font = { bold: true, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4E73DF' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }
  worksheet.getRow(7).height = 25;

  // ===== LIGNE 8: SOUS-TITRES =====
  const subHeaders = [
    '',                     // A: Position (déjà)
    'Order-Number:',        // B: General 1
    'Date & time of test:', // C: General 2
    'Name: (TT Technicien)',// D: General 3
                         // E: vide
    'RFID number:',         // F: Identity code 1
    'LEONI-part number:',   // G: Identity code 2
                        // H: vide
    'Index:',               // I: Identity code 3
    'Producer:',            // J: Identity code 4
    'Type:',                // K: Identity code 5
                    // L: vide
    'Sequence of test pins (OK / NOK)',      // M: Inspection 1
    'Coding request (OK / NOK)',             // N: Inspection 2
    'Secondary locking (OK / NOK)',          // O: Inspection 3
    'Offset test (in mm)',                   // P: Inspection 4
    'Stable offset test (in mm)',            // Q: Inspection 5
    'Displacement path (for Push back) (in mm)', // R: Inspection 6
    'Housing attachments (OK / NOK)',        // S: Inspection 7
    'Max. Leak test (in mbar)',              // T: Inspection 8
    'Adjustment leak test (in mbar)',        // U: Inspection 9
    'Colour verification (OK / NOK)',        // V: Inspection 10
    'Terminal alignment (OK / NOK)',         // W: Inspection 11
    'Open shunts (Airbag test) (OK / NOK)',  // X: Inspection 12
    'Spacer Closing Unit (OK / NOK)',        // Y: Inspection 13
    'Special functions (OK / NOK)',          // Z: Inspection 14
    'Contact problems (jiggle wiggle) (%) - recommendation 25 times', // AA: Inspection 15
    'Qualified test module',                 // AB: Qualification 1
    'Conditionally qualified test module',   // AC: Qualification 2
    'Not qualified test module',             // AD: Qualification 3
                                        // AE: vide
    'Remarks:'                               // AF: Remarks
  ];

  for (let col = 1; col <= subHeaders.length; col++) {
    const cell = worksheet.getCell(8, col);
    cell.value = subHeaders[col - 1];
    cell.font = { bold: true, size: 10 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE9ECEF' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  }
  worksheet.getRow(8).height = 50;

  // ===== DÉFINIR LES LARGEURS DES COLONNES =====
  const colWidths = [
    8,   // A: Position
    15,  // B: Order-Number
    15,  // C: Date & time
    15,  // D: Name
    15,  // F: RFID number
    18,  // G: LEONI-part number
    8,   // I: Index
    12,  // J: Producer
    10,  // K: Type
    20,  // M: Sequence of test pins
    18,  // N: Coding request
    18,  // O: Secondary locking
    15,  // P: Offset test
    15,  // Q: Stable offset test
    20,  // R: Displacement path
    18,  // S: Housing attachments
    15,  // T: Max. Leak test
    15,  // U: Adjustment leak test
    18,  // V: Colour verification
    18,  // W: Terminal alignment
    20,  // X: Open shunts
    18,  // Y: Spacer Closing Unit
    18,  // Z: Special functions
    20,  // AA: Contact problems
    15,  // AB: Qualified
    18,  // AC: Conditionally qualified
    12,  // AD: Not qualified
    20   // AF: Remarks
  ];

  for (let i = 0; i < colWidths.length; i++) {
    worksheet.getColumn(i + 1).width = colWidths[i];
  }

  // ===== AJOUT DES DONNÉES =====
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatBoolean = (value: boolean | undefined): string => {
    if (value === undefined) return '-';
    return value ? '✓' : '✗';
  };

  const formatOkNok = (value: string | undefined): string => {
    if (!value) return '-';
    return value === 'OK' || value === 'Ok' || value === 'ok' ? 'OK' : 'NOK';
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    return String(value).replace('.', ',');
  };

  // Données de la fiche
  const rowData = [
    '1',                                    // A: Position
    compliance.orderNumber || '-',          // B: Order-Number
    formatDate(compliance.testDateTime),    // C: Date & time of test
    compliance.technicianName || '-',       // D: Name
                                        // E: vide
    compliance.rfidNumber || '-',           // F: RFID number
    compliance.leoniPartNumber || '-',      // G: LEONI-part number
                                        // H: vide
    (compliance as any).indexValue !== undefined ? (compliance as any).indexValue : '-', // I: Index
    compliance.producer || '-',             // J: Producer
    compliance.type || '-',                 // K: Type
                                         // L: vide
    formatOkNok(compliance.sequenceTestPins),           // M: Sequence of test pins
    formatOkNok(compliance.codingRequest),              // N: Coding request
    formatOkNok(compliance.secondaryLocking),           // O: Secondary locking
    formatValue(compliance.offsetTestMm),               // P: Offset test
    formatValue(compliance.stableOffsetTestMm),         // Q: Stable offset test
    formatValue(compliance.displacementPathPushBackMm), // R: Displacement path
    formatOkNok(compliance.housingAttachments),         // S: Housing attachments
    formatValue(compliance.maxLeakTestMbar),            // T: Max. Leak test
    formatValue(compliance.adjustmentLeakTestMbar),     // U: Adjustment leak test
    formatOkNok(compliance.colourVerification),         // V: Colour verification
    formatOkNok(compliance.terminalAlignment),          // W: Terminal alignment
    formatOkNok(compliance.openShuntsAirbag),           // X: Open shunts
    formatOkNok(compliance.spacerClosingUnit),          // Y: Spacer Closing Unit
    formatOkNok(compliance.specialFunctions),           // Z: Special functions
    compliance.contactProblemsPercentage !== undefined ? compliance.contactProblemsPercentage + '%' : '-', // AA: Contact problems
    formatBoolean(compliance.qualifiedTestModule),              // AB: Qualified
    formatBoolean(compliance.conditionallyQualifiedTestModule), // AC: Conditionally qualified
    formatBoolean(compliance.notQualifiedTestModule),           // AD: Not qualified
                                        // AE: vide
    compliance.remarks || '-'                // AF: Remarks
  ];

  const dataRow = worksheet.addRow(rowData);
  dataRow.height = 25;

  // ===== STYLES POUR LES CELLULES DE DONNÉES =====
  const okNokColumns = [10, 11, 12, 13, 14, 15, 16, 17, 18]; // M, N, O, S, V, W, X, Y, Z
  const qualificationColumns = [27, 28, 29]; // AB, AC, AD

  for (let col = 1; col <= rowData.length; col++) {
    const cell = dataRow.getCell(col);
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    if (okNokColumns.includes(col)) {
      const value = cell.value;
      if (value === 'OK') {
        cell.font = { color: { argb: 'FF27AE60' }, bold: true };
      } else if (value === 'NOK') {
        cell.font = { color: { argb: 'FFE74C3C' }, bold: true };
      }
    }
    
    if (qualificationColumns.includes(col)) {
      const value = cell.value;
      if (value === '✓') {
        cell.font = { color: { argb: 'FF27AE60' }, bold: true };
      } else if (value === '✗') {
        cell.font = { color: { argb: 'FFE74C3C' }, bold: true };
      }
    }
  }

  // ===== AJOUTER DES BORDURES =====
  for (let i = 7; i <= worksheet.rowCount; i++) {
    for (let j = 1; j <= rowData.length; j++) {
      const cell = worksheet.getCell(i, j);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
      };
    }
  }

  // ===== GÉNÉRER LE FICHIER =====
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const fileName = `Conformite_${compliance.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(blob, fileName);
  
  alert(`✅ Export terminé avec succès : Fiche #${compliance.id}`);
}
}
