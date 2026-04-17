// claim.model.ts
export interface ClaimCreateDto {
  chargeSheetId: number;
  relatedTo: string;
  relatedId: number;
  imagePath: string;

  // NOUVEAUX CHAMPS
  plant: string;
  customer: string;
  contactPerson: string;
  customerEmail: string;
  customerPhone: string;
  supplier: string;
  supplierContactPerson: string;
  orderNumber: string;
  testModuleNumber: string;
  testModuleQuantity: number;
  ppoSignature: string;
  problemWhatHappened: string;
  problemWhy: string;
  problemWhenDetected: string;
  problemWhoDetected: string;
  problemWhereDetected: string;
  problemHowDetected: string;
  claimDate: string;

  // Champs existants
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  assignedTo: string;
}

export interface Claim {
  id: number;
  chargeSheetId: number;

  // NOUVEAUX CHAMPS
  plant?: string;
  customer?: string;
  contactPerson?: string;
  customerEmail?: string;
  customerPhone?: string;
  supplier?: string;
  supplierContactPerson?: string;
  orderNumber?: string;
  testModuleNumber?: string;
  testModuleQuantity?: number;
  ppoSignature?: string;
  problemWhatHappened?: string;
  problemWhy?: string;
  problemWhenDetected?: string;
  problemWhoDetected?: string;
  problemWhereDetected?: string;
  problemHowDetected?: string;
  claimDate?: string | Date;
  description?: string;

  // Champs existants
  title: string;
  priority: string;
  status: string;
  reportedBy: string;
  reportedDate: string | Date;
  assignedTo?: string;
  assignedDate?: string | Date;
  imagePath?: string;
  actionTaken?: string;
  resolution?: string;
  resolvedBy?: string;
  resolvedDate?: string | Date;
  estimatedResolutionDate?: string | Date;
  actualResolutionDate?: string | Date;
  closedBy?: string;
  closedDate?: string | Date;
  createdBy?: string;
  createdAt?: string | Date;
  updatedBy?: string;
  updatedAt?: string | Date;
  relatedTo?: string;  // "CHARGE_SHEET", "COMPLIANCE", "TECHNICAL_FILE"
  relatedId?: number;
}
