// claims.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClaimService } from '../../../../services/claim.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../services/UserService';
import { AuthService } from '../../../../services/auth.service';
import { ChargeSheetService } from '../../../../services/charge-sheet.service';

// claims.component.ts - Version corrigée

// ✅ Transformer en ValidatorFn directement (pas de fonction wrapper)
export const phoneValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;

  const cleanValue = value.replace(/[\s-]/g, '');

  const patterns = [
    /^[0-9]{8}$/,                           // 8 chiffres (Tunisie)
    /^\+216[0-9]{8}$/,                      // +216 + 8 chiffres
    /^0[67][0-9]{8}$/,                      // 06 ou 07 + 8 chiffres (France mobile)
    /^\+33[0-9]{9}$/,                       // +33 + 9 chiffres (France)
    /^\+[0-9]{1,3}[0-9]{7,10}$/             // Format international générique
  ];

  const isValid = patterns.some(pattern => pattern.test(cleanValue));

  return isValid ? null : { invalidPhone: true };
};

@Component({
  selector: 'app-claims',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './claims.component.html',
  styleUrls: ['./claims.component.css']
})
export class ClaimsComponent implements OnInit {

  form!: FormGroup;
  emails: string[] = [];
  filteredEmails: string[] = [];
  showDropdown = false;
  chargeSheetId: number | null = null;
  relatedTo: string | null = null;
  relatedId: number | null = null;

  // Propriétés pour l'upload d'image
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploading = false;

  // Informations de l'utilisateur connecté
  userSite: string = '';
  userEmail: string = '';
  userFullName: string = '';
  userFirstName: string = '';
  userLastName: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private claimService: ClaimService,
    private userService: UserService,
    private authService: AuthService, private chargeSheetService: ChargeSheetService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCurrentUserFromApi(); // ✅ Appeler l'API pour récupérer l'utilisateur
    this.loadQueryParams();
    this.loadEmails();
  }

  // ✅ Récupérer l'utilisateur depuis l'API
  loadCurrentUserFromApi(): void {
    this.userService.getCurrentUserFromApi().subscribe({
      next: (user) => {
        console.log('👤 Utilisateur récupéré depuis API:', user);

        // Extraire les informations
        this.userEmail = user.email || '';
        this.userFirstName = user.firstname || '';
        this.userLastName = user.lastname || '';
        this.userFullName = user.fullName || `${this.userFirstName} ${this.userLastName}`.trim();
        this.userSite = user.site || user.plant || '';

        // Mettre à jour le formulaire avec les valeurs
        this.form.patchValue({
          plant: this.userSite,
          customer: this.userFullName,
          customerEmail: this.userEmail,
          problemWhoDetected: this.userFullName
        });

        console.log('✅ Formulaire mis à jour avec:', {
          plant: this.userSite,
          customer: this.userFullName,
          customerEmail: this.userEmail
        });
      },
      error: (err) => {
        console.error('❌ Erreur récupération utilisateur:', err);
        // Fallback: essayer de récupérer depuis localStorage
        this.loadCurrentUserFromLocalStorage();
      }
    });
  }

  // Fallback: récupérer depuis localStorage
  loadCurrentUserFromLocalStorage(): void {
    this.userSite = this.authService.getUserSite() || '';
    this.userEmail = this.authService.getUserEmail() || '';
    this.userFullName = this.authService.getUserFullName() || '';

    this.form.patchValue({
      plant: this.userSite,
      customer: this.userFullName,
      customerEmail: this.userEmail,
      problemWhoDetected: this.userFullName
    });
  }

  initForm(): void {
    // Date du jour au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    this.form = this.fb.group({
      // Champs cachés
      chargeSheetId: [null, Validators.required],
      relatedTo: ['', Validators.required],
      relatedId: [null, Validators.required],

      // SECTION 1: INFORMATIONS GÉNÉRALES
      claimDate: [today, Validators.required],
      plant: ['', Validators.required],        // Sera pré-rempli après chargement
      customer: ['', Validators.required],     // Sera pré-rempli après chargement
      contactPerson: ['', Validators.required],
      customerEmail: ['', [Validators.required, Validators.email]], // Sera pré-rempli
      customerPhone: ['', [Validators.required, phoneValidator]],
      supplier: ['', Validators.required],
      supplierContactPerson: [''],
      orderNumber: ['', Validators.required],
      testModuleNumber: [''],
      testModuleQuantity: [null, [Validators.min(0)]],
      ppoSignature: ['', Validators.required],

      // SECTION 2: PROBLEM DESCRIPTION
      problemWhatHappened: ['', Validators.required],
      problemWhy: ['', Validators.required],
      problemWhenDetected: ['', Validators.required],
      problemWhoDetected: ['', Validators.required], // Sera pré-rempli
      problemWhereDetected: ['', Validators.required],
      problemHowDetected: ['', Validators.required],

      // SECTION 3: INFORMATIONS RÉCLAMATION
      title: ['', Validators.required],
      assignedTo: ['', Validators.required],
      priority: ['MEDIUM', Validators.required],
      category: ['TECHNICAL', Validators.required]
    });
  }

 loadQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      console.log('🔍 Query params reçus:', params);

      this.chargeSheetId = params['chargeSheetId'] ? Number(params['chargeSheetId']) : null;
      this.relatedTo = params['relatedTo'] || null;
      this.relatedId = params['relatedId'] ? Number(params['relatedId']) : null;

      // ✅ Vérifier si les paramètres requis sont présents
      const missingParams: string[] = [];

      if (!this.chargeSheetId && this.form.get('chargeSheetId')?.enabled) {
        missingParams.push('chargeSheetId');
      }
      if (!this.relatedTo && this.form.get('relatedTo')?.enabled) {
        missingParams.push('relatedTo');
      }
      if (!this.relatedId && this.form.get('relatedId')?.enabled) {
        missingParams.push('relatedId');
      }

      if (missingParams.length > 0) {
        console.error('❌ Paramètres manquants:', missingParams);
        alert(`Paramètres requis manquants: ${missingParams.join(', ')}. Veuillez accéder à cette page depuis un cahier de charges.`);
        this.router.navigate(['/charge-sheets']);
        return;
      }

      // Mettre à jour le formulaire
      if (this.chargeSheetId) {
        this.form.patchValue({ chargeSheetId: this.chargeSheetId });
        this.loadChargeSheetInfo();
      }
      if (this.relatedTo) {
        this.form.patchValue({ relatedTo: this.relatedTo });
      }
      if (this.relatedId) {
        this.form.patchValue({ relatedId: this.relatedId });
      }

      // ✅ Marquer ces champs comme "touched" pour qu'ils ne bloquent pas le formulaire
      this.form.get('chargeSheetId')?.markAsTouched();
      this.form.get('relatedTo')?.markAsTouched();
      this.form.get('relatedId')?.markAsTouched();
    });
}
loadChargeSheetInfo(): void {
  if (!this.chargeSheetId) return;

  // Importer ChargeSheetService si ce n'est pas déjà fait
  // import { ChargeSheetService } from '../../../../services/charge-sheet.service';

  this.chargeSheetService.getById(this.chargeSheetId).subscribe({
    next: (chargeSheet) => {
      console.log('📄 Infos cahier chargées:', chargeSheet);

      // ✅ Pré-remplir le champ orderNumber
      if (chargeSheet.orderNumber) {
        this.form.patchValue({ orderNumber: chargeSheet.orderNumber });
        console.log('✅ Order Number pré-rempli:', chargeSheet.orderNumber);
      }
    },
    error: (err) => {
      console.error('❌ Erreur chargement cahier:', err);
    }
  });
}
// Dans votre composant Angular

loadEmails(): void {
  console.log('📧 Chargement des emails...');
  this.userService.getProjectEmails().subscribe({
    next: (data) => {
      this.emails = data;
      this.filteredEmails = data;
      console.log('✅ Emails chargés:', data);
      console.log(`📊 Total: ${data.length} email(s)`);
    },
    error: (err) => {
      console.error('❌ Erreur chargement emails:', err);
      this.emails = [];
      this.filteredEmails = [];
    }
  });
}


  // Gestion de la sélection de fichier
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Supprimer l'image sélectionnée
  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
  }

 submit(): void {
    // ✅ Vérification spécifique pour les champs cachés
    if (!this.form.get('chargeSheetId')?.value) {
        alert('Erreur: Aucun cahier de charges associé. Veuillez accéder depuis un cahier de charges.');
        return;
    }

    if (!this.form.get('relatedTo')?.value) {
        alert('Erreur: Type de relation manquant.');
        return;
    }

    if (!this.form.get('relatedId')?.value) {
        alert('Erreur: ID de relation manquant.');
        return;
    }

    if (this.form.invalid) {
        console.log('❌ Formulaire invalide:', this.form.errors);
        Object.keys(this.form.controls).forEach(key => {
            const control = this.form.get(key);
            if (control?.invalid) {
                console.log(`🔴 Champ invalide: ${key}`, control.errors);
            }
        });
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }
    if (this.form.invalid) {
      console.log('❌ Formulaire invalide:', this.form.errors);
      // Marquer tous les champs comme touched pour afficher les erreurs
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isUploading = true;
    const formValue = this.form.value;
    console.log('📤 Données à envoyer:', formValue);

    // Étape 1: Créer la réclamation
    this.claimService.createClaim(formValue).subscribe({
      next: (response) => {
        console.log('✅ Réclamation créée:', response);

        // Étape 2: Si une image est sélectionnée, l'uploader
        if (this.selectedFile && response.id) {
          this.uploadImage(response.id);
        } else {
          this.finishCreation();
        }
      },
      error: (err) => {
        this.isUploading = false;
        console.error('❌ Erreur création:', err);
        alert(`Erreur: ${err.error?.message || err.message}`);
      }
    });
  }

  // Uploader l'image pour la réclamation
  uploadImage(claimId: number): void {
    this.claimService.uploadClaimImage(claimId, this.selectedFile!).subscribe({
      next: (response) => {
        console.log('✅ Image uploadée:', response);
        this.finishCreation();
      },
      error: (err) => {
        this.isUploading = false;
        console.error('❌ Erreur upload image:', err);
        alert(`Réclamation créée mais erreur upload image: ${err.error?.message || err.message}`);
        this.router.navigate(['/claims/list']);
      }
    });
  }

  // Terminer la création et rediriger
  finishCreation(): void {
    this.isUploading = false;
    alert('✅ Réclamation créée avec succès');
    this.router.navigate(['/claims/list']);
  }

  filterEmails(event: any): void {
    const value = event.target.value.toLowerCase();
    this.filteredEmails = this.emails.filter(e =>
      e.toLowerCase().includes(value)
    );
    this.showDropdown = true;
  }

  selectEmail(email: string): void {
    this.form.patchValue({ assignedTo: email });
    this.showDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: any): void {
    if (!event.target.closest('.email-field')) {
      this.showDropdown = false;
    }
  }

   goBack(): void {
  window.history.back();

}

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
