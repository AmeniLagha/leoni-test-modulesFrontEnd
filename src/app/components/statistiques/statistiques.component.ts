import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectStats } from '../../../models/stats.model';
import { ChargeSheetService } from '../../../services/charge-sheet.service';
import { SiteService } from '../../../services/Site';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistiques.component.html',
  styleUrls: ['./statistiques.component.css']
})
export class StatistiquesComponent implements OnInit, AfterViewInit {
  @ViewChild('siteChart') siteChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('evolutionChart') evolutionChartCanvas!: ElementRef<HTMLCanvasElement>;

  stats: ProjectStats | null = null;
  loading = true;
  error: string | null = null;

  // Statistiques par site
  siteStats: SiteStat[] = [];
  totalSheetsAllSites: number = 0;
  totalCompletedAllSites: number = 0;
  totalPendingAllSites: number = 0;

  // Graphiques
  private siteChart: Chart | null = null;
  private statusChart: Chart | null = null;
  private evolutionChart: Chart | null = null;

  // Données pour l'évolution mensuelle
  monthlyEvolution: MonthlyEvolution[] = [];

  constructor(
    private chargeSheetService: ChargeSheetService,
    private siteService: SiteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadAllSitesStats();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.createCharts();
    }, 500);
  }

  loadStats(): void {
    this.loading = true;
    this.chargeSheetService.getDashboardStats().subscribe({
      next: (data) => {
        this.loading = false;
        this.stats = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement stats:', err);
        this.error = 'Impossible de charger les statistiques';
        this.loading = false;
      }
    });
  }

  loadAllSitesStats(): void {
  this.siteService.getAll().subscribe({
    next: (sites) => {
      const sitePromises = sites.map(site =>
        this.chargeSheetService.getAll().toPromise().then(allSheets => {
          const sheets = allSheets || [];
          const siteSheets = sheets.filter(s => s.plant === site.name);

          // ✅ Statuts considérés comme COMPLÉTÉS
          const completedStatuses = ['COMPLETED', 'RECEIVED_FROM_SUPPLIER'];

          const completed = siteSheets.filter(s => completedStatuses.includes(s.status)).length;
          const pending = siteSheets.length - completed;

          // Pour les cahiers "en attente" ou "en cours"
          const inProgressStatuses = ['DRAFT', 'VALIDATED_ING', 'TECH_FILLED', 'VALIDATED_PT', 'SENT_TO_SUPPLIER'];
          const inProgress = siteSheets.filter(s => inProgressStatuses.includes(s.status)).length;

          const monthlyData = this.groupSheetsByMonth(siteSheets);

          return {
            siteId: site.id,
            siteName: site.name,
            totalSheets: siteSheets.length,
            completedSheets: completed,
            pendingSheets: pending,
            inProgressSheets: inProgress,
            completionRate: siteSheets.length > 0 ? (completed / siteSheets.length) * 100 : 0,
            monthlyData: monthlyData
          };
        }).catch(() => ({
          siteId: site.id,
          siteName: site.name,
          totalSheets: 0,
          completedSheets: 0,
          pendingSheets: 0,
          inProgressSheets: 0,
          completionRate: 0,
          monthlyData: []
        }))
      );

      Promise.all(sitePromises).then(results => {
        this.siteStats = results.sort((a, b) => b.totalSheets - a.totalSheets);

        this.totalSheetsAllSites = this.siteStats.reduce((sum, s) => sum + s.totalSheets, 0);
        this.totalCompletedAllSites = this.siteStats.reduce((sum, s) => sum + s.completedSheets, 0);
        this.totalPendingAllSites = this.totalSheetsAllSites - this.totalCompletedAllSites;
        this.calculateStatusDistribution();
        this.calculateGlobalMonthlyEvolution();
        this.cdr.detectChanges();
        this.createCharts();
      });
    },
    error: (err) => {
      console.error('Erreur chargement sites:', err);
    }
  });
}
// Ajoutez cette méthode dans votre composant
getCompletionRate(sheets: any[]): number {
  if (!sheets || sheets.length === 0) return 0;

  const completedStatuses = ['COMPLETED', 'RECEIVED_FROM_SUPPLIER'];
  const completedCount = sheets.filter(s => completedStatuses.includes(s.status)).length;

  return (completedCount / sheets.length) * 100;
}

// Pour le taux global
getGlobalCompletionRate(): number {
  if (this.totalSheetsAllSites === 0) return 0;
  return (this.totalCompletedAllSites / this.totalSheetsAllSites) * 100;
}

// Pour le taux par statut
getStatusDistribution(sheets: any[]): { status: string; count: number; percentage: number }[] {
  const statusCount = new Map<string, number>();

  sheets.forEach(sheet => {
    const status = sheet.status;
    statusCount.set(status, (statusCount.get(status) || 0) + 1);
  });

  return Array.from(statusCount.entries()).map(([status, count]) => ({
    status: this.getStatusLabel(status),
    count: count,
    percentage: (count / sheets.length) * 100
  }));
}

getStatusLabel(status: string): string {
  const labels: { [key: string]: string } = {
    'DRAFT': 'Brouillon',
    'VALIDATED_ING': 'Validé ING',
    'TECH_FILLED': 'Remplissage technique',
    'VALIDATED_PT': 'Validé PT',
    'SENT_TO_SUPPLIER': 'Envoyé fournisseur',
    'RECEIVED_FROM_SUPPLIER': 'Reçu fournisseur',
    'COMPLETED': 'Complété'
  };
  return labels[status] || status;
}

  groupSheetsByMonth(sheets: any[]): { month: string; count: number; monthKey: string }[] {
    const monthlyMap = new Map<string, number>();

    sheets.forEach(sheet => {
      const dateStr = sheet.date || sheet.createdAt;
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
        }
      }
    });

    return Array.from(monthlyMap.entries())
      .map(([monthKey, count]) => ({
        month: this.formatMonthDisplay(monthKey),
        count,
        monthKey
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }

  calculateGlobalMonthlyEvolution(): void {
    const allSheetsPromises = this.siteStats.map(site =>
      this.chargeSheetService.getAll().toPromise().then(allSheets => {
        // ✅ Vérifier que allSheets n'est pas undefined
        const sheets = allSheets || [];
        return sheets.filter(s => s.plant === site.siteName);
      }).catch(() => [])
    );

    Promise.all(allSheetsPromises).then(allSiteSheets => {
      const allSheets = allSiteSheets.flat();
      const monthlyMap = new Map<string, number>();

      allSheets.forEach(sheet => {
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
        .map(([monthKey, count]) => ({
          month: this.formatMonthDisplay(monthKey),
          monthKey: monthKey,
          count: count
        }))
        .sort((a, b) => a.monthKey.localeCompare(b.monthKey));

      this.createCharts();
    });
  }

  createCharts(): void {
    setTimeout(() => {
      this.createSiteChart();
      this.createStatusChart();
      this.createStatusBarChart();
      this.createEvolutionChart();
    }, 100);
  }

  createSiteChart(): void {
    if (!this.siteChartCanvas?.nativeElement || this.siteStats.length === 0) return;
    if (this.siteChart) this.siteChart.destroy();

    const labels = this.siteStats.map(s => s.siteName);
    const totalData = this.siteStats.map(s => s.totalSheets);
    const completedData = this.siteStats.map(s => s.completedSheets);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total cahiers',
            data: totalData,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: '#36A2EB',
            borderWidth: 2,
            borderRadius: 8
          },
          {
            label: 'Cahiers complétés',
            data: completedData,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: '#4BC0C0',
            borderWidth: 2,
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: '#E0E0E0', font: { size: 12 } } },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.raw as number;
                const siteStat = this.siteStats[context.dataIndex];
                if (context.datasetIndex === 1 && siteStat) {
                  const rate = siteStat.completionRate.toFixed(1);
                  return `${label}: ${value} (${rate}%)`;
                }
                return `${label}: ${value}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Nombre de cahiers', color: '#E0E0E0' },
            grid: { color: '#1A2335' },
            ticks: { color: '#E0E0E0', stepSize: 1 }
          },
          x: {
            title: { display: true, text: 'Sites', color: '#E0E0E0' },
            grid: { color: '#1A2335' },
            ticks: { color: '#E0E0E0', font: { size: 11 } }
          }
        }
      }
    };
    this.siteChart = new Chart(this.siteChartCanvas.nativeElement, config);
  }

  // Ajoutez ces propriétés dans votre composant
statusDistribution: { status: string; count: number; color: string; label: string }[] = [];

// Ajoutez cette méthode pour calculer la distribution par statut
calculateStatusDistribution(): void {
  const statusMap = new Map<string, number>();

  // Récupérer tous les cahiers de tous les sites
  this.chargeSheetService.getAll().subscribe({
    next: (allSheets) => {
      const sheets = allSheets || [];

      // Compter par statut
      sheets.forEach(sheet => {
        const status = sheet.status;
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      });

      // Définir les couleurs pour chaque statut
      const statusColors: { [key: string]: string } = {
        'DRAFT': '#6c757d',           // Gris
        'VALIDATED_ING': '#0d6efd',   // Bleu
        'TECH_FILLED': '#0dcaf0',     // Cyan
        'VALIDATED_PT': '#fd7e14',    // Orange
        'SENT_TO_SUPPLIER': '#ffc107', // Jaune
        'RECEIVED_FROM_SUPPLIER': '#198754', // Vert
        'COMPLETED': '#20c997'        // Vert clair
      };

      const statusLabels: { [key: string]: string } = {
        'DRAFT': 'Brouillon',
        'VALIDATED_ING': 'Validé ING',
        'TECH_FILLED': 'Remplissage technique',
        'VALIDATED_PT': 'Validé PT',
        'SENT_TO_SUPPLIER': 'Envoyé fournisseur',
        'RECEIVED_FROM_SUPPLIER': 'Reçu fournisseur',
        'COMPLETED': 'Complété'
      };

      this.statusDistribution = Array.from(statusMap.entries())
        .map(([status, count]) => ({
          status: status,
          count: count,
          color: statusColors[status] || '#6c757d',
          label: statusLabels[status] || status
        }))
        .sort((a, b) => b.count - a.count);

      // Recréer le graphique
      this.createStatusChart();
    },
    error: (err) => {
      console.error('Erreur calcul distribution statuts:', err);
    }
  });
}

// Modifiez la méthode createStatusChart
createStatusChart(): void {
  if (!this.statusChartCanvas?.nativeElement) return;
  if (this.statusChart) this.statusChart.destroy();

  // Si nous avons la distribution détaillée
  if (this.statusDistribution && this.statusDistribution.length > 0) {
    const labels = this.statusDistribution.map(s => `${s.label} (${s.count})`);
    const data = this.statusDistribution.map(s => s.count);
    const backgroundColors = this.statusDistribution.map(s => s.color);

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#E0E0E0',
              font: { size: 11 },
              boxWidth: 12
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw as number;
                const total = this.totalSheetsAllSites;
                const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
    this.statusChart = new Chart(this.statusChartCanvas.nativeElement, config);
  } else {
    // Fallback: utiliser les données globales
    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['Complétés', 'En cours / En attente'],
        datasets: [{
          data: [this.totalCompletedAllSites, this.totalPendingAllSites],
          backgroundColor: ['#20c997', '#6c757d'],
          borderColor: ['#fff', '#fff'],
          borderWidth: 2,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#E0E0E0', font: { size: 12 } } },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw as number;
                const total = this.totalSheetsAllSites;
                const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
    this.statusChart = new Chart(this.statusChartCanvas.nativeElement, config);
  }
}
// Ajoutez ce ViewChild
@ViewChild('statusBarChart') statusBarChartCanvas!: ElementRef<HTMLCanvasElement>;
private statusBarChart: Chart | null = null;

// Ajoutez cette méthode pour créer le graphique à barres
createStatusBarChart(): void {
  if (!this.statusBarChartCanvas?.nativeElement || !this.statusDistribution.length) return;
  if (this.statusBarChart) this.statusBarChart.destroy();

  const labels = this.statusDistribution.map(s => s.label);
  const data = this.statusDistribution.map(s => s.count);
  const backgroundColors = this.statusDistribution.map(s => s.color);

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Nombre de cahiers',
        data: data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(c => c),
        borderWidth: 1,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw as number;
              const total = this.totalSheetsAllSites;
              const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
              return `Nombre: ${value} (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Nombre de cahiers', color: '#666' },
          grid: { color: '#e0e0e0' },
          ticks: { stepSize: 1 }
        },
        x: {
          title: { display: true, text: 'Statuts', color: '#666' },
          grid: { display: false },
          ticks: {autoSkip: true }
        }
      }
    }
  };
  this.statusBarChart = new Chart(this.statusBarChartCanvas.nativeElement, config);
}



  createEvolutionChart(): void {
    if (!this.evolutionChartCanvas?.nativeElement || this.monthlyEvolution.length === 0) return;
    if (this.evolutionChart) this.evolutionChart.destroy();

    const labels = this.monthlyEvolution.map(e => e.month);
    const data = this.monthlyEvolution.map(e => e.count);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cahiers créés par mois',
          data: data,
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          borderColor: '#FFCE56',
          borderWidth: 3,
          fill: true,
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: '#FFCE56',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: '#E0E0E0', font: { size: 12 } } },
          tooltip: { callbacks: { label: (context) => `Cahiers créés: ${context.raw}` } }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Nombre de cahiers', color: '#E0E0E0' },
            grid: { color: '#1A2335' },
            ticks: { color: '#E0E0E0', stepSize: 1 }
          },
          x: {
            title: { display: true, text: 'Mois', color: '#E0E0E0' },
            grid: { color: '#1A2335' },
            ticks: { color: '#E0E0E0'}
          }
        }
      }
    };
    this.evolutionChart = new Chart(this.evolutionChartCanvas.nativeElement, config);
  }

  formatMonthDisplay(monthKey: string): string {
    if (!monthKey) return 'Mois inconnu';
    const [year, month] = monthKey.split('-');
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-FR').format(num);
  }
  // Ajoutez cette méthode dans votre composant
refreshStats(): void {
  this.loadStats();
  this.loadAllSitesStats();
}
}

// Interfaces
interface SiteStat {
  siteId: number;
  siteName: string;
  totalSheets: number;
  completedSheets: number;
  pendingSheets: number;
  inProgressSheets: number;  // Ajouté
  completionRate: number;
  monthlyData: { month: string; count: number; monthKey: string }[];
}

interface MonthlyEvolution {
  month: string;
  monthKey: string;
  count: number;
}
