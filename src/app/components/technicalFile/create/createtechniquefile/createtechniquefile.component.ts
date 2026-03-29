import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TechnicalFileService } from '../../../../../services/technical-file.service';
import { AuthService } from '../../../../../services/auth.service';
import { ChargeSheetService } from '../../../../../services/charge-sheet.service';

@Component({
  selector: 'app-createtechniquefile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './createtechniquefile.component.html',
  styleUrls: ['./createtechniquefile.component.css']
})
export class CreatetechniquefileComponent implements OnInit {
    form!: FormGroup;
    technicianName: string = '';
    chargeSheetId!: number;
    currentItemId: number | null = null;

    // Propriétés parsées de la référence client
    housingReferenceLeoni: string = '';
    housingReferenceSupplierCustomer: string = '';

    // Parties parsées
    basePart: string = '';
    indexPart: string = '';
    producerPart: string = '';
    typePart: string = '';

    constructor(
        private fb: FormBuilder,
        private service: TechnicalFileService,
        private chargeSheetService: ChargeSheetService,
        private route: ActivatedRoute,
        public router: Router,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.technicianName = this.authService.getUserFullName();
        this.initForm();

        const chargeSheetId = this.route.snapshot.paramMap.get('chargeSheetId');
        const itemId = this.route.snapshot.paramMap.get('itemId');

        console.log("ChargeSheet ID:", chargeSheetId);
        console.log("Item ID:", itemId);

        if (chargeSheetId && itemId) {
            this.loadItem(+chargeSheetId, +itemId);
        }
    }

    // ✅ Fonction pour parser la référence client
    parseSupplierReference(ref: string): void {
        if (!ref) return;

        const parts = ref.split('_');

        if (parts.length >= 1) {
            this.basePart = parts[0];
        }

        if (parts.length >= 2) {
            this.indexPart = parts[1];
        }

        if (parts.length >= 3) {
            this.producerPart = parts[2];
        }

        if (parts.length >= 4) {
            this.typePart = parts[3];
        }

        console.log('📌 Parsing référence client:', {
            ref,
            basePart: this.basePart,
            indexPart: this.indexPart,
            producerPart: this.producerPart,
            typePart: this.typePart
        });
    }

    // ✅ Fonction pour parser la référence Leoni (pour produire producer et type)
    parseLeoniReference(ref: string): { producer: string; type: string } {
        const result = { producer: '', type: '' };

        if (!ref) return result;

        // Format attendu: P84879_03_T_N ou P988766_O1_G_KI
        const parts = ref.split('_');

        if (parts.length >= 3) {
            result.producer = parts[2]; // G
        }

        if (parts.length >= 4) {
            result.type = parts[3]; // KI
        }

        console.log(`📌 Parsing référence Leoni "${ref}" -> producer: "${result.producer}", type: "${result.type}"`);

        return result;
    }

    initForm() {
        this.form = this.fb.group({
            reference: [''],
            items: this.fb.array([])
        });
    }

    get itemsArray(): FormArray {
        return this.form.get('items') as FormArray;
    }

    createItemFormGroup(item: any): FormGroup {
        // Calcul de l'index numérique à partir de indexPart (ex: "O1" -> 1, "03" -> 3)
        let indexValue = 1;
        if (this.indexPart) {
            const parsed = parseInt(this.indexPart.replace(/\D/g, ''), 10);
            if (!isNaN(parsed)) {
                indexValue = parsed;
            }
        }

        // Format de l'index pour l'affichage
        const formattedIndex = this.indexPart || '01';

        // Vérifier si l'item a une référence Leoni à parser
        let producer = this.producerPart;
        let type = this.typePart;

        // Si l'item a une référence Leoni, on la parse pour obtenir producer et type
        if (item.housingReferenceLeoni) {
            const parsed = this.parseLeoniReference(item.housingReferenceLeoni);
            if (parsed.producer) producer = parsed.producer;
            if (parsed.type) type = parsed.type;
        }

        console.log(`📝 Création formulaire item: producer="${producer}", type="${type}"`);

        return this.fb.group({
            chargeSheetItemId: [item.id, Validators.required],
            itemNumber: [item.itemNumber],
            maintenanceDate: [''],
            technicianName: [this.technicianName],
            xCode: [''],
            leoniReferenceNumber: [this.basePart],
            indexValue: [indexValue],
            producer: [producer],
            type: [type],
            referencePinePushBack: [''],
            position: [''],
            pinRigidityM1: [''],
            pinRigidityM2: [''],
            pinRigidityM3: [''],
            displacementPathM1: [''],
            displacementPathM2: [''],
            displacementPathM3: [''],
            maxSealingValueM1: [''],
            maxSealingValueM2: [''],
            maxSealingValueM3: [''],
            programmedSealingValueM1: [''],
            programmedSealingValueM2: [''],
            programmedSealingValueM3: [''],
            detectionsM1: [''],
            detectionsM2: [''],
            detectionsM3: [''],
            remarks: ['']
        });
    }

    loadItem(chargeSheetId: number, itemId: number) {
        this.chargeSheetService.getById(chargeSheetId).subscribe({
            next: (sheet) => {
                const item = sheet.items.find((i: any) => i.id == itemId);
                if (item) {
                    // ✅ Récupérer les références pour parsing
                    this.housingReferenceLeoni = item.housingReferenceLeoni || '';
                    this.housingReferenceSupplierCustomer = item.housingReferenceSupplierCustomer || '';

                    // ✅ Parser la référence client
                    this.parseSupplierReference(this.housingReferenceSupplierCustomer);

                    // ✅ Créer le formulaire avec les valeurs parsées
                    const itemForm = this.createItemFormGroup(item);
                    this.itemsArray.push(itemForm);

                    console.log('✅ Item chargé:', item);
                    console.log('📝 Formulaire créé:', itemForm.value);
                    console.log('📌 Références parsées:', {
                        basePart: this.basePart,
                        indexPart: this.indexPart,
                        producerPart: this.producerPart,
                        typePart: this.typePart
                    });
                } else {
                    console.error('❌ Item non trouvé');
                }
            },
            error: (err) => console.error('❌ Erreur chargement:', err)
        });
    }

    // ✅ Ajouter un item manuellement (sans pré-sélection)
    addManualItem() {
        const emptyItem = {
            id: null,
            itemNumber: '',
            housingReferenceLeoni: '',
            housingReferenceSupplierCustomer: ''
        };
        const itemForm = this.createItemFormGroup(emptyItem);
        this.itemsArray.push(itemForm);
    }

    removeItem(index: number) {
        this.itemsArray.removeAt(index);
    }

    submit() {
        if (this.form.invalid) {
            console.log('❌ Formulaire invalide:', this.form.errors);
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        const formValue = this.form.value;

        // Vérifier que chaque item a un chargeSheetItemId
        const itemsValides = formValue.items.every((item: any) => item.chargeSheetItemId);

        if (!itemsValides) {
            alert('❌ Certains items n\'ont pas d\'ID valide');
            return;
        }

        const dto = {
            reference: formValue.reference || `TF-${Date.now()}`,
            items: formValue.items.map((item: any) => ({
                chargeSheetItemId: item.chargeSheetItemId,
                maintenanceDate: item.maintenanceDate || null,
                technicianName: item.technicianName || this.technicianName,
                xCode: item.xCode || '',
                leoniReferenceNumber: item.leoniReferenceNumber || '',
                producer: item.producer || '',
                type: item.type || '',
                referencePinePushBack: item.referencePinePushBack || '',
                position: item.position || '',
                pinRigidityM1: item.pinRigidityM1 || '',
                pinRigidityM2: item.pinRigidityM2 || '',
                pinRigidityM3: item.pinRigidityM3 || '',
                displacementPathM1: item.displacementPathM1 || '',
                displacementPathM2: item.displacementPathM2 || '',
                displacementPathM3: item.displacementPathM3 || '',
                maxSealingValueM1: item.maxSealingValueM1 || '',
                maxSealingValueM2: item.maxSealingValueM2 || '',
                maxSealingValueM3: item.maxSealingValueM3 || '',
                programmedSealingValueM1: item.programmedSealingValueM1 || '',
                programmedSealingValueM2: item.programmedSealingValueM2 || '',
                programmedSealingValueM3: item.programmedSealingValueM3 || '',
                detectionsM1: item.detectionsM1 || '',
                detectionsM2: item.detectionsM2 || '',
                detectionsM3: item.detectionsM3 || '',
                remarks: item.remarks || ''
            }))
        };

        console.log('📤 DTO envoyé:', JSON.stringify(dto, null, 2));

        this.service.create(dto).subscribe({
            next: (response) => {
                console.log('✅ Succès:', response);
                alert('✅ Dossier technique créé');
                this.router.navigate(['/technical-files/list']);
            },
            error: (err) => {
                console.error('❌ Erreur:', err);
                console.error('❌ Détail:', err.error);
                alert('❌ Erreur création: ' + (err.error?.message || 'Erreur inconnue'));
            }
        });
    }
}
