// edittechniquefile.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TechnicalFileService } from '../../../../../services/technical-file.service';
import { AuthService } from '../../../../../services/auth.service';
import { TechnicalFileItemDetail } from '../../../../../models/technical-file.model';

@Component({
  selector: 'app-edittechniquefile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './edittechniquefile.component.html',
  styleUrls: ['./edittechniquefile.component.css']
})
export class EdittechniquefileComponent implements OnInit {

  form!: FormGroup;
  id!: number;
  itemId!: number | null;
  isItemMode = false;
  technicianName: string = '';
  fileReference: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private service: TechnicalFileService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.technicianName = this.authService.getUserFullName();
    const itemIdParam = this.route.snapshot.paramMap.get('itemId');
    const idParam = this.route.snapshot.paramMap.get('id');

    this.initForm();

    if (itemIdParam) {
      // Mode édition d'item
      this.isItemMode = true;
      this.itemId = +itemIdParam;
      this.loadItemData();
    } else if (idParam) {
      // Mode édition de dossier
      this.isItemMode = false;
      this.id = +idParam;
      this.loadFileData();
    }
  }

  initForm() {
    this.form = this.fb.group({
      // Champs communs aux items
      technicianName: [this.technicianName],
      maintenanceDate: [''],
      xCode: [''],
      leoniReferenceNumber: [''],
      indexValue:[''],
      producer: [''],
      type: [''],
      referencePinePushBack: [''],
      position: [''],

      // Raideur des pins
      pinRigidityM1: [''],
      pinRigidityM2: [''],
      pinRigidityM3: [''],

      // Déplacement
      displacementPathM1: [''],
      displacementPathM2: [''],
      displacementPathM3: [''],

      // Max sealing
      maxSealingValueM1: [''],
      maxSealingValueM2: [''],
      maxSealingValueM3: [''],

      // Programmed sealing
      programmedSealingValueM1: [''],
      programmedSealingValueM2: [''],
      programmedSealingValueM3: [''],

      // Détections
      detectionsM1: [''],
      detectionsM2: [''],
      detectionsM3: [''],

      // Remarques
      remarks: ['']
    });
  }

  loadItemData() {
    this.service.getItemById(this.itemId!).subscribe({
      next: (item: TechnicalFileItemDetail) => {
        console.log('✅ Item chargé:', item);

        // Vérifier si l'item a un technicalFileId (relation avec le dossier parent)
        if ('technicalFileId' in item && item.technicalFileId) {
          this.loadFileReference(item.technicalFileId);
        }

        this.form.patchValue({
          technicianName: item.technicianName || this.technicianName,
          maintenanceDate: item.maintenanceDate,
          xCode: item.xcode,
          leoniReferenceNumber: item.leoniReferenceNumber,
          indexValue:item.indexValue,
          producer: item.producer,
          type: item.type,
          referencePinePushBack: item.referencePinePushBack,
          position: item.position,
          pinRigidityM1: item.pinRigidityM1,
          pinRigidityM2: item.pinRigidityM2,
          pinRigidityM3: item.pinRigidityM3,
          displacementPathM1: item.displacementPathM1,
          displacementPathM2: item.displacementPathM2,
          displacementPathM3: item.displacementPathM3,
          maxSealingValueM1: item.maxSealingValueM1,
          maxSealingValueM2: item.maxSealingValueM2,
          maxSealingValueM3: item.maxSealingValueM3,
          programmedSealingValueM1: item.programmedSealingValueM1,
          programmedSealingValueM2: item.programmedSealingValueM2,
          programmedSealingValueM3: item.programmedSealingValueM3,
          detectionsM1: item.detectionsM1,
          detectionsM2: item.detectionsM2,
          detectionsM3: item.detectionsM3,
          remarks: item.remarks
        });
      },
      error: (err) => {
        console.error('❌ Erreur chargement item:', err);
        alert('❌ Impossible de charger l\'item: ' + (err.error?.message || err.message));
        this.goBack();
      }
    });
  }

  loadFileReference(fileId: number) {
    this.service.getById(fileId).subscribe({
      next: (file) => {
        this.fileReference = file.reference || '';
      },
      error: (err) => {
        console.error('❌ Erreur chargement référence dossier:', err);
      }
    });
  }

  loadFileData() {
    this.service.getById(this.id).subscribe({
      next: (file) => {
        console.log('✅ Dossier chargé:', file);
        this.fileReference = file.reference || '';

        // Pour l'instant, on ne modifie que la référence du dossier
        // Les items se modifient individuellement via les boutons dédiés
        alert('ℹ️ Pour modifier les items, utilisez les boutons "Modifier" dans la liste des items.');
        this.router.navigate(['/technical-files/list']);
      },
      error: (err) => {
        console.error('❌ Erreur chargement dossier:', err);
        alert('❌ Impossible de charger le dossier');
        this.goBack();
      }
    });
  }

  submit() {
    if (this.form.invalid) {
      alert('❌ Veuillez remplir tous les champs obligatoires');
      return;
    }

    const formValue = this.form.value;

    if (this.isItemMode) {
      // Mode édition d'item - créer le DTO en excluant les champs vides
      const updateDto: any = {};

      // Parcourir tous les champs et n'inclure que ceux qui ont une valeur
      Object.keys(formValue).forEach(key => {
        if (formValue[key] !== null && formValue[key] !== undefined && formValue[key] !== '') {
          updateDto[key] = formValue[key];
        }
      });

      console.log('📤 Mise à jour item:', updateDto);

      this.service.updateItem(this.itemId!, updateDto).subscribe({
        next: () => {
          alert('✅ Item modifié avec succès');
          this.router.navigate(['/technical-files/list']);
        },
        error: (err) => {
          console.error('❌ Erreur modification item:', err);
          alert('❌ Erreur lors de la modification: ' + (err.error?.message || err.message));
        }
      });
    } else {
      // Mode édition de dossier (seulement la référence pour l'instant)
      const updateDto: any = {};

      if (this.fileReference) {
        updateDto.reference = this.fileReference;
      }

      console.log('📤 Mise à jour dossier:', updateDto);

      this.service.update(this.id, updateDto).subscribe({
        next: () => {
          alert('✅ Référence du dossier modifiée');
          this.router.navigate(['/technical-files/list']);
        },
        error: (err) => {
          console.error('❌ Erreur modification dossier:', err);
          alert('❌ Erreur lors de la modification: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/technical-files/list']);
  }
}
