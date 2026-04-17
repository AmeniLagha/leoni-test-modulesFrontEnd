// site.service.ts
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Site, Projet } from "../models/site.model";
import { environment } from "../environments/environment";

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

  getAll(): Observable<Site[]> {
    return this.http.get<Site[]>(this.api);
  }

  getActive(): Observable<Site[]> {
    return this.http.get<Site[]>(`${this.api}/active`, { headers: this.getAuthHeaders() });
  }

  getById(id: number): Observable<Site> {
    return this.http.get<Site>(`${this.api}/${id}`, { headers: this.getAuthHeaders() });
  }

  create(site: Site): Observable<Site> {
    return this.http.post<Site>(this.api, site, { headers: this.getAuthHeaders() });
  }

  update(id: number, site: Site): Observable<Site> {
    return this.http.put<Site>(`${this.api}/${id}`, site, { headers: this.getAuthHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`, { headers: this.getAuthHeaders() });
  }

  // ✅ AJOUTER cette méthode pour récupérer les projets d'un site
  getProjetsBySite(siteId: number): Observable<Projet[]> {
    return this.http.get<Projet[]>(`${this.api}/${siteId}/projets`, { headers: this.getAuthHeaders() });
  }

  // ✅ AJOUTER cette méthode pour mettre à jour les associations
  updateSiteProjets(siteId: number, projetIds: number[]): Observable<Site> {
    return this.http.put<Site>(`${this.api}/${siteId}/projets`, { projetIds }, { headers: this.getAuthHeaders() });
  }
  // site.service.ts - Ajoutez cette méthode
addProjetToSite(siteId: number, projetId: number): Observable<Site> {
  return this.http.post<Site>(`${this.api}/${siteId}/add-projet/${projetId}`, {}, { headers: this.getAuthHeaders() });
}

}
