// all-versions.component.ts
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
    this.router.navigate(['/technical-files/items', this.itemId, 'detail']);
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (value === 'OK') return '✅ OK';
    if (value === 'NOK') return '❌ NOK';
    if (value === true || value === 'true') return '✅ Oui';
    if (value === false || value === 'false') return '❌ Non';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

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
}
