import { Component, inject, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/UserService';
import { VerificationCodeComponent } from '../verification-code/verification-code.component';

declare var bootstrap: any; // Déclarer Bootstrap global

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    FormsModule,
    VerificationCodeComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  loginForm: FormGroup;
  errorMessage = '';
  isLoading = false;
  showPassword = false;
  rememberMe = false;

  // Propriétés pour le modal
  resetEmail: string = '';
  resetMessage: string = '';
  resetSuccess: boolean = false;
  isSending: boolean = false;
  emailExists: boolean | null = null;

  // Propriétés pour le modal de vérification
  pendingEmail: string = '';
  private verificationModal: any = null;
  private forgotPasswordModal: any = null;

  constructor() {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const remember = localStorage.getItem('rememberMe') === 'true';

    this.loginForm = this.fb.group({
      email: [savedEmail || '', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.rememberMe = remember;
  }

  ngAfterViewInit(): void {
    // Initialiser les modals après le chargement de la vue
    const forgotModalElement = document.getElementById('forgotPasswordModal');
    const verificationModalElement = document.getElementById('verificationModal');

    if (forgotModalElement) {
      this.forgotPasswordModal = new bootstrap.Modal(forgotModalElement);
    }
    if (verificationModalElement) {
      this.verificationModal = new bootstrap.Modal(verificationModalElement);
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // Vérifier si l'email existe
  checkEmailExists(): void {
    if (!this.resetEmail || !this.isValidEmail(this.resetEmail)) {
      this.resetMessage = 'Veuillez saisir un email valide';
      this.resetSuccess = false;
      return;
    }

    this.isSending = true;
    this.resetMessage = '';
    this.resetSuccess = false;
    this.emailExists = null;

    this.userService.checkEmailExists(this.resetEmail).subscribe({
      next: (response) => {
        if (response.exists) {
          this.emailExists = true;
          this.resetMessage = `✅ Email trouvé ! Envoi du code de vérification...`;
          this.resetSuccess = true;
          // Envoyer le code de vérification
          this.sendVerificationCode();
        } else {
          this.emailExists = false;
          this.resetMessage = `❌ L'email "${this.resetEmail}" n'existe pas dans notre système.`;
          this.resetSuccess = false;
          this.isSending = false;
        }
      },
      error: (err) => {
        console.error('Erreur vérification email:', err);
        this.resetMessage = 'Impossible de vérifier l\'email. Veuillez réessayer.';
        this.resetSuccess = false;
        this.isSending = false;
      }
    });
  }

  // Envoyer le code de vérification
  sendVerificationCode(): void {
    this.userService.sendVerificationCode(this.resetEmail).subscribe({
      next: (response) => {
        this.resetMessage = response.message;
        this.resetSuccess = true;
        this.isSending = false;

        // Fermer le modal de réinitialisation
        if (this.forgotPasswordModal) {
          this.forgotPasswordModal.hide();
        }

        // Ouvrir le modal de vérification
        this.pendingEmail = this.resetEmail;
        if (this.verificationModal) {
          this.verificationModal.show();
        }
      },
      error: (err) => {
        this.resetMessage = err.error?.message || 'Erreur lors de l\'envoi du code.';
        this.resetSuccess = false;
        this.isSending = false;
      }
    });
  }

  // Envoyer le lien de réinitialisation APRÈS vérification du code
  sendResetLink(): void {
    this.userService.sendResetLink(this.pendingEmail).subscribe({
      next: (response) => {
        alert('✅ ' + response.message);
        if (this.verificationModal) {
          this.verificationModal.hide();
        }
        this.pendingEmail = '';
      },
      error: (err) => {
        alert('❌ ' + (err.error?.message || 'Erreur lors de l\'envoi du lien'));
      }
    });
  }

  // Valider l'email
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Callback après vérification du code
  onVerificationSuccess(verified: boolean): void {
    if (verified) {
      // ✅ Code validé, maintenant envoyer le lien de réinitialisation
      this.sendResetLink();
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      if (this.rememberMe) {
        localStorage.setItem('rememberedEmail', this.loginForm.value.email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.setItem('rememberMe', 'false');
      }

      this.authService.login(this.loginForm.value).subscribe({
        next: (res) => {
          this.authService.saveTokens(res);
          localStorage.setItem('userEmail', this.loginForm.value.email);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage =
            err.status === 401
              ? 'Email ou mot de passe incorrect'
              : err.status === 0
              ? 'Impossible de se connecter au serveur. Vérifiez votre connexion.'
              : 'Une erreur est survenue. Veuillez réessayer.';
        },
        complete: () => (this.isLoading = false)
      });
    } else {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}
