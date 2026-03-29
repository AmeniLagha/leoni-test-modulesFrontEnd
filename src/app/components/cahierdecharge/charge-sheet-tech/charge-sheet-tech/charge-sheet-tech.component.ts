import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChargeSheetService } from '../../../../../services/charge-sheet.service';
import { ChargeSheetItemDto, ChargeSheetUpdateTechDto } from '../../../../../models/charge-sheet.model';
import { UploadService } from '../../../../../services/upload.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
@Component({
  selector: 'app-charge-sheet-tech',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink,RouterModule],
  templateUrl: './charge-sheet-tech.component.html',
  styleUrls: ['./charge-sheet-tech.component.css']
})
export class ChargeSheetTechComponent implements OnInit {

  chargeSheetId: number | null = null;
  itemId: number | null = null;
  techForm: FormGroup | null = null;
  loading = true;
  error: string | null = null;
  debugInfo: string | null = null;

  items: ChargeSheetItemDto[] = [];
  currentIndex = 0;
  // Flag pour savoir si des modifications non sauvegardées existent
  hasUnsavedChanges = false;

  // Sections de champs (inchangé)
  housingFields: string[] = [
    'outsideHousingExist', 'insideHousingExist', 'coverHoodExist', 'coverHoodClosed',
    'capExist', 'bayonetCapExist', 'bracketExist', 'bracketOpen', 'bracketClosed',
    'latchWingExist', 'sliderExist', 'sliderOpen', 'sliderClosed',
    'secondaryLockExist', 'secondaryLockOpen', 'secondaryLockClosed'
  ];

  fasteningFields: string[] = [
    'offsetTest', 'pushBackTest', 'terminalOrientation', 'terminalDifferentiation',
    'ringTerminal', 'singleContact', 'heatShrinkExist', 'openShuntsAirbag', 'flowTest',
    'solidMetalContour', 'metalContourAdjustable', 'metalRailsFasteningSystem',
    'metalPlatesFasteningSystem', 'spacerClosingUnit', 'spring'
  ];

  cableFields: string[] = [
    'cableTieExist', 'cableTieLeft', 'cableTieRight', 'cableTieMiddle', 'cableTieLeftRight',
    'clipExist', 'screwExist', 'nutExist', 'convolutedConduitExist', 'convolutedConduitClosed',
    'cableChannelExist', 'cableChannelClosed', 'grommetExist', 'grommetOrientation',
    'presenceTestOfOneSideConnectedShield', 'antennaOnlyPresenceTest', 'antennaOnlyContactingOfShield',
    'antennaContactingOfShieldAndCoreWire', 'otherDetection'
  ];

  electricalFields: string[] = [
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

  collapsedSections: { [key: string]: boolean } = {
    housing: false,
    fastening: false,
    cable: false,
    electrical: false
  };
  techFormArray: FormArray<FormGroup> = new FormArray<FormGroup>([]);
formWrapper!: FormGroup;
itemImages: { [key: number]: string } = {};
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private chargeSheetService: ChargeSheetService,
    public uploadService: UploadService
  ) {}

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('sheetId') || this.route.snapshot.paramMap.get('id');
    if (!paramId) {
      this.error = 'ID du cahier de charge manquant';
      this.loading = false;
      return;
    }
    this.chargeSheetId = +paramId;
    this.loadItems();

  }
loadItemImages(): void {
  this.items.forEach(item => {
    if (item.id && item.realConnectorPicture) {
      this.uploadService.getImageUrl(item.realConnectorPicture).subscribe({
        next: (url) => {
          this.itemImages[item.id!] = url;
        },
        error: (err) => {
          console.error("Erreur chargement image:", err);
        }
      });
    }
  });
}
 loadItems(): void {
  if (!this.chargeSheetId) return;
  this.loading = true;

  this.chargeSheetService.getById(this.chargeSheetId).subscribe({
    next: data => {
      this.items = data?.items || [];

      if (!this.items || this.items.length === 0) {
        this.error = 'Aucun item trouvé';
        this.loading = false;
        return;
      }

      this.initFormArray();

      // ✅ charger les images ici
      this.loadItemImages();

      this.loading = false;
    },
    error: err => {
      this.error = `Erreur chargement: ${err.message || 'inconnue'}`;
      this.loading = false;
    }
  });
}

  initFormArray(): void {
    const allFields = [...this.housingFields, ...this.fasteningFields, ...this.cableFields, ...this.electricalFields];

    this.techFormArray = new FormArray(
      this.items.map(item => {
        const group: any = {};
        allFields.forEach(field => {
          group[field] = [item[field as keyof ChargeSheetItemDto] || ''];
        });
        group['unitPrice'] = [item.unitPrice || 0, Validators.min(0)];
        group['totalPrice'] = [item.totalPrice || 0, Validators.min(0)];
        return this.fb.group(group);
      })
    );

    this.techFormArray.valueChanges.subscribe(() => {
      this.hasUnsavedChanges = true;
    });
    this.formWrapper = this.fb.group({
  items: this.techFormArray // ton FormArray
    })
  }

  saveAll(): void {
    if (!this.techFormArray.valid || !this.chargeSheetId) return;

    const updates: ChargeSheetUpdateTechDto[] = this.techFormArray.value;
    updates.forEach((update, index) => {
      const itemId = this.items[index].id;
      this.chargeSheetService.updateItemTech(this.chargeSheetId!, itemId!, update).subscribe({
        next: () => console.log(`Item ${itemId} mis à jour`),
        error: err => console.error(`Erreur item ${itemId}:`, err)
      });
    });

    this.hasUnsavedChanges = false;
    alert('Tous les items ont été sauvegardés !');
  }


  /**
   * Vérifie si le formulaire est valide (existe et a des contrôles valides)
   */
  isFormValid(): boolean {
    return this.techForm !== null && this.techForm.valid;
  }

  /**
   * Sauvegarde les modifications locales dans le tableau items
   */
  private saveCurrentItemLocally(): void {
    if (!this.techForm || !this.items[this.currentIndex]) return;

    const currentItem = this.items[this.currentIndex];
    const formValue = this.techForm.value;

    // Mettre à jour toutes les valeurs du formulaire dans l'item local
    const allFields = [
      ...this.housingFields,
      ...this.fasteningFields,
      ...this.cableFields,
      ...this.electricalFields
    ];

    allFields.forEach(field => {
      (currentItem as any)[field] = formValue[field];
    });

    currentItem.unitPrice = formValue.unitPrice;
    currentItem.totalPrice = formValue.totalPrice;

    this.hasUnsavedChanges = false;
  }

  /**
   * Extrait les paramètres de l'URL
   */
  private extractRouteParams(): void {
    try {
      const paramMap = this.route.snapshot.paramMap;

      this.debugInfo = `Params: ${JSON.stringify(this.route.snapshot.params)}`;

      // Chercher le sheetId (peut être 'sheetId' ou 'id')
      const possibleSheetIdNames = ['sheetId', 'id', 'chargeSheetId'];
      for (const name of possibleSheetIdNames) {
        const value = paramMap.get(name);
        if (value) {
          this.chargeSheetId = +value;
          this.debugInfo += `\nSheetId trouvé: ${name}=${value}`;
          break;
        }
      }

      // Chercher le itemId
      const possibleItemIdNames = ['itemId', 'id'];
      for (const name of possibleItemIdNames) {
        const value = paramMap.get(name);
        if (value && name !== 'sheetId') {
          this.itemId = +value;
          this.debugInfo += `\nItemId trouvé: ${name}=${value}`;
          break;
        }
      }

      if (!this.chargeSheetId) {
        this.error = 'ID du cahier de charge manquant dans l\'URL';
        this.loading = false;
        return;
      }

      this.loadItemData();

    } catch (e) {
      console.error('Erreur extraction params:', e);
      this.error = 'Erreur lors de la lecture des paramètres URL';
      this.loading = false;
    }
  }

  /**
   * Récupère le numéro de l'item courant
   */
  getCurrentItemNumber(): string {
    if (!this.items || this.items.length === 0) return '?';
    if (this.currentIndex < 0 || this.currentIndex >= this.items.length) return '?';
    const item = this.items[this.currentIndex];
    return item?.itemNumber || '?';
  }

  loadItemData(): void {
    if (!this.chargeSheetId) {
      this.error = 'ID du cahier non disponible';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.debugInfo += `\nChargement du sheet ID: ${this.chargeSheetId}`;

    this.chargeSheetService.getById(this.chargeSheetId).subscribe({
      next: (data) => {
        this.debugInfo += `\nDonnées reçues: ${data?.items?.length || 0} items`;

        this.items = data?.items || [];

        if (!this.items || this.items.length === 0) {
          this.error = 'Aucun item trouvé dans ce cahier';
          this.loading = false;
          return;
        }

        // Déterminer l'index à afficher
        if (this.itemId && this.itemId > 0) {
          this.currentIndex = this.items.findIndex(i => i.id === this.itemId);
          this.debugInfo += `\nRecherche item ID ${this.itemId}: index ${this.currentIndex}`;
        }

        if (this.currentIndex === -1) {
          this.currentIndex = 0;
          this.debugInfo += `\nItem non trouvé, utilisation du premier`;
        }

        this.initForm(this.items[this.currentIndex]);
        this.loading = false;
        this.hasUnsavedChanges = false;
      },
      error: (err) => {
        console.error('Erreur chargement:', err);
        this.error = `Impossible de charger les données: ${err.message || 'Erreur inconnue'}`;
        this.debugInfo += `\nErreur API: ${err.status} - ${err.message}`;
        this.loading = false;
      }
    });
  }

  initForm(item: ChargeSheetItemDto): void {
    if (!item) {
      console.error('Tentative d\'initialisation avec item null');
      return;
    }

    const formGroup: any = {};

    // Initialiser tous les champs avec les valeurs de l'item
    const allFields = [
      ...this.housingFields,
      ...this.fasteningFields,
      ...this.cableFields,
      ...this.electricalFields
    ];

    allFields.forEach(field => {
      const value = item[field as keyof ChargeSheetItemDto];
      formGroup[field] = [value || ''];
    });

    // Ajouter les champs de prix avec validation
    formGroup['unitPrice'] = [item.unitPrice || 0, [Validators.min(0)]];
    formGroup['totalPrice'] = [item.totalPrice || 0, [Validators.min(0)]];

    this.techForm = this.fb.group(formGroup);

    // S'abonner aux changements du formulaire
    this.techForm.valueChanges.subscribe(() => {
      this.hasUnsavedChanges = true;
    });

    if (item.id) {
      this.itemId = item.id;
    }
  }

  retry(): void {
    this.error = null;
    this.loading = true;
    this.loadItemData();
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      alert('Le formulaire contient des erreurs');
      return;
    }

    if (!this.chargeSheetId) {
      alert('ID du cahier manquant');
      return;
    }

    const currentItem = this.items[this.currentIndex];
    if (!currentItem?.id) {
      alert('ID d\'item invalide');
      return;
    }

    const updateDto: ChargeSheetUpdateTechDto = this.techForm!.value;

    this.chargeSheetService.updateItemTech(this.chargeSheetId, currentItem.id, updateDto).subscribe({
      next: () => {
        alert('Mise à jour réussie !');

        // Mettre à jour le statut local et sauvegarder les valeurs
        if (this.items[this.currentIndex]) {
          this.items[this.currentIndex].itemStatus = 'TECH_FILLED';
          this.saveCurrentItemLocally(); // Sauvegarde locale après succès API
        }

        this.hasUnsavedChanges = false;
        this.goToDetail();
      },
      error: (err) => {
        console.error('Erreur mise à jour:', err);
        alert(`Erreur lors de la mise à jour: ${err.message || 'Erreur inconnue'}`);
      }
    });
  }

  /**
   * Navigation vers l'item précédent avec sauvegarde locale
   */
  prevItem(): void {
    if (this.currentIndex > 0) {
      // Sauvegarder les modifications locales avant de changer d'item
      this.saveCurrentItemLocally();

      this.currentIndex--;
      this.initForm(this.items[this.currentIndex]);
      this.updateUrl();
    }
  }

  /**
   * Navigation vers l'item suivant avec sauvegarde locale
   */
  nextItem(): void {
    if (this.currentIndex < this.items.length - 1) {
      // Sauvegarder les modifications locales avant de changer d'item
      this.saveCurrentItemLocally();

      this.currentIndex++;
      this.initForm(this.items[this.currentIndex]);
      this.updateUrl();
    }
  }

  /**
   * Met à jour l'URL avec le nouvel ID d'item sans recharger la page
   */
  private updateUrl(): void {
    const currentItem = this.items[this.currentIndex];
    if (currentItem?.id && this.chargeSheetId) {
      const url = this.router.createUrlTree(
        ['/charge-sheets', this.chargeSheetId, 'items', currentItem.id, 'tech']
      ).toString();
      window.history.replaceState({}, '', url);
      this.itemId = currentItem.id;
    }
  }

  /**
   * Demande de confirmation avant de quitter avec des changements non sauvegardés
   */
  goBack(): void {
    if (this.hasUnsavedChanges) {
      const confirmLeave = confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?');
      if (!confirmLeave) return;
    }

    if (this.chargeSheetId) {
      this.router.navigate(['/charge-sheets', this.chargeSheetId]);
    } else {
      this.goToList();
    }

  }

  goToDetail(): void {
    if (this.chargeSheetId) {
      this.router.navigate(['/charge-sheets', this.chargeSheetId]);
    }
  }

  goToList(): void {
    this.router.navigate(['/charge-sheets/list']);
  }

  formatLabel(key: string): string {
    const labels: { [key: string]: string } = {
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
      unitPrice: 'Prix unitaire',
      totalPrice: 'Prix total'
    };
    return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  toggleSection(section: string): void {
    this.collapsedSections[section] = !this.collapsedSections[section];
  }

  hoverImage: string | null = null;

  fieldImagesTech: { [key: string]: string } = {
    outsideHousingExist: 'assets/help/housing/outsideHousingExist.png',
    insideHousingExist: 'assets/help/housing/insideHousingExist.png',
    pushBackTest: 'assets/help/fastening/pushBackTest.png',
    singleContact: 'assets/help/fastening/singleContact.png',
    clipOrientation: 'assets/help/electrical/clipOrientation.png'
  };

  showImageTech(field: string): void {
    this.hoverImage = this.fieldImagesTech[field] || null;
  }

  hideImageTech(): void {
    this.hoverImage = null;
  }
selectedImage: string | null = null;

openImage(image: string) {
  this.selectedImage = image;
}

closeImage() {
  this.selectedImage = null;
}
exportToExcel(): void {

const allFields = [
'#',
'Item Number',
'Samples Exist',
'Ways',
'Housing Colour',
'Test Module already exist in DA-Database',
'Housing Reference (Leoni)',
'Housing Reference (Supplier,Customer)',
'Reference Seals',
'Quantity'
];

const housingLabels = this.housingFields.map(f => this.formatLabel(f));
const fasteningLabels = this.fasteningFields.map(f => this.formatLabel(f));
const cableLabels = this.cableFields.map(f => this.formatLabel(f));
const electricalLabels = this.electricalFields.map(f => this.formatLabel(f));

const headerRow1 = [
'Informations Ingénieur',
...Array(10).fill(''),
'Housing',
...Array(this.housingFields.length-1).fill(''),
'Fastening',
...Array(this.fasteningFields.length-1).fill(''),
'Cables',
...Array(this.cableFields.length-1).fill(''),
'Electrical',
...Array(this.electricalFields.length-1).fill(''),
'Prix unitaire',
'Prix total'
];

const headerRow2 = [
...allFields,
...housingLabels,
...fasteningLabels,
...cableLabels,
...electricalLabels,
'Prix unitaire (DT)',
'Prix total (DT)'
];

const dataRows = this.items.map((item,index)=>{

const row:any[] = [];

row.push(index+1);
row.push(item.itemNumber);
row.push(item.samplesExist);
row.push(item.ways);
row.push(item.housingColour);
row.push(item.testModuleExistInDatabase);
row.push(item.housingReferenceLeoni);
row.push(item.housingReferenceSupplierCustomer);
row.push(item.referenceSealsClipsCableTiesCap);
row.push(item.quantityOfTestModules);

this.housingFields.forEach(f=>{
row.push((item as any)[f] ? '✓':'');
});

this.fasteningFields.forEach(f=>{
row.push((item as any)[f] ? '✓':'');
});

this.cableFields.forEach(f=>{
row.push((item as any)[f] ? '✓':'');
});

this.electricalFields.forEach(f=>{
row.push((item as any)[f] ? '✓':'');
});

row.push(item.unitPrice);
row.push(item.totalPrice);

return row;

});

const worksheet = XLSX.utils.aoa_to_sheet([
headerRow1,
headerRow2,
...dataRows
]);

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook,worksheet,'ChargeSheet');

const excelBuffer = XLSX.write(workbook,{
bookType:'xlsx',
type:'array'
});

const blob = new Blob([excelBuffer],{
type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
});

saveAs(blob,'ChargeSheet_Tech.xlsx');

}
// Ajoutez cette méthode dans la classe ChargeSheetTechComponent

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
