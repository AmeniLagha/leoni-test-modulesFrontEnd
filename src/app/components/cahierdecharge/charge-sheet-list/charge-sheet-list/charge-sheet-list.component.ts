import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChargeSheetComplete, ChargeSheetItemDto, ChargeSheetStatus, ReceptionHistoryDto } from '../../../../../models/charge-sheet.model';
import { ChargeSheetService } from '../../../../../services/charge-sheet.service';
import { AuthService } from '../../../../../services/auth.service';
import { ExcelExportService } from '../../../../../services/excel-export.service';
import { UploadService } from '../../../../../services/upload.service';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-charge-sheet-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './charge-sheet-list.component.html',
  styleUrls: ['./charge-sheet-list.component.css']
})
export class ChargeSheetListComponent implements OnInit {
  chargeSheets: ChargeSheetComplete[] = [];
  filteredSheets: ChargeSheetComplete[] = [];
  loading = false;
  error = '';

  // Filtres
  searchTerm: string = '';
  statusFilter: string = '';
  dateFilter: string = '';
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
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // Tooltip
  showTooltip: number | null = null;

  // Math pour les templates
  Math = Math;

  // Gestion des quantités reçues
  receivedQuantities: Map<number, Map<number, number>> = new Map();

   // ✅ AJOUTER POUR LES IMAGES
  itemImages: { [key: number]: string } = {};

  constructor(
    public chargeSheetService: ChargeSheetService,
    private authService: AuthService,
    private excelExportService: ExcelExportService,
    private uploadService: UploadService,
    private router: Router,

  ) {}

  ngOnInit(): void {
    this.fetchChargeSheets();
     this.generateAvailableYears();
  }
// ✅ Générer les années disponibles à partir des dates des cahiers
generateAvailableYears(): void {
  const years = new Set<number>();
  const currentYear = new Date().getFullYear();

  // Ajouter l'année courante et l'année précédente
  years.add(currentYear);
  years.add(currentYear - 1);

  // Si vous avez des cahiers plus anciens, ajouter aussi
  this.chargeSheets.forEach(sheet => {
    if (sheet.createdAt) {
      const year = new Date(sheet.createdAt).getFullYear();
      years.add(year);
    }
  });

  this.availableYears = Array.from(years).sort((a, b) => b - a);
}
  // ============ PERMISSIONS ============
  hasPermission(permissions: string[]): boolean {
    return this.authService.hasPermission(permissions);
  }

  get canCreate(): boolean {
    return this.authService.hasPermission(['charge_sheet:basic:create']);
  }

  get canEditBasic(): boolean {
    return this.authService.hasPermission(['charge_sheet:basic:write']);
  }

  get canEditTech(): boolean {
    return this.authService.hasPermission(['charge_sheet:tech:write']);
  }

  isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }
  isPT(): boolean{
    return this.authService.getUserRole() ==='PT'
  }

  // ============ CHARGEMENT DES DONNÉES ============
  fetchChargeSheets(): void {
    this.loading = true;
    this.chargeSheetService.getAll().subscribe({
      next: (data: ChargeSheetComplete[]) => {
        this.chargeSheets = data;
        this.applyFilters();
         this.generateAvailableYears();
        this.loadReceivedQuantitiesForAllSheets();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur récupération liste:', err);
        this.error = 'Impossible de charger la liste des cahiers';
        this.loading = false;
      }
    });
  }

  // ============ GESTION DES QUANTITÉS REÇUES ============
  loadReceivedQuantitiesForAllSheets(): void {
    this.chargeSheets.forEach(sheet => {
      this.chargeSheetService.getReceptionHistory(sheet.id).subscribe({
        next: (history: ReceptionHistoryDto[]) => {
          const itemQuantities = new Map<number, number>();
          history.forEach(h => {
            const current = itemQuantities.get(h.item.id) || 0;
            itemQuantities.set(h.item.id, current + h.quantityReceived);
          });
          this.receivedQuantities.set(sheet.id, itemQuantities);
        },
        error: (err) => console.error(`Erreur chargement réceptions pour cahier ${sheet.id}:`, err)
      });
    });
  }

  getReceivedQuantityForItem(sheetId: number, itemId: number | undefined): number {
    if (itemId === undefined) return 0;
    const sheetMap = this.receivedQuantities.get(sheetId);
    return sheetMap?.get(itemId) || 0;
  }

  getReceptionProgress(sheetId: number, itemId: number | undefined): number {
    if (itemId === undefined) return 0;

    const sheet = this.chargeSheets.find(s => s.id === sheetId);
    if (!sheet) return 0;

    const item = sheet.items.find(i => i.id === itemId);
    if (!item) return 0;

    const quantityOrdered = item.quantityOfTestModules || 0;
    const quantityReceived = this.getReceivedQuantityForItem(sheetId, itemId);

    if (quantityOrdered === 0) return 0;
    return (quantityReceived / quantityOrdered) * 100;
  }

  areAllItemsReceived(sheet: ChargeSheetComplete): boolean {
    if (!sheet.items || sheet.items.length === 0) return false;

    for (const item of sheet.items) {
      const quantityOrdered = item.quantityOfTestModules || 0;
      const quantityReceived = item.id !== undefined ?
        this.getReceivedQuantityForItem(sheet.id, item.id) : 0;
      if (quantityReceived < quantityOrdered) {
        return false;
      }
    }
    return true;
  }

  // ============ FILTRES ============
  applyFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value.toLowerCase();
    this.applyFilters();
  }

  filterByStatus(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.statusFilter = target.value;
    this.applyFilters();
  }

  applyDateFilter(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredSheets = this.chargeSheets.filter(sheet => {
      // Filtre par statut
      if (this.statusFilter && sheet.status !== this.statusFilter) {
        return false;
      }

      // Filtre par date
      if (this.dateFilter && sheet.createdAt) {
        const sheetDate = new Date(sheet.createdAt).toISOString().split('T')[0];
        if (sheetDate !== this.dateFilter) {
          return false;
        }
      }
 // ✅ NOUVEAU : Filtre par mois
    if (this.monthFilter && sheet.createdAt) {
      const sheetMonth = new Date(sheet.createdAt).getMonth() + 1;
      const monthStr = sheetMonth.toString().padStart(2, '0');
      if (monthStr !== this.monthFilter) {
        return false;
      }
    }

    // ✅ NOUVEAU : Filtre par année
    if (this.yearFilter && sheet.createdAt) {
      const sheetYear = new Date(sheet.createdAt).getFullYear();
      if (sheetYear.toString() !== this.yearFilter) {
        return false;
      }
    }
      // Filtre par recherche textuelle
      if (this.searchTerm) {
        const searchStr = this.searchTerm.toLowerCase();
        return (
          sheet.id?.toString().includes(searchStr) ||
          (sheet.plant?.toLowerCase() || '').includes(searchStr) ||
          (sheet.project?.toLowerCase() || '').includes(searchStr) ||
          (sheet.harnessRef?.toLowerCase() || '').includes(searchStr) ||
          (sheet.issuedBy?.toLowerCase() || '').includes(searchStr) ||
          (sheet.orderNumber?.toLowerCase() || '').includes(searchStr) ||
          (sheet.emailAddress?.toLowerCase() || '').includes(searchStr)
        );
      }

      return true;
    });

    this.totalPages = Math.ceil(this.filteredSheets.length / this.pageSize);
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

// ✅ Réinitialiser tous les filtres
resetFilters(): void {
  this.searchTerm = '';
  this.statusFilter = '';
  this.dateFilter = '';
  this.monthFilter = '';  // ✅ AJOUTÉ
  this.yearFilter = '';    // ✅ AJOUTÉ
  this.applyFilters();
}
// ✅ Obtenir le libellé du mois à partir de sa valeur
// ✅ Obtenir le libellé du mois à partir de sa valeur
getMonthLabel(monthValue: string): string {
  const month = this.availableMonths.find(m => m.value === monthValue);
  return month ? month.label : '';
}

// ✅ Obtenir le libellé du statut à partir d'une chaîne
getStatusLabelFromString(status: string): string {
  const labels: { [key: string]: string } = {
    'DRAFT': 'Brouillon',
    'VALIDATED_ING': 'Validé ING',
    'TECH_FILLED': 'Rempli Technique',
    'VALIDATED_PT': 'Validé PT',
    'SENT_TO_SUPPLIER': 'Envoyé fournisseur',
    'RECEIVED_FROM_SUPPLIER': 'Réception fournisseur',
    'COMPLETED': 'Terminé'
  };
  return labels[status] || status;
}
  // ============ PAGINATION ============
  get paginatedSheets(): ChargeSheetComplete[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredSheets.slice(start, end);
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
    this.totalPages = Math.ceil(this.filteredSheets.length / this.pageSize);
  }

  // ============ STATUT BADGES ============
  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'DRAFT': 'bg-secondary bg-opacity-10 text-secondary',
      'VALIDATED_ING': 'bg-primary bg-opacity-10 text-primary',
      'TECH_FILLED': 'bg-info bg-opacity-10 text-info',
      'VALIDATED_PT': 'bg-warning bg-opacity-10 text-warning',
      'SENT_TO_SUPPLIER': 'bg-success bg-opacity-10 text-success',
      'RECEIVED_FROM_SUPPLIER': 'bg-success bg-opacity-10 text-success',
      'COMPLETED': 'bg-success bg-opacity-10 text-success'
    };
    return classes[status] || 'bg-secondary bg-opacity-10 text-secondary';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'DRAFT': 'bi-file-earmark',
      'VALIDATED_ING': 'bi-check-circle',
      'TECH_FILLED': 'bi-gear',
      'VALIDATED_PT': 'bi-check2-circle',
      'SENT_TO_SUPPLIER': 'bi-truck',
      'RECEIVED_FROM_SUPPLIER': 'bi-box-arrow-in-down',
      'COMPLETED': 'bi-check-all'
    };
    return icons[status] || 'bi-question-circle';
  }

  // ============ UTILITAIRES POUR LES ITEMS ============
  getItemsTooltip(sheet: ChargeSheetComplete): string {
    if (!sheet.items || sheet.items.length === 0) {
      return 'Aucun item';
    }

    const filled = sheet.items.filter(i => i.itemStatus === 'TECH_FILLED').length;
    const total = sheet.items.length;

    return `📦 Items: ${total}\n✅ Remplis: ${filled}\n⏳ En attente: ${total - filled}`;
  }

  getFirstUnfilledItem(sheet: ChargeSheetComplete): ChargeSheetItemDto | null {
    if (!sheet.items || sheet.items.length === 0) {
      return null;
    }
    return sheet.items.find(item => item.itemStatus !== 'TECH_FILLED') || sheet.items[0] || null;
  }

  areAllItemsFilled(sheet: ChargeSheetComplete): boolean {
    if (!sheet.items || sheet.items.length === 0) return false;
    return sheet.items.every(item => item.itemStatus === 'TECH_FILLED');
  }

  // ============ VALIDATION ============
  validateSheetByIng(id: number): void {
    const sheet = this.chargeSheets.find(s => s.id === id);
    if (!sheet) return;

    const message = `Voulez-vous vraiment valider ce cahier des charges (ID: ${id}) ?\n\n` +
                    `Cette action marque la fin de la saisie ING et empêchera toute modification future des informations générales.`;

    if (!confirm(message)) return;

    this.chargeSheetService.validateByIng(id).subscribe({
      next: () => {
        this.fetchChargeSheets();
        alert('✅ Cahier validé avec succès par ING');
      },
      error: (err: any) => {
        console.error('Erreur validation ING:', err);
        alert(`❌ Erreur lors de la validation: ${err.error?.message || err.message || 'Erreur inconnue'}`);
      }
    });
  }

  validateSheetByPt(id: number): void {
    const sheet = this.chargeSheets.find(s => s.id === id);
    if (!sheet) return;

    if (!this.areAllItemsFilled(sheet)) {
      alert('❌ Impossible de valider : tous les items doivent être remplis avant validation PT');
      return;
    }

    let message = `Voulez-vous vraiment valider la partie technique de ce cahier (ID: ${id}) ?\n\n`;

    if (sheet.status === 'VALIDATED_ING') {
      message += '✅ Après validation, le cahier passera au statut "VALIDATED_PT" (Validé PT).\n';
      message += '📤 Vous pourrez ensuite l\'envoyer au fournisseur.';
    } else if (sheet.status === 'TECH_FILLED') {
      message += '✅ Après validation, le cahier passera au statut "VALIDATED_PT" (Validé PT).\n';
      message += '📤 Vous pourrez ensuite l\'envoyer au fournisseur.';
    } else {
      message += '✅ La partie technique sera marquée comme validée (VALIDATED_PT).';
    }

    if (!confirm(message)) return;

    console.log('🔄 Validation PT pour le cahier:', id);

    this.chargeSheetService.validateByPt(id).subscribe({
      next: (response) => {
        console.log('✅ Réponse validation PT:', response);
        this.fetchChargeSheets();
        alert('✅ Partie technique validée avec succès. Le cahier est maintenant en statut VALIDATED_PT');
      },
      error: (err: any) => {
        console.error('❌ Erreur validation PT:', err);
        let errorMsg = 'Erreur lors de la validation';
        if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.message) {
          errorMsg = err.message;
        }
        alert(`❌ ${errorMsg}`);
      }
    });
  }

  sendToSupplier(id: number): void {
    const sheet = this.chargeSheets.find(s => s.id === id);
    if (!sheet) return;

    if (sheet.status !== 'VALIDATED_PT') {
      alert(`❌ Impossible d'envoyer : le statut actuel est "${sheet.status}". Le cahier doit être en statut VALIDATED_PT.`);
      return;
    }

    if (!confirm("Envoyer ce cahier au fournisseur ?")) return;

    this.chargeSheetService.sendToSupplier(id).subscribe({
      next: (response) => {
        console.log('✅ Cahier envoyé au fournisseur:', response);
        this.fetchChargeSheets();
        alert("📦 Cahier envoyé au fournisseur avec succès");
      },
      error: err => {
        console.error('❌ Erreur envoi fournisseur:', err);
        alert("Erreur lors de l'envoi: " + (err.error?.message || err.message));
      }
    });
  }

  confirmReception(id: number): void {
    if (!confirm("Confirmer la réception du fournisseur ?")) return;

    this.chargeSheetService.confirmReception(id).subscribe({
      next: () => {
        this.fetchChargeSheets();
        alert("📥 Réception confirmée");
      },
      error: err => {
        console.error(err);
        alert("Erreur lors de la confirmation");
      }
    });
  }

  completeSheet(id: number): void {
    if (!confirm("Marquer ce cahier comme COMPLETED ?")) return;

    this.chargeSheetService.completeSheet(id).subscribe({
      next: () => {
        this.fetchChargeSheets();
        alert("✅ Cahier complété");
      },
      error: err => {
        console.error(err);
        alert("Erreur");
      }
    });
  }

  workflowSteps: ChargeSheetStatus[] = [
    ChargeSheetStatus.DRAFT,
    ChargeSheetStatus.VALIDATED_ING,
    ChargeSheetStatus.TECH_FILLED,
    ChargeSheetStatus.VALIDATED_PT,
    ChargeSheetStatus.SENT_TO_SUPPLIER,
    ChargeSheetStatus.RECEIVED_FROM_SUPPLIER,
    ChargeSheetStatus.COMPLETED
  ];

  isStepCompleted(step: ChargeSheetStatus, currentStatus: ChargeSheetStatus): boolean {
    return this.workflowSteps.indexOf(step) <= this.workflowSteps.indexOf(currentStatus);
  }

 // ============ EXPORT EXCEL ============
  // ✅ Charger les images pour un cahier spécifique
private async loadItemImagesForSheet(chargeSheet: ChargeSheetComplete): Promise<void> {
  if (!chargeSheet.items) return;

  for (const item of chargeSheet.items) {
    if (item.id && item.realConnectorPicture) {
      try {
        const url = await firstValueFrom(this.uploadService.getImageUrl(item.realConnectorPicture));
        if (url) {
          this.itemImages[item.id] = url;
        }
      } catch (err) {
        console.error(`Erreur chargement image pour item ${item.id}:`, err);
      }
    }
  }
}
  // ✅ Export d'un seul cahier
  async exportOneToExcel(sheet: ChargeSheetComplete): Promise<void> {
    if (!sheet || !sheet.id) {
      alert('Données invalides pour l\'export');
      return;
    }

    try {
      const fullSheet = await firstValueFrom(this.chargeSheetService.getById(sheet.id));
      if (!fullSheet) {
        alert('Impossible de charger les détails du cahier');
        return;
      }

      await this.exportSingleChargeSheetToExcel(fullSheet);
    } catch (err: any) {
      console.error('Erreur chargement détails:', err);
      alert('Impossible de charger les détails pour l\'export');
    }
  }

  // ✅ Export de tous les cahiers filtrés dans un SEUL fichier Excel
  async exportAllToExcel(): Promise<void> {
    if (this.filteredSheets.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    let successCount = 0;
    let errorCount = 0;

    // Créer une page de sommaire
    const summarySheet = workbook.addWorksheet('Sommaire');
    const summaryTitle = summarySheet.addRow(['LISTE DES CAHIERS DES CHARGES EXPORTÉS']);
    summaryTitle.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    summaryTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    summaryTitle.height = 35;
    summarySheet.mergeCells(1, 1, 1, 6);

    const filterInfo = summarySheet.addRow([`Export du ${new Date().toLocaleDateString('fr-FR')} - ${this.filteredSheets.length} cahier(s) trouvé(s)`]);
    filterInfo.font = { italic: true, size: 10 };
    summarySheet.mergeCells(2, 1, 2, 6);

    summarySheet.addRow([]);
    summarySheet.addRow(['ID', 'Référence', 'Projet', 'Harness Ref', 'Statut', 'Nb Items']);
    const summaryHeader = summarySheet.getRow(4);
    summaryHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E86C1' } };
    summaryHeader.height = 25;

    // Pour chaque cahier filtré
    for (let i = 0; i < this.filteredSheets.length; i++) {
      const sheet = this.filteredSheets[i];
      try {
        const fullSheet = await firstValueFrom(this.chargeSheetService.getById(sheet.id));
        if (fullSheet && fullSheet.items && fullSheet.items.length > 0) {
           // ✅ Charger les images pour ce cahier
        await this.loadItemImagesForSheet(fullSheet);
          // Créer un onglet pour ce cahier
          const sheetName = this.getValidSheetName(`Cahier_${fullSheet.id}`);
          const worksheet = workbook.addWorksheet(sheetName);
          await this.populateChargeSheetWorksheet(worksheet, fullSheet);
          successCount++;

          // Ajouter au sommaire
          const row = summarySheet.addRow([
            fullSheet.id,
            fullSheet.harnessRef || '-',
            fullSheet.project || '-',
            fullSheet.harnessRef || '-',
            this.chargeSheetService.getStatusLabel(fullSheet.status) || fullSheet.status,
            fullSheet.items?.length || 0
          ]);

          // Ajouter un lien hypertexte vers l'onglet
          const cell = row.getCell(1);
          cell.value = { text: fullSheet.id.toString(), hyperlink: `#${sheetName}!A1` };
          cell.font = { color: { argb: 'FF2E86C1' }, underline: true };
        } else if (fullSheet && (!fullSheet.items || fullSheet.items.length === 0)) {
          // Cahier sans items
          const sheetName = this.getValidSheetName(`Cahier_${fullSheet.id}_vide`);
          const worksheet = workbook.addWorksheet(sheetName);
          worksheet.addRow(['Aucun item dans ce cahier']);
          worksheet.addRow([`Cahier #${fullSheet.id} - ${fullSheet.harnessRef || 'Sans référence'}`]);
          worksheet.addRow(['']);
          worksheet.addRow(['Ce cahier ne contient aucun item à exporter.']);
          successCount++;

          const row = summarySheet.addRow([
            fullSheet.id,
            fullSheet.harnessRef || '-',
            fullSheet.project || '-',
            fullSheet.harnessRef || '-',
            this.chargeSheetService.getStatusLabel(fullSheet.status) || fullSheet.status,
            0
          ]);

          const cell = row.getCell(1);
          cell.value = { text: fullSheet.id.toString(), hyperlink: `#${sheetName}!A1` };
          cell.font = { color: { argb: 'FF2E86C1' }, underline: true };
        }
      } catch (error) {
        console.error(`Erreur export cahier ${sheet.id}:`, error);
        errorCount++;
      }
    }

    // Styliser le sommaire
    for (let i = 5; i <= summarySheet.rowCount; i++) {
      const row = summarySheet.getRow(i);
      if ((i - 5) % 2 === 0) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
        });
      }
    }

    // Définir les largeurs des colonnes du sommaire
    summarySheet.columns = [
      { width: 10 }, // ID
      { width: 20 }, // Référence
      { width: 20 }, // Projet
      { width: 20 }, // Harness Ref
      { width: 20 }, // Statut
      { width: 10 }  // Nb Items
    ];

    // Générer le fichier
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const fileName = `Cahiers_charges_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);

    if (errorCount === 0) {
      alert(`✅ Export terminé avec succès : ${successCount} cahier(s) exporté(s) dans un seul fichier`);
    } else {
      alert(`⚠️ Export partiel : ${successCount} cahier(s) exporté(s), ${errorCount} erreur(s)`);
    }
  }

  // ✅ Export d'un seul cahier dans un fichier Excel
  private async exportSingleChargeSheetToExcel(chargeSheet: ChargeSheetComplete): Promise<void> {
     // ✅ Charger les images pour ce cahier
  await this.loadItemImagesForSheet(chargeSheet);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Items');
    await this.populateChargeSheetWorksheet(worksheet, chargeSheet);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `ChargeSheet_${chargeSheet.id}_Items.xlsx`);
  }

  // ✅ Remplir une feuille Excel avec les données d'un cahier (TOUS LES ITEMS)
private async populateChargeSheetWorksheet(worksheet: ExcelJS.Worksheet, chargeSheet: ChargeSheetComplete): Promise<void> {
  const items = chargeSheet.items;
  if (!items || items.length === 0) {
    worksheet.addRow(['Aucun item dans ce cahier']);
    worksheet.addRow([`Cahier #${chargeSheet.id} - ${chargeSheet.harnessRef || 'Sans référence'}`]);
    return;
  }

  // ===== TITRE =====
  const titleRow = worksheet.addRow(['CAHIER DE CHARGE #' + chargeSheet.id]);
  titleRow.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
  titleRow.height = 35;
  worksheet.mergeCells(1, 1, 1, 15);

  // ===== INFORMATIONS GÉNÉRALES =====
  const infoData = [
    ['Plant:', chargeSheet.plant || ''],
    ['Projet:', chargeSheet.project || ''],
    ['Harness Ref:', chargeSheet.harnessRef || ''],
    ['Issued By:', chargeSheet.issuedBy || ''],
    ['Email:', chargeSheet.emailAddress || ''],
    ['Téléphone:', chargeSheet.phoneNumber || ''],
    ['N° Commande:', chargeSheet.orderNumber || ''],
    ['Centre coût:', chargeSheet.costCenterNumber || ''],
    ['Date création:', chargeSheet.date ? new Date(chargeSheet.date).toLocaleDateString('fr-FR') : ''],
    ['Date livraison:', chargeSheet.preferredDeliveryDate ? new Date(chargeSheet.preferredDeliveryDate).toLocaleDateString('fr-FR') : ''],
    ['Statut:', this.chargeSheetService.getStatusLabel(chargeSheet.status) || '']
  ];

  infoData.forEach(([label, value]) => {
    const row = worksheet.addRow([label, value]);
    row.getCell(1).font = { bold: true };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    row.height = 20;
  });

  worksheet.addRow([]);

  // ===== DÉFINITION DES COLONNES =====
  const generalCols = [
    { key: 'id', width: 8 }, { key: 'itemNumber', width: 8 }, { key: 'samplesExist', width: 8 },
    { key: 'ways', width: 6 }, { key: 'housingColour', width: 10 }, { key: 'testModuleExistInDatabase', width: 10 },
    { key: 'housingReferenceLeoni', width: 15 }, { key: 'housingReferenceSupplierCustomer', width: 15 },
    { key: 'referenceSealsClipsCableTiesCap', width: 12 }, { key: 'photo', width: 12 },
    { key: 'quantityOfTestModules', width: 8 }, { key: 'outsideHousingExist', width: 8 },
    { key: 'insideHousingExist', width: 8 }, { key: 'coverHoodExist', width: 8 },
    { key: 'coverHoodClosed', width: 10 }, { key: 'capExist', width: 6 }, { key: 'bayonetCapExist', width: 8 },
    { key: 'bracketExist', width: 8 }, { key: 'bracketOpen', width: 10 }, { key: 'bracketClosed', width: 10 },
    { key: 'latchWingExist', width: 8 }, { key: 'sliderExist', width: 8 }, { key: 'sliderOpen', width: 10 },
    { key: 'sliderClosed', width: 10 }, { key: 'secondaryLockExist', width: 8 }, { key: 'secondaryLockOpen', width: 10 },
    { key: 'secondaryLockClosed', width: 12 }, { key: 'offsetTest', width: 8 }, { key: 'pushBackTest', width: 8 },
    { key: 'terminalOrientation', width: 10 }, { key: 'terminalDifferentiation', width: 10 }, { key: 'ringTerminal', width: 8 },
    { key: 'singleContact', width: 10 }, { key: 'heatShrinkExist', width: 8 }, { key: 'openShuntsAirbag', width: 8 },
    { key: 'flowTest', width: 8 }, { key: 'solidMetalContour', width: 8 }, { key: 'metalContourAdjustable', width: 8 },
    { key: 'metalRailsFasteningSystem', width: 10 }, { key: 'metalPlatesFasteningSystem', width: 10 },
    { key: 'spacerClosingUnit', width: 8 }, { key: 'spring', width: 8 }, { key: 'cableTieExist', width: 8 },
    { key: 'cableTieLeft', width: 8 }, { key: 'cableTieRight', width: 8 }, { key: 'cableTieMiddle', width: 8 },
    { key: 'cableTieLeftRight', width: 8 }, { key: 'clipExist', width: 6 }, { key: 'screwExist', width: 6 },
    { key: 'nutExist', width: 6 }, { key: 'convolutedConduitExist', width: 8 }, { key: 'convolutedConduitClosed', width: 10 },
    { key: 'cableChannelExist', width: 8 }, { key: 'cableChannelClosed', width: 10 }, { key: 'grommetExist', width: 8 },
    { key: 'grommetOrientation', width: 12 }, { key: 'presenceTestOfOneSideConnectedShield', width: 12 },
    { key: 'antennaOnlyPresenceTest', width: 10 }, { key: 'antennaOnlyContactingOfShield', width: 12 },
    { key: 'antennaContactingOfShieldAndCoreWire', width: 12 }, { key: 'otherDetection', width: 10 },
    { key: 'mechanicalCoding', width: 10 }, { key: 'electricalCoding', width: 10 }, { key: 'airbagTestViaServiceWindow', width: 8 },
    { key: 'leakTestPressure', width: 8 }, { key: 'leakTestVacuum', width: 8 }, { key: 'leakTestComplex', width: 10 },
    { key: 'pinStraightnessCheck', width: 10 }, { key: 'contrastDetectionGreyValueSensor', width: 8 },
    { key: 'colourDetection', width: 10 }, { key: 'colourDetectionPrepared', width: 10 },
    { key: 'attenuationWithModeScrambler', width: 8 }, { key: 'attenuationWithoutModeScrambler', width: 10 },
    { key: 'insulationResistance', width: 8 }, { key: 'highVoltageModule', width: 8 }, { key: 'kelvinMeasurementHV', width: 8 },
    { key: 'actuatorTestHV', width: 8 }, { key: 'chargingSystemElectrical', width: 10 }, { key: 'ptuPipeTestUnit', width: 5 },
    { key: 'gtuGrommetTestUnit', width: 5 }, { key: 'ledLEDTestModule', width: 5 }, { key: 'tigTerminalInsertionGuidance', width: 5 },
    { key: 'linBusFunctionalityTest', width: 5 }, { key: 'canBusFunctionalityTest', width: 5 }, { key: 'esdConformModule', width: 5 },
    { key: 'fixedBlock', width: 8 }, { key: 'movingBlock', width: 8 }, { key: 'tiltModule', width: 5 },
    { key: 'slideModule', width: 5 }, { key: 'handAdapter', width: 10 }, { key: 'lsmLeoniSmartModule', width: 5 },
    { key: 'leoniStandardTestTable', width: 8 }, { key: 'quickConnectionByCanonConnector', width: 10 },
    { key: 'testBoard', width: 8 }, { key: 'weetech', width: 8 }, { key: 'bak', width: 5 }, { key: 'ogc', width: 5 },
    { key: 'adaptronicHighVoltage', width: 8 }, { key: 'emdepHVBananaPlug', width: 8 }, { key: 'leoniEMOStandardHV', width: 10 },
    { key: 'clipOrientation', width: 10 }, { key: 'unitPrice', width: 12 }, { key: 'totalPrice', width: 12 }
  ];

  worksheet.columns = generalCols;

  const lastRow = worksheet.lastRow;
  if (!lastRow) return;

  const headerRowNumber = lastRow.number + 1;

  const generalStart = 1, generalEnd = 11;
  const housingStart = 12, housingEnd = 27;
  const fasteningStart = 28, fasteningEnd = 42;
  const cableStart = 43, cableEnd = 61;
  const electricalStart = 62, electricalEnd = 101;
  const priceStart = 102, priceEnd = 103;

  // ===== EN-TÊTES GROUPÉS =====
  const headerRow = worksheet.addRow([]);
  headerRow.getCell(generalStart).value = 'Général';
  worksheet.mergeCells(headerRowNumber, generalStart, headerRowNumber, generalEnd);
  headerRow.getCell(housingStart).value = 'Housing Tests';
  worksheet.mergeCells(headerRowNumber, housingStart, headerRowNumber, housingEnd);
  headerRow.getCell(fasteningStart).value = 'Fastening / Assembly';
  worksheet.mergeCells(headerRowNumber, fasteningStart, headerRowNumber, fasteningEnd);
  headerRow.getCell(cableStart).value = 'Cable / Conduit';
  worksheet.mergeCells(headerRowNumber, cableStart, headerRowNumber, cableEnd);
  headerRow.getCell(electricalStart).value = 'Electrical / Tests';
  worksheet.mergeCells(headerRowNumber, electricalStart, headerRowNumber, electricalEnd);
  headerRow.getCell(priceStart).value = 'Prix';
  worksheet.mergeCells(headerRowNumber, priceStart, headerRowNumber, priceEnd);

  headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4E73DF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // ===== SOUS-EN-TÊTES =====
  const subHeaderRow = worksheet.addRow([
    'ID', 'Item', 'Échant.', 'Voies', 'Couleur', 'Module DB', 'Réf. Leoni', 'Réf. client', 'Réf. joints', 'Photo', 'Quantité',
    'Outside', 'Inside', 'Cover', 'Cover Closed', 'Cap', 'Bayonet', 'Bracket', 'Bracket Open', 'Bracket Closed', 'Latch', 'Slider', 'Slider Open', 'Slider Closed', 'Sec Lock', 'Sec Lock Open', 'Sec Lock Closed',
    'Offset', 'PushBack', 'Term Orient', 'Term Diff', 'Ring Term', 'Single Contact', 'HeatShrink', 'OpenShunts', 'FlowTest', 'SolidMetal', 'MetalAdj', 'MetalRails', 'MetalPlates', 'Spacer', 'Spring',
    'CableTie', 'Tie Left', 'Tie Right', 'Tie Middle', 'Tie L/R', 'Clip', 'Screw', 'Nut', 'Conduit', 'Conduit Closed', 'Channel', 'Channel Closed', 'Grommet', 'Grommet Orient', 'OneSideShield', 'AntennaPres', 'AntennaShield', 'AntennaCore', 'OtherDetect',
    'MechCoding', 'ElecCoding', 'Airbag', 'LeakPress', 'LeakVac', 'LeakComplex', 'PinStraight', 'Contrast', 'ColourDetect', 'ColourPrep', 'AttenWith', 'AttenWithout', 'Insulation', 'HVModule', 'KelvinHV', 'ActuatorHV', 'ChargingSys', 'PTU', 'GTU', 'LED', 'TIG', 'LIN', 'CAN', 'ESD', 'FixedBlock', 'MovingBlock', 'Tilt', 'Slide', 'HandAdapter', 'LSM', 'LeoniStd', 'QuickConn', 'TestBoard', 'WEETECH', 'BAK', 'OGC', 'Adaptronic', 'EMDEP', 'LEONI EMO', 'ClipOrient',
    'Prix unitaire', 'Prix total'
  ]);

  subHeaderRow.font = { bold: true };
  subHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FC' } };
  subHeaderRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  subHeaderRow.height = 30;

  // ===== AJOUT DES DONNÉES DES ITEMS =====
  const itemsLength = items.length;
  const dataStartRow = subHeaderRow.number + 1;

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (value === '*') return '✓';
    if (value === '') return '✗';
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    if (value === 'Yes') return 'Oui';
    if (value === 'No') return 'Non';
    return String(value);
  };

  for (let i = 0; i < itemsLength; i++) {
    const item = items[i];
    const rowIndex = dataStartRow + i;
    const rowData: any = {};

    // Général
    rowData.id = item.id;
    rowData.itemNumber = item.itemNumber ? '#' + item.itemNumber : '';
    rowData.samplesExist = item.samplesExist === 'Yes' ? 'Oui' : 'Non';
    rowData.ways = item.ways || '';
    rowData.housingColour = item.housingColour || '';
    rowData.testModuleExistInDatabase = item.testModuleExistInDatabase === 'Yes' ? 'Oui' : 'Non';
    rowData.housingReferenceLeoni = item.housingReferenceLeoni || '';
    rowData.housingReferenceSupplierCustomer = item.housingReferenceSupplierCustomer || '';
    rowData.referenceSealsClipsCableTiesCap = item.referenceSealsClipsCableTiesCap || '';
    rowData.photo = '';
    rowData.quantityOfTestModules = item.quantityOfTestModules || 0;

    // Housing
    rowData.outsideHousingExist = formatValue(item.outsideHousingExist);
    rowData.insideHousingExist = formatValue(item.insideHousingExist);
    rowData.coverHoodExist = formatValue(item.coverHoodExist);
    rowData.coverHoodClosed = formatValue(item.coverHoodClosed);
    rowData.capExist = formatValue(item.capExist);
    rowData.bayonetCapExist = formatValue(item.bayonetCapExist);
    rowData.bracketExist = formatValue(item.bracketExist);
    rowData.bracketOpen = formatValue(item.bracketOpen);
    rowData.bracketClosed = formatValue(item.bracketClosed);
    rowData.latchWingExist = formatValue(item.latchWingExist);
    rowData.sliderExist = formatValue(item.sliderExist);
    rowData.sliderOpen = formatValue(item.sliderOpen);
    rowData.sliderClosed = formatValue(item.sliderClosed);
    rowData.secondaryLockExist = formatValue(item.secondaryLockExist);
    rowData.secondaryLockOpen = formatValue(item.secondaryLockOpen);
    rowData.secondaryLockClosed = formatValue(item.secondaryLockClosed);

    // Fastening
    rowData.offsetTest = formatValue(item.offsetTest);
    rowData.pushBackTest = formatValue(item.pushBackTest);
    rowData.terminalOrientation = formatValue(item.terminalOrientation);
    rowData.terminalDifferentiation = formatValue(item.terminalDifferentiation);
    rowData.ringTerminal = formatValue(item.ringTerminal);
    rowData.singleContact = formatValue(item.singleContact);
    rowData.heatShrinkExist = formatValue(item.heatShrinkExist);
    rowData.openShuntsAirbag = formatValue(item.openShuntsAirbag);
    rowData.flowTest = formatValue(item.flowTest);
    rowData.solidMetalContour = formatValue(item.solidMetalContour);
    rowData.metalContourAdjustable = formatValue(item.metalContourAdjustable);
    rowData.metalRailsFasteningSystem = formatValue(item.metalRailsFasteningSystem);
    rowData.metalPlatesFasteningSystem = formatValue(item.metalPlatesFasteningSystem);
    rowData.spacerClosingUnit = formatValue(item.spacerClosingUnit);
    rowData.spring = formatValue(item.spring);

    // Cable
    rowData.cableTieExist = formatValue(item.cableTieExist);
    rowData.cableTieLeft = formatValue(item.cableTieLeft);
    rowData.cableTieRight = formatValue(item.cableTieRight);
    rowData.cableTieMiddle = formatValue(item.cableTieMiddle);
    rowData.cableTieLeftRight = formatValue(item.cableTieLeftRight);
    rowData.clipExist = formatValue(item.clipExist);
    rowData.screwExist = formatValue(item.screwExist);
    rowData.nutExist = formatValue(item.nutExist);
    rowData.convolutedConduitExist = formatValue(item.convolutedConduitExist);
    rowData.convolutedConduitClosed = formatValue(item.convolutedConduitClosed);
    rowData.cableChannelExist = formatValue(item.cableChannelExist);
    rowData.cableChannelClosed = formatValue(item.cableChannelClosed);
    rowData.grommetExist = formatValue(item.grommetExist);
    rowData.grommetOrientation = item.grommetOrientation || '';
    rowData.presenceTestOfOneSideConnectedShield = formatValue(item.presenceTestOfOneSideConnectedShield);
    rowData.antennaOnlyPresenceTest = formatValue(item.antennaOnlyPresenceTest);
    rowData.antennaOnlyContactingOfShield = formatValue(item.antennaOnlyContactingOfShield);
    rowData.antennaContactingOfShieldAndCoreWire = formatValue(item.antennaContactingOfShieldAndCoreWire);
    rowData.otherDetection = formatValue(item.otherDetection);

    // Electrical
    rowData.mechanicalCoding = formatValue(item.mechanicalCoding);
    rowData.electricalCoding = formatValue(item.electricalCoding);
    rowData.airbagTestViaServiceWindow = formatValue(item.airbagTestViaServiceWindow);
    rowData.leakTestPressure = formatValue(item.leakTestPressure);
    rowData.leakTestVacuum = formatValue(item.leakTestVacuum);
    rowData.leakTestComplex = formatValue(item.leakTestComplex);
    rowData.pinStraightnessCheck = formatValue(item.pinStraightnessCheck);
    rowData.contrastDetectionGreyValueSensor = formatValue(item.contrastDetectionGreyValueSensor);
    rowData.colourDetection = formatValue(item.colourDetection);
    rowData.colourDetectionPrepared = formatValue(item.colourDetectionPrepared);
    rowData.attenuationWithModeScrambler = formatValue(item.attenuationWithModeScrambler);
    rowData.attenuationWithoutModeScrambler = formatValue(item.attenuationWithoutModeScrambler);
    rowData.insulationResistance = formatValue(item.insulationResistance);
    rowData.highVoltageModule = formatValue(item.highVoltageModule);
    rowData.kelvinMeasurementHV = formatValue(item.kelvinMeasurementHV);
    rowData.actuatorTestHV = formatValue(item.actuatorTestHV);
    rowData.chargingSystemElectrical = formatValue(item.chargingSystemElectrical);
    rowData.ptuPipeTestUnit = formatValue(item.ptuPipeTestUnit);
    rowData.gtuGrommetTestUnit = formatValue(item.gtuGrommetTestUnit);
    rowData.ledLEDTestModule = formatValue(item.ledLEDTestModule);
    rowData.tigTerminalInsertionGuidance = formatValue(item.tigTerminalInsertionGuidance);
    rowData.linBusFunctionalityTest = formatValue(item.linBusFunctionalityTest);
    rowData.canBusFunctionalityTest = formatValue(item.canBusFunctionalityTest);
    rowData.esdConformModule = formatValue(item.esdConformModule);
    rowData.fixedBlock = formatValue(item.fixedBlock);
    rowData.movingBlock = formatValue(item.movingBlock);
    rowData.tiltModule = formatValue(item.tiltModule);
    rowData.slideModule = formatValue(item.slideModule);
    rowData.handAdapter = formatValue(item.handAdapter);
    rowData.lsmLeoniSmartModule = formatValue(item.lsmLeoniSmartModule);
    rowData.leoniStandardTestTable = formatValue(item.leoniStandardTestTable);
    rowData.quickConnectionByCanonConnector = formatValue(item.quickConnectionByCanonConnector);
    rowData.testBoard = item.testBoard || '';
    rowData.weetech = formatValue(item.weetech);
    rowData.bak = formatValue(item.bak);
    rowData.ogc = formatValue(item.ogc);
    rowData.adaptronicHighVoltage = formatValue(item.adaptronicHighVoltage);
    rowData.emdepHVBananaPlug = formatValue(item.emdepHVBananaPlug);
    rowData.leoniEMOStandardHV = formatValue(item.leoniEMOStandardHV);
    rowData.clipOrientation = item.clipOrientation || '';
    rowData.unitPrice = item.unitPrice || 0;
    rowData.totalPrice = item.totalPrice || 0;

    const row = worksheet.addRow(Object.values(rowData));

    // ✅ AJOUTER L'IMAGE SI ELLE EXISTE (placé correctement dans la boucle)
    if (item.id && this.itemImages && this.itemImages[item.id]) {
      try {
        const imageUrl = this.itemImages[item.id];
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        let extension: 'png' | 'jpeg' | 'gif' = 'png';
        if (imageUrl.includes('jpg') || imageUrl.includes('jpeg')) extension = 'jpeg';
        else if (imageUrl.includes('gif')) extension = 'gif';

        const imageId = (worksheet as any).workbook.addImage({
          buffer: arrayBuffer,
          extension: extension
        });

        // Positionner l'image dans la colonne "Photo" (colonne 10)
        worksheet.addImage(imageId, {
          tl: { col: 9.5, row: rowIndex - 0.8 },
          ext: { width: 80, height: 80 },
          editAs: 'oneCell'
        });
      } catch (error) {
        console.error(`Erreur chargement image pour item ${item.id}:`, error);
      }
    }
  }

  // ===== STYLISER LES LIGNES =====
  for (let i = dataStartRow; i < dataStartRow + itemsLength; i++) {
    const row = worksheet.getRow(i);
    row.height = 80;
    if ((i - dataStartRow) % 2 === 0) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBFBFD' } };
      });
    }
  }

  // ===== AJOUTER DES BORDURES =====
  const getColumnLetter = (index: number): string => {
    let letter = '';
    while (index > 0) {
      const mod = (index - 1) % 26;
      letter = String.fromCharCode(65 + mod) + letter;
      index = Math.floor((index - 1) / 26);
    }
    return letter;
  };

  const addGroupBorder = (colLetter: string) => {
    for (let i = headerRowNumber; i < dataStartRow + itemsLength; i++) {
      const cell = worksheet.getCell(`${colLetter}${i}`);
      cell.border = { left: { style: 'medium', color: { argb: 'FF4E73DF' } } };
    }
  };

  addGroupBorder(getColumnLetter(generalEnd + 1));
  addGroupBorder(getColumnLetter(housingEnd + 1));
  addGroupBorder(getColumnLetter(fasteningEnd + 1));
  addGroupBorder(getColumnLetter(cableEnd + 1));
  addGroupBorder(getColumnLetter(electricalEnd + 1));
}

  // ✅ Valider le nom de la feuille (Excel limite à 31 caractères)
  private getValidSheetName(name: string): string {
    let validName = name.replace(/[\\/*?:\[\]]/g, '');
    if (validName.length > 31) {
      validName = validName.substring(0, 31);
    }
    return validName;
  }

  // ============ SUPPRESSION ============
  deleteSheet(id: number): void {
    if (!id) return;

    const sheet = this.chargeSheets.find(s => s.id === id);
    const sheetInfo = sheet ? `${sheet.project} - ${sheet.harnessRef}` : `ID ${id}`;

    const confirmation = confirm(`⚠️ Voulez-vous vraiment supprimer ce cahier ?\n\n` +
                                 `Cahier: ${sheetInfo}\n` +
                                 `Cette action est irréversible et supprimera également tous les items associés.`);

    if (!confirmation) return;

    this.chargeSheetService.delete(id).subscribe({
      next: () => {
        this.chargeSheets = this.chargeSheets.filter(s => s.id !== id);
        this.applyFilters();
        alert('✅ Cahier supprimé avec succès');
      },
      error: (err: any) => {
        console.error('Erreur suppression:', err);
        alert('❌ Erreur lors de la suppression');
      }
    });
  }
}
