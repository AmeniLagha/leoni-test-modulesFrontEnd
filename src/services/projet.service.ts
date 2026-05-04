// projet.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';

// ✅ Interface ApiResponse (ou importer depuis un fichier partagé)
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  timestamp: string;
}

export interface Projet {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProjetService {
  private api = `${environment.apiUrl}/api/v1/projets`;

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  constructor(private http: HttpClient) {}

  // ✅ Méthode utilitaire pour extraire data
  private extractData<T>(response: ApiResponse<T>): T {
    return response.data;
  }

  getAll(): Observable<Projet[]> {
    return this.http.get<ApiResponse<Projet[]>>(this.api, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  getActive(): Observable<Projet[]> {
    return this.http.get<ApiResponse<Projet[]>>(`${this.api}/active`, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  getById(id: number): Observable<Projet> {
    return this.http.get<ApiResponse<Projet>>(`${this.api}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  create(projet: Projet): Observable<Projet> {
    return this.http.post<ApiResponse<Projet>>(this.api, projet, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  update(id: number, projet: Projet): Observable<Projet> {
    return this.http.put<ApiResponse<Projet>>(`${this.api}/${id}`, projet, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(map(() => void 0));
  }

  getProjetsBySite(siteName: string): Observable<Projet[]> {
    return this.http.get<ApiResponse<Projet[]>>(`${this.api}/site/${siteName}`, { headers: this.getAuthHeaders() })
      .pipe(map(res => this.extractData(res)));
  }
}
