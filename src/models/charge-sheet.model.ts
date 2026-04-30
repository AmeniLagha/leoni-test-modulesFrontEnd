// ============================================
// MODÈLES POUR LE BACKEND MULTI-ITEMS
// ============================================

export enum ChargeSheetStatus {
  DRAFT = 'DRAFT',
  TECH_FILLED = 'TECH_FILLED',
 VALIDATED_ING ='VALIDATED_ING',
 VALIDATED_PT ='VALIDATED_PT',
 SENT_TO_SUPPLIER = 'SENT_TO_SUPPLIER',
  RECEIVED_FROM_SUPPLIER = 'RECEIVED_FROM_SUPPLIER',
  COMPLETED = 'COMPLETED'
}

export enum YesNo {
  YES = 'Yes',
  NO = 'No'
}

// ============================================
// DTO POUR UN ITEM INDIVIDUEL
// ============================================
export interface ChargeSheetItemDto {
  id?: number;
  itemNumber: string;
  samplesExist: string;
  ways: string;
  housingColour: string;
  testModuleExistInDatabase: string;
  housingReferenceLeoni: string;
  housingReferenceSupplierCustomer: string;
  referenceSealsClipsCableTiesCap?: string;
  realConnectorPicture?: string;
  quantityOfTestModules: number;

  // STANDARD TEST CRITERIA
  outsideHousingExist?: string;
  insideHousingExist?: string;
  mechanicalCoding?: string;
  electricalCoding?: string;
  cpaExistOpen?: string;
  cpaExistClosed?: string;
  coverHoodExist?: string;
  coverHoodClosed?: string;
  capExist?: string;
  bayonetCapExist?: string;
  bracketExist?: string;
  bracketOpen?: string;
  bracketClosed?: string;
  latchWingExist?: string;
  sliderExist?: string;
  sliderOpen?: string;
  sliderClosed?: string;
  secondaryLockExist?: string;
  secondaryLockOpen?: string;
  secondaryLockClosed?: string;
  offsetTest?: string;
  pushBackTest?: string;
  terminalOrientation?: string;
  terminalDifferentiation?: string;
  airbagTestViaServiceWindow?: string;
  leakTestPressure?: string;
  leakTestVacuum?: string;
  sealExist?: string;
  cableTieExist?: string;
  cableTieLeft?: string;
  cableTieRight?: string;
  cableTieMiddle?: string;
  cableTieLeftRight?: string;
  clipExist?: string;
  screwExist?: string;
  nutExist?: string;
  convolutedConduitExist?: string;
  convolutedConduitClosed?: string;
  antennaOnlyPresenceTest?: string;
  antennaOnlyContactingOfShield?: string;
  antennaContactingOfShieldAndCoreWire?: string;
  ringTerminal?: string;
  diameterInside?: string;
  diameterOutside?: string;
  singleContact?: string;
  heatShrinkExist?: string;
  openShuntsAirbag?: string;
  flowTest?: string;
  solidMetalContour?: string;
  metalContourAdjustable?: string;
  grommetExist?: string;
  grommetOrientation?: string;
  cableChannelExist?: string;
  cableChannelClosed?: string;
  colourDetectionPrepared?: string;
  extraLED?: string;
  spring?: string;
  otherDetection?: string;
  spacerClosingUnit?: string;
  leakTestComplex?: string;
  pinStraightnessCheck?: string;
  presenceTestOfOneSideConnectedShield?: string;
  contrastDetectionGreyValueSensor?: string;
  colourDetection?: string;
  attenuationWithModeScrambler?: string;
  attenuationWithoutModeScrambler?: string;
  insulationResistance?: string;
  highVoltageModule?: string;
  kelvinMeasurementHV?: string;
  actuatorTestHV?: string;
  chargingSystemElectrical?: string;
  ptuPipeTestUnit?: string;
  gtuGrommetTestUnit?: string;
  ledLEDTestModule?: string;
  tigTerminalInsertionGuidance?: string;
  linBusFunctionalityTest?: string;
  canBusFunctionalityTest?: string;
  esdConformModule?: string;
  fixedBlock?: string;
  movingBlock?: string;
  tiltModule?: string;
  slideModule?: string;
  handAdapter?: string;
  lsmLeoniSmartModule?: string;
  leoniStandardTestTable?: string;
  metalRailsFasteningSystem?: string;
  metalPlatesFasteningSystem?: string;
  quickConnectionByCanonConnector?: string;
  testBoard?: string;
  weetech?: string;
  bak?: string;
  ogc?: string;
  adaptronicHighVoltage?: string;
  emdepHVBananaPlug?: string;
  leoniEMOStandardHV?: string;
  clipOrientation?: string;
  unitPrice?: number;
  totalPrice?: number;

  // METADATA
  itemStatus?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

// ============================================
// DTO POUR LA CRÉATION (ING)
// ============================================
export interface ChargeSheetCreateDto {
  plant: string;
  project: string;
  harnessRef: string;
  issuedBy: string;
  emailAddress: string;
  phoneNumber: string;
  orderNumber: string;
  costCenterNumber: string;
  date: string;
  preferredDeliveryDate: string;
  items: ChargeSheetItemDto[];
}

// ============================================
// DTO POUR LA MISE À JOUR TECHNIQUE (PT)
// ============================================
export interface ChargeSheetUpdateTechDto {
  // Tous les champs techniques
   housingReferenceLeoni?: string;
   quantityOfTestModules: number;
  outsideHousingExist?: string;
  insideHousingExist?: string;
  mechanicalCoding?: string;
  electricalCoding?: string;
  cpaExistOpen?: string;
  cpaExistClosed?: string;
  coverHoodExist?: string;
  coverHoodClosed?: string;
  capExist?: string;
  bayonetCapExist?: string;
  bracketExist?: string;
  bracketOpen?: string;
  bracketClosed?: string;
  latchWingExist?: string;
  sliderExist?: string;
  sliderOpen?: string;
  sliderClosed?: string;
  secondaryLockExist?: string;
  secondaryLockOpen?: string;
  secondaryLockClosed?: string;
  offsetTest?: string;
  pushBackTest?: string;
  terminalOrientation?: string;
  terminalDifferentiation?: string;
  airbagTestViaServiceWindow?: string;
  leakTestPressure?: string;
  leakTestVacuum?: string;
  sealExist?: string;
  cableTieExist?: string;
  cableTieLeft?: string;
  cableTieRight?: string;
  cableTieMiddle?: string;
  cableTieLeftRight?: string;
  clipExist?: string;
  screwExist?: string;
  nutExist?: string;
  convolutedConduitExist?: string;
  convolutedConduitClosed?: string;
  antennaOnlyPresenceTest?: string;
  antennaOnlyContactingOfShield?: string;
  antennaContactingOfShieldAndCoreWire?: string;
  ringTerminal?: string;
  diameterInside?: string;
  diameterOutside?: string;
  singleContact?: string;
  heatShrinkExist?: string;
  openShuntsAirbag?: string;
  flowTest?: string;
  solidMetalContour?: string;
  metalContourAdjustable?: string;
  grommetExist?: string;
  grommetOrientation?: string;
  cableChannelExist?: string;
  cableChannelClosed?: string;
  colourDetectionPrepared?: string;
  extraLED?: string;
  spring?: string;
  otherDetection?: string;
  spacerClosingUnit?: string;
  leakTestComplex?: string;
  pinStraightnessCheck?: string;
  presenceTestOfOneSideConnectedShield?: string;
  contrastDetectionGreyValueSensor?: string;
  colourDetection?: string;
  attenuationWithModeScrambler?: string;
  attenuationWithoutModeScrambler?: string;
  insulationResistance?: string;
  highVoltageModule?: string;
  kelvinMeasurementHV?: string;
  actuatorTestHV?: string;
  chargingSystemElectrical?: string;
  ptuPipeTestUnit?: string;
  gtuGrommetTestUnit?: string;
  ledLEDTestModule?: string;
  tigTerminalInsertionGuidance?: string;
  linBusFunctionalityTest?: string;
  canBusFunctionalityTest?: string;
  esdConformModule?: string;
  fixedBlock?: string;
  movingBlock?: string;
  tiltModule?: string;
  slideModule?: string;
  handAdapter?: string;
  lsmLeoniSmartModule?: string;
  leoniStandardTestTable?: string;
  metalRailsFasteningSystem?: string;
  metalPlatesFasteningSystem?: string;
  quickConnectionByCanonConnector?: string;
  testBoard?: string;
  weetech?: string;
  bak?: string;
  ogc?: string;
  adaptronicHighVoltage?: string;
  emdepHVBananaPlug?: string;
  leoniEMOStandardHV?: string;
  clipOrientation?: string;
  unitPrice?: number;
  totalPrice?: number;
}

// ============================================
// DTO COMPLET POUR LA LECTURE
// ============================================
export interface ChargeSheetComplete {
  id: number;
  plant: string;
  project: string;
  harnessRef: string;
  issuedBy: string;
  emailAddress: string;
  phoneNumber: string;
  orderNumber: string;
  costCenterNumber: string;
  date: string;
  preferredDeliveryDate: string;
  items: ChargeSheetItemDto[];
  status: ChargeSheetStatus;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}
export interface UploadResponse {
  filename: string;
  message: string;
}
// Ajoutez ces interfaces après les imports
export interface ReceptionItem {
  itemId: number;
  itemNumber: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityRemaining: number;
}

export interface ReceptionRequest {
  chargeSheetId: number;
  items: ReceptionItem[];
  receptionDate: string;
  deliveryNoteNumber: string;
  comments: string;
}

export interface ReceptionResponse {
  chargeSheetId: number;
  items: ReceptionItem[];
  message: string;
  complete: boolean;
}

export interface ReceptionHistory {
  id: number;
  quantityReceived: number;
  previousTotalReceived: number;
  newTotalReceived: number;
  quantityOrdered: number;
  deliveryNoteNumber: string;
  receptionDate: string;
  receivedBy: string;
  comments: string;
  createdAt: string;
  item: {
    id: number;
    itemNumber: string;
  };
}
// Dans charge-sheet.model.ts
export interface ReceptionHistoryDto {
  id: number;
  item: {
    id: number;
    itemNumber: string;
    housingReferenceLeoni: string;           // ✅ À AJOUTER
    housingReferenceSupplierCustomer: string; // ✅ À AJOUTER
    quantityOfTestModules: number;
  };
  quantityReceived: number;
  previousTotalReceived: number;
  newTotalReceived: number;
  quantityOrdered: number;
  deliveryNoteNumber: string;
  receptionDate: string;
  receivedBy: string;
  comments: string;
  createdAt: string;
  chargeSheetPlant?: string;                  // ✅ À AJOUTER (optionnel)
  chargeSheetProject?: string;
  chargeSheetOrderNumber?: string;
  housingReferenceSupplierCustomer?: string;
   chargeSheetId?: number;        // ✅ À AJOUTER // ✅ AJOUTER orderNumber
}
export interface ReceptionSummary {
  receptionId: number;
  receptionDate: string;
  deliveryNoteNumber: string;
  items: {
    itemId: number;
    itemNumber: string;
    quantityReceived: number;
  }[];
  totalItems: number;
  totalQuantity: number;
  receivedBy: string;
}
