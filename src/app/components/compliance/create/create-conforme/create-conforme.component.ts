import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ComplianceService } from '../../../../../services/compliance.service';
import { ChargeSheetService } from '../../../../../services/charge-sheet.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../services/auth.service';

import { ReceptionHistory } from '../../../../../models/charge-sheet.model';
import { ComplianceDto } from '../../../../../models/compliance.model';

@Component({
  selector: 'app-create-conforme',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-conforme.component.html',
  styleUrls: ['./create-conforme.component.css']
})
export class CreateConformeComponent implements OnInit {
  chargeSheetId!: number;
  itemId!: number;
  itemNumber: string = '';
  totalModules: number = 0;
  technicianName: string = '';
  orderNumber: string = '';

  // Propriétés parsées de la référence client
  housingReferenceLeoni: string = '';
  housingReferenceSupplierCustomer: string = '';

  // Parties parsées
  basePart: string = '';
  indexPart: string = '';
  producerPart: string = '';
  typePart: string = '';

  // Quantités reçues
  quantityReceived: number = 0;
  quantityToCreate: number = 0;

  isSubmitting = false;

  // Formulaire principal avec FormArray
  mainForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private complianceService: ComplianceService,
    private chargeSheetService: ChargeSheetService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.chargeSheetId = Number(this.route.snapshot.paramMap.get('chargeSheetId'));
    this.itemId = Number(this.route.snapshot.paramMap.get('itemId'));

    this.technicianName = this.authService.getUserFullName();

    // Initialiser un formulaire vide
    this.mainForm = this.fb.group({
      modules: this.fb.array([])
    });

    this.loadItemData();
  }

  // Getter pour le FormArray
  get moduleForms(): FormArray {
    return this.mainForm.get('modules') as FormArray;
  }

  // Fonction pour parser la référence client
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
  }

  loadItemData() {
    this.chargeSheetService.getById(this.chargeSheetId).subscribe({
      next: (chargeSheet) => {
        const item = chargeSheet.items.find(i => i.id === this.itemId);
        if (item) {
          this.itemNumber = item.itemNumber || '';

          // Récupérer les quantités reçues
          this.chargeSheetService.getReceptionHistory(this.chargeSheetId).subscribe({
            next: (history: ReceptionHistory[]) => {
              // Calculer la quantité reçue pour cet item
              const itemHistory = history.filter(h => h.item.id === this.itemId);
              this.quantityReceived = itemHistory.reduce((sum, h) => sum + h.quantityReceived, 0);

              // Récupérer les fiches déjà créées
              this.complianceService.getComplianceByItem(this.itemId).subscribe({
                next: (compliances: ComplianceDto[]) => {
                  const existingCount = compliances.length;
                  this.quantityToCreate = this.quantityReceived - existingCount;

                  if (this.quantityToCreate <= 0) {
                    alert('❌ Aucune nouvelle fiche à créer. Toutes les quantités reçues ont déjà des fiches.');
                    this.router.navigate(['/charge-sheets', this.chargeSheetId, 'items', 'view']);
                    return;
                  }

                  this.totalModules = this.quantityToCreate;
                  this.orderNumber = chargeSheet.orderNumber || '';

                  this.housingReferenceLeoni = item.housingReferenceLeoni || '';
                  this.housingReferenceSupplierCustomer = item.housingReferenceSupplierCustomer || '';

                  this.parseSupplierReference(this.housingReferenceSupplierCustomer);

                  this.initForm();
                },
                error: (err) => {
                  console.error('Erreur récupération fiches existantes:', err);
                  alert('Erreur lors de la récupération des fiches existantes');
                }
              });
            },
            error: (err) => {
              console.error('Erreur récupération historique:', err);
              alert('Erreur lors de la récupération de l\'historique des réceptions');
            }
          });
        }
      },
      error: (err) => {
        console.error('Erreur récupération item', err);
        alert('Erreur lors de la récupération des données');
      }
    });
  }

  initForm() {
    // Vider le FormArray existant
    while (this.moduleForms.length) {
      this.moduleForms.removeAt(0);
    }

    console.log('=== CRÉATION DE', this.totalModules, 'FICHES DE CONFORMITÉ ===');

    // Ajouter un formulaire pour chaque module à créer
    for (let i = 0; i < this.totalModules; i++) {
      this.moduleForms.push(this.createModuleForm(i + 1));
    }
  }

  createModuleForm(moduleNumber: number): FormGroup {
    const indexValue = this.indexPart ? parseInt(this.indexPart.replace(/\D/g, '')) || 1 : 1;
    const formattedIndex = this.indexPart || '01';

    return this.fb.group({
      orderNumber: [this.orderNumber],
      orderitemNumber: [`${this.basePart || 'REF'}-${formattedIndex}-${String(moduleNumber).padStart(2, '0')}`],
      technicianName: [this.technicianName],
      testDateTime: ['', Validators.required],
      rfidNumber: [this.housingReferenceLeoni],

      leoniPartNumber: [this.basePart],
      indexValue: [indexValue],
      producer: [this.producerPart],
      type: [this.typePart],

      sequenceTestPins: [''],
      codingRequest: [''],
      secondaryLocking: [''],
      offsetTestMm: [0],
      stableOffsetTestMm: [0],
      displacementPathPushBackMm: [0],

      housingAttachments: [''],
      maxLeakTestMbar: [0],
      adjustmentLeakTestMbar: [0],
      colourVerification: [''],
      terminalAlignment: [''],

      openShuntsAirbag: [''],
      spacerClosingUnit: [''],
      specialFunctions: [''],
      contactProblemsPercentage: [0],

      qualifiedTestModule: [false],
      conditionallyQualifiedTestModule: [false],
      notQualifiedTestModule: [false],

      remarks: ['']
    });
  }

  submitAllForms() {
    if (this.mainForm.invalid) {
      alert('Veuillez remplir toutes les dates de test');
      return;
    }

    this.isSubmitting = true;
    const modules = this.moduleForms.value;
    let successCount = 0;
    let errorCount = 0;

    modules.forEach((moduleData: any, index: number) => {
      const complianceData = {
        chargeSheetId: this.chargeSheetId,
        itemId: this.itemId,
        orderNumber: moduleData.orderNumber,
        orderitemNumber: moduleData.orderitemNumber,
        technicianName: moduleData.technicianName,
        testDateTime: moduleData.testDateTime,
        rfidNumber: moduleData.rfidNumber,
        leoniPartNumber: moduleData.leoniPartNumber,
        indexValue: moduleData.indexValue,
        producer: moduleData.producer,
        type: moduleData.type,
        sequenceTestPins: moduleData.sequenceTestPins || '',
        codingRequest: moduleData.codingRequest || '',
        secondaryLocking: moduleData.secondaryLocking || '',
        offsetTestMm: moduleData.offsetTestMm || 0,
        stableOffsetTestMm: moduleData.stableOffsetTestMm || 0,
        displacementPathPushBackMm: moduleData.displacementPathPushBackMm || 0,
        housingAttachments: moduleData.housingAttachments || '',
        maxLeakTestMbar: moduleData.maxLeakTestMbar || 0,
        adjustmentLeakTestMbar: moduleData.adjustmentLeakTestMbar || 0,
        colourVerification: moduleData.colourVerification || '',
        terminalAlignment: moduleData.terminalAlignment || '',
        openShuntsAirbag: moduleData.openShuntsAirbag || '',
        spacerClosingUnit: moduleData.spacerClosingUnit || '',
        specialFunctions: moduleData.specialFunctions || '',
        contactProblemsPercentage: moduleData.contactProblemsPercentage || 0,
        qualifiedTestModule: moduleData.qualifiedTestModule || false,
        conditionallyQualifiedTestModule: moduleData.conditionallyQualifiedTestModule || false,
        notQualifiedTestModule: moduleData.notQualifiedTestModule || false,
        remarks: moduleData.remarks || ''
      };

      this.complianceService.createCompliance(complianceData).subscribe({
        next: () => {
          successCount++;
          if (successCount + errorCount === this.totalModules) {
            this.finishSubmission(successCount, errorCount);
          }
        },
        error: (err) => {
          console.error(`❌ Erreur module ${index + 1}:`, err);
          errorCount++;
          if (successCount + errorCount === this.totalModules) {
            this.finishSubmission(successCount, errorCount);
          }
        }
      });
    });
  }

  finishSubmission(success: number, errors: number) {
    this.isSubmitting = false;
    if (errors === 0) {
      alert(`✅ ${success} fiches de conformité créées avec succès !`);
      this.router.navigate(['/compliance/list']);
    } else {
      alert(`⚠️ ${success} fiches créées, ${errors} erreurs`);
    }
  }

  goBack(): void {
    if (this.chargeSheetId) {
      this.router.navigate(['/charge-sheets', this.chargeSheetId, 'items', 'view']);
    } else {
      this.router.navigate(['/charge-sheets/list']);
    }
  }
}
