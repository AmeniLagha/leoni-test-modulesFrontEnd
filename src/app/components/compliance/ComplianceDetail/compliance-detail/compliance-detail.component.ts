import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ComplianceService } from '../../../../../services/compliance.service';
import { ComplianceDto } from '../../../../../models/compliance.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-compliance-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './compliance-detail.component.html',
  styleUrls: ['./compliance-detail.component.css']
})
export class ComplianceDetailComponent implements OnInit {

  compliance?: ComplianceDto;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: ComplianceService
  ) {}

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('id');

    if (!param) {
      this.errorMessage = 'ID manquant dans URL';
      this.isLoading = false;
      return;
    }

    const id = Number(param);

    if (isNaN(id)) {
      this.errorMessage = 'ID invalide';
      this.isLoading = false;
      return;
    }

    this.service.getComplianceById(id).subscribe({
      next: (res) => {
        this.compliance = res;
        if (this.compliance.testDateTime) {
          this.compliance.testDateTime = this.compliance.testDateTime.substring(0, 10);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Impossible de charger la conformité';
        this.isLoading = false;
      }
    });
  }

  /**
   * Retourne la classe CSS pour le badge selon la valeur
   * @param value - La valeur à évaluer (OK, NOK, ou autre)
   * @returns La classe Bootstrap pour le badge
   */
  getStatusBadge(value: string | undefined): string {
    if (!value) return 'bg-secondary';
    if (value === 'OK') return 'bg-success';
    if (value === 'NOK') return 'bg-danger';
    return 'bg-secondary';
  }

  /**
   * Retourne l'icône correspondant à la valeur
   * @param value - La valeur à évaluer
   * @returns Le nom de l'icône Bootstrap
   */
  getStatusIcon(value: string | undefined): string {
    if (!value) return 'bi-question-circle';
    if (value === 'OK') return 'bi-check-circle';
    if (value === 'NOK') return 'bi-x-circle';
    return 'bi-question-circle';
  }

  /**
   * Retourne le texte formaté pour l'affichage
   * @param value - La valeur à formater
   * @returns Le texte formaté
   */
  formatValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    return String(value);
  }
}
