// stock-statistics.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { StockModule } from '../../../../models/stock-module.model';
import { Site } from '../../../../models/site.model';
import { StockService } from '../../../../services/stock.service';
import { SiteService } from '../../../../services/Site';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-stock-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './stock-statistics.component.html',
  styleUrls: ['./stock-statistics.component.css']
})
export class StockStatisticsComponent implements OnInit {

  // Données principales
  stockModules: StockModule[] = [];
  sites: Site[] = [];
  loading = false;
  error: string | null = null;

  // Filtres
  selectedSiteId: number | null = null;
  selectedSiteName: string = 'Tous les sites';
  startDate: string = '';
  endDate: string = '';

  // Indicateurs globaux
  totalModules = 0;
  totalQuantity = 0;
  availableModules = 0;
  usedModules = 0;
  scrappedModules = 0;
  availableQuantity = 0;
  usedQuantity = 0;
  scrappedQuantity = 0;

  // Statistiques par fournisseur
  supplierStats: { name: string; count: number; quantity: number }[] = [];

  // Statistiques par état
  etatStats: { etat: string; count: number; quantity: number }[] = [];

  // Statistiques par caisse
  caisseStats: { caisse: string; count: number; quantity: number }[] = [];

  // Évolution mensuelle
  monthlyEvolution: { month: string; count: number; quantity: number }[] = [];

  // Top modules les plus utilisés
  topModules: { leoniNumr: string; stuffNumr: string; usageCount: number }[] = [];

  // Statistiques par site
  siteStats: { siteName: string; count: number; quantity: number }[] = [];

  // Export
  exporting = false;

  constructor(
    private stockService: StockService,
    private siteService: SiteService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadSites();
    this.initDates();
  }

  initDates() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    this.startDate = firstDayOfMonth.toISOString().split('T')[0];
    this.endDate = now.toISOString().split('T')[0];
  }

  loadSites() {
    this.loading = true;
    this.siteService.getAll().subscribe({
      next: (sites) => {
        this.sites = sites.filter(site => site.active === true);
        this.loadAllStock();
      },
      error: (err) => {
        console.error('Erreur chargement sites', err);
        this.error = 'Erreur lors du chargement des sites';
        this.loadAllStock();
      }
    });
  }

  loadAllStock() {
    this.loading = true;
    this.stockService.getAllStock().subscribe({
      next: data => {
        this.stockModules = data;
        this.applyFiltersAndCalculate();
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.error = 'Erreur lors du chargement du stock';
        this.loading = false;
      }
    });
  }

  loadStockBySite(siteId: number) {
    this.loading = true;
    const site = this.sites.find(s => s.id === siteId);
    if (site) {
      this.stockService.getStockBySiteName(site.name).subscribe({
        next: data => {
          this.stockModules = data;
          this.applyFiltersAndCalculate();
          this.loading = false;
        },
        error: err => {
          console.error(err);
          this.error = `Erreur lors du chargement du stock pour ${site.name}`;
          this.loading = false;
        }
      });
    } else {
      this.loadAllStock();
    }
  }

  onSiteChange() {
    if (this.selectedSiteId === null) {
      this.selectedSiteName = 'Tous les sites';
      this.loadAllStock();
    } else {
      const site = this.sites.find(s => s.id === this.selectedSiteId);
      if (site) {
        this.selectedSiteName = site.name;
        this.loadStockBySite(this.selectedSiteId);
      }
    }
  }

  applyFiltersAndCalculate() {
    let filteredModules = [...this.stockModules];

    // Filtre par date (si les dates sont définies)
    if (this.startDate && this.endDate) {
      filteredModules = filteredModules.filter(module => {
        const moduleDate = module.movedAt ? new Date(module.movedAt) : null;
        if (!moduleDate) return false;
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        end.setHours(23, 59, 59);
        return moduleDate >= start && moduleDate <= end;
      });
    }

    this.calculateStatistics(filteredModules);
    this.calculateSupplierStats(filteredModules);
    this.calculateEtatStats(filteredModules);
    this.calculateCaisseStats(filteredModules);
    this.calculateMonthlyEvolution(filteredModules);
    this.calculateTopModules();
    this.calculateSiteStats();
  }

  calculateStatistics(modules: StockModule[]) {
    this.totalModules = modules.length;
    this.totalQuantity = modules.reduce((sum, m) => sum + (m.quantite || 0), 0);

    this.availableModules = modules.filter(m => m.status === 'AVAILABLE').length;
    this.usedModules = modules.filter(m => m.status === 'USED').length;
    this.scrappedModules = modules.filter(m => m.status === 'SCRAPPED').length;

    this.availableQuantity = modules
      .filter(m => m.status === 'AVAILABLE')
      .reduce((sum, m) => sum + (m.quantite || 0), 0);

    this.usedQuantity = modules
      .filter(m => m.status === 'USED')
      .reduce((sum, m) => sum + (m.quantite || 0), 0);

    this.scrappedQuantity = modules
      .filter(m => m.status === 'SCRAPPED')
      .reduce((sum, m) => sum + (m.quantite || 0), 0);
  }

  calculateSupplierStats(modules: StockModule[]) {
    const supplierMap = new Map<string, { count: number; quantity: number }>();

    modules.forEach(module => {
      const supplier = module.fournisseur || 'Non spécifié';
      const current = supplierMap.get(supplier) || { count: 0, quantity: 0 };
      current.count++;
      current.quantity += module.quantite || 0;
      supplierMap.set(supplier, current);
    });

    this.supplierStats = Array.from(supplierMap.entries())
      .map(([name, stats]) => ({ name, count: stats.count, quantity: stats.quantity }))
      .sort((a, b) => b.quantity - a.quantity);
  }

  calculateEtatStats(modules: StockModule[]) {
    const etatMap = new Map<string, { count: number; quantity: number }>();

    modules.forEach(module => {
      const etat = module.etat || 'Non spécifié';
      const current = etatMap.get(etat) || { count: 0, quantity: 0 };
      current.count++;
      current.quantity += module.quantite || 0;
      etatMap.set(etat, current);
    });

    this.etatStats = Array.from(etatMap.entries())
      .map(([etat, stats]) => ({ etat, count: stats.count, quantity: stats.quantity }))
      .sort((a, b) => b.quantity - a.quantity);
  }

  calculateCaisseStats(modules: StockModule[]) {
    const caisseMap = new Map<string, { count: number; quantity: number }>();

    modules.forEach(module => {
      const caisse = module.caisse || 'Non spécifié';
      const current = caisseMap.get(caisse) || { count: 0, quantity: 0 };
      current.count++;
      current.quantity += module.quantite || 0;
      caisseMap.set(caisse, current);
    });

    this.caisseStats = Array.from(caisseMap.entries())
      .map(([caisse, stats]) => ({ caisse, count: stats.count, quantity: stats.quantity }))
      .sort((a, b) => b.quantity - a.quantity);
  }

  calculateMonthlyEvolution(modules: StockModule[]) {
    const monthMap = new Map<string, { count: number; quantity: number }>();

    modules.forEach(module => {
      if (module.movedAt) {
        const date = new Date(module.movedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const current = monthMap.get(monthKey) || { count: 0, quantity: 0 };
        current.count++;
        current.quantity += module.quantite || 0;
        monthMap.set(monthKey, current);
      }
    });

    this.monthlyEvolution = Array.from(monthMap.entries())
      .map(([month, stats]) => ({ month, count: stats.count, quantity: stats.quantity }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  calculateTopModules() {
    // Compter les utilisations basées sur les mouvements
    const usageMap = new Map<string, number>();

    this.stockModules.forEach(module => {
      if (module.newQuantite && module.newQuantite > 0) {
        const key = module.leoniNumr || module.stuffNumr || '';
        const current = usageMap.get(key) || 0;
        usageMap.set(key, current + (module.newQuantite || 0));
      }
    });

    this.topModules = Array.from(usageMap.entries())
      .map(([ref, usageCount]) => {
        const module = this.stockModules.find(m =>
          (m.leoniNumr === ref || m.stuffNumr === ref)
        );
        return {
          leoniNumr: module?.leoniNumr || '-',
          stuffNumr: module?.stuffNumr || '-',
          usageCount
        };
      })
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);
  }

 calculateSiteStats() {
  const siteMap = new Map<string, { count: number; quantity: number }>();

  this.stockModules.forEach(module => {
    // Utiliser une propriété existante ou créer un nom par défaut
    const siteName = module.siteId ? `Site ${module.siteId}` : 'Non affecté';

    const current = siteMap.get(siteName) || { count: 0, quantity: 0 };
    current.count++;
    current.quantity += module.quantite || 0;
    siteMap.set(siteName, current);
  });

  this.siteStats = Array.from(siteMap.entries())
    .map(([siteName, stats]) => ({ siteName, count: stats.count, quantity: stats.quantity }))
    .sort((a, b) => b.quantity - a.quantity);
}

  resetFilters() {
    this.selectedSiteId = null;
    this.selectedSiteName = 'Tous les sites';
    this.initDates();
    this.loadAllStock();
  }

  getPercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

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
      'AVAILABLE': 'bg-success',
      'USED': 'bg-warning',
      'SCRAPPED': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
  }

  // Export Excel
  async exportToExcel() {
    this.exporting = true;

    try {
      const workbook = new ExcelJS.Workbook();

      // Feuille 1: Indicateurs globaux
      const summarySheet = workbook.addWorksheet('Indicateurs');
      this.addSummarySheet(summarySheet);

      // Feuille 2: Par fournisseur
      const supplierSheet = workbook.addWorksheet('Par Fournisseur');
      this.addSupplierSheet(supplierSheet);

      // Feuille 3: Par état
      const etatSheet = workbook.addWorksheet('Par État');
      this.addEtatSheet(etatSheet);

      // Feuille 4: Par caisse
      const caisseSheet = workbook.addWorksheet('Par Caisse');
      this.addCaisseSheet(caisseSheet);

      // Feuille 5: Évolution mensuelle
      const evolutionSheet = workbook.addWorksheet('Évolution Mensuelle');
      this.addEvolutionSheet(evolutionSheet);

      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `statistiques_stock_${this.getFileNameDate()}.xlsx`;
      saveAs(new Blob([buffer]), fileName);

      alert('Export des statistiques réussi !');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      this.error = 'Erreur lors de l\'export';
    } finally {
      this.exporting = false;
    }
  }

  private addSummarySheet(worksheet: ExcelJS.Worksheet) {
    worksheet.addRow(['STATISTIQUES STOCK']);
    worksheet.addRow([`Date: ${new Date().toLocaleString('fr-FR')}`]);
    worksheet.addRow([`Site: ${this.selectedSiteName}`]);
    worksheet.addRow([]);

    worksheet.addRow(['INDICATEUR', 'VALEUR', 'POURCENTAGE']);
    worksheet.addRow(['Total modules', this.totalModules, '100%']);
    worksheet.addRow(['Total quantité', this.totalQuantity, '-']);
    worksheet.addRow([]);
    worksheet.addRow(['Par statut:', '', '']);
    worksheet.addRow(['  - Disponible', `${this.availableModules} (${this.availableQuantity} qte)`, `${this.getPercentage(this.availableModules, this.totalModules)}%`]);
    worksheet.addRow(['  - Utilisé', `${this.usedModules} (${this.usedQuantity} qte)`, `${this.getPercentage(this.usedModules, this.totalModules)}%`]);
    worksheet.addRow(['  - Mis au rebut', `${this.scrappedModules} (${this.scrappedQuantity} qte)`, `${this.getPercentage(this.scrappedModules, this.totalModules)}%`]);

    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.getRow(4).font = { bold: true };
    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 25;
    worksheet.getColumn(3).width = 15;
  }

  private addSupplierSheet(worksheet: ExcelJS.Worksheet) {
    worksheet.addRow(['STATISTIQUES PAR FOURNISSEUR']);
    worksheet.addRow([]);
    worksheet.addRow(['Fournisseur', 'Nombre de modules', 'Quantité totale']);

    this.supplierStats.forEach(stat => {
      worksheet.addRow([stat.name, stat.count, stat.quantity]);
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 20;
    worksheet.getColumn(3).width = 20;
  }

  private addEtatSheet(worksheet: ExcelJS.Worksheet) {
    worksheet.addRow(['STATISTIQUES PAR ÉTAT']);
    worksheet.addRow([]);
    worksheet.addRow(['État', 'Nombre de modules', 'Quantité totale']);

    this.etatStats.forEach(stat => {
      worksheet.addRow([stat.etat, stat.count, stat.quantity]);
    });
  }

  private addCaisseSheet(worksheet: ExcelJS.Worksheet) {
    worksheet.addRow(['STATISTIQUES PAR CAISSE']);
    worksheet.addRow([]);
    worksheet.addRow(['Caisse', 'Nombre de modules', 'Quantité totale']);

    this.caisseStats.forEach(stat => {
      worksheet.addRow([stat.caisse, stat.count, stat.quantity]);
    });
  }

  private addEvolutionSheet(worksheet: ExcelJS.Worksheet) {
    worksheet.addRow(['ÉVOLUTION MENSUELLE']);
    worksheet.addRow([]);
    worksheet.addRow(['Mois', 'Nombre de mouvements', 'Quantité']);

    this.monthlyEvolution.forEach(stat => {
      worksheet.addRow([stat.month, stat.count, stat.quantity]);
    });
  }

  private getFileNameDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;
  }
}
