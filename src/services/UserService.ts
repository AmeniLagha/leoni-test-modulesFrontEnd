// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/auth.model';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/v1/users`;

  constructor(private http: HttpClient, private authService: AuthService) {}

getUsers(): Observable<User[]> {
  const token = this.authService.getAccessToken();
  return this.http.get<User[]>(`${this.apiUrl}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

  deleteUser(id: number): Observable<void> {
     const token = this.authService.getAccessToken();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  }

  updateUser(id: number, user: User): Observable<User> {
     const token = this.authService.getAccessToken();
    return this.http.put<User>(`${this.apiUrl}/${id}`, user, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
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

  return this.http.get<any>(`${this.apiUrl}/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
getProjectEmails(){
   const token = this.authService.getAccessToken();
  return this.http.get<string[]>(`${this.apiUrl}/project-emails`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
 // Envoyer un email de réinitialisation
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/forgot-password`, { email });
  }

  // Valider un token de réinitialisation
  validateResetToken(token: string): Observable<{ valid: boolean }> {
    return this.http.get<{ valid: boolean }>(`${this.apiUrl}/validate-reset-token?token=${token}`);
  }

  // Réinitialiser le mot de passe
  resetPassword(data: { resetToken: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password`, data);
  }
  checkEmailExists(email: string): Observable<{ exists: boolean }> {
  return this.http.get<{ exists: boolean }>(`${this.apiUrl}/check-email?email=${encodeURIComponent(email)}`);
}
// Dans UserService.ts
sendVerificationCode(email: string): Observable<{ message: string }> {
  return this.http.post<{ message: string }>(`${this.apiUrl}/send-verification-code`, { email });
}

verifyCode(email: string, code: string): Observable<{ valid: boolean }> {
  return this.http.post<{ valid: boolean }>(`${this.apiUrl}/verify-code`, { email, code });
}
// Ajoutez ces méthodes



sendResetLink(email: string): Observable<{ message: string }> {
  return this.http.post<{ message: string }>(`${this.apiUrl}/send-reset-link`, { email });
}
}
