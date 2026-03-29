import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../../../../services/UserService';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container-fluid vh-100 d-flex align-items-center justify-content-center p-0 m-0" style="background: linear-gradient(135deg, #1e3c72 0%, #0f2b4a 100%);">
      <div class="container py-5">
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-5">
            <div class="card border-0 shadow-lg animate__animated animate__fadeInUp">
              <div class="card-body p-5">

                <div class="text-center mb-4">
                  <img src="assets/leonilogo.png" alt="Leoni Logo" class="img-fluid" style="max-height: 80px;">
                  <h3 class="mt-3 fw-bold text-primary">Réinitialisation</h3>
                  <p class="text-muted small">Créez un nouveau mot de passe</p>
                </div>

                <div *ngIf="!isTokenValid && !isLoading" class="alert alert-danger text-center">
                  <i class="bi bi-exclamation-triangle-fill me-2"></i>
                  Ce lien de réinitialisation est invalide ou a expiré.
                  <div class="mt-3">
                    <a routerLink="/login" class="btn btn-outline-primary btn-sm">
                      <i class="bi bi-arrow-left me-2"></i>Retour à la connexion
                    </a>
                  </div>
                </div>

                <div *ngIf="isLoading" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                  </div>
                  <p class="mt-3 text-muted">Vérification du lien...</p>
                </div>

                <form *ngIf="isTokenValid && !isLoading" [formGroup]="resetForm" (ngSubmit)="onSubmit()">
                  <div class="mb-4">
                    <label class="form-label fw-semibold">
                      <i class="bi bi-lock-fill me-2 text-primary"></i>
                      Nouveau mot de passe
                    </label>
                    <div class="input-group">
                      <span class="input-group-text bg-white border-end-0">
                        <i class="bi bi-lock text-muted"></i>
                      </span>
                      <input [type]="showPassword ? 'text' : 'password'"
                             class="form-control border-start-0 ps-0"
                             [class.is-invalid]="resetForm.get('password')?.invalid && resetForm.get('password')?.touched"
                             formControlName="password"
                             placeholder="••••••••">
                      <button type="button" class="btn btn-outline-secondary border-start-0"
                              (click)="togglePassword()" style="background: white;">
                        <i class="bi" [class.bi-eye]="!showPassword" [class.bi-eye-slash]="showPassword"></i>
                      </button>
                    </div>
                    <div class="invalid-feedback d-block" *ngIf="resetForm.get('password')?.touched">
                      <span *ngIf="resetForm.get('password')?.errors?.['required']">
                        <i class="bi bi-exclamation-circle me-1"></i>Le mot de passe est requis
                      </span>
                      <span *ngIf="resetForm.get('password')?.errors?.['minlength']">
                        <i class="bi bi-exclamation-circle me-1"></i>Minimum 6 caractères
                      </span>
                    </div>
                  </div>

                  <div class="mb-4">
                    <label class="form-label fw-semibold">
                      <i class="bi bi-lock-fill me-2 text-primary"></i>
                      Confirmer le mot de passe
                    </label>
                    <div class="input-group">
                      <span class="input-group-text bg-white border-end-0">
                        <i class="bi bi-lock text-muted"></i>
                      </span>
                      <input [type]="showConfirmPassword ? 'text' : 'password'"
                             class="form-control border-start-0 ps-0"
                             [class.is-invalid]="resetForm.get('confirmPassword')?.invalid && resetForm.get('confirmPassword')?.touched"
                             formControlName="confirmPassword"
                             placeholder="••••••••">
                      <button type="button" class="btn btn-outline-secondary border-start-0"
                              (click)="toggleConfirmPassword()" style="background: white;">
                        <i class="bi" [class.bi-eye]="!showConfirmPassword" [class.bi-eye-slash]="showConfirmPassword"></i>
                      </button>
                    </div>
                    <div class="invalid-feedback d-block" *ngIf="resetForm.get('confirmPassword')?.touched && resetForm.errors?.['mismatch']">
                      <i class="bi bi-exclamation-circle me-1"></i>Les mots de passe ne correspondent pas
                    </div>
                  </div>

                  <div *ngIf="errorMessage" class="alert alert-danger mb-3">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    {{ errorMessage }}
                  </div>

                  <div *ngIf="successMessage" class="alert alert-success mb-3">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    {{ successMessage }}
                  </div>

                  <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold"
                          [disabled]="resetForm.invalid || isSubmitting"
                          style="background: linear-gradient(135deg, #1e3c72 0%, #0f2b4a 100%); border: none;">
                    <span *ngIf="!isSubmitting">
                      <i class="bi bi-check-circle me-2"></i>Réinitialiser le mot de passe
                    </span>
                    <span *ngIf="isSubmitting">
                      <span class="spinner-border spinner-border-sm me-2"></span>En cours...
                    </span>
                  </button>

                  <div class="text-center mt-4">
                    <a routerLink="/login" class="text-decoration-none small">
                      <i class="bi bi-arrow-left me-1"></i>Retour à la connexion
                    </a>
                  </div>
                </form>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate__fadeInUp {
      animation: fadeInUp 0.6s ease-out;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  token: string = '';
  isTokenValid: boolean = false;
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'];
    if (this.token) {
      this.validateToken();
    } else {
      this.isLoading = false;
      this.isTokenValid = false;
    }
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  validateToken(): void {
    this.userService.validateResetToken(this.token).subscribe({
      next: (response) => {
        this.isTokenValid = response.valid;
        this.isLoading = false;
        if (!this.isTokenValid) {
          this.errorMessage = 'Ce lien de réinitialisation est invalide ou a expiré.';
        }
      },
      error: () => {
        this.isTokenValid = false;
        this.isLoading = false;
        this.errorMessage = 'Impossible de vérifier le lien. Veuillez réessayer.';
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.resetForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = {
      resetToken: this.token,
      newPassword: this.resetForm.get('password')?.value
    };

    this.userService.resetPassword(request).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.isSubmitting = false;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Une erreur est survenue.';
        this.isSubmitting = false;
      }
    });
  }
}
