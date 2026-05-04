import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterModule,
} from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChargeSheetService } from '../../../../../services/charge-sheet.service';
import {
  ChargeSheetComplete,
  ChargeSheetItemDto,
  ChargeSheetUpdateTechDto,
} from '../../../../../models/charge-sheet.model';
import { UploadService } from '../../../../../services/upload.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { LocalStorageService } from '../../../../../services/Localstorage/LocalStorageService';

@Component({
  selector: 'app-charge-sheet-tech',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    RouterModule,
  ],
  templateUrl: './charge-sheet-tech.component.html',
  styleUrls: ['./charge-sheet-tech.component.css'],
})
export class ChargeSheetTechComponent implements OnInit {
  chargeSheet: ChargeSheetComplete | null = null;
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
    'outsideHousingExist',
    'insideHousingExist',
    'mechanicalCoding',
    'electricalCoding',
    'cpaExistOpen',
    'cpaExistClosed',
    'coverHoodExist',
    'coverHoodClosed',
    'capExist',
    'bayonetCapExist',
    'bracketExist',
    'bracketOpen',
    'bracketClosed',
    'latchWingExist',
    'sliderExist',
    'sliderOpen',
    'sliderClosed',
    'secondaryLockExist',
    'secondaryLockOpen',
    'secondaryLockClosed',
    'offsetTest',
    'pushBackTest',
    'terminalOrientation',
    'terminalDifferentiation',
    'airbagTestViaServiceWindow',
    'leakTestPressure',
    'leakTestVacuum',
    'sealExist',
    'cableTieExist',
    'cableTieLeft',
    'cableTieRight',
    'cableTieMiddle',
    'cableTieLeftRight',
    'clipExist',
    'screwExist',
    'nutExist',
    'convolutedConduitExist',
    'convolutedConduitClosed',
    'antennaOnlyPresenceTest',
    'antennaOnlyContactingOfShield',
    'antennaContactingOfShieldAndCoreWire',
    'ringTerminal',
    'diameterInside',
    'diameterOutside',
    'singleContact',
    'heatShrinkExist',
    'openShuntsAirbag',
    'flowTest',
    'solidMetalContour',
    'metalContourAdjustable',
    'grommetExist',
    'grommetOrientation',
    'cableChannelExist',
    'cableChannelClosed',
    'colourDetectionPrepared',
    'extraLED',
    'spring',
    'otherDetection',
  ];

  fasteningFields: string[] = [
    'spacerClosingUnit',
    'leakTestComplex',
    'pinStraightnessCheck',
    'presenceTestOfOneSideConnectedShield',
    'contrastDetectionGreyValueSensor',
    'colourDetection',
    'attenuationWithModeScrambler',
    'attenuationWithoutModeScrambler',
    'insulationResistance',
    'highVoltageModule',
    'kelvinMeasurementHV',
    'actuatorTestHV',
    'chargingSystemElectrical',
    'ptuPipeTestUnit',
    'gtuGrommetTestUnit',
    'ledLEDTestModule',
    'tigTerminalInsertionGuidance',
    'linBusFunctionalityTest',
    'canBusFunctionalityTest',
    'esdConformModule',
  ];

  cableFields: string[] = [
    'fixedBlock',
    'movingBlock',
    'tiltModule',
    'slideModule',
    'handAdapter',
    'lsmLeoniSmartModule',
  ];

  electricalFields: string[] = [
    'leoniStandardTestTable',
    'metalRailsFasteningSystem',
    'metalPlatesFasteningSystem',
    'quickConnectionByCanonConnector',
    'testBoard',
    'weetech',
    'bak',
    'ogc',
    'adaptronicHighVoltage',
    'emdepHVBananaPlug',
    'leoniEMOStandardHV',
  ];

  collapsedSections: { [key: string]: boolean } = {
    housing: false,
    fastening: false,
    cable: false,
    electrical: false,
  };
  techFormArray: FormArray<FormGroup> = new FormArray<FormGroup>([]);
  formWrapper!: FormGroup;
  itemImages: { [key: number]: string } = {};
  hasLocalBackup = false;
  lastLocalBackupDate: string | null = null;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private chargeSheetService: ChargeSheetService,
    public uploadService: UploadService,
    private localStorageService: LocalStorageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const paramId =
      this.route.snapshot.paramMap.get('sheetId') ||
      this.route.snapshot.paramMap.get('id');

    if (!paramId) {
      this.error = 'ID du cahier de charge manquant';
      this.loading = false;
      return;
    }
    this.chargeSheetId = +paramId;
    this.loadItems();
     this.startAutoSave();
  }
  // Ligne 111 - Modifiez cette partie
  // charge-sheet-tech.component.ts
  // Modifiez la méthode loadItemImages :

  loadItemImages(): void {
    if (!this.chargeSheetId) return;

    this.items.forEach((item) => {
      if (item.id && item.realConnectorPicture) {
        // ✅ Utiliser getItemImageUrl au lieu de getImageUrl
        this.uploadService
          .getItemImageUrl(this.chargeSheetId!, item.id)
          .subscribe({
            next: (url: string) => {
              this.itemImages[item.id!] = url;
            },
            error: (err: any) => {
              console.error('Erreur chargement image:', err);
              // Image par défaut en cas d'erreur
              this.itemImages[item.id!] = 'assets/default-connector.png';
            },
          });
      }
    });
  }

  // ✅ Modifier loadItems() pour charger d'abord depuis localStorage
// ✅ Modifier loadItems() - Gérer le cas où lastLocalBackupDate est null
loadItems(): void {
  if (!this.chargeSheetId) return;
  this.loading = true;

  // ✅ Vérifier si des données existent en localStorage
  const localData = this.localStorageService.getTechData(this.chargeSheetId);

  if (localData && localData.length > 0) {
    this.hasLocalBackup = true;
    this.lastLocalBackupDate = this.localStorageService.getLastSavedDate(this.chargeSheetId);

    // ✅ Vérifier que lastLocalBackupDate n'est pas null avant de l'utiliser
    let dateMessage = '';
    if (this.lastLocalBackupDate) {
      try {
        const date = new Date(this.lastLocalBackupDate);
        dateMessage = date.toLocaleString();
      } catch (e) {
        dateMessage = 'date inconnue';
      }
    } else {
      dateMessage = 'date inconnue';
    }

    // Afficher un message de confirmation
    const restore = confirm(
      `Des modifications non sauvegardées ont été trouvées (${dateMessage}).\n` +
      `Voulez-vous les restaurer ?\n` +
      `(Cliquez "Annuler" pour charger les données du serveur)`
    );

    if (restore) {
      console.log('🔄 Restauration depuis localStorage');
      this.items = localData;
      this.initFormArray();
      this.hasUnsavedChanges = true;
      this.loading = false;
      this.cdr.detectChanges();
      return;
    } else {
      this.localStorageService.clearTechData(this.chargeSheetId);
    }
  }

  // Charger depuis le serveur
  this.chargeSheetService.getById(this.chargeSheetId).subscribe({
    next: (data) => {
      this.chargeSheet = data;
      this.items = data?.items || [];

      if (!this.items || this.items.length === 0) {
        this.error = 'Aucun item trouvé';
        this.loading = false;
        return;
      }

      this.initFormArray();
      this.loadItemImages();
      this.loading = false;
      this.hasUnsavedChanges = false;
      this.hasLocalBackup = false;
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.error = `Erreur chargement: ${err.message || 'inconnue'}`;
      this.loading = false;
    },
  });
}

// ✅ Version corrigée de saveAll()
saveAll(): void {
  if (!this.techFormArray.valid || !this.chargeSheetId) {
    alert('Formulaire invalide ou ID manquant');
    return;
  }

  // ✅ Forcer la mise à jour des items depuis le formulaire
  this.updateItemsFromForm();

  const updates: ChargeSheetUpdateTechDto[] = this.techFormArray.value;
  let completed = 0;
  const total = updates.length;

  if (total === 0) {
    alert('Aucun item à sauvegarder');
    return;
  }

  // ✅ Afficher une indication de chargement
  const loadingMsg = document.createElement('div');
  loadingMsg.className = 'loading-overlay';
  loadingMsg.innerHTML = '<div class="spinner-border text-primary"></div><p>Sauvegarde en cours...</p>';
  document.body.appendChild(loadingMsg);

  updates.forEach((update, index) => {
    const itemId = this.items[index].id;
    this.chargeSheetService
      .updateItemTech(this.chargeSheetId!, itemId!, update)
      .subscribe({
        next: () => {
          completed++;
          console.log(`✅ Item ${itemId} mis à jour (${completed}/${total})`);

          if (completed === total) {
            // ✅ Supprimer l'indicateur de chargement
            loadingMsg.remove();

            // ✅ Nettoyer le localStorage après sauvegarde réussie
            this.localStorageService.clearTechData(this.chargeSheetId!);
            this.hasUnsavedChanges = false;
            this.hasLocalBackup = false;

            alert('Tous les items ont été sauvegardés avec succès !');

            // ✅ Recharger les données depuis le serveur
            this.loadItems();
             this.goBack();
          }
        },
        error: (err) => {
          console.error(`❌ Erreur item ${itemId}:`, err);
          loadingMsg.remove();
          alert(`Erreur lors de la sauvegarde de l'item ${itemId}: ${err.message}`);
        },
      });
  });
}
  // ✅ Nouvelle méthode : Sauvegarder dans localStorage
  saveToLocalStorage(): void {
    if (!this.chargeSheetId) return;

    // Mettre à jour les items avec les valeurs actuelles du formulaire
    this.updateItemsFromForm();

    // Sauvegarder dans localStorage
    this.localStorageService.saveTechData(this.chargeSheetId, this.items);
    this.hasLocalBackup = true;
    this.lastLocalBackupDate = new Date().toISOString();

    // Afficher un message temporaire
    this.showTemporaryMessage('💾 Sauvegarde locale effectuée');

    console.log('💾 Sauvegarde locale effectuée');
  }

  // ✅ Nouvelle méthode : Mettre à jour les items depuis le formulaire
  updateItemsFromForm(): void {
    if (!this.techFormArray) return;

    const formValues = this.techFormArray.value;
    const allFields = [
      'housingReferenceLeoni',
      'quantityOfTestModules',
      'clipOrientation',
      ...this.housingFields,
      ...this.fasteningFields,
      ...this.cableFields,
      ...this.electricalFields,
      'unitPrice',
      'totalPrice'
    ];

    formValues.forEach((formValue: any, index: number) => {
      if (this.items[index]) {
        allFields.forEach(field => {
          if (formValue[field] !== undefined) {
            (this.items[index] as any)[field] = formValue[field];
          }
        });
      }
    });
  }

  // ✅ Sauvegarde automatique périodique (toutes les 30 secondes)
  startAutoSave(): void {
    setInterval(() => {
      if (this.hasUnsavedChanges && this.chargeSheetId) {
        this.saveToLocalStorage();
      }
    }, 30000); // 30 secondes
  }

  // ✅ Sauvegarde avant de quitter la page
  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges) {
      this.saveToLocalStorage();
      event.preventDefault();
      event.returnValue = 'Vous avez des modifications non sauvegardées. Elles seront conservées localement.';
    }
  }

  // ✅ Afficher un message temporaire
  showTemporaryMessage(message: string): void {
    const tempMessage = message;
    const originalMessage = this.error;
    this.error = tempMessage;
    setTimeout(() => {
      if (this.error === tempMessage) {
        this.error = originalMessage;
      }
    }, 3000);
  }

  // ✅ Modifier goBack() pour sauvegarder automatiquement
  goBack(): void {
    if (this.hasUnsavedChanges) {
      // Sauvegarder automatiquement avant de quitter
      this.saveToLocalStorage();

      const confirmLeave = confirm(
        'Vos modifications ont été sauvegardées localement.\n' +
        'Voulez-vous vraiment quitter ?\n' +
        '(Vous pourrez les retrouver en revenant sur cette page)'
      );
      if (!confirmLeave) return;
    }
    window.history.back();
  }



  initFormArray(): void {
    const allFields = [
      'housingReferenceLeoni',
      'quantityOfTestModules',
      'clipOrientation',
      ...this.housingFields,
      ...this.fasteningFields,
      ...this.cableFields,
      ...this.electricalFields,
    ];

    this.techFormArray = new FormArray(
      this.items.map((item) => {
        const group: any = {};
        allFields.forEach((field) => {
          group[field] = [item[field as keyof ChargeSheetItemDto] || ''];
        });
        group['unitPrice'] = [item.unitPrice || 0, Validators.min(0)];
        group['totalPrice'] = [item.totalPrice || 0, Validators.min(0)];
        return this.fb.group(group);
      }),
    );

    this.techFormArray.valueChanges.subscribe(() => {
      this.hasUnsavedChanges = true;
    });
    this.formWrapper = this.fb.group({
      items: this.techFormArray, // ton FormArray
    });
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
      ...this.electricalFields,
    ];

    allFields.forEach((field) => {
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
        this.error = "ID du cahier de charge manquant dans l'URL";
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
    if (this.currentIndex < 0 || this.currentIndex >= this.items.length)
      return '?';
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
          this.currentIndex = this.items.findIndex((i) => i.id === this.itemId);
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
      },
    });
  }

  initForm(item: ChargeSheetItemDto): void {
    if (!item) {
      console.error("Tentative d'initialisation avec item null");
      return;
    }

    const formGroup: any = {};

    // Initialiser tous les champs avec les valeurs de l'item
    const allFields = [
      ...this.housingFields,
      ...this.fasteningFields,
      ...this.cableFields,
      ...this.electricalFields,
    ];

    allFields.forEach((field) => {
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
      alert("ID d'item invalide");
      return;
    }

    const updateDto: ChargeSheetUpdateTechDto = this.techForm!.value;

    this.chargeSheetService
      .updateItemTech(this.chargeSheetId, currentItem.id, updateDto)
      .subscribe({
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
          alert(
            `Erreur lors de la mise à jour: ${err.message || 'Erreur inconnue'}`,
          );
        },
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
      const url = this.router
        .createUrlTree([
          '/charge-sheets',
          this.chargeSheetId,
          'items',
          currentItem.id,
          'tech',
        ])
        .toString();
      window.history.replaceState({}, '', url);
      this.itemId = currentItem.id;
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
      outsideHousingExist: 'Outside housing exist',
      insideHousingExist: 'Inside housing exist',
      mechanicalCoding: 'Mechanical coding',
      electricalCoding: 'Electrical coding',
      cpaExistOpen: 'CPA existe,open',
      cpaExistClosed: 'CPA existe,closed',
      coverHoodExist: 'cover-Hood exist',
      coverHoodClosed: 'cover-Hood closed',
      capExist: 'Cap Exist',
      bayonetCapExist: 'Bayonet cap Exist',
      bracketExist: 'Bracket Exist',
      bracketOpen: 'Bracket Open',
      bracketClosed: 'Bracket Closed',
      latchWingExist: 'Latch Wing exist',
      sliderExist: 'Slider Exist',
      sliderOpen: 'Slider Open',
      sliderClosed: 'Slider Closed',
      secondaryLockExist: 'Secondary Lock Exist',
      secondaryLockOpen: 'Secondary Lock Open',
      secondaryLockClosed: 'Secondary Lock Closed',
      offsetTest: 'Offset Test',
      pushBackTest: 'Push Back Test',
      terminalOrientation: 'Terminal Orientation',
      terminalDifferentiation: 'Terminal Differentiation',
      airbagTestViaServiceWindow: 'Airbag test via service window',
      leakTestPressure: 'Leak test pressure',
      leakTestVacuum: 'Leak Test Vacum',
      sealExist: 'Seal exist',
      cableTieExist: 'Cable tie Exist',
      cableTieLeft: 'Cable Tie Left',
      cableTieRight: 'Cable Tie Right',
      cableTieMiddle: 'Cable Tie Middle',
      cableTieLeftRight: 'Cable Tie Left/Right',
      clipExist: 'Clip exist',
      screwExist: 'Screw exist',
      nutExist: 'Nut exist',
      convolutedConduitExist: 'Convoluted Conduit Exist',
      convolutedConduitClosed: 'Convoluted Conduit Closed',
      antennaOnlyPresenceTest: 'Antenna (only presence test)',
      antennaOnlyContactingOfShield: 'Antenna (only contacting  of shield)',
      antennaContactingOfShieldAndCoreWire:
        'Antenna (Contacting of shield and core wire)',
      ringTerminal: 'Ring Terminal',
      diameterInside: 'Diameter inside',
      diameterOutside: 'Diameter outside',
      singleContact: 'Single Contact',
      heatShrinkExist: 'Heat Shrink Exist',
      openShuntsAirbag: 'Open Shunts (Airbag)',
      flowTest: 'Flow Test',
      solidMetalContour: 'Solid Metal Contour',
      metalContourAdjustable: 'Metal Contour Adjustable',
      grommetExist: 'Grommet Exist',
      grommetOrientation: 'Grommet Orientation',
      cableChannelExist: 'Cable Channel Exist',
      cableChannelClosed: 'Cable Channel Closed',
      colourDetectionPrepared: 'Colour Detection Prepared',
      extraLED: 'Extra LED',
      spring: 'Spring',
      otherDetection: 'Other Detection',
      spacerClosingUnit: 'Spacer Closing Unit',
      leakTestComplex: 'Leak Test Complex',
      pinStraightnessCheck: 'Pin Straightness Check',
      presenceTestOfOneSideConnectedShield:
        'Presence test of one-side-connected shield',
      contrastDetectionGreyValueSensor:
        'Contrast Detection (Grey Value Sensor)',
      colourDetection: 'Colour Detection',
      attenuationWithModeScrambler: 'Attenuation (with mode scramber)',
      attenuationWithoutModeScrambler: 'Attenuation (without mode scramber)',
      insulationResistance: 'Insulation Resistance',
      highVoltageModule: 'High Voltage Module',
      kelvinMeasurementHV: 'Kelvin Measurement HV',
      actuatorTestHV: 'Actuator Test HV',
      chargingSystemElectrical: 'Charging System (Electrical)',
      ptuPipeTestUnit: 'PTU(pipe test Unit)',
      gtuGrommetTestUnit: 'GTU(Grommet test unit)',
      ledLEDTestModule: 'LED(Led test unit)',
      tigTerminalInsertionGuidance: 'TIG(Terminal insertion Guidance)',
      linBusFunctionalityTest: 'LIN-Bus Functionality Test',
      canBusFunctionalityTest: 'CAN-Bus Functionality Test',
      esdConformModule: 'ESD conform module',
      fixedBlock: 'Fixed Block',
      movingBlock: 'Moving Block',
      tiltModule: 'Tilt Module',
      slideModule: 'Slide Module',
      handAdapter: 'Hand Adapter',
      lsmLeoniSmartModule: 'LSM(Leoni Smart Module)',
      leoniStandardTestTable: 'Leoni Standard Test Table',
      metalRailsFasteningSystem: '>Metal rails fastening system',
      metalPlatesFasteningSystem: 'Metal plates fastening system',
      quickConnectionByCanonConnector: 'Quick connection by Canon connector',
      testBoard: 'Test Board',
      weetech: 'WEETECH',
      bak: 'BAK',
      ogc: 'OGC',
      adaptronicHighVoltage: 'Adaptronic (High voltage)',
      emdepHVBananaPlug: 'EMDEP HV Banana Plug',
      leoniEMOStandardHV: 'Leoni EMO Standard HV',
      clipOrientation: 'Remarques',
      unitPrice: 'Unit Price',
      totalPrice: 'Total price',
    };
    return (
      labels[key] ||
      key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
    );
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
    clipOrientation: 'assets/help/electrical/clipOrientation.png',
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
      'Quantity',
    ];

    const housingLabels = this.housingFields.map((f) => this.formatLabel(f));
    const fasteningLabels = this.fasteningFields.map((f) =>
      this.formatLabel(f),
    );
    const cableLabels = this.cableFields.map((f) => this.formatLabel(f));
    const electricalLabels = this.electricalFields.map((f) =>
      this.formatLabel(f),
    );

    const headerRow1 = [
      'Informations Ingénieur',
      ...Array(10).fill(''),
      'Housing',
      ...Array(this.housingFields.length - 1).fill(''),
      'Fastening',
      ...Array(this.fasteningFields.length - 1).fill(''),
      'Cables',
      ...Array(this.cableFields.length - 1).fill(''),
      'Electrical',
      ...Array(this.electricalFields.length - 1).fill(''),
      'Prix unitaire',
      'Prix total',
    ];

    const headerRow2 = [
      ...allFields,
      ...housingLabels,
      ...fasteningLabels,
      ...cableLabels,
      ...electricalLabels,
      'Prix unitaire (DT)',
      'Prix total (DT)',
    ];

    const dataRows = this.items.map((item, index) => {
      const row: any[] = [];

      row.push(index + 1);
      row.push(item.itemNumber);
      row.push(item.samplesExist);
      row.push(item.ways);
      row.push(item.housingColour);
      row.push(item.testModuleExistInDatabase);
      row.push(item.housingReferenceLeoni);
      row.push(item.housingReferenceSupplierCustomer);
      row.push(item.referenceSealsClipsCableTiesCap);
      row.push(item.quantityOfTestModules);

      this.housingFields.forEach((f) => {
        row.push((item as any)[f] ? '✓' : '');
      });

      this.fasteningFields.forEach((f) => {
        row.push((item as any)[f] ? '✓' : '');
      });

      this.cableFields.forEach((f) => {
        row.push((item as any)[f] ? '✓' : '');
      });

      this.electricalFields.forEach((f) => {
        row.push((item as any)[f] ? '✓' : '');
      });

      row.push(item.unitPrice);
      row.push(item.totalPrice);

      return row;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([
      headerRow1,
      headerRow2,
      ...dataRows,
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ChargeSheet');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(blob, 'ChargeSheet_Tech.xlsx');
  }
  // Ajoutez cette méthode dans la classe ChargeSheetTechComponent

  getColourBadge(colour: string): string {
    const badges: { [key: string]: string } = {
      black: 'badge-black',
      white: 'badge-white',
      grey: 'badge-grey',
      green: 'badge-green',
      blue: 'badge-blue',
      red: 'badge-red',
    };
    return badges[colour] || 'badge-secondary';
  }
  addToRemarks(itemIndex: number, fieldKey: string, event: any): void {
    setTimeout(() => {
      const formGroup = this.techFormArray.at(itemIndex) as FormGroup;
      const currentValue = formGroup.get(fieldKey)?.value;
      let currentRemarks = formGroup.get('clipOrientation')?.value || '';

      // Récupérer le nom du champ depuis formatLabel
      let fieldName = '';
      try {
        fieldName = this.formatLabel(fieldKey);
      } catch (e) {
        fieldName = fieldKey;
      }

      if (currentValue === '*') {
        // Ajouter si pas déjà présent
        if (!currentRemarks.includes(fieldName)) {
          if (currentRemarks) {
            currentRemarks = currentRemarks + ', ' + fieldName;
          } else {
            currentRemarks = fieldName;
          }
        }
      } else {
        // Retirer le champ
        currentRemarks = currentRemarks
          .replace(fieldName, '')
          .replace(', ,', ',')
          .replace(/^, |, $/g, '');
      }

      formGroup.get('clipOrientation')?.setValue(currentRemarks);
    }, 10);
  }
}
