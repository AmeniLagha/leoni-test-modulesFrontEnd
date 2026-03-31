import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChargeSheetService } from '../../../../../services/charge-sheet.service';
import { ChargeSheetComplete, ChargeSheetItemDto, ReceptionHistoryDto } from '../../../../../models/charge-sheet.model';
import { AuthService } from '../../../../../services/auth.service';
import { UploadService } from '../../../../../services/upload.service';
import { TechnicalFileListItem } from '../../../../../models/technical-file.model';
import { TechnicalFileService } from '../../../../../services/technical-file.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import * as ExcelJS from 'exceljs';
import { PrepareCompliance } from '../../../../../models/compliance.model';
import { ComplianceService } from '../../../../../services/compliance.service';
@Component({
  selector: 'app-charge-sheet-items-view',
  standalone: true,
  imports: [CommonModule, RouterLink,ReactiveFormsModule],
  templateUrl: './charge-sheet-items-view.component.html',
  styleUrls: ['./charge-sheet-items-view.component.css']
})
export class ChargeSheetItemsViewComponent implements OnInit {
  chargeSheetId: number | null = null;
  chargeSheet: ChargeSheetComplete | null = null;
  loading = true;
  error: string | null = null;
   itemImages: { [key: number]: string } = {};
 // Pour la modal
 // charge-sheet-items-view.component.t
  showModal = false;
  availableTechnicalFiles: TechnicalFileListItem[] = [];
  selectedTechnicalFileId: number | null = null;
  currentItem: ChargeSheetItemDto | null = null;
  itemForm: FormGroup;
   technicianName: string = '';
   // Propriétés parsées de la référence client
    housingReferenceLeoni: string = '';
    housingReferenceSupplierCustomer: string = '';

    // Parties parsées
    basePart: string = '';
    indexPart: string = '';
    producerPart: string = '';
    typePart: string = '';
  // Sections pour organiser l'affichage
  sections = [
    { key: 'general', label: 'Informations générales', fields: [] as string[] },
    { key: 'housing', label: 'Housing Tests', fields: this.getHousingFields() },
    { key: 'fastening', label: 'Fastening / Assembly', fields: this.getFasteningFields() },
    { key: 'cable', label: 'Cable / Conduit', fields: this.getCableFields() },
    { key: 'electrical', label: 'Electrical / Tests', fields: this.getElectricalFields() },
    { key: 'price', label: 'Prix', fields: ['unitPrice', 'totalPrice'] }
  ];

  // Ajoutez ces propriétés dans la classe
existingCompliances: Map<number, boolean> = new Map(); // Pour suivre les items qui ont déjà des fiches

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    public chargeSheetService: ChargeSheetService,
    private authService: AuthService, private uploadService: UploadService,private technicalFileService: TechnicalFileService,
  private fb: FormBuilder , private complianceService: ComplianceService
) {  this.itemForm = this.fb.group({
      position: [''],
       technicianName: [''],
    maintenanceDate: [''],
    xCode: [''],
    leoniReferenceNumber: [''],
    indexValue: [''],      // ✅ AJOUTÉ
    producer: [''],        // ✅ AJOUTÉ
    type: [''],
       referencePinePushBack: [''],
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
    });}

  ngOnInit(): void {
 this.technicianName = this.authService.getUserFullName();
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.chargeSheetId = +idParam;
      this.loadChargeSheet();
    } else {
      this.error = 'ID du cahier manquant';
      this.loading = false;

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
  // Dans le composant
openImageModal(imageUrl: string): void {
  // Option 1: Ouvrir dans un nouvel onglet
  window.open(imageUrl, '_blank');

  // Option 2: Ou utiliser une modal (si vous avez une librairie)
  // this.modalService.open(imageUrl);
}
// Méthode pour charger les images
  loadItemImages(): void {
    if (!this.chargeSheet?.items) return;

    this.chargeSheet.items.forEach(item => {
      if (item.id && item.realConnectorPicture) {
        this.uploadService.getImageUrl(item.realConnectorPicture).subscribe({
          next: (url) => {
            this.itemImages[item.id!] = url;
          },
          error: (err) => {
            console.error(`Erreur chargement image pour l'item ${item.id}:`, err);
          }
        });
      }
    });
  }
  // Méthodes pour obtenir les listes de champs (les mêmes que dans le composant technique)
  private getHousingFields(): string[] {
    return [
      'outsideHousingExist', 'insideHousingExist', 'coverHoodExist', 'coverHoodClosed',
      'capExist', 'bayonetCapExist', 'bracketExist', 'bracketOpen', 'bracketClosed',
      'latchWingExist', 'sliderExist', 'sliderOpen', 'sliderClosed',
      'secondaryLockExist', 'secondaryLockOpen', 'secondaryLockClosed'
    ];
  }

  private getFasteningFields(): string[] {
    return [
      'offsetTest', 'pushBackTest', 'terminalOrientation', 'terminalDifferentiation',
      'ringTerminal', 'singleContact', 'heatShrinkExist', 'openShuntsAirbag', 'flowTest',
      'solidMetalContour', 'metalContourAdjustable', 'metalRailsFasteningSystem',
      'metalPlatesFasteningSystem', 'spacerClosingUnit', 'spring'
    ];
  }

  private getCableFields(): string[] {
    return [
      'cableTieExist', 'cableTieLeft', 'cableTieRight', 'cableTieMiddle', 'cableTieLeftRight',
      'clipExist', 'screwExist', 'nutExist', 'convolutedConduitExist', 'convolutedConduitClosed',
      'cableChannelExist', 'cableChannelClosed', 'grommetExist', 'grommetOrientation',
      'presenceTestOfOneSideConnectedShield', 'antennaOnlyPresenceTest', 'antennaOnlyContactingOfShield',
      'antennaContactingOfShieldAndCoreWire', 'otherDetection'
    ];
  }

  private getElectricalFields(): string[] {
    return [
      'mechanicalCoding', 'electricalCoding', 'airbagTestViaServiceWindow', 'leakTestPressure',
      'leakTestVacuum', 'leakTestComplex', 'pinStraightnessCheck', 'contrastDetectionGreyValueSensor',
      'colourDetection', 'colourDetectionPrepared', 'attenuationWithModeScrambler',
      'attenuationWithoutModeScrambler', 'insulationResistance', 'highVoltageModule',
      'kelvinMeasurementHV', 'actuatorTestHV', 'chargingSystemElectrical', 'ptuPipeTestUnit',
      'gtuGrommetTestUnit', 'ledLEDTestModule', 'tigTerminalInsertionGuidance', 'linBusFunctionalityTest',
      'canBusFunctionalityTest', 'esdConformModule', 'fixedBlock', 'movingBlock', 'tiltModule',
      'slideModule', 'handAdapter', 'lsmLeoniSmartModule', 'leoniStandardTestTable',
      'quickConnectionByCanonConnector', 'testBoard', 'weetech', 'bak', 'ogc', 'adaptronicHighVoltage',
      'emdepHVBananaPlug', 'leoniEMOStandardHV', 'clipOrientation'
    ];
  }

  // Formater la valeur pour l'affichage
  formatValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (value === '*') return '✓ Oui';
    if (value === '') return '✗ Non';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (typeof value === 'number') return value.toString();
    return String(value);
  }

  // Formater le label
  formatLabel(key: string): string {
    const labels: { [key: string]: string } = {
      // Informations générales
      id: 'ID',
      plant: 'Plant',
      project: 'Projet',
      harnessRef: 'Réf. Harness',
      issuedBy: 'Émis par',
      emailAddress: 'Email',
      phoneNumber: 'Téléphone',
      orderNumber: 'N° Commande',
      costCenterNumber: 'Centre coût',
      date: 'Date création',
      preferredDeliveryDate: 'Date livraison',
      status: 'Statut',
      createdBy: 'Créé par',
      createdAt: 'Créé le',
      updatedBy: 'Modifié par',
      updatedAt: 'Modifié le',

      // Informations item
      itemNumber: 'N° Item',
      samplesExist: 'Échantillons',
      ways: 'Voies',
      housingColour: 'Couleur',
      testModuleExistInDatabase: 'Module en base',
      housingReferenceLeoni: 'Réf. Leoni',
      housingReferenceSupplierCustomer: 'Réf. client',
      referenceSealsClipsCableTiesCap: 'Réf. joints/clips',
      realConnectorPicture: 'Image',
      quantityOfTestModules: 'Quantité',
      itemStatus: 'Statut item',

      // Housing
      outsideHousingExist: 'Outside Housing',
      insideHousingExist: 'Inside Housing',
      coverHoodExist: 'Cover/Hood',
      coverHoodClosed: 'Cover/Hood Closed',
      capExist: 'Cap',
      bayonetCapExist: 'Bayonet Cap',
      bracketExist: 'Bracket',
      bracketOpen: 'Bracket Open',
      bracketClosed: 'Bracket Closed',
      latchWingExist: 'Latch/Wing',
      sliderExist: 'Slider',
      sliderOpen: 'Slider Open',
      sliderClosed: 'Slider Closed',
      secondaryLockExist: 'Secondary Lock',
      secondaryLockOpen: 'Secondary Lock Open',
      secondaryLockClosed: 'Secondary Lock Closed',

      // Fastening
      offsetTest: 'Offset Test',
      pushBackTest: 'Push Back Test',
      terminalOrientation: 'Terminal Orientation',
      terminalDifferentiation: 'Terminal Differentiation',
      ringTerminal: 'Ring Terminal',
      singleContact: 'Single Contact',
      heatShrinkExist: 'Heat Shrink',
      openShuntsAirbag: 'Open Shunts',
      flowTest: 'Flow Test',
      solidMetalContour: 'Solid Metal Contour',
      metalContourAdjustable: 'Metal Contour Adjustable',
      metalRailsFasteningSystem: 'Metal Rails Fastening',
      metalPlatesFasteningSystem: 'Metal Plates Fastening',
      spacerClosingUnit: 'Spacer Closing Unit',
      spring: 'Spring',

      // Cable
      cableTieExist: 'Cable Tie',
      cableTieLeft: 'Cable Tie Left',
      cableTieRight: 'Cable Tie Right',
      cableTieMiddle: 'Cable Tie Middle',
      cableTieLeftRight: 'Cable Tie Left/Right',
      clipExist: 'Clip',
      screwExist: 'Screw',
      nutExist: 'Nut',
      convolutedConduitExist: 'Convoluted Conduit',
      convolutedConduitClosed: 'Convoluted Conduit Closed',
      cableChannelExist: 'Cable Channel',
      cableChannelClosed: 'Cable Channel Closed',
      grommetExist: 'Grommet',
      grommetOrientation: 'Grommet Orientation',
      presenceTestOfOneSideConnectedShield: 'One-side Shield Test',
      antennaOnlyPresenceTest: 'Antenna Presence',
      antennaOnlyContactingOfShield: 'Antenna Shield Contact',
      antennaContactingOfShieldAndCoreWire: 'Antenna Shield+Core',
      otherDetection: 'Other Detection',

      // Electrical
      mechanicalCoding: 'Mechanical Coding',
      electricalCoding: 'Electrical Coding',
      airbagTestViaServiceWindow: 'Airbag Test',
      leakTestPressure: 'Leak Test Pressure',
      leakTestVacuum: 'Leak Test Vacuum',
      leakTestComplex: 'Leak Test Complex',
      pinStraightnessCheck: 'Pin Straightness',
      contrastDetectionGreyValueSensor: 'Contrast Detection',
      colourDetection: 'Colour Detection',
      colourDetectionPrepared: 'Colour Detection Prepared',
      attenuationWithModeScrambler: 'Attenuation (with)',
      attenuationWithoutModeScrambler: 'Attenuation (without)',
      insulationResistance: 'Insulation Resistance',
      highVoltageModule: 'High Voltage Module',
      kelvinMeasurementHV: 'Kelvin Measurement HV',
      actuatorTestHV: 'Actuator Test HV',
      chargingSystemElectrical: 'Charging System',
      ptuPipeTestUnit: 'PTU',
      gtuGrommetTestUnit: 'GTU',
      ledLEDTestModule: 'LED Test',
      tigTerminalInsertionGuidance: 'TIG',
      linBusFunctionalityTest: 'LIN Bus',
      canBusFunctionalityTest: 'CAN Bus',
      esdConformModule: 'ESD Conform',
      fixedBlock: 'Fixed Block',
      movingBlock: 'Moving Block',
      tiltModule: 'Tilt Module',
      slideModule: 'Slide Module',
      handAdapter: 'Hand Adapter',
      lsmLeoniSmartModule: 'LSM',
      leoniStandardTestTable: 'Leoni Standard',
      quickConnectionByCanonConnector: 'Quick Connection',
      testBoard: 'Test Board',
      weetech: 'WEETECH',
      bak: 'BAK',
      ogc: 'OGC',
      adaptronicHighVoltage: 'Adaptronic HV',
      emdepHVBananaPlug: 'EMDEP HV',
      leoniEMOStandardHV: 'LEONI EMO HV',
      clipOrientation: 'Clip Orientation',
      unitPrice: 'Prix unitaire (DT)',
      totalPrice: 'Prix total (DT)'
    };
    return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  get canEditTech(): boolean {
    return this.authService.hasPermission(['charge_sheet:tech:write']);
  }

  goBack(): void {
    if (this.chargeSheetId) {
      this.router.navigate(['/charge-sheets/list']);
    }
  }
  // Dans charge-sheet-items-view.component.ts

// Vérifier si un champ est un booléen (pour le formatage spécial)
isBooleanField(field: string): boolean {
  const booleanFields = [
    'outsideHousingExist', 'insideHousingExist', 'coverHoodExist', 'coverHoodClosed',
    'capExist', 'bayonetCapExist', 'bracketExist', 'bracketOpen', 'bracketClosed',
    'latchWingExist', 'sliderExist', 'sliderOpen', 'sliderClosed',
    'secondaryLockExist', 'secondaryLockOpen', 'secondaryLockClosed',
    'offsetTest', 'pushBackTest', 'terminalOrientation', 'terminalDifferentiation',
    'ringTerminal', 'singleContact', 'heatShrinkExist', 'openShuntsAirbag', 'flowTest',
    'solidMetalContour', 'metalContourAdjustable', 'metalRailsFasteningSystem',
    'metalPlatesFasteningSystem', 'spacerClosingUnit', 'spring',
    'cableTieExist', 'cableTieLeft', 'cableTieRight', 'cableTieMiddle', 'cableTieLeftRight',
    'clipExist', 'screwExist', 'nutExist', 'convolutedConduitExist', 'convolutedConduitClosed',
    'cableChannelExist', 'cableChannelClosed', 'grommetExist',
    'presenceTestOfOneSideConnectedShield', 'antennaOnlyPresenceTest',
    'antennaOnlyContactingOfShield', 'antennaContactingOfShieldAndCoreWire', 'otherDetection',
    'mechanicalCoding', 'electricalCoding', 'airbagTestViaServiceWindow', 'leakTestPressure',
    'leakTestVacuum', 'leakTestComplex', 'pinStraightnessCheck',
    'contrastDetectionGreyValueSensor', 'colourDetection', 'colourDetectionPrepared',
    'attenuationWithModeScrambler', 'attenuationWithoutModeScrambler', 'insulationResistance',
    'highVoltageModule', 'kelvinMeasurementHV', 'actuatorTestHV', 'chargingSystemElectrical',
    'ptuPipeTestUnit', 'gtuGrommetTestUnit', 'ledLEDTestModule', 'tigTerminalInsertionGuidance',
    'linBusFunctionalityTest', 'canBusFunctionalityTest', 'esdConformModule', 'fixedBlock',
    'movingBlock', 'tiltModule', 'slideModule', 'handAdapter', 'lsmLeoniSmartModule',
    'leoniStandardTestTable', 'quickConnectionByCanonConnector'
  ];
  return booleanFields.includes(field);
}

// Formater un champ spécifique
formatFieldValue(item: ChargeSheetItemDto, field: string): string {
  const value = (item as any)[field];
  if (value === null || value === undefined) return '-';
  if (this.isBooleanField(field)) {
    return value === '*' ? '✓ Oui' : '✗ Non';
  }
  return String(value);
}

// Vérifier si un item a au moins un champ rempli dans une section
hasAnyField(item: ChargeSheetItemDto, fields: string[]): boolean {
  return fields.some(field => {
    const value = (item as any)[field];
    return value !== null && value !== undefined && value !== '';
  });
}

goToCreatetechnicalfile(item: ChargeSheetItemDto): void {
  if (!this.chargeSheetId || !item.id) return;

  this.router.navigate([
    '/technical-files',
    'charge-sheets',
    this.chargeSheetId,
    'items',
    item.id,
    'create-fichietechnique'   // ✅ correction ici
  ]);
}

get canCreateCompliance(): boolean {
    return this.authService.hasPermission(['compliance:create']);
  }
  get canCreatetechnicalfile(): boolean {
    return this.authService.hasPermission(['technical_file:create']);
  }
  // ✅ Créer un nouveau dossier technique
  createNewTechnicalFile(item: ChargeSheetItemDto) {
  if (!this.chargeSheetId || !item.id) return;

  this.router.navigate([
    '/technical-files',
    'charge-sheets',
    this.chargeSheetId,   // valeur réelle
    'items',
    item.id,              // valeur réelle
    'create-fichietechnique'
  ]);
}



// Modifiez openAddToExistingModal pour pré-remplir les champs avec les données de l'item
openAddToExistingModal(item: ChargeSheetItemDto) {
  this.currentItem = item;

  // ✅ Pré-remplir avec les données de l'item
  this.itemForm.reset({
    technicianName: this.technicianName,
    maintenanceDate: '',
    xCode: '',
    leoniReferenceNumber: item.housingReferenceSupplierCustomer?.split('_')[0] || '',  // base part
    indexValue: item.housingReferenceSupplierCustomer?.split('_')[1] || '', // index part
    producer: item.housingReferenceSupplierCustomer?.split('_')[2] || '',              // producer
    type: item.housingReferenceSupplierCustomer?.split('_')[3] || '',                  // type
    referencePinePushBack: '',
    position: '',
    pinRigidityM1: '',
    pinRigidityM2: '',
    pinRigidityM3: '',
    displacementPathM1: '',
    displacementPathM2: '',
    displacementPathM3: '',
    maxSealingValueM1: '',
    maxSealingValueM2: '',
    maxSealingValueM3: '',
    programmedSealingValueM1: '',
    programmedSealingValueM2: '',
    programmedSealingValueM3: '',
    detectionsM1: '',
    detectionsM2: '',
    detectionsM3: '',
    remarks: ''
  });

  // Charger la liste des dossiers disponibles
  this.technicalFileService.getList().subscribe({
    next: (files) => {
      this.availableTechnicalFiles = files;
      this.showModal = true;
    },
    error: (err) => {
      console.error('Erreur chargement dossiers:', err);
      alert('Impossible de charger la liste des dossiers');
    }
  });
}

// Modifiez addToExistingTechnicalFile pour inclure tous les champs
addToExistingTechnicalFile() {
  if (!this.selectedTechnicalFileId || !this.currentItem?.id) {
    alert('❌ Veuillez sélectionner un dossier');
    return;
  }

  const formValue = this.itemForm.value;

  const dto = {
    chargeSheetItemId: this.currentItem.id,
    technicianName: formValue.technicianName || '',
    maintenanceDate: formValue.maintenanceDate || null,
    xCode: formValue.xCode || '',
    leoniReferenceNumber: formValue.leoniReferenceNumber || '',
    indexValue: formValue.indexValue || '',      // ✅ AJOUTÉ
    producer: formValue.producer || '',          // ✅ AJOUTÉ
    type: formValue.type || '',                  // ✅ AJOUTÉ
    referencePinePushBack: formValue.referencePinePushBack || '',
    position: formValue.position || '',
    pinRigidityM1: formValue.pinRigidityM1 || '',
    pinRigidityM2: formValue.pinRigidityM2 || '',
    pinRigidityM3: formValue.pinRigidityM3 || '',
    displacementPathM1: formValue.displacementPathM1 || '',
    displacementPathM2: formValue.displacementPathM2 || '',
    displacementPathM3: formValue.displacementPathM3 || '',
    maxSealingValueM1: formValue.maxSealingValueM1 || '',
    maxSealingValueM2: formValue.maxSealingValueM2 || '',
    maxSealingValueM3: formValue.maxSealingValueM3 || '',
    programmedSealingValueM1: formValue.programmedSealingValueM1 || '',
    programmedSealingValueM2: formValue.programmedSealingValueM2 || '',
    programmedSealingValueM3: formValue.programmedSealingValueM3 || '',
    detectionsM1: formValue.detectionsM1 || '',
    detectionsM2: formValue.detectionsM2 || '',
    detectionsM3: formValue.detectionsM3 || '',
    remarks: formValue.remarks || 'Ajouté depuis le cahier des charges'
  };

  console.log('📤 DTO envoyé (tous champs):', dto);

  this.technicalFileService.addItemToTechnicalFile(this.selectedTechnicalFileId, dto).subscribe({
    next: () => {
      alert('✅ Item ajouté au dossier technique avec succès');
      this.closeModal();
    },
    error: (err) => {
      console.error('❌ Erreur ajout:', err);
      alert('❌ Erreur lors de l\'ajout: ' + (err.error?.message || err.message));
    }
  });
}
async exportToExcelWithImages(): Promise<void> {
  // ✅ Vérification que chargeSheet et items existent
  if (!this.chargeSheet) {
    alert("Aucune donnée à exporter");
    return;
  }

  const items = this.chargeSheet.items;
  if (!items || items.length === 0) {
    alert("Aucun item à exporter");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Items');

  // ===== AJOUT DES INFORMATIONS GÉNÉRALES DU CAHIER =====
  // Ligne 1: Titre "Cahier de charge"
  const titleRow = worksheet.addRow(['CAHIER DE CHARGE #' + this.chargeSheet.id]);
  titleRow.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A5F' }
  };
  titleRow.height = 35;
  worksheet.mergeCells(1, 1, 1, 15); // Fusionner sur 15 colonnes

  // Ligne 2-13: Informations générales (2 colonnes)
  const infoData = [
    ['Plant:', this.chargeSheet.plant || ''],
    ['Projet:', this.chargeSheet.project || ''],
    ['Harness Ref:', this.chargeSheet.harnessRef || ''],
    ['Issued By:', this.chargeSheet.issuedBy || ''],
    ['Email:', this.chargeSheet.emailAddress || ''],
    ['Téléphone:', this.chargeSheet.phoneNumber || ''],
    ['N° Commande:', this.chargeSheet.orderNumber || ''],
    ['Centre coût:', this.chargeSheet.costCenterNumber || ''],
    ['Date création:', this.chargeSheet.date ? new Date(this.chargeSheet.date).toLocaleDateString('fr-FR') : ''],
    ['Date livraison:', this.chargeSheet.preferredDeliveryDate ? new Date(this.chargeSheet.preferredDeliveryDate).toLocaleDateString('fr-FR') : ''],
    ['Statut:', this.chargeSheetService.getStatusLabel(this.chargeSheet.status) || '']
  ];

  infoData.forEach(([label, value]) => {
    const row = worksheet.addRow([label, value]);
    row.getCell(1).font = { bold: true };
    row.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF2F2F2' }
    };
    row.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFFFF' }
    };
    row.height = 20;
  });

  // Ajouter une ligne vide
  worksheet.addRow([]);

  // ===== DÉFINITION DES COLONNES (sans en-têtes) =====
  // On définit seulement les largeurs et les clés, PAS les en-têtes
  const generalCols = [
    { key: 'id', width: 8 },
    { key: 'itemNumber', width: 8 },
    { key: 'samplesExist', width: 8 },
    { key: 'ways', width: 6 },
    { key: 'housingColour', width: 10 },
    { key: 'testModuleExistInDatabase', width: 10 },
    { key: 'housingReferenceLeoni', width: 15 },
    { key: 'housingReferenceSupplierCustomer', width: 15 },
    { key: 'referenceSealsClipsCableTiesCap', width: 12 },
    { key: 'photo', width: 12 },
    { key: 'quantityOfTestModules', width: 8 },
    { key: 'outsideHousingExist', width: 8 },
    { key: 'insideHousingExist', width: 8 },
    { key: 'coverHoodExist', width: 8 },
    { key: 'coverHoodClosed', width: 10 },
    { key: 'capExist', width: 6 },
    { key: 'bayonetCapExist', width: 8 },
    { key: 'bracketExist', width: 8 },
    { key: 'bracketOpen', width: 10 },
    { key: 'bracketClosed', width: 10 },
    { key: 'latchWingExist', width: 8 },
    { key: 'sliderExist', width: 8 },
    { key: 'sliderOpen', width: 10 },
    { key: 'sliderClosed', width: 10 },
    { key: 'secondaryLockExist', width: 8 },
    { key: 'secondaryLockOpen', width: 10 },
    { key: 'secondaryLockClosed', width: 12 },
    { key: 'offsetTest', width: 8 },
    { key: 'pushBackTest', width: 8 },
    { key: 'terminalOrientation', width: 10 },
    { key: 'terminalDifferentiation', width: 10 },
    { key: 'ringTerminal', width: 8 },
    { key: 'singleContact', width: 10 },
    { key: 'heatShrinkExist', width: 8 },
    { key: 'openShuntsAirbag', width: 8 },
    { key: 'flowTest', width: 8 },
    { key: 'solidMetalContour', width: 8 },
    { key: 'metalContourAdjustable', width: 8 },
    { key: 'metalRailsFasteningSystem', width: 10 },
    { key: 'metalPlatesFasteningSystem', width: 10 },
    { key: 'spacerClosingUnit', width: 8 },
    { key: 'spring', width: 8 },
    { key: 'cableTieExist', width: 8 },
    { key: 'cableTieLeft', width: 8 },
    { key: 'cableTieRight', width: 8 },
    { key: 'cableTieMiddle', width: 8 },
    { key: 'cableTieLeftRight', width: 8 },
    { key: 'clipExist', width: 6 },
    { key: 'screwExist', width: 6 },
    { key: 'nutExist', width: 6 },
    { key: 'convolutedConduitExist', width: 8 },
    { key: 'convolutedConduitClosed', width: 10 },
    { key: 'cableChannelExist', width: 8 },
    { key: 'cableChannelClosed', width: 10 },
    { key: 'grommetExist', width: 8 },
    { key: 'grommetOrientation', width: 12 },
    { key: 'presenceTestOfOneSideConnectedShield', width: 12 },
    { key: 'antennaOnlyPresenceTest', width: 10 },
    { key: 'antennaOnlyContactingOfShield', width: 12 },
    { key: 'antennaContactingOfShieldAndCoreWire', width: 12 },
    { key: 'otherDetection', width: 10 },
    { key: 'mechanicalCoding', width: 10 },
    { key: 'electricalCoding', width: 10 },
    { key: 'airbagTestViaServiceWindow', width: 8 },
    { key: 'leakTestPressure', width: 8 },
    { key: 'leakTestVacuum', width: 8 },
    { key: 'leakTestComplex', width: 10 },
    { key: 'pinStraightnessCheck', width: 10 },
    { key: 'contrastDetectionGreyValueSensor', width: 8 },
    { key: 'colourDetection', width: 10 },
    { key: 'colourDetectionPrepared', width: 10 },
    { key: 'attenuationWithModeScrambler', width: 8 },
    { key: 'attenuationWithoutModeScrambler', width: 10 },
    { key: 'insulationResistance', width: 8 },
    { key: 'highVoltageModule', width: 8 },
    { key: 'kelvinMeasurementHV', width: 8 },
    { key: 'actuatorTestHV', width: 8 },
    { key: 'chargingSystemElectrical', width: 10 },
    { key: 'ptuPipeTestUnit', width: 5 },
    { key: 'gtuGrommetTestUnit', width: 5 },
    { key: 'ledLEDTestModule', width: 5 },
    { key: 'tigTerminalInsertionGuidance', width: 5 },
    { key: 'linBusFunctionalityTest', width: 5 },
    { key: 'canBusFunctionalityTest', width: 5 },
    { key: 'esdConformModule', width: 5 },
    { key: 'fixedBlock', width: 8 },
    { key: 'movingBlock', width: 8 },
    { key: 'tiltModule', width: 5 },
    { key: 'slideModule', width: 5 },
    { key: 'handAdapter', width: 10 },
    { key: 'lsmLeoniSmartModule', width: 5 },
    { key: 'leoniStandardTestTable', width: 8 },
    { key: 'quickConnectionByCanonConnector', width: 10 },
    { key: 'testBoard', width: 8 },
    { key: 'weetech', width: 8 },
    { key: 'bak', width: 5 },
    { key: 'ogc', width: 5 },
    { key: 'adaptronicHighVoltage', width: 8 },
    { key: 'emdepHVBananaPlug', width: 8 },
    { key: 'leoniEMOStandardHV', width: 10 },
    { key: 'clipOrientation', width: 10 },
    { key: 'unitPrice', width: 12 },
    { key: 'totalPrice', width: 12 }
  ];

  worksheet.columns = generalCols;

  // ✅ Vérification que worksheet.lastRow existe
  const lastRow = worksheet.lastRow;
  if (!lastRow) {
    console.error("Erreur: impossible de déterminer la dernière ligne");
    return;
  }

  // ===== AJOUT DES EN-TÊTES GROUPÉS =====
  // La ligne où commencent les en-têtes (après les infos générales)
  const headerRowNumber = lastRow.number + 1;

  // Calculer les positions pour les titres de groupes
  // Général: colonnes 1-11
  const generalStart = 1;
  const generalEnd = 11;

  // Housing: colonnes 12-27
  const housingStart = 12;
  const housingEnd = 27;

  // Fastening: colonnes 28-42
  const fasteningStart = 28;
  const fasteningEnd = 42;

  // Cable: colonnes 43-61
  const cableStart = 43;
  const cableEnd = 61;

  // Electrical: colonnes 62-101
  const electricalStart = 62;
  const electricalEnd = 101;

  // Prix: colonnes 102-103
  const priceStart = 102;
  const priceEnd = 103;

  // Ajouter la ligne des titres de groupes
  const headerRow = worksheet.addRow([]);

  headerRow.getCell(generalStart).value = 'Général';
  worksheet.mergeCells(headerRowNumber, generalStart, headerRowNumber, generalEnd);

  headerRow.getCell(housingStart).value = 'Housing Tests';
  worksheet.mergeCells(headerRowNumber, housingStart, headerRowNumber, housingEnd);

  headerRow.getCell(fasteningStart).value = 'Fastening / Assembly';
  worksheet.mergeCells(headerRowNumber, fasteningStart, headerRowNumber, fasteningEnd);

  headerRow.getCell(cableStart).value = 'Cable / Conduit';
  worksheet.mergeCells(headerRowNumber, cableStart, headerRowNumber, cableEnd);

  headerRow.getCell(electricalStart).value = 'Electrical / Tests';
  worksheet.mergeCells(headerRowNumber, electricalStart, headerRowNumber, electricalEnd);

  headerRow.getCell(priceStart).value = 'Prix';
  worksheet.mergeCells(headerRowNumber, priceStart, headerRowNumber, priceEnd);

  // Styliser les titres de groupes
  headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4E73DF' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // ===== AJOUT DES SOUS-EN-TÊTES (noms des colonnes) =====
  const subHeaderRow = worksheet.addRow([
    'ID', 'Item', 'Échant.', 'Voies', 'Couleur', 'Module DB', 'Réf. Leoni', 'Réf. client', 'Réf. joints', 'Photo', 'Quantité',
    'Outside', 'Inside', 'Cover', 'Cover Closed', 'Cap', 'Bayonet', 'Bracket', 'Bracket Open', 'Bracket Closed', 'Latch', 'Slider', 'Slider Open', 'Slider Closed', 'Sec Lock', 'Sec Lock Open', 'Sec Lock Closed',
    'Offset', 'PushBack', 'Term Orient', 'Term Diff', 'Ring Term', 'Single Contact', 'HeatShrink', 'OpenShunts', 'FlowTest', 'SolidMetal', 'MetalAdj', 'MetalRails', 'MetalPlates', 'Spacer', 'Spring',
    'CableTie', 'Tie Left', 'Tie Right', 'Tie Middle', 'Tie L/R', 'Clip', 'Screw', 'Nut', 'Conduit', 'Conduit Closed', 'Channel', 'Channel Closed', 'Grommet', 'Grommet Orient', 'OneSideShield', 'AntennaPres', 'AntennaShield', 'AntennaCore', 'OtherDetect',
    'MechCoding', 'ElecCoding', 'Airbag', 'LeakPress', 'LeakVac', 'LeakComplex', 'PinStraight', 'Contrast', 'ColourDetect', 'ColourPrep', 'AttenWith', 'AttenWithout', 'Insulation', 'HVModule', 'KelvinHV', 'ActuatorHV', 'ChargingSys', 'PTU', 'GTU', 'LED', 'TIG', 'LIN', 'CAN', 'ESD', 'FixedBlock', 'MovingBlock', 'Tilt', 'Slide', 'HandAdapter', 'LSM', 'LeoniStd', 'QuickConn', 'TestBoard', 'WEETECH', 'BAK', 'OGC', 'Adaptronic', 'EMDEP', 'LEONI EMO', 'ClipOrient',
    'Prix unitaire', 'Prix total'
  ]);

  subHeaderRow.font = { bold: true };
  subHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF8F9FC' }
  };
  subHeaderRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  subHeaderRow.height = 30;

  // ===== TRAITEMENT DES DONNÉES =====
  const itemsLength = items.length;
  const dataStartRow = subHeaderRow.number + 1;

  for (let i = 0; i < itemsLength; i++) {
    const item = items[i];
    const rowIndex = dataStartRow + i;

    // Fonction pour formater les valeurs
    const formatValue = (value: any): string => {
      if (value === null || value === undefined) return '';
      if (value === '*') return '✓';
      if (value === '') return '✗';
      if (typeof value === 'boolean') return value ? '✓' : '✗';
      if (value === 'Yes') return 'Oui';
      if (value === 'No') return 'Non';
      return String(value);
    };

    // Créer l'objet rowData avec les clés correspondant exactement aux colonnes
    const rowData: any = {};

    // Général
    rowData.id = item.id;
    rowData.itemNumber = item.itemNumber ? '#' + item.itemNumber : '';
    rowData.samplesExist = item.samplesExist === 'Yes' ? 'Oui' : 'Non';
    rowData.ways = item.ways || '';
    rowData.housingColour = item.housingColour || '';
    rowData.testModuleExistInDatabase = item.testModuleExistInDatabase === 'Yes' ? 'Oui' : 'Non';
    rowData.housingReferenceLeoni = item.housingReferenceLeoni || '';
    rowData.housingReferenceSupplierCustomer = item.housingReferenceSupplierCustomer || '';
    rowData.referenceSealsClipsCableTiesCap = item.referenceSealsClipsCableTiesCap || '';
    rowData.photo = ''; // Sera géré par l'image
    rowData.quantityOfTestModules = item.quantityOfTestModules || 0;

    // Housing
    rowData.outsideHousingExist = formatValue(item.outsideHousingExist);
    rowData.insideHousingExist = formatValue(item.insideHousingExist);
    rowData.coverHoodExist = formatValue(item.coverHoodExist);
    rowData.coverHoodClosed = formatValue(item.coverHoodClosed);
    rowData.capExist = formatValue(item.capExist);
    rowData.bayonetCapExist = formatValue(item.bayonetCapExist);
    rowData.bracketExist = formatValue(item.bracketExist);
    rowData.bracketOpen = formatValue(item.bracketOpen);
    rowData.bracketClosed = formatValue(item.bracketClosed);
    rowData.latchWingExist = formatValue(item.latchWingExist);
    rowData.sliderExist = formatValue(item.sliderExist);
    rowData.sliderOpen = formatValue(item.sliderOpen);
    rowData.sliderClosed = formatValue(item.sliderClosed);
    rowData.secondaryLockExist = formatValue(item.secondaryLockExist);
    rowData.secondaryLockOpen = formatValue(item.secondaryLockOpen);
    rowData.secondaryLockClosed = formatValue(item.secondaryLockClosed);

    // Fastening
    rowData.offsetTest = formatValue(item.offsetTest);
    rowData.pushBackTest = formatValue(item.pushBackTest);
    rowData.terminalOrientation = formatValue(item.terminalOrientation);
    rowData.terminalDifferentiation = formatValue(item.terminalDifferentiation);
    rowData.ringTerminal = formatValue(item.ringTerminal);
    rowData.singleContact = formatValue(item.singleContact);
    rowData.heatShrinkExist = formatValue(item.heatShrinkExist);
    rowData.openShuntsAirbag = formatValue(item.openShuntsAirbag);
    rowData.flowTest = formatValue(item.flowTest);
    rowData.solidMetalContour = formatValue(item.solidMetalContour);
    rowData.metalContourAdjustable = formatValue(item.metalContourAdjustable);
    rowData.metalRailsFasteningSystem = formatValue(item.metalRailsFasteningSystem);
    rowData.metalPlatesFasteningSystem = formatValue(item.metalPlatesFasteningSystem);
    rowData.spacerClosingUnit = formatValue(item.spacerClosingUnit);
    rowData.spring = formatValue(item.spring);

    // Cable
    rowData.cableTieExist = formatValue(item.cableTieExist);
    rowData.cableTieLeft = formatValue(item.cableTieLeft);
    rowData.cableTieRight = formatValue(item.cableTieRight);
    rowData.cableTieMiddle = formatValue(item.cableTieMiddle);
    rowData.cableTieLeftRight = formatValue(item.cableTieLeftRight);
    rowData.clipExist = formatValue(item.clipExist);
    rowData.screwExist = formatValue(item.screwExist);
    rowData.nutExist = formatValue(item.nutExist);
    rowData.convolutedConduitExist = formatValue(item.convolutedConduitExist);
    rowData.convolutedConduitClosed = formatValue(item.convolutedConduitClosed);
    rowData.cableChannelExist = formatValue(item.cableChannelExist);
    rowData.cableChannelClosed = formatValue(item.cableChannelClosed);
    rowData.grommetExist = formatValue(item.grommetExist);
    rowData.grommetOrientation = item.grommetOrientation || '';
    rowData.presenceTestOfOneSideConnectedShield = formatValue(item.presenceTestOfOneSideConnectedShield);
    rowData.antennaOnlyPresenceTest = formatValue(item.antennaOnlyPresenceTest);
    rowData.antennaOnlyContactingOfShield = formatValue(item.antennaOnlyContactingOfShield);
    rowData.antennaContactingOfShieldAndCoreWire = formatValue(item.antennaContactingOfShieldAndCoreWire);
    rowData.otherDetection = formatValue(item.otherDetection);

    // Electrical
    rowData.mechanicalCoding = formatValue(item.mechanicalCoding);
    rowData.electricalCoding = formatValue(item.electricalCoding);
    rowData.airbagTestViaServiceWindow = formatValue(item.airbagTestViaServiceWindow);
    rowData.leakTestPressure = formatValue(item.leakTestPressure);
    rowData.leakTestVacuum = formatValue(item.leakTestVacuum);
    rowData.leakTestComplex = formatValue(item.leakTestComplex);
    rowData.pinStraightnessCheck = formatValue(item.pinStraightnessCheck);
    rowData.contrastDetectionGreyValueSensor = formatValue(item.contrastDetectionGreyValueSensor);
    rowData.colourDetection = formatValue(item.colourDetection);
    rowData.colourDetectionPrepared = formatValue(item.colourDetectionPrepared);
    rowData.attenuationWithModeScrambler = formatValue(item.attenuationWithModeScrambler);
    rowData.attenuationWithoutModeScrambler = formatValue(item.attenuationWithoutModeScrambler);
    rowData.insulationResistance = formatValue(item.insulationResistance);
    rowData.highVoltageModule = formatValue(item.highVoltageModule);
    rowData.kelvinMeasurementHV = formatValue(item.kelvinMeasurementHV);
    rowData.actuatorTestHV = formatValue(item.actuatorTestHV);
    rowData.chargingSystemElectrical = formatValue(item.chargingSystemElectrical);
    rowData.ptuPipeTestUnit = formatValue(item.ptuPipeTestUnit);
    rowData.gtuGrommetTestUnit = formatValue(item.gtuGrommetTestUnit);
    rowData.ledLEDTestModule = formatValue(item.ledLEDTestModule);
    rowData.tigTerminalInsertionGuidance = formatValue(item.tigTerminalInsertionGuidance);
    rowData.linBusFunctionalityTest = formatValue(item.linBusFunctionalityTest);
    rowData.canBusFunctionalityTest = formatValue(item.canBusFunctionalityTest);
    rowData.esdConformModule = formatValue(item.esdConformModule);
    rowData.fixedBlock = formatValue(item.fixedBlock);
    rowData.movingBlock = formatValue(item.movingBlock);
    rowData.tiltModule = formatValue(item.tiltModule);
    rowData.slideModule = formatValue(item.slideModule);
    rowData.handAdapter = formatValue(item.handAdapter);
    rowData.lsmLeoniSmartModule = formatValue(item.lsmLeoniSmartModule);
    rowData.leoniStandardTestTable = formatValue(item.leoniStandardTestTable);
    rowData.quickConnectionByCanonConnector = formatValue(item.quickConnectionByCanonConnector);
    rowData.testBoard = item.testBoard || '';
    rowData.weetech = formatValue(item.weetech);
    rowData.bak = formatValue(item.bak);
    rowData.ogc = formatValue(item.ogc);
    rowData.adaptronicHighVoltage = formatValue(item.adaptronicHighVoltage);
    rowData.emdepHVBananaPlug = formatValue(item.emdepHVBananaPlug);
    rowData.leoniEMOStandardHV = formatValue(item.leoniEMOStandardHV);
    rowData.clipOrientation = item.clipOrientation || '';

    // Prix
    rowData.unitPrice = item.unitPrice || 0;
    rowData.totalPrice = item.totalPrice || 0;

    const row = worksheet.addRow(Object.values(rowData));

    // Ajouter l'image si elle existe
    if (item.id && this.itemImages && this.itemImages[item.id]) {
      try {
        const imageUrl = this.itemImages[item.id];
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        let extension: 'png' | 'jpeg' | 'gif' = 'png';
        if (imageUrl.includes('jpg') || imageUrl.includes('jpeg')) extension = 'jpeg';
        else if (imageUrl.includes('gif')) extension = 'gif';

        const imageId = workbook.addImage({
          buffer: arrayBuffer,
          extension: extension
        });

        // Positionner l'image dans la colonne "Photo" (colonne 10)
        worksheet.addImage(imageId, {
          tl: { col: 9.5, row: rowIndex - 0.8 },
          ext: { width: 80, height: 80 },
          editAs: 'oneCell'
        });
      } catch (error) {
        console.error(`Erreur chargement image pour item ${item.id}:`, error);
      }
    }
  }

  // ===== STYLISER LES LIGNES DE DONNÉES =====
  for (let i = dataStartRow; i < dataStartRow + itemsLength; i++) {
    const row = worksheet.getRow(i);
    row.height = 80;

    // Alternance de couleurs
    if ((i - dataStartRow) % 2 === 0) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFBFBFD' }
        };
      });
    }
  }

  // ===== AJOUTER DES BORDURES DE SÉPARATION =====
  const getColumnLetter = (index: number): string => {
    let letter = '';
    while (index > 0) {
      const mod = (index - 1) % 26;
      letter = String.fromCharCode(65 + mod) + letter;
      index = Math.floor((index - 1) / 26);
    }
    return letter;
  };

  const addGroupBorder = (colLetter: string) => {
    for (let i = headerRowNumber; i < dataStartRow + itemsLength; i++) {
      const cell = worksheet.getCell(`${colLetter}${i}`);
      cell.border = {
        left: { style: 'medium', color: { argb: 'FF4E73DF' } }
      };
    }
  };

  // Bordures après chaque groupe
  addGroupBorder(getColumnLetter(generalEnd + 1));
  addGroupBorder(getColumnLetter(housingEnd + 1));
  addGroupBorder(getColumnLetter(fasteningEnd + 1));
  addGroupBorder(getColumnLetter(cableEnd + 1));
  addGroupBorder(getColumnLetter(electricalEnd + 1));

  // Générer le fichier
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, `ChargeSheet_${this.chargeSheetId}_Items.xlsx`);
}
// Modifiez closeModal pour réinitialiser
closeModal() {
  this.showModal = false;
  this.selectedTechnicalFileId = null;
  this.currentItem = null;
  this.itemForm.reset();
   this.showComplianceModal = false;
  this.selectedItemForCompliance = null;
  this.complianceToCreate = null;
}
// Ajoutez ces propriétés
receivedQuantities: Map<number, number> = new Map();
pendingCompliances: Map<number, PrepareCompliance> = new Map();
showComplianceModal = false;
selectedItemForCompliance: ChargeSheetItemDto | null = null;
complianceToCreate: PrepareCompliance | null = null;

// Vérifier si des fiches de conformité existent déjà pour cet item
checkExistingCompliances(itemId: number): void {
  if (!itemId) return;
  
  this.complianceService.getComplianceByItem(itemId).subscribe({
    next: (compliances) => {
      if (compliances && compliances.length > 0) {
        this.existingCompliances.set(itemId, true);
      } else {
        this.existingCompliances.set(itemId, false);
      }
    },
    error: (err) => {
      console.error('Erreur vérification conformités:', err);
      this.existingCompliances.set(itemId, false);
    }
  });
}
// Vérifier si un item a déjà des fiches de conformité
hasExistingCompliance(itemId: number): boolean {
  if (!itemId) return false;  // ✅ Retourne false si pas d'ID
  return this.existingCompliances.get(itemId) || false;
}
// Ajoutez cette méthode pour charger les quantités reçues
loadReceivedQuantities(): void {
  if (!this.chargeSheetId) return;

  this.chargeSheetService.getReceptionHistory(this.chargeSheetId).subscribe({
    next: (history: ReceptionHistoryDto[]) => {
      const totals = new Map<number, number>();
      history.forEach(h => {
        const itemId = h.item.id;
        const current = totals.get(itemId) || 0;
        totals.set(itemId, current + h.quantityReceived);
      });
      this.receivedQuantities = totals;
      
      // ✅ Vérifier pour chaque item si des fiches de conformité existent
      this.chargeSheet?.items.forEach(item => {
        if (item.id) {
          this.checkExistingCompliances(item.id);
        }
      });
    },
    error: (err) => {
      console.error('Erreur chargement quantités reçues:', err);
    }
  });
}
// Appelez cette méthode dans loadChargeSheet
loadChargeSheet(): void {
  if (!this.chargeSheetId) return;

  this.loading = true;
  this.chargeSheetService.getById(this.chargeSheetId).subscribe({
    next: (data) => {
      this.chargeSheet = data;
      this.loading = false;
      this.loadItemImages();
      this.loadReceivedQuantities(); // AJOUTEZ CETTE LIGNE
    },
    error: (err) => {
      console.error('Erreur chargement:', err);
      this.error = 'Impossible de charger les données';
      this.loading = false;
    }
  });
}

getReceivedQuantity(itemId: number): number {
  if (!itemId) return 0;
  return this.receivedQuantities.get(itemId) || 0;
}
// Modifiez cette méthode pour vérifier la réception et les fiches existantes
goToCreateConforme(item: ChargeSheetItemDto): void {
  if (!this.chargeSheetId || !item.id) return;

  const quantityOrdered = item.quantityOfTestModules || 0;
  const quantityReceived = this.getReceivedQuantity(item.id);

  // ✅ Vérification 1: Est-ce que la quantité a été reçue ?
  if (quantityReceived === 0) {
    alert(`❌ Impossible de créer une fiche de conformité pour l'item ${item.itemNumber}.\n\nAucun module n'a encore été reçu pour cet item.`);
    return;
  }

  // ✅ Vérification 2: Est-ce que la quantité reçue est suffisante ?
  if (quantityReceived < quantityOrdered) {
    alert(`⚠️ Attention: Seulement ${quantityReceived} module(s) reçu(s) sur ${quantityOrdered} commandé(s).\n\nVous pouvez créer des fiches pour les modules déjà reçus.`);
    // On continue quand même car il y a eu au moins une réception
  }

  // ✅ Vérification 3: Est-ce que des fiches existent déjà ?
  if (this.hasExistingCompliance(item.id)) {
    const confirmCreate = confirm(`⚠️ Des fiches de conformité existent déjà pour l'item ${item.itemNumber}.\n\nVoulez-vous créer des fiches supplémentaires ?`);
    if (!confirmCreate) {
      return;
    }
  }

  // Rediriger vers la page de création
  this.router.navigate([
    '/compliance',
    'charge-sheets',
    this.chargeSheetId,
    'items',
    item.id,
    'create-conforme'
  ]);
}

// Ajoutez cette méthode dans la classe ChargeSheetItemsViewComponent

/**
 * Crée les fiches de conformité
 */
createComplianceSheets(): void {
  if (!this.selectedItemForCompliance || !this.complianceToCreate) return;

  const quantity = this.complianceToCreate.quantityToCreate;

  if (!confirm(`Créer ${quantity} fiche(s) de conformité pour l'item ${this.selectedItemForCompliance.itemNumber} ?`)) {
    return;
  }

  this.complianceService.createComplianceForReceivedQuantity(this.selectedItemForCompliance.id!, quantity).subscribe({
    next: (created) => {
      alert(`✅ ${created.length} fiche(s) de conformité créée(s) avec succès!`);
      this.closeModal();
      // Recharger les quantités reçues pour mettre à jour l'affichage
      this.loadReceivedQuantities();
    },
    error: (err) => {
      console.error('Erreur création conformité:', err);
      alert('❌ Erreur: ' + (err.error?.message || err.message));
    }
  });
}
// Ajoutez ces méthodes dans ChargeSheetItemsViewComponent

getStatusBadgeClass(status: string): string {
  const classes: { [key: string]: string } = {
    'DRAFT': 'bg-secondary bg-opacity-10 text-secondary',
    'VALIDATED_ING': 'bg-primary bg-opacity-10 text-primary',
    'TECH_FILLED': 'bg-info bg-opacity-10 text-info',
    'VALIDATED_PT': 'bg-warning bg-opacity-10 text-warning',
    'SENT_TO_SUPPLIER': 'bg-success bg-opacity-10 text-success',
    'RECEIVED_FROM_SUPPLIER': 'bg-success bg-opacity-10 text-success',
    'COMPLETED': 'bg-success bg-opacity-10 text-success'
  };
  return classes[status] || 'bg-secondary bg-opacity-10 text-secondary';
}

getStatusIcon(status: string): string {
  const icons: { [key: string]: string } = {
    'DRAFT': 'bi-file-earmark',
    'VALIDATED_ING': 'bi-check-circle',
    'TECH_FILLED': 'bi-gear',
    'VALIDATED_PT': 'bi-check2-circle',
    'SENT_TO_SUPPLIER': 'bi-truck',
    'RECEIVED_FROM_SUPPLIER': 'bi-box-arrow-in-down',
    'COMPLETED': 'bi-check-all'
  };
  return icons[status] || 'bi-question-circle';
}

getColourBadge(colour: string): string {
  const badges: { [key: string]: string } = {
    'black': 'badge-black',
    'white': 'badge-white',
    'grey': 'badge-grey',
    'green': 'badge-green',
    'blue': 'badge-blue',
    'red': 'badge-red'
  };
  return badges[colour] || 'badge-secondary';
}
}
