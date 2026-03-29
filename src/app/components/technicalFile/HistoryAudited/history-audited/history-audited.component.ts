// history-audited.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TechnicalFileService } from '../../../../../services/technical-file.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-history-audited',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history-audited.component.html',
  styleUrls: ['./history-audited.component.css']
})
export class HistoryAuditedComponent implements OnInit {
  itemId!: number;
  history: any[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private service: TechnicalFileService
  ) {}

  ngOnInit(): void {
  const itemIdParam = this.route.snapshot.paramMap.get('itemId');
  const technicalFileIdParam = this.route.snapshot.paramMap.get('id');

  if (itemIdParam) {
    // Historique pour un item
    this.itemId = Number(itemIdParam);
    this.service.getItemAuditedHistory(this.itemId).subscribe({
      next: (data) => {
        this.history = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur récupération historique audité item', err);
        this.loading = false;
      }
    });
  } else if (technicalFileIdParam) {
    // Historique pour un dossier
    const technicalFileId = Number(technicalFileIdParam);
    this.service.getFullHistoryAudited(technicalFileId).subscribe({
      next: (data) => {
        this.history = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur récupération historique audité dossier', err);
        this.loading = false;
      }
    });
  } else {
    console.error('Aucun ID défini !');
    this.loading = false;
  }
}
  // Dans history-audited.component.ts
getRevisionTypeClass(type: string): string {
  switch(type) {
    case 'ADD': return 'badge-add';
    case 'MOD': return 'badge-mod';
    case 'DEL': return 'badge-del';
    default: return '';
  }
}
}
