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
      }
    });

    this.route.queryParams.subscribe(params => {
      const itemId = params['itemId'];
      if (itemId) {
        this.selectedItemId = +itemId;
      }
      this.loadReceptions();
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

  clearItemFilter(): void {
    this.selectedItemId = null;
    this.loadReceptions();
    this.router.navigate(['/charge-sheets', this.chargeSheetId, 'receptions']);
  }
}
