import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../services/UserService';

@Component({
  selector: 'app-verification-code',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="verification-container">
      <div class="text-center mb-3">
        <i class="bi bi-envelope-check display-4 text-primary"></i>
        <h5 class="mt-2">Vérification par email</h5>
        <p class="text-muted small">
          Un code de vérification a été envoyé à <strong>{{ email }}</strong>
        </p>
      </div>

      <div class="mb-4">
        <label class="form-label fw-semibold">Code de vérification</label>
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0">
            <i class="bi bi-key text-muted"></i>
          </span>
          <input type="text"
                 class="form-control border-start-0 ps-0 text-center"
                 [(ngModel)]="verificationCode"
                 placeholder="000000"
                 maxlength="6"
                 (keyup.enter)="verify()"
                 style="letter-spacing: 2px; font-size: 1.2rem;">
        </div>
        <div class="form-text text-muted small mt-1">
          Veuillez saisir le code à 6 chiffres reçu par email
        </div>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger small">
        <i class="bi bi-exclamation-triangle me-2"></i>
        {{ errorMessage }}
      </div>

      <div *ngIf="successMessage" class="alert alert-success small">
        <i class="bi bi-check-circle me-2"></i>
        {{ successMessage }}
      </div>

      <div class="d-flex gap-2">
        <button type="button" class="btn btn-outline-secondary w-50"
                (click)="resendCode()" [disabled]="isResending">
          <span *ngIf="!isResending">
            <i class="bi bi-arrow-repeat me-1"></i>Renvoyer
          </span>
          <span *ngIf="isResending">
            <span class="spinner-border spinner-border-sm me-1"></span>Envoi...
          </span>
        </button>
        <button type="button" class="btn btn-primary w-50"
                (click)="verify()" [disabled]="!verificationCode || isVerifying">
          <span *ngIf="!isVerifying">
            <i class="bi bi-check-circle me-1"></i>Vérifier
          </span>
          <span *ngIf="isVerifying">
            <span class="spinner-border spinner-border-sm me-1"></span>Vérification...
          </span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .verification-container {
      padding: 1rem;
    }
    input {
      font-size: 1.2rem;
      letter-spacing: 2px;
    }
  `]
})
export class VerificationCodeComponent {
  @Input() email: string = '';  // ✅ Bien défini
  @Output() verified = new EventEmitter<boolean>();  // ✅ Bien défini

  verificationCode: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isVerifying: boolean = false;
  isResending: boolean = false;

  constructor(private userService: UserService) {}

  verify(): void {
    if (!this.verificationCode || this.verificationCode.length !== 6) {
      this.errorMessage = 'Veuillez saisir un code à 6 chiffres';
      return;
    }

    this.isVerifying = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.verifyCode(this.email, this.verificationCode).subscribe({
      next: (response) => {
        if (response.valid) {
          this.successMessage = '✅ Code validé avec succès !';
          setTimeout(() => {
            this.verified.emit(true);
          }, 1500);
        } else {
          this.errorMessage = 'Code invalide ou expiré. Veuillez réessayer.';
        }
        this.isVerifying = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la vérification. Veuillez réessayer.';
        this.isVerifying = false;
      }
    });
  }

  resendCode(): void {
    this.isResending = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.sendVerificationCode(this.email).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.isResending = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de l\'envoi.';
        this.isResending = false;
      }
    });
  }
}
