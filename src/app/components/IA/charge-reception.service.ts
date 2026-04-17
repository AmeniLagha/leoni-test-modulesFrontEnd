// charge-reception.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChargeSheet {
  id?: number;
  orderNumber?: string;
  date?: string;
  preferredDeliveryDate?: string;
  status?: string;
  project?: string;
  plant?: string;
  costCenterNumber?: string;
  harnessRef?: string;
  quantityOrdered?: number;
  issuedBy?: string;
  emailAddress?: string;
  phoneNumber?: string;
}

export interface ReceptionHistory {
  id?: number;
  deliveryNoteNumber?: string;
  quantityOrdered?: number;
  quantityReceived?: number;
  previousTotalReceived?: number;
  newTotalReceived?: number;
  receptionDate?: string;
  receivedBy?: string;
  comments?: string;
  chargeSheetId?: number;
  itemId?: number;
}

export interface Alert {
  type: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  reference: string;
  action: string;
  category: 'charge_sheet' | 'reception';
}

export interface Dashboard {
  charge_sheet_stats: {
    total: number;
    by_status: Record<string, number>;
    completed: number;
    in_progress: number;
    draft: number;
    overdue: number;
    avg_progress: number;
  };
  reception_stats: {
    total: number;
    total_ordered: number;
    total_received: number;
    complete_receptions: number;
    partial_receptions: number;
    avg_delivery_delay: number;
    completion_rate: number;
  };
  supplier_analysis: {
    supplier_performance: Record<string, number>;
    high_risk_suppliers: string[];
    medium_risk_suppliers: string[];
    total_orders: number;
  };
  recommendations: Array<{
    title: string;
    message: string;
    priority: string;
    action: string;
  }>;
  last_update: string;
}

@Injectable({ providedIn: 'root' })
export class ChargeReceptionService {
  private apiUrl = 'http://localhost:5002/api/charge-reception';

  constructor(private http: HttpClient) {}

  // Entraînement
  trainModels(): Observable<any> {
    return this.http.post(`${this.apiUrl}/train`, {});
  }

  // Prédictions
  predictDelay(chargeSheet: ChargeSheet): Observable<any> {
    return this.http.post(`${this.apiUrl}/predict/delay`, chargeSheet);
  }

  predictNextStatus(chargeSheet: ChargeSheet): Observable<any> {
    return this.http.post(`${this.apiUrl}/predict/next-status`, chargeSheet);
  }

  predictReception(reception: ReceptionHistory): Observable<any> {
    return this.http.post(`${this.apiUrl}/predict/reception`, reception);
  }

  // Alertes et Dashboard
  getAlerts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/alerts`);
  }

  getDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`);
  }

  getSupplierAnalysis(): Observable<any> {
    return this.http.get(`${this.apiUrl}/supplier-analysis`);
  }

  getStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/status`);
  }
}
