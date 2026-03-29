import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { UploadResponse } from '../models/charge-sheet.model';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private apiUrl = 'http://localhost:8081/api/v1/charge-sheets';

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Upload une image pour un item spécifique
   */
uploadItemImage(
  chargeSheetId: number,
  itemId: number,
  file: File
): Observable<UploadResponse> {

  const formData = new FormData();
  formData.append('file', file);

  const token = this.authService.getAccessToken();

  return this.http.post<UploadResponse>(
    `${this.apiUrl}/${chargeSheetId}/items/${itemId}/upload-image`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}





  /**
   * Récupérer l'URL d'une image pour affichage
   */
  getImageUrl(filename: string): Observable<string> {
    const token = this.authService.getAccessToken();
    return this.http.get(`http://localhost:8081/${filename}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    }).pipe(
      map(blob => URL.createObjectURL(blob))
    );
  }

  /**
   * Récupérer l'image d'un item
   */
  getItemImageUrl(sheetId: number, itemId: number): Observable<Blob> {
    const token = this.authService.getAccessToken();
    return this.http.get(`${this.apiUrl}/${sheetId}/items/${itemId}/image`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    });
  }

  /**
   * Supprimer l'image d'un item
   */
  deleteItemImage(sheetId: number, itemId: number): Observable<{ message: string }> {
    const token = this.authService.getAccessToken();
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/${sheetId}/items/${itemId}/image`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }
}
