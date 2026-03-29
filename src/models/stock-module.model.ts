export interface StockModule {
  id?: number;
  technicalFileId: number;
  finalDisplacement?: number;
  finalProgrammedSealing?: number;
  finalDetection?: string;
  movedBy?: string;
  movedAt?: string;  // date au format ISO
  status?: 'AVAILABLE' | 'USED' | 'SCRAPPED';
}
