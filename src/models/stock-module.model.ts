// stock-module.model.ts
export interface StockModule {
  id?: number;
  technicalFileId?: number;
  technicalFileItemId?: number;
  chargeSheetItemId?: number;
  itemNumber?: string;
  position?: string;
  finalDisplacement?: number;
  finalProgrammedSealing?: number;
  finalDetection?: string;
  movedBy?: string;
  movedAt?: string;
  status?: 'AVAILABLE' | 'USED' | 'SCRAPPED';
  siteId?: number;
  // Nouveaux champs
  casier?: string;
  stuffNumr?: string;
  leoniNumr?: string;
  indexValue?: string;
  quantite?: number;
  fournisseur?: string;
  etat?: string;
  caisse?: string;
  specifications?: string;
  dernierMaj?: string;
  infoSurModules?: string;
  demandeurExplication?: string;
  dateDemande?: string;
  newQuantite?: number;
}

// DTO pour la création
export interface CreateStockModuleDto {
  casier?: string;
  stuffNumr?: string;
  leoniNumr?: string;
  indexValue?: string;
  quantite?: number;
  fournisseur?: string;
  etat?: string;
  caisse?: string;
  specifications?: string;
  dernierMaj?: string;
  infoSurModules?: string;
  demandeurExplication?: string;
  dateDemande?: string;
  newQuantite?: number;
  finalDisplacement?: number;
  finalProgrammedSealing?: number;
  finalDetection?: string;

}
