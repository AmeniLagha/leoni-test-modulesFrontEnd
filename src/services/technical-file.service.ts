// technical-file.service.ts
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import {
  TechnicalFileCreate,
  TechnicalFileResponse,
  TechnicalFileListItem,
  AddItemToTechnicalFileDto,
  TechnicalFileDetail,
  TechnicalFileItemDetail,
  UpdateTechnicalFileDto,
  UpdateItemDto
} from "../models/technical-file.model";
import { environment } from "../environments/environment";

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
export class TechnicalFileService {

  private api = `${environment.apiUrl}/api/v1/technical-files`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  // ✅ Méthode utilitaire pour extraire data
  private extractData<T>(response: ApiResponse<T>): T {
    return response.data;
  }

  // ==================== DOSSIERS ====================

  // Créer un dossier technique avec plusieurs items
  create(dto: TechnicalFileCreate): Observable<TechnicalFileResponse> {
    return this.http.post<ApiResponse<TechnicalFileResponse>>(this.api, dto, {
      headers: this.getAuthHeaders()
    }).pipe(map(res => this.extractData(res)));
  }

  // Récupérer tous les dossiers avec leurs items
  getAllDetailed(): Observable<TechnicalFileDetail[]> {
    return this.http.get<ApiResponse<TechnicalFileDetail[]>>(`${this.api}/detail`, {
      headers: this.getAuthHeaders()
    }).pipe(map(res => this.extractData(res)));
  }

  // Récupérer un dossier technique par ID
  getById(id: number): Observable<TechnicalFileResponse> {
    return this.http.get<ApiResponse<TechnicalFileResponse>>(`${this.api}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(map(res => this.extractData(res)));
  }

  // Mettre à jour un dossier technique
  update(id: number, dto: UpdateTechnicalFileDto): Observable<TechnicalFileResponse> {
    return this.http.put<ApiResponse<TechnicalFileResponse>>(`${this.api}/${id}`, dto, {
      headers: this.getAuthHeaders()
    }).pipe(map(res => this.extractData(res)));
  }

  // Supprimer un dossier technique
  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(map(() => void 0));
  }

  // Récupérer la liste des dossiers (pour sélection)
  getList(): Observable<TechnicalFileListItem[]> {
    return this.http.get<ApiResponse<TechnicalFileListItem[]>>(`${this.api}/list`, {
      headers: this.getAuthHeaders()
    }).pipe(map(res => this.extractData(res)));
  }

  // ==================== ITEMS ====================

  // Récupérer un item par son ID
  getItemById(itemId: number): Observable<TechnicalFileItemDetail> {
    return this.http.get<ApiResponse<TechnicalFileItemDetail>>(`${this.api}/items/${itemId}`, {
      headers: this.getAuthHeaders()
    }).pipe(map(res => this.extractData(res)));
  }

  // Mettre à jour un item
  updateItem(itemId: number, dto: UpdateItemDto): Observable<TechnicalFileItemDetail> {
    return this.http.put<ApiResponse<TechnicalFileItemDetail>>(`${this.api}/items/${itemId}`, dto, {
      headers: this.getAuthHeaders()
    }).pipe(map(res => this.extractData(res)));
  }

  // Supprimer un item
  deleteItem(itemId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/items/${itemId}`, {
      headers: this.getAuthHeaders()
    }).pipe(map(() => void 0));
  }

  // Ajouter un item à un dossier existant
  addItemToTechnicalFile(technicalFileId: number, dto: AddItemToTechnicalFileDto): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.api}/${technicalFileId}/items`, dto, {
      headers: this.getAuthHeaders()
    }).pipe(map(res => this.extractData(res)));
  }

  // ==================== HISTORIQUE ====================

  // Historique audité d'un item
  getItemAuditedHistory(itemId: number): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.api}/items/${itemId}/history-audited`, {
      headers: this.getAuthHeaders()
    }).pipe(map(res => this.extractData(res)));
  }

  // Historique complet d'un dossier (items inclus)
  getFullHistoryAudited(fileId: number): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.api}/${fileId}/full-history-audited`, {
      headers: this.getAuthHeaders()
    }).pipe(map(res => this.extractData(res)));
  }

  // ==================== VALIDATION ====================

  // Valider un item (PP, MC, MP)
  validateItem(itemId: number): Observable<TechnicalFileItemDetail> {
    return this.http.put<ApiResponse<TechnicalFileItemDetail>>(`${this.api}/items/${itemId}/validate`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(map(res => this.extractData(res)));
  }

  // Vérifier si l'utilisateur peut valider un item
  canValidateItem(itemId: number): Observable<boolean> {
    return this.http.get<ApiResponse<boolean>>(`${this.api}/items/${itemId}/can-validate`, {
      headers: this.getAuthHeaders()
    }).pipe(map(res => this.extractData(res)));
  }

  // Comparer la première et la dernière version d'un item
  getFirstAndCurrentVersions(itemId: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.api}/items/${itemId}/versions-compare`, {
      headers: this.getAuthHeaders()
    }).pipe(map(res => this.extractData(res)));
  }
}
