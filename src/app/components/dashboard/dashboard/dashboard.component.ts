import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/UserService';
import { ChargeSheetService } from '../../../../services/charge-sheet.service';
import { ComplianceService } from '../../../../services/compliance.service';
import { ClaimService } from '../../../../services/claim.service';
import { SiteService } from '../../../../services/Site';
import { TechnicalFileService } from '../../../../services/technical-file.service';
import { TechnicalFileNotificationService } from '../../../../services/TechnicalNotification';
import { NotificationsComponent } from '../../notifications/notifications.component';

interface Site {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

interface SiteStat {
  siteId: number;
  siteName: string;
  totalSheets: number;
  completedSheets: number;
  pendingSheets: number;
  inProgressSheets: number;
  completionRate: number;
  statusDetails: {
    DRAFT: number;
    VALIDATED_ING: number;
    TECH_FILLED: number;
    VALIDATED_PT: number;
    SENT_TO_SUPPLIER: number;
    RECEIVED_FROM_SUPPLIER: number;
    COMPLETED: number;
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterModule, FormsModule, NotificationsComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  userEmail: string = '';
  userRole: string = '';
  userFirstName: string = '';
  userPermissions: string[] = [];
  today: Date = new Date();

  sites: Site[] = [];
  selectedSite: Site | null = null;
  loadingSites: boolean = false;

  chargeSheetCount: number = 0;
  complianceCount: number = 0;
  claimsCount: number = 0;
  technicalFilesCount: number = 0;
  activeUsers: number = 0;

  siteStats: SiteStat[] = [];
  totalSheetsAllSites: number = 0;
  totalCompletedAllSites: number = 0;
  totalPendingAllSites: number = 0;

  monthlyVariation: any = null;
  complianceVariation: any = null;
  claimVariation: any = null;
  showVariationDetails = false;

  monthlyEvolution: { month: string; count: number }[] = [];
  statusDistribution: { status: string; count: number; color: string; label: string }[] = [];
  statusStatistics: any[] = [];

  isNavbarOpen = false;
  isUserMenuOpen = false;
  isSidebarCollapsed = false;
  openSubmenu: string | null = null;
  notificationCount: number = 0;
  private notificationRefreshInterval: any;

  productionRate: number = 0;
  cycleTime: number = 0;
  qualityRate: number = 0;
  onTimeDelivery: number = 0;
  workloadPerUser: number = 0;
  efficiency: number = 0;
  bottleneckStatus: string = 'Normal';
  urgentTasks: number = 0;
  criticalPath: number = 0;

  weeklyProgress: { day: string; created: number }[] = [];
  sitePerformance: { site: string; efficiency: number; quality: number }[] = [];

  predictedNextMonth: number = 0;
  trendDirection: string = 'stable';
  confidenceLevel: number = 85;
  monthlyTarget: number = 50;
  prevMonthGrowth: number = 0;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private chargeSheetService: ChargeSheetService,
    private complianceService: ComplianceService,
    private claimService: ClaimService,
    private siteService: SiteService,
    private technicalFileService: TechnicalFileService,
    private router: Router,
    private technicalFileNotificationService: TechnicalFileNotificationService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadActiveUsers();
    this.loadStats();

    if (this.userRole === 'ADMIN') {
      this.loadSites();
    }

    this.loadNotificationCount();
    this.notificationRefreshInterval = setInterval(() => {
      this.loadNotificationCount();
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.notificationRefreshInterval) {
      clearInterval(this.notificationRefreshInterval);
    }
  }

  loadUserInfo(): void {
    this.userEmail = this.authService.getUserEmail();
    this.userRole = this.authService.getUserRole();
    this.userPermissions = this.authService.getUserPermissions();

    this.userService.getCurrentUserFromApi().subscribe({
      next: (user) => { this.userFirstName = user.firstname; },
      error: () => { this.userFirstName = this.userEmail.split('@')[0]; }
    });
  }

  loadStats(): void {
    this.chargeSheetService.getAll().subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.chargeSheetCount = data.length;
          this.calculateMonthlyVariation(data);
          this.calculateStatusDistribution(data);
          this.calculateMonthlyEvolution(data);
          this.calculateSiteStats(data);
          this.calculateIndustrialStats(data);
          this.calculateWeeklyProgress(data);
          this.calculateSitePerformance();
          this.calculatePredictions();
          this.updateStatusStatistics();
        });
      },
      error: (err) => console.error('Erreur:', err)
    });

    this.complianceService.getAll2().subscribe({
      next: (data) => { this.complianceCount = data.length; this.calculateComplianceVariation(data); },
      error: (err) => console.error('Erreur:', err)
    });

    this.claimService.getAllClaims().subscribe({
      next: (data) => { this.claimsCount = data.length; this.calculateClaimVariation(data); },
      error: (err) => console.error('Erreur:', err)
    });

    this.technicalFileService.getAllDetailed().subscribe({
      next: (data) => {
        let count = 0;
        if (data?.length) {
          data.forEach((tf: any) => { if (tf.items?.length) count += tf.items.length; });
        }
        this.technicalFilesCount = count;
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  updateStatusStatistics(): void {
    const total = this.chargeSheetCount;
    this.statusStatistics = this.statusDistribution.map(item => ({
      ...item,
      percentage: total > 0 ? (item.count / total) * 100 : 0
    }));
  }

  loadActiveUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => { this.activeUsers = users.length; },
      error: () => { this.activeUsers = 0; }
    });
  }

  loadSites(): void {
    this.loadingSites = true;
    this.siteService.getAll().subscribe({
      next: (sites) => {
        this.sites = sites;
        this.loadingSites = false;
      },
      error: () => {
        this.loadingSites = false;
        this.sites = [];
      }
    });
  }

  async selectSite(site: Site): Promise<void> {
    this.ngZone.run(() => {
      this.selectedSite = site;
      this.loadingSites = true;
    });

    try {
      // Récupérer TOUTES les données en parallèle avec firstValueFrom
      const [allSheets, allCompliances, allTechFiles, allClaims] = await Promise.all([
        firstValueFrom(this.chargeSheetService.getAll()),
        firstValueFrom(this.complianceService.getAll2()),
        firstValueFrom(this.technicalFileService.getAllDetailed()),
        firstValueFrom(this.claimService.getAllClaims())
      ]);

      this.ngZone.run(() => {
        // Filtrer par site (avec vérification que les données existent)
        const siteSheets = (allSheets || []).filter((s: any) => s.plant === site.name);
        const siteCompliances = (allCompliances || []).filter((c: any) => c.plant === site.name);
        const siteClaims = (allClaims || []).filter((c: any) => c.plant === site.name);

        // Compter les dossiers techniques liés au site
        let techFilesCount = 0;
        if (allTechFiles?.length) {
          allTechFiles.forEach((tf: any) => {
            if (tf.site === site.name && tf.items?.length) {
              techFilesCount += tf.items.length;
            }
          });
        }

        // Mettre à jour les compteurs
        this.chargeSheetCount = siteSheets.length;
        this.complianceCount = siteCompliances.length;
        this.claimsCount = siteClaims.length;
        this.technicalFilesCount = techFilesCount;

        // Recalculer les variations avec les données filtrées
        this.calculateMonthlyVariation(siteSheets);
        this.calculateComplianceVariation(siteCompliances);
        this.calculateClaimVariation(siteClaims);

        // Recalculer les autres statistiques
        this.calculateStatusDistribution(siteSheets);
        this.calculateMonthlyEvolution(siteSheets);
        this.calculateSiteStats(allSheets || []);
        this.calculateIndustrialStats(siteSheets);
        this.calculateWeeklyProgress(siteSheets);
        this.calculateSitePerformance();
        this.calculatePredictions();
        this.updateStatusStatistics();

        this.loadingSites = false;
      });
    } catch (err) {
      console.error('Erreur chargement données:', err);
      this.ngZone.run(() => {
        this.loadingSites = false;
      });
    }
  }

  backToSiteSelection(): void {
    this.selectedSite = null;
    this.loadStats();
  }

  // ==================== CALCULS STATISTIQUES ====================

  calculateMonthlyVariation(sheets: any[]): void {
    const monthlyCounts: { [key: string]: number } = {};
    (sheets || []).forEach(sheet => {
      const dateStr = sheet.date || sheet.createdAt;
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
        }
      }
    });

    const sortedMonths = Object.keys(monthlyCounts).sort((a, b) => b.localeCompare(a));
    if (sortedMonths.length >= 2) {
      const currentCount = monthlyCounts[sortedMonths[0]];
      const previousCount = monthlyCounts[sortedMonths[1]];
      let variation = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0;
      variation = Math.round(variation * 10) / 10;
      const trend = variation > 0 ? 'hausse' : variation < 0 ? 'baisse' : 'stable';
      this.monthlyVariation = {
        currentMonth: this.formatMonthDisplay(sortedMonths[0]),
        currentMonthCount: currentCount,
        previousMonth: this.formatMonthDisplay(sortedMonths[1]),
        previousMonthCount: previousCount,
        variation,
        trend,
        formula: `((${currentCount} - ${previousCount}) / ${previousCount}) × 100 = ${variation}%`,
        interpretation: this.getVariationInterpretation(trend, variation, currentCount, previousCount, 'cahier(s)')
      };
    } else {
      this.monthlyVariation = null;
    }
  }

  calculateComplianceVariation(data: any[]): void {
    const monthlyCounts: { [key: string]: number } = {};
    (data || []).forEach(item => {
      const date = new Date(item.createdAt);
      if (!isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
      }
    });
    const sortedMonths = Object.keys(monthlyCounts).sort((a, b) => b.localeCompare(a));
    if (sortedMonths.length >= 2) {
      const currentCount = monthlyCounts[sortedMonths[0]];
      const previousCount = monthlyCounts[sortedMonths[1]];
      let variation = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0;
      variation = Math.round(variation * 10) / 10;
      this.complianceVariation = {
        currentMonth: this.formatMonthDisplay(sortedMonths[0]),
        currentMonthCount: currentCount,
        previousMonth: this.formatMonthDisplay(sortedMonths[1]),
        previousMonthCount: previousCount,
        variation,
        trend: variation > 0 ? 'hausse' : variation < 0 ? 'baisse' : 'stable'
      };
    } else { this.complianceVariation = null; }
  }

  calculateClaimVariation(data: any[]): void {
    const monthlyCounts: { [key: string]: number } = {};
    (data || []).forEach(item => {
      const date = new Date(item.createdAt);
      if (!isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
      }
    });
    const sortedMonths = Object.keys(monthlyCounts).sort((a, b) => b.localeCompare(a));
    if (sortedMonths.length >= 2) {
      const currentCount = monthlyCounts[sortedMonths[0]];
      const previousCount = monthlyCounts[sortedMonths[1]];
      let variation = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0;
      variation = Math.round(variation * 10) / 10;
      this.claimVariation = {
        currentMonth: this.formatMonthDisplay(sortedMonths[0]),
        currentMonthCount: currentCount,
        previousMonth: this.formatMonthDisplay(sortedMonths[1]),
        previousMonthCount: previousCount,
        variation,
        trend: variation > 0 ? 'hausse' : variation < 0 ? 'baisse' : 'stable'
      };
    } else { this.claimVariation = null; }
  }

  calculateStatusDistribution(sheets: any[]): void {
    const statusMap = new Map<string, number>();
    const allStatuses = ['DRAFT', 'VALIDATED_ING', 'TECH_FILLED', 'VALIDATED_PT', 'SENT_TO_SUPPLIER', 'RECEIVED_FROM_SUPPLIER', 'COMPLETED'];
    allStatuses.forEach(s => statusMap.set(s, 0));
    (sheets || []).forEach(sheet => {
      if (statusMap.has(sheet.status)) statusMap.set(sheet.status, (statusMap.get(sheet.status) || 0) + 1);
    });

    const statusColors: any = {
      DRAFT: '#6c757d', VALIDATED_ING: '#0d6efd', TECH_FILLED: '#0dcaf0',
      VALIDATED_PT: '#fd7e14', SENT_TO_SUPPLIER: '#ffc107', RECEIVED_FROM_SUPPLIER: '#198754', COMPLETED: '#20c997'
    };
    const statusLabels: any = {
      DRAFT: 'Brouillon', VALIDATED_ING: 'Validé ING', TECH_FILLED: 'Tech Filled',
      VALIDATED_PT: 'Validé PT', SENT_TO_SUPPLIER: 'Envoyé', RECEIVED_FROM_SUPPLIER: 'Reçu', COMPLETED: 'Complété'
    };

    this.statusDistribution = allStatuses
      .map(status => ({ status, count: statusMap.get(status) || 0, color: statusColors[status], label: statusLabels[status] }))
      .filter(item => item.count > 0);
  }

  calculateMonthlyEvolution(sheets: any[]): void {
    const monthlyMap = new Map<string, number>();
    (sheets || []).forEach(sheet => {
      const dateStr = sheet.date || sheet.createdAt;
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
        }
      }
    });
    this.monthlyEvolution = Array.from(monthlyMap.entries())
      .map(([monthKey, count]) => ({ month: this.formatMonthDisplay(monthKey), count }))
      .sort((a, b) => {
        const [yearA, monthA] = a.month.split(' ');
        const [yearB, monthB] = b.month.split(' ');
        const monthOrder = { Jan:1, Fév:2, Mar:3, Avr:4, Mai:5, Juin:6, Juil:7, Aoû:8, Sep:9, Oct:10, Nov:11, Déc:12 };
        if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
        return (monthOrder[monthA as keyof typeof monthOrder] || 0) - (monthOrder[monthB as keyof typeof monthOrder] || 0);
      });
  }

  calculateSiteStats(allSheets: any[]): void {
    const siteMap = new Map<string, SiteStat>();
    const sheetsToProcess = this.selectedSite
      ? (allSheets || []).filter((s: any) => s.plant === this.selectedSite?.name)
      : (allSheets || []);

    sheetsToProcess.forEach((sheet: any) => {
      const siteName = sheet.plant || 'Non assigné';
      if (!siteMap.has(siteName)) {
        siteMap.set(siteName, {
          siteId: 0, siteName, totalSheets: 0, completedSheets: 0,
          pendingSheets: 0, inProgressSheets: 0, completionRate: 0,
          statusDetails: { DRAFT: 0, VALIDATED_ING: 0, TECH_FILLED: 0, VALIDATED_PT: 0, SENT_TO_SUPPLIER: 0, RECEIVED_FROM_SUPPLIER: 0, COMPLETED: 0 }
        });
      }
      const stat = siteMap.get(siteName)!;
      stat.totalSheets++;
      const key = sheet.status as keyof typeof stat.statusDetails;
      if (key in stat.statusDetails) stat.statusDetails[key]++;
      if (sheet.status === 'COMPLETED') stat.completedSheets++;
      else stat.pendingSheets++;
    });

    this.siteStats = Array.from(siteMap.values())
      .map(stat => ({ ...stat, completionRate: stat.totalSheets > 0 ? (stat.completedSheets / stat.totalSheets) * 100 : 0 }))
      .sort((a, b) => b.totalSheets - a.totalSheets);

    this.totalSheetsAllSites = this.siteStats.reduce((s, x) => s + x.totalSheets, 0);
    this.totalCompletedAllSites = this.siteStats.reduce((s, x) => s + x.completedSheets, 0);
    this.totalPendingAllSites = this.totalSheetsAllSites - this.totalCompletedAllSites;
  }

  calculateIndustrialStats(sheets: any[]): void {
    const sheetsData = sheets || [];
    const completedCount = sheetsData.filter(s => s.status === 'COMPLETED').length;
    this.productionRate = sheetsData.length > 0 ? (completedCount / sheetsData.length) * 100 : 0;
    const now = new Date();
    let totalAgeDays = 0, nonCompletedCount = 0;
    sheetsData.forEach(sheet => {
      if (sheet.status !== 'COMPLETED') {
        const created = new Date(sheet.createdAt);
        totalAgeDays += (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
        nonCompletedCount++;
      }
    });
    this.cycleTime = nonCompletedCount > 0 ? totalAgeDays / nonCompletedCount : 0;
    const qualityStatuses = ['TECH_FILLED', 'VALIDATED_PT', 'SENT_TO_SUPPLIER', 'RECEIVED_FROM_SUPPLIER', 'COMPLETED'];
    const qualityCount = sheetsData.filter(s => qualityStatuses.includes(s.status)).length;
    this.qualityRate = sheetsData.length > 0 ? (qualityCount / sheetsData.length) * 100 : 0;
    this.onTimeDelivery = this.productionRate;
    this.workloadPerUser = this.activeUsers > 0 ? sheetsData.length / this.activeUsers : 0;
    this.efficiency = this.productionRate * 0.4 + this.qualityRate * 0.35 + this.onTimeDelivery * 0.25;
    this.urgentTasks = sheetsData.filter(s => {
      if (!['DRAFT', 'VALIDATED_ING'].includes(s.status)) return false;
      return (now.getTime() - new Date(s.createdAt).getTime()) / (1000 * 3600 * 24) > 14;
    }).length;
    let maxAge = 0;
    sheetsData.forEach(sheet => {
      if (sheet.status !== 'COMPLETED') {
        const age = (now.getTime() - new Date(sheet.createdAt).getTime()) / (1000 * 3600 * 24);
        maxAge = Math.max(maxAge, age);
      }
    });
    this.criticalPath = Math.round(maxAge);
    this.determineBottleneck();
  }

  calculateWeeklyProgress(sheets: any[]): void {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const weeklyData = days.map(day => ({ day, created: 0 }));
    const today = new Date();
    const currentDay = today.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const dayMap: any = { 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Jeu', 5: 'Ven', 6: 'Sam', 0: 'Dim' };
    (sheets || []).forEach(sheet => {
      const createdDate = new Date(sheet.createdAt);
      if (createdDate >= weekStart && createdDate <= weekEnd) {
        const dayName = dayMap[createdDate.getDay()];
        const found = weeklyData.find(d => d.day === dayName);
        if (found) found.created++;
      }
    });
    this.weeklyProgress = weeklyData;
  }

  calculateSitePerformance(): void {
    this.sitePerformance = this.siteStats.map(site => ({
      site: site.siteName,
      efficiency: site.completionRate,
      quality: site.completionRate * 0.9
    }));
  }

  calculatePredictions(): void {
    if (this.monthlyEvolution.length >= 3) {
      const values = this.monthlyEvolution.slice(-3).map(x => x.count);
      const [val1, val2, val3] = values;
      const avgGrowth = ((val2 - val1) + (val3 - val2)) / 2;
      this.predictedNextMonth = Math.max(0, Math.round(val3 + avgGrowth));
      this.trendDirection = avgGrowth > 0 ? 'hausse' : avgGrowth < 0 ? 'baisse' : 'stable';
      this.prevMonthGrowth = val2 > 0 ? ((val3 - val2) / val2) * 100 : 0;
      this.confidenceLevel = 85;
      this.monthlyTarget = Math.max(10, Math.round((val1 + val2 + val3) / 3 * 1.1));
    } else if (this.monthlyEvolution.length === 2) {
      const [val1, val2] = this.monthlyEvolution.map(x => x.count);
      this.predictedNextMonth = Math.max(0, val2 + (val2 - val1));
      this.trendDirection = val2 > val1 ? 'hausse' : val2 < val1 ? 'baisse' : 'stable';
      this.prevMonthGrowth = val1 > 0 ? ((val2 - val1) / val1) * 100 : 0;
      this.confidenceLevel = 65;
      this.monthlyTarget = Math.max(10, Math.round((val1 + val2) / 2 * 1.1));
    } else if (this.monthlyEvolution.length === 1) {
      this.predictedNextMonth = this.monthlyEvolution[0].count;
      this.trendDirection = 'stable';
      this.prevMonthGrowth = 0;
      this.confidenceLevel = 50;
      this.monthlyTarget = Math.max(10, Math.round(this.monthlyEvolution[0].count * 1.1));
    }
  }

  determineBottleneck(): void {
    if (this.productionRate < 20) this.bottleneckStatus = '🚨 Très faible taux de production';
    else if (this.qualityRate < 40) this.bottleneckStatus = '🔧 Problèmes majeurs de qualité';
    else if (this.cycleTime > 30) this.bottleneckStatus = '⏰ Cycle de production très long (+30 jours)';
    else if (this.cycleTime > 21) this.bottleneckStatus = '⏰ Cycle de production long (21-30 jours)';
    else if (this.workloadPerUser > 15) this.bottleneckStatus = '⚠️ Surcharge utilisateurs';
    else if (this.productionRate < 50) this.bottleneckStatus = '📉 Production inférieure à la cible';
    else if (this.qualityRate < 70) this.bottleneckStatus = '🔧 Amélioration qualité nécessaire';
    else if (this.cycleTime > 14) this.bottleneckStatus = '⏰ Cycle de production à optimiser';
    else if (this.urgentTasks > 3) this.bottleneckStatus = `🚨 ${this.urgentTasks} tâches urgentes accumulées`;
    else this.bottleneckStatus = '✅ Production fluide - Bonne performance';
  }

  // ==================== UTILITAIRES ====================

  formatMonthDisplay(monthKey: string): string {
    if (!monthKey) return 'Mois inconnu';
    const [year, month] = monthKey.split('-');
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  getVariationIcon(trend: string): string {
    return trend === 'hausse' ? 'bi bi-arrow-up' : trend === 'baisse' ? 'bi bi-arrow-down' : 'bi bi-dash';
  }

  getVariationSign(variation: number): string { return variation > 0 ? '+' : ''; }

  getVariationInterpretation(trend: string, variation: number, currentCount: number, previousCount: number, unit: string): string {
    if (trend === 'hausse') return `📈 Augmentation de ${variation}% (${currentCount} vs ${previousCount} ${unit})`;
    if (trend === 'baisse') return `📉 Baisse de ${Math.abs(variation)}% (${currentCount} vs ${previousCount} ${unit})`;
    return `➡️ Stable (${currentCount} ${unit} pour les deux mois)`;
  }

  getGlobalCompletionRate(): number {
    return this.totalSheetsAllSites > 0 ? (this.totalCompletedAllSites / this.totalSheetsAllSites) * 100 : 0;
  }

  getTotalByStatus(status: string): number {
    return this.siteStats.reduce((total, site) => total + (site.statusDetails[status as keyof typeof site.statusDetails] || 0), 0);
  }

  getSiteSheetCount(siteName: string): number {
    return this.siteStats.find(s => s.siteName === siteName)?.totalSheets || 0;
  }

  getSiteCompletionRate(siteName: string): number {
    return Math.round(this.siteStats.find(s => s.siteName === siteName)?.completionRate || 0);
  }

  getMaxWeeklyValue(): number {
    if (!this.weeklyProgress.length) return 1;
    return Math.max(...this.weeklyProgress.map(d => d.created), 1);
  }

  getWeeklyBarWidth(value: number): number {
    const max = this.getMaxWeeklyValue();
    return (value / max) * 100;
  }

  hasWeeklyActivity(): boolean {
    return this.weeklyProgress?.some(day => day.created > 0) || false;
  }

  getEfficiencyColor(efficiency: number): string {
    return efficiency >= 80 ? '#28a745' : efficiency >= 60 ? '#ffc107' : '#dc3545';
  }

  getQualityColor(quality: number): string {
    return quality >= 85 ? '#20c997' : quality >= 70 ? '#ffc107' : '#dc3545';
  }

  getPredictedNextMonth(): number {
    return this.predictedNextMonth || (this.monthlyEvolution.length > 0 ? this.monthlyEvolution[this.monthlyEvolution.length - 1]?.count || 0 : 0);
  }

  getTrendDisplay(): string {
    if (this.trendDirection === 'hausse') return `📈 +${Math.abs(this.prevMonthGrowth || 0).toFixed(1)}%`;
    if (this.trendDirection === 'baisse') return `📉 -${Math.abs(this.prevMonthGrowth || 0).toFixed(1)}%`;
    return '➡️ 0%';
  }

  isTargetAchieved(): boolean {
    const lastMonthCount = this.monthlyEvolution.length > 0 ? this.monthlyEvolution[this.monthlyEvolution.length - 1]?.count || 0 : 0;
    return lastMonthCount >= this.monthlyTarget;
  }

  getMaxMonthlyCount(): number {
    if (this.monthlyEvolution.length === 0) return 1;
    return Math.max(...this.monthlyEvolution.map(m => m.count), 1);
  }

  loadNotificationCount(): void {
    this.technicalFileNotificationService.getPendingNotifications().subscribe({
      next: (notifications) => {
        const lastView = localStorage.getItem('lastNotifView');
        if (lastView) {
          const lastViewDate = new Date(lastView);
          this.notificationCount = notifications.filter((n: any) => new Date(n.createdAt) > lastViewDate).length;
        } else {
          this.notificationCount = notifications.length;
        }
      },
      error: () => { this.notificationCount = 0; }
    });
  }

  // Navigation
  goToNotifications(): void { this.router.navigate(['/notifications']); }
  goToProfile(): void { this.router.navigate(['/profile']); this.isUserMenuOpen = false; }
  isAdmin(): boolean { return this.authService.getUserRole() === 'ADMIN'; }
  isMC(): boolean { return this.authService.getUserRole() === 'MC'; }
  isMP(): boolean { return this.authService.getUserRole() === 'MP'; }
  hasPermission(permissions: string[]): boolean { return permissions.some(p => this.userPermissions.includes(p)); }

  getUserRoleLabel(role: string): string {
    const labels: any = { ADMIN: 'Administrateur', ING: 'Ingénieur', PT: 'Technologie Production', PP: 'Préparation Production', MC: 'Maintenance Corrective', MP: 'Maintenance Préventive' };
    return labels[role] || role;
  }

  toggleUserMenuDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  toggleSubMenu(menu: string): void {
    this.openSubmenu = this.openSubmenu === menu ? null : menu;
  }

  @HostListener('document:click', ['$event'])
  closeUserMenuOnOutsideClick(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdown = document.querySelector('.user-menu');
    if (dropdown && !dropdown.contains(target)) this.isUserMenuOpen = false;
  }

  logout(event?: Event): void {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
