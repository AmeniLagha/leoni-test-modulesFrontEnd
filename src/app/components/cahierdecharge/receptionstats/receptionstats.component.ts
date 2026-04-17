import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReceptionHistoryDto, ChargeSheetComplete } from '../../../../models/charge-sheet.model';
import { ChargeSheetService } from '../../../../services/charge-sheet.service';
import { AuthService } from '../../../../services/auth.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-receptionstats',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './receptionstats.component.html',
  styleUrls: ['./receptionstats.component.css']
})
export class ReceptionstatsComponent implements OnInit, AfterViewInit {
  @ViewChild('monthlyChart') monthlyChartCanvas!: ElementRef<HTMLCanvasElement>;

  receptions: (ReceptionHistoryDto & { chargeSheetId: number })[] = [];
  allSheets: ChargeSheetComplete[] = [];
  loading = true;
  error: string | null = null;

  // Sélection du mois
  selectedMonthKey: string = '';
  selectedMonthLabel: string = '';
  selectedMonthStats: MonthlyStat | null = null;
  selectedMonthItems: MonthItemStat[] = [];

  // Liste des mois disponibles
  availableMonthsList: { value: string; label: string }[] = [];

  // Cache
  private sheetProjects: Map<number, string> = new Map();
  private sheetPlants: Map<number, string> = new Map();
  private itemsCache: Map<number, any> = new Map();

  // Graphique
  private monthlyChart: Chart | null = null;

  constructor(
    private chargeSheetService: ChargeSheetService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAllReceptions();
  }

  ngAfterViewInit(): void {}

  loadAllReceptions(): void {
    this.loading = true;
    this.error = null;

    this.chargeSheetService.getAll().subscribe({
      next: (sheets) => {
        this.allSheets = sheets;

        sheets.forEach(sheet => {
          this.sheetProjects.set(sheet.id, sheet.project);
          this.sheetPlants.set(sheet.id, sheet.plant);

          // Cache des items avec leurs références Leoni
          sheet.items.forEach(item => {
            if (!this.itemsCache.has(item.id!)) {
              this.itemsCache.set(item.id!, {
                id: item.id,
                itemNumber: item.itemNumber,
                housingReferenceLeoni: item.housingReferenceLeoni || 'N/A',
                housingReferenceSupplier: item.housingReferenceSupplierCustomer || 'N/A',
                quantityOfTestModules: item.quantityOfTestModules || 0
              });
            }
          });
        });

        const receptionPromises = sheets.map(sheet =>
          this.chargeSheetService.getReceptionHistory(sheet.id).toPromise()
            .then(histories => {
              if (histories && histories.length > 0) {
                return histories.map(h => ({
                  ...h,
                  chargeSheetId: sheet.id,
                  chargeSheetPlant: sheet.plant,
                  chargeSheetProject: sheet.project
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
          this.buildAvailableMonthsList();
          this.loading = false;
        });
      },
      error: (err) => {
        console.error('Erreur chargement:', err);
        this.error = 'Impossible de charger les données';
        this.loading = false;
      }
    });
  }

  buildAvailableMonthsList(): void {
    const monthsMap = new Map<string, { value: string; label: string; year: number; month: number }>();

    this.receptions.forEach(reception => {
      const date = new Date(reception.receptionDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const value = `${year}-${String(month).padStart(2, '0')}`;
      const label = this.getMonthLabel(month - 1, year);

      if (!monthsMap.has(value)) {
        monthsMap.set(value, { value, label, year, month });
      }
    });

    this.availableMonthsList = Array.from(monthsMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }

  onMonthChange(): void {
    if (!this.selectedMonthKey) {
      this.selectedMonthStats = null;
      this.selectedMonthItems = [];
      if (this.monthlyChart) {
        this.monthlyChart.destroy();
        this.monthlyChart = null;
      }
      return;
    }

    const selected = this.availableMonthsList.find(m => m.value === this.selectedMonthKey);
    this.selectedMonthLabel = selected?.label || '';

    const [year, month] = this.selectedMonthKey.split('-');
    const filteredReceptions = this.receptions.filter(r => {
      const date = new Date(r.receptionDate);
      return date.getFullYear() === parseInt(year) && (date.getMonth() + 1) === parseInt(month);
    });

    this.selectedMonthStats = this.calculateMonthStats(filteredReceptions, this.selectedMonthLabel, parseInt(year), parseInt(month));
    this.selectedMonthItems = this.calculateMonthItemsStats(filteredReceptions);

    setTimeout(() => this.createMonthlyChart(), 100);
  }

  calculateMonthStats(receptions: any[], monthLabel: string, year: number, month: number): MonthlyStat {
    const quantityReceived = receptions.reduce((sum, r) => sum + r.quantityReceived, 0);
    const numberOfReceptions = receptions.length;
    const uniqueItems = new Set(receptions.map(r => r.item.id)).size;

    // Calculer la quantité commandée pour ce mois
    const itemIds = new Set(receptions.map(r => r.item.id));
    let quantityOrdered = 0;
    itemIds.forEach(itemId => {
      const item = this.itemsCache.get(itemId);
      if (item) {
        quantityOrdered += item.quantityOfTestModules || 0;
      }
    });

    const completionRate = quantityOrdered > 0 ? Math.round((quantityReceived / quantityOrdered) * 100) : 0;
    const avgPerReception = numberOfReceptions > 0 ? Math.round(quantityReceived / numberOfReceptions) : 0;

    return {
      month: monthLabel,
      monthKey: `${year}-${String(month).padStart(2, '0')}`,
      year,
      monthNumber: month,
      quantityReceived,
      numberOfReceptions,
      numberOfItems: uniqueItems,
      quantityOrdered,
      completionRate,
      avgPerReception,
      quantityPercentage: 0
    };
  }

  calculateMonthItemsStats(receptions: any[]): MonthItemStat[] {
    const itemMap = new Map<number, MonthItemStat>();

    receptions.forEach(reception => {
      const cachedItem = this.itemsCache.get(reception.item.id);

      if (!itemMap.has(reception.item.id)) {
        itemMap.set(reception.item.id, {
          itemId: reception.item.id,
          itemNumber: reception.item.itemNumber,
          housingReferenceLeoni: cachedItem?.housingReferenceLeoni || 'N/A',
          housingReferenceSupplier: cachedItem?.housingReferenceSupplier || 'N/A',
          quantityReceived: 0,
          receptionCount: 0,
          project: this.getProjectForSheet(reception.chargeSheetId) || '',
          plant: this.getPlantForSheet(reception.chargeSheetId) || ''
        });
      }

      const stat = itemMap.get(reception.item.id)!;
      stat.quantityReceived += reception.quantityReceived;
      stat.receptionCount++;
    });

    // Trier par quantité reçue (décroissant) et prendre top 15
    return Array.from(itemMap.values())
      .sort((a, b) => b.quantityReceived - a.quantityReceived)
      .slice(0, 15);
  }

  createMonthlyChart(): void {
    if (!this.monthlyChartCanvas?.nativeElement || !this.selectedMonthItems.length) return;
    if (this.monthlyChart) this.monthlyChart.destroy();

    // Tronquer les longues références pour l'affichage
    const labels = this.selectedMonthItems.map(item =>
      item.housingReferenceLeoni.length > 30 ? item.housingReferenceLeoni.substring(0, 27) + '...' : item.housingReferenceLeoni
    );
    const quantities = this.selectedMonthItems.map(item => item.quantityReceived);
    const backgroundColors = this.generateColors(this.selectedMonthItems.length);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Quantité reçue',
          data: quantities,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(c => c.replace('0.7', '1')),
          borderWidth: 1,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y', // Graphique horizontal pour mieux voir les longues références
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#E0E0E0', font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const item = this.selectedMonthItems[context.dataIndex];
                return [
                  `📦 Quantité reçue: ${context.raw} unités`,
                  `🏭 Réf. fournisseur: ${item.housingReferenceSupplier}`,
                  `📋 Projet: ${item.project}`,
                  `📍 Site: ${item.plant}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: { display: true, text: 'Quantité reçue (unités)', color: '#E0E0E0' },
            grid: { color: '#1A2335' },
            ticks: { color: '#E0E0E0' }
          },
          y: {
            title: { display: true, text: 'Référence Leoni', color: '#E0E0E0' },
            grid: { color: '#1A2335' },
            ticks: {
              color: '#E0E0E0',
              font: { size: 11, family: 'monospace' },
              autoSkip: false
            }
          }
        }
      }
    };

    this.monthlyChart = new Chart(this.monthlyChartCanvas.nativeElement, config);
  }

  generateColors(count: number): string[] {
    const colors = [
      'rgba(54, 162, 235, 0.7)',   // Bleu
      'rgba(255, 99, 132, 0.7)',   // Rose
      'rgba(75, 192, 192, 0.7)',   // Turquoise
      'rgba(255, 206, 86, 0.7)',   // Jaune
      'rgba(153, 102, 255, 0.7)',  // Violet
      'rgba(255, 159, 64, 0.7)',   // Orange
      'rgba(46, 204, 113, 0.7)',   // Vert
      'rgba(52, 152, 219, 0.7)',   // Bleu ciel
      'rgba(155, 89, 182, 0.7)',   // Mauve
      'rgba(241, 196, 15, 0.7)',   // Jaune-or
      'rgba(230, 126, 34, 0.7)',   // Orange foncé
      'rgba(231, 76, 60, 0.7)',    // Rouge
      'rgba(26, 188, 156, 0.7)',   // Vert d'eau
      'rgba(142, 68, 173, 0.7)',   // Violet foncé
      'rgba(22, 160, 133, 0.7)'    // Vert émeraude
    ];

    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  }

  resetMonthSelection(): void {
    this.selectedMonthKey = '';
    this.selectedMonthLabel = '';
    this.selectedMonthStats = null;
    this.selectedMonthItems = [];
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
      this.monthlyChart = null;
    }
  }

  getProjectForSheet(sheetId: number): string | undefined {
    return this.sheetProjects.get(sheetId);
  }

  getPlantForSheet(sheetId: number): string | undefined {
    return this.sheetPlants.get(sheetId);
  }

  getMonthLabel(month: number, year: number): string {
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${monthNames[month]} ${year}`;
  }

  exportToCSV(): void {
    if (!this.selectedMonthStats) return;

    const headers = ['Référence Leoni', 'Référence Fournisseur', 'Quantité reçue', 'Nombre réceptions', 'Projet', 'Site'];
    const rows = this.selectedMonthItems.map(item => [
      item.housingReferenceLeoni,
      item.housingReferenceSupplier,
      item.quantityReceived,
      item.receptionCount,
      item.project,
      item.plant
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `statistiques_references_${this.selectedMonthLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
}

// Interfaces
interface MonthlyStat {
  month: string;
  monthKey: string;
  year: number;
  monthNumber: number;
  quantityReceived: number;
  numberOfReceptions: number;
  numberOfItems: number;
  quantityOrdered: number;
  completionRate: number;
  avgPerReception: number;
  quantityPercentage: number;
}

interface MonthItemStat {
  itemId: number;
  itemNumber: string;
  housingReferenceLeoni: string;
  housingReferenceSupplier: string;
  quantityReceived: number;
  receptionCount: number;
  project: string;
  plant: string;
}
