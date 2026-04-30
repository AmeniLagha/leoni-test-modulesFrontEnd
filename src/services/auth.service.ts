import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { LoginRequest, AuthResponse, RegisterRequest, User } from '../models/auth.model';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/v1`;

  constructor(private http: HttpClient) {}



register(data: RegisterRequest): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data);
}
refreshToken(token: string) {
  return this.http.post<any>(
    `${this.apiUrl}/auth/refresh-token`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}

 login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/authenticate`, credentials)
      .pipe(
        tap(response => {
          this.saveTokens(response);
          this.saveUserInfo(response.access_token);
          // ✅ Sauvegarder le site sélectionné
        localStorage.setItem('userSite', credentials.siteName);
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

  // Extraire les infos du token et les sauvegarder
 // auth.service.ts - Ajouter ces méthodes

// Sauvegarder plus d'informations utilisateur
saveUserInfo(token: string): void {
  const payload = this.decodeToken(token);
  if (payload) {
    console.log('Token payload:', payload);

    // Sauvegarder l'email
    if (payload.sub) {
      localStorage.setItem('userEmail', payload.sub);
    }

    // Sauvegarder le nom complet
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

    // ✅ Sauvegarder le site (plant)
    if (payload.site || payload.plant) {
      const site = payload.site || payload.plant;
      localStorage.setItem('userSite', site);
      localStorage.setItem('userPlant', site);
    }

    // Sauvegarder le rôle
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

    // Sauvegarder les permissions
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

// Récupérer le nom de l'utilisateur
getUserFirstName(): string {
  return localStorage.getItem('userFirstName') || '';
}

getUserLastName(): string {
  return localStorage.getItem('userLastName') || '';
}

getUserFullName(): string {
  return localStorage.getItem('userFullName') || this.getUserEmail().split('@')[0];
}

// Récupérer le site/plant
getUserSite(): string {
  return localStorage.getItem('userSite') || '';
}

getUserPlant(): string {
  return localStorage.getItem('userPlant') || '';
}

  // Récupérer les infos depuis localStorage
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
 // 🔥 Méthode pour obtenir le token actuel depuis le backend
  getCurrentTokenFromBackend(): Observable<{ token: string }> {
    const token = this.getAccessToken();
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get<{ token: string }>(`${this.apiUrl}/current-token`, { headers });
  }
 // ✅ Vérifier si l'email existe déjà
  // auth.service.ts

checkEmailExists(email: string): Observable<boolean> {
  const token = this.getAccessToken();

  // ✅ Créer des headers proprement
  let headers = {};
  if (token) {
    headers = { Authorization: `Bearer ${token}` };
  }

  return this.http.get<{ exists: boolean }>(
    `${this.apiUrl}/users/check-email?email=${email}`,
    { headers }
  ).pipe(map(response => response.exists));
}

checkMatriculeExists(matricule: number): Observable<boolean> {
  const token = this.getAccessToken();

  // ✅ Créer des headers proprement
  let headers = {};
  if (token) {
    headers = { Authorization: `Bearer ${token}` };
  }

  return this.http.get<{ exists: boolean }>(
    `${this.apiUrl}/users/check-matricule?matricule=${matricule}`,
    { headers }
  ).pipe(map(response => response.exists));
}
}
