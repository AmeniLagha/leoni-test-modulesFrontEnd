import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StockModule } from '../models/stock-module.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockService {

  private apiUrl = `${environment.apiUrl}/api/v1/stock`; // à adapter selon ton backend

  constructor(private http: HttpClient) {}
private getAuthHeaders(): HttpHeaders {
  const token = localStorage.getItem('access_token'); // ⚡ correct
  return new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
}
  // Déplacer un dossier technique en stock
 moveToStock(technicalFileId: number): Observable<StockModule> {
  return this.http.post<StockModule>(
    `${this.apiUrl}/move/${technicalFileId}`,
    null, // corps vide
    { headers: this.getAuthHeaders() }
  );
}
// stock.service.ts
moveItemToStock(technicalFileItemId: number): Observable<any> {
  return this.http.post<any>(
    `${this.apiUrl}/move-item/${technicalFileItemId}`,
    null,
    { headers: this.getAuthHeaders() }
  );
}

  // Lister tous les modules en stock
  getAllStock(): Observable<StockModule[]> {
    return this.http.get<StockModule[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  // Récupérer un module stock par ID
  getStockById(id: number): Observable<StockModule> {
    return this.http.get<StockModule>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
  updateStatus(id: number, status: 'AVAILABLE' | 'USED' | 'SCRAPPED') {
  return this.http.patch<StockModule>(
    `${this.apiUrl}/${id}/status?status=${status}`,
    {}, // corps vide pour PATCH
    { headers: this.getAuthHeaders() }
  );
}
}
