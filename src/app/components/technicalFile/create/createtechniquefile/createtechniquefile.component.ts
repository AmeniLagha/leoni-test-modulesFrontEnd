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

    // Références
    housingReferenceLeoni: string = '';
    housingReferenceSupplierCustomer: string = '';

    // ✅ Parties parsées de la référence Leoni
    leoniPartNumber: string = '';      // P00838055
    leoniIndexValue: number = 0;       // 01
    leoniProducer: string = '';        // N
    leoniType: string = '';            // T


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

    /**
     * ✅ Parse la référence Leoni qui peut être dans plusieurs formats:
     * - Format 1: P00838055_01_N_T (avec underscores)
     * - Format 2: P00838055_01 NT (avec espace)
     * - Format 3: P00838055_01_NT (NT collé)
     * - Format 4: P00838055_01 (sans producer/type)
     */
    parseLeoniReference(ref: string): void {
        if (!ref) {
            console.warn('⚠️ Référence Leoni vide');
            return;
        }

        console.log('📌 Parsing référence Leoni brute:', ref);

        // Nettoyer la référence: remplacer les espaces par des underscores
        let cleanedRef = ref.trim().replace(/ /g, '_');

        // Si la référence contient "NT" collé, le séparer
        cleanedRef = cleanedRef.replace(/_NT$/g, '_N_T');
        cleanedRef = cleanedRef.replace(/NT$/g, 'N_T');

        const parts = cleanedRef.split('_');
        console.log('📌 Parties après nettoyage:', parts);

        // Part Number (ex: P00838055)
        if (parts.length >= 1) {
            this.leoniPartNumber = parts[0];
        }

        // Index (ex: 01)
        if (parts.length >= 2) {
            const indexStr = parts[1].replace(/\D/g, ''); // Garder seulement les chiffres
            this.leoniIndexValue = parseInt(indexStr, 10) || 1;
        }

        // Producer (ex: N) - peut être combiné avec Type
        if (parts.length >= 3) {
            let producerValue = parts[2];
            // Si producer contient deux lettres (ex: "NT"), les séparer
            if (producerValue.length === 2 && /^[A-Z]{2}$/.test(producerValue)) {
                this.leoniProducer = producerValue.charAt(0); // N
                this.leoniType = producerValue.charAt(1);      // T
            } else {
                this.leoniProducer = producerValue;
            }
        }

        // Type (ex: T) - si pas déjà défini
        if (parts.length >= 4 && !this.leoniType) {
            this.leoniType = parts[3];
        }

        // Si on a toujours pas de type, essayer de l'extraire du producer
        if (!this.leoniType && this.leoniProducer && this.leoniProducer.length > 1) {
            this.leoniType = this.leoniProducer.charAt(1);
            this.leoniProducer = this.leoniProducer.charAt(0);
        }

        console.log('✅ Référence Leoni parsée:', {
            referenceOriginale: ref,
            leoniPartNumber: this.leoniPartNumber,
            leoniIndexValue: this.leoniIndexValue,
            leoniProducer: this.leoniProducer,
            leoniType: this.leoniType
        });
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
        // ✅ Utiliser les valeurs parsées de la référence Leoni
        const formattedIndex = String(this.leoniIndexValue).padStart(2, '0');

        console.log(`📝 Création formulaire item: producer="${this.leoniProducer}", type="${this.leoniType}"`);

        return this.fb.group({
            chargeSheetItemId: [item.id, Validators.required],
            itemNumber: [item.itemNumber],
            maintenanceDate: [''],
            technicianName: [this.technicianName],
            xCode: [''],
            leoniReferenceNumber: [this.leoniPartNumber],      // ✅ Utiliser le part number parsé
            indexValue: [this.leoniIndexValue],                // ✅ Utiliser l'index parsé
            producer: [this.leoniProducer],                    // ✅ Utiliser le producer parsé
            type: [this.leoniType],                            // ✅ Utiliser le type parsé
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
                    // ✅ Récupérer les références
                    this.housingReferenceLeoni = item.housingReferenceLeoni || '';
                    this.housingReferenceSupplierCustomer = item.housingReferenceSupplierCustomer || '';
                    // ✅ Parser la référence Leoni (celle qu'on utilise)
                    this.parseLeoniReference(this.housingReferenceLeoni);

                    // ✅ Créer le formulaire avec les valeurs parsées
                    const itemForm = this.createItemFormGroup(item);
                    this.itemsArray.push(itemForm);

                    console.log('✅ Item chargé:', item);
                    console.log('📝 Formulaire créé:', itemForm.value);
                    console.log('📌 Références parsées (Leoni):', {
                        leoniPartNumber: this.leoniPartNumber,
                        leoniIndexValue: this.leoniIndexValue,
                        leoniProducer: this.leoniProducer,
                        leoniType: this.leoniType
                    });
                } else {
                    console.error('❌ Item non trouvé');
                }
            },
            error: (err) => console.error('❌ Erreur chargement:', err)
        });
    }

    // ✅ Ajouter un item manuellement (avec valeurs par défaut)
    addManualItem() {
        const emptyItem = {
            id: null,
            itemNumber: '',
            housingReferenceLeoni: '',
            housingReferenceSupplierCustomer: ''
        };

        // Réinitialiser les valeurs parsées pour l'item manuel
        this.leoniPartNumber = '';
        this.leoniIndexValue = 0;
        this.leoniProducer = '';
        this.leoniType = '';

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
                indexValue: item.indexValue || 0,
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
