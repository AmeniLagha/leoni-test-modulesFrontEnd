import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';
import { LoginRequest, AuthResponse, RegisterRequest, User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8081/api/v1';

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
  saveUserInfo(token: string): void {
    const payload = this.decodeToken(token);
    if (payload) {
      console.log('Token payload:', payload); // Debug

      // Sauvegarder l'email
      if (payload.sub) {
        localStorage.setItem('userEmail', payload.sub);
      }
let fullName = '';
  if (payload.firstname && payload.lastname) {
    fullName = `${payload.firstname} ${payload.lastname}`;
  } else if (payload.fullName) {
    fullName = payload.fullName;
  } else {
    fullName = payload.sub.split('@')[0]; // fallback
  }
  localStorage.setItem('userFullName', fullName);

      // Extraire le rôle
      let userRole = '';

      // Essayer d'abord la clé 'role'
      if (payload.role) {
        userRole = payload.role;
      }
      // Sinon chercher dans authorities
      else if (payload.authorities) {
        const roleAuthority = payload.authorities.find((auth: string) =>
          auth.startsWith('ROLE_')
        );
        if (roleAuthority) {
          userRole = roleAuthority.replace('ROLE_', '');
        }
      }
      // Sinon chercher dans roles
      else if (payload.roles && Array.isArray(payload.roles)) {
        const roleAuthority = payload.roles.find((auth: string) =>
          auth.startsWith('ROLE_')
        );
        if (roleAuthority) {
          userRole = roleAuthority.replace('ROLE_', '');
        }
      }

      if (userRole) {
        localStorage.setItem('userRole', userRole);
      }

      // Extraire les permissions
      let permissions: string[] = [];

      // Essayer authorities d'abord
      if (payload.authorities && Array.isArray(payload.authorities)) {
        permissions = payload.authorities.filter((auth: string) =>
          !auth.startsWith('ROLE_')
        );
      }
      // Sinon essayer permissions
      else if (payload.permissions) {
        if (Array.isArray(payload.permissions)) {
          permissions = payload.permissions;
        } else if (typeof payload.permissions === 'object') {
          // Si c'est un Map (object), prendre les clés
          permissions = Object.keys(payload.permissions).filter(key =>
            !key.startsWith('ROLE_')
          );
        }
      }
      // Sinon essayer roles
      else if (payload.roles && Array.isArray(payload.roles)) {
        permissions = payload.roles.filter((auth: string) =>
          !auth.startsWith('ROLE_')
        );
      }

      localStorage.setItem('userPermissions', JSON.stringify(permissions));
    }
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

getUserFullName(): string {
  return localStorage.getItem('userFullName') || this.getUserEmail().split('@')[0];
}
 // 🔥 Méthode pour obtenir le token actuel depuis le backend
  getCurrentTokenFromBackend(): Observable<{ token: string }> {
    const token = this.getAccessToken();
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get<{ token: string }>(`${this.apiUrl}/current-token`, { headers });
  }

}
