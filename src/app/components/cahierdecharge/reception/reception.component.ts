import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { ReceptionItem, ReceptionRequest } from '../../../../models/charge-sheet.model';
import { ChargeSheetService } from '../../../../services/charge-sheet.service';

@Component({
  selector: 'app-reception',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container-custom">
      <!-- HEADER -->
      <div class="page-header">
        <h1>
          <i class="bi bi-truck"></i>
          Réception du cahier #{{ chargeSheetId }}
        </h1>
        <div class="breadcrumb">
          <a routerLink="/charge-sheets/list">📋 Liste des cahiers</a>
          <i class="bi bi-chevron-right"></i>
          <span class="current">📦 Réception</span>

        </div>
         <a routerLink="/charge-sheets/list" class="btn btn-light">
          <i class="bi bi-arrow-left me-2"></i>Retour
        </a>
      </div>

      <!-- LOADING -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Chargement des données de réception...</p>
      </div>

      <!-- FORMULAIRE DE RÉCEPTION -->
      <div *ngIf="!loading && receptionItems" class="form-card">
        <div class="card-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
          <i class="bi bi-box-seam"></i>
          <h5 style="color: white; margin: 0;">Saisir les quantités reçues</h5>
        </div>

        <div class="card-body">
          <!-- Informations de livraison -->
          <div class="delivery-info-grid">
            <div class="form-field">
              <label><i class="bi bi-upc-scan"></i> N° Bon de livraison <span class="required">*</span></label>
              <input type="text" class="form-input" [(ngModel)]="deliveryNoteNumber"
                     placeholder="Ex: BL-2024-001" required>
            </div>
            <div class="form-field">
              <label><i class="bi bi-calendar"></i> Date de réception <span class="required">*</span></label>
              <input type="date" class="form-input" [(ngModel)]="receptionDate" required>
            </div>
            <div class="form-field full-width">
              <label><i class="bi bi-chat"></i> Commentaires</label>
              <textarea class="form-input" [(ngModel)]="comments" rows="2"
                        placeholder="Observations éventuelles..."></textarea>
            </div>
          </div>

          <!-- Tableau des items -->
          <table class="excel-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantité commandée</th>
                <th>Déjà reçu</th>
                <th>Reste à recevoir</th>
                <th>Quantité reçue aujourd'hui</th>
                <th>Total après réception</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of receptionItems">
                <td><strong>Item {{ item.itemNumber }}</strong></td>
                <td class="text-center">{{ item.quantityOrdered }}</td>
                <td class="text-center">{{ item.quantityOrdered - item.quantityRemaining }}</td>
                <td class="text-center">{{ item.quantityRemaining }}</td>
                <td>
                  <input type="number"
                         class="form-input quantity-input"
                         [(ngModel)]="item.quantityReceived"
                         [max]="item.quantityRemaining"
                         min="0"
                         (input)="validateQuantity(item)">
                </td>
                <td class="text-center">
                  <span class="total-badge"
                        [class.complete]="(item.quantityOrdered - item.quantityRemaining) + item.quantityReceived >= item.quantityOrdered">
                    {{ (item.quantityOrdered - item.quantityRemaining) + item.quantityReceived }} / {{ item.quantityOrdered }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Résumé -->
          <div class="reception-summary" [class.warning]="hasPartialReception()">
            <i class="bi" [class.bi-info-circle]="!hasPartialReception()" [class.bi-exclamation-triangle]="hasPartialReception()"></i>
            <span>{{ getSummaryMessage() }}</span>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="goBack()">
              <i class="bi bi-x-circle"></i> Annuler
            </button>
            <button type="button" class="btn btn-primary" (click)="confirmReception()"
                    [disabled]="!isValid()">
              <i class="bi bi-check-circle"></i> Confirmer la réception
            </button>
          </div>
        </div>
      </div>

      <!-- Historique des réceptions -->
      <div *ngIf="history.length > 0" class="history-card">
        <div class="card-header">
          <i class="bi bi-clock-history"></i>
          <h5>Historique des réceptions</h5>
        </div>
        <div class="card-body">
          <table class="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Quantité reçue</th>
                <th>N° Bon de livraison</th>
                <th>Reçu par</th>
                <th>Commentaires</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let h of history">
                <td>{{ h.receptionDate | date:'dd/MM/yyyy' }}</td>
                <td><strong>Item {{ h.item.itemNumber }}</strong></td>
                <td class="text-center">{{ h.quantityReceived }}</td>
                <td>{{ h.deliveryNoteNumber || '-' }}</td>
                <td>{{ h.receivedBy | slice:0:10 }}...</td>
                <td>{{ h.comments || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .delivery-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
    .full-width {
      grid-column: span 2;
    }
    .quantity-input {
      width: 100px;
      text-align: center;
      margin: 0 auto;
      display: block;
    }
    .text-center {
      text-align: center;
    }
    .total-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      background: #e9ecef;
      font-weight: 500;
      font-size: 0.9rem;
    }
    .total-badge.complete {
      background: #d4edda;
      color: #155724;
      font-weight: 600;
    }
    .reception-summary {
      margin: 20px 0;
      padding: 15px 20px;
      border-radius: 8px;
      background: #e7f3ff;
      color: #004085;
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 500;
    }
    .reception-summary.warning {
      background: #fff3cd;
      color: #856404;
    }
    .history-card {
      margin-top: 30px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .history-table {
      width: 100%;
      border-collapse: collapse;
    }
    .history-table th {
      background: #f8f9fa;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .history-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e9ecef;
      font-size: 0.9rem;
    }
    .history-table tr:hover {
      background: #f8f9fa;
    }
    .form-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .card-header {
      padding: 15px 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .card-body {
      padding: 20px;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .form-field label {
      font-weight: 500;
      color: #495057;
      font-size: 0.9rem;
    }
    .form-input {
      padding: 8px 12px;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 0.95rem;
    }
    .form-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .btn-secondary {
      background: #f8f9fa;
      color: #495057;
      border: 1px solid #ced4da;
    }
    .btn-secondary:hover {
      background: #e9ecef;
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 15px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }
    .excel-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .excel-table th {
      background: #f8f9fa;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 0.9rem;
      border: 1px solid #dee2e6;
    }
    .excel-table td {
      padding: 10px 12px;
      border: 1px solid #dee2e6;
    }
    .excel-table tbody tr:hover {
      background: #f8f9fa;
    }
    .required {
      color: #dc3545;
      margin-left: 3px;
    }
  `]
})
export class ReceptionComponent implements OnInit {
  chargeSheetId!: number;
  loading = true;
  receptionItems: ReceptionItem[] = [];
  deliveryNoteNumber: string = '';
  receptionDate: string = new Date().toISOString().split('T')[0];
  comments: string = '';
  history: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chargeSheetService: ChargeSheetService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.chargeSheetId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadReceptionData();
  }

  loadReceptionData(): void {
    this.loading = true;

    // Charger les données de réception
    this.chargeSheetService.prepareReception(this.chargeSheetId).subscribe({
      next: (data) => {
        this.receptionItems = data.items;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement réception:', err);
        alert('❌ Erreur: ' + (err.error?.message || err.message));
        this.loading = false;
      }
    });

    // Charger l'historique
    this.chargeSheetService.getReceptionHistory(this.chargeSheetId).subscribe({
      next: (data) => {
        this.history = data;
      },
      error: (err) => console.error('Erreur chargement historique:', err)
    });
  }

  validateQuantity(item: ReceptionItem): void {
    if (item.quantityReceived > item.quantityRemaining) {
      item.quantityReceived = item.quantityRemaining;
    }
    if (item.quantityReceived < 0) {
      item.quantityReceived = 0;
    }
  }

  hasPartialReception(): boolean {
    return this.receptionItems.some(item =>
      item.quantityReceived > 0 && item.quantityReceived < item.quantityRemaining
    );
  }

  getSummaryMessage(): string {
    const totalReceived = this.receptionItems.reduce((sum, item) => sum + item.quantityReceived, 0);
    if (totalReceived === 0) return '📝 Aucune quantité saisie pour cette réception';

    const allComplete = this.receptionItems.every(item =>
      (item.quantityOrdered - item.quantityRemaining) + item.quantityReceived >= item.quantityOrdered
    );

    if (allComplete) return '✅ Tous les items sont complètement reçus - Le cahier sera marqué comme RECEIVED_FROM_SUPPLIER';
    return '⚠️ Réception partielle - Certains items ne sont pas encore complètement reçus';
  }

  isValid(): boolean {
    if (!this.deliveryNoteNumber) return false;
    if (!this.receptionDate) return false;
    return this.receptionItems.some(item => item.quantityReceived > 0);
  }

  confirmReception(): void {
    if (!this.isValid()) {
      alert('❌ Veuillez remplir tous les champs obligatoires et saisir au moins une quantité');
      return;
    }

    const request: ReceptionRequest = {
      chargeSheetId: this.chargeSheetId,
      items: this.receptionItems.filter(item => item.quantityReceived > 0),
      receptionDate: this.receptionDate,
      deliveryNoteNumber: this.deliveryNoteNumber,
      comments: this.comments
    };

    this.chargeSheetService.confirmPartialReception(this.chargeSheetId, request).subscribe({
      next: (response) => {
        if (response.complete) {
          alert('✅ Tous les items ont été reçus. Le cahier passe en statut RECEIVED_FROM_SUPPLIER');
          this.router.navigate(['/charge-sheets/list']);
        } else {
          alert('📦 Réception partielle enregistrée avec succès. Vous pourrez compléter la réception plus tard.');
          this.loadReceptionData(); // Recharger pour voir les nouvelles quantités restantes
          this.deliveryNoteNumber = ''; // Réinitialiser pour la prochaine réception
          this.comments = '';
        }
      },
      error: (err) => {
        console.error('Erreur confirmation réception:', err);
        alert('❌ Erreur: ' + (err.error?.message || err.message));
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/charge-sheets/list']);
  }
}
