// stock-list.component.ts
import { Component, OnInit } from '@angular/core';
import { StockModule } from '../../../models/stock-module.model';
import { StockService } from '../../../services/stock.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Site } from '../../../models/site.model';
import { SiteService } from '../../../services/Site';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './stock-list.component.html',
  styleUrls: ['./stock-list.component.css']
})
export class StockListComponent implements OnInit {

  stockModules: StockModule[] = [];
  filteredStockModules: StockModule[] = [];
  paginatedStockModules: StockModule[] = [];
  loading = false;
  error: string | null = null;

  // Sites et onglets
  sites: Site[] = [];
  selectedSiteId: number | null = null;
  selectedSiteName: string = 'Tous les modules';

  // Recherche et tri
  searchTerm: string = '';
  sortField: keyof StockModule | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  Math = Math;

  // Modal détails
  showDetailsModal = false;
  selectedModule: StockModule | null = null;

  // Modal prélèvement
  showTakeModal = false;
  takeModuleData = {
    moduleId: null as number | null,
    moduleRef: '',
    quantiteInitiale: 0,
    quantiteAPrendre: 1,
    newQuantite: 0,
    demandeur: '',
    dateDemande: new Date().toISOString().split('T')[0],
    explication: '',
    movedBy: ''
  };

  // Modal retour stock
  showReturnModal = false;
  returnModuleData = {
    moduleId: null as number | null,
    moduleRef: '',
    quantiteActuelle: 0,
    quantiteARetourner: 1,
    nouvelleQuantite: 0,
    demandeur: '',
    dateRetour: new Date().toISOString().split('T')[0],
    explication: '',
    returnedBy: ''
  };

  constructor(
    private stockService: StockService,
    private siteService: SiteService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadSites();
  }

  loadCurrentUser() {
    const fullName = this.authService.getUserFullName();
    const email = this.authService.getUserEmail();
    const userName = fullName || email?.split('@')[0] || 'Utilisateur';

    this.takeModuleData.demandeur = userName;
    this.takeModuleData.movedBy = userName;
    this.returnModuleData.demandeur = userName;
    this.returnModuleData.returnedBy = userName;
  }

  loadSites() {
    this.loading = true;
    this.siteService.getAll().subscribe({
      next: (sites) => {
        this.sites = sites.filter(site => site.active === true);
        // Charger tous les modules par défaut
        this.loadAllStock();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement sites', err);
        this.error = 'Erreur lors du chargement des sites';
        this.loadAllStock(); // Fallback: charger tous les modules
        this.loading = false;
      }
    });
  }
// Ajoutez cette méthode dans StockListComponent
// stock-list.component.ts - CORRIGER cette méthode
getSiteModuleCount(siteId: number): number {
  // Retourne le nombre de modules pour ce site
  // ✅ CORRECTION: Filtrer par siteId du module, pas par l'id du module
  return this.stockModules.filter(module => module.siteId === siteId).length;
}
  loadAllStock() {
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

  // stock-list.component.ts - Corriger loadStockBySite
loadStockBySite(siteId: number) {
  this.loading = true;
  // ✅ Trouver le nom du site à partir de l'ID
  const site = this.sites.find(s => s.id === siteId);
  if (site) {
    this.stockService.getStockBySiteName(site.name).subscribe({
      next: data => {
        this.stockModules = data;
        this.applyFilter();
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.error = `Erreur lors du chargement du stock pour le site ${site.name}`;
        this.loading = false;
      }
    });
  } else {
    this.loadAllStock();
  }
}

  // Changement d'onglet (site)
  selectSite(siteId: number | null, siteName: string) {
    this.selectedSiteId = siteId;
    this.selectedSiteName = siteName;
    this.currentPage = 1;
    this.searchTerm = '';

    if (siteId === null) {
      this.loadAllStock();
    } else {
      this.loadStockBySite(siteId);
    }
  }

  // ========== UTILITAIRE DE RECHERCHE ==========
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

    this.filteredStockModules = this.stockModules.filter(module => {
      return (
        this.valueToString(module.id).includes(term) ||
        this.valueToString(module.leoniNumr).includes(term) ||
        this.valueToString(module.stuffNumr).includes(term) ||
        this.valueToString(module.indexValue).includes(term) ||
        this.valueToString(module.fournisseur).includes(term) ||
        this.valueToString(module.etat).includes(term) ||
        this.valueToString(module.caisse).includes(term) ||
        this.valueToString(module.casier).includes(term) ||
        this.valueToString(module.finalDetection).includes(term) ||
        this.valueToString(module.status).includes(term) ||
        this.valueToString(module.itemNumber).includes(term)
      );
    });

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

  // ========== FORMULAIRE DE PRÉLÈVEMENT ==========
  openTakeModal(module: StockModule) {
    if (module.quantite === 0) {
      this.error = 'Ce module n\'a plus de stock disponible !';
      setTimeout(() => this.error = null, 3000);
      return;
    }

    const userName = this.authService.getUserFullName() ||
                     this.authService.getUserEmail()?.split('@')[0] ||
                     'Utilisateur';

    this.takeModuleData = {
      moduleId: module.id!,
      moduleRef: module.leoniNumr || module.stuffNumr || `#${module.id}`,
      quantiteInitiale: module.quantite || 0,
      quantiteAPrendre: 1,
      newQuantite: (module.quantite || 0) - 1,
      demandeur: userName,
      dateDemande: new Date().toISOString().split('T')[0],
      explication: '',
      movedBy: userName
    };
    this.showTakeModal = true;
  }

  onQuantiteChange() {
    const quantite = this.takeModuleData.quantiteAPrendre;
    const initiale = this.takeModuleData.quantiteInitiale;

    if (quantite > initiale) {
      this.takeModuleData.quantiteAPrendre = initiale;
      this.takeModuleData.newQuantite = 0;
    } else if (quantite < 1) {
      this.takeModuleData.quantiteAPrendre = 1;
      this.takeModuleData.newQuantite = initiale - 1;
    } else {
      this.takeModuleData.newQuantite = initiale - quantite;
    }
  }

  validateTakeForm(): boolean {
    if (!this.takeModuleData.demandeur || this.takeModuleData.demandeur.trim() === '') {
      this.error = 'Veuillez saisir le nom du demandeur';
      setTimeout(() => this.error = null, 3000);
      return false;
    }
    if (this.takeModuleData.quantiteAPrendre < 1) {
      this.error = 'La quantité à prendre doit être au moins 1';
      setTimeout(() => this.error = null, 3000);
      return false;
    }
    if (this.takeModuleData.quantiteAPrendre > this.takeModuleData.quantiteInitiale) {
      this.error = 'Quantité insuffisante en stock';
      setTimeout(() => this.error = null, 3000);
      return false;
    }
    return true;
  }

  submitTakeModule() {
    if (!this.validateTakeForm()) return;

    this.loading = true;

    const updateData = {
      quantite: this.takeModuleData.newQuantite,
      newQuantite: this.takeModuleData.quantiteAPrendre,
      demandeurExplication: `${this.takeModuleData.demandeur} - ${this.takeModuleData.explication || 'Prélèvement'}`,
      movedBy: this.takeModuleData.movedBy,
      movedAt: new Date().toISOString(),
      dateDemande: this.takeModuleData.dateDemande,
      status: this.takeModuleData.newQuantite === 0 ? 'USED' : 'AVAILABLE'
    };

    this.stockService.updateStockModule(this.takeModuleData.moduleId!, updateData).subscribe({
      next: (updatedModule) => {
        const index = this.stockModules.findIndex(m => m.id === updatedModule.id);
        if (index !== -1) {
          this.stockModules[index] = updatedModule;
        }
        this.applyFilter();

        alert(`✅ Prélèvement effectué : ${this.takeModuleData.quantiteAPrendre} module(s) prélevé(s) par ${this.takeModuleData.demandeur}`);

        this.closeTakeModal();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Erreur lors du prélèvement du module';
        this.loading = false;
        setTimeout(() => this.error = null, 3000);
      }
    });
  }

  closeTakeModal() {
    this.showTakeModal = false;
    const userName = this.authService.getUserFullName() ||
                     this.authService.getUserEmail()?.split('@')[0] ||
                     'Utilisateur';

    this.takeModuleData = {
      moduleId: null,
      moduleRef: '',
      quantiteInitiale: 0,
      quantiteAPrendre: 1,
      newQuantite: 0,
      demandeur: userName,
      dateDemande: new Date().toISOString().split('T')[0],
      explication: '',
      movedBy: userName
    };
  }

  // ========== FORMULAIRE DE RETOUR STOCK ==========
  openReturnModal(module: StockModule) {
    const quantitePrelevee = module.newQuantite || 0;

    if (quantitePrelevee === 0 && module.status !== 'USED') {
      this.error = 'Ce module n\'a pas de quantité prélevée à retourner !';
      setTimeout(() => this.error = null, 3000);
      return;
    }

    const userName = this.authService.getUserFullName() ||
                     this.authService.getUserEmail()?.split('@')[0] ||
                     'Utilisateur';

    this.returnModuleData = {
      moduleId: module.id!,
      moduleRef: module.leoniNumr || module.stuffNumr || `#${module.id}`,
      quantiteActuelle: module.quantite || 0,
      quantiteARetourner: quantitePrelevee > 0 ? quantitePrelevee : 1,
      nouvelleQuantite: (module.quantite || 0) + (quantitePrelevee > 0 ? quantitePrelevee : 1),
      demandeur: userName,
      dateRetour: new Date().toISOString().split('T')[0],
      explication: '',
      returnedBy: userName
    };
    this.showReturnModal = true;
  }

  onReturnQuantiteChange() {
    const quantiteRetour = this.returnModuleData.quantiteARetourner;
    const quantitePrelevee = this.getQuantitePrelevee(this.returnModuleData.moduleId!);

    if (quantiteRetour > quantitePrelevee) {
      this.returnModuleData.quantiteARetourner = quantitePrelevee;
      this.returnModuleData.nouvelleQuantite = this.returnModuleData.quantiteActuelle + quantitePrelevee;
    } else if (quantiteRetour < 1) {
      this.returnModuleData.quantiteARetourner = 1;
      this.returnModuleData.nouvelleQuantite = this.returnModuleData.quantiteActuelle + 1;
    } else {
      this.returnModuleData.nouvelleQuantite = this.returnModuleData.quantiteActuelle + quantiteRetour;
    }
  }

  getQuantitePrelevee(moduleId: number): number {
    const module = this.stockModules.find(m => m.id === moduleId);
    return module?.newQuantite || 0;
  }

  validateReturnForm(): boolean {
    if (!this.returnModuleData.demandeur || this.returnModuleData.demandeur.trim() === '') {
      this.error = 'Veuillez saisir le nom de la personne qui retourne';
      setTimeout(() => this.error = null, 3000);
      return false;
    }
    if (this.returnModuleData.quantiteARetourner < 1) {
      this.error = 'La quantité à retourner doit être au moins 1';
      setTimeout(() => this.error = null, 3000);
      return false;
    }
    const quantitePrelevee = this.getQuantitePrelevee(this.returnModuleData.moduleId!);
    if (this.returnModuleData.quantiteARetourner > quantitePrelevee) {
      this.error = 'Vous ne pouvez pas retourner plus que ce qui a été prélevé';
      setTimeout(() => this.error = null, 3000);
      return false;
    }
    return true;
  }

  submitReturnModule() {
    if (!this.validateReturnForm()) return;

    this.loading = true;

    const module = this.stockModules.find(m => m.id === this.returnModuleData.moduleId!);
    const nouvelleQuantitePrelevee = (module?.newQuantite || 0) - this.returnModuleData.quantiteARetourner;

    const updateData = {
      quantite: this.returnModuleData.nouvelleQuantite,
      newQuantite: nouvelleQuantitePrelevee >= 0 ? nouvelleQuantitePrelevee : 0,
      demandeurExplication: `RETOUR STOCK - ${this.returnModuleData.demandeur} - ${this.returnModuleData.explication || 'Retour de module'}`,
      movedBy: this.returnModuleData.returnedBy,
      movedAt: new Date().toISOString(),
      dateDemande: this.returnModuleData.dateRetour,
      status: 'AVAILABLE'
    };

    this.stockService.updateStockModule(this.returnModuleData.moduleId!, updateData).subscribe({
      next: (updatedModule) => {
        const index = this.stockModules.findIndex(m => m.id === updatedModule.id);
        if (index !== -1) {
          this.stockModules[index] = updatedModule;
        }
        this.applyFilter();

        alert(`✅ Retour effectué : ${this.returnModuleData.quantiteARetourner} module(s) retourné(s) par ${this.returnModuleData.demandeur}`);

        this.closeReturnModal();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Erreur lors du retour du module';
        this.loading = false;
        setTimeout(() => this.error = null, 3000);
      }
    });
  }

  closeReturnModal() {
    this.showReturnModal = false;
    const userName = this.authService.getUserFullName() ||
                     this.authService.getUserEmail()?.split('@')[0] ||
                     'Utilisateur';

    this.returnModuleData = {
      moduleId: null,
      moduleRef: '',
      quantiteActuelle: 0,
      quantiteARetourner: 1,
      nouvelleQuantite: 0,
      demandeur: userName,
      dateRetour: new Date().toISOString().split('T')[0],
      explication: '',
      returnedBy: userName
    };
  }

  // ========== CHANGEMENT DE STATUT ==========
  setStatus(id: number, status: 'AVAILABLE' | 'USED' | 'SCRAPPED') {
    if (status === 'AVAILABLE') {
      const module = this.stockModules.find(m => m.id === id);
      if (module && module.newQuantite && module.newQuantite > 0) {
        this.openReturnModal(module);
        return;
      }
    }

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

  // ========== MODAL DÉTAILS ==========
  viewDetails(id: number) {
    this.selectedModule = this.stockModules.find(m => m.id === id) || null;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedModule = null;
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
    if (detection === 'Activé' || detection === 'OK') return 'bg-success bg-opacity-10 text-success';
    if (detection === 'Désactivé') return 'bg-secondary bg-opacity-10 text-secondary';
    return 'badge bg-light text-dark';
  }
}
