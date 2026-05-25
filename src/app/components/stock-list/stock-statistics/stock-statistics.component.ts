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

  stockModules: StockModule[] = [];
  sites: Site[] = [];
  loading = false;
  error: string | null = null;

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

  supplierStats: { name: string; count: number; quantity: number }[] = [];
  etatStats: { etat: string; count: number; quantity: number }[] = [];
  caisseStats: { caisse: string; count: number; quantity: number }[] = [];
  monthlyEvolution: { month: string; count: number; quantity: number }[] = [];
  topModules: { leoniNumr: string; stuffNumr: string; usageCount: number }[] = [];
  siteStats: { siteName: string; count: number; quantity: number }[] = [];

  exporting = false;

  // Variable pour stocker les modules après filtrage (IMPORTANT)
  filteredModulesForStats: StockModule[] = [];

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

 // stock-statistics.component.ts

loadAllStock() {
  this.loading = true;
  this.stockService.getAllStock().subscribe({
    next: data => {
      console.log('Données chargées (total):', data.length);
      // Vérifiez si vous recevez bien 898 modules
      if (data.length === 0) {
        console.warn('Aucune donnée reçue de l\'API');
      }
      this.stockModules = data;
      this.applyFiltersAndCalculate();
      this.loading = false;
    },
    error: err => {
      console.error('Erreur détaillée:', err);
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
          console.log(`Données pour ${site.name}:`, data.length);
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

  private getModuleDate(module: StockModule): Date | null {
    if (module.movedAt) {
      return new Date(module.movedAt);
    }
    if (module.dernierMaj) {
      return new Date(module.dernierMaj);
    }
    if (module.dateDemande) {
      return new Date(module.dateDemande);
    }
    return null;
  }

  applyFiltersAndCalculate() {
    // Commencer avec les modules chargés (déjà filtrés par site)
    let filteredModules = [...this.stockModules];

    console.log('Modules avant filtre date:', filteredModules.length);

    // Filtre par date
    if (this.startDate && this.endDate && this.startDate !== this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59);

      filteredModules = filteredModules.filter(module => {
        const moduleDate = this.getModuleDate(module);
        if (!moduleDate) return true;
        return moduleDate >= start && moduleDate <= end;
      });
      console.log('Modules après filtre date:', filteredModules.length);
    }

    // STOCKER LES MODULES FILTRÉS POUR LES STATS
    this.filteredModulesForStats = filteredModules;

    // Calculer toutes les statistiques à partir des modules filtrés
    this.calculateStatistics(this.filteredModulesForStats);
    this.calculateSupplierStats(this.filteredModulesForStats);
    this.calculateEtatStats(this.filteredModulesForStats);
    this.calculateCaisseStats(this.filteredModulesForStats);
    this.calculateMonthlyEvolution(this.filteredModulesForStats);
    this.calculateTopModules();
    this.calculateSiteStats(); // PAS besoin de passer les modules, il utilise filteredModulesForStats
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

    console.log('Statistiques calculées:', {
      totalModules: this.totalModules,
      totalQuantity: this.totalQuantity,
      availableModules: this.availableModules,
      usedModules: this.usedModules,
      scrappedModules: this.scrappedModules
    });
  }

  calculateSupplierStats(modules: StockModule[]) {
    const supplierMap = new Map<string, { count: number; quantity: number }>();

    modules.forEach(module => {
      const supplier = module.fournisseur && module.fournisseur.trim() !== '' ? module.fournisseur : 'Non spécifié';
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
      const etat = module.etat && module.etat.trim() !== '' ? module.etat : 'Non spécifié';
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
      const caisse = module.caisse && module.caisse.trim() !== '' ? module.caisse : 'Non spécifié';
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
      const dateStr = module.movedAt || module.dernierMaj || module.dateDemande;
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const current = monthMap.get(monthKey) || { count: 0, quantity: 0 };
          current.count++;
          current.quantity += module.quantite || 0;
          monthMap.set(monthKey, current);
        }
      }
    });

    this.monthlyEvolution = Array.from(monthMap.entries())
      .map(([month, stats]) => ({ month, count: stats.count, quantity: stats.quantity }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  calculateTopModules() {
    const usageMap = new Map<string, number>();

    // Utiliser filteredModulesForStats au lieu de stockModules
    this.filteredModulesForStats.forEach(module => {
      if (module.newQuantite && module.newQuantite > 0) {
        const key = module.leoniNumr || module.stuffNumr || '';
        if (key) {
          const current = usageMap.get(key) || 0;
          usageMap.set(key, current + (module.newQuantite || 0));
        }
      }
    });

    this.topModules = Array.from(usageMap.entries())
      .map(([ref, usageCount]) => {
        const module = this.filteredModulesForStats.find(m =>
          (m.leoniNumr === ref || m.stuffNumr === ref)
        );
        return {
          leoniNumr: module?.leoniNumr || ref.split(' - ')[0] || '-',
          stuffNumr: module?.stuffNumr || ref.split(' - ')[1] || '-',
          usageCount
        };
      })
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);
  }

  // CORRECTION IMPORTANTE: calculateSiteStats utilise filteredModulesForStats
  calculateSiteStats() {
    // Utiliser les modules déjà filtrés
    const modules = this.filteredModulesForStats;

    const siteMap = new Map<number, { siteName: string; count: number; quantity: number }>();

    modules.forEach(module => {
      const siteId = module.siteId || 0;
      let siteName = 'Non affecté';

      if (siteId !== 0) {
        const site = this.sites.find(s => s.id === siteId);
        siteName = site ? site.name : `Site ${siteId}`;
      }

      if (!siteMap.has(siteId)) {
        siteMap.set(siteId, { siteName, count: 0, quantity: 0 });
      }

      const current = siteMap.get(siteId)!;
      current.count++;
      current.quantity += module.quantite || 0;
    });

    this.siteStats = Array.from(siteMap.values())
      .sort((a, b) => b.quantity - a.quantity);

    console.log('Statistiques par site (filtrées):', this.siteStats);
    console.log('Total des quantités par site:', this.siteStats.reduce((sum, s) => sum + s.quantity, 0));
    console.log('Total quantity global:', this.totalQuantity);

    // Vérification de cohérence
    const totalFromSites = this.siteStats.reduce((sum, s) => sum + s.quantity, 0);
    if (Math.abs(totalFromSites - this.totalQuantity) > 1) {
      console.warn('⚠️ Incohérence: somme des sites =', totalFromSites, '≠ total quantity =', this.totalQuantity);
    }
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

  async exportToExcel() {
    this.exporting = true;

    try {
      const workbook = new ExcelJS.Workbook();

      const summarySheet = workbook.addWorksheet('Indicateurs');
      this.addSummarySheet(summarySheet);

      const supplierSheet = workbook.addWorksheet('Par Fournisseur');
      this.addSupplierSheet(supplierSheet);

      const etatSheet = workbook.addWorksheet('Par État');
      this.addEtatSheet(etatSheet);

      const caisseSheet = workbook.addWorksheet('Par Caisse');
      this.addCaisseSheet(caisseSheet);

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
