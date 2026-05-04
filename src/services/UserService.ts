// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { User } from '../models/auth.model';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

// ✅ Ajouter l'interface ApiResponse (ou l'importer depuis un fichier partagé)
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
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/v1/users`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getUsers(): Observable<User[]> {
    const token = this.authService.getAccessToken();
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      map(response => response.data)  // ← Extraire le tableau de data
    );
  }

  deleteUser(id: number): Observable<void> {
    const token = this.authService.getAccessToken();
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      map(response => {
        // response.data est void, on retourne juste void
        return;
      })
    );
  }

  updateUser(id: number, user: User): Observable<User> {
    const token = this.authService.getAccessToken();
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, user, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      map(response => response.data)  // ← Extraire l'utilisateur de data
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Méthode pour récupérer l'utilisateur depuis l'API
  getCurrentUserFromApi(): Observable<any> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      map(response => response.data)  // ← Extraire les infos utilisateur de data
    );
  }

  getProjectEmails(): Observable<string[]> {
    const token = this.authService.getAccessToken();
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/project-site-emails`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      map(response => response.data)  // ← Extraire le tableau d'emails de data
    );
  }

  changeUserPassword(userId: number, newPassword: string): Observable<{ success: boolean; message: string }> {
    const token = this.authService.getAccessToken();
    return this.http.put<ApiResponse<{ success: boolean; message: string }>>(
      `${this.apiUrl}/${userId}/change-password`,
      { newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    ).pipe(
      map(response => response.data)  // ← Extraire les données de data
    );
  }

  // Envoyer un email de réinitialisation
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/forgot-password`, { email })
      .pipe(
        map(response => response.data)  // ← Extraire le message de data
      );
  }

  // Valider un token de réinitialisation
  validateResetToken(token: string): Observable<{ valid: boolean }> {
    return this.http.get<ApiResponse<{ valid: boolean }>>(`${this.apiUrl}/validate-reset-token?token=${token}`)
      .pipe(
        map(response => response.data)  // ← Extraire la validation de data
      );
  }

  // Réinitialiser le mot de passe
  resetPassword(data: { resetToken: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/reset-password`, data)
      .pipe(
        map(response => response.data)  // ← Extraire le message de data
      );
  }

  checkEmailExists(email: string): Observable<{ exists: boolean }> {
    return this.http.get<ApiResponse<{ exists: boolean }>>(`${this.apiUrl}/check-email?email=${encodeURIComponent(email)}`)
      .pipe(
        map(response => response.data)  // ← Extraire exists de data
      );
  }

  // Dans UserService.ts
  sendVerificationCode(email: string): Observable<{ message: string }> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/send-verification-code`, { email })
      .pipe(
        map(response => response.data)
      );
  }

  verifyCode(email: string, code: string): Observable<{ valid: boolean }> {
    return this.http.post<ApiResponse<{ valid: boolean }>>(`${this.apiUrl}/verify-code`, { email, code })
      .pipe(
        map(response => response.data)
      );
  }

  sendResetLink(email: string): Observable<{ message: string }> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/send-reset-link`, { email })
      .pipe(
        map(response => response.data)
      );
  }
}
