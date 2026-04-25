import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChargeSheetService } from '../../../../services/charge-sheet.service';
import { AuthService } from '../../../../services/auth.service';
import { ReceptionHistoryDto, ReceptionSummary } from '../../../../models/charge-sheet.model';

@Component({
  selector: 'app-reception-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './reception-list.component.html',
  styleUrls: ['./reception-list.component.css']
})
export class ReceptionListComponent implements OnInit {
  chargeSheetId: number | null = null;
   chargeSheetOrderNumber: string | null = null;
    selectedItemDetails: any = null;
  selectedItemId: number | null = null;
  receptions: ReceptionHistoryDto[] = [];
  filteredReceptions: ReceptionHistoryDto[] = [];
  receptionSummary: ReceptionSummary[] = [];
  loading = true;
  error: string | null = null;
  searchTerm: string = '';
  dateFilter: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chargeSheetService: ChargeSheetService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.chargeSheetId = +id;
      this.loadChargeSheetDetails(); // ✅ CHARGER LES DÉTAILS DU CAHIER
      }
    });

    this.route.queryParams.subscribe(params => {
      const itemId = params['itemId'];
      if (itemId) {
        this.selectedItemId = +itemId;
          this.loadItemDetails();
      }
      this.loadReceptions();
    });
  }

 // ✅ AJOUTER CETTE MÉTHODE
  loadChargeSheetDetails(): void {
    if (!this.chargeSheetId) return;

    this.chargeSheetService.getById(this.chargeSheetId).subscribe({
      next: (chargeSheet) => {
        this.chargeSheetOrderNumber = chargeSheet.orderNumber;
        console.log('Order number chargé:', this.chargeSheetOrderNumber);
      },
      error: (err) => {
        console.error('Erreur chargement du cahier:', err);
        this.chargeSheetOrderNumber = null;
      }
    });
  }
  // ✅ AJOUTER CETTE MÉTHODE POUR CHARGER LES DÉTAILS DE L'ITEM
  loadItemDetails(): void {
    if (!this.selectedItemId || !this.chargeSheetId) return;

    // Récupérer l'item spécifique depuis le cahier
    this.chargeSheetService.getById(this.chargeSheetId).subscribe({
      next: (chargeSheet) => {
        const item = chargeSheet.items?.find((i: any) => i.id === this.selectedItemId);
        if (item) {
          this.selectedItemDetails = {
            id: item.id,
            itemNumber: item.itemNumber,
            housingReferenceLeoni: item.housingReferenceLeoni,
            housingReferenceSupplierCustomer: item.housingReferenceSupplierCustomer, // ✅ RÉFÉRENCE FOURNISSEUR
            quantityOfTestModules: item.quantityOfTestModules,
            status: item.itemStatus
          };
          console.log('Détails item chargé:', this.selectedItemDetails);
        }
      },
      error: (err) => {
        console.error('Erreur chargement détails item:', err);
      }
    });
  }

  loadReceptions(): void {
    if (!this.chargeSheetId) return;

    this.loading = true;
    this.chargeSheetService.getReceptionHistory(this.chargeSheetId).subscribe({
      next: (data) => {
        this.receptions = data;

        if (this.selectedItemId) {
          this.receptions = this.receptions.filter(r => r.item.id === this.selectedItemId);
           // ✅ Si on a des réceptions, enrichir avec les détails de l'item
          if (this.receptions.length > 0 && !this.selectedItemDetails) {
            this.selectedItemDetails = {
              id: this.selectedItemId,
              itemNumber: this.receptions[0].item.itemNumber,
              housingReferenceLeoni: this.receptions[0].item.housingReferenceLeoni,
              housingReferenceSupplierCustomer: this.receptions[0].item.housingReferenceSupplierCustomer,
              quantityOfTestModules: this.receptions[0].item.quantityOfTestModules
            };
          }
        }

        this.filteredReceptions = this.receptions;
        this.buildSummary();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement réceptions:', err);
        this.error = 'Impossible de charger l\'historique des réceptions';
        this.loading = false;
      }
    });
  }

  buildSummary(): void {
    const summaryMap = new Map<number, ReceptionSummary>();

    this.receptions.forEach(rec => {
      const receptionId = rec.id;
      if (!summaryMap.has(receptionId)) {
        summaryMap.set(receptionId, {
          receptionId: rec.id,
          receptionDate: rec.receptionDate,
          deliveryNoteNumber: rec.deliveryNoteNumber,
          items: [],
          totalItems: 0,
          totalQuantity: 0,
          receivedBy: rec.receivedBy
        });
      }

      const summary = summaryMap.get(receptionId)!;
      summary.items.push({
        itemId: rec.item.id,
        itemNumber: rec.item.itemNumber,
        quantityReceived: rec.quantityReceived
      });
      summary.totalItems = summary.items.length;
      summary.totalQuantity += rec.quantityReceived;
    });

    this.receptionSummary = Array.from(summaryMap.values());
  }

  applyFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value.toLowerCase();
    this.applyFilters();
  }

  applyDateFilter(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredReceptions = this.receptions.filter(rec => {
      if (this.searchTerm) {
        const searchStr = this.searchTerm.toLowerCase();
        const matchBL = rec.deliveryNoteNumber?.toLowerCase().includes(searchStr) || false;
        const matchItem = rec.item.itemNumber.toLowerCase().includes(searchStr);
        const matchReceivedBy = rec.receivedBy.toLowerCase().includes(searchStr);

        if (!matchBL && !matchItem && !matchReceivedBy) {
          return false;
        }
      }

      if (this.dateFilter && rec.receptionDate) {
        const recDate = new Date(rec.receptionDate).toISOString().split('T')[0];
        if (recDate !== this.dateFilter) {
          return false;
        }
      }

      return true;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.dateFilter = '';
    this.applyFilters();
  }
 // ✅ GETTER POUR LA RÉFÉRENCE FOURNISSEUR
  getSupplierReference(): string {
    if (this.selectedItemDetails?.housingReferenceSupplierCustomer) {
      return this.selectedItemDetails.housingReferenceSupplierCustomer;
    }
    return 'Non spécifiée';
  }
  clearItemFilter(): void {
    this.selectedItemId = null;
     this.selectedItemDetails = null;
    this.loadReceptions();
    this.router.navigate(['/charge-sheets', this.chargeSheetId, 'receptions']);
  }
}
