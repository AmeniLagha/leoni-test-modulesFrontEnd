// src/models/stats.model.ts
export interface ProjectStats {
  userRole: string;
  userProject: string;
  projectName: string;
  totalSheets: number;
  pendingIng: number;
  pendingPt: number;
  pendingFinal: number;
  completed: number;
  techFilled: number;
  completionRate: number;
}
