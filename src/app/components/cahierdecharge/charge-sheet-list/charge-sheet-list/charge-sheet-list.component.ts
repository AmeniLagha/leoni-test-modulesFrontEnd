import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChargeSheetComplete, ChargeSheetItemDto, ChargeSheetStatus, ReceptionHistoryDto } from '../../../../../models/charge-sheet.model';
import { ChargeSheetService } from '../../../../../services/charge-sheet.service';
import { AuthService } from '../../../../../services/auth.service';
import { ExcelExportService } from '../../../../../services/excel-export.service';

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

  constructor(
    public chargeSheetService: ChargeSheetService,
    private authService: AuthService,
    private excelExportService: ExcelExportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchChargeSheets();
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

  // ============ CHARGEMENT DES DONNÉES ============
  fetchChargeSheets(): void {
    this.loading = true;
    this.chargeSheetService.getAll().subscribe({
      next: (data: ChargeSheetComplete[]) => {
        this.chargeSheets = data;
        this.applyFilters();
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

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.dateFilter = '';
    this.applyFilters();
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
  exportOneToExcel(sheet: ChargeSheetComplete): void {
    if (!sheet || !sheet.id) {
      alert('Données invalides pour l\'export');
      return;
    }

    this.chargeSheetService.getById(sheet.id).subscribe({
      next: (fullSheet: ChargeSheetComplete) => {
        const fileName = `cahier_charge_${sheet.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
        this.excelExportService.exportChargeSheetToExcel(fullSheet, fileName);
      },
      error: (err: any) => {
        console.error('Erreur chargement détails:', err);
        alert('Impossible de charger les détails pour l\'export');
      }
    });
  }

  exportAllToExcel(): void {
    if (this.chargeSheets.length > 0) {
      this.excelExportService.exportMultipleChargeSheets(
        this.chargeSheets,
        `tous_cahiers_${new Date().toISOString().split('T')[0]}.xlsx`
      );
    }
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
