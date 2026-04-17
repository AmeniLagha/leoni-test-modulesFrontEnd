import { Component, inject, AfterViewInit, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/UserService';
import { VerificationCodeComponent } from '../verification-code/verification-code.component';
import { SiteService } from '../../../../services/Site';
import { Site } from '../../../../models/site.model';

declare var bootstrap: any;

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
export class LoginComponent implements AfterViewInit, OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private siteService = inject(SiteService);

  loginForm: FormGroup;
  errorMessage = '';
  isLoading = false;
  showPassword = false;
  rememberMe = false;
  sites: Site[] = [];
  loadingSites = false;
  resetEmail: string = '';
  resetMessage: string = '';
  resetSuccess: boolean = false;
  isSending: boolean = false;
  emailExists: boolean | null = null;
  pendingEmail: string = '';
  private verificationModal: any = null;
  private forgotPasswordModal: any = null;


  constructor() {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const remember = localStorage.getItem('rememberMe') === 'true';
    const savedSite = localStorage.getItem('rememberedSite');

    this.loginForm = this.fb.group({
      email: [savedEmail || '', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      siteName: ['']  // ✅ Plus de Validators.required ici
    });

    this.rememberMe = remember;
  }

  ngOnInit(): void {
    this.loadSites();
  }

  // ✅ Nouvelle méthode pour vérifier si l'email correspond à un Admin

  loadSites(): void {
    this.loadingSites = true;
    this.siteService.getAll().subscribe({
      next: (sites) => {
        this.sites = sites;
        this.loadingSites = false;
      },
      error: (err) => {
        console.error('Erreur chargement sites:', err);
        this.loadingSites = false;
      }
    });
  }

  ngAfterViewInit(): void {
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

  sendVerificationCode(): void {
    this.userService.sendVerificationCode(this.resetEmail).subscribe({
      next: (response) => {
        this.resetMessage = response.message;
        this.resetSuccess = true;
        this.isSending = false;

        if (this.forgotPasswordModal) {
          this.forgotPasswordModal.hide();
        }

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

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onVerificationSuccess(verified: boolean): void {
    if (verified) {
      this.sendResetLink();
    }
  }

  onSubmit(): void {
  // Vérification seulement pour email et password
  if (this.loginForm.get('email')?.valid && this.loginForm.get('password')?.valid) {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.rememberMe) {
      localStorage.setItem('rememberedEmail', this.loginForm.value.email);
      localStorage.setItem('rememberedSite', this.loginForm.value.siteName || '');
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberedSite');
      localStorage.setItem('rememberMe', 'false');
    }

    // Envoyer siteName (peut être null/undefined)
    const loginData = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
      siteName: this.loginForm.value.siteName || null  // null pour Admin
    };

    this.authService.login(loginData).subscribe({
      next: (res) => {
        this.authService.saveTokens(res);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Email ou mot de passe incorrect';
      },
      complete: () => (this.isLoading = false)
    });
  } else {
    // Marquer seulement email et password comme touched
    this.loginForm.get('email')?.markAsTouched();
    this.loginForm.get('password')?.markAsTouched();
  }
}

  private proceedLogin(): void {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.rememberMe) {
      localStorage.setItem('rememberedEmail', this.loginForm.value.email);
      localStorage.setItem('rememberedSite', this.loginForm.value.siteName || '');
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberedSite');
      localStorage.setItem('rememberMe', 'false');
    }

    // ✅ Pour Admin, on envoie siteName = null ou vide
    const loginData = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
      siteName: this.loginForm.value.siteName
    };

    this.authService.login(loginData).subscribe({
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
  }
}
