import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClaimService } from '../../../../services/claim.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../services/UserService';

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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private claimService: ClaimService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadQueryParams();
    this.loadEmails();
  }

  initForm(): void {
    this.form = this.fb.group({
      chargeSheetId: [null, Validators.required],
      relatedTo: ['', Validators.required],
      relatedId: [null, Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
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

      if (this.chargeSheetId) {
        this.form.patchValue({ chargeSheetId: this.chargeSheetId });
      }
      if (this.relatedTo) {
        this.form.patchValue({ relatedTo: this.relatedTo });
      }
      if (this.relatedId) {
        this.form.patchValue({ relatedId: this.relatedId });
      }
    });
  }

  loadEmails(): void {
    console.log('📧 Chargement des emails...');
    this.userService.getProjectEmails().subscribe({
      next: (data) => {
        this.emails = data;
        this.filteredEmails = data;
        console.log('✅ Emails chargés:', data);
      },
      error: (err) => {
        console.error('❌ Erreur chargement emails:', err);
        this.emails = ['test1@example.com', 'test2@example.com', 'admin@test.com'];
        this.filteredEmails = this.emails;
      }
    });
  }

  // Gestion de la sélection de fichier
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Créer un aperçu
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
    if (this.form.invalid) {
      console.log('❌ Formulaire invalide:', this.form.errors);
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
    if (this.chargeSheetId) {
      this.router.navigate(['/claims/list']);
    }
  }
  // Ajoutez cette méthode dans votre composant
formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
}
