import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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
import { MonthlyVariation, ProjectStats } from '../models/stats.model';
import { environment } from '../environments/environment';

// ✅ Interface ApiResponse (ou importer depuis un fichier partagé)
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ChargeSheetService {
  private apiUrl = `${environment.apiUrl}/api/v1/charge-sheets`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders() {
    const token = this.authService.getAccessToken();
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  private extractData<T>(response: ApiResponse<T>): T {
    return response.data;
  }

  // ============ PARTIE ING ============

  /** Créer un nouveau cahier des charges avec plusieurs items */
  createChargeSheet(data: ChargeSheetCreateDto): Observable<ChargeSheetComplete> {
    return this.http.post<ApiResponse<ChargeSheetComplete>>(this.apiUrl, data, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  updateChargeSheet(id: number, data: any): Observable<ChargeSheetComplete> {
    return this.http.put<ApiResponse<ChargeSheetComplete>>(`${this.apiUrl}/${id}`, data, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  // ============ PARTIE PT ============

  /** Mettre à jour la partie technique d'un item spécifique */
  updateItemTech(sheetId: number, itemId: number, data: ChargeSheetUpdateTechDto): Observable<ChargeSheetItemDto> {
    return this.http.put<ApiResponse<ChargeSheetItemDto>>(`${this.apiUrl}/${sheetId}/items/${itemId}/tech`, data, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  // ============ GESTION DES ITEMS ============

  /** Ajouter un nouvel item à un cahier existant */
  addItem(sheetId: number, itemDto: ChargeSheetItemDto): Observable<ChargeSheetComplete> {
    return this.http.post<ApiResponse<ChargeSheetComplete>>(`${this.apiUrl}/${sheetId}/items`, itemDto, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  /** Supprimer un item d'un cahier */
  deleteItem(sheetId: number, itemId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${sheetId}/items/${itemId}`, this.getAuthHeaders())
      .pipe(map(() => void 0));
  }

  // ============ TOUS LES RÔLES ============

  /** Récupérer un cahier des charges complet avec tous ses items */
  getById(id: number): Observable<ChargeSheetComplete> {
    return this.http.get<ApiResponse<ChargeSheetComplete>>(`${this.apiUrl}/${id}`, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  /** Lister tous les cahiers des charges */
  getAll(): Observable<ChargeSheetComplete[]> {
    return this.http.get<ApiResponse<ChargeSheetComplete[]>>(this.apiUrl, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  /** Supprimer un cahier des charges (ADMIN uniquement) */
  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, this.getAuthHeaders())
      .pipe(map(() => void 0));
  }

  // ============ VALIDATION ============

  validateByIng(id: number): Observable<ChargeSheetComplete> {
    return this.http.put<ApiResponse<ChargeSheetComplete>>(`${this.apiUrl}/${id}/validate-ing`, {}, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  validateByPt(id: number): Observable<ChargeSheetComplete> {
    return this.http.put<ApiResponse<ChargeSheetComplete>>(`${this.apiUrl}/${id}/validate-pt`, {}, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  revertToIng(id: number, reason: string): Observable<ChargeSheetComplete> {
    return this.http.put<ApiResponse<ChargeSheetComplete>>(
      `${this.apiUrl}/${id}/revert-to-ing`,
      { reason: reason },
      this.getAuthHeaders()
    ).pipe(map(res => this.extractData(res)));
  }

  // ============ FOURNISSEUR ============

  sendToSupplier(id: number): Observable<ChargeSheetComplete> {
    return this.http.put<ApiResponse<ChargeSheetComplete>>(`${this.apiUrl}/${id}/send-supplier`, {}, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  confirmReception(id: number): Observable<ChargeSheetComplete> {
    return this.http.put<ApiResponse<ChargeSheetComplete>>(`${this.apiUrl}/${id}/confirm-reception`, {}, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  completeSheet(id: number): Observable<ChargeSheetComplete> {
    return this.http.put<ApiResponse<ChargeSheetComplete>>(`${this.apiUrl}/${id}/complete`, {}, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  // ============ RÉCEPTION ============

  prepareReception(sheetId: number): Observable<ReceptionResponse> {
    return this.http.get<ApiResponse<ReceptionResponse>>(`${this.apiUrl}/${sheetId}/prepare-reception`, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  confirmPartialReception(sheetId: number, data: ReceptionRequest): Observable<ReceptionResponse> {
    return this.http.post<ApiResponse<ReceptionResponse>>(`${this.apiUrl}/${sheetId}/confirm-partial-reception`, data, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  getReceptionHistory(sheetId: number): Observable<ReceptionHistoryDto[]> {
    return this.http.get<ApiResponse<ReceptionHistoryDto[]>>(`${this.apiUrl}/${sheetId}/reception-history`, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  getAllReceptions(): Observable<ReceptionHistoryDto[]> {
    return this.http.get<ApiResponse<ReceptionHistoryDto[]>>(`${this.apiUrl}/receptions/all`, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  // ============ STATISTIQUES ============

  getDashboardStats(): Observable<ProjectStats> {
    return this.http.get<ApiResponse<ProjectStats>>(`${this.apiUrl}/stats`, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  /** Récupérer la variation entre deux mois spécifiques */
  getVariationBetweenMonths(month1: string, month2: string, project?: string): Observable<any> {
    let url = `${this.apiUrl}/stats/monthly-variation?month1=${month1}&month2=${month2}`;
    if (project) {
      url += `&project=${project}`;
    }
    return this.http.get<ApiResponse<any>>(url, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  /** Récupérer les statistiques de création mensuelles */
  getMonthlyCreationStats(months: number = 6, project?: string): Observable<any> {
    let url = `${this.apiUrl}/stats/monthly-creation?months=${months}`;
    if (project) {
      url += `&project=${project}`;
    }
    return this.http.get<ApiResponse<any>>(url, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  /** Récupérer la variation entre les deux derniers mois */
  getLastTwoMonthsVariation(project?: string): Observable<any> {
    let url = `${this.apiUrl}/stats/last-two-months`;
    if (project) {
      url += `?project=${project}`;
    }
    return this.http.get<ApiResponse<any>>(url, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  getLastTwoMonthsVariationGlobal(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats/last-two-months?project=ALL`, this.getAuthHeaders())
      .pipe(map(res => this.extractData(res)));
  }

  // ============ UTILITAIRES ============

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
}
