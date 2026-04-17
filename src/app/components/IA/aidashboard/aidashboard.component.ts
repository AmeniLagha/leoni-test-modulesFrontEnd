// ai-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-ai-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './aidashboard.component.html',
  styleUrls: ['./aidashboard.component.css']
})
export class AIDashboardComponent implements OnInit {
  // État du modèle
  modelTrained = false;
  training = false;
  trainingProgress = 0;
  trainingMessage = '';

  // Performances du modèle
  quantityScore = 0;
  statusAccuracy = 0;
  totalModulesAnalyzed = 0;

  // Résultats
  anomalyCount = 0;
  anomalies: any[] = [];
  recommendations: any[] = [];
  statistics: any = {};
  prediction: any = null;
  showAnomaliesDetail = false;
  activeTab = 'recommendations';

  // Données de test
  testModule = {
    quantite: 10,
    new_quantite: 0,
    fournisseur: 'MMC',
    etat: 'OK',
    indexValue: '00DT',
    status: 'AVAILABLE'
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadRecommendations();
    this.loadStatistics();
    this.checkModelStatus();
  }

  checkModelStatus() {
    this.http.get('http://localhost:5000/api/ai/status').subscribe({
      next: (res: any) => {
        this.modelTrained = res.model_loaded;
      },
      error: (err) => console.error('Erreur vérification statut:', err)
    });
  }

  trainModel() {
    this.training = true;
    this.trainingProgress = 0;
    this.trainingMessage = 'Préparation des données...';

    // Simuler la progression
    const interval = setInterval(() => {
      if (this.trainingProgress < 90) {
        this.trainingProgress += 10;
        if (this.trainingProgress === 30) this.trainingMessage = 'Analyse des modules...';
        if (this.trainingProgress === 50) this.trainingMessage = 'Entraînement du modèle...';
        if (this.trainingProgress === 70) this.trainingMessage = 'Validation des résultats...';
      }
    }, 500);

    this.http.post('http://localhost:5000/api/ai/train', {}).subscribe({
      next: (res: any) => {
        clearInterval(interval);
        this.trainingProgress = 100;
        this.trainingMessage = 'Entraînement terminé !';
        this.modelTrained = true;
        this.quantityScore = res.quantity_score || 0;
        this.statusAccuracy = res.status_accuracy || 0;
        this.totalModulesAnalyzed = res.total_modules || 0;
        this.training = false;
        this.loadRecommendations();
        this.loadStatistics();

        setTimeout(() => {
          this.trainingProgress = 0;
          this.trainingMessage = '';
        }, 2000);
      },
      error: (err) => {
        clearInterval(interval);
        this.training = false;
        this.trainingMessage = '';
        alert('Erreur lors de l\'entraînement: ' + (err.error?.error || err.message));
      }
    });
  }

  predict() {
    this.http.post('http://localhost:5000/api/ai/predict', this.testModule).subscribe({
      next: (res: any) => {
        this.prediction = res;
      },
      error: (err) => console.error('Erreur prédiction:', err)
    });
  }

  detectAnomalies() {
    this.http.get('http://localhost:5000/api/ai/anomalies').subscribe({
      next: (res: any) => {
        this.anomalyCount = res.count || 0;
        this.anomalies = res.anomalies || [];
        this.showAnomaliesDetail = true;
      },
      error: (err) => console.error('Erreur détection anomalies:', err)
    });
  }

  loadRecommendations() {
    this.http.get('http://localhost:5000/api/ai/recommendations').subscribe({
      next: (res: any) => {
        this.recommendations = res.recommendations || [];
      },
      error: (err) => console.error('Erreur chargement recommandations:', err)
    });
  }

  loadStatistics() {
    this.http.get('http://localhost:5000/api/ai/statistics').subscribe({
      next: (res: any) => {
        this.statistics = res;
      },
      error: (err) => console.error('Erreur chargement statistiques:', err)
    });
  }

  getPriorityIcon(priority: string): string {
    switch(priority) {
      case 'HIGH': return '🔴';
      case 'MEDIUM': return '🟠';
      case 'LOW': return '🟢';
      default: return '⚪';
    }
  }

  getPriorityClass(priority: string): string {
    switch(priority) {
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return '';
    }
  }

  getTypeIcon(type: string): string {
    switch(type) {
      case 'CRITICAL_STOCK': return '⚠️';
      case 'DORMANT_STOCK': return '📦';
      case 'HIGH_TURNOVER': return '🔄';
      case 'AI_PREDICTION': return '🤖';
      default: return '💡';
    }
  }
}
