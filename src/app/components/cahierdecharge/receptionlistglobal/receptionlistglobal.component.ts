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
  template: `
    <div class="reception-container">
      <!-- HEADER -->
      <div class="page-header">
        <h1>
          <i class="bi bi-truck"></i>
          Gestion des réceptions
          <span class="badge" *ngIf="!loading && receptions.length > 0">
            {{ receptions.length }} réception(s)
          </span>
        </h1>
       <div class="header-actions d-flex gap-2">
  <!-- Bouton Actualiser avec effet de rotation -->
  <button class="btn btn-primary"
          (click)="loadAllReceptions()"
          [disabled]="loading"
          style="transition: all 0.3s ease;">
    <i class="bi bi-arrow-repeat me-1"
       [class.spinning]="loading"
       style="transition: transform 0.3s ease;"></i>
    <span>{{ loading ? 'Chargement...' : 'Actualiser' }}</span>
  </button>

  <!-- Bouton Statistiques avec icône -->
  <button class="btn btn-success"
          (click)="gotostat()"
          style="transition: all 0.3s ease;">
    <i class="bi bi-graph-up me-1"></i>
    Statistiques
  </button>

  <!-- Bouton Retour -->
  <a routerLink="/dashboard"
     class="btn btn-outline-danger"
     style="transition: all 0.3s ease;">
    <i class="bi bi-house-door me-1"></i>
    Retour au tableau de bord
  </a>
</div>
      </div>

      <!-- FILTRES RAPIDES -->
      <div class="filters-section" *ngIf="!loading && receptions.length > 0">
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input type="text"
                 class="search-input"
                 placeholder="Rechercher par N° BL, item, cahier..."
                 [(ngModel)]="searchTerm"
                 (ngModelChange)="applyFilters()">
        </div>

        <div class="filter-group">
          <select class="filter-select" [(ngModel)]="selectedProject" (ngModelChange)="applyFilters()">
            <option value="">Tous les projets</option>
            <option *ngFor="let project of projects" [value]="project">{{ project }}</option>
          </select>

          <input type="date"
                 class="filter-date"
                 [(ngModel)]="dateFilter"
                 (ngModelChange)="applyFilters()"
                 placeholder="Filtrer par date">

          <select class="filter-select" [(ngModel)]="selectedSupplier" (ngModelChange)="applyFilters()">
            <option value="">Tous les fournisseurs</option>
            <option *ngFor="let supplier of suppliers" [value]="supplier">{{ supplier }}</option>
          </select>
        </div>

        <button *ngIf="searchTerm || selectedProject || dateFilter || selectedSupplier"
                class="btn-clear" (click)="resetFilters()">
          <i class="bi bi-x-circle"></i> Effacer les filtres
        </button>
      </div>

      <!-- LOADING -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Chargement des réceptions...</p>
      </div>

      <!-- ERROR -->
      <div *ngIf="error" class="error-container">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <span>{{ error }}</span>
        <button class="btn-retry" (click)="loadAllReceptions()">Réessayer</button>
      </div>

      <!-- STATISTIQUES -->
      <div *ngIf="!loading && !error && receptions.length > 0" class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon total">
            <i class="bi bi-box-seam"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalQuantity }}</span>
            <span class="stat-label">Unités reçues</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon unique">
            <i class="bi bi-truck"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ uniqueReceptions }}</span>
            <span class="stat-label">Réceptions</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon sheets">
            <i class="bi bi-file-earmark-text"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ uniqueChargeSheets }}</span>
            <span class="stat-label">Cahiers concernés</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon items">
            <i class="bi bi-grid-3x3-gap-fill"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ uniqueItems }}</span>
            <span class="stat-label">Items différents</span>
          </div>
        </div>
      </div>

      <!-- TABLEAU DES RÉCEPTIONS -->
      <div *ngIf="!loading && !error && filteredReceptions.length > 0" class="table-container">
        <table class="reception-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Cahier #</th>
              <th>Item</th>
              <th>Quantité</th>
              <th>N° BL</th>
              <th>Projet</th>
              <th>Reçu par</th>
              <th>Commentaires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let reception of paginatedReceptions">
              <td>
                <span class="date-badge">
                  <i class="bi bi-calendar"></i>
                  {{ reception.receptionDate | date:'dd/MM/yyyy' }}
                </span>
              </td>
              <td>
                <a [routerLink]="['/charge-sheets', reception.chargeSheetId]" class="sheet-link">
                  #{{ reception.chargeSheetOrderNumber }}
                </a>
              </td>
              <td>
                <span class="item-badge">Item {{ reception.item.housingReferenceSupplierCustomer }}</span>
              </td>
              <td>
                <span class="quantity-badge">{{ reception.quantityReceived }}</span>
              </td>
              <td>
                <span class="bl-badge">{{ reception.deliveryNoteNumber || '-' }}</span>
              </td>
              <td>
                <span class="project-tag">{{ getProjectForSheet(reception.chargeSheetId) || '-' }}</span>
              </td>
              <td>
                <span class="user-badge" [title]="reception.receivedBy">
                  {{ reception.receivedBy | slice:0:10 }}...
                </span>
              </td>
              <td>
                <span class="comments" [title]="reception.comments">
                  {{ reception.comments || '-' | slice:0:20 }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-icon btn-view"
                        [routerLink]="['/charge-sheets', reception.chargeSheetId, 'receptions']"
                        title="Voir détails">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="btn-icon btn-files"
                        [routerLink]="['/compliance/reception', reception.chargeSheetId, reception.id]"
                        title="Voir fiches de conformité">
                  <i class="bi bi-file-earmark-check"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- PAGINATION -->
        <div class="pagination" *ngIf="totalPages > 1">
          <button class="page-btn" [disabled]="currentPage === 1" (click)="changePage(currentPage - 1)">
            <i class="bi bi-chevron-left"></i>
          </button>

          <span class="page-info">
            Page {{ currentPage }} sur {{ totalPages }}
          </span>

          <button class="page-btn" [disabled]="currentPage === totalPages" (click)="changePage(currentPage + 1)">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- AUCUN RÉSULTAT -->
      <div *ngIf="!loading && !error && filteredReceptions.length === 0" class="empty-state">
        <i class="bi bi-inbox"></i>
        <h3>Aucune réception trouvée</h3>
        <p *ngIf="searchTerm || selectedProject || dateFilter || selectedSupplier">
          Aucune réception ne correspond à vos filtres.
        </p>
        <p *ngIf="!searchTerm && !selectedProject && !dateFilter && !selectedSupplier">
          Aucune réception n'a encore été enregistrée dans le système.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .reception-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px 30px;
      border-radius: 15px;
      margin-bottom: 25px;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-header h1 {
      margin: 0;
      font-size: 1.8rem;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .badge {
      background: rgba(255,255,255,0.2);
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.9rem;
    }

    .btn-refresh {
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      transition: all 0.2s;
    }
/* styles.css ou component.css */

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinning {
  animation: spin 1s linear infinite;
  display: inline-block;
}

/* Effet de hover sur les boutons */
.btn {
  transition: all 0.2s ease-in-out;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

/* Version avec icônes uniquement sur mobile */
@media (max-width: 576px) {
  .btn span {
    display: none;
  }

  .btn i {
    margin: 0;
    font-size: 1.2rem;
  }

  .btn {
    padding: 0.375rem 0.75rem;
  }
}
    .btn-refresh:hover:not(:disabled) {
      background: rgba(255,255,255,0.3);
      transform: translateY(-2px);
    }

    .btn-refresh:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .filters-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 25px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      align-items: center;
    }

    .search-box {
      flex: 1;
      min-width: 250px;
      position: relative;
    }

    .search-box i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #6c757d;
    }

    .search-input {
      width: 100%;
      padding: 10px 10px 10px 35px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
    }

    .search-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .filter-group {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .filter-select, .filter-date {
      padding: 10px 15px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
      min-width: 150px;
    }

    .btn-clear {
      padding: 10px 20px;
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      color: #666;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }

    .btn-clear:hover {
      background: #e9ecef;
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      display: flex;
      align-items: center;
      gap: 15px;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 15px rgba(0,0,0,0.1);
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .stat-icon.total {
      background: #e3f2fd;
      color: #1976d2;
    }

    .stat-icon.unique {
      background: #e8f5e9;
      color: #388e3c;
    }

    .stat-icon.sheets {
      background: #fff3e0;
      color: #f57c00;
    }

    .stat-icon.items {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 600;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #6c757d;
    }

    .table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      overflow: auto;
    }

    .reception-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 1000px;
    }

    .reception-table th {
      background: #f8f9fa;
      padding: 15px;
      text-align: left;
      font-size: 0.9rem;
      font-weight: 600;
      color: #495057;
      border-bottom: 2px solid #dee2e6;
    }

    .reception-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #e9ecef;
    }

    .reception-table tbody tr:hover {
      background: #f8f9fa;
    }

    .date-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #e7f3ff;
      color: #0066cc;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.85rem;
    }

    .sheet-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }

    .sheet-link:hover {
      text-decoration: underline;
    }

    .item-badge {
      background: #f0f0f0;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.85rem;
    }

    .quantity-badge {
      display: inline-block;
      background: #28a745;
      color: white;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      min-width: 40px;
      text-align: center;
    }

    .bl-badge {
      background: #e9ecef;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85rem;
      font-family: monospace;
    }

    .project-tag {
      background: #6f42c1;
      color: white;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .user-badge {
      background: #17a2b8;
      color: white;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.8rem;
      cursor: help;
    }

    .comments {
      color: #6c757d;
      font-style: italic;
      cursor: help;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-view {
      background: #e7f3ff;
      color: #0066cc;
    }

    .btn-view:hover {
      background: #d4e4ff;
      transform: translateY(-2px);
    }

    .btn-files {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .btn-files:hover {
      background: #c8e6c9;
      transform: translateY(-2px);
    }

    .pagination {
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      border-top: 1px solid #e9ecef;
    }

    .page-btn {
      width: 36px;
      height: 36px;
      border: 1px solid #dee2e6;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      font-size: 0.95rem;
      color: #6c757d;
    }

    .loading-container, .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    .empty-state i {
      font-size: 4rem;
      color: #dee2e6;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      color: #495057;
      margin-bottom: 10px;
    }

    .empty-state p {
      color: #6c757d;
    }

    .error-container {
      background: #f8d7da;
      color: #721c24;
      padding: 15px 20px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .btn-retry {
      margin-left: auto;
      padding: 5px 15px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-retry:hover {
      background: #c82333;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }

      .stats-cards {
        grid-template-columns: 1fr;
      }

      .filter-group {
        flex-direction: column;
        width: 100%;
      }

      .filter-select, .filter-date {
        width: 100%;
      }
    }
  `]
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

  loadAllReceptions(): void {
    this.loading = true;
    this.error = null;

    // Récupérer tous les cahiers pour avoir les projets
    this.chargeSheetService.getAll().subscribe({
      next: (sheets) => {
        // Créer un cache des projets
        sheets.forEach(sheet => {
          this.sheetProjects.set(sheet.id, sheet.project);
          if (!this.projects.includes(sheet.project)) {
            this.projects.push(sheet.project);
          }
        });

        // Pour chaque cahier, récupérer ses réceptions
        const receptionPromises = sheets.map(sheet =>
          this.chargeSheetService.getReceptionHistory(sheet.id).toPromise()
            .then(histories => {
              if (histories && histories.length > 0) {
                return histories.map(h => ({
                  ...h,
                  chargeSheetId: sheet.id
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
