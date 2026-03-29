import { Component, OnInit } from '@angular/core';
import { StockModule } from '../../../models/stock-module.model';
import { StockService } from '../../../services/stock.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-list.component.html',
  styleUrls: ['./stock-list.component.css']
})
export class StockListComponent implements OnInit {

  stockModules: StockModule[] = [];
  filteredStockModules: StockModule[] = [];
  paginatedStockModules: StockModule[] = [];
  loading = false;
  error: string | null = null;

  // Recherche et tri
  searchTerm: string = '';
  sortField: keyof StockModule | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  Math = Math;

  constructor(private stockService: StockService) {}

  ngOnInit(): void {
    this.loadStock();
  }

  loadStock() {
    this.loading = true;
    this.stockService.getAllStock().subscribe({
      next: data => {
        this.stockModules = data;
        this.applyFilter();
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.error = 'Erreur lors du chargement du stock';
        this.loading = false;
      }
    });
  }

  // ========== UTILITAIRE DE RECHERCHE ==========
  /**
   * Convertit une valeur en string pour la recherche
   */
  private valueToString(value: any): string {
    if (value === null || value === undefined) return '';
    return value.toString().toLowerCase();
  }

  // ========== FILTRES ==========
  onSearchChange() {
    this.currentPage = 1;
    this.applyFilter();
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase();

    // Filtrage
    this.filteredStockModules = this.stockModules.filter(module => {
      const matchId = this.valueToString(module.id).includes(term);
      const matchDetection = this.valueToString(module.finalDetection).includes(term);
      const matchStatus = this.valueToString(module.status).includes(term);
      const matchDisplacement = this.valueToString(module.finalDisplacement).includes(term);
      const matchProgrammedSealing = this.valueToString(module.finalProgrammedSealing).includes(term);

      return matchId || matchDetection || matchStatus || matchDisplacement || matchProgrammedSealing;
    });

    // Tri
    if (this.sortField) {
      const key = this.sortField as keyof StockModule;
      this.filteredStockModules.sort((a, b) => {
        let aVal = a[key];
        let bVal = b[key];

        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return this.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = aVal.toString().toLowerCase();
        const bStr = bVal.toString().toLowerCase();

        if (aStr < bStr) return this.sortDirection === 'asc' ? -1 : 1;
        if (aStr > bStr) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Pagination
    this.totalPages = Math.ceil(this.filteredStockModules.length / this.pageSize);
    this.updatePaginated();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.sortField = '';
    this.sortDirection = 'asc';
    this.applyFilter();
  }

  // ========== PAGINATION ==========
  updatePaginated() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedStockModules = this.filteredStockModules.slice(start, end);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginated();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginated();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginated();
    }
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

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredStockModules.length / this.pageSize);
    this.updatePaginated();
  }

  // ========== CHANGEMENT DE STATUT ==========
  setStatus(id: number, status: 'AVAILABLE' | 'USED' | 'SCRAPPED') {
    this.stockService.updateStatus(id, status).subscribe({
      next: (updatedModule) => {
        const index = this.stockModules.findIndex(m => m.id === id);
        if (index !== -1) {
          this.stockModules[index].status = updatedModule.status;
        }
        this.applyFilter();
      },
      error: (err) => console.error(err)
    });
  }

  // ========== LABELS ET BADGES ==========
  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'AVAILABLE': 'Disponible',
      'USED': 'Utilisé',
      'SCRAPPED': 'Mis au rebut'
    };
    return labels[status] || status || 'Inconnu';
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'AVAILABLE': 'bg-success bg-opacity-10 text-success',
      'USED': 'bg-warning bg-opacity-10 text-warning',
      'SCRAPPED': 'bg-danger bg-opacity-10 text-danger'
    };
    return classes[status] || 'bg-secondary bg-opacity-10 text-secondary';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'AVAILABLE': 'bi-check-circle',
      'USED': 'bi-box-arrow-in-right',
      'SCRAPPED': 'bi-trash'
    };
    return icons[status] || 'bi-question-circle';
  }

  getDetectionBadgeClass(detection: string): string {
    if (detection === 'Activé') return 'bg-success bg-opacity-10 text-success';
    if (detection === 'Désactivé') return 'bg-secondary bg-opacity-10 text-secondary';
    return 'badge bg-light text-dark';
  }
}
