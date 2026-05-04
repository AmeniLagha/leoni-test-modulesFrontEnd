import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { LoginRequest, AuthResponse, RegisterRequest, User } from '../models/auth.model';
import { environment } from '../environments/environment';

// ✅ Ajouter l'interface ApiResponse
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/v1`;

  constructor(private http: HttpClient) {}

  register(data: RegisterRequest): Observable<AuthResponse> {
    // ❌ Avant: this.http.post<AuthResponse>(...)
    // ✅ Après: extraire response.data
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/register`, data)
      .pipe(
        map(response => response.data)  // ← Extraire AuthResponse de data
      );
  }

  refreshToken(token: string): Observable<{ access_token: string; refresh_token: string }> {
    return this.http.post<ApiResponse<{ access_token: string; refresh_token: string }>>(
      `${this.apiUrl}/auth/refresh-token`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    ).pipe(
      map(response => response.data)  // ← Extraire les tokens de data
    );
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/authenticate`, credentials)
      .pipe(
        map(response => response.data),  // ← Extraire AuthResponse de data
        tap(authResponse => {
          this.saveTokens(authResponse);
          this.saveUserInfo(authResponse.access_token);
          localStorage.setItem('userSite', credentials.siteName || '');
        })
      );
  }

  logout(): void {
    localStorage.clear();
  }

  saveTokens(res: AuthResponse): void {
    localStorage.setItem('access_token', res.access_token);
    localStorage.setItem('refresh_token', res.refresh_token);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  hasPermission(requiredPermissions: string[]): boolean {
    const userPermissions = this.getUserPermissions();
    return requiredPermissions.some(permission =>
      userPermissions.includes(permission)
    );
  }

  // Décoder le token JWT
  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Sauvegarder les infos utilisateur
  saveUserInfo(token: string): void {
    const payload = this.decodeToken(token);
    if (payload) {
      console.log('Token payload:', payload);

      if (payload.sub) {
        localStorage.setItem('userEmail', payload.sub);
      }

      let fullName = '';
      if (payload.firstname && payload.lastname) {
        fullName = `${payload.firstname} ${payload.lastname}`;
      } else if (payload.fullName) {
        fullName = payload.fullName;
      } else if (payload.name) {
        fullName = payload.name;
      } else {
        fullName = payload.sub?.split('@')[0] || 'Utilisateur';
      }
      localStorage.setItem('userFullName', fullName);
      localStorage.setItem('userFirstName', payload.firstname || '');
      localStorage.setItem('userLastName', payload.lastname || '');

      if (payload.site || payload.plant) {
        const site = payload.site || payload.plant;
        localStorage.setItem('userSite', site);
        localStorage.setItem('userPlant', site);
      }

      let userRole = '';
      if (payload.role) {
        userRole = payload.role;
      } else if (payload.authorities) {
        const roleAuthority = payload.authorities.find((auth: string) => auth.startsWith('ROLE_'));
        if (roleAuthority) {
          userRole = roleAuthority.replace('ROLE_', '');
        }
      } else if (payload.roles && Array.isArray(payload.roles)) {
        const roleAuthority = payload.roles.find((auth: string) => auth.startsWith('ROLE_'));
        if (roleAuthority) {
          userRole = roleAuthority.replace('ROLE_', '');
        }
      }
      if (userRole) {
        localStorage.setItem('userRole', userRole);
      }

      let permissions: string[] = [];
      if (payload.authorities && Array.isArray(payload.authorities)) {
        permissions = payload.authorities.filter((auth: string) => !auth.startsWith('ROLE_'));
      } else if (payload.permissions) {
        if (Array.isArray(payload.permissions)) {
          permissions = payload.permissions;
        } else if (typeof payload.permissions === 'object') {
          permissions = Object.keys(payload.permissions).filter(key => !key.startsWith('ROLE_'));
        }
      }
      localStorage.setItem('userPermissions', JSON.stringify(permissions));
    }
  }

  getUserFirstName(): string {
    return localStorage.getItem('userFirstName') || '';
  }

  getUserLastName(): string {
    return localStorage.getItem('userLastName') || '';
  }

  getUserFullName(): string {
    return localStorage.getItem('userFullName') || this.getUserEmail().split('@')[0];
  }

  getUserSite(): string {
    return localStorage.getItem('userSite') || '';
  }

  getUserPlant(): string {
    return localStorage.getItem('userPlant') || '';
  }

  getUserEmail(): string {
    return localStorage.getItem('userEmail') || '';
  }

  getUserRole(): string {
    return localStorage.getItem('userRole') || '';
  }

  getUserPermissions(): string[] {
    const permissions = localStorage.getItem('userPermissions');
    return permissions ? JSON.parse(permissions) : [];
  }

  getCurrentTokenFromBackend(): Observable<{ token: string }> {
    const token = this.getAccessToken();
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get<ApiResponse<{ token: string }>>(`${this.apiUrl}/auth/current-token`, { headers })
      .pipe(
        map(response => response.data)  // ← Extraire le token de data
      );
  }

  checkEmailExists(email: string): Observable<boolean> {
    const token = this.getAccessToken();
    let headers = {};
    if (token) {
      headers = { Authorization: `Bearer ${token}` };
    }

    return this.http.get<ApiResponse<{ exists: boolean }>>(
      `${this.apiUrl}/users/check-email?email=${email}`,
      { headers }
    ).pipe(
      map(response => response.data.exists)  // ← Extraire exists de data
    );
  }

  checkMatriculeExists(matricule: number): Observable<boolean> {
    const token = this.getAccessToken();
    let headers = {};
    if (token) {
      headers = { Authorization: `Bearer ${token}` };
    }

    return this.http.get<ApiResponse<{ exists: boolean }>>(
      `${this.apiUrl}/users/check-matricule?matricule=${matricule}`,
      { headers }
    ).pipe(
      map(response => response.data.exists)  // ← Extraire exists de data
    );
  }

  // ✅ NOUVEAU : Fonction utilitaire pour extraire data
  private extractData<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.message);
    }
    return response.data;
  }
}
