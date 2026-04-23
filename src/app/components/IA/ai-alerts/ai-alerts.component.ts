// ai-alerts.component.ts - Version corrigée
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ai-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="alerts-dashboard">
      <!-- En-tête -->
      <div class="alerts-header">
        <h1>
          <i class="bi bi-bell-fill"></i>
          Centre d'alertes intelligent
        </h1>
        <p>Surveillance automatique du stock - Alertes en temps réel</p>
         <a routerLink="/dashboard" class="btn btn-light">
          <i class="bi bi-arrow-left me-2"></i>Retour
        </a>
      </div>

      <!-- Statistiques des alertes -->
      <div class="stats-row">
        <div class="stat-card critical">
          <div class="stat-value">{{ criticalCount }}</div>
          <div class="stat-label">Alertes critiques</div>
          <div class="stat-icon">🚨</div>
        </div>
        <div class="stat-card high">
          <div class="stat-value">{{ highCount }}</div>
          <div class="stat-label">Alertes haute priorité</div>
          <div class="stat-icon">⚠️</div>
        </div>
        <div class="stat-card medium">
          <div class="stat-value">{{ mediumCount }}</div>
          <div class="stat-label">Alertes moyennes</div>
          <div class="stat-icon">📌</div>
        </div>
        <div class="stat-card low">
          <div class="stat-value">{{ lowCount }}</div>
          <div class="stat-label">Alertes informatives</div>
          <div class="stat-icon">ℹ️</div>
        </div>
      </div>

      <!-- Boutons d'action -->
      <div class="action-bar">
        <button class="btn-refresh" (click)="refreshAlerts()" [disabled]="refreshing">
          <i class="bi bi-arrow-repeat"></i>
          {{ refreshing ? 'Actualisation...' : 'Actualiser les alertes' }}
        </button>
        <button class="btn-export" (click)="exportAlerts()">
          <i class="bi bi-download"></i>
          Exporter les alertes
        </button>
      </div>

      <!-- Liste des alertes -->
      <div class="alerts-list">
        <div *ngFor="let alert of alerts; let i = index" class="alert-item" [class]="alert.priority">
          <div class="alert-icon">
            <span *ngIf="alert.type === 'STOCK_EPUISE'">🚨</span>
            <span *ngIf="alert.type === 'STOCK_CRITIQUE'">⚠️</span>
            <span *ngIf="alert.type === 'STOCK_BAS'">📉</span>
            <span *ngIf="alert.type === 'STOCK_DORMANT'">💤</span>
            <span *ngIf="alert.type === 'ROTATION_ELEVEE'">🔄</span>
            <span *ngIf="alert.type === 'STOCK_ANCIEN'">📅</span>
            <span *ngIf="alert.type === 'STOCK_SURPLUS'">📦</span>
            <span *ngIf="!alert.type">⚠️</span>
          </div>
          <div class="alert-content">
            <div class="alert-title">{{ alert.message }}</div>
            <div class="alert-detail">{{ alert.detail || 'Aucun détail disponible' }}</div>
            <div class="alert-info">
              <span class="alert-module">📦 Réf: {{ alert.reference || 'N/A' }}</span>
              <span class="alert-supplier">🏭 Fournisseur: {{ alert.fournisseur || 'Inconnu' }}</span>
              <span class="alert-date">🕐 {{ alert.created_at ? (alert.created_at | date:'dd/MM/yyyy HH:mm') : (now | date:'dd/MM/yyyy HH:mm') }}</span>
            </div>
            <div class="alert-action">
              <button class="btn-action" (click)="takeAction(alert)">
                ✅ {{ alert.action || 'Voir le module' }}
              </button>
            </div>
          </div>
          <div class="alert-priority">
            <span class="priority-badge" [class]="alert.priority">
              {{ getPriorityLabel(alert.priority) }}
            </span>
          </div>
        </div>

        <!-- Message vide -->
        <div *ngIf="alerts.length === 0 && !loading" class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>Pas d'alertes</h3>
          <p>Tous les indicateurs sont verts !</p>
          <button class="btn-refresh" (click)="refreshAlerts()">
            <i class="bi bi-arrow-repeat"></i>
            Vérifier à nouveau
          </button>
        </div>

        <!-- Chargement -->
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Analyse du stock en cours...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .alerts-dashboard {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', sans-serif;
    }

    .alerts-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .alerts-header h1 {
      color: #1e3c72;
      margin-bottom: 10px;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      position: relative;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-3px);
    }

    .stat-card.critical { border-left: 4px solid #f44336; }
    .stat-card.high { border-left: 4px solid #ff9800; }
    .stat-card.medium { border-left: 4px solid #ffc107; }
    .stat-card.low { border-left: 4px solid #4caf50; }

    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #333;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }

    .stat-icon {
      position: absolute;
      right: 15px;
      top: 15px;
      font-size: 24px;
      opacity: 0.5;
    }

    .action-bar {
      display: flex;
      gap: 15px;
      justify-content: flex-end;
      margin-bottom: 20px;
    }

    .btn-refresh, .btn-export {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .btn-refresh {
      background: #1e3c72;
      color: white;
    }

    .btn-refresh:hover:not(:disabled) {
      background: #0f2b4a;
    }

    .btn-export {
      background: #28a745;
      color: white;
    }

    .btn-export:hover {
      background: #1e7e34;
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .alert-item {
      display: flex;
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s;
    }

    .alert-item:hover {
      transform: translateX(5px);
    }

    .alert-item.critical { border-left: 5px solid #f44336; background: #fff5f5; }
    .alert-item.high { border-left: 5px solid #ff9800; background: #fff8f0; }
    .alert-item.medium { border-left: 5px solid #ffc107; background: #fffef5; }
    .alert-item.low { border-left: 5px solid #4caf50; background: #f5fff5; }

    .alert-icon {
      font-size: 32px;
      margin-right: 20px;
      min-width: 50px;
      text-align: center;
    }

    .alert-content {
      flex: 1;
    }

    .alert-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .alert-detail {
      color: #666;
      margin-bottom: 10px;
    }

    .alert-info {
      display: flex;
      gap: 20px;
      font-size: 13px;
      color: #999;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }

    .alert-info span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .alert-action {
      margin-top: 5px;
    }

    .btn-action {
      background: #1e3c72;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    }

    .btn-action:hover {
      background: #0f2b4a;
    }

    .alert-priority {
      min-width: 100px;
      text-align: right;
    }

    .priority-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }

    .priority-badge.critical { background: #f44336; color: white; }
    .priority-badge.high { background: #ff9800; color: white; }
    .priority-badge.medium { background: #ffc107; color: #333; }
    .priority-badge.low { background: #4caf50; color: white; }

    .empty-state, .loading-state {
      text-align: center;
      padding: 60px;
      background: white;
      border-radius: 12px;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #1e3c72;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .alert-item {
        flex-direction: column;
      }

      .alert-priority {
        text-align: left;
        margin-top: 10px;
      }

      .alert-info {
        flex-wrap: wrap;
      }
    }
  `]
})
export class AiAlertsComponent implements OnInit, OnDestroy {
  alerts: any[] = [];
  loading = false;
  refreshing = false;
  refreshInterval: any;
  now = new Date();

  criticalCount = 0;
  highCount = 0;
  mediumCount = 0;
  lowCount = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadAlerts();
    // Actualiser toutes les 5 minutes
    this.refreshInterval = setInterval(() => {
      this.loadAlerts();
    }, 5 * 60 * 1000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadAlerts() {
    this.loading = true;
    this.http.get('http://localhost:5000/api/ai/alerts').subscribe({
      next: (res: any) => {
        this.alerts = res.alerts || [];
        this.updateCounts();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement alertes:', err);
        this.loading = false;
        // Données de test en cas d'erreur
        this.alerts = this.getMockAlerts();
        this.updateCounts();
      }
    });
  }

  refreshAlerts() {
    this.refreshing = true;
    this.http.post('http://localhost:5000/api/ai/alerts/refresh', {}).subscribe({
      next: (res: any) => {
        this.alerts = res.alerts || [];
        this.updateCounts();
        this.refreshing = false;
      },
      error: (err) => {
        console.error('Erreur actualisation:', err);
        this.alerts = this.getMockAlerts();
        this.updateCounts();
        this.refreshing = false;
      }
    });
  }

  updateCounts() {
    this.criticalCount = this.alerts.filter(a => a.priority === 'critical').length;
    this.highCount = this.alerts.filter(a => a.priority === 'high').length;
    this.mediumCount = this.alerts.filter(a => a.priority === 'medium').length;
    this.lowCount = this.alerts.filter(a => a.priority === 'low').length;
  }

  getPriorityLabel(priority: string): string {
    switch(priority) {
      case 'critical': return '🚨 CRITIQUE';
      case 'high': return '⚠️ HAUTE';
      case 'medium': return '📌 MOYENNE';
      case 'low': return 'ℹ️ INFO';
      default: return 'UNKNOWN';
    }
  }

  takeAction(alert: any) {
    // Ouvrir le module concerné ou générer un bon de commande
    console.log('Action sur alerte:', alert);
    const message = `Action: ${alert.action || 'Voir le module'}\nModule: ${alert.reference || 'N/A'}\nFournisseur: ${alert.fournisseur || 'Inconnu'}`;
    alert(message);
  }

  exportAlerts() {
    const data = JSON.stringify(this.alerts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alertes_stock_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Données de test en cas d'erreur API
  getMockAlerts(): any[] {
    return [
      {
        id: 1,
        type: 'STOCK_CRITIQUE',
        priority: 'critical',
        reference: '8R0973705',
        fournisseur: 'MMC',
        message: '⚠️ STOCK CRITIQUE - Module 8R0973705',
        detail: 'Plus que 1 unité disponible',
        action: 'Commander dans les 24h',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        type: 'STOCK_EPUISE',
        priority: 'critical',
        reference: '1K0971992',
        fournisseur: 'MMC',
        message: '🚨 STOCK ÉPUISÉ - Module 1K0971992',
        detail: 'Plus aucune unité disponible',
        action: 'Commander immédiatement',
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        type: 'STOCK_SURPLUS',
        priority: 'low',
        reference: 'TEST001',
        fournisseur: 'MMC SV',
        message: '📦 Stock important - Module TEST001',
        detail: '100 unités sans mouvement',
        action: 'Vérifier si toujours nécessaire',
        created_at: new Date().toISOString()
      }
    ];
  }
}
