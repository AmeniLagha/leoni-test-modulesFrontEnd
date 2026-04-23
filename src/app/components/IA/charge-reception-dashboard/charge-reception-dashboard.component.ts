// charge-reception-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Alert, ChargeReceptionService, ChargeSheet, Dashboard, ReceptionHistory } from '../charge-reception.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-charge-reception-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterLink],
  template: `
    <div class="dashboard-container">
      <!-- En-tête -->
      <div class="dashboard-header">
        <h1>
          <i class="bi bi-file-text-fill"></i>
          Gestion intelligente des Cahiers des Charges
        </h1>
        <p>IA pour anticiper les retards, suivre les réceptions et optimiser les processus</p>
        <a [routerLink]="['/dashboard']" class="btn btn-light">
    <i class="bi bi-arrow-left me-2"></i>Retour
  </a>
      </div>

      <!-- Cartes de contrôle -->
      <div class="control-cards">
        <div class="control-card">
          <div class="card-icon">🤖</div>
          <div class="card-info">
            <div class="card-title">Modèle IA</div>
            <div class="card-status" [class.trained]="modelTrained">
              {{ modelTrained ? '✅ Entraîné' : '❌ Non entraîné' }}
            </div>
          </div>
          <button class="btn-train" (click)="trainModel()" [disabled]="training">
            {{ training ? 'Entraînement...' : 'Entraîner l\'IA' }}
          </button>
        </div>

        <div class="control-card" *ngIf="dashboard">
          <div class="card-icon">📊</div>
          <div class="card-info">
            <div class="card-title">Performance globale</div>
            <div class="card-stats">
              <span>📄 {{ dashboard.charge_sheet_stats.total }} cahiers</span>
              <span>📦 {{ dashboard.reception_stats.total }} réceptions</span>
            </div>
          </div>
        </div>

        <div class="control-card" *ngIf="dashboard">
          <div class="card-icon">📈</div>
          <div class="card-info">
            <div class="card-title">Taux de complétion</div>
            <div class="card-stats">
              <span class="success">{{ dashboard.reception_stats.completion_rate.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Onglets de navigation -->
      <div class="tabs">
        <button class="tab-btn" [class.active]="activeTab === 'dashboard'" (click)="activeTab = 'dashboard'">
          📊 Tableau de bord
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'alerts'" (click)="activeTab = 'alerts'">
          🔔 Alertes ({{ alerts.length }})
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'predict'" (click)="activeTab = 'predict'">
          🔮 Prédictions
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'suppliers'" (click)="activeTab = 'suppliers'">
          🏭 Fournisseurs
        </button>
      </div>

      <!-- TAB 1: TABLEAU DE BORD -->
      <div class="tab-content" *ngIf="activeTab === 'dashboard' && dashboard">
        <!-- Statistiques Cahiers des charges -->
        <div class="stats-section">
          <h3>📄 Cahiers des charges</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ dashboard.charge_sheet_stats.total }}</div>
              <div class="stat-label">Total</div>
            </div>
            <div class="stat-card success">
              <div class="stat-value">{{ dashboard.charge_sheet_stats.completed }}</div>
              <div class="stat-label">Complétés</div>
            </div>
            <div class="stat-card warning">
              <div class="stat-value">{{ dashboard.charge_sheet_stats.in_progress }}</div>
              <div class="stat-label">En cours</div>
            </div>
            <div class="stat-card danger">
              <div class="stat-value">{{ dashboard.charge_sheet_stats.draft }}</div>
              <div class="stat-label">Brouillons</div>
            </div>
            <div class="stat-card critical">
              <div class="stat-value">{{ dashboard.charge_sheet_stats.overdue }}</div>
              <div class="stat-label">En retard</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ dashboard.charge_sheet_stats.avg_progress.toFixed(0) }}%</div>
              <div class="stat-label">Progression moyenne</div>
            </div>
          </div>

          <!-- Barre de progression par statut -->
          <div class="progress-section" *ngIf="dashboard.charge_sheet_stats.by_status">
            <h4>Répartition par statut</h4>
            <div class="progress-bars">
              <div *ngFor="let item of dashboard.charge_sheet_stats.by_status | keyvalue" class="progress-item">
                <div class="progress-label">{{ item.key }}</div>
                <div class="progress-bar-container">
                  <div class="progress-fill" [style.width.%]="(item.value / dashboard.charge_sheet_stats.total * 100)"
                       [style.background-color]="getStatusColor(item.key)">
                  </div>
                </div>
                <div class="progress-value">{{ item.value }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistiques Réceptions -->
        <div class="stats-section">
          <h3>📦 Réceptions</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ dashboard.reception_stats.total_ordered }}</div>
              <div class="stat-label">Commandés</div>
            </div>
            <div class="stat-card success">
              <div class="stat-value">{{ dashboard.reception_stats.total_received }}</div>
              <div class="stat-label">Reçus</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ dashboard.reception_stats.complete_receptions }}</div>
              <div class="stat-label">Complètes</div>
            </div>
            <div class="stat-card warning">
              <div class="stat-value">{{ dashboard.reception_stats.partial_receptions }}</div>
              <div class="stat-label">Partielles</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ dashboard.reception_stats.avg_delivery_delay.toFixed(1) }}</div>
              <div class="stat-label">Délai moyen (jours)</div>
            </div>
          </div>
        </div>

        <!-- Recommandations -->
        <div class="recommendations-section" *ngIf="dashboard.recommendations.length > 0">
          <h3>💡 Recommandations IA</h3>
          <div *ngFor="let rec of dashboard.recommendations" class="recommendation-card" [class]="rec.priority.toLowerCase()">
            <div class="rec-icon">
              <span *ngIf="rec.priority === 'CRITICAL'">🚨</span>
              <span *ngIf="rec.priority === 'HIGH'">⚠️</span>
              <span *ngIf="rec.priority === 'MEDIUM'">📌</span>
              <span *ngIf="rec.priority === 'LOW'">ℹ️</span>
            </div>
            <div class="rec-content">
              <div class="rec-title">{{ rec.title }}</div>
              <div class="rec-message">{{ rec.message }}</div>
              <div class="rec-action">✅ {{ rec.action }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: ALERTES -->
      <div class="tab-content" *ngIf="activeTab === 'alerts'">
        <div class="alerts-header">
          <button class="btn-refresh" (click)="loadAlerts()" [disabled]="loading">
            <i class="bi bi-arrow-repeat"></i> Actualiser
          </button>
        </div>

        <div *ngIf="alerts.length === 0 && !loading" class="empty-state">
          <div class="empty-icon">✅</div>
          <p>Aucune alerte - Tout est sous contrôle !</p>
        </div>

        <div *ngFor="let alert of alerts" class="alert-card" [class]="alert.priority.toLowerCase()">
          <div class="alert-icon">
            <span *ngIf="alert.type === 'CHARGE_SHEET_STUCK'">📄</span>
            <span *ngIf="alert.type === 'CHARGE_SHEET_OVERDUE'">⏰</span>
            <span *ngIf="alert.type === 'RECEPTION_PARTIAL'">📦</span>
            <span *ngIf="alert.type === 'RECEPTION_MISSING'">🚨</span>
            <span *ngIf="alert.type === 'RECEPTION_EXCESS'">📦</span>
            <span *ngIf="!alert.type">⚠️</span>
          </div>
          <div class="alert-content">
            <div class="alert-title">{{ alert.title }}</div>
            <div class="alert-message">{{ alert.message }}</div>
            <div class="alert-reference">Réf: {{ alert.reference }}</div>
            <div class="alert-action">🔧 {{ alert.action }}</div>
          </div>
          <div class="alert-priority">
            <span class="priority-badge" [class]="alert.priority.toLowerCase()">
              {{ getPriorityLabel(alert.priority) }}
            </span>
          </div>
        </div>
      </div>

      <!-- TAB 3: PRÉDICTIONS -->
      <div class="tab-content" *ngIf="activeTab === 'predict'">
        <!-- Prédiction cahier des charges -->
        <div class="prediction-section">
          <h3>📄 Prédiction Cahier des charges</h3>
          <div class="prediction-form">
            <div class="form-row">
              <div class="form-group">
                <label>Numéro commande</label>
                <input type="text" class="form-control" [(ngModel)]="testChargeSheet.orderNumber" placeholder="Ex: ORD-001">
              </div>
              <div class="form-group">
                <label>Statut actuel</label>
                <select class="form-control" [(ngModel)]="testChargeSheet.status">
                  <option>DRAFT</option>
                  <option>SENT_TO_SUPPLIER</option>
                  <option>RECEIVED_FROM_SUPPLIER</option>
                  <option>TECH_FILLED</option>
                  <option>VALIDATED_ING</option>
                </select>
              </div>
              <div class="form-group">
                <label>Date commande</label>
                <input type="date" class="form-control" [(ngModel)]="testChargeSheet.date">
              </div>
              <div class="form-group">
                <label>Date livraison prévue</label>
                <input type="date" class="form-control" [(ngModel)]="testChargeSheet.preferredDeliveryDate">
              </div>
              <div class="form-group">
                <label>Projet</label>
                <select class="form-control" [(ngModel)]="testChargeSheet.project">
                  <option>FORD</option>
                  <option>MERCEDES</option>
                  <option>BMW</option>
                  <option>AUDI</option>
                  <option>PORSCHE</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn-predict" (click)="predictDelay()" [disabled]="predicting">
                🔮 Prédire le retard
              </button>
              <button class="btn-predict secondary" (click)="predictNextStatus()" [disabled]="predicting">
                📌 Prédire prochain statut
              </button>
            </div>
          </div>

          <div *ngIf="delayPrediction" class="prediction-result" [class]="delayPrediction.is_late ? 'warning' : 'success'">
            <div class="result-icon">{{ delayPrediction.is_late ? '⚠️' : '✅' }}</div>
            <div class="result-message">{{ delayPrediction.message }}</div>
          </div>

          <div *ngIf="statusPrediction" class="prediction-result info">
            <div class="result-icon">📌</div>
            <div class="result-message">
              Prochain statut: <strong>{{ statusPrediction.next_status }}</strong><br>
              Délai estimé: {{ statusPrediction.estimated_time }}
            </div>
          </div>
        </div>

        <!-- Prédiction réception -->
        <div class="prediction-section">
          <h3>📦 Prédiction Réception</h3>
          <div class="prediction-form">
            <div class="form-row">
              <div class="form-group">
                <label>Quantité commandée</label>
                <input type="number" class="form-control" [(ngModel)]="testReception.quantityOrdered" placeholder="0">
              </div>
              <div class="form-group">
                <label>Quantité déjà reçue</label>
                <input type="number" class="form-control" [(ngModel)]="testReception.quantityReceived" placeholder="0">
              </div>
              <div class="form-group">
                <label>N° Bon de livraison</label>
                <input type="text" class="form-control" [(ngModel)]="testReception.deliveryNoteNumber" placeholder="Ex: DN-001">
              </div>
            </div>
            <button class="btn-predict" (click)="predictReception()" [disabled]="predicting">
              🔮 Prédire la réception
            </button>
          </div>

          <div *ngIf="receptionPrediction" class="prediction-result" [class]="receptionPrediction.confidence_score > 70 ? 'success' : 'warning'">
            <div class="result-icon">{{ receptionPrediction.confidence_score > 70 ? '✅' : '⚠️' }}</div>
            <div class="result-message">{{ receptionPrediction.message }}</div>
            <div class="result-confidence">Confiance: {{ receptionPrediction.confidence_score }}%</div>
          </div>
        </div>
      </div>

      <!-- TAB 4: FOURNISSEURS -->
      <div class="tab-content" *ngIf="activeTab === 'suppliers' && dashboard">
        <div class="supplier-stats">
          <div class="stat-card">
            <div class="stat-value">{{ dashboard.supplier_analysis.total_orders }}</div>
            <div class="stat-label">Commandes totales</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-value">{{ dashboard.supplier_analysis.high_risk_suppliers.length }}</div>
            <div class="stat-label">Fournisseurs à risque élevé</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-value">{{ dashboard.supplier_analysis.medium_risk_suppliers.length }}</div>
            <div class="stat-label">Fournisseurs à risque moyen</div>
          </div>
        </div>

        <div class="supplier-list">
          <h3>📊 Performance par fournisseur</h3>
          <div *ngFor="let supplier of dashboard.supplier_analysis.supplier_performance | keyvalue"
               class="supplier-card"
               [class]="getSupplierRiskClass(supplier.value)">
            <div class="supplier-name">{{ supplier.key }}</div>
            <div class="supplier-rate">
              <div class="rate-bar">
                <div class="rate-fill" [style.width.%]="supplier.value"></div>
              </div>
              <span class="rate-value">{{ supplier.value.toFixed(0) }}%</span>
            </div>
            <div class="supplier-risk">
              <span *ngIf="supplier.value < 50" class="risk-badge high">⚠️ Risque élevé</span>
              <span *ngIf="supplier.value >= 50 && supplier.value < 80" class="risk-badge medium">📌 Risque moyen</span>
              <span *ngIf="supplier.value >= 80" class="risk-badge low">✅ Bon fournisseur</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', sans-serif;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .dashboard-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .dashboard-header h1 {
      color: #1e3c72;
      margin-bottom: 10px;
    }

    .dashboard-header p {
      color: #666;
    }

    /* Cartes de contrôle */
    .control-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .control-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .card-icon {
      font-size: 40px;
    }

    .card-info {
      flex: 1;
    }

    .card-title {
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }

    .card-status {
      color: #f44336;
    }

    .card-status.trained {
      color: #4caf50;
    }

    .card-stats {
      display: flex;
      gap: 15px;
      font-size: 14px;
      color: #666;
    }

    .card-stats .success {
      color: #4caf50;
      font-weight: bold;
      font-size: 24px;
    }

    .btn-train {
      background: #1e3c72;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
    }

    /* Onglets */
    .tabs {
      display: flex;
      gap: 5px;
      margin-bottom: 20px;
      border-bottom: 2px solid #e0e0e0;
    }

    .tab-btn {
      background: none;
      border: none;
      padding: 12px 24px;
      font-size: 16px;
      cursor: pointer;
      color: #666;
      border-radius: 8px 8px 0 0;
    }

    .tab-btn:hover {
      background: #e8e8e8;
    }

    .tab-btn.active {
      background: #1e3c72;
      color: white;
    }

    /* Statistiques */
    .stats-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .stats-section h3 {
      margin: 0 0 15px 0;
      color: #333;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: #f8f9fa;
      border-radius: 10px;
      padding: 15px;
      text-align: center;
    }

    .stat-card.success { border-left: 4px solid #4caf50; }
    .stat-card.warning { border-left: 4px solid #ff9800; }
    .stat-card.danger { border-left: 4px solid #f44336; }
    .stat-card.critical { border-left: 4px solid #9c27b0; }

    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #333;
    }

    .stat-label {
      font-size: 13px;
      color: #666;
      margin-top: 5px;
    }

    /* Progress bars */
    .progress-section {
      margin-top: 20px;
    }

    .progress-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .progress-label {
      width: 180px;
      font-size: 13px;
    }

    .progress-bar-container {
      flex: 1;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 4px;
    }

    .progress-value {
      width: 40px;
      font-size: 13px;
      text-align: right;
    }

    /* Recommandations */
    .recommendations-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
    }

    .recommendation-card {
      display: flex;
      gap: 15px;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 10px;
      background: #f8f9fa;
    }

    .recommendation-card.critical { background: #fff3f0; border-left: 4px solid #f44336; }
    .recommendation-card.high { background: #fff8f0; border-left: 4px solid #ff9800; }
    .recommendation-card.medium { background: #fffef5; border-left: 4px solid #ffc107; }

    .rec-icon { font-size: 28px; }
    .rec-content { flex: 1; }
    .rec-title { font-weight: bold; margin-bottom: 5px; }
    .rec-message { color: #666; font-size: 14px; margin-bottom: 8px; }
    .rec-action { font-size: 13px; color: #1e3c72; }

    /* Alertes */
    .alerts-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }

    .btn-refresh {
      background: #1e3c72;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
    }

    .alert-card {
      display: flex;
      gap: 15px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      margin-bottom: 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .alert-card.critical { border-left: 5px solid #f44336; }
    .alert-card.high { border-left: 5px solid #ff9800; }
    .alert-card.medium { border-left: 5px solid #ffc107; }
    .alert-card.low { border-left: 5px solid #4caf50; }

    .alert-icon { font-size: 32px; }
    .alert-content { flex: 1; }
    .alert-title { font-weight: bold; margin-bottom: 5px; }
    .alert-message { color: #666; margin-bottom: 5px; }
    .alert-reference { font-size: 12px; color: #999; margin-bottom: 8px; }
    .alert-action { font-size: 13px; color: #1e3c72; }

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

    /* Prédictions */
    .prediction-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .prediction-form {
      margin-bottom: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 15px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .form-group label {
      font-size: 13px;
      font-weight: 500;
      color: #555;
    }

    .form-control {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
    }

    .form-actions {
      display: flex;
      gap: 10px;
    }

    .btn-predict {
      background: #2196f3;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
    }

    .btn-predict.secondary {
      background: #6c757d;
    }

    .prediction-result {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      border-radius: 10px;
      margin-top: 15px;
    }

    .prediction-result.success { background: #e8f5e9; border-left: 4px solid #4caf50; }
    .prediction-result.warning { background: #fff3e0; border-left: 4px solid #ff9800; }
    .prediction-result.info { background: #e3f2fd; border-left: 4px solid #2196f3; }

    .result-icon { font-size: 32px; }
    .result-message { flex: 1; }
    .result-confidence { font-size: 12px; color: #666; margin-top: 5px; }

    /* Fournisseurs */
    .supplier-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .supplier-list {
      background: white;
      border-radius: 12px;
      padding: 20px;
    }

    .supplier-card {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 15px;
      border-bottom: 1px solid #eee;
    }

    .supplier-name {
      width: 150px;
      font-weight: bold;
    }

    .supplier-rate {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .rate-bar {
      flex: 1;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .rate-fill {
      height: 100%;
      background: linear-gradient(90deg, #4caf50, #8bc34a);
      border-radius: 4px;
    }

    .rate-value {
      width: 45px;
      font-weight: bold;
    }

    .risk-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
    }
    .risk-badge.high { background: #f44336; color: white; }
    .risk-badge.medium { background: #ff9800; color: white; }
    .risk-badge.low { background: #4caf50; color: white; }

    /* États vides */
    .empty-state {
      text-align: center;
      padding: 60px;
      background: white;
      border-radius: 12px;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .supplier-card { flex-direction: column; align-items: flex-start; }
      .supplier-name { width: auto; }
      .supplier-rate { width: 100%; }
    }
  `]
})
export class ChargeReceptionDashboardComponent implements OnInit, OnDestroy {
  activeTab = 'dashboard';
  loading = false;
  training = false;
  predicting = false;
  modelTrained = false;
  refreshInterval: any;

  dashboard: Dashboard | null = null;
  alerts: Alert[] = [];

  // Prédictions
  testChargeSheet: ChargeSheet = {
    orderNumber: 'ORD-001',
    status: 'DRAFT',
    date: new Date().toISOString().split('T')[0],
    preferredDeliveryDate: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
    project: 'FORD',
    plant: 'LTN1'
  };

  testReception: ReceptionHistory = {
    quantityOrdered: 50,
    quantityReceived: 20,
    deliveryNoteNumber: 'DN-001'
  };

  delayPrediction: any = null;
  statusPrediction: any = null;
  receptionPrediction: any = null;

  constructor(private service: ChargeReceptionService) {}

  ngOnInit() {
    this.loadDashboard();
    this.loadAlerts();
    this.checkModelStatus();

    // Actualiser toutes les 5 minutes
    this.refreshInterval = setInterval(() => {
      this.loadDashboard();
      this.loadAlerts();
    }, 5 * 60 * 1000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  checkModelStatus() {
    this.service.getStatus().subscribe({
      next: (res) => {
        this.modelTrained = res.model_loaded;
      },
      error: () => {
        this.modelTrained = false;
      }
    });
  }

  trainModel() {
    this.training = true;
    this.service.trainModels().subscribe({
      next: (res) => {
        this.modelTrained = true;
        this.training = false;
        alert('✅ Modèles entraînés avec succès !');
        this.loadDashboard();
      },
      error: (err) => {
        console.error(err);
        this.training = false;
        alert('❌ Erreur lors de l\'entraînement');
      }
    });
  }

  loadDashboard() {
    this.loading = true;
    this.service.getDashboard().subscribe({
      next: (res) => {
        this.dashboard = res.dashboard;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadAlerts() {
    this.service.getAlerts().subscribe({
      next: (res) => {
        this.alerts = res.alerts || [];
      },
      error: (err) => console.error(err)
    });
  }

  predictDelay() {
    this.predicting = true;
    this.service.predictDelay(this.testChargeSheet).subscribe({
      next: (res) => {
        this.delayPrediction = res;
        this.predicting = false;
      },
      error: (err) => {
        console.error(err);
        this.predicting = false;
      }
    });
  }

  predictNextStatus() {
    this.predicting = true;
    this.service.predictNextStatus(this.testChargeSheet).subscribe({
      next: (res) => {
        this.statusPrediction = res;
        this.predicting = false;
      },
      error: (err) => {
        console.error(err);
        this.predicting = false;
      }
    });
  }

  predictReception() {
    this.predicting = true;
    this.service.predictReception(this.testReception).subscribe({
      next: (res) => {
        this.receptionPrediction = res;
        this.predicting = false;
      },
      error: (err) => {
        console.error(err);
        this.predicting = false;
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'DRAFT': '#9e9e9e',
      'SENT_TO_SUPPLIER': '#2196f3',
      'RECEIVED_FROM_SUPPLIER': '#ff9800',
      'TECH_FILLED': '#9c27b0',
      'VALIDATED_ING': '#4caf50',
      'COMPLETED': '#4caf50'
    };
    return colors[status] || '#1e3c72';
  }

  getPriorityLabel(priority: string): string {
    switch(priority) {
      case 'CRITICAL': return '🚨 CRITIQUE';
      case 'HIGH': return '⚠️ HAUTE';
      case 'MEDIUM': return '📌 MOYENNE';
      default: return 'ℹ️ INFO';
    }
  }

  getSupplierRiskClass(rate: number): string {
    if (rate < 50) return 'high';
    if (rate < 80) return 'medium';
    return 'low';
  }
}
