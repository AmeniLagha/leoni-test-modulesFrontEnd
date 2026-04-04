// technical-file-notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface TechnicalNotification {
  id: number;
  title: string;
  description: string;
  daysWithoutUpdate: number;
  type: string;
  project: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class TechnicalFileNotificationService {
  private apiUrl = `${environment.apiUrl}/api/v1/technical-files`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  }

  getPendingNotifications(): Observable<TechnicalNotification[]> {
    return this.http.get<TechnicalNotification[]>(
      `${this.apiUrl}/notifications/pending`,
      this.getAuthHeaders()
    );
  }
}
