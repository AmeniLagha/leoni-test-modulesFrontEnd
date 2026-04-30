// technical-file.model.ts

// ============================================
// DTO POUR LA CRÉATION
// ============================================
export interface TechnicalFileItemCreate {
  chargeSheetItemId: number;
  maintenanceDate?: string;
  technicianName?: string;
  xCode?: string;
    indexValue?: number;
  leoniReferenceNumber?: string;
  producer?: string;
  type?: string;
  referencePinePushBack?: string;
  position?: string;
  pinRigidityM1?: string;
  pinRigidityM2?: string;
  pinRigidityM3?: string;
  displacementPathM1?: string;
  displacementPathM2?: string;
  displacementPathM3?: string;
  maxSealingValueM1?: string;
  maxSealingValueM2?: string;
  maxSealingValueM3?: string;
  programmedSealingValueM1?: string;
  programmedSealingValueM2?: string;
  programmedSealingValueM3?: string;
  detectionsM1?: string;
  detectionsM2?: string;
  detectionsM3?: string;
  remarks?: string;
  // ✅ AJOUTER CES CHAMPS
  validationStatus?: string;        // DRAFT, VALIDATED_PP, VALIDATED_MC, VALIDATED_MP
  validationStatusDisplay?: string; // Brouillon, Validé PP, etc.
  validatedByPp?: string;
  validatedAtPp?: string;
  validatedByMc?: string;
  validatedAtMc?: string;
  validatedByMp?: string;
  validatedAtMp?: string;
}

export interface TechnicalFileCreate {
  reference?: string;
  items: TechnicalFileItemCreate[];
}

// ============================================
// DTO POUR LA MISE À JOUR D'UN ITEM
// ============================================
export interface UpdateItemDto {
  maintenanceDate?: string;
  technicianName?: string;
  xCode?: string;
    indexValue?: number;
  leoniReferenceNumber?: string;
  producer?: string;
  type?: string;
  referencePinePushBack?: string;
  position?: string;
  pinRigidityM1?: string;
  pinRigidityM2?: string;
  pinRigidityM3?: string;
  displacementPathM1?: string;
  displacementPathM2?: string;
  displacementPathM3?: string;
  maxSealingValueM1?: string;
  maxSealingValueM2?: string;
  maxSealingValueM3?: string;
  programmedSealingValueM1?: string;
  programmedSealingValueM2?: string;
  programmedSealingValueM3?: string;
  detectionsM1?: string;
  detectionsM2?: string;
  detectionsM3?: string;
  remarks?: string;
}

// ============================================
// DTO POUR LA MISE À JOUR D'UN DOSSIER
// ============================================
export interface UpdateTechnicalFileDto {
  reference?: string;
  items?: UpdateItemDto[];
}

// ============================================
// DTO POUR LA RÉPONSE D'UN ITEM (depuis /items/{itemId})
// ============================================
export interface TechnicalFileItemDetail {
  id: number;
  chargeSheetItemId: number;
  itemNumber: string;
  maintenanceDate?: string;
  technicianName?: string;
  xcode?: string;
    indexValue?: number;

  leoniReferenceNumber?: string;
  producer?: string;
  type?: string;
  referencePinePushBack?: string;
  position?: string;
  pinRigidityM1?: string;
  pinRigidityM2?: string;
  pinRigidityM3?: string;
  displacementPathM1?: string;
  displacementPathM2?: string;
  displacementPathM3?: string;
  maxSealingValueM1?: string;
  maxSealingValueM2?: string;
  maxSealingValueM3?: string;
  programmedSealingValueM1?: string;
  programmedSealingValueM2?: string;
  programmedSealingValueM3?: string;
  detectionsM1?: string;
  detectionsM2?: string;
  detectionsM3?: string;
  remarks?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  technicalFileId?: number;
}

// ============================================
// DTO POUR LA RÉPONSE D'UN DOSSIER (AVEC ITEMS)
// ============================================
export interface TechnicalFileResponse {
  id: number;
   xCode?: string;
  reference?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  items: TechnicalFileItemDetail[];
}

// ============================================
// DTO POUR LA LISTE SIMPLIFIÉE
// ============================================
export interface TechnicalFileListItem {
  id: number;
  reference?: string;
  itemCount: number;
}

// ============================================
// DTO POUR AJOUTER UN ITEM À UN DOSSIER EXISTANT
// ============================================
export interface AddItemToTechnicalFileDto {
  chargeSheetItemId: number;
  maintenanceDate?: string;
  technicianName?: string;
  xCode?: string;
   indexValue?: number;
  leoniReferenceNumber?: string;
  producer?: string;
  type?: string;
  referencePinePushBack?: string;
  position?: string;
  pinRigidityM1?: string;
  pinRigidityM2?: string;
  pinRigidityM3?: string;
  displacementPathM1?: string;
  displacementPathM2?: string;
  displacementPathM3?: string;
  maxSealingValueM1?: string;
  maxSealingValueM2?: string;
  maxSealingValueM3?: string;
  programmedSealingValueM1?: string;
  programmedSealingValueM2?: string;
  programmedSealingValueM3?: string;
  detectionsM1?: string;
  detectionsM2?: string;
  detectionsM3?: string;
  remarks?: string;
  // ✅ AJOUTER CES CHAMPS
  validationStatus?: string;        // DRAFT, VALIDATED_PP, VALIDATED_MC, VALIDATED_MP
  validationStatusDisplay?: string; // Brouillon, Validé PP, etc.
  validatedByPp?: string;
  validatedAtPp?: string;
  validatedByMc?: string;
  validatedAtMc?: string;
  validatedByMp?: string;
  validatedAtMp?: string;
}

// ============================================
// DTO POUR L'AFFICHAGE DÉTAILLÉ (depuis /detail)
// ============================================
export interface TechnicalFileItemDisplay {
  id: number;
  chargeSheetItemId: number;
  itemNumber: string;
  technicianName?: string;
  xCode?: string;
  position?: string;
   maintenanceDate?: string;        // ✅ AJOUTÉ
  leoniReferenceNumber?: string;    // ✅ AJOUTÉ
  indexValue?: number;              // ✅ AJOUTÉ
  producer?: string;                // ✅ AJOUTÉ
  type?: string;                    // ✅ AJOUTÉ
  referencePinePushBack?: string;   // ✅ AJOUTÉ
  // ✅ TOUS LES CHAMPS TECHNIQUES AJOUTÉS
  pinRigidityM1?: string;
  pinRigidityM2?: string;
  pinRigidityM3?: string;
  displacementPathM1?: string;
  displacementPathM2?: string;
  displacementPathM3?: string;
  maxSealingValueM1?: string;
  maxSealingValueM2?: string;
  maxSealingValueM3?: string;
  programmedSealingValueM1?: string;
  programmedSealingValueM2?: string;
  programmedSealingValueM3?: string;
  detectionsM1?: string;
  detectionsM2?: string;
  detectionsM3?: string;
  remarks?: string;
  // ✅ AJOUTER CES CHAMPS
  validationStatus?: string;        // DRAFT, VALIDATED_PP, VALIDATED_MC, VALIDATED_MP
  validationStatusDisplay?: string; // Brouillon, Validé PP, etc.
  validatedByPp?: string;
  validatedAtPp?: string;
  validatedByMc?: string;
  validatedAtMc?: string;
  validatedByMp?: string;
  validatedAtMp?: string;
}

export interface TechnicalFileDetail {
  id: number;
  xcode?: string;
  reference?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  items: TechnicalFileItemDisplay[];
}
