import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ChargeSheetService } from '../../../../services/charge-sheet.service';
import { AuthService } from '../../../../services/auth.service';
import { UploadService } from '../../../../services/upload.service';
import {
  ChargeSheetCreateDto,
  ChargeSheetItemDto,
  ChargeSheetComplete,
  ChargeSheetStatus
} from '../../../../models/charge-sheet.model';
import { Projet, ProjetService } from '../../../../services/projet.service';

@Component({
  selector: 'app-cahierdecharge',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './cahierdecharge.component.html',
  styleUrls: ['./cahierdecharge.component.css'],
})
export class CahierdechargeComponent implements OnInit, OnDestroy {
  chargeSheetForm!: FormGroup;
  loading = false;
  error = '';
  currentChargeSheetId: number | null = null;
  isEditMode = false;
  selectedFiles: (File | null)[] = [];
  yesNoOptions = ['Yes', 'No'];
  itemImages: { [key: number]: string | null } = {};

  // Statut du cahier en mode édition
  currentStatus: ChargeSheetStatus | null = null;

  // Permissions
  userRole: string = '';
  userPermissions: string[] = [];

  // Modal image
  showImageModal = false;
  modalImageUrl: string | null = null;

   availableProjets: Projet[] = [];
  loadingProjets = false;

  constructor(
    private fb: FormBuilder,
    private chargeSheetService: ChargeSheetService,
    private uploadService: UploadService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private projetService: ProjetService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.userPermissions = this.authService.getUserPermissions();
    this.initForm();
       this.loadProjetsBySite();

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.isEditMode = true;
        this.currentChargeSheetId = +idParam;
        this.loadChargeSheet(this.currentChargeSheetId);
      } else {
        // Mode création : ajouter un premier item
        this.addNewItem();
      }
    });
  }
 loadProjetsBySite(): void {
    const userSite = this.authService.getUserSite();
    if (userSite) {
      this.loadingProjets = true;
      this.projetService.getProjetsBySite(userSite).subscribe({
        next: (projets) => {
          this.availableProjets = projets;
          this.loadingProjets = false;
        },
        error: (err) => {
          console.error('Erreur chargement projets:', err);
          this.loadingProjets = false;
        }
      });
    }
  }
  ngOnDestroy(): void {
    // Nettoyer les URLs des images
    Object.values(this.itemImages).forEach(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }

  initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const currentUserEmail = this.authService.getUserEmail();
    const currentUserFullName = this.authService.getUserFullName();
    const currentUserSite = this.authService.getUserSite(); // ✅ Récupérer le site de l'utilisateur



    this.chargeSheetForm = this.fb.group({
      plant: [{ value: currentUserSite, disabled: true }, Validators.required],
      project: ['', Validators.required],
      harnessRef: ['', Validators.required],
      issuedBy: [currentUserFullName, Validators.required],
      emailAddress: [currentUserEmail, [Validators.required, Validators.email]],
      phoneNumber: [''],
      orderNumber: ['',],
      costCenterNumber: ['', ],
      date: [today, Validators.required],
      preferredDeliveryDate: [nextWeek, Validators.required],
      items: this.fb.array([])
    });
  }
// cahierdecharge.component.ts
getUserSite(): string {
  return this.authService.getUserSite();
}
  // Vérifier si on peut modifier en mode édition
  canEditInEditMode(): boolean {
    if (!this.isEditMode) return true;

    // En mode édition, on ne peut modifier que si le statut est DRAFT
    // et que l'utilisateur a les permissions ING
    return this.currentStatus === 'DRAFT' &&
           this.userPermissions.includes('charge_sheet:basic:write');
  }

  // Obtenir le libellé du statut
  getStatusLabel(status: ChargeSheetStatus | null): string {
    if (!status) return 'Inconnu';
    return this.chargeSheetService.getStatusLabel(status);
  }

  // Getter pour le FormArray des items
  get items(): FormArray {
    return this.chargeSheetForm.get('items') as FormArray;
  }

  // Créer un nouveau FormGroup pour un item
  createItemForm(item?: ChargeSheetItemDto): FormGroup {
    return this.fb.group({
      id: [item?.id || null],
      samplesExist: [item?.samplesExist || 'No'],
      ways: [item?.ways || '', ],
      housingColour: [item?.housingColour || ''],
      testModuleExistInDatabase: [item?.testModuleExistInDatabase || 'No'],
      housingReferenceLeoni: [item?.housingReferenceLeoni || '', Validators.required],
      housingReferenceSupplierCustomer: [item?.housingReferenceSupplierCustomer || '', Validators.required],
      referenceSealsClipsCableTiesCap: [item?.referenceSealsClipsCableTiesCap || ''],
      realConnectorPicture: [item?.realConnectorPicture || ''],
      quantityOfTestModules: [item?.quantityOfTestModules || 1, [Validators.required, Validators.min(1)]]
    });
  }

  // Ajouter un nouvel item au formulaire
  addNewItem(): void {
    if (this.isEditMode && !this.canEditInEditMode()) {
      alert('Vous ne pouvez pas ajouter d\'items en mode lecture seule');
      return;
    }
    this.items.push(this.createItemForm());
  }

  // Supprimer un item du formulaire
  removeItem(index: number): void {
    if (this.items.length <= 1) {
      alert('Vous devez garder au moins un item');
      return;
    }

    if (this.isEditMode && !this.canEditInEditMode()) {
      alert('Vous ne pouvez pas supprimer d\'items en mode lecture seule');
      return;
    }

    if (confirm('Voulez-vous vraiment supprimer cet item ?')) {
      const itemId = this.items.at(index).get('id')?.value;

      if (itemId && this.currentChargeSheetId) {
        // Si c'est un item existant en base, le supprimer via API
        this.chargeSheetService.deleteItem(this.currentChargeSheetId, itemId).subscribe({
          next: () => {
            this.items.removeAt(index);
            this.cleanupItemImage(index);
          },
          error: (err) => {
            console.error('Erreur suppression item:', err);
            this.error = 'Erreur lors de la suppression de l\'item';
          }
        });
      } else {
        // Item temporaire (pas encore en base)
        this.items.removeAt(index);
        this.cleanupItemImage(index);
      }
    }
  }

  // Nettoyer l'image d'un item supprimé
  cleanupItemImage(index: number): void {
    if (this.itemImages[index]) {
      // Révoquer l'URL blob si nécessaire
      if (this.itemImages[index]?.startsWith('blob:')) {
        URL.revokeObjectURL(this.itemImages[index]!);
      }
      delete this.itemImages[index];
    }

    // Réorganiser les index des images
    const newItemImages: { [key: number]: string | null } = {};
    Object.keys(this.itemImages).forEach((key) => {
      const oldIndex = parseInt(key);
      if (oldIndex < this.items.length) {
        newItemImages[oldIndex] = this.itemImages[oldIndex];
      } else if (oldIndex > index) {
        // Décaler les index
        newItemImages[oldIndex - 1] = this.itemImages[oldIndex];
      }
    });
    this.itemImages = newItemImages;
  }

  // Récupérer un FormGroup d'item à un index donné
  getItemFormGroup(index: number): FormGroup {
    return this.items.at(index) as FormGroup;
  }

  loadChargeSheet(id: number): void {
    this.loading = true;
    this.chargeSheetService.getById(id).subscribe({
      next: (sheet: ChargeSheetComplete) => {
        // Sauvegarder le statut
        this.currentStatus = sheet.status;
 const currentUserSite = this.authService.getUserSite();

      // ✅ Vérifier que l'utilisateur a le droit de modifier ce cahier
      if (sheet.plant !== currentUserSite) {
        this.error = `Vous n'avez pas accès à ce cahier (site: ${sheet.plant})`;
        this.loading = false;
        return;
      }
        // Remplir le formulaire avec les données générales
        this.chargeSheetForm.patchValue({
          plant: sheet.plant,
          project: sheet.project,
          harnessRef: sheet.harnessRef,
          issuedBy: sheet.issuedBy,
          emailAddress: sheet.emailAddress,
          phoneNumber: sheet.phoneNumber || '',
          orderNumber: sheet.orderNumber,
          costCenterNumber: sheet.costCenterNumber,
          date: sheet.date,
          preferredDeliveryDate: sheet.preferredDeliveryDate
        });
 // Désactiver le champ plant en mode édition aussi
      this.chargeSheetForm.get('plant')?.disable();
        // Vider les items existants
        while (this.items.length) {
          this.items.removeAt(0);
        }

        // Nettoyer les anciennes images
        Object.values(this.itemImages).forEach(url => {
          if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
        this.itemImages = {};

        // Ajouter les items du backend
        if (sheet.items && sheet.items.length > 0) {
          sheet.items.forEach(item => {
            this.items.push(this.createItemForm(item));
          });
        }

        // Charger les images des items
        this.loadItemImages(sheet.items);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement:', err);
        this.error = 'Impossible de charger les données';
        this.loading = false;
      }
    });
  }

  loadItemImages(items: ChargeSheetItemDto[]): void {
    items.forEach((item, index) => {
      if (item.id && item.realConnectorPicture) {
        this.uploadService.getImageUrl(item.realConnectorPicture).subscribe({
          next: (url) => {
            this.itemImages[index] = url;
          },
          error: (err) => console.error('Erreur chargement image:', err)
        });
      }
    });
  }

  // Gestion de l'upload d'image pour un item
  onItemFileSelected(event: Event, itemIndex: number): void {
    if (this.isEditMode && !this.canEditInEditMode()) {
      alert('Vous ne pouvez pas modifier les images en mode lecture seule');
      return;
    }

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }

      this.selectedFiles[itemIndex] = file;

      // Aperçu immédiat
      const reader = new FileReader();
      reader.onload = () => {
        // Nettoyer l'ancienne URL si elle existe
        if (this.itemImages[itemIndex]?.startsWith('blob:')) {
          URL.revokeObjectURL(this.itemImages[itemIndex]!);
        }
        this.itemImages[itemIndex] = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeItemImage(itemIndex: number): void {
    if (this.isEditMode && !this.canEditInEditMode()) {
      alert('Vous ne pouvez pas supprimer les images en mode lecture seule');
      return;
    }

    const itemId = this.items.at(itemIndex).get('id')?.value;

    if (itemId && this.currentChargeSheetId) {
      if (confirm('Supprimer cette image ?')) {
        this.uploadService.deleteItemImage(this.currentChargeSheetId, itemId).subscribe({
          next: () => {
            if (this.itemImages[itemIndex]?.startsWith('blob:')) {
              URL.revokeObjectURL(this.itemImages[itemIndex]!);
            }
            this.itemImages[itemIndex] = null;
            this.items.at(itemIndex).patchValue({ realConnectorPicture: '' });
            this.selectedFiles[itemIndex] = null;
          },
          error: (err) => {
            console.error('Erreur suppression image:', err);
            alert('Erreur lors de la suppression de l\'image');
          }
        });
      }
    } else {
      // Image temporaire (pas encore uploadée)
      if (this.itemImages[itemIndex]?.startsWith('blob:')) {
        URL.revokeObjectURL(this.itemImages[itemIndex]!);
      }
      this.itemImages[itemIndex] = null;
      this.selectedFiles[itemIndex] = null;
    }
  }

  openImageModal(imageUrl: string | null): void {
    if (imageUrl) {
      this.modalImageUrl = imageUrl;
      this.showImageModal = true;
    }
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.modalImageUrl = null;
  }

  onSubmit(): void {
    if (this.chargeSheetForm.invalid) {
      Object.keys(this.chargeSheetForm.controls).forEach(key => {
        const control = this.chargeSheetForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });

      // Trouver le premier champ invalide pour scroll
      const firstInvalid = document.querySelector('.is-invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (this.isEditMode && !this.canEditInEditMode()) {
      alert('Vous ne pouvez pas modifier ce cahier car il n\'est plus en mode brouillon');
      return;
    }

    this.loading = true;
    this.error = '';

    const formValue = this.chargeSheetForm.value;

    if (this.isEditMode && this.currentChargeSheetId) {
      // MODE ÉDITION - Mise à jour du cahier
      this.updateChargeSheet();
    } else {
      // MODE CRÉATION - Création d'un nouveau cahier
      this.createChargeSheet(formValue);
    }
  }

  // ==================== MÉTHODE CORRIGÉE POUR LA MISE À JOUR ====================
 // Mise à jour d'un cahier existant - Version avec async/await
async updateChargeSheet(): Promise<void> {
  const formValue = this.chargeSheetForm.value;

  // ÉTAPE 1: Mettre à jour les informations générales du cahier
  const updateDto = {
    plant: formValue.plant,
    project: formValue.project,
    harnessRef: formValue.harnessRef,
    phoneNumber: formValue.phoneNumber,
    orderNumber: formValue.orderNumber,
    costCenterNumber: formValue.costCenterNumber,
    date: formValue.date,
    preferredDeliveryDate: formValue.preferredDeliveryDate
  };

  console.log('Mise à jour du cahier:', this.currentChargeSheetId, updateDto);

  try {
    // Attendre la mise à jour du cahier
    const response = await this.chargeSheetService.updateChargeSheet(this.currentChargeSheetId!, updateDto).toPromise();
    console.log('✅ Cahier mis à jour avec succès:', response);

    // ÉTAPE 2: Traiter les items et les images
    await this.processItemsAndImages(response!.id);

  } catch (err) {
    console.error('❌ Erreur mise à jour:', err);
    this.error = (err as any).error?.message || 'Erreur lors de la mise à jour';
    this.loading = false;
  }
}

  // Nouvelle méthode pour traiter les items et les images
  // Version avec async/await
async processItemsAndImages(sheetId: number): Promise<void> {
  const formItems = this.chargeSheetForm.value.items;

  try {
    // Parcourir tous les items du formulaire
    for (let i = 0; i < formItems.length; i++) {
      const item = formItems[i];
      const file = this.selectedFiles[i];

      if (!item.id) {
        // 🔸 NOUVEL ITEM - à créer
        const newItemDto = {
          itemNumber: item.itemNumber,
          samplesExist: item.samplesExist,
          ways: item.ways,
          housingColour: item.housingColour,
          testModuleExistInDatabase: item.testModuleExistInDatabase,
          housingReferenceLeoni: item.housingReferenceLeoni,
          housingReferenceSupplierCustomer: item.housingReferenceSupplierCustomer,
          referenceSealsClipsCableTiesCap: item.referenceSealsClipsCableTiesCap,
          realConnectorPicture: '',
          quantityOfTestModules: item.quantityOfTestModules
        };

        try {
          // Créer l'item
          const createdSheet = await this.chargeSheetService.addItem(sheetId, newItemDto).toPromise();

          // Uploader l'image si présente
          if (createdSheet && createdSheet.items && file) {
            const newItem = createdSheet.items[createdSheet.items.length - 1];
            if (newItem && newItem.id) {
              await this.uploadService.uploadItemImage(sheetId, newItem.id, file).toPromise();
              console.log(`✅ Image uploadée pour nouvel item`);
            }
          }
        } catch (err) {
          console.error('Erreur création item:', err);
          // Continuer avec les autres items
        }
      } else if (file) {
        // 🔸 ITEM EXISTANT avec nouvelle image
        try {
          await this.uploadService.uploadItemImage(sheetId, item.id, file).toPromise();
          console.log(`✅ Image mise à jour pour item ${item.id}`);
        } catch (err) {
          console.error(`❌ Erreur upload image item ${item.id}:`, err);
          // Continuer avec les autres items
        }
      }
    }

    console.log('✅ Tous les items et images ont été traités');
  } catch (error) {
    console.error('❌ Erreur lors du traitement:', error);
  } finally {
    this.loading = false;
    this.router.navigate(['/charge-sheets/list']);
  }
}
  // ==================== MÉTHODE CORRIGÉE POUR LA CRÉATION ====================
  createChargeSheet(formValue: any): void {
    const createDto: ChargeSheetCreateDto = {
        plant: this.authService.getUserSite(),
      project: formValue.project,
      harnessRef: formValue.harnessRef,
      issuedBy: formValue.issuedBy,
      emailAddress: formValue.emailAddress,
      phoneNumber: formValue.phoneNumber,
      orderNumber: formValue.orderNumber,
      costCenterNumber: formValue.costCenterNumber,
      date: formValue.date,
      preferredDeliveryDate: formValue.preferredDeliveryDate,
      items: formValue.items.map((item: any) => ({
        itemNumber: item.itemNumber,
        samplesExist: item.samplesExist,
        ways: item.ways,
        housingColour: item.housingColour,
        testModuleExistInDatabase: item.testModuleExistInDatabase,
        housingReferenceLeoni: item.housingReferenceLeoni,
        housingReferenceSupplierCustomer: item.housingReferenceSupplierCustomer,
        referenceSealsClipsCableTiesCap: item.referenceSealsClipsCableTiesCap,
        realConnectorPicture: '',
        quantityOfTestModules: item.quantityOfTestModules
      }))
    };

    this.chargeSheetService.createChargeSheet(createDto).subscribe({
      next: (response) => {
        console.log('✅ Cahier créé avec succès:', response);

        // Uploader les images des nouveaux items
        this.uploadImagesForNewSheet(response.id, response.items);
      },
      error: (err) => {
        console.error('❌ Erreur création:', err);
        this.error = err.error?.message || 'Erreur lors de la création';
        this.loading = false;
      }
    });
  }

  // Uploader les images pour un nouveau cahier
  uploadImagesForNewSheet(sheetId: number, items: ChargeSheetItemDto[]): void {
    const uploadPromises = [];

    for (let i = 0; i < items.length; i++) {
      const file = this.selectedFiles[i];
      if (file && items[i]?.id) {
        uploadPromises.push(
          this.uploadService.uploadItemImage(sheetId, items[i].id!, file).toPromise()
        );
      }
    }

    if (uploadPromises.length > 0) {
      Promise.all(uploadPromises)
        .then(() => {
          console.log('✅ Toutes les images ont été uploadées');
          this.loading = false;
          this.router.navigate(['/charge-sheets/list']);
        })
        .catch((err) => {
          console.error('❌ Erreur lors de l\'upload des images:', err);
          this.loading = false;
          this.router.navigate(['/charge-sheets/list']);
        });
    } else {
      this.loading = false;
      this.router.navigate(['/charge-sheets/list']);
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.chargeSheetForm.get(field);
    return control ? control.invalid && control.touched : false;
  }
}
