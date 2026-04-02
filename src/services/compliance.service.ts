import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ComplianceDisplay, ComplianceDto, PrepareCompliance } from '../models/compliance.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  private apiUrl = `${environment.apiUrl}/api/v1/compliance`; // URL backend Spring Boot

  constructor(private http: HttpClient) {}

private getAuthHeaders(): HttpHeaders {
  const token = localStorage.getItem('access_token'); // ⚡ correct
  return new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
}


  // Créer une fiche de conformité
  createCompliance(compliance: ComplianceDto): Observable<ComplianceDto> {
    return this.http.post<ComplianceDto>(this.apiUrl, compliance, { headers: this.getAuthHeaders() });
  }
   createMultipleForItem(itemId: number): Observable<ComplianceDto[]> {
    return this.http.post<ComplianceDto[]>(`${this.apiUrl}/create-for-item/${itemId}`, {}, {
      headers: this.getAuthHeaders()
    });
  }
  // compliance.service.ts
getAll(): Observable<ComplianceDto[]> {
  return this.http.get<ComplianceDto[]>(this.apiUrl, { headers: this.getAuthHeaders() });
}
getAll2():Observable<ComplianceDisplay[]>{
   return this.http.get<ComplianceDisplay[]>(`${this.apiUrl}/display`, { headers: this.getAuthHeaders() });
}

  // Récupérer toutes les fiches pour un item
  getByItem(itemId: number): Observable<ComplianceDto[]> {
    return this.http.get<ComplianceDto[]>(`${this.apiUrl}/item/${itemId}`, { headers: this.getAuthHeaders() });
  }

  // Récupérer toutes les fiches pour un cahier de charge
  getByChargeSheet(chargeSheetId: number): Observable<ComplianceDto[]> {
    return this.http.get<ComplianceDto[]>(`${this.apiUrl}/charge-sheet/${chargeSheetId}`, { headers: this.getAuthHeaders() });
  }
getComplianceById(id: number): Observable<ComplianceDto> {
  return this.http.get<ComplianceDto>(`${this.apiUrl}/${id}`, {
    headers: this.getAuthHeaders()
  });
}

  // Mettre à jour une fiche
  // compliance.service.ts
updateCompliance(id: number, compliance: Partial<ComplianceDto>): Observable<ComplianceDto> {
  return this.http.put<ComplianceDto>(`${this.apiUrl}/${id}`, compliance, { headers: this.getAuthHeaders() });
}


  // Supprimer une fiche
  deleteCompliance(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
  // Ajoutez ces méthodes
prepareComplianceForItem(itemId: number): Observable<PrepareCompliance[]> {

  return this.http.get<PrepareCompliance[]>(`${this.apiUrl}/prepare/${itemId}`, { headers: this.getAuthHeaders() });
}

createComplianceForReceivedQuantity(itemId: number, numberOfSheets: number): Observable<ComplianceDto[]> {

  return this.http.post<ComplianceDto[]>(`${this.apiUrl}/create-for-received/${itemId}?numberOfSheets=${numberOfSheets}`, { headers: this.getAuthHeaders() });
}
getComplianceByItem(itemId: number): Observable<ComplianceDto[]> {

  return this.http.get<ComplianceDto[]>(`${this.apiUrl}/item/${itemId}`, { headers: this.getAuthHeaders() });
}
}
