// reset-password.component.ts
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
    <div class="leoni-reset-container">
      <!-- Background avec effet de grille industrielle -->
      <div class="reset-bg">
        <div class="bg-overlay"></div>
        <div class="industrial-grid"></div>
        <div class="floating-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="reset-content">
        <div class="reset-card animate__animated animate__fadeInUp">

          <!-- Logo LEONI -->
          <div class="reset-header">
            <div class="leoni-logo-3d">
              <div class="logo-ring">
                <svg viewBox="0 0 120 120" class="logo-svg">
                  <defs>
                    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#00D4FF"/>
                      <stop offset="100%" style="stop-color:#0052CC"/>
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <circle cx="60" cy="60" r="55" stroke="url(#logoGrad)" stroke-width="2" fill="none" stroke-dasharray="200" stroke-dashoffset="50"/>
                  <path d="M35 60 L50 45 L65 55 L85 35 L90 40 L65 65 L50 55 L40 65 Z" fill="url(#logoGrad)" filter="url(#glow)"/>
                  <circle cx="60" cy="60" r="8" fill="white"/>
                  <path d="M60 52 L60 68 M52 60 L68 60" stroke="white" stroke-width="1.5"/>
                </svg>
              </div>
              <div class="brand-text">
                <span class="brand-name">LEONI</span>
                <span class="brand-sub">Industrial Intelligence</span>
              </div>
            </div>
            <h2>Réinitialisation</h2>
            <p>Créez un nouveau mot de passe</p>
          </div>

          <!-- Lien invalide -->
          <div *ngIf="!isTokenValid && !isLoading" class="alert-card error">
            <div class="alert-icon">
              <i class="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div class="alert-content">
              <h4>Lien invalide</h4>
              <p>Ce lien de réinitialisation est invalide ou a expiré.</p>
              <button class="btn-outline" routerLink="/login">
                <i class="bi bi-arrow-left"></i> Retour à la connexion
              </button>
            </div>
          </div>

          <!-- Chargement -->
          <div *ngIf="isLoading" class="loading-state">
            <div class="spinner-large"></div>
            <p>Vérification du lien...</p>
          </div>

          <!-- Formulaire -->
          <form *ngIf="isTokenValid && !isLoading" [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="reset-form">

            <!-- Nouveau mot de passe -->
            <div class="input-group-leoni">
              <div class="input-icon">
                <i class="bi bi-lock-fill"></i>
              </div>
              <div class="input-field">
                <input [type]="showPassword ? 'text' : 'password'"
                       formControlName="password"
                       placeholder="Nouveau mot de passe"
                       [class.error]="resetForm.get('password')?.invalid && resetForm.get('password')?.touched">
                <label>Nouveau mot de passe</label>
                <button type="button" class="password-toggle" (click)="togglePassword()">
                  <i class="bi" [class.bi-eye]="!showPassword" [class.bi-eye-slash]="showPassword"></i>
                </button>
              </div>
            </div>
            <div class="error-message" *ngIf="resetForm.get('password')?.touched && resetForm.get('password')?.invalid">
              <span *ngIf="resetForm.get('password')?.errors?.['required']">
                <i class="bi bi-exclamation-circle"></i> Le mot de passe est requis
              </span>
              <span *ngIf="resetForm.get('password')?.errors?.['minlength']">
                <i class="bi bi-exclamation-circle"></i> Minimum 6 caractères
              </span>
            </div>

            <!-- Confirmer le mot de passe -->
            <div class="input-group-leoni">
              <div class="input-icon">
                <i class="bi bi-lock-fill"></i>
              </div>
              <div class="input-field">
                <input [type]="showConfirmPassword ? 'text' : 'password'"
                       formControlName="confirmPassword"
                       placeholder="Confirmer le mot de passe"
                       [class.error]="resetForm.get('confirmPassword')?.invalid && resetForm.get('confirmPassword')?.touched">
                <label>Confirmer le mot de passe</label>
                <button type="button" class="password-toggle" (click)="toggleConfirmPassword()">
                  <i class="bi" [class.bi-eye]="!showConfirmPassword" [class.bi-eye-slash]="showConfirmPassword"></i>
                </button>
              </div>
            </div>
            <div class="error-message" *ngIf="resetForm.get('confirmPassword')?.touched && resetForm.errors?.['mismatch']">
              <i class="bi bi-exclamation-circle"></i> Les mots de passe ne correspondent pas
            </div>

            <!-- Messages d'erreur/succès -->
            <div class="alert-message error" *ngIf="errorMessage">
              <i class="bi bi-exclamation-triangle-fill"></i>
              {{ errorMessage }}
            </div>

            <div class="alert-message success" *ngIf="successMessage">
              <i class="bi bi-check-circle-fill"></i>
              {{ successMessage }}
            </div>

            <!-- Bouton de réinitialisation -->
            <button type="submit" class="btn-reset" [disabled]="resetForm.invalid || isSubmitting">
              <span *ngIf="!isSubmitting">
                <i class="bi bi-check-circle"></i> Réinitialiser le mot de passe
              </span>
              <span *ngIf="isSubmitting">
                <span class="spinner"></span> En cours...
              </span>
            </button>

            <!-- Lien retour -->
            <div class="back-link">
              <a routerLink="/login">
                <i class="bi bi-arrow-left"></i> Retour à la connexion
              </a>
            </div>

          </form>

          <!-- Footer -->
          <div class="reset-footer">
            <div class="security-badges">
              <span><i class="bi bi-shield-check"></i> Connexion sécurisée</span>
              <span><i class="bi bi-building"></i> Leoni Tunisia</span>
            </div>
            <p class="copyright">© 2026 Leoni Tunisia - Tous droits réservés</p>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ==================== RESET PASSWORD PAGE ==================== */
    .leoni-reset-container {
      position: relative;
      width: 100%;
      height: 100vh;
      overflow: hidden;
      font-family: 'Inter', 'Segoe UI', sans-serif;
    }

    /* Background */
    .reset-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #0A0E1A 0%, #0F1525 50%, #0A0E1A 100%);
    }

    .bg-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.1), transparent);
    }

    .industrial-grid {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image:
        linear-gradient(rgba(0, 212, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 212, 255, 0.05) 1px, transparent 1px);
      background-size: 50px 50px;
    }

    /* Floating shapes */
    .floating-shapes {
      position: absolute;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .shape {
      position: absolute;
      background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 82, 204, 0.05));
      border-radius: 50%;
      filter: blur(60px);
    }

    .shape-1 {
      width: 300px;
      height: 300px;
      top: -100px;
      right: -100px;
      animation: float 20s ease-in-out infinite;
    }

    .shape-2 {
      width: 200px;
      height: 200px;
      bottom: 50px;
      left: -80px;
      animation: float 15s ease-in-out infinite reverse;
    }

    .shape-3 {
      width: 150px;
      height: 150px;
      bottom: 30%;
      right: 20%;
      animation: float 18s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(20px, -30px) rotate(120deg); }
      66% { transform: translate(-20px, 20px) rotate(240deg); }
    }

    /* Reset Content */
    .reset-content {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
    }

    /* Reset Card */
    .reset-card {
      background: rgba(15, 21, 37, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 32px;
      padding: 2.5rem;
      width: 100%;
      max-width: 480px;
      border: 1px solid rgba(0, 212, 255, 0.2);
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
    }

    .reset-card:hover {
      border-color: rgba(0, 212, 255, 0.4);
      box-shadow: 0 30px 60px rgba(0, 212, 255, 0.1);
    }

    /* Logo */
    .reset-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .leoni-logo-3d {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 1rem;
    }

    .logo-ring {
      width: 80px;
      height: 80px;
      margin-bottom: 1rem;
    }

    .logo-svg {
      width: 100%;
      height: 100%;
      animation: rotateLogo 20s linear infinite;
    }

    @keyframes rotateLogo {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .brand-text {
      text-align: center;
    }

    .brand-name {
      font-size: 1.8rem;
      font-weight: 800;
      background: linear-gradient(135deg, #FFFFFF, #00D4FF);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      letter-spacing: 2px;
    }

    .brand-sub {
      font-size: 0.7rem;
      color: #00D4FF;
      letter-spacing: 3px;
    }

    .reset-header h2 {
      color: white;
      font-size: 1.5rem;
      margin: 0.5rem 0 0.25rem;
      font-weight: 600;
    }

    .reset-header p {
      color: #A0A0B0;
      font-size: 0.8rem;
      margin: 0;
    }

    /* Form */
    .reset-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Input Group */
    .input-group-leoni {
      position: relative;
      display: flex;
      background: rgba(10, 14, 26, 0.8);
      border-radius: 16px;
      border: 1px solid rgba(0, 212, 255, 0.2);
      transition: all 0.3s;
    }

    .input-group-leoni:focus-within {
      border-color: #00D4FF;
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.1);
    }

    .input-icon {
      display: flex;
      align-items: center;
      padding: 0 1rem;
      color: #00D4FF;
      font-size: 1.2rem;
    }

    .input-field {
      flex: 1;
      position: relative;
    }

    .input-field input {
      width: 100%;
      padding: 1rem 2.5rem 1rem 0;
      background: transparent;
      border: none;
      color: white;
      font-size: 0.95rem;
      outline: none;
    }

    .input-field label {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
      font-size: 0.95rem;
      pointer-events: none;
      transition: all 0.3s;
    }

    .input-field input:focus ~ label,
    .input-field input:not(:placeholder-shown) ~ label {
      top: 0;
      transform: translateY(-50%) scale(0.85);
      color: #00D4FF;
    }

    .input-field input.error ~ label {
      color: #FF4444;
    }

    .password-toggle {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 0.25rem;
    }

    .password-toggle:hover {
      color: #00D4FF;
    }

    /* Error Message */
    .error-message {
      font-size: 0.7rem;
      color: #FF4444;
      margin-top: -0.5rem;
      padding-left: 3rem;
    }

    .error-message i {
      margin-right: 0.25rem;
    }

    /* Alert Card */
    .alert-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem;
      background: rgba(255, 68, 68, 0.1);
      border-radius: 20px;
      border: 1px solid rgba(255, 68, 68, 0.2);
    }

    .alert-card.error {
      background: rgba(255, 68, 68, 0.1);
      border-color: rgba(255, 68, 68, 0.2);
    }

    .alert-icon {
      width: 40px;
      height: 40px;
      background: rgba(255, 68, 68, 0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .alert-icon i {
      font-size: 1.2rem;
      color: #FF4444;
    }

    .alert-content h4 {
      color: white;
      margin: 0 0 0.25rem;
      font-size: 1rem;
    }

    .alert-content p {
      color: #A0A0B0;
      margin: 0 0 1rem;
      font-size: 0.85rem;
    }

    .btn-outline {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.5rem 1rem;
      border-radius: 10px;
      color: #00D4FF;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.3s;
    }

    .btn-outline:hover {
      background: rgba(0, 212, 255, 0.1);
    }

    /* Alert Message */
    .alert-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      font-size: 0.85rem;
    }

    .alert-message.error {
      background: rgba(255, 68, 68, 0.1);
      color: #FF4444;
      border: 1px solid rgba(255, 68, 68, 0.2);
    }

    .alert-message.success {
      background: rgba(0, 255, 136, 0.1);
      color: #00FF88;
      border: 1px solid rgba(0, 255, 136, 0.2);
    }

    /* Reset Button */
    .btn-reset {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #00D4FF, #0052CC);
      border: none;
      border-radius: 16px;
      color: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 0.5rem;
    }

    .btn-reset:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
    }

    .btn-reset:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 2rem;
    }

    .spinner-large {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(0, 212, 255, 0.1);
      border-top-color: #00D4FF;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 0.5rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Back Link */
    .back-link {
      text-align: center;
      margin-top: 1rem;
    }

    .back-link a {
      color: #A0A0B0;
      text-decoration: none;
      font-size: 0.85rem;
      transition: color 0.3s;
    }

    .back-link a:hover {
      color: #00D4FF;
    }

    .back-link i {
      margin-right: 0.25rem;
    }

    /* Footer */
    .reset-footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .security-badges {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-bottom: 0.75rem;
    }

    .security-badges span {
      font-size: 0.7rem;
      color: #666;
    }

    .security-badges i {
      margin-right: 0.25rem;
      color: #00FF88;
    }

    .copyright {
      font-size: 0.7rem;
      color: #666;
      margin: 0;
    }

    /* Animation */
    .animate__fadeInUp {
      animation: fadeInUp 0.6s ease-out;
    }

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
