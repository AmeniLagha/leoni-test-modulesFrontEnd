// all-versions.component.ts - Version corrigée
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TechnicalFileService } from '../../../../services/technical-file.service';

@Component({
  selector: 'app-all-versions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './all-versions.component.html',
  styleUrls: ['./all-versions.component.css']
})
export class AllVersionsComponent implements OnInit {

  itemId!: number;
  itemXCode: string = '';
  loading = true;
  error: string | null = null;
  versions: any[] = [];
  expandedDiffs: { [key: number]: boolean } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: TechnicalFileService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('itemId');
    if (idParam) {
      this.itemId = Number(idParam);
      this.loadAllVersions();
    } else {
      this.error = 'ID de l\'item non trouvé';
      this.loading = false;
    }
  }

  loadAllVersions(): void {
    this.loading = true;

    // Récupérer l'item pour avoir le xCode
    this.service.getItemById(this.itemId).subscribe({
      next: (item) => {
        this.itemXCode = item.xcode || `#${this.itemId}`;
      },
      error: () => {
        this.itemXCode = `#${this.itemId}`;
      }
    });

    // Charger toutes les versions
    this.service.getAllVersions(this.itemId).subscribe({
      next: (response) => {
        console.log('📊 Toutes les versions:', response);
        this.versions = response.data || response;
        // Initialiser l'état des différences
        this.versions.forEach((_, idx) => {
          this.expandedDiffs[idx] = idx === this.versions.length - 1;
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement versions:', err);
        this.error = 'Impossible de charger l\'historique des versions';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/technical-files']);
  }

  toggleDiffForVersion(versionIndex: number): void {
    this.expandedDiffs[versionIndex] = !this.expandedDiffs[versionIndex];
  }

  getChangesCount(version: any): number {
    const idx = this.versions.indexOf(version);
    if (idx === 0) return 0;
    return this.getChangesBetweenVersions(this.versions[idx - 1], version).length;
  }

  getChangesBetweenVersions(prevVersion: any, currVersion: any): any[] {
    const changes: any[] = [];
    const prev = prevVersion?.entity;
    const curr = currVersion?.entity;

    if (!prev || !curr) return changes;

    const fieldsToCompare = [
      'position', 'technicianName', 'maintenanceDate',
      'xCode', 'indexValue', 'leoniReferenceNumber', 'producer', 'type', 'referencePinePushBack',
      'pinRigidityM1', 'pinRigidityM2', 'pinRigidityM3',
      'displacementPathM1', 'displacementPathM2', 'displacementPathM3',
      'maxSealingValueM1', 'maxSealingValueM2', 'maxSealingValueM3',
      'programmedSealingValueM1', 'programmedSealingValueM2', 'programmedSealingValueM3',
      'detectionsM1', 'detectionsM2', 'detectionsM3',
      'validationStatus', 'remarks'
    ];

    for (const field of fieldsToCompare) {
      const oldVal = prev[field];
      const newVal = curr[field];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({
          fieldName: field,
          oldValue: this.formatValueForDiff(oldVal),
          newValue: this.formatValueForDiff(newVal)
        });
      }
    }

    return changes;
  }

  formatValueForDiff(value: any): string {
    if (value === null || value === undefined) return '-';
    if (value === 'OK') return 'OK';
    if (value === 'NOK') return 'NOK';
    if (value === true) return 'Oui';
    if (value === false) return 'Non';
    if (value instanceof Date) {
      return this.formatDateFromDate(value);
    }
    if (typeof value === 'string' && value.includes('-')) {
      return this.formatDateFromString(value);
    }
    return String(value);
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (value === 'OK') return '✅ OK';
    if (value === 'NOK') return '❌ NOK';
    if (value === true || value === 'true') return '✅ Oui';
    if (value === false || value === 'false') return '❌ Non';
    if (value instanceof Date) {
      return this.formatDateFromDate(value);
    }
    if (typeof value === 'string' && value.includes('-')) {
      return this.formatDateFromString(value);
    }
    return String(value);
  }

  formatOkNok(value: any): string {
    if (value === null || value === undefined) return '-';
    if (value === 'OK' || value === 'Ok' || value === 'ok') return '✅ OK';
    if (value === 'NOK' || value === 'Nok' || value === 'nok') return '❌ NOK';
    return String(value);
  }

  // ✅ Méthode pour formater une date de type Date
  formatDateFromDate(date: Date): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  // ✅ Méthode pour formater une date de type string
  formatDateFromString(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  // ✅ Méthode générique pour les templates (accepte string | Date | undefined)
  formatDate(value: string | Date | undefined): string {
    if (!value) return '-';
    try {
      const date = value instanceof Date ? value : new Date(value);
      return date.toLocaleDateString('fr-FR');
    } catch {
      return '-';
    }
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-default';
    switch (status) {
      case 'DRAFT': return 'status-draft';
      case 'VALIDATED_PP': return 'status-pp';
      case 'VALIDATED_MC': return 'status-mc';
      case 'VALIDATED_MP': return 'status-mp';
      default: return 'status-default';
    }
  }

  getStatusLabel(status: string | undefined): string {
    if (!status) return '⚪ Non défini';
    switch (status) {
      case 'DRAFT': return '📝 Brouillon';
      case 'VALIDATED_PP': return '✅ Validé PP';
      case 'VALIDATED_MC': return '✅ Validé MC';
      case 'VALIDATED_MP': return '🏁 Validé MP';
      default: return status;
    }
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'position': 'Position',
      'technicianName': 'Technicien',
      'maintenanceDate': 'Date de maintenance',
      'xCode': 'X Code',
      'indexValue': 'Index',
      'leoniReferenceNumber': 'Réf. LEONI',
      'producer': 'Producteur',
      'type': 'Type',
      'referencePinePushBack': 'Réf. Pine Push Back',
      'validationStatus': 'Statut de validation',
      'pinRigidityM1': 'Raideur M1',
      'pinRigidityM2': 'Raideur M2',
      'pinRigidityM3': 'Raideur M3',
      'displacementPathM1': 'Déplacement M1',
      'displacementPathM2': 'Déplacement M2',
      'displacementPathM3': 'Déplacement M3',
      'maxSealingValueM1': 'Max Sealing M1',
      'maxSealingValueM2': 'Max Sealing M2',
      'maxSealingValueM3': 'Max Sealing M3',
      'programmedSealingValueM1': 'Prog Sealing M1',
      'programmedSealingValueM2': 'Prog Sealing M2',
      'programmedSealingValueM3': 'Prog Sealing M3',
      'detectionsM1': 'Détection M1',
      'detectionsM2': 'Détection M2',
      'detectionsM3': 'Détection M3',
      'remarks': 'Remarques'
    };
    return labels[fieldName] || fieldName;
  }
  // Ajouter ces méthodes dans le composant TypeScript
getOkNokBadgeClass(value: string): string {
  if (!value) return 'bg-secondary';
  if (value === 'OK' || value === 'Ok' || value === 'ok') return 'badge-ok';
  if (value === 'NOK' || value === 'Nok' || value === 'nok') return 'badge-nok';
  return 'bg-secondary';
}

getValidationBadgeClass(status: string): string {
  if (!status) return 'bg-secondary';
  switch(status) {
    case 'DRAFT': return 'bg-warning text-dark';
    case 'VALIDATED_PP': return 'bg-info text-dark';
    case 'VALIDATED_MC': return 'bg-primary';
    case 'VALIDATED_MP': return 'bg-success';
    default: return 'bg-secondary';
  }
}

getValidationIcon(status: string): string {
  if (!status) return 'bi-question-circle';
  switch(status) {
    case 'DRAFT': return 'bi-pencil';
    case 'VALIDATED_PP': return 'bi-person-check';
    case 'VALIDATED_MC': return 'bi-person-check-fill';
    case 'VALIDATED_MP': return 'bi-flag-fill';
    default: return 'bi-question-circle';
  }
}
}
