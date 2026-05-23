// all-versions.component.ts - Version corrigée
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TechnicalFileService } from '../../../../services/technical-file.service';
// Ajouter ces méthodes dans all-versions.component.ts

import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
@Component({
  selector: 'app-all-versions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './all-versions.component.html',
  styleUrls: ['./all-versions.component.css']
})
export class AllVersionsComponent implements OnInit {

  itemId!: number;
  itemXCode: string = '';
  loading = true;
  error: string | null = null;
  versions: any[] = [];
  expandedDiffs: { [key: number]: boolean } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: TechnicalFileService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('itemId');
    if (idParam) {
      this.itemId = Number(idParam);
      this.loadAllVersions();
    } else {
      this.error = 'ID de l\'item non trouvé';
      this.loading = false;
    }
  }

  loadAllVersions(): void {
    this.loading = true;

    // Récupérer l'item pour avoir le xCode
    this.service.getItemById(this.itemId).subscribe({
      next: (item) => {
        this.itemXCode = item.xcode || `#${this.itemId}`;
      },
      error: () => {
        this.itemXCode = `#${this.itemId}`;
      }
    });

    // Charger toutes les versions
    this.service.getAllVersions(this.itemId).subscribe({
      next: (response) => {
        console.log('📊 Toutes les versions:', response);
        this.versions = response.data || response;
        // Initialiser l'état des différences
        this.versions.forEach((_, idx) => {
          this.expandedDiffs[idx] = idx === this.versions.length - 1;
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement versions:', err);
        this.error = 'Impossible de charger l\'historique des versions';
        this.loading = false;
      }
    });
  }

     goBack(): void {
  window.history.back();

     }

  toggleDiffForVersion(versionIndex: number): void {
    this.expandedDiffs[versionIndex] = !this.expandedDiffs[versionIndex];
  }

  getChangesCount(version: any): number {
    const idx = this.versions.indexOf(version);
    if (idx === 0) return 0;
    return this.getChangesBetweenVersions(this.versions[idx - 1], version).length;
  }

  getChangesBetweenVersions(prevVersion: any, currVersion: any): any[] {
    const changes: any[] = [];
    const prev = prevVersion?.entity;
    const curr = currVersion?.entity;

    if (!prev || !curr) return changes;

    const fieldsToCompare = [
      'position', 'technicianName', 'maintenanceDate',
      'xCode', 'indexValue', 'leoniReferenceNumber', 'producer', 'type', 'referencePinePushBack',
      'pinRigidityM1', 'pinRigidityM2', 'pinRigidityM3',
      'displacementPathM1', 'displacementPathM2', 'displacementPathM3',
      'maxSealingValueM1', 'maxSealingValueM2', 'maxSealingValueM3',
      'programmedSealingValueM1', 'programmedSealingValueM2', 'programmedSealingValueM3',
      'detectionsM1', 'detectionsM2', 'detectionsM3',
      'validationStatus', 'remarks'
    ];

    for (const field of fieldsToCompare) {
      const oldVal = prev[field];
      const newVal = curr[field];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({
          fieldName: field,
          oldValue: this.formatValueForDiff(oldVal),
          newValue: this.formatValueForDiff(newVal)
        });
      }
    }

    return changes;
  }

  formatValueForDiff(value: any): string {
    if (value === null || value === undefined) return '-';
    if (value === 'OK') return 'OK';
    if (value === 'NOK') return 'NOK';
    if (value === true) return 'Oui';
    if (value === false) return 'Non';
    if (value instanceof Date) {
      return this.formatDateFromDate(value);
    }
    if (typeof value === 'string' && value.includes('-')) {
      return this.formatDateFromString(value);
    }
    return String(value);
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (value === 'OK') return '✅ OK';
    if (value === 'NOK') return '❌ NOK';
    if (value === true || value === 'true') return '✅ Oui';
    if (value === false || value === 'false') return '❌ Non';
    if (value instanceof Date) {
      return this.formatDateFromDate(value);
    }
    if (typeof value === 'string' && value.includes('-')) {
      return this.formatDateFromString(value);
    }
    return String(value);
  }

  formatOkNok(value: any): string {
    if (value === null || value === undefined) return '-';
    if (value === 'OK' || value === 'Ok' || value === 'ok') return '✅ OK';
    if (value === 'NOK' || value === 'Nok' || value === 'nok') return '❌ NOK';
    return String(value);
  }

  // ✅ Méthode pour formater une date de type Date
  formatDateFromDate(date: Date): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  // ✅ Méthode pour formater une date de type string
  formatDateFromString(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  // ✅ Méthode générique pour les templates (accepte string | Date | undefined)
  formatDate(value: string | Date | undefined): string {
    if (!value) return '-';
    try {
      const date = value instanceof Date ? value : new Date(value);
      return date.toLocaleDateString('fr-FR');
    } catch {
      return '-';
    }
  }

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

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'position': 'Position',
      'technicianName': 'Technicien',
      'maintenanceDate': 'Date de maintenance',
      'xCode': 'X Code',
      'indexValue': 'Index',
      'leoniReferenceNumber': 'Réf. LEONI',
      'producer': 'Producteur',
      'type': 'Type',
      'referencePinePushBack': 'Réf. Pine Push Back',
      'validationStatus': 'Statut de validation',
      'pinRigidityM1': 'Raideur M1',
      'pinRigidityM2': 'Raideur M2',
      'pinRigidityM3': 'Raideur M3',
      'displacementPathM1': 'Déplacement M1',
      'displacementPathM2': 'Déplacement M2',
      'displacementPathM3': 'Déplacement M3',
      'maxSealingValueM1': 'Max Sealing M1',
      'maxSealingValueM2': 'Max Sealing M2',
      'maxSealingValueM3': 'Max Sealing M3',
      'programmedSealingValueM1': 'Prog Sealing M1',
      'programmedSealingValueM2': 'Prog Sealing M2',
      'programmedSealingValueM3': 'Prog Sealing M3',
      'detectionsM1': 'Détection M1',
      'detectionsM2': 'Détection M2',
      'detectionsM3': 'Détection M3',
      'remarks': 'Remarques'
    };
    return labels[fieldName] || fieldName;
  }
  // Ajouter ces méthodes dans le composant TypeScript
getOkNokBadgeClass(value: string): string {
  if (!value) return 'bg-secondary';
  if (value === 'OK' || value === 'Ok' || value === 'ok') return 'badge-ok';
  if (value === 'NOK' || value === 'Nok' || value === 'nok') return 'badge-nok';
  return 'bg-secondary';
}

getValidationBadgeClass(status: string): string {
  if (!status) return 'bg-secondary';
  switch(status) {
    case 'DRAFT': return 'bg-warning text-dark';
    case 'VALIDATED_PP': return 'bg-info text-dark';
    case 'VALIDATED_MC': return 'bg-primary';
    case 'VALIDATED_MP': return 'bg-success';
    default: return 'bg-secondary';
  }
}

getValidationIcon(status: string): string {
  if (!status) return 'bi-question-circle';
  switch(status) {
    case 'DRAFT': return 'bi-pencil';
    case 'VALIDATED_PP': return 'bi-person-check';
    case 'VALIDATED_MC': return 'bi-person-check-fill';
    case 'VALIDATED_MP': return 'bi-flag-fill';
    default: return 'bi-question-circle';
  }
}


// Méthode pour exporter une version spécifique
async exportVersionToExcel(version: any, versionIndex: number): Promise<void> {
  const entity = version.entity;
  if (!entity) {
    alert('Données de version invalides');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Version ${version.versionNumber}`);

  // ===== ENTÊTE =====
  worksheet.mergeCells(4, 1, 4, 25);
  const titleCell = worksheet.getCell('A4');
  titleCell.value = `Historique Version ${version.versionNumber} - Item ${this.itemXCode}`;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center' };
  worksheet.getRow(4).height = 30;

  worksheet.addRow([]);

  // Informations de la version
  worksheet.mergeCells(1, 1, 1, 25);
  const infoCell = worksheet.getCell('A1');
  infoCell.value = `Version du ${this.formatDate(version.modifiedAt)} par ${version.modifiedBy} - ${version.revisionType === 'ADD' ? 'CRÉATION' : 'MODIFICATION'}`;
  infoCell.font = { italic: true, size: 10 };
  infoCell.alignment = { horizontal: 'center' };
  worksheet.getRow(1).height = 20;

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

  // ===== LIGNE DES SOUS-TITRES =====
  const subHeaderRow = worksheet.addRow([
    'Position:', 'Date d\'entretien', 'Nom du Technicien',
    'X_Code', 'Numéro de référence LEONI:', 'Index', 'Producteur', 'Type',
    'Referenec pine Push Back',
    '', '', '',
    '', '', '',
    '', '', '',
    '', '', '',
    '', '', '',
    'Remarques:'
  ]);

  worksheet.mergeCells(subHeaderRow.number, 10, subHeaderRow.number, 12);
  subHeaderRow.getCell(10).value = 'Raideur des pins';

  worksheet.mergeCells(subHeaderRow.number, 13, subHeaderRow.number, 15);
  subHeaderRow.getCell(13).value = 'Displacement path (pour Push Back)(en mm)';

  worksheet.mergeCells(subHeaderRow.number, 16, subHeaderRow.number, 18);
  subHeaderRow.getCell(16).value = 'Valeur maximale d\'étanchéité (en mbar)';

  worksheet.mergeCells(subHeaderRow.number, 19, subHeaderRow.number, 21);
  subHeaderRow.getCell(19).value = 'Valeur d\'étanchéité programmée (en mbar)';

  worksheet.mergeCells(subHeaderRow.number, 22, subHeaderRow.number, 24);
  subHeaderRow.getCell(22).value = 'Les détections (Activé/Desactivé)';

  subHeaderRow.font = { bold: true, size: 10 };
  subHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } };
  subHeaderRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  subHeaderRow.height = 50;

  // ===== LIGNE DES M1, M2, M3 =====
  const mRow = worksheet.addRow([
    '', '', '',
    '', '', '', '', '',
    '',
    'M1', 'M2', 'M3',
    'M1', 'M2', 'M3',
    'M1', 'M2', 'M3',
    'M1', 'M2', 'M3',
    'M1', 'M2', 'M3',
    ''
  ]);

  mRow.font = { bold: true, size: 9 };
  mRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
  mRow.alignment = { horizontal: 'center', vertical: 'middle' };
  mRow.height = 20;

  // ===== LARGEURS DES COLONNES =====
  const colWidths = [12, 15, 18, 12, 20, 8, 12, 12, 18, 12, 12, 12, 15, 15, 15, 12, 12, 12, 12, 12, 12, 12, 12, 12, 35];
  for (let i = 0; i < colWidths.length; i++) {
    worksheet.getColumn(i + 1).width = colWidths[i];
  }

  // ===== DONNÉES =====
  const rowData = [
    this.formatValue(entity.position),
    this.formatDate(entity.maintenanceDate),
    this.formatValue(entity.technicianName),
    this.formatValue(entity.xCode),
    this.formatValue(entity.leoniReferenceNumber),
    this.formatValue(entity.indexValue),
    this.formatValue(entity.producer),
    this.formatValue(entity.type),
    this.formatValue(entity.referencePinePushBack),
    this.formatOkNokRaw(entity.pinRigidityM1),
    this.formatOkNokRaw(entity.pinRigidityM2),
    this.formatOkNokRaw(entity.pinRigidityM3),
    this.formatValue(entity.displacementPathM1),
    this.formatValue(entity.displacementPathM2),
    this.formatValue(entity.displacementPathM3),
    this.formatValue(entity.maxSealingValueM1),
    this.formatValue(entity.maxSealingValueM2),
    this.formatValue(entity.maxSealingValueM3),
    this.formatValue(entity.programmedSealingValueM1),
    this.formatValue(entity.programmedSealingValueM2),
    this.formatValue(entity.programmedSealingValueM3),
    this.formatOkNokRaw(entity.detectionsM1),
    this.formatOkNokRaw(entity.detectionsM2),
    this.formatOkNokRaw(entity.detectionsM3),
    this.formatValue(entity.remarks)
  ];

  const row = worksheet.addRow(rowData);
  row.height = 25;

  for (let col = 1; col <= rowData.length; col++) {
    const cell = row.getCell(col);
    cell.alignment = { horizontal: 'center', vertical: 'middle' };

    if ((col >= 10 && col <= 12) || (col >= 22 && col <= 24)) {
      const value = cell.value;
      if (value === 'OK') {
        cell.font = { color: { argb: 'FF27AE60' }, bold: true };
      } else if (value === 'NOK') {
        cell.font = { color: { argb: 'FFE74C3C' }, bold: true };
      }
    }
  }

  // Ligne de statut
  worksheet.addRow([]);
  const statusRow = worksheet.addRow([
    'Statut de validation:', this.getStatusLabel(entity.validationStatus), '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]);
  statusRow.getCell(1).font = { bold: true };
  statusRow.getCell(2).font = { bold: true, color: { argb: this.getStatusColor(entity.validationStatus) } };

  if (entity.validatedByPp) {
    const ppRow = worksheet.addRow(['Validé PP:', entity.validatedByPp, entity.validatedAtPp ? new Date(entity.validatedAtPp).toLocaleDateString('fr-FR') : '']);
    ppRow.getCell(1).font = { bold: true };
  }
  if (entity.validatedByMc) {
    const mcRow = worksheet.addRow(['Validé MC:', entity.validatedByMc, entity.validatedAtMc ? new Date(entity.validatedAtMc).toLocaleDateString('fr-FR') : '']);
    mcRow.getCell(1).font = { bold: true };
  }
  if (entity.validatedByMp) {
    const mpRow = worksheet.addRow(['Validé MP:', entity.validatedByMp, entity.validatedAtMp ? new Date(entity.validatedAtMp).toLocaleDateString('fr-FR') : '']);
    mpRow.getCell(1).font = { bold: true };
  }

  // ===== BORDURES =====
  const startRow = groupRow.number;
  const endRow = worksheet.rowCount;
  for (let i = startRow; i <= endRow; i++) {
    for (let j = 1; j <= 25; j++) {
      const cell = worksheet.getCell(i, j);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
      };
    }
  }

  // ===== EXPORT =====
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Version_${version.versionNumber}_Item_${this.itemXCode}_${new Date().toISOString().split('T')[0]}.xlsx`);
  alert(`✅ Export terminé : Version ${version.versionNumber}`);
}

// Méthode pour exporter toutes les versions
async exportAllVersions(): Promise<void> {
  if (this.versions.length === 0) {
    alert('Aucune version à exporter');
    return;
  }

  const workbook = new ExcelJS.Workbook();

  // Page de sommaire
  const summarySheet = workbook.addWorksheet('Sommaire');
  summarySheet.mergeCells(1, 1, 1, 4);
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = `HISTORIQUE COMPLET - Item ${this.itemXCode}`;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center' };
  summarySheet.getRow(1).height = 30;

  const headers = ['Version', 'Date', 'Modifié par', 'Type', 'Statut'];
  const headerRow = summarySheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4E73DF' } };

  for (let i = 0; i < this.versions.length; i++) {
    const v = this.versions[i];
    summarySheet.addRow([
      `Version ${v.versionNumber}`,
      this.formatDate(v.modifiedAt),
      v.modifiedBy,
      v.revisionType === 'ADD' ? 'Création' : 'Modification',
      this.getStatusLabel(v.entity?.validationStatus)
    ]);

    // Exporter chaque version dans son propre onglet
    await this.exportVersionToWorkbook(workbook, v, i);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Historique_Item_${this.itemXCode}_${new Date().toISOString().split('T')[0]}.xlsx`);
  alert(`✅ Export terminé : ${this.versions.length} version(s) exportée(s)`);
}

// Méthode helper pour ajouter une version au workbook
private async exportVersionToWorkbook(workbook: ExcelJS.Workbook, version: any, index: number): Promise<void> {
  const entity = version.entity;
  if (!entity) return;

  const worksheet = workbook.addWorksheet(`Version ${version.versionNumber}`);

  // Même contenu que exportVersionToExcel mais sans générer le fichier
  worksheet.mergeCells(4, 1, 4, 25);
  const titleCell = worksheet.getCell('A4');
  titleCell.value = `Version ${version.versionNumber} - ${this.formatDate(version.modifiedAt)} par ${version.modifiedBy}`;
  titleCell.font = { bold: true, size: 12 };
  titleCell.alignment = { horizontal: 'center' };
  worksheet.getRow(4).height = 25;

  worksheet.addRow([]);

  const groupRow = worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  worksheet.mergeCells(groupRow.number, 1, groupRow.number, 3);
  groupRow.getCell(1).value = 'Général';
  worksheet.mergeCells(groupRow.number, 4, groupRow.number, 8);
  groupRow.getCell(4).value = 'Code d\'identité';
  worksheet.mergeCells(groupRow.number, 10, groupRow.number, 25);
  groupRow.getCell(10).value = 'Inspection';
  groupRow.font = { bold: true, size: 11 };
  groupRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4E73DF' } };
  groupRow.alignment = { horizontal: 'center', vertical: 'middle' };
  groupRow.height = 25;

  const rowData = [
    this.formatValue(entity.position),
    this.formatDate(entity.maintenanceDate),
    this.formatValue(entity.technicianName),
    this.formatValue(entity.xCode),
    this.formatValue(entity.leoniReferenceNumber),
    this.formatValue(entity.indexValue),
    this.formatValue(entity.producer),
    this.formatValue(entity.type),
    this.formatValue(entity.referencePinePushBack),
    this.formatOkNokRaw(entity.pinRigidityM1),
    this.formatOkNokRaw(entity.pinRigidityM2),
    this.formatOkNokRaw(entity.pinRigidityM3),
    this.formatValue(entity.displacementPathM1),
    this.formatValue(entity.displacementPathM2),
    this.formatValue(entity.displacementPathM3),
    this.formatValue(entity.maxSealingValueM1),
    this.formatValue(entity.maxSealingValueM2),
    this.formatValue(entity.maxSealingValueM3),
    this.formatValue(entity.programmedSealingValueM1),
    this.formatValue(entity.programmedSealingValueM2),
    this.formatValue(entity.programmedSealingValueM3),
    this.formatOkNokRaw(entity.detectionsM1),
    this.formatOkNokRaw(entity.detectionsM2),
    this.formatOkNokRaw(entity.detectionsM3),
    this.formatValue(entity.remarks)
  ];

  worksheet.addRow(rowData);
}

// Méthode helper pour format OK/NOK sans emoji
private formatOkNokRaw(value: any): string {
  if (value === null || value === undefined) return '-';
  if (value === 'OK' || value === 'Ok' || value === 'ok') return 'OK';
  if (value === 'NOK' || value === 'Nok' || value === 'nok') return 'NOK';
  return String(value);
}

// Méthode helper pour la couleur du statut
private getStatusColor(status: string): string {
  if (!status) return 'FF6C757D';
  switch(status) {
    case 'DRAFT': return 'FFFFC107';
    case 'VALIDATED_PP': return 'FF0DCAF0';
    case 'VALIDATED_MC': return 'FF0D6EFD';
    case 'VALIDATED_MP': return 'FF198754';
    default: return 'FF6C757D';
  }
}
}
