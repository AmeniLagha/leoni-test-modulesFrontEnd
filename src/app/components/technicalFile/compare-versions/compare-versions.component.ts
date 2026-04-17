// compare-versions.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TechnicalFileService } from '../../../../services/technical-file.service';

@Component({
  selector: 'app-compare-versions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compare-versions.component.html',
  styleUrls: ['./compare-versions.component.css']
})
export class CompareVersionsComponent implements OnInit {

  itemId!: number;
  loading = true;
  error: string | null = null;

  firstVersion: any = null;
  currentVersion: any = null;
  differences: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: TechnicalFileService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('itemId');
    if (idParam) {
      this.itemId = Number(idParam);
      this.loadVersions();
    } else {
      this.error = 'ID de l\'item non trouvé';
      this.loading = false;
    }
  }

  loadVersions(): void {
    this.loading = true;
    this.service.getFirstAndCurrentVersions(this.itemId).subscribe({
      next: (data) => {
        console.log('📊 Données reçues:', data);
        console.log('📊 Differences:', data.differences);
        console.log('📊 ValidationStatus première:', data.firstVersion?.entity?.validationStatus);
        console.log('📊 ValidationStatus actuelle:', data.currentVersion?.entity?.validationStatus);

        this.firstVersion = data.firstVersion?.entity;
        this.currentVersion = data.currentVersion?.entity;
        this.differences = data.differences || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement versions:', err);
        this.error = 'Impossible de charger les versions';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/technical-files/items', this.itemId, 'detail']);
  }

  // Formater les valeurs
  formatValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (value === 'OK') return '✅ OK';
    if (value === 'NOK') return '❌ NOK';
    if (value === true || value === 'true') return '✅ Oui';
    if (value === false || value === 'false') return '❌ Non';
    return String(value);
  }

  // Formater le statut de validation
  formatStatus(status: string): string {
    if (!status) return '-';
    const statusMap: { [key: string]: string } = {
      'DRAFT': '📝 Brouillon',
      'VALIDATED_PP': '✅ Validé PP',
      'VALIDATED_MC': '✅ Validé MC',
      'VALIDATED_MP': '🏁 Validé MP'
    };
    return statusMap[status] || status;
  }

  // Vérifier si une valeur a changé
  hasChanged(fieldName: string): boolean {
    // Cas spécial pour validationStatus
    if (fieldName === 'validationStatus') {
      return this.firstVersion?.validationStatus !== this.currentVersion?.validationStatus;
    }
    return this.differences.some(d => d.fieldName === fieldName);
  }

  // Obtenir le libellé du champ pour l'affichage
  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'position': 'Position',
      'technicianName': 'Technicien',
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

  // Obtenir la valeur d'un champ
  getFieldValue(item: any, fieldName: string): any {
    if (!item) return '-';
    return item[fieldName] || '-';
  }
}
