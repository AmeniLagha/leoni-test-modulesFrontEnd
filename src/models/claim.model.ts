export interface ClaimCreateDto {
  chargeSheetId: number;
  relatedTo: string;
  relatedId: number;
imagePath : string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  assignedTo: string
}
export interface Claim {
  id: number;
  title: string;
  priority: string;
  status: string;
  reportedBy: string;
  reportedDate: string | Date;
  assignedTo?: string;
  assignedDate?: string | Date;
imagePath? : string;
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
}

