import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ClaimCreateDto, Claim } from "../models/claim.model";
import { Observable, map } from "rxjs";
import { environment } from "../environments/environment";

// ✅ Interface ApiResponse (ou importer depuis un fichier partagé)
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ClaimService {

  private api = `${environment.apiUrl}/api/v1/claims`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  createClaim(dto: ClaimCreateDto): Observable<Claim> {
    return this.http.post<ApiResponse<Claim>>(this.api, dto, { headers: this.getAuthHeaders() })
      .pipe(map(response => response.data));
  }

  getAllClaims(): Observable<Claim[]> {
    return this.http.get<ApiResponse<Claim[]>>(this.api, { headers: this.getAuthHeaders() })
      .pipe(map(response => response.data));
  }

  assign(id: number, dto: any): Observable<Claim> {
    return this.http.put<ApiResponse<Claim>>(`${this.api}/${id}/assign`, dto, { headers: this.getAuthHeaders() })
      .pipe(map(response => response.data));
  }

  start(id: number): Observable<Claim> {
    return this.http.patch<ApiResponse<Claim>>(`${this.api}/${id}/status/IN_PROGRESS`, {}, { headers: this.getAuthHeaders() })
      .pipe(map(response => response.data));
  }

  resolve(id: number, dto: any): Observable<Claim> {
    return this.http.put<ApiResponse<Claim>>(`${this.api}/${id}/resolve`, dto, { headers: this.getAuthHeaders() })
      .pipe(map(response => response.data));
  }

  // ==================== GESTION DES IMAGES ====================
  uploadClaimImage(claimId: number, file: File): Observable<{ filename: string; path: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<{ filename: string; path: string; message: string }>>(
      `${this.api}/${claimId}/upload-image`,
      formData,
      { headers: this.getAuthHeaders() }
    ).pipe(map(response => response.data));
  }

  getClaimImageUrl(claimId: number): Observable<Blob> {
    return this.http.get(`${this.api}/${claimId}/image`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  deleteClaimImage(claimId: number): Observable<{ message: string }> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.api}/${claimId}/image`, {
      headers: this.getAuthHeaders()
    }).pipe(map(response => response.data));
  }

  deleteClaim(claimId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${claimId}`, { headers: this.getAuthHeaders() })
      .pipe(map(() => void 0));
  }

  /** Récupérer la variation entre les deux derniers mois pour les réclamations */
  getLastTwoMonthsVariation(project?: string): Observable<any> {
    let url = `${this.api}/stats/last-two-months`;
    if (project && project !== 'ALL') {
      url += `?project=${project}`;
    }
    return this.http.get<ApiResponse<any>>(url, { headers: this.getAuthHeaders() })
      .pipe(map(response => response.data));
  }

  /** Récupérer la variation entre deux mois spécifiques pour les réclamations */
  getVariationBetweenMonths(month1: string, month2: string, project?: string): Observable<any> {
    let url = `${this.api}/stats/monthly-variation?month1=${month1}&month2=${month2}`;
    if (project && project !== 'ALL') {
      url += `&project=${project}`;
    }
    return this.http.get<ApiResponse<any>>(url, { headers: this.getAuthHeaders() })
      .pipe(map(response => response.data));
  }
}
