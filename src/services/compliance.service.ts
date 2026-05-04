import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ComplianceDisplay, ComplianceDto, PrepareCompliance } from '../models/compliance.model';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';

// ✅ Interface ApiResponse (ou importer depuis un fichier partagé)
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  private apiUrl = `${environment.apiUrl}/api/v1/compliance`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  // ✅ Méthode utilitaire pour extraire data
  private extractData<T>(response: ApiResponse<T>): T {
    return response.data;
  }

  // Créer une fiche de conformité
  createCompliance(compliance: ComplianceDto): Observable<ComplianceDto> {
    return this.http.post<ApiResponse<ComplianceDto>>(this.apiUrl, compliance, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  createMultipleForItem(itemId: number): Observable<ComplianceDto[]> {
    return this.http.post<ApiResponse<ComplianceDto[]>>(`${this.apiUrl}/create-for-item/${itemId}`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(map(res => this.extractData(res)));
  }

  getAll(): Observable<ComplianceDto[]> {
    return this.http.get<ApiResponse<ComplianceDto[]>>(this.apiUrl, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  getAll2(): Observable<ComplianceDisplay[]> {
    return this.http.get<ApiResponse<ComplianceDisplay[]>>(`${this.apiUrl}/display`, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  // Récupérer toutes les fiches pour un item
  getByItem(itemId: number): Observable<ComplianceDto[]> {
    return this.http.get<ApiResponse<ComplianceDto[]>>(`${this.apiUrl}/item/${itemId}`, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  // Récupérer toutes les fiches pour un cahier de charge
  getByChargeSheet(chargeSheetId: number): Observable<ComplianceDto[]> {
    return this.http.get<ApiResponse<ComplianceDto[]>>(`${this.apiUrl}/charge-sheet/${chargeSheetId}`, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  getComplianceById(id: number): Observable<ComplianceDto> {
    return this.http.get<ApiResponse<ComplianceDto>>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  // Mettre à jour une fiche
  updateCompliance(id: number, compliance: Partial<ComplianceDto>): Observable<ComplianceDto> {
    return this.http.put<ApiResponse<ComplianceDto>>(`${this.apiUrl}/${id}`, compliance, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  // Supprimer une fiche
  deleteCompliance(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(map(() => void 0));
  }

  // Préparer les fiches de conformité pour un item
  prepareComplianceForItem(itemId: number): Observable<PrepareCompliance[]> {
    return this.http.get<ApiResponse<PrepareCompliance[]>>(`${this.apiUrl}/prepare/${itemId}`, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  // Créer des fiches de conformité pour les quantités reçues
  createComplianceForReceivedQuantity(itemId: number, numberOfSheets: number): Observable<ComplianceDto[]> {
    return this.http.post<ApiResponse<ComplianceDto[]>>(`${this.apiUrl}/create-for-received/${itemId}?numberOfSheets=${numberOfSheets}`,
      { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  getComplianceByItem(itemId: number): Observable<ComplianceDto[]> {
    return this.http.get<ApiResponse<ComplianceDto[]>>(`${this.apiUrl}/item/${itemId}`, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  // ============ NOUVELLES MÉTHODES POUR LES STATISTIQUES ============

  /** Récupérer la variation entre deux mois spécifiques pour les conformités */
  getVariationBetweenMonths(month1: string, month2: string, project?: string): Observable<any> {
    let url = `${this.apiUrl}/stats/monthly-variation?month1=${month1}&month2=${month2}`;
    if (project && project !== 'ALL') {
      url += `&project=${project}`;
    }
    return this.http.get<ApiResponse<any>>(url, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  /** Récupérer la variation entre les deux derniers mois pour les conformités */
  getLastTwoMonthsVariation(project?: string): Observable<any> {
    let url = `${this.apiUrl}/stats/last-two-months`;
    if (project && project !== 'ALL') {
      url += `?project=${project}`;
    }
    return this.http.get<ApiResponse<any>>(url, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  /** Récupérer les statistiques mensuelles des conformités */
  getMonthlyComplianceStats(months: number = 6, project?: string): Observable<any> {
    let url = `${this.apiUrl}/stats/monthly-stats?months=${months}`;
    if (project && project !== 'ALL') {
      url += `&project=${project}`;
    }
    return this.http.get<ApiResponse<any>>(url, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }
}
