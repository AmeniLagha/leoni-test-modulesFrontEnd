// technical-file.service.ts
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
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

@Injectable({
  providedIn: 'root'
})
export class TechnicalFileService {

  private api = 'http://localhost:8081/api/v1/technical-files';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // ==================== DOSSIERS ====================

  // Créer un dossier technique avec plusieurs items
  create(dto: TechnicalFileCreate): Observable<TechnicalFileResponse> {
    return this.http.post<TechnicalFileResponse>(this.api, dto, {
      headers: this.getAuthHeaders()
    });
  }

  // Récupérer tous les dossiers avec leurs items
  getAllDetailed(): Observable<TechnicalFileDetail[]> {
    return this.http.get<TechnicalFileDetail[]>(`${this.api}/detail`, {
      headers: this.getAuthHeaders()
    });
  }

  // Récupérer un dossier technique par ID
  getById(id: number): Observable<TechnicalFileResponse> {
    return this.http.get<TechnicalFileResponse>(`${this.api}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Mettre à jour un dossier technique
  update(id: number, dto: UpdateTechnicalFileDto): Observable<TechnicalFileResponse> {
    return this.http.put<TechnicalFileResponse>(`${this.api}/${id}`, dto, {
      headers: this.getAuthHeaders()
    });
  }

  // Supprimer un dossier technique
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Récupérer la liste des dossiers (pour sélection)
  getList(): Observable<TechnicalFileListItem[]> {
    return this.http.get<TechnicalFileListItem[]>(`${this.api}/list`, {
      headers: this.getAuthHeaders()
    });
  }

  // ==================== ITEMS ====================

  // Récupérer un item par son ID
  getItemById(itemId: number): Observable<TechnicalFileItemDetail> {
    return this.http.get<TechnicalFileItemDetail>(`${this.api}/items/${itemId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Mettre à jour un item
  updateItem(itemId: number, dto: UpdateItemDto): Observable<TechnicalFileItemDetail> {
    return this.http.put<TechnicalFileItemDetail>(`${this.api}/items/${itemId}`, dto, {
      headers: this.getAuthHeaders()
    });
  }

  // Supprimer un item
  deleteItem(itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/items/${itemId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Ajouter un item à un dossier existant
  addItemToTechnicalFile(technicalFileId: number, dto: AddItemToTechnicalFileDto): Observable<any> {
    return this.http.post(`${this.api}/${technicalFileId}/items`, dto, {
      headers: this.getAuthHeaders()
    });
  }

  // ==================== HISTORIQUE ====================

  // Historique audité d'un item
  getItemAuditedHistory(itemId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/items/${itemId}/history-audited`, {
      headers: this.getAuthHeaders()
    });
  }

  // Historique complet d'un dossier (items inclus)
  getFullHistoryAudited(fileId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/${fileId}/full-history-audited`, {
      headers: this.getAuthHeaders()
    });
  }
  // technical-file.service.ts
validateItem(itemId: number): Observable<TechnicalFileItemDetail> {
  return this.http.put<TechnicalFileItemDetail>(`${this.api}/items/${itemId}/validate`, {}, {
    headers: this.getAuthHeaders()
  });
}

canValidateItem(itemId: number): Observable<boolean> {
  return this.http.get<boolean>(`${this.api}/items/${itemId}/can-validate`, {
    headers: this.getAuthHeaders()
  });
}
}
