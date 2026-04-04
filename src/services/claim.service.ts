import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ClaimCreateDto, Claim } from "../models/claim.model";
import { Observable } from "rxjs";
import { environment } from "../environments/environment";

@Injectable({ providedIn: 'root' })
export class ClaimService {

  private api = `${environment.apiUrl}/api/v1/claims`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  createClaim(dto: ClaimCreateDto) {
    return this.http.post<Claim>(this.api, dto, { headers: this.getAuthHeaders() });
  }

  getAllClaims() {
    return this.http.get<Claim[]>(this.api, { headers: this.getAuthHeaders() });
  }

  assign(id: number, dto: any) {
    return this.http.put<Claim>(`${this.api}/${id}/assign`, dto, { headers: this.getAuthHeaders() });
  }

  start(id: number) {
    return this.http.patch<Claim>(`${this.api}/${id}/status/IN_PROGRESS`, {}, { headers: this.getAuthHeaders() });
  }

  resolve(id: number, dto: any) {
    return this.http.put<Claim>(`${this.api}/${id}/resolve`, dto, { headers: this.getAuthHeaders() });
  }
   // ==================== GESTION DES IMAGES ====================
  uploadClaimImage(claimId: number, file: File): Observable<{ filename: string; path: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ filename: string; path: string; message: string }>(
      `${this.api}/${claimId}/upload-image`,
      formData,
      { headers: this.getAuthHeaders() }
    );
  }

  getClaimImageUrl(claimId: number): Observable<Blob> {
    return this.http.get(`${this.api}/${claimId}/image`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  deleteClaimImage(claimId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/${claimId}/image`, {
      headers: this.getAuthHeaders()
    });
  }
// claim.service.ts - Ajoutez ces méthodes

/** Récupérer la variation entre les deux derniers mois pour les réclamations */
getLastTwoMonthsVariation(project?: string): Observable<any> {
  let url = `${this.api}/stats/last-two-months`;
  if (project && project !== 'ALL') {
    url += `?project=${project}`;
  }
  return this.http.get<any>(url, { headers: this.getAuthHeaders() });
}

/** Récupérer la variation entre deux mois spécifiques pour les réclamations */
getVariationBetweenMonths(month1: string, month2: string, project?: string): Observable<any> {
  let url = `${this.api}/stats/monthly-variation?month1=${month1}&month2=${month2}`;
  if (project && project !== 'ALL') {
    url += `&project=${project}`;
  }
  return this.http.get<any>(url, { headers: this.getAuthHeaders() });
}
}
