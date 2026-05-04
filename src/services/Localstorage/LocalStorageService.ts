// services/local-storage.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  private readonly PREFIX = 'leoni_tech_';

  constructor() {}

  // Sauvegarder les données techniques d'un cahier
  saveTechData(sheetId: number, itemsData: any[]): void {
    const key = `${this.PREFIX}${sheetId}`;
    const data = {
      sheetId: sheetId,
      items: itemsData,
      savedAt: new Date().toISOString(),
      lastUpdated: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`💾 Données techniques sauvegardées localement pour le cahier ${sheetId}`);
  }

  // Récupérer les données techniques sauvegardées
  getTechData(sheetId: number): any[] | null {
    const key = `${this.PREFIX}${sheetId}`;
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      console.log(`📂 Données techniques chargées depuis localStorage pour le cahier ${sheetId}`);
      return parsed.items;
    }
    return null;
  }

  // Vérifier si des données existent en cache
  hasTechData(sheetId: number): boolean {
    const key = `${this.PREFIX}${sheetId}`;
    return localStorage.getItem(key) !== null;
  }

  // Supprimer les données sauvegardées (après enregistrement réussi)
  clearTechData(sheetId: number): void {
    const key = `${this.PREFIX}${sheetId}`;
    localStorage.removeItem(key);
    console.log(`🗑️ Données techniques supprimées du localStorage pour le cahier ${sheetId}`);
  }

  // Obtenir la date de dernière sauvegarde
  getLastSavedDate(sheetId: number): string | null {
    const key = `${this.PREFIX}${sheetId}`;
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data).savedAt;
    }
    return null;
  }
}
