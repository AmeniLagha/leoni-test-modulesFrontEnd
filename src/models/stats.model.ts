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
  // Nouveaux champs pour la variation mensuelle
  monthlyVariation?: MonthlyVariation;
}
export interface MonthlyVariation {
  currentMonth: string;
  currentMonthCount: number;
  previousMonth: string;
  previousMonthCount: number;
  variation: number;
  trend: 'hausse' | 'baisse' | 'stable';
  formula: string;
  interpretation: string;
}
