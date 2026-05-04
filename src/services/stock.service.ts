import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CreateStockModuleDto, StockModule } from '../models/stock-module.model';
import { environment } from '../environments/environment';
import { Site } from '../models/site.model';

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
export class StockService {

  private apiUrl = `${environment.apiUrl}/api/v1/stock`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  // ✅ Méthode utilitaire pour extraire data
  private extractData<T>(response: ApiResponse<T>): T {
    return response.data;
  }

  // Déplacer un dossier technique en stock
  moveToStock(technicalFileId: number): Observable<StockModule> {
    return this.http.post<ApiResponse<StockModule>>(
      `${this.apiUrl}/move/${technicalFileId}`,
      null,
      { headers: this.getAuthHeaders() }
    ).pipe(map(res => this.extractData(res)));
  }

  // Déplacer un item technique en stock
  moveItemToStock(technicalFileItemId: number): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/move-item/${technicalFileItemId}`,
      null,
      { headers: this.getAuthHeaders() }
    ).pipe(map(res => this.extractData(res)));
  }

  // Lister tous les modules en stock
  getAllStock(): Observable<StockModule[]> {
    return this.http.get<ApiResponse<StockModule[]>>(this.apiUrl, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  // Récupérer un module stock par ID
  getStockById(id: number): Observable<StockModule> {
    return this.http.get<ApiResponse<StockModule>>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  // Changer le statut d'un module
  updateStatus(id: number, status: 'AVAILABLE' | 'USED' | 'SCRAPPED'): Observable<StockModule> {
    return this.http.patch<ApiResponse<StockModule>>(
      `${this.apiUrl}/${id}/status?status=${status}`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(map(res => this.extractData(res)));
  }

  // Créer un nouveau module en stock
  createStockModule(dto: CreateStockModuleDto): Observable<StockModule> {
    return this.http.post<ApiResponse<StockModule>>(this.apiUrl, dto, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  // Mettre à jour un module
  updateStockModule(id: number, dto: Partial<CreateStockModuleDto>): Observable<StockModule> {
    return this.http.put<ApiResponse<StockModule>>(`${this.apiUrl}/${id}`, dto, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  // Récupérer le stock par nom de site
  getStockBySiteName(siteName: string): Observable<StockModule[]> {
    return this.http.get<ApiResponse<StockModule[]>>(`${this.apiUrl}/site/${encodeURIComponent(siteName)}`, {
      headers: this.getAuthHeaders()
    }).pipe(map(res => this.extractData(res)));
  }

  // Récupérer le stock par site et projet
  getStockBySiteAndProject(siteId: number, projectId: number): Observable<StockModule[]> {
    return this.http.get<ApiResponse<StockModule[]>>(`${this.apiUrl}/stock-modules/site/${siteId}/projet/${projectId}`)
      .pipe(map(res => this.extractData(res)));
  }

  // Récupérer les sites qui ont du stock
  getSitesWithStock(): Observable<Site[]> {
    return this.http.get<ApiResponse<Site[]>>(`${this.apiUrl}/sites/with-stock`)
      .pipe(map(res => this.extractData(res)));
  }

  // Récupérer les infos pré-stock d'un item technique
  getPreStockInfo(technicalFileItemId: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/item/${technicalFileItemId}/pre-stock-info`,
      { headers: this.getAuthHeaders() }
    ).pipe(map(res => this.extractData(res)));
  }

  // Déplacer un item en stock avec informations supplémentaires
  moveItemToStockWithInfo(technicalFileItemId: number, stockInfo: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/move-item/${technicalFileItemId}`,
      stockInfo,
      { headers: this.getAuthHeaders() }
    ).pipe(map(res => this.extractData(res)));
  }
}
