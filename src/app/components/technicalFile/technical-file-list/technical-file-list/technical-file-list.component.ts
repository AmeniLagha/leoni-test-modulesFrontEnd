// technical-file-list.component.ts
import { Component, OnInit } from '@angular/core';
import { TechnicalFileService } from '../../../../../services/technical-file.service';
import { TechnicalFileDetail } from '../../../../../models/technical-file.model';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-technical-file-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './technical-file-list.component.html',
  styleUrls: ['./technical-file-list.component.css']
})
export class TechnicalFileListComponent implements OnInit {

  technicalFiles: TechnicalFileDetail[] = [];
  filteredFiles: TechnicalFileDetail[] = [];
  loading = false;
  error: string | null = null;
  currentUserRole: string = '';
 // ==================== RECHERCHE ====================
  searchTerm: string = '';
  // ==================== FILTRES PAR PÉRIODE ====================
  monthFilter: string = '';
  yearFilter: string = '';
  // ==================== LISTES POUR LES SELECTS ====================
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
  // ==================== ÉTAT DES DOSSIERS PLIABLES ====================
  expandedFolders: { [key: number]: boolean } = {};

  // ==================== ÉDITION INLINE DE LA RÉFÉRENCE ====================
  editingRefId: number | null = null;
  editRefValue: string = '';

  constructor(
    private service: TechnicalFileService,
    private router: Router
  ) {}

  ngOnInit() {
     this.currentUserRole = localStorage.getItem('userRole') || '';
  console.log('Rôle utilisateur:', this.currentUserRole); // ✅ AJOUTER
    this.loadAllTechnicalFiles();
  }

  // technical-file-list.component.ts - Version corrigée

loadAllTechnicalFiles() {
  this.loading = true;
  this.service.getAllDetailed().subscribe({
    next: (files) => {
      this.technicalFiles = files;

      // ✅ 1. D'abord, assigner les données
      // ✅ 2. Initialiser tous les dossiers comme fermés
      files.forEach(file => {
        this.expandedFolders[file.id] = false;
      });

      // ✅ 3. Générer les années disponibles
      this.generateAvailableYears();

      // ✅ 4. ENFIN, appliquer les filtres (maintenant que technicalFiles est rempli)
      this.applyFilters();

      this.loading = false;
    },
    error: (err) => {
      console.error('Erreur chargement:', err);
      this.error = 'Impossible de charger les dossiers techniques';
      this.loading = false;
    }
  });
}
  // ==================== GÉNÉRER LES ANNÉES DISPONIBLES ====================
  generateAvailableYears(): void {
    const years = new Set<number>();
    const currentYear = new Date().getFullYear();

    years.add(currentYear);
    years.add(currentYear - 1);

    this.technicalFiles.forEach(file => {
      if (file.createdAt) {
        const year = new Date(file.createdAt).getFullYear();
        years.add(year);
      }
    });

    this.availableYears = Array.from(years).sort((a, b) => b - a);
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
 // ==================== FONCTIONS DE RECHERCHE ====================
  // technical-file-list.component.ts

applyFilters(): void {
  // Si aucun fichier n'est chargé, ne rien faire
  if (!this.technicalFiles || this.technicalFiles.length === 0) {
    this.filteredFiles = [];
    return;
  }

  this.filteredFiles = this.technicalFiles.filter(file => {
    // Filtre par recherche textuelle (seulement si searchTerm a du contenu)
    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      const matchRef = file.reference?.toLowerCase().includes(term) || false;
      const matchCreatedBy = file.createdBy?.toLowerCase().includes(term) || false;
      if (!matchRef && !matchCreatedBy) {
        return false;
      }
    }

    // Filtre par année
    if (this.yearFilter && file.createdAt) {
      const fileYear = new Date(file.createdAt).getFullYear();
      if (fileYear.toString() !== this.yearFilter) {
        return false;
      }
    }

    // Filtre par mois
    if (this.monthFilter && file.createdAt) {
      const fileMonth = new Date(file.createdAt).getMonth() + 1;
      const monthStr = fileMonth.toString().padStart(2, '0');
      if (monthStr !== this.monthFilter) {
        return false;
      }
    }

    return true;
  });
}


  clearSearch() {
    this.searchTerm = '';
    this.filteredFiles = this.technicalFiles;
  }
   // ✅ Réinitialiser tous les filtres
  resetFilters(): void {
    this.searchTerm = '';
    this.monthFilter = '';
    this.yearFilter = '';
    this.applyFilters();
  }

  // ✅ Obtenir le libellé du mois
  getMonthLabel(monthValue: string): string {
    const month = this.availableMonths.find(m => m.value === monthValue);
    return month ? month.label : '';
  }

  // Fonction pour surligner le texte recherché
  highlightText(text: string): string {
    if (!this.searchTerm || !text) return text;

    const term = this.searchTerm.toLowerCase().trim();
    const textLower = text.toLowerCase();

    if (!textLower.includes(term)) return text;

    const index = textLower.indexOf(term);
    const before = text.substring(0, index);
    const match = text.substring(index, index + term.length);
    const after = text.substring(index + term.length);

    return `${before}<span style="background-color: #fef3c7; color: #92400e; font-weight: 600; padding: 2px 0;">${match}</span>${after}`;
  }

  // ==================== GESTION DES DOSSIERS PLIABLES ====================
  toggleFolder(fileId: number) {
    this.expandedFolders[fileId] = !this.expandedFolders[fileId];
  }

  // ==================== ACTIONS SUR LES DOSSIERS ====================

  // ✅ Édition inline de la référence
  startEditReference(file: any) {
    this.editingRefId = file.id;
    this.editRefValue = file.reference || '';
  }

  cancelEditReference() {
    this.editingRefId = null;
    this.editRefValue = '';
  }

  saveReferenceInline(fileId: number) {
    if (!this.editRefValue || this.editRefValue.trim() === '') {
      alert('La référence ne peut pas être vide');
      return;
    }

    const updateDto = {
      reference: this.editRefValue.trim()
    };

    this.service.update(fileId, updateDto).subscribe({
      next: () => {
        this.editingRefId = null;
        this.editRefValue = '';
        this.loadAllTechnicalFiles(); // Recharger la liste
      },
      error: (err) => {
        console.error('Erreur mise à jour:', err);
        alert('❌ Erreur lors de la mise à jour: ' + (err.error?.message || err.message));
      }
    });
  }

  delete(id: number) {
    if (confirm('Voulez-vous vraiment supprimer ce dossier technique ?')) {
      this.service.delete(id).subscribe({
        next: () => {
          alert('✅ Dossier supprimé');
          this.loadAllTechnicalFiles();
        },
        error: err => console.error('Erreur suppression', err)
      });
    }
  }

  historyAuditedFile(fileId: number) {
    this.service.getFullHistoryAudited(fileId).subscribe({
      next: (history) => {
        console.log('Historique complet du dossier', history);
        this.router.navigate(['/technical-files', fileId, 'history-audited']);
      },
      error: (err) => {
        console.error('Erreur récupération historique:', err);
        alert('Impossible de charger l\'historique complet du dossier.');
      }
    });
  }

  // ==================== ACTIONS SUR LES ITEMS ====================

  editItem(itemId: number) {
    this.router.navigate(['/technical-files/items', itemId, 'edit']);
  }

  deleteItem(itemId: number) {
    const item = this.findItemById(itemId);
    const itemInfo = item ? `Item #${item.itemNumber}` : `Item ID ${itemId}`;

    const message = `⚠️ Voulez-vous vraiment supprimer ${itemInfo} ?\n\n` +
                    `Cette action est irréversible.`;

    if (confirm(message)) {
      this.service.deleteItem(itemId).subscribe({
        next: () => {
          alert('✅ Item supprimé avec succès');
          this.loadAllTechnicalFiles();
        },
        error: (err) => {
          console.error('Erreur suppression item:', err);
          alert('❌ Erreur lors de la suppression: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  historyAuditedItem(itemId: number) {
    this.router.navigate(['/technical-files/items', itemId, 'history-audited']);
  }

  detailItem(itemId: number) {
    this.router.navigate(['/technical-files/items', itemId, 'detail']);
  }

  // ==================== UTILITAIRES ====================

  private findItemById(itemId: number): any {
    for (const file of this.technicalFiles) {
      const item = file.items?.find(i => i.id === itemId);
      if (item) return item;
    }
    return null;
  }
 // technical-file-list.component.ts

// ==================== GESTION DES STATUTS ====================


// ✅ CORRECTION : Accepter string | undefined
getStatusClass(status: string | undefined): string {
  if (!status) return 'status-default';
  switch (status) {
    case 'DRAFT': return 'status-draft';
    case 'VALIDATED_PP': return 'status-pp';
    case 'VALIDATED_MC': return 'status-mc';
    case 'VALIDATED_MP': return 'status-mp';
    default: return 'status-default';
  }
}

// ✅ CORRECTION : Accepter string | undefined
getStatusLabel(status: string | undefined): string {
  if (!status) return '⚪ Non défini';
  switch (status) {
    case 'DRAFT': return '📝 Brouillon';
    case 'VALIDATED_PP': return '✅ Validé PP';
    case 'VALIDATED_MC': return '✅ Validé MC';
    case 'VALIDATED_MP': return '🏁 Validé MP';
    default: return status;
  }
}

validateItem(itemId: number) {
  console.log('validateItem appelé pour ID:', itemId); // ✅ AJOUTER

  const confirmMsg = `Voulez-vous valider cet item en tant que ${this.currentUserRole} ?`;
  if (confirm(confirmMsg)) {
    this.service.validateItem(itemId).subscribe({
      next: () => {
        alert(`✅ Item validé par ${this.currentUserRole}`);
        this.loadAllTechnicalFiles();
      },
      error: (err) => {
        console.error('Erreur validation:', err);
        alert('❌ ' + (err.error?.message || 'Erreur lors de la validation'));
      }
    });
  }
}
// technical-file-list.component.ts

// ==================== GESTION DES DROITS ====================

// Vérifier si l'utilisateur peut valider l'item
canValidateItem(item: any): boolean {
  const status = item.validationStatus;
  switch (this.currentUserRole) {
    case 'PP': return status === 'DRAFT';
    case 'MC': return status === 'VALIDATED_PP';
    case 'MP': return status === 'VALIDATED_PP';
    default: return false;
  }
}

// ✅ Vérifier si l'utilisateur peut modifier l'item
canEditItem(item: any): boolean {
  const status = item.validationStatus;

  switch (this.currentUserRole) {
     case 'ADMIN':
      // PP peut TOUJOURS modifier (pour ajouter des items)
      return true;
    case 'PP':
      // PP peut TOUJOURS modifier (pour ajouter des items)
      return true;
    case 'MC':
      // MC peut modifier seulement si statut = VALIDATED_PP
      return status === 'VALIDATED_PP';
    case 'MP':
      // MP peut modifier seulement si statut = VALIDATED_MC
      return status === 'VALIDATED_PP';
    default:
      return false;
  }
}

// ✅ Vérifier si l'utilisateur peut supprimer l'item
canDeleteItem(item: any): boolean {
  const status = item.validationStatus;

  switch (this.currentUserRole) {
    case 'ADMIN':
      return true;
    case 'PP':
      // PP peut supprimer seulement si DRAFT (ou toujours ? à définir)
      return status === 'DRAFT';

    default:
      return false;
  }
}

// Vérifier si l'utilisateur peut voir l'historique (toujours)
canViewHistory(item: any): boolean {
  return true;
}

// Vérifier si l'utilisateur peut voir les détails (toujours)
canViewDetail(item: any): boolean {
  return true;
}
// ==================== EXPORT EXCEL ====================

 // ✅ Export d'un dossier individuel avec tous ses items
// ✅ Export d'un dossier individuel avec tous ses items (style comme le modèle)
async exportOneToExcel(file: TechnicalFileDetail): Promise<void> {
  if (!file || !file.id) {
    alert('Données invalides pour l\'export');
    return;
  }

  if (!file.items || file.items.length === 0) {
    alert('Aucun item dans ce dossier');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Dossier Technique');

  // ===== ENTÊTE =====
  // Ligne 4: Titre principal
  worksheet.mergeCells(4, 1, 4, 25);
  const titleCell = worksheet.getCell('A4');
  titleCell.value = `Dossier Technique pour les Tables de Contrôle Technique - ${file.reference || `#${file.id}`}`;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center' };
  worksheet.getRow(4).height = 30;

  worksheet.addRow([]);

  // ===== LIGNE DES GROUPES PRINCIPAUX =====
  const groupRow = worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

  // Général (col 1-3)
  worksheet.mergeCells(groupRow.number, 1, groupRow.number, 3);
  groupRow.getCell(1).value = 'Général';

  // Code d'identité (col 4-8)
  worksheet.mergeCells(groupRow.number, 4, groupRow.number, 8);
  groupRow.getCell(4).value = 'Code d\'identité';

  // Inspection (col 10-25)
  worksheet.mergeCells(groupRow.number, 10, groupRow.number, 25);
  groupRow.getCell(10).value = 'Inspection';

  groupRow.font = { bold: true, size: 11 };
  groupRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4E73DF' } };
  groupRow.alignment = { horizontal: 'center', vertical: 'middle' };
  groupRow.height = 25;

  // ===== LIGNE DES SOUS-TITRES (2ème ligne d'en-tête) =====
  const subHeaderRow = worksheet.addRow([
    'Position:', 'Date d\'entretien', 'Nom du Technicien',  // Général (col 1-3)
    'X_Code', 'Numéro de référence LEONI:', 'Index', 'Producteur', 'Type',  // Code d'identité (col 4-8)
    'Referenec pine Push Back',  // col 9
    '', '', '',  // Raideur des pins (col 10-12)
    '', '', '',  // Displacement path (col 13-15)
    '', '', '',  // Valeur maximale (col 16-18)
    '', '', '',  // Valeur programmée (col 19-21)
    '', '', '',  // Les détections (col 22-24)
    'Remarques:'  // col 25
  ]);

  // Fusion pour Raideur des pins (col 10-12)
  worksheet.mergeCells(subHeaderRow.number, 10, subHeaderRow.number, 12);
  subHeaderRow.getCell(10).value = 'Raideur des pins';

  // Fusion pour Displacement path (col 13-15)
  worksheet.mergeCells(subHeaderRow.number, 13, subHeaderRow.number, 15);
  subHeaderRow.getCell(13).value = 'Displacement path (pour Push Back)(en mm)';

  // Fusion pour Valeur maximale (col 16-18)
  worksheet.mergeCells(subHeaderRow.number, 16, subHeaderRow.number, 18);
  subHeaderRow.getCell(16).value = 'Valeur maximale d\'étanchéité (en mbar)';

  // Fusion pour Valeur programmée (col 19-21)
  worksheet.mergeCells(subHeaderRow.number, 19, subHeaderRow.number, 21);
  subHeaderRow.getCell(19).value = 'Valeur d\'étanchéité programmée (en mbar)';

  // Fusion pour Les détections (col 22-24)
  worksheet.mergeCells(subHeaderRow.number, 22, subHeaderRow.number, 24);
  subHeaderRow.getCell(22).value = 'Les détections (Activé/Desactivé)';

  subHeaderRow.font = { bold: true, size: 10 };
  subHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } };
  subHeaderRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  subHeaderRow.height = 50;

  // ===== LIGNE DES M1, M2, M3 (3ème ligne d'en-tête) =====
  const mRow = worksheet.addRow([
    '', '', '',  // Général
    '', '', '', '', '',  // Code d'identité
    '',  // Réf Pine
    'M1', 'M2', 'M3',  // Raideur (col 10-12)
    'M1', 'M2', 'M3',  // Displacement (col 13-15)
    'M1', 'M2', 'M3',  // Max (col 16-18)
    'M1', 'M2', 'M3',  // Prog (col 19-21)
    'M1', 'M2', 'M3',  // Détections (col 22-24)
    ''  // Remarques
  ]);

  mRow.font = { bold: true, size: 9 };
  mRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
  mRow.alignment = { horizontal: 'center', vertical: 'middle' };
  mRow.height = 20;

  // ===== DÉFINIR LES LARGEURS DES COLONNES =====
  const colWidths = [
    12,  // Position
    15,  // Date entretien
    18,  // Nom Technicien
    12,  // X_Code
    20,  // Réf LEONI
    8,   // Index
    12,  // Producteur
    12,  // Type
    18,  // Réf. Pine
    12,  // Raideur M1
    12,  // Raideur M2
    12,  // Raideur M3
    15,  // Displacement M1
    15,  // Displacement M2
    15,  // Displacement M3
    12,  // Max M1
    12,  // Max M2
    12,  // Max M3
    12,  // Prog M1
    12,  // Prog M2
    12,  // Prog M3
    12,  // Détections M1
    12,  // Détections M2
    12,  // Détections M3
    35   // Remarques
  ];

  for (let i = 0; i < colWidths.length; i++) {
    worksheet.getColumn(i + 1).width = colWidths[i];
  }

  // ===== AJOUT DES DONNÉES =====
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  const formatOkNok = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (value === 'OK' || value === 'Ok' || value === 'ok') return 'OK';
    if (value === 'NOK' || value === 'Nok' || value === 'nok') return 'NOK';
    return String(value);
  };

  for (let idx = 0; idx < file.items.length; idx++) {
    const item = file.items[idx];
    const rowData = [
      formatValue(item.position),                    // col1: Position
      formatDate(item.maintenanceDate),              // col2: Date entretien
      formatValue(item.technicianName),              // col3: Technicien
      formatValue(item.xCode),                       // col4: X_Code
      formatValue(item.leoniReferenceNumber),        // col5: Réf LEONI
      formatValue(item.indexValue),                  // col6: Index
      formatValue(item.producer),                    // col7: Producteur
      formatValue(item.type),                        // col8: Type
      formatValue(item.referencePinePushBack),       // col9: Réf. Pine
      formatOkNok(item.pinRigidityM1),               // col10: Raideur M1
      formatOkNok(item.pinRigidityM2),               // col11: Raideur M2
      formatOkNok(item.pinRigidityM3),               // col12: Raideur M3
      formatValue(item.displacementPathM1),          // col13: Displacement M1
      formatValue(item.displacementPathM2),          // col14: Displacement M2
      formatValue(item.displacementPathM3),          // col15: Displacement M3
      formatValue(item.maxSealingValueM1),           // col16: Max M1
      formatValue(item.maxSealingValueM2),           // col17: Max M2
      formatValue(item.maxSealingValueM3),           // col18: Max M3
      formatValue(item.programmedSealingValueM1),    // col19: Prog M1
      formatValue(item.programmedSealingValueM2),    // col20: Prog M2
      formatValue(item.programmedSealingValueM3),    // col21: Prog M3
      formatOkNok(item.detectionsM1),                // col22: Détections M1
      formatOkNok(item.detectionsM2),                // col23: Détections M2
      formatOkNok(item.detectionsM3),                // col24: Détections M3
      formatValue(item.remarks)                      // col25: Remarques
    ];

    const row = worksheet.addRow(rowData);
    row.height = 25;

    // Styliser les cellules
    for (let col = 1; col <= rowData.length; col++) {
      const cell = row.getCell(col);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Colonnes OK/NOK (Raideur: col 10-12, Détections: col 22-24)
      if ((col >= 10 && col <= 12) || (col >= 22 && col <= 24)) {
        const value = cell.value;
        if (value === 'OK') {
          cell.font = { color: { argb: 'FF27AE60' }, bold: true };
        } else if (value === 'NOK') {
          cell.font = { color: { argb: 'FFE74C3C' }, bold: true };
        }
      }
    }

    // Alternance des couleurs pour les lignes
    if ((idx + 1) % 2 === 0) {
      for (let col = 1; col <= rowData.length; col++) {
        const cell = row.getCell(col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
      }
    }
  }

  // ===== AJOUTER DES BORDURES =====
  const startRow = groupRow.number;
  const endRow = worksheet.rowCount;
  const maxCol = 25;

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
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Dossier_Technique_${file.id}_${new Date().toISOString().split('T')[0]}.xlsx`);
  alert(`✅ Export terminé : Dossier #${file.id}`);
}
// ✅ Export de tous les dossiers filtrés dans un SEUL fichier Excel (un onglet par dossier)
// ✅ Export de tous les dossiers FILTRÉS (un seul fichier avec sommaire et onglets)
  async exportAllToExcel(): Promise<void> {
    if (this.filteredFiles.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    let successCount = 0;
    let errorCount = 0;

    // ===== PAGE DE SOMMAIRE =====
    const summarySheet = workbook.addWorksheet('Sommaire');

    // Titre du sommaire
    summarySheet.mergeCells(1, 1, 1, 4);
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'LISTE DES DOSSIERS TECHNIQUES';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    titleCell.alignment = { horizontal: 'center' };
    summarySheet.getRow(1).height = 35;

    // Info export avec filtres
    let filterInfo = `Export du ${new Date().toLocaleDateString('fr-FR')} - ${this.filteredFiles.length} dossier(s) trouvé(s)`;
    if (this.yearFilter) filterInfo += ` | Année: ${this.yearFilter}`;
    if (this.monthFilter) filterInfo += ` | Mois: ${this.getMonthLabel(this.monthFilter)}`;
    if (this.searchTerm) filterInfo += ` | Recherche: "${this.searchTerm}"`;

    summarySheet.mergeCells(2, 1, 2, 4);
    const infoCell = summarySheet.getCell('A2');
    infoCell.value = filterInfo;
    infoCell.font = { italic: true, size: 10 };
    infoCell.alignment = { horizontal: 'center' };
    summarySheet.getRow(2).height = 20;

    summarySheet.addRow([]);

    // En-têtes du sommaire
    const summaryHeaders = ['#', 'ID', 'Référence', 'Créé par', 'Date création', 'Nb Items'];
    const summaryHeaderRow = summarySheet.addRow(summaryHeaders);
    summaryHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summaryHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E86C1' } };
    summaryHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
    summaryHeaderRow.height = 25;

    // Largeurs du sommaire
    summarySheet.getColumn(1).width = 5;
    summarySheet.getColumn(2).width = 8;
    summarySheet.getColumn(3).width = 20;
    summarySheet.getColumn(4).width = 15;
    summarySheet.getColumn(5).width = 12;
    summarySheet.getColumn(6).width = 8;

    // Pour chaque dossier filtré
    for (let idx = 0; idx < this.filteredFiles.length; idx++) {
      const file = this.filteredFiles[idx];

      try {
        if (!file.items || file.items.length === 0) {
          const emptySheet = workbook.addWorksheet(this.getValidSheetName(`Dossier_${file.id}`));
          emptySheet.addRow([`DOSSIER TECHNIQUE - ${file.reference || `#${file.id}`}`]);
          emptySheet.addRow([`Créé par: ${file.createdBy || '-'} | Créé le: ${file.createdAt ? new Date(file.createdAt).toLocaleDateString('fr-FR') : '-'}`]);
          emptySheet.addRow([]);
          emptySheet.addRow(['Aucun item dans ce dossier']);
          successCount++;
        } else {
          const sheetName = this.getValidSheetName(`Dossier_${file.id}`);
          const worksheet = workbook.addWorksheet(sheetName);
          await this.populateTechnicalFileWorksheet(worksheet, file);
          successCount++;
        }

        const row = summarySheet.addRow([
          (idx + 1).toString(),
          file.id,
          file.reference || '-',
          file.createdBy || '-',
          file.createdAt ? new Date(file.createdAt).toLocaleDateString('fr-FR') : '-',
          file.items?.length || 0
        ]);

        const sheetName = this.getValidSheetName(`Dossier_${file.id}`);
        const cell = row.getCell(2);
        cell.value = { text: file.id.toString(), hyperlink: `#${sheetName}!A1` };
        cell.font = { color: { argb: 'FF2E86C1' }, underline: true };

        if ((idx + 1) % 2 === 0) {
          row.eachCell({ includeEmpty: true }, (cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
          });
        }

      } catch (error) {
        console.error(`Erreur export dossier ${file.id}:`, error);
        errorCount++;
      }
    }

    // Styliser le sommaire
    for (let i = summaryHeaderRow.number + 1; i <= summarySheet.rowCount; i++) {
      const row = summarySheet.getRow(i);
      for (let j = 1; j <= 6; j++) {
        const cell = row.getCell(j);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        };
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    let fileName = `Dossiers_Techniques_${new Date().toISOString().split('T')[0]}`;
    if (this.yearFilter) fileName += `_${this.yearFilter}`;
    if (this.monthFilter) fileName += `_${this.getMonthLabel(this.monthFilter)}`;
    fileName += `.xlsx`;
    saveAs(blob, fileName);

    if (errorCount === 0) {
      alert(`✅ Export terminé avec succès : ${successCount} dossier(s) exporté(s) dans un seul fichier`);
    } else {
      alert(`⚠️ Export partiel : ${successCount} dossier(s) exporté(s), ${errorCount} erreur(s)`);
    }
  }

  // ✅ Valider le nom de la feuille
  private getValidSheetName(name: string): string {
    let validName = name.replace(/[\\/*?:\[\]]/g, '');
    if (validName.length > 31) {
      validName = validName.substring(0, 31);
    }
    return validName;
  }
// ✅ Remplir une feuille Excel avec les données d'un dossier (style comme le modèle)
private async populateTechnicalFileWorksheet(worksheet: ExcelJS.Worksheet, file: TechnicalFileDetail): Promise<void> {
  if (!file.items || file.items.length === 0) return;

  // ===== ENTÊTE =====


  // Ligne 4: Titre principal
  worksheet.mergeCells(4, 1, 4, 27);
  const titleCell = worksheet.getCell('A4');
  titleCell.value = `Dossier Technique pour les Tables de Contrôle Technique - ${file.reference || `#${file.id}`}`;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center' };
  worksheet.getRow(4).height = 30;

  worksheet.addRow([]);

  // ===== LIGNE DES GROUPES PRINCIPAUX =====
  const groupRow = worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

  // Général (col 1-3)
  worksheet.mergeCells(groupRow.number, 1, groupRow.number, 3);
  groupRow.getCell(1).value = 'Général';

  // Code d'identité (col 4-8)
  worksheet.mergeCells(groupRow.number, 4, groupRow.number, 8);
  groupRow.getCell(4).value = 'Code d\'identité';

  // Inspection (col 10-27)
  worksheet.mergeCells(groupRow.number, 10, groupRow.number, 27);
  groupRow.getCell(10).value = 'Inspection';

  groupRow.font = { bold: true, size: 11 };
  groupRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4E73DF' } };
  groupRow.alignment = { horizontal: 'center', vertical: 'middle' };
  groupRow.height = 25;

  // ===== LIGNE DES SOUS-TITRES (2ème ligne d'en-tête) =====
  const subHeaderRow = worksheet.addRow([
    'Position:', 'Date d\'entretien', 'Nom du Technicien',  // Général (col 1-3)
    'X_Code', 'Numéro de référence LEONI:', 'Index', 'Producteur', 'Type',  // Code d'identité (col 4-8)
    'Referenec pine Push Back',  // col 9
    '', '', '',  // Raideur des pins (col 10-12)
    '', '', '',  // Displacement path (col 13-15)
    '', '', '',  // Valeur maximale (col 16-18)
    '', '', '',  // Valeur programmée (col 19-21)
    '', '', '',  // Les détections (col 22-24)
    'Remarques:'  // col 25
  ]);

  // Fusion pour Raideur des pins (col 10-12)
  worksheet.mergeCells(subHeaderRow.number, 10, subHeaderRow.number, 12);
  subHeaderRow.getCell(10).value = 'Raideur des pins';

  // Fusion pour Displacement path (col 13-15)
  worksheet.mergeCells(subHeaderRow.number, 13, subHeaderRow.number, 15);
  subHeaderRow.getCell(13).value = 'Displacement path (pour Push Back)(en mm)';

  // Fusion pour Valeur maximale (col 16-18)
  worksheet.mergeCells(subHeaderRow.number, 16, subHeaderRow.number, 18);
  subHeaderRow.getCell(16).value = 'Valeur maximale d\'étanchéité (en mbar)';

  // Fusion pour Valeur programmée (col 19-21)
  worksheet.mergeCells(subHeaderRow.number, 19, subHeaderRow.number, 21);
  subHeaderRow.getCell(19).value = 'Valeur d\'étanchéité programmée (en mbar)';

  // Fusion pour Les détections (col 22-24)
  worksheet.mergeCells(subHeaderRow.number, 22, subHeaderRow.number, 24);
  subHeaderRow.getCell(22).value = 'Les détections (Activé/Desactivé)';

  subHeaderRow.font = { bold: true, size: 10 };
  subHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } };
  subHeaderRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  subHeaderRow.height = 50;

  // ===== LIGNE DES M1, M2, M3 (3ème ligne d'en-tête) =====
  const mRow = worksheet.addRow([
    '', '', '',  // Général
    '', '', '', '', '',  // Code d'identité
    '',  // Réf Pine
    'M1', 'M2', 'M3',  // Raideur (col 10-12)
    'M1', 'M2', 'M3',  // Displacement (col 13-15)
    'M1', 'M2', 'M3',  // Max (col 16-18)
    'M1', 'M2', 'M3',  // Prog (col 19-21)
    'M1', 'M2', 'M3',  // Détections (col 22-24)
    ''  // Remarques
  ]);

  mRow.font = { bold: true, size: 9 };
  mRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
  mRow.alignment = { horizontal: 'center', vertical: 'middle' };
  mRow.height = 20;

  // ===== DÉFINIR LES LARGEURS DES COLONNES =====
  const colWidths = [
    12,  // Position
    15,  // Date entretien
    18,  // Nom Technicien
    12,  // X_Code
    20,  // Réf LEONI
    8,   // Index
    12,  // Producteur
    12,  // Type
    18,  // Réf. Pine
    12,  // Raideur M1
    12,  // Raideur M2
    12,  // Raideur M3
    15,  // Displacement M1
    15,  // Displacement M2
    15,  // Displacement M3
    12,  // Max M1
    12,  // Max M2
    12,  // Max M3
    12,  // Prog M1
    12,  // Prog M2
    12,  // Prog M3
    12,  // Détections M1
    12,  // Détections M2
    12,  // Détections M3
    35   // Remarques
  ];

  for (let i = 0; i < colWidths.length; i++) {
    worksheet.getColumn(i + 1).width = colWidths[i];
  }

  // ===== AJOUT DES DONNÉES =====
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  const formatOkNok = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (value === 'OK' || value === 'Ok' || value === 'ok') return 'OK';
    if (value === 'NOK' || value === 'Nok' || value === 'nok') return 'NOK';
    return String(value);
  };

  for (let idx = 0; idx < file.items.length; idx++) {
    const item = file.items[idx];
    const rowData = [
      formatValue(item.position),                    // col1: Position
      formatDate(item.maintenanceDate),              // col2: Date entretien
      formatValue(item.technicianName),              // col3: Technicien
      formatValue(item.xCode),                       // col4: X_Code
      formatValue(item.leoniReferenceNumber),        // col5: Réf LEONI
      formatValue(item.indexValue),                  // col6: Index
      formatValue(item.producer),                    // col7: Producteur
      formatValue(item.type),                        // col8: Type
      formatValue(item.referencePinePushBack),       // col9: Réf. Pine
      formatOkNok(item.pinRigidityM1),               // col10: Raideur M1
      formatOkNok(item.pinRigidityM2),               // col11: Raideur M2
      formatOkNok(item.pinRigidityM3),               // col12: Raideur M3
      formatValue(item.displacementPathM1),          // col13: Displacement M1
      formatValue(item.displacementPathM2),          // col14: Displacement M2
      formatValue(item.displacementPathM3),          // col15: Displacement M3
      formatValue(item.maxSealingValueM1),           // col16: Max M1
      formatValue(item.maxSealingValueM2),           // col17: Max M2
      formatValue(item.maxSealingValueM3),           // col18: Max M3
      formatValue(item.programmedSealingValueM1),    // col19: Prog M1
      formatValue(item.programmedSealingValueM2),    // col20: Prog M2
      formatValue(item.programmedSealingValueM3),    // col21: Prog M3
      formatOkNok(item.detectionsM1),                // col22: Détections M1
      formatOkNok(item.detectionsM2),                // col23: Détections M2
      formatOkNok(item.detectionsM3),                // col24: Détections M3
      formatValue(item.remarks)                      // col25: Remarques
    ];

    const row = worksheet.addRow(rowData);
    row.height = 25;

    // Styliser les cellules
    for (let col = 1; col <= rowData.length; col++) {
      const cell = row.getCell(col);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Colonnes OK/NOK (Raideur: col 10-12, Détections: col 22-24)
      if ((col >= 10 && col <= 12) || (col >= 22 && col <= 24)) {
        const value = cell.value;
        if (value === 'OK') {
          cell.font = { color: { argb: 'FF27AE60' }, bold: true };
        } else if (value === 'NOK') {
          cell.font = { color: { argb: 'FFE74C3C' }, bold: true };
        }
      }
    }

    // Alternance des couleurs pour les lignes
    if ((idx + 1) % 2 === 0) {
      for (let col = 1; col <= rowData.length; col++) {
        const cell = row.getCell(col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
      }
    }
  }

  // ===== AJOUTER DES BORDURES =====
  const startRow = groupRow.number;
  const endRow = worksheet.rowCount;
  const maxCol = 25;

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
}
// ==================== VÉRIFIER SI DES FILTRES SONT ACTIFS ====================
hasActiveFilters(): boolean {
  return !!(this.searchTerm || this.monthFilter || this.yearFilter);
}
// ==================== FONCTIONS DE RECHERCHE ====================
applyFilter() {
  this.applyFilters();
}
// technical-file-list.component.ts - Ajouter cette méthode

compareVersions(itemId: number): void {
  this.router.navigate(['/technical-files/items', itemId, 'compare']);
}
}
