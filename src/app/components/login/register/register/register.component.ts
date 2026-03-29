import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  errorMessage = '';
  isLoading = false;
  showPassword = false;
  roles = ['ADMIN', 'ING', 'PT', 'PP', 'MC', 'MP'];
  projets = ['BMW', 'Mercedes', 'FORD', 'Audi', 'Porsche', 'Volkswagen'];

  constructor() {
    this.registerForm = this.fb.group({
      firstname: ['', [Validators.required]],
      lastname: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      matricule: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', [Validators.required]],
      projet: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.authService.getUserRole() !== 'ADMIN') {
      this.router.navigate(['/dashboard']);
      return;
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  getRoleLabel(role: string): string {
    const labels: { [key: string]: string } = {
      'ADMIN': 'Administrateur',
      'ING': 'Ingénieur',
      'PT': 'Technologie Production',
      'PP': 'Préparation Production',
      'MC': 'Maintenance Corrective',
      'MP': 'Maintenance Préventive'
    };
    return labels[role] || role;
  }

  getRoleIcon(role: string): string {
    const icons: { [key: string]: string } = {
      'ADMIN': 'bi-shield-lock',
      'ING': 'bi-gear',
      'PT': 'bi-wrench',
      'PP': 'bi-diagram-3',
      'MC': 'bi-tools',
      'MP': 'bi-calendar-check'
    };
    return icons[role] || 'bi-person';
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      console.log('🚀 Tentative de création utilisateur:', this.registerForm.value);

      this.authService.register(this.registerForm.value).subscribe({
        next: (response) => {
          console.log('✅ Utilisateur créé avec succès:', response);
          this.router.navigate(['/listeuser']);
        },
        error: (error) => {
          console.error('❌ Erreur création:', error);
          if (error.status === 401) {
            this.errorMessage = "Vous n'êtes pas autorisé à créer des utilisateurs";
          } else if (error.status === 403) {
            this.errorMessage = "Vous n'avez pas la permission admin";
          } else if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = "Erreur lors de l'inscription";
          }
          this.isLoading = false;
        },
        complete: () => this.isLoading = false
      });
    } else {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }
}
