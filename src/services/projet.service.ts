// projet.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

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
      const token = localStorage.getItem('access_token'); // ⚡ correct
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }

  constructor(private http: HttpClient) {}

  getAll(): Observable<Projet[]> {
    return this.http.get<Projet[]>(this.api, { headers: this.getAuthHeaders() });
  }

  getActive(): Observable<Projet[]> {
    return this.http.get<Projet[]>(`${this.api}/active`, { headers: this.getAuthHeaders() });
  }

  getById(id: number): Observable<Projet> {
    return this.http.get<Projet>(`${this.api}/${id}`, { headers: this.getAuthHeaders() });
  }

  create(projet: Projet): Observable<Projet> {
    return this.http.post<Projet>(this.api, projet, { headers: this.getAuthHeaders() });
  }

  update(id: number, projet: Projet): Observable<Projet> {
    return this.http.put<Projet>(`${this.api}/${id}`, projet, { headers: this.getAuthHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`, { headers: this.getAuthHeaders() });
  }
  // projet.service.ts - Ajouter cette méthode
getProjetsBySite(siteName: string): Observable<Projet[]> {
  return this.http.get<Projet[]>(`${this.api}/site/${siteName}`, { headers: this.getAuthHeaders() });
}
}
