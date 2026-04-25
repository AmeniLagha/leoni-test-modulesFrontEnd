// register.component.ts - Version modifiée

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, map, of, Observable } from 'rxjs';
import { AuthService } from '../../../../../services/auth.service';
import { Site } from '../../../../../models/site.model';
import { SiteService } from '../../../../../services/Site';
import { ProjetService } from '../../../../../services/projet.service';

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
  private projetService = inject(ProjetService);

  registerForm: FormGroup;
  errorMessage = '';
  isLoading = false;
  successMessage: string = '';
  showPassword = false;
  roles = ['ADMIN', 'ING', 'PT', 'PP', 'MC', 'MP'];

  projets: any[] = [];
  loadingProjets = false;
  sites: Site[] = [];
  loadingSites = false;
  currentStep: number = 1;

  // ✅ Messages d'erreur spécifiques pour email et matricule
  emailExistsError = '';
  matriculeExistsError = '';

  constructor() {
    this.registerForm = this.fb.group({
      firstname: ['', [Validators.required]],
      lastname: ['', [Validators.required]],
      email: ['',
        [Validators.required, Validators.email],
        [this.emailAsyncValidator.bind(this)] // ✅ Validateur asynchrone
      ],
      matricule: ['',
        [Validators.required],
        [this.matriculeAsyncValidator.bind(this)] // ✅ Validateur asynchrone
      ],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', [Validators.required]],
      projets: [[], [Validators.required]],
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
    this.loadProjets();

    // ✅ Réinitialiser les messages d'erreur quand l'utilisateur tape
    this.registerForm.get('email')?.valueChanges.subscribe(() => {
      this.emailExistsError = '';
    });

    this.registerForm.get('matricule')?.valueChanges.subscribe(() => {
      this.matriculeExistsError = '';
    });
  }

  // ✅ Validateur asynchrone pour l'email
  emailAsyncValidator(control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> {
    if (!control.value) {
      return of(null);
    }

    return of(control.value).pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(email => this.authService.checkEmailExists(email)),
      map(exists => {
        if (exists) {
          this.emailExistsError = 'Cet email est déjà utilisé';
          return { emailExists: true };
        }
        this.emailExistsError = '';
        return null;
      })
    );
  }

  // ✅ Validateur asynchrone pour le matricule
  matriculeAsyncValidator(control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> {
    if (!control.value) {
      return of(null);
    }

    return of(control.value).pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(matricule => this.authService.checkMatriculeExists(matricule)),
      map(exists => {
        if (exists) {
          this.matriculeExistsError = 'Ce matricule est déjà utilisé';
          return { matriculeExists: true };
        }
        this.matriculeExistsError = '';
        return null;
      })
    );
  }

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

      const selectedProjets = this.registerForm.value.projets;
      const projetNames = selectedProjets.map((p: any) => typeof p === 'string' ? p : p.name);

      const registerData = {
        firstname: this.registerForm.value.firstname,
        lastname: this.registerForm.value.lastname,
        email: this.registerForm.value.email,
        matricule: this.registerForm.value.matricule,
        password: this.registerForm.value.password,
        role: this.registerForm.value.role,
        projets: projetNames,
        siteName: this.registerForm.value.siteName
      };

      console.log('🚀 Tentative de création utilisateur:', registerData);
      this.successMessage = '';

      this.authService.register(registerData).subscribe({
        next: (response) => {
          console.log('✅ Utilisateur créé avec succès:', response);
          this.successMessage = 'Utilisateur créé avec succès ! Redirection...';
          setTimeout(() => {
            this.router.navigate(['/listeuser']);
          }, 1500);
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

  nextStep(): void {
    // Validation de l'étape 1 avant de passer à l'étape 2
    if (this.currentStep === 1) {
      const step1Controls = ['firstname', 'lastname', 'email', 'matricule'];
      let isValid = true;

      step1Controls.forEach(control => {
        this.registerForm.get(control)?.markAsTouched();
        if (this.registerForm.get(control)?.invalid) {
          isValid = false;
        }
      });

      if (!isValid) {
        this.errorMessage = 'Veuillez remplir correctement tous les champs de l\'étape 1';
        return;
      }

      // Vérifier les erreurs asynchrones
      if (this.emailExistsError || this.matriculeExistsError) {
        this.errorMessage = 'Veuillez corriger les erreurs avant de continuer';
        return;
      }
    }

    if (this.currentStep === 2) {
      const step2Controls = ['password'];
      let isValid = true;

      step2Controls.forEach(control => {
        this.registerForm.get(control)?.markAsTouched();
        if (this.registerForm.get(control)?.invalid) {
          isValid = false;
        }
      });

      if (!isValid) {
        this.errorMessage = 'Veuillez saisir un mot de passe valide (minimum 6 caractères)';
        return;
      }
    }

    if (this.currentStep < 3) {
      this.currentStep++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.errorMessage = '';
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.errorMessage = '';
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
