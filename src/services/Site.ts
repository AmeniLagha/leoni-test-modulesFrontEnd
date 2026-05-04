// site.service.ts
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { Site, Projet } from "../models/site.model";
import { environment } from "../environments/environment";

// ✅ Ajouter l'interface ApiResponse
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class SiteService {
  private api = `${environment.apiUrl}/api/v1/sites`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // ✅ GET /api/v1/sites - Pas besoin de token (public)
  getAll(): Observable<Site[]> {
    return this.http.get<ApiResponse<Site[]>>(this.api)
      .pipe(
        map(response => response.data)  // ← Extraire le tableau de data
      );
  }

  // ✅ GET /api/v1/sites/active - Avec token
  getActive(): Observable<Site[]> {
    return this.http.get<ApiResponse<Site[]>>(`${this.api}/active`, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => response.data)
      );
  }

  // ✅ GET /api/v1/sites/{id} - ADMIN seulement
  getById(id: number): Observable<Site> {
    return this.http.get<ApiResponse<Site>>(`${this.api}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => response.data)
      );
  }

  // ✅ POST /api/v1/sites - ADMIN seulement
  create(site: Site): Observable<Site> {
    return this.http.post<ApiResponse<Site>>(this.api, site, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => response.data)
      );
  }

  // ✅ PUT /api/v1/sites/{id} - ADMIN seulement
  update(id: number, site: Site): Observable<Site> {
    return this.http.put<ApiResponse<Site>>(`${this.api}/${id}`, site, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => response.data)
      );
  }

  // ✅ DELETE /api/v1/sites/{id} - ADMIN seulement
  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => {
          // response.data est void, on retourne juste void
          return;
        })
      );
  }

  // ✅ GET /api/v1/sites/{siteId}/projets
  getProjetsBySite(siteId: number): Observable<Projet[]> {
    return this.http.get<ApiResponse<Projet[]>>(`${this.api}/${siteId}/projets`, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => response.data)
      );
  }

  // ✅ PUT /api/v1/sites/{siteId}/projets
  updateSiteProjets(siteId: number, projetIds: number[]): Observable<Site> {
    return this.http.put<ApiResponse<Site>>(`${this.api}/${siteId}/projets`, { projetIds }, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => response.data)
      );
  }

  // ✅ POST /api/v1/sites/{siteId}/add-projet/{projetId}
  addProjetToSite(siteId: number, projetId: number): Observable<Site> {
    return this.http.post<ApiResponse<Site>>(`${this.api}/${siteId}/add-projet/${projetId}`, {}, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => response.data)
      );
  }
}
