import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateStockModuleDto, StockModule } from '../models/stock-module.model';
import { environment } from '../environments/environment';
import { Site } from '../models/site.model';

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
 // ✅ Créer un nouveau module en stock
  createStockModule(dto: CreateStockModuleDto): Observable<StockModule> {
    return this.http.post<StockModule>(this.apiUrl, dto, { headers: this.getAuthHeaders() });
  }

  // Mettre à jour un module
  updateStockModule(id: number, dto: Partial<CreateStockModuleDto>): Observable<StockModule> {
    return this.http.put<StockModule>(`${this.apiUrl}/${id}`, dto, { headers: this.getAuthHeaders() });
  }
  // stock.service.ts - Ajoutez ces méthodes
  getStockBySiteName(siteName: string): Observable<StockModule[]> {
    return this.http.get<StockModule[]>(`${this.apiUrl}/site/${encodeURIComponent(siteName)}`, {
      headers: this.getAuthHeaders()
    });
  }
getStockBySiteAndProject(siteId: number, projectId: number): Observable<StockModule[]> {
  return this.http.get<StockModule[]>(`${this.apiUrl}/stock-modules/site/${siteId}/projet/${projectId}`);
}

getSitesWithStock(): Observable<Site[]> {
  return this.http.get<Site[]>(`${this.apiUrl}/sites/with-stock`);
}
// stock.service.ts - Ajouter ces méthodes
getPreStockInfo(technicalFileItemId: number): Observable<any> {
  return this.http.get<any>(
    `${this.apiUrl}/item/${technicalFileItemId}/pre-stock-info`,
    { headers: this.getAuthHeaders() }
  );
}

moveItemToStockWithInfo(technicalFileItemId: number, stockInfo: any): Observable<any> {
  return this.http.post<any>(
    `${this.apiUrl}/move-item/${technicalFileItemId}`,
    stockInfo,
    { headers: this.getAuthHeaders() }
  );
}

}
