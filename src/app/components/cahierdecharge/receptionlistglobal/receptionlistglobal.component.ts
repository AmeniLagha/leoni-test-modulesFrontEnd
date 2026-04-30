import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ReceptionHistoryDto } from '../../../../models/charge-sheet.model';
import { ChargeSheetService } from '../../../../services/charge-sheet.service';
import { AuthService } from '../../../../services/auth.service';


@Component({
  selector: 'app-receptionlistglobal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
 templateUrl: './receptionlistglobal.component.html',
 styleUrls: ['./receptionlistglobal.component.css']
})
export class ReceptionlistglobalComponent implements OnInit {
  receptions: (ReceptionHistoryDto & { chargeSheetId: number })[] = [];
  filteredReceptions: (ReceptionHistoryDto & { chargeSheetId: number })[] = [];
  loading = true;
  error: string | null = null;

  // Filtres
  searchTerm: string = '';
  selectedProject: string = '';
  dateFilter: string = '';
  selectedSupplier: string = '';

  // Statistiques
  totalQuantity: number = 0;
  uniqueReceptions: number = 0;
  uniqueChargeSheets: number = 0;
  uniqueItems: number = 0;

  // Données pour les filtres
  projects: string[] = [];
  suppliers: string[] = [];

  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalPages: number = 1;

  // Cache pour les projets
  private sheetProjects: Map<number, string> = new Map();

  constructor(
    private chargeSheetService: ChargeSheetService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllReceptions();
  }
  gotostat():void{
     this.router.navigate(['/reception/stat']);
  }

  private itemsReferenceMap = new Map<number, any>();

loadAllReceptions(): void {
  this.loading = true;
  this.error = null;

  this.chargeSheetService.getAll().subscribe({
    next: (sheets) => {
      const sheetMap = new Map();
      sheets.forEach(sheet => {
        sheetMap.set(sheet.id, sheet);
        this.sheetProjects.set(sheet.id, sheet.project);

        // ✅ Vérifier que l'item a un ID avant de le stocker
        if (sheet.items && Array.isArray(sheet.items)) {
          sheet.items.forEach(item => {
            if (item.id) {  // ← Vérification clé
              this.itemsReferenceMap.set(item.id, item);
            }
          });
        }

        if (!this.projects.includes(sheet.project)) {
          this.projects.push(sheet.project);
        }
      });

      const receptionPromises = sheets.map(sheet =>
        this.chargeSheetService.getReceptionHistory(sheet.id).toPromise()
          .then(histories => {
            if (histories && histories.length > 0) {
              return histories.map(h => ({
                ...h,
                chargeSheetId: sheet.id,
                chargeSheetOrderNumber: sheet.orderNumber,
                // Enrichir l'item avec les données du cahier
                item: {
                  ...h.item,
                  housingReferenceSupplierCustomer: h.item.housingReferenceSupplierCustomer ||
                                                    this.getItemReferenceFromSheet(sheet, h.item.id) ||
                                                    h.item.itemNumber
                }
              }));
            }
            return [];
          })
          .catch(err => {
            console.error(`Erreur pour le cahier ${sheet.id}:`, err);
            return [];
          })
      );
        Promise.all(receptionPromises).then(results => {
          this.receptions = results.flat();
          this.uniqueReceptions = this.receptions.length;

          // Calculer les statistiques
          const uniqueSheetIds = new Set(this.receptions.map(r => r.chargeSheetId));
          const uniqueItemIds = new Set(this.receptions.map(r => r.item.id));

          this.uniqueChargeSheets = uniqueSheetIds.size;
          this.uniqueItems = uniqueItemIds.size;
          this.totalQuantity = this.receptions.reduce((sum, r) => sum + r.quantityReceived, 0);

          // Extraire les fournisseurs uniques
          this.suppliers = [...new Set(this.receptions
            .map(r => r.deliveryNoteNumber?.split('-')[0] || '')
            .filter(s => s))];

          this.applyFilters();
          this.loading = false;
        });
      },
      error: (err) => {
        console.error('Erreur chargement cahiers:', err);
        this.error = 'Impossible de charger les données';
        this.loading = false;
      }
    });
  }
// ✅ Méthode helper pour trouver la référence d'un item dans un cahier
private getItemReferenceFromSheet(sheet: any, itemId: number): string | null {
  const item = sheet.items?.find((i: any) => i.id === itemId);
  return item?.housingReferenceSupplierCustomer || item?.itemNumber || null;
}
  getProjectForSheet(sheetId: number): string | undefined {
    return this.sheetProjects.get(sheetId);
  }

  applyFilters(): void {
    let filtered = [...this.receptions];

    // Filtre par recherche textuelle
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.deliveryNoteNumber?.toLowerCase().includes(term) ||
        r.item.itemNumber.toLowerCase().includes(term) ||
        r.comments?.toLowerCase().includes(term) ||
        r.chargeSheetId.toString().includes(term)
      );
    }

    // Filtre par projet
    if (this.selectedProject) {
      filtered = filtered.filter(r =>
        this.getProjectForSheet(r.chargeSheetId) === this.selectedProject
      );
    }

    // Filtre par date
    if (this.dateFilter) {
      filtered = filtered.filter(r =>
        new Date(r.receptionDate).toISOString().split('T')[0] === this.dateFilter
      );
    }

    // Filtre par fournisseur (basé sur le N° BL)
    if (this.selectedSupplier) {
      filtered = filtered.filter(r =>
        r.deliveryNoteNumber?.startsWith(this.selectedSupplier)
      );
    }

    this.filteredReceptions = filtered;
    this.totalPages = Math.ceil(this.filteredReceptions.length / this.pageSize);
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedProject = '';
    this.dateFilter = '';
    this.selectedSupplier = '';
    this.applyFilters();
  }

  get paginatedReceptions(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredReceptions.slice(start, end);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
