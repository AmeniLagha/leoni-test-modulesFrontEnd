// register.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../../services/auth.service';
import { Site } from '../../../../../models/site.model';
import { SiteService } from '../../../../../services/Site';
import { ProjetService } from '../../../../../services/projet.service'; // ✅ AJOUTER

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
  private siteService = inject(SiteService);
  private projetService = inject(ProjetService); // ✅ AJOUTER

  registerForm: FormGroup;
  errorMessage = '';
  isLoading = false;
  successMessage: string = '';
  showPassword = false;
  roles = ['ADMIN', 'ING', 'PT', 'PP', 'MC', 'MP'];

  // ✅ Remplacer par une liste dynamique depuis la base
  projets: any[] = [];
  loadingProjets = false;

  sites: Site[] = [];
  loadingSites = false;

  constructor() {
    this.registerForm = this.fb.group({
      firstname: ['', [Validators.required]],
      lastname: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      matricule: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', [Validators.required]],
      projets: [[], [Validators.required]], // ✅ Tableau de projets
      siteName: ['', [Validators.required]]
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

    this.loadSites();
    this.loadProjets(); // ✅ Charger les projets
  }

  // ✅ Charger les projets depuis l'API
  loadProjets(): void {
    this.loadingProjets = true;
    this.projetService.getActive().subscribe({
      next: (projets) => {
        this.projets = projets;
        this.loadingProjets = false;
        console.log('✅ Projets chargés:', this.projets);
      },
      error: (err) => {
        console.error('❌ Erreur chargement projets:', err);
        this.loadingProjets = false;
      }
    });
  }

  loadSites(): void {
    this.loadingSites = true;
    this.siteService.getAll().subscribe({
      next: (sites) => {
        this.sites = sites;
        this.loadingSites = false;
        console.log('✅ Sites chargés:', this.sites);
      },
      error: (err) => {
        console.error('❌ Erreur chargement sites:', err);
        this.loadingSites = false;
        this.errorMessage = 'Impossible de charger la liste des sites';
      }
    });
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

      // ✅ Transformer les données pour l'envoi (tableau de noms de projets)
      const selectedProjets = this.registerForm.value.projets;
      const projetNames = selectedProjets.map((p: any) => typeof p === 'string' ? p : p.name);

      const registerData = {
        firstname: this.registerForm.value.firstname,
        lastname: this.registerForm.value.lastname,
        email: this.registerForm.value.email,
        matricule: this.registerForm.value.matricule,
        password: this.registerForm.value.password,
        role: this.registerForm.value.role,
        projets: projetNames, // ✅ Tableau de noms de projets
        siteName: this.registerForm.value.siteName
      };

      console.log('🚀 Tentative de création utilisateur:', registerData);
       this.successMessage = '';
      this.authService.register(registerData).subscribe({
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
  // Ajoutez ces propriétés et méthodes
currentStep: number = 1;

nextStep(): void {
  if (this.currentStep < 3) {
    this.currentStep++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

prevStep(): void {
  if (this.currentStep > 1) {
    this.currentStep--;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

getPasswordStrength(): number {
  const password = this.registerForm.get('password')?.value || '';
  let strength = 0;

  if (password.length >= 6) strength += 20;
  if (password.length >= 8) strength += 10;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[a-z]/.test(password)) strength += 20;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^A-Za-z0-9]/.test(password)) strength += 15;

  return Math.min(strength, 100);
}

getPasswordStrengthText(): string {
  const strength = this.getPasswordStrength();
  if (strength <= 33) return 'Mot de passe faible';
  if (strength <= 66) return 'Mot de passe moyen';
  return 'Mot de passe fort';
}

isProjectSelected(projectName: string): boolean {
  const projets = this.registerForm.get('projets')?.value || [];
  return projets.includes(projectName);
}

toggleProject(projectName: string): void {
  const projets = this.registerForm.get('projets')?.value || [];
  if (projets.includes(projectName)) {
    this.registerForm.get('projets')?.setValue(projets.filter((p: string) => p !== projectName));
  } else {
    this.registerForm.get('projets')?.setValue([...projets, projectName]);
  }
}
}
