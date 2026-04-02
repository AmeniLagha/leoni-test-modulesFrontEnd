import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import {
  ChargeSheetComplete,
  ChargeSheetStatus,
  ChargeSheetCreateDto,
  ChargeSheetUpdateTechDto,
  ChargeSheetItemDto,
  ReceptionResponse,
  ReceptionRequest,
  ReceptionHistory,
  ReceptionHistoryDto
} from '../models/charge-sheet.model';
import { ProjectStats } from '../models/stats.model';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChargeSheetService {
  private apiUrl = `${environment.apiUrl}/api/v1/charge-sheets`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ============ PARTIE ING ============

  /** Créer un nouveau cahier des charges avec plusieurs items */
  createChargeSheet(data: ChargeSheetCreateDto): Observable<ChargeSheetComplete> {
    const token = this.authService.getAccessToken();
    return this.http.post<ChargeSheetComplete>(this.apiUrl, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
  // Dans charge-sheet.service.ts
updateChargeSheet(id: number, data: any): Observable<ChargeSheetComplete> {
  const token = this.authService.getAccessToken();
  return this.http.put<ChargeSheetComplete>(`${this.apiUrl}/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

  // ============ PARTIE PT ============

  /** Mettre à jour la partie technique d'un item spécifique */
  updateItemTech(sheetId: number, itemId: number, data: ChargeSheetUpdateTechDto): Observable<ChargeSheetItemDto> {
    const token = this.authService.getAccessToken();
    return this.http.put<ChargeSheetItemDto>(`${this.apiUrl}/${sheetId}/items/${itemId}/tech`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // ============ GESTION DES ITEMS ============

  /** Ajouter un nouvel item à un cahier existant */
  addItem(sheetId: number, itemDto: ChargeSheetItemDto): Observable<ChargeSheetComplete> {
    const token = this.authService.getAccessToken();
    return this.http.post<ChargeSheetComplete>(`${this.apiUrl}/${sheetId}/items`, itemDto, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  /** Supprimer un item d'un cahier */
  deleteItem(sheetId: number, itemId: number): Observable<void> {
    const token = this.authService.getAccessToken();
    return this.http.delete<void>(`${this.apiUrl}/${sheetId}/items/${itemId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // ============ TOUS LES RÔLES ============

  /** Récupérer un cahier des charges complet avec tous ses items */
  getById(id: number): Observable<ChargeSheetComplete> {
    const token = this.authService.getAccessToken();
    return this.http.get<ChargeSheetComplete>(`${this.apiUrl}/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  /** Lister tous les cahiers des charges */
  getAll(): Observable<ChargeSheetComplete[]> {
    const token = this.authService.getAccessToken();
    return this.http.get<ChargeSheetComplete[]>(this.apiUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  /** Supprimer un cahier des charges (ADMIN uniquement) */
  delete(id: number): Observable<void> {
    const token = this.authService.getAccessToken();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // ============ UTILITAIRES ============

  /** Vérifier si l'utilisateur peut modifier la partie basique */
  get canEditBasic(): boolean {
    const permissions = this.authService.getUserPermissions();
    return permissions.includes('charge_sheet:basic:write');
  }

  /** Vérifier si l'utilisateur peut modifier la partie technique */
  get canEditTech(): boolean {
    const permissions = this.authService.getUserPermissions();
    return permissions.includes('charge_sheet:tech:write');
  }

  /** Vérifier si l'utilisateur peut créer */
  get canCreate(): boolean {
    const permissions = this.authService.getUserPermissions();
    return permissions.includes('charge_sheet:basic:create');
  }

  /** Obtenir les sections accessibles selon le rôle */
  getAccessibleSections(): { [key: string]: boolean } {
    const role = this.authService.getUserRole();
    return {
      generalInfo: role === 'ING' || role === 'ADMIN',
      itemsInfo: role === 'ING' || role === 'ADMIN',
      standardCriteria: role === 'PT' || role === 'ADMIN',
      testModule: role === 'PT' || role === 'ADMIN',
      testSystem: role === 'PT' || role === 'ADMIN',
      price: role === 'PT' || role === 'ADMIN',
      readOnly: role !== 'ING' && role !== 'PT' && role !== 'ADMIN'
    };
  }

  /** Obtenir le libellé du statut */
  getStatusLabel(status: ChargeSheetStatus): string {
    const labels: Record<ChargeSheetStatus, string> = {
      [ChargeSheetStatus.DRAFT]: 'Brouillon',
      [ChargeSheetStatus.TECH_FILLED]: 'Partie technique remplie',
      [ChargeSheetStatus.VALIDATED_ING]: 'Validation de ingenieure',
      [ChargeSheetStatus.VALIDATED_PT]: 'Validation de PT',
      [ChargeSheetStatus.SENT_TO_SUPPLIER]: 'Envoyé au fournisseur',
    [ChargeSheetStatus.RECEIVED_FROM_SUPPLIER]: 'Reçu du fournisseur',
      [ChargeSheetStatus.COMPLETED]: 'Terminé'
    };
    return labels[status] || status;
  }

  /** Obtenir la couleur du statut */
  getStatusColor(status: ChargeSheetStatus): string {
    const colors: Record<ChargeSheetStatus, string> = {
      [ChargeSheetStatus.DRAFT]: 'warning',
      [ChargeSheetStatus.TECH_FILLED]: 'info',
      [ChargeSheetStatus.VALIDATED_ING]: 'primary',
      [ChargeSheetStatus.VALIDATED_PT]: 'secondary',
      [ChargeSheetStatus.SENT_TO_SUPPLIER]: 'dark',
    [ChargeSheetStatus.RECEIVED_FROM_SUPPLIER]: 'info',
      [ChargeSheetStatus.COMPLETED]: 'success'
    };
    return colors[status] || 'secondary';
  }

  /** Créer un item vide par défaut */
  createEmptyItem(): ChargeSheetItemDto {
    return {
      itemNumber: '',
      samplesExist: 'No',
      ways: '',
      housingColour: '',
      testModuleExistInDatabase: 'No',
      housingReferenceLeoni: '',
      housingReferenceSupplierCustomer: '',
      referenceSealsClipsCableTiesCap: '',
      realConnectorPicture: '',
      quantityOfTestModules: 1
    };
  }
 // Dans charge-sheet.service.ts
validateByIng(id: number): Observable<ChargeSheetComplete> {
  const token = this.authService.getAccessToken();
  return this.http.put<ChargeSheetComplete>(`${this.apiUrl}/${id}/validate-ing`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

validateByPt(id: number): Observable<ChargeSheetComplete> {
  const token = this.authService.getAccessToken();
  return this.http.put<ChargeSheetComplete>(`${this.apiUrl}/${id}/validate-pt`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
}
// Dans charge-sheet.service.ts
getDashboardStats(): Observable<ProjectStats> {
  const token = this.authService.getAccessToken();
  return this.http.get<ProjectStats>(`${this.apiUrl}/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}
sendToSupplier(id: number): Observable<ChargeSheetComplete> {
  const token = this.authService.getAccessToken();
  return this.http.put<ChargeSheetComplete>(`${this.apiUrl}/${id}/send-supplier`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

confirmReception(id: number): Observable<ChargeSheetComplete> {
  const token = this.authService.getAccessToken();
  return this.http.put<ChargeSheetComplete>(`${this.apiUrl}/${id}/confirm-reception`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

completeSheet(id: number): Observable<ChargeSheetComplete> {
  const token = this.authService.getAccessToken();
  return this.http.put<ChargeSheetComplete>(`${this.apiUrl}/${id}/complete`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
}
getWorkflowSteps() {
  return [
    'DRAFT',
    'VALIDATED_ING',
    'TECH_FILLED',
    'VALIDATED_PT',
    'SENT_TO_SUPPLIER',
    'RECEIVED_FROM_SUPPLIER',
    'COMPLETED'
  ];
}
// Ajoutez ces méthodes dans la classe ChargeSheetService
prepareReception(sheetId: number): Observable<ReceptionResponse> {
  const token = this.authService.getAccessToken();
  return this.http.get<ReceptionResponse>(`${this.apiUrl}/${sheetId}/prepare-reception`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

confirmPartialReception(sheetId: number, data: ReceptionRequest): Observable<ReceptionResponse> {
  const token = this.authService.getAccessToken();
  return this.http.post<ReceptionResponse>(`${this.apiUrl}/${sheetId}/confirm-partial-reception`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

// Dans charge-sheet.service.ts
getReceptionHistory(sheetId: number): Observable<ReceptionHistoryDto[]> {
  const token = this.authService.getAccessToken();
  return this.http.get<ReceptionHistoryDto[]>(`${this.apiUrl}/${sheetId}/reception-history`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}
// Ajoutez cette méthode
getAllReceptions(): Observable<ReceptionHistoryDto[]> {
  const token = this.authService.getAccessToken();
  return this.http.get<ReceptionHistoryDto[]>(`${this.apiUrl}/receptions/all`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}
}
