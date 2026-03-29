import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectStats } from '../../../models/stats.model';
import { ChargeSheetService } from '../../../services/charge-sheet.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistiques.component.html',
  styleUrls: ['./statistiques.component.css']
})
export class StatistiquesComponent implements OnInit{

  stats: ProjectStats | null = null;
  loading = true;
  error: string | null = null;


  constructor(
    private chargeSheetService: ChargeSheetService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.chargeSheetService.getDashboardStats().subscribe({
      next: (data) => {
        this.loading = false;
       this.stats = data;

      },
      error: (err) => {
        console.error('Erreur chargement stats:', err);
        this.error = 'Impossible de charger les statistiques';
        this.loading = false;
      }
    });
  }
  // Formater les nombres avec séparateur de milliers
  formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-FR').format(num);
  }
}
