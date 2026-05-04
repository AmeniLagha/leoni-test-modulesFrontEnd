import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { ChargeSheetComplete, ReceptionItem, ReceptionRequest } from '../../../../models/charge-sheet.model';
import { ChargeSheetService } from '../../../../services/charge-sheet.service';

@Component({
  selector: 'app-reception',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="reception-container">
      <!-- HEADER MODERNE -->
      <div class="header-modern">
        <div class="header-bg"></div>
        <div class="header-content">
          <div class="header-left">
            <div class="header-icon">
              <i class="bi bi-truck"></i>
            </div>
            <div class="header-text">
              <h1>Réception de marchandises</h1>
              <p class="header-subtitle">
                <i class="bi bi-file-text"></i> Cahier n° <strong>{{ chargeSheetOrderNumber || '...' }}</strong>
              </p>
            </div>
          </div>
          <div class="header-actions">
            <a routerLink="/charge-sheets/list" class="btn-back">
              <i class="bi bi-arrow-left"></i> Retour
            </a>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <i class="bi bi-box-seam"></i>
            <span>{{ receptionItems?.length || 0 }} items</span>
          </div>
          <div class="stat-item">
            <i class="bi bi-calendar"></i>
            <span>{{ receptionDate | date:'dd/MM/yyyy' }}</span>
          </div>
        </div>
      </div>

      <!-- LOADING -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Préparation de la réception...</p>
      </div>

      <!-- FORMULAIRE -->
      <div *ngIf="!loading && receptionItems" class="form-card">
        <!-- Section livraison -->
        <div class="delivery-section">
          <div class="section-title">
            <i class="bi bi-truck"></i>
            <span>Informations de livraison</span>
          </div>
          <div class="delivery-grid">
            <div class="input-group">
              <label><i class="bi bi-upc-scan"></i> N° Bon de livraison <span class="required">*</span></label>
              <input type="text" class="input-modern" [(ngModel)]="deliveryNoteNumber"
                     placeholder="BL-2024-001" [class.filled]="deliveryNoteNumber">
            </div>
            <div class="input-group">
              <label><i class="bi bi-calendar"></i> Date de réception <span class="required">*</span></label>
              <input type="date" class="input-modern" [(ngModel)]="receptionDate" [class.filled]="receptionDate">
            </div>
            <div class="input-group full-width">
              <label><i class="bi bi-chat"></i> Commentaires</label>
              <textarea class="input-modern" [(ngModel)]="comments" rows="2"
                        placeholder="Observations éventuelles..." [class.filled]="comments"></textarea>
            </div>
          </div>
        </div>

        <!-- Tableau des items -->
        <div class="items-section">
          <div class="section-title">
            <i class="bi bi-list-check"></i>
            <span>Articles à réceptionner</span>
            <span class="badge-count">{{ receptionItems.length }}</span>
          </div>

          <div class="table-container">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Commandé</th>
                  <th>Déjà reçu</th>
                  <th>Reste</th>
                  <th>À recevoir</th>
                  <th>Total après</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of receptionItems; let i = index" [class.highlight]="item.quantityReceived > 0">
                  <td class="item-cell">
                    <div class="item-badge">Item {{ item.itemNumber }}</div>
                  </td>
                  <td class="number-cell">{{ item.quantityOrdered }}</td>
                  <td class="number-cell">{{ item.quantityOrdered - item.quantityRemaining }}</td>
                  <td class="number-cell highlight-warning">{{ item.quantityRemaining }}</td>
                  <td class="input-cell">
                    <input type="number"
                           class="quantity-input"
                           [(ngModel)]="item.quantityReceived"
                           [max]="item.quantityRemaining"
                           min="0"
                           (input)="validateQuantity(item)">
                  </td>
                  <td class="number-cell">
                    <span class="total-badge"
                          [class.complete]="(item.quantityOrdered - item.quantityRemaining) + item.quantityReceived >= item.quantityOrdered">
                      {{ (item.quantityOrdered - item.quantityRemaining) + item.quantityReceived }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Résumé -->
        <div class="summary-card" [class.warning]="hasPartialReception()" [class.success]="!hasPartialReception() && getTotalReceived() > 0">
          <div class="summary-icon">
            <i class="bi" [class.bi-info-circle]="!hasPartialReception() && getTotalReceived() === 0"
               [class.bi-exclamation-triangle]="hasPartialReception()"
               [class.bi-check-circle]="!hasPartialReception() && getTotalReceived() > 0"></i>
          </div>
          <div class="summary-text">{{ getSummaryMessage() }}</div>
          <div class="summary-stats" *ngIf="getTotalReceived() > 0">
            <span class="stat-received">{{ getTotalReceived() }}</span>
            <span class="stat-total">/ {{ getTotalOrdered() }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions-bar">
          <button type="button" class="btn-cancel" (click)="goBack()">
            <i class="bi bi-x-circle"></i> Annuler
          </button>
          <button type="button" class="btn-confirm" (click)="confirmReception()" [disabled]="!isValid()">
            <i class="bi bi-check-circle"></i> Confirmer la réception
          </button>
        </div>
      </div>

      <!-- Historique -->
      <div *ngIf="history.length > 0" class="history-card">
        <div class="history-header">
          <i class="bi bi-clock-history"></i>
          <h5>Historique des réceptions</h5>
          <span class="badge-history">{{ history.length }}</span>
        </div>
        <div class="history-timeline">
          <div *ngFor="let h of history; let last = last" class="timeline-item" [class.last]="last">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-date">
                <i class="bi bi-calendar"></i> {{ h.receptionDate | date:'dd/MM/yyyy' }}
              </div>
              <div class="timeline-details">
                <div class="detail-item">
                  <i class="bi bi-box-seam"></i> Item <strong>{{ h.item.itemNumber }}</strong>
                </div>
                <div class="detail-item">
                  <i class="bi bi-cart"></i> Quantité: <strong>{{ h.quantityReceived }}</strong>
                </div>
                <div class="detail-item" *ngIf="h.deliveryNoteNumber">
                  <i class="bi bi-upc-scan"></i> BL: {{ h.deliveryNoteNumber }}
                </div>
                <div class="detail-item">
                  <i class="bi bi-person"></i> Par: {{ h.receivedBy | slice:0:15 }}...
                </div>
                <div class="detail-item comment" *ngIf="h.comments">
                  <i class="bi bi-chat"></i> {{ h.comments }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reception-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #e9edf2 100%);
      padding: 2rem;
    }

    /* HEADER MODERNE */
    .header-modern {
      position: relative;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      border-radius: 24px;
      margin-bottom: 2rem;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }

    .header-bg {
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      border-radius: 50%;
    }

    .header-content {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .header-icon {
      width: 60px;
      height: 60px;
      background: rgba(255,255,255,0.15);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon i {
      font-size: 2rem;
      color: white;
    }

    .header-text h1 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 700;
      color: white;
    }

    .header-subtitle {
      margin: 0.25rem 0 0;
      color: rgba(255,255,255,0.8);
      font-size: 0.9rem;
    }

    .btn-back {
      background: rgba(255,255,255,0.15);
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: 12px;
      color: white;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-back:hover {
      background: rgba(255,255,255,0.25);
      transform: translateY(-2px);
    }

    .header-stats {
      display: flex;
      gap: 2rem;
      padding: 1rem 2rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      background: rgba(0,0,0,0.1);
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255,255,255,0.9);
      font-size: 0.9rem;
    }

    .stat-item i {
      font-size: 1.2rem;
    }

    /* LOADING */
    .loading-state {
      text-align: center;
      padding: 4rem;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid #e0e0e0;
      border-top-color: #2a5298;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* FORM CARD */
    .form-card {
      background: white;
      border-radius: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      overflow: hidden;
      margin-bottom: 2rem;
    }

    .delivery-section, .items-section {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #eef2f6;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      font-size: 1.2rem;
      font-weight: 600;
      color: #1e3c72;
    }

    .section-title i {
      font-size: 1.3rem;
    }

    .badge-count {
      background: #eef2f6;
      padding: 0.2rem 0.6rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      color: #2a5298;
    }

    .delivery-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .full-width {
      grid-column: span 2;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .input-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #5a6e8a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .input-group label i {
      margin-right: 0.3rem;
    }

    .input-modern {
      padding: 0.8rem 1rem;
      border: 2px solid #eef2f6;
      border-radius: 12px;
      font-size: 0.95rem;
      transition: all 0.3s;
      background: white;
    }

    .input-modern:focus {
      outline: none;
      border-color: #2a5298;
      box-shadow: 0 0 0 3px rgba(42, 82, 152, 0.1);
    }

    .input-modern.filled {
      border-color: #2a5298;
    }

    .required {
      color: #dc3545;
      margin-left: 0.2rem;
    }

    /* TABLEAU MODERNE */
    .table-container {
      overflow-x: auto;
      border-radius: 16px;
      border: 1px solid #eef2f6;
    }

    .modern-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    .modern-table th {
      background: #f8fafc;
      padding: 1rem;
      text-align: center;
      font-weight: 600;
      color: #1e3c72;
      border-bottom: 2px solid #eef2f6;
    }

    .modern-table td {
      padding: 1rem;
      text-align: center;
      border-bottom: 1px solid #eef2f6;
    }

    .modern-table tr:hover {
      background: #f8fafc;
    }

    .modern-table tr.highlight {
      background: #e8f0fe;
    }

    .item-cell {
      text-align: left !important;
    }

    .item-badge {
      display: inline-block;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .number-cell {
      font-weight: 500;
    }

    .highlight-warning {
      color: #e67e22;
      font-weight: 700;
    }

    .input-cell {
      padding: 0.5rem;
    }

    .quantity-input {
      width: 90px;
      padding: 0.6rem;
      text-align: center;
      border: 2px solid #eef2f6;
      border-radius: 10px;
      font-size: 0.9rem;
      transition: all 0.3s;
    }

    .quantity-input:focus {
      outline: none;
      border-color: #2a5298;
    }

    .total-badge {
      display: inline-block;
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      background: #eef2f6;
      font-weight: 600;
    }

    .total-badge.complete {
      background: #d4edda;
      color: #155724;
    }

    /* SUMMARY CARD */
    .summary-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 1.5rem 2rem;
      padding: 1rem 1.5rem;
      border-radius: 16px;
      background: #e7f3ff;
      color: #004085;
    }

    .summary-card.warning {
      background: #fff3cd;
      color: #856404;
    }

    .summary-card.success {
      background: #d4edda;
      color: #155724;
    }

    .summary-icon i {
      font-size: 1.8rem;
    }

    .summary-text {
      flex: 1;
      font-weight: 500;
    }

    .summary-stats {
      display: flex;
      align-items: baseline;
      gap: 0.2rem;
    }

    .stat-received {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .stat-total {
      color: #6c757d;
    }

    /* ACTIONS BAR */
    .actions-bar {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem 2rem;
      background: #f8fafc;
      border-top: 1px solid #eef2f6;
    }

    .btn-cancel, .btn-confirm {
      padding: 0.8rem 1.8rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s;
    }

    .btn-cancel {
      background: #f1f3f5;
      color: #6c757d;
    }

    .btn-cancel:hover {
      background: #e9ecef;
    }

    .btn-confirm {
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
    }

    .btn-confirm:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(40, 167, 69, 0.3);
    }

    .btn-confirm:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* HISTORIQUE */
    .history-card {
      background: white;
      border-radius: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .history-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem 2rem;
      background: #f8fafc;
      border-bottom: 1px solid #eef2f6;
    }

    .history-header i {
      font-size: 1.3rem;
      color: #2a5298;
    }

    .history-header h5 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1e3c72;
    }

    .badge-history {
      background: #eef2f6;
      padding: 0.2rem 0.6rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .history-timeline {
      padding: 1.5rem 2rem;
    }

    .timeline-item {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      position: relative;
    }

    .timeline-item:not(.last) .timeline-dot::after {
      content: '';
      position: absolute;
      top: 12px;
      left: 5px;
      width: 2px;
      height: calc(100% + 1rem);
      background: #eef2f6;
    }

    .timeline-dot {
      position: relative;
      width: 12px;
      height: 12px;
      background: #2a5298;
      border-radius: 50%;
      margin-top: 4px;
      flex-shrink: 0;
    }

    .timeline-content {
      flex: 1;
      padding-bottom: 1rem;
    }

    .timeline-date {
      font-size: 0.8rem;
      color: #6c757d;
      margin-bottom: 0.5rem;
    }

    .timeline-details {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .detail-item {
      background: #f8fafc;
      padding: 0.3rem 0.8rem;
      border-radius: 8px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .detail-item.comment {
      width: 100%;
      background: #fef3c7;
      color: #856404;
    }

    @media (max-width: 768px) {
      .reception-container {
        padding: 1rem;
      }
      .delivery-grid {
        grid-template-columns: 1fr;
      }
      .full-width {
        grid-column: span 1;
      }
      .timeline-details {
        flex-direction: column;
        gap: 0.5rem;
      }
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
  chargeSheetOrderNumber: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chargeSheetService: ChargeSheetService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.chargeSheetId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadChargeSheetInfo();
    this.loadReceptionData();
  }

  loadChargeSheetInfo(): void {
    this.chargeSheetService.getById(this.chargeSheetId).subscribe({
      next: (data: ChargeSheetComplete) => {
        this.chargeSheetOrderNumber = data.orderNumber;
      },
      error: (err) => {
        console.error('Erreur chargement infos cahier:', err);
      }
    });
  }

  loadReceptionData(): void {
    this.loading = true;

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

  getTotalReceived(): number {
    return this.receptionItems?.reduce((sum, item) => sum + item.quantityReceived, 0) || 0;
  }

  getTotalOrdered(): number {
    return this.receptionItems?.reduce((sum, item) => sum + item.quantityOrdered, 0) || 0;
  }

  hasPartialReception(): boolean {
    return this.receptionItems?.some(item =>
      item.quantityReceived > 0 && item.quantityReceived < item.quantityRemaining
    ) || false;
  }

  getSummaryMessage(): string {
    const totalReceived = this.getTotalReceived();
    if (totalReceived === 0) return 'Aucune quantité saisie pour cette réception';

    const allComplete = this.receptionItems?.every(item =>
      (item.quantityOrdered - item.quantityRemaining) + item.quantityReceived >= item.quantityOrdered
    );

    if (allComplete) return 'Tous les items sont complètement reçus';
    return 'Réception partielle - Certains items ne sont pas encore complètement reçus';
  }

  isValid(): boolean {
    if (!this.deliveryNoteNumber) return false;
    if (!this.receptionDate) return false;
    return this.receptionItems?.some(item => item.quantityReceived > 0) || false;
  }

  confirmReception(): void {
    if (!this.isValid()) {
      alert('Veuillez remplir tous les champs obligatoires');
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
          alert('✅ Tous les items ont été reçus');
          this.router.navigate(['/charge-sheets/list']);
        } else {
          alert('📦 Réception partielle enregistrée');
          this.loadReceptionData();
          this.deliveryNoteNumber = '';
          this.comments = '';
        }
      },
      error: (err) => {
        console.error('Erreur:', err);
        alert('❌ Erreur: ' + (err.error?.message || err.message));
      }
    });
  }

  goBack(): void {
    window.history.back();
  }
}
