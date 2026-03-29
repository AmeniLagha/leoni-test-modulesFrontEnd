import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplianceDisplay, ComplianceDto } from '../../../../../models/compliance.model';
import { ComplianceService } from '../../../../../services/compliance.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

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
        this.complianceList = res;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur récupération conformité :', err);
        this.errorMessage = 'Impossible de récupérer la liste des conformités';
        this.isLoading = false;
      }
    });
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

      return true;
    });

    this.totalPages = Math.ceil(this.filteredCompliances.length / this.pageSize);
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.dateFilter = '';
    this.filteredCompliances = [...this.complianceList];
    this.totalPages = Math.ceil(this.filteredCompliances.length / this.pageSize);
    this.currentPage = 1;
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
}
